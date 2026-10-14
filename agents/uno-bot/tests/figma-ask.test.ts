// @uno in a Figma comment (#903), at the webhook job's seam.
//
// Each case queues what the notification route queues for a FILE_COMMENT and
// runs the job on the shared in-memory Figma, the in-memory ThreadState, and
// the REAL turn behind a fake model (`tests/helpers/turn-harness.ts`). A card
// reaches #plus-design through a recording Delivery. What is asserted is what a
// person sees: the reply on the comment, the card in #plus-design, and what
// Figma was asked to write — never which helper ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import { FigmaRateLimitError, FigmaRequestError, type FigmaComment } from "../src/figma/client";
import { runFigmaEventJob } from "../src/figma-notify/job";
import { readFigmaEvent, jobOf, eventIdOf, type FigmaEventJob } from "../src/figma-notify/event";
import { answerFigmaAsk, MAX_ASK_TRIES, type AskMark, type FigmaAskDeps } from "../src/figma-ask/job";
import type { FigmaAskDelivery } from "../src/figma-ask/delivery";
import { isOwnComment } from "../src/figma-ask/trigger";
import { CANT_FIND_LINE } from "../src/figma-ask/copy";
import { candidateThreads } from "../src/figma-comments/threads";
import { recordingDelivery, runTurn, type RecordingDelivery } from "../src/turn/index";
import { SubrequestBudgetError } from "../src/net";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness } from "./helpers/turn-harness";
import { readGithub } from "../src/tools/github-read";
import { gapNotes, type StoredTeamRoles } from "../src/usage/index";
import { figmaAskDepsFor } from "../src/figma-ask/env";
import { runReviewDecision } from "../src/slack/review-door";
import type { GateVerdict } from "../src/gate/gate";
import type { Env } from "../src/types";
import { recordingViews } from "./helpers/recording-slack";

const FILE = "FILEKEY1";
const DESIGN = "CDESIGN1";
const BILL = { id: "900000001", handle: "Bill" };
const SARAH = { id: "1500001", handle: "sarah" };
const STRANGER = { id: "1500999", handle: "guest" };
const NOW = Date.parse("2026-10-09T15:00:00Z");
const PRD = "https://www.notion.so/goal-setting-prd-1";
/** A lookup that returns the PRD: an answer may cite only what the turn read. */
const LOOKUP: ScriptedReply = { text: "Checking.", toolCalls: [{ name: "notion_search", args: { query: "progress bar" } }] };
const PRD_FOUND = JSON.stringify({ ok: true, count: 1, results: [{ title: "Goal Setting PRD", url: PRD }] });
/** The turn reads the PRD, then answers with `text`. */
const reads = (text: string): ScriptedReply[] => [LOOKUP, { text }];

function comment(id: string, message: string, over: Partial<FigmaComment> = {}): FigmaComment {
  return {
    id,
    file_key: FILE,
    parent_id: "",
    user: SARAH,
    created_at: "2026-10-09T14:59:00Z",
    resolved_at: null,
    message,
    client_meta: { node_id: "12:34", node_offset: { x: 0, y: 0 } },
    ...over,
  };
}

/** What the route queues for a comment, read from a payload as Figma sends it. */
function queuedFor(c: FigmaComment, fragments: unknown[] = [{ text: c.message }]): FigmaEventJob {
  const event = readFigmaEvent({
    event_type: "FILE_COMMENT",
    timestamp: c.created_at,
    webhook_id: "3301",
    file_key: FILE,
    file_name: "Goal Setting / Card 2482 / Meryem",
    comment: fragments,
    comment_id: c.id,
    parent_id: c.parent_id ?? "",
    created_at: c.created_at,
    resolved_at: "",
    triggered_by: { id: c.user.id, handle: c.user.handle },
  });
  assert.ok(event && event.type === "FILE_COMMENT");
  return jobOf(event, eventIdOf(event));
}

interface World {
  figma: InMemoryFigma;
  deps: FigmaAskDeps;
  marks: Map<string, AskMark>;
  /** Where #plus-design's lead posts landed. */
  leads: string[];
  /** The card Delivery, per lead. */
  cards: RecordingDelivery[];
  /** Run the job the route queues for `c`, from the payload's fragments (its text, by default). */
  run(c: FigmaComment, fragments?: unknown[]): Promise<{ outcome: string; line: string }>;
  /** The design owner #plus-design's lead resolves; null for none. */
  owner: { slack: string | null };
  /** What each turn was told of its asker. */
  askers: Array<{ unmappedAsker: boolean; fileKey: string }>;
  /** Replies uno-bot posted on the file, in order. */
  replies(): Array<{ root: string; message: string }>;
  /** Notes about a Team Members gap, as DMs: to whom, and what. */
  notes: Array<{ to: string; text: string }>;
  /** The clock the gap notes' marks read, epoch ms. */
  clock: { now: number };
}

function world(
  opts: {
    replies?: ScriptedReply[];
    people?: Record<string, string>;
    comments?: FigmaComment[];
    design?: boolean;
    /** Where the lead and its card post; #plus-design by default. */
    channel?: string;
    toolResultFor?: (name: string, args: Record<string, unknown>) => string;
    preflightAsk?: string;
    /** The stored Team Members map; by default Sarah is mapped, and the rows
     *  "Guest" and "Rae Ng" have no Figma User ID. */
    roster?: StoredTeamRoles | null;
    lead?: string | null;
  } = {},
): World {
  const figma = createInMemoryFigma({ me: BILL, now: () => NOW });
  figma.seedFile(FILE, { name: "Goal Setting / Card 2482 / Meryem", comments: opts.comments ?? [], creator: SARAH });
  const h = harness({ replies: opts.replies ?? reads(`The bar stays hidden until the first goal is set. [Goal Setting PRD](${PRD})`), toolResult: PRD_FOUND, ...(opts.toolResultFor ? { toolResultFor: opts.toolResultFor } : {}), ...(opts.preflightAsk ? { preflightAsk: opts.preflightAsk } : {}) });
  const askers: Array<{ unmappedAsker: boolean; fileKey: string }> = [];
  /** The card Delivery of each lead, by the lead's ts. */
  const byLead = new Map<string, RecordingDelivery>();
  const marks = new Map<string, AskMark>();
  const leads: string[] = [];
  const cards: RecordingDelivery[] = [];
  const owner: { slack: string | null } = { slack: "UOWNER" };
  const notes: Array<{ to: string; text: string }> = [];
  const clock = { now: NOW };
  /** The 30-day marks, as KV keeps them: each with its expiry. */
  const gapMarks = new Map<string, number>();
  const roster: StoredTeamRoles | null =
    opts.roster === undefined ? { at: NOW, roles: {}, figmaPeople: { [SARAH.id]: "USARAH" }, noFigmaId: ["Guest", "Rae Ng"] } : opts.roster;
  const gaps = gapNotes({
    lead: opts.lead === undefined ? "ULEAD" : opts.lead,
    read: async () => roster,
    marks: {
      has: async (key) => (gapMarks.get(key) ?? 0) > clock.now,
      put: async (key, ttlS) => void gapMarks.set(key, clock.now + ttlS * 1000),
    },
    dm: async (to, text) => {
      notes.push({ to, text });
      return { ok: true };
    },
  });
  const channel = opts.channel ?? DESIGN;
  const deps: FigmaAskDeps = {
    figma,
    people: async () => opts.people ?? { [SARAH.id]: "USARAH" },
    // Stored as KV stores it: a copy, never the object the job holds.
    marks: {
      get: async (id) => structuredClone(marks.get(id) ?? null),
      put: async (id, mark) => void marks.set(id, structuredClone(mark)),
    },
    threadState: h.threadState,
    answer: (request, delivery, asker) => {
      askers.push(asker);
      return runTurn(request, { ...h.deps, delivery });
    },
    ...(opts.design === false
      ? {}
      : {
          design: {
            channel,
            ...(channel === DESIGN || channel === "C03FC8AS69K" ? { name: "#plus-design" } : {}),
            post: async (text) => {
              leads.push(text);
              return { ts: `1760000000.00000${leads.length}` };
            },
            permalink: async (ts) => `https://plus.slack.com/archives/${channel}/p${ts.replace(".", "")}`,
            cardDelivery: (leadTs) => {
              const d = recordingDelivery();
              cards.push(d);
              byLead.set(leadTs, d);
              return d;
            },
            cardIn: async (leadTs) => byLead.get(leadTs)?.stagedAt[0] ?? null,
            designOwner: async () => owner.slack,
          },
        }),
    gaps,
    now: () => NOW,
  };
  return {
    figma,
    deps,
    notes,
    clock,
    marks,
    leads,
    cards,
    owner,
    askers,
    async run(c, fragments) {
      const result = await runFigmaEventJob(queuedFor(c, fragments), { onAsk: (job) => answerFigmaAsk(job, deps) });
      return { outcome: result.outcome, line: result.line };
    },
    replies: () =>
      figma
        .writes()
        .filter((w) => w.method === "replyToComment")
        .map((w) => ({ root: w.args[1] as string, message: w.args[2] as string })),
  };
}

/** Seed a comment after the thread's earlier ones, and run its job. */
async function ask(w: World, c: FigmaComment, earlier: FigmaComment[] = []) {
  w.figma.seedFile(FILE, { comments: [...earlier, c] });
  return w.run(c);
}

describe("which comments are asks", () => {
  const VARIANTS = ["@uno", "@unobot", "@uno-bot", "@uno bot", "@goat", "@le goat", "@le-goat", "@legoat", "@the goat"];

  for (const trigger of VARIANTS) {
    for (const spelled of [trigger, trigger.toUpperCase()]) {
      it(`${spelled} gets a reply`, async () => {
        const w = world();
        await ask(w, comment("100", `${spelled} when does the progress bar show?`));
        assert.equal(w.replies().length, 1, spelled);
      });
    }
  }

  for (const message of ["uno when does the progress bar show?", "le goat said the bar stays hidden", "the goat knows", "@unofficial copy here", "@goats", "mail pm@uno.example"]) {
    it(`"${message}" gets none, and costs Figma nothing`, async () => {
      const w = world();
      await ask(w, comment("100", message));
      assert.deepEqual(w.replies(), []);
      assert.deepEqual(w.figma.calls().map((c) => c.method), [], "no comment read for a comment with no trigger");
    });
  }
});

describe("a mention picked from Figma's list", () => {
  // Figma sends a picked person as `{ mention: <user id> }` and spells them
  // "@Name" in the comment's own `message`.
  it("fires when the comment names uno-bot", async () => {
    const w = world();
    const c = comment("100", "hey @uno bot when does the bar show?");
    w.figma.seedFile(FILE, { comments: [c] });
    await w.run(c, [{ text: "hey " }, { mention: "1999999" }, { text: " when does the bar show?" }]);
    assert.equal(w.replies().length, 1);
  });

  it("reads the comment and stays quiet when the mention is someone else", async () => {
    const w = world();
    const c = comment("100", "hey @Meryem can you check the bar?");
    w.figma.seedFile(FILE, { comments: [c] });
    const { line } = await w.run(c, [{ text: "hey " }, { mention: "1500002" }, { text: " can you check the bar?" }]);
    assert.match(line, /no @uno in it/);
    assert.deepEqual(w.replies(), []);
  });
});

describe("the reply", () => {
  it("leads with the label, answers in plain lines, and ends on the source, on the root comment", async () => {
    const w = world({
      replies: reads(`**Hidden** until the first goal is set.\n\n- It shows once a goal exists.\n\nSources: [Goal Setting PRD](${PRD})`),
    });
    const root = comment("100", "Should the bar show before a goal?");
    await ask(w, comment("101", "@uno what does the PRD say?", { parent_id: "100", client_meta: null }), [root]);
    assert.deepEqual(w.replies(), [
      {
        root: "100",
        message: ["🐐: Hidden until the first goal is set.", "It shows once a goal exists.", `Source: Goal Setting PRD — ${PRD}`].join("\n"),
      },
    ]);
  });

  it("keeps the answer to three lines", async () => {
    const w = world({ replies: reads(`One.\nTwo.\nThree.\nFour.\nFive. [PRD](${PRD})`) });
    await ask(w, comment("100", "@uno list them"));
    const lines = w.replies()[0]!.message.split("\n");
    assert.deepEqual(lines, ["🐐: One.", "Two.", "Three.", `Source: Goal Setting PRD — ${PRD}`]);
  });

  it("says it couldn't find this, pointing at #plus-design, when nothing answers it", async () => {
    const w = world({ replies: [{ text: "Probably after the first goal, I think." }] });
    await ask(w, comment("100", "@goat when does the bar show?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
    assert.match(CANT_FIND_LINE, /^I couldn't find this.*#plus-design/);
  });

  it("is plain text: no Slack markup reaches the file", async () => {
    const w = world({ replies: reads(`*Hidden* until <${PRD}|the PRD> says otherwise, per <@U123|meryem>.`) });
    await ask(w, comment("100", "@uno bar?"));
    const message = w.replies()[0]!.message;
    assert.doesNotMatch(message, /[<>*`]/);
    assert.match(message, new RegExp(`Source: Goal Setting PRD — ${PRD}$`));
  });

  it("says it couldn't find this when the turn read a page but the answer cites nothing", async () => {
    const w = world();
    // A turn whose lookup returns the PRD, and whose answer cites nothing.
    const h = harness({
      replies: [
        { text: "Checking.", toolCalls: [{ name: "notion_search", args: { query: "progress bar" } }] },
        { text: "Hidden until the first goal is set." },
      ],
      toolResult: JSON.stringify({ ok: true, count: 1, results: [{ title: "Goal Setting PRD", url: PRD }] }),
    });
    let read: string[] = [];
    w.deps.answer = async (request, delivery) => {
      const outcome = await runTurn(request, { ...h.deps, delivery });
      read = (delivery as FigmaAskDelivery).sources().map((s) => s.url);
      return outcome;
    };
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.ok(read.includes(PRD), `the turn read the PRD: ${read.join(", ")}`);
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });

  it("carries no Slack link a public thread may not: a cited permalink no public search vouched for is no source", async () => {
    const w = world({ replies: [{ text: "Hidden, per <https://plus.slack.com/archives/C0PRIV1/p1700000000000100|the thread>." }] });
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });

  it("reads the ask, the file and the thread so far, and answers from #plus-design's public view", async () => {
    let seen: { text: string; channel: string; userId: string; scope: string } | null = null;
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      seen = { text: request.attachmentsText ?? request.text, channel: request.channel, userId: request.userId, scope: request.scopeInstruction ?? "" };
      return answer(request, delivery, asker);
    };
    await ask(w, comment("101", "@le goat what does the PRD say?", { parent_id: "100", client_meta: null }), [
      comment("100", "Should the bar show before a goal?", { user: { id: "77", handle: "meryem" } }),
    ]);
    assert.ok(seen);
    const s = seen as { text: string; channel: string; userId: string; scope: string };
    assert.match(s.text, /^what does the PRD say\?/);
    assert.match(s.text, /Goal Setting \/ Card 2482 \/ Meryem/);
    assert.match(s.text, /node-id=12-34/);
    assert.match(s.text, /meryem: Should the bar show before a goal\?/);
    assert.equal(s.channel, DESIGN);
    assert.equal(s.userId, "USARAH");
    assert.match(s.scope, /one to three short sentences/);
  });
});

describe("a change request", () => {
  const STAGES: ScriptedReply[] = [
    { text: "Drafting it.", toolCalls: [{ name: "notion_create", args: { title: "Hide the progress bar until the first goal" } }] },
  ];

  it("is drafted as a card in #plus-design under a lead asking the design owner, and the reply links it", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno please add to the PRD: hide the bar until the first goal"));

    assert.equal(w.leads.length, 1);
    assert.match(
      w.leads[0]!,
      /^<@UOWNER>, <@USARAH> asked in a Figma comment on <https:\/\/www\.figma\.com\/design\/FILEKEY1\|Goal Setting \/ Card 2482 \/ Meryem>: “please add to the PRD: hide the bar until the first goal” \(<[^>]+\|comment>\)\. Can you review the draft below\?$/,
    );
    assert.equal(w.cards.length, 1);
    assert.equal(w.cards[0]!.stagedCards.length, 1, "one card, staged in the lead's thread");

    const link = `https://plus.slack.com/archives/${DESIGN}/p1760000000000001`;
    assert.deepEqual(w.replies().map((r) => r.message), [
      [`🐐: I drafted this change for approval in #plus-design: ${link}`, "Nothing changes in the file or anywhere else until a teammate approves it there."].join("\n"),
    ]);
  });

  it("leaves the Figma thread only what Figma showed; the card's words go to the lead's thread", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno please add to the PRD: hide the bar until the first goal"));
    const link = `https://plus.slack.com/archives/${DESIGN}/p1760000000000001`;
    const figmaThread = await w.deps.threadState.readHistory({ channel: DESIGN, thread: `figma:${FILE}:100` });
    assert.deepEqual(
      figmaThread.filter((t) => t.role === "assistant").map((t) => t.content),
      [[`I drafted this change for approval in #plus-design: ${link}`, "Nothing changes in the file or anywhere else until a teammate approves it there."].join("\n")],
    );
    const lead = await w.deps.threadState.readHistory({ channel: DESIGN, thread: "1760000000.000001" });
    const staged = await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: "1760000000.000001" });
    assert.deepEqual(lead.filter((t) => t.role === "assistant").map((t) => t.content), [staged!.proposalText]);
  });

  it("remembers a clarifying question as the lines Figma posted, not the whole note", async () => {
    const question = ["Which PRD should this go in?", "The goal-setting one or the onboarding one?", "Or both?", "Line four the reply cut.", "Line five the reply cut."].join("\n");
    const w = world({ replies: [...STAGES, ...STAGES], preflightAsk: question });
    await ask(w, comment("100", "@uno add it to the PRD"));
    const remembered = (await w.deps.threadState.readHistory({ channel: DESIGN, thread: `figma:${FILE}:100` }))
      .filter((t) => t.role === "assistant")
      .map((t) => t.content);
    assert.deepEqual(remembered, [["Which PRD should this go in?", "The goal-setting one or the onboarding one?", "Or both?"].join("\n")]);
  });

  it("writes nothing from Figma: the card waits in #plus-design's thread, and Figma gets only the 🐐 and the reply", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno add it to the PRD"));
    assert.deepEqual(w.figma.writes().map((c) => c.method), ["postReaction", "replyToComment"]);
    const staged = await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: "1760000000.000001" });
    assert.ok(staged, "the card is found from its thread in #plus-design");
    assert.equal(staged!.toolName, "notion_create");
    assert.equal(staged!.replyTs, "1760000000.000001");
  });

  it("from someone not on Team Members is not drafted, and the reply says so", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno add it to the PRD", { user: STRANGER }));
    assert.deepEqual(w.leads, []);
    assert.deepEqual(w.cards, []);
    assert.match(w.replies()[0]!.message, /^🐐: I draft changes only for teammates/);
  });

  it("asks the file's creator when no design owner resolves, and the asker when nobody does", async () => {
    const creator = world({ replies: STAGES, people: { [SARAH.id]: "USARAH", "1500002": "UCREATOR" } });
    creator.owner.slack = null;
    creator.figma.seedFile(FILE, { creator: { id: "1500002", handle: "meryem" } });
    await ask(creator, comment("100", "@uno add it to the PRD"));
    assert.match(creator.leads[0]!, /^<@UCREATOR>, <@USARAH> asked in a Figma comment on /);

    const nobody = world({ replies: STAGES, people: { [SARAH.id]: "USARAH" } });
    nobody.owner.slack = null;
    nobody.figma.seedFile(FILE, { creator: { id: "1500002", handle: "meryem" } });
    await ask(nobody, comment("100", "@uno add it to the PRD"));
    assert.match(nobody.leads[0]!, /^<@USARAH>, you asked in a Figma comment on .*Can you review the draft below\?$/);
  });

  it("escapes the file's title and the ask, so Slack shows them as typed", async () => {
    const w = world({ replies: STAGES });
    w.figma.seedFile(FILE, { name: "Q&A <draft>" });
    await ask(w, comment("100", "@uno add <b>this</b> & that to the PRD"));
    assert.match(w.leads[0]!, /\|Q&amp;A &lt;draft&gt;>/);
    assert.match(w.leads[0]!, /“add &lt;b&gt;this&lt;\/b&gt; &amp; that to the PRD”/);
  });

  it("says it couldn't be drafted when #plus-design is not configured, rather than claim a draft", async () => {
    const w = world({ replies: STAGES, design: false });
    await ask(w, comment("100", "@uno add it to the PRD"));
    assert.deepEqual(w.replies().map((r) => r.message), [
      ["🐐: I couldn't draft this change, so nothing was drafted or written. Ask in #plus-design."].join("\n"),
    ]);
  });

  it("never posts a second card: a stop after the card posted defers, and the retry only replies", async () => {
    const w = world({ replies: STAGES });
    const answer = w.deps.answer;
    let turns = 0;
    w.deps.answer = async (request, delivery, asker) => {
      turns += 1;
      const outcome = await answer(request, delivery, asker);
      if (turns === 1) throw new SubrequestBudgetError(38);
      return outcome;
    };
    const c = comment("100", "@uno add it to the PRD");
    assert.equal((await ask(w, c)).outcome, "deferred");
    assert.deepEqual(w.replies(), [], "a stop inside the turn defers rather than reply");
    assert.equal((await w.run(c)).outcome, "handled");
    assert.equal(turns, 1, "no second turn");
    assert.equal(w.leads.length, 1);
    assert.equal(w.cards.length, 1, "one card");
    assert.match(w.replies()[0]!.message, /I drafted this change for approval in #plus-design: https:\/\/plus\.slack\.com/);
    const staged = await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: "1760000000.000001" });
    assert.ok(staged, "the card's record still moved to its thread");
  });

  it("a stranger is answered from public facts only, and told the turn so", async () => {
    let scope = "";
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      scope = request.scopeInstruction ?? "";
      return answer(request, delivery, asker);
    };
    await ask(w, comment("100", "@uno when does the bar show?", { user: STRANGER }));
    assert.match(scope, /public facts only, and propose no change/);
    assert.match(w.replies()[0]!.message, /Source: /);
  });

  it("the thread remembers only what was posted, and an unmapped asker's turn starts with none of a teammate's", async () => {
    const said = ["One: the bar is hidden.", "Two: it shows after a goal.", "Three: it animates.", "Four: the copy is draft.", "Five: salary bands are next."];
    const w = world({ replies: [...reads(`${said.join("\n")} [Goal Setting PRD](${PRD})`), LOOKUP, { text: `Nothing else. [Goal Setting PRD](${PRD})` }] });
    const histories: string[][] = [];
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      histories.push((request.history ?? []).map((t) => t.content));
      return answer(request, delivery, asker);
    };
    const root = comment("100", "@uno when does the bar show?");
    await ask(w, root);
    const remembered = (await w.deps.threadState.readHistory({ channel: DESIGN, thread: `figma:${FILE}:100` })).filter((t) => t.role === "assistant").map((t) => t.content).join("\n");
    assert.match(remembered, /One: the bar is hidden/);
    assert.doesNotMatch(remembered, /Four|Five|salary/);

    await ask(w, comment("101", "@uno what else?", { parent_id: "100", user: STRANGER, client_meta: null }), [root]);
    assert.deepEqual(histories[1], [], "the unmapped asker's turn reads no teammate turn");
  });

  it("a teammate's change to the screen stages one proposal from the write the turn calls, and the reply links its card", async () => {
    const w = world({
      replies: [
        { text: "Drafting it.", toolCalls: [{ name: "notion_update", args: { page_url: "https://www.notion.so/card-2482", append: "Heading: Your schedule" } }] },
      ],
    });
    await ask(w, comment("100", '@uno change the heading on this screen to "Your schedule"'));
    assert.equal(w.leads.length, 1);
    assert.equal(w.cards.length, 1);
    assert.equal(w.cards[0]!.stagedCards.length, 1);
    const staged = await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: "1760000000.000001" });
    assert.equal(staged!.toolName, "notion_update");
    assert.match(w.replies()[0]!.message, /^🐐: I drafted this change for approval in #plus-design: https:\/\/plus\.slack\.com/);
  });

  for (const [write, args, ask_] of [
    ["notion_update", { page_url: "https://www.notion.so/card-2482", append: "Sessions list newest first" }, "the live app shows sessions oldest first, newest should be first"],
    ["notion_create", { title: "Heading reads Your schedule" }, 'change the heading on this screen to "Your schedule"'],
    ["github_issue_create", { title: "Blueprint app: phase filter drops a scenario", body: "Seen in Figma.", repo: "plus-uno-blueprint" }, "the blueprint app's phase filter drops a scenario"],
  ] as const) {
    it(`a change routed to ${write} stages one card and the reply links it`, async () => {
      const w = world({ replies: [{ text: "Drafting it.", toolCalls: [{ name: write, args: { ...args } }] }] });
      await ask(w, comment("100", `@uno ${ask_}`));
      assert.equal(w.cards.length, 1);
      assert.equal(w.cards[0]!.stagedCards.length, 1);
      const staged = await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: "1760000000.000001" });
      assert.equal(staged!.toolName, write);
      assert.match(w.replies()[0]!.message, /I drafted this change for approval in #plus-design: https:\/\/plus\.slack\.com/);
    });
  }

  it("tells a teammate's turn to propose a change with the write that fits, and a stranger's to propose none", async () => {
    const scopes: string[] = [];
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      scopes.push(request.scopeInstruction ?? "");
      return answer(request, delivery, asker);
    };
    await ask(w, comment("100", "@uno the built screen lists sessions oldest first"));
    await ask(w, comment("200", "@uno the built screen lists sessions oldest first", { user: STRANGER }));
    const [teammate, stranger] = scopes;
    assert.match(teammate!, /change they ask for[^.]*is a proposal[^.]*intake/i);
    assert.match(teammate!, /live PLUS app[^;]*frame's Roadmap card[^;]*`notion_update`[^;]*new Roadmap card \(`notion_create`\)/);
    assert.match(teammate!, /plus-uno repo[^;]*blueprint[^;]*Storybook[^;]*harness[^;]*prototypes[^;]*`github_issue_create`/);
    assert.match(teammate!, /component[^.]*`component_implement`/);
    assert.doesNotMatch(teammate!, /built product/);
    assert.doesNotMatch(teammate!, /nothing is written/i);
    assert.match(stranger!, /propose no change/);
    assert.doesNotMatch(stranger!, /notion_update|github_issue_create/);
  });

  it("routes a bug in the live PLUS app to the Roadmap intake, never to a GitHub issue", async () => {
    const scopes: string[] = [];
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      scopes.push(request.scopeInstruction ?? "");
      return answer(request, delivery, asker);
    };
    await ask(w, comment("100", "@uno bug: the live app lists sessions oldest first"));
    // Each route is one clause, ended by a semicolon or a sentence end.
    const routes = scopes[0]!.split(/;|\.\s/);
    const appBug = routes.filter((r) => /live PLUS app/.test(r));
    assert.equal(appBug.length, 1, "one route names the live PLUS app");
    assert.match(appBug[0]!, /`notion_update`|`notion_create`/);
    assert.doesNotMatch(appBug[0]!, /github_issue_create/);
    const github = routes.filter((r) => /github_issue_create/.test(r));
    assert.ok(github.every((r) => !/live PLUS app|\bbug\b/.test(r)), "the GitHub route claims no live-app bug");
  });

  it("an unmapped asker's turn runs with the narrower tools, and a teammate's does not", async () => {
    const w = world();
    await ask(w, comment("100", "@uno when does the bar show?", { user: STRANGER }));
    await ask(w, comment("200", "@uno and the ring?"));
    assert.deepEqual(w.askers, [{ unmappedAsker: true, fileKey: FILE }, { unmappedAsker: false, fileKey: FILE }]);
  });
});

describe("the loop guards", () => {
  it("never replies to its own comment, though it is Bill's and names @uno", async () => {
    const w = world();
    const own = comment("200", "🐐: Ask @uno again with the card number.", { user: BILL, parent_id: "100" });
    w.figma.seedFile(FILE, { comments: [comment("100", "a question"), own] });
    // The route does not even queue the read…
    await w.run(own);
    // …and a job that reaches the comment anyway leaves it.
    const result = await answerFigmaAsk({ fileKey: FILE, commentId: "200" }, w.deps);
    assert.equal(result.said, "uno-bot's own comment");
    assert.deepEqual(w.replies(), []);
  });

  it("knows its own comment as Figma reads it back, the label as the :goat: shortcode", async () => {
    const w = world();
    const own = comment("200", ":goat:: Ask @uno again with the card number.", { user: BILL, parent_id: "100" });
    w.figma.seedFile(FILE, { comments: [comment("100", "a question"), own] });
    await w.run(own);
    const result = await answerFigmaAsk({ fileKey: FILE, commentId: "200" }, w.deps);
    assert.equal(result.said, "uno-bot's own comment");
    assert.deepEqual(w.replies(), []);
  });

  it("still knows a reply read back with the label on a line of its own", async () => {
    const w = world();
    const own = comment("200", ":goat:\nAsk @uno again with the card number.", { user: BILL, parent_id: "100" });
    w.figma.seedFile(FILE, { comments: [comment("100", "a question"), own] });
    await w.run(own);
    const result = await answerFigmaAsk({ fileKey: FILE, commentId: "200" }, w.deps);
    assert.equal(result.said, "uno-bot's own comment");
    assert.deepEqual(w.replies(), []);
    assert.equal(isOwnComment(":goat: le goat (uno-bot) · AI-generated\nhi"), true, "the old label read back");
  });

  it("the end-of-day decision read leaves a reply read back with the shortcode label to this path", () => {
    const window = { watermark: 0, from: 0, until: Date.parse("2026-10-10T00:00:00Z") };
    const threads = candidateThreads(
      [comment("100", "@uno should we hide the bar?"), comment("101", ":goat:\nThe PRD says hidden.", { parent_id: "100", user: BILL, client_meta: null })],
      window,
    );
    assert.deepEqual(threads, [], "no reply but uno-bot's own, so no thread to read");
  });

  it("still knows a reply it wrote under the old label", async () => {
    const w = world();
    const own = comment("200", "🐐 le goat (uno-bot) · AI-generated\nAsk @uno again with the card number.", { user: BILL, parent_id: "100" });
    w.figma.seedFile(FILE, { comments: [comment("100", "a question"), own] });
    await w.run(own);
    const result = await answerFigmaAsk({ fileKey: FILE, commentId: "200" }, w.deps);
    assert.equal(result.said, "uno-bot's own comment");
    assert.deepEqual(w.replies(), []);
  });

  it("reads a comment that only opens with 🐐 as a teammate's ask", async () => {
    const w = world();
    await ask(w, comment("100", "🐐 @uno when does the bar show?"));
    assert.equal(w.replies().length, 1);
  });

  it("reads a comment Figma hands back opening :goat: as a teammate's ask", async () => {
    const w = world();
    await ask(w, comment("100", ":goat: @uno when does the bar show?"));
    assert.equal(w.replies().length, 1);
  });

  it("answers Bill himself: the label decides, not the author", async () => {
    const w = world();
    await ask(w, comment("100", "@uno when does the bar show?", { user: BILL }));
    assert.equal(w.replies().length, 1);
  });

  it("never replies twice to one comment", async () => {
    const w = world();
    const c = comment("100", "@uno when does the bar show?");
    await ask(w, c);
    await w.run(c);
    await answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps);
    assert.equal(w.replies().length, 1);
  });

  it("the end-of-day decision read leaves the asks and uno-bot's replies to this path", () => {
    const window = { watermark: 0, from: 0, until: Date.parse("2026-10-10T00:00:00Z") };
    const threads = candidateThreads(
      [
        comment("100", "@uno should we hide the bar until the first goal?"),
        comment("101", ":goat:: The PRD says hidden.", { parent_id: "100", user: BILL, client_meta: null }),
        comment("102", "Agreed, hidden it is.", { parent_id: "100", client_meta: null }),
        comment("110", "@goat what spacing is this?"),
      ],
      window,
    );
    assert.deepEqual(
      threads.map((t) => ({ root: t.root.id, rootRead: t.rootRead, replies: t.replies.map((r) => r.id) })),
      [{ root: "100", rootRead: false, replies: ["102"] }],
    );
  });
});

describe("the budget", () => {
  it("defers a stop before the turn, and answers once on the retry", async () => {
    const w = world();
    w.figma.failNext("comments", new SubrequestBudgetError(38));
    const c = comment("100", "@uno when does the bar show?");
    const first = await ask(w, c);
    assert.equal(first.outcome, "deferred");
    assert.deepEqual(w.replies(), []);
    const second = await w.run(c);
    assert.equal(second.outcome, "handled");
    assert.equal(w.replies().length, 1);
  });

  it("defers a reply Figma's rate limit refused, and posts the drafted reply without a second turn", async () => {
    let turns = 0;
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      turns += 1;
      return answer(request, delivery, asker);
    };
    w.figma.failNext("replyToComment", new FigmaRateLimitError("Figma comment reply 429", 30_000));
    const c = comment("100", "@uno when does the bar show?");
    assert.equal((await ask(w, c)).outcome, "deferred");
    assert.equal((await w.run(c)).outcome, "handled");
    assert.equal(turns, 1);
    assert.equal(w.replies().length, 1);
  });

  it("defers when the people map is stopped by the budget, rather than answer as a stranger", async () => {
    const w = world();
    w.deps.people = async () => {
      throw new SubrequestBudgetError(38);
    };
    assert.equal((await ask(w, comment("100", "@uno add it to the PRD"))).outcome, "deferred");
    assert.deepEqual(w.replies(), []);
  });

  it(`gives up after ${MAX_ASK_TRIES} stopped tries: says so on the comment, and lets the job go`, async () => {
    const w = world();
    w.deps.people = async () => {
      throw new SubrequestBudgetError(38);
    };
    const c = comment("100", "@uno when does the bar show?");
    const outcomes = [(await ask(w, c)).outcome];
    for (let i = 1; i < MAX_ASK_TRIES; i++) outcomes.push((await w.run(c)).outcome);
    assert.deepEqual(outcomes, [...Array(MAX_ASK_TRIES - 1).fill("deferred"), "handled"]);
    assert.equal(MAX_ASK_TRIES, 5);
    assert.deepEqual(w.replies().map((r) => r.message), [["🐐: I couldn't answer this just now. Ask in #plus-design."].join("\n")]);
    assert.equal((await w.run(c)).line.includes("already replied"), true, "and is never tried again");
  });
});

describe("a frame's title in the reply", () => {
  it("reads as typed: the turn's link markup leaves no backslash in Figma", async () => {
    const OTHER = "https://www.figma.com/design/FILEKEY1?node-id=56-78";
    const w = world({
      replies: [
        { text: "Reading the frame.", toolCalls: [{ name: "source_read", args: { url: OTHER } }] },
        { text: `It is hidden until the first goal, per [the frame](${OTHER}).` },
      ],
      toolResultFor: (name) => (name === "source_read" ? JSON.stringify({ ok: true, title: "Bar [v2] <draft>", url: OTHER }) : PRD_FOUND),
    });
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(w.replies().map((r) => r.message), [
      ["🐐: It is hidden until the first goal, per Bar [v2] <draft>.", `Source: Bar [v2] <draft> — ${OTHER}`].join("\n"),
    ]);
  });
});

describe("the source must have been read", () => {
  const FRAME = "https://www.figma.com/design/FILEKEY1?node-id=12-34";

  it("an answer citing a link no lookup of the turn returned says it couldn't find this", async () => {
    const w = world({ replies: [{ text: `Hidden until the first goal is set. [Goal Setting PRD](${PRD})` }] });
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });

  it("the frame asked on is no source, though the turn read it", async () => {
    const w = world({
      replies: [
        { text: "Reading the frame.", toolCalls: [{ name: "source_read", args: { url: FRAME } }] },
        { text: `Hidden, as [the frame](${FRAME}) shows.` },
      ],
      toolResultFor: (name) => (name === "source_read" ? JSON.stringify({ ok: true, title: "Progress bar", url: FRAME }) : PRD_FOUND),
    });
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });
});

describe("a GitHub file the turn read directly", () => {
  const BUTTON = "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/actions/Button/Button.jsx";
  const BUTTON_PATH = "design-system/src/components/actions/Button/Button.jsx";
  // What github_read itself returns for the read: the real tool, on fake GitHub.
  const readResult = (repo: string, path: string, ref?: string) =>
    readGithub(
      { path, ...(ref ? { ref } : {}) },
      {
        resolveRepo: () => ({ ok: true, entry: { repo, purpose: "design system", workflows: [] }, isDefault: true }),
        readPath: async (_t, p) => ({ path: p, kind: "file", text: "export const SIZES = ['small', 'medium', 'large'];" }),
        searchCode: async () => [],
      },
    );
  const answered = async (cites: string, read: string) =>
    world({
      replies: [
        { text: "Reading the Button.", toolCalls: [{ name: "github_read", args: { path: BUTTON_PATH } }] },
        { text: `It comes in small, medium and large. [Button.jsx](${cites})` },
      ],
      toolResultFor: (name) => (name === "github_read" ? read : PRD_FOUND),
    });

  it("posts the answer with that file as its Source", async () => {
    const w = await answered(BUTTON, await readResult("BilLogic/plus-uno", BUTTON_PATH));
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    assert.deepEqual(w.replies().map((r) => r.message), [
      ["🐐: It comes in small, medium and large. Button.jsx", `Source: Button.jsx — ${BUTTON}`].join("\n"),
    ]);
  });

  it("matches a cited link with a line anchor, or on another ref, to the file read", async () => {
    for (const cited of [`${BUTTON}#L12`, BUTTON.replace("/blob/main/", "/blob/3f9c2a1/")]) {
      const w = await answered(cited, await readResult("BilLogic/plus-uno", BUTTON_PATH, "main"));
      await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
      assert.deepEqual(w.replies().map((r) => r.message.split("\n").at(-1)), [`Source: Button.jsx — ${cited}`], cited);
    }
  });

  it("posts the answer with the file read as its Source when the answer names it by its repo path", async () => {
    const read = await readResult("BilLogic/plus-uno", BUTTON_PATH);
    const w = world({
      replies: [
        { text: "Reading the Button.", toolCalls: [{ name: "github_read", args: { path: BUTTON_PATH } }] },
        { text: `It comes in small, medium and large (\`${BUTTON_PATH}\`).` },
      ],
      toolResultFor: (name) => (name === "github_read" ? read : PRD_FOUND),
    });
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    const readUrl = (JSON.parse(read) as { url: string }).url;
    assert.deepEqual(w.replies().map((r) => r.message.split("\n").at(-1)), [`Source: Button.jsx — ${readUrl}`]);
  });

  describe("after a code search that found it", () => {
    const HIT = BUTTON.replace("/blob/main/", "/blob/3f9c2a1/");
    const searched = () =>
      readGithub(
        { search: "Button sizes" },
        {
          resolveRepo: () => ({ ok: true, entry: { repo: "BilLogic/plus-uno", purpose: "design system", workflows: [] }, isDefault: true }),
          readPath: async () => {
            throw new Error("no path read in search mode");
          },
          searchCode: async () => [{ path: BUTTON_PATH, url: HIT }],
        },
      );
    const searchedThenRead = async (answer: (readUrl: string) => string) => {
      const [search, read] = await Promise.all([searched(), readResult("BilLogic/plus-uno", BUTTON_PATH)]);
      const readUrl = (JSON.parse(read) as { url: string }).url;
      const w = world({
        replies: [
          { text: "Finding the Button.", toolCalls: [{ name: "github_read", args: { search: "Button sizes" } }] },
          { text: "Reading the Button.", toolCalls: [{ name: "github_read", args: { path: BUTTON_PATH } }] },
          { text: answer(readUrl) },
        ],
        toolResultFor: (name, args) => (name === "github_read" ? (args.search ? search : read) : PRD_FOUND),
      });
      await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
      return { readUrl, lines: w.replies().map((r) => r.message.split("\n").at(-1)) };
    };

    it("names the file by its last segment when the answer links the file read", async () => {
      const { readUrl, lines } = await searchedThenRead((url) => `It comes in small, medium and large. [Button.jsx](${url})`);
      assert.deepEqual(lines, [`Source: Button.jsx — ${readUrl}`]);
    });

    it("names the file by its last segment when the answer writes out its repo path", async () => {
      const { lines } = await searchedThenRead(() => `It comes in small, medium and large (\`${BUTTON_PATH}\`).`);
      assert.equal(lines.length, 1);
      assert.match(lines[0] ?? "", /^Source: Button\.jsx — https:\/\/github\.com\/BilLogic\/plus-uno\/blob\/[^/]+\/design-system\/src\/components\/actions\/Button\/Button\.jsx$/);
    });
  });

  it("says it couldn't find this when the path the answer names is only the folder of the file read", async () => {
    const read = await readResult("BilLogic/plus-uno", BUTTON_PATH);
    const w = world({
      replies: [
        { text: "Reading the Button.", toolCalls: [{ name: "github_read", args: { path: BUTTON_PATH } }] },
        { text: "It comes in small, medium and large (`design-system/src/components/actions/Button`)." },
      ],
      toolResultFor: (name) => (name === "github_read" ? read : PRD_FOUND),
    });
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });

  it("says it couldn't find this when the cited file is not the one read", async () => {
    const w = await answered(BUTTON, await readResult("BilLogic/plus-uno", BUTTON_PATH.replace("Button.jsx", "Button.stories.jsx")));
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });

  it("says it couldn't find this when the same path was read in another repo", async () => {
    const w = await answered(BUTTON, await readResult("BilLogic/other-repo", BUTTON_PATH));
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });

  it("says it couldn't find this when the read was refused as a private repo", async () => {
    const refused = JSON.stringify({ ok: false, error: "that repo is private, so it is not read for an answer posted outside Slack" });
    const w = await answered(BUTTON, refused);
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    assert.deepEqual(w.replies().map((r) => r.message), [`🐐: ${CANT_FIND_LINE}`]);
  });
});

describe("a try stopped while the card was posting", () => {
  const STAGES: ScriptedReply[] = [
    { text: "Drafting it.", toolCalls: [{ name: "notion_create", args: { title: "Hide the progress bar until the first goal" } }] },
  ];

  /** A world whose marks refuse, once, the first write that `when` matches. */
  function stoppedAt(when: (mark: AskMark) => boolean): World {
    const w = world({ replies: STAGES });
    const put = w.deps.marks.put;
    let stopped = false;
    w.deps.marks.put = async (id, mark) => {
      if (!stopped && when(mark)) {
        stopped = true;
        throw new SubrequestBudgetError(38);
      }
      return put(id, mark);
    };
    return w;
  }

  it("links the card when it did post, and posts no second one", async () => {
    const w = stoppedAt((m) => m.state !== "replied" && !!m.card);
    const c = comment("100", "@uno add it to the PRD");
    assert.equal((await ask(w, c)).outcome, "deferred");
    assert.equal((await w.run(c)).outcome, "handled");
    assert.equal(w.leads.length, 1);
    assert.equal(w.cards.length, 1, "one card");
    assert.deepEqual(w.replies().map((r) => r.message), [
      [
        `🐐: I drafted this change for approval in #plus-design: https://plus.slack.com/archives/${DESIGN}/p1760000000000001`,
        "Nothing changes in the file or anywhere else until a teammate approves it there.",
      ].join("\n"),
    ]);
  });

  it("says it couldn't draft the change when the card never posted, and posts none", async () => {
    const w = stoppedAt((m) => m.state !== "replied" && !!m.lead);
    const c = comment("100", "@uno add it to the PRD");
    assert.equal((await ask(w, c)).outcome, "deferred");
    assert.equal((await w.run(c)).outcome, "handled");
    assert.equal(w.cards.length, 0);
    assert.deepEqual(w.replies().map((r) => r.message), [
      ["🐐: I couldn't draft this change, so nothing was drafted or written. Ask in #plus-design."].join("\n"),
    ]);
  });
});

describe("a reply on its way", () => {
  it("is marked replying before it posts, so a Worker killed after it posted never posts it twice", async () => {
    const w = world();
    const put = w.deps.marks.put;
    let killed = false;
    w.deps.marks.put = async (id, mark) => {
      if (!killed && mark.state === "replied") {
        killed = true;
        throw new Error("the isolate was killed");
      }
      return put(id, mark);
    };
    const c = comment("100", "@uno when does the bar show?");
    w.figma.seedFile(FILE, { comments: [c] });
    await assert.rejects(answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps), /killed/);
    assert.equal(w.marks.get("100")?.state, "replying");
    assert.equal(w.replies().length, 1);

    const retry = await answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps);
    assert.equal(retry.said, "the reply was already on the comment");
    assert.equal(w.replies().length, 1, "no second reply");
    assert.equal(w.marks.get("100")?.state, "replied");
  });

  it("knows its reply on the comment when Figma stored it escaped", async () => {
    const reply = ["🐐: Tutors \\& teachers see the bar <after> the first goal."].join("\n");
    const w = world();
    w.marks.set("100", { state: "replying", tries: 0, reply, at: NOW });
    w.figma.seedFile(FILE, {
      comments: [
        comment("100", "@uno when does the bar show?"),
        comment("101", [":goat:: Tutors &amp; teachers see the bar &lt;after&gt; the first goal."].join("\n"), { parent_id: "100", user: BILL, client_meta: null }),
      ],
    });
    const retry = await answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps);
    assert.equal(retry.said, "the reply was already on the comment");
    assert.equal(w.replies().length, 0, "no second reply");
  });

  it("posts on the retry when the thread does not hold it", async () => {
    let turns = 0;
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      turns += 1;
      return answer(request, delivery, asker);
    };
    w.figma.failNext("replyToComment", new Error("socket closed"));
    const c = comment("100", "@uno when does the bar show?");
    w.figma.seedFile(FILE, { comments: [c] });
    await assert.rejects(answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps), /socket closed/);
    assert.equal(w.marks.get("100")?.state, "replying");
    assert.deepEqual(w.replies(), []);

    await answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps);
    assert.equal(w.replies().length, 1);
    assert.equal(turns, 1, "the drafted reply, not a second turn");
  });
});

describe("the decision read and the asks", () => {
  it("still reads an ask in a resolved thread: the resolved decision reaches the night's read", () => {
    const window = { watermark: 0, from: 0, until: Date.parse("2026-10-10T00:00:00Z") };
    const threads = candidateThreads(
      [
        comment("100", "@uno we decided: hide the bar until the first goal. Add it to the PRD.", { resolved_at: "2026-10-09T16:00:00Z" }),
        comment("101", ":goat:: I drafted this change for approval in #plus-design.", { parent_id: "100", user: BILL, client_meta: null }),
        comment("102", "@goat agreed, hidden it is.", { parent_id: "100", client_meta: null }),
      ],
      window,
    );
    assert.deepEqual(
      threads.map((t) => ({ root: t.root.id, rootRead: t.rootRead, replies: t.replies.map((r) => r.id) })),
      [{ root: "100", rootRead: true, replies: ["102"] }],
    );
  });
});

describe("a Team Members gap the ask ran into", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  /** A commenter whose handle is a Team Members name with no Figma User ID. */
  const RAE = { id: "1500777", handle: "rae ng" };

  it("an asker whose handle names a row with no Figma User ID gets the lead one note, naming them and the column", async () => {
    const w = world();
    await ask(w, comment("100", "@uno when does the bar show?", { user: RAE }));
    assert.equal(w.replies().length, 1, "the asker still gets their answer");
    assert.equal(w.notes.length, 1);
    assert.equal(w.notes[0]!.to, "ULEAD");
    assert.match(w.notes[0]!.text, /Rae Ng/);
    assert.match(w.notes[0]!.text, /Figma User ID/);
    assert.doesNotMatch(w.notes[0]!.text, new RegExp(`${RAE.id}|${FILE}|bar`), "no ids, no file, no words of the ask");
  });

  it("the same person asking again within 30 days is not noted again; after 30 days they are", async () => {
    const w = world();
    await ask(w, comment("100", "@uno when does the bar show?", { user: RAE }));
    w.clock.now = NOW + 29 * DAY_MS;
    await ask(w, comment("101", "@uno and the label?", { user: RAE }));
    assert.equal(w.notes.length, 1);
    w.clock.now = NOW + 31 * DAY_MS;
    await ask(w, comment("102", "@uno and the colour?", { user: RAE }));
    assert.equal(w.notes.length, 2);
  });

  it("an unmapped asker whose handle names no row gets no note", async () => {
    const w = world();
    await ask(w, comment("100", "@uno when does the bar show?", { user: { id: "1500998", handle: "visitor" } }));
    assert.equal(w.replies().length, 1);
    assert.deepEqual(w.notes, []);
  });

  it("a mapped asker gets no note", async () => {
    const w = world({ roster: { at: NOW, roles: {}, figmaPeople: { [SARAH.id]: "USARAH" }, noFigmaId: ["sarah"] } });
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(w.notes, []);
  });

  it("with LEAD_USER_ID unset, nobody is noted", async () => {
    const w = world({ lead: null });
    await ask(w, comment("100", "@uno when does the bar show?", { user: RAE }));
    assert.equal(w.replies().length, 1);
    assert.deepEqual(w.notes, []);
  });
});

describe("where a change request's card posts", () => {
  const PLUS_DESIGN = "C03FC8AS69K";
  const LE_GOAT_DM = "D0APTB20SK0";
  const BILL_SLACK = "U03FYQJRQHX";
  const STAGES: ScriptedReply[] = [
    { text: "Drafting it.", toolCalls: [{ name: "notion_create", args: { title: "Hide the progress bar until the first goal" } }] },
  ];
  const env = (vars: Partial<Env>) =>
    ({ FIGMA_ACCESS_TOKEN: "figd_test", HARNESS_KV: {}, THREAD_STATE: {}, PLUS_DESIGN_CHANNEL_ID: PLUS_DESIGN, ...vars }) as unknown as Env;

  it("is the setting's channel when it names one, and #plus-design when it is blank or unset", () => {
    const dm = figmaAskDepsFor(env({ FIGMA_ASK_CHANNEL_ID: LE_GOAT_DM }))?.design;
    assert.deepEqual([dm?.channel, dm?.name], [LE_GOAT_DM, undefined], "a DM is not named in the reply");
    for (const vars of [{ FIGMA_ASK_CHANNEL_ID: "  " }, {}]) {
      const design = figmaAskDepsFor(env(vars))?.design;
      assert.deepEqual([design?.channel, design?.name], [PLUS_DESIGN, "#plus-design"]);
    }
  });

  for (const [where, channel, drafted] of [
    ["#plus-design", PLUS_DESIGN, "I drafted this change for approval in #plus-design"],
    ["the le goat DM", LE_GOAT_DM, "I drafted this change for approval"],
  ] as const) {
    it(`posts the lead and card in ${where}, the reply links it there, and Approve there runs the write`, async () => {
      const w = world({ replies: STAGES, channel });
      await ask(w, comment("100", "@uno please add to the PRD: hide the bar until the first goal"));

      assert.equal(w.leads.length, 1);
      assert.match(w.leads[0]!, /^<@UOWNER>, <@USARAH> asked in a Figma comment on /);
      assert.equal(w.cards[0]!.stagedCards.length, 1);
      const link = `https://plus.slack.com/archives/${channel}/p1760000000000001`;
      assert.deepEqual(
        w.replies().map((r) => r.message),
        [[`🐐: ${drafted}: ${link}`, "Nothing changes in the file or anywhere else until a teammate approves it there."].join("\n")],
        "the reply names only the channel the card is in, and links it there",
      );

      const staged = await w.deps.threadState.getProposalByThread({ channel, thread: "1760000000.000001" });
      assert.ok(staged, "the card is found from its thread where it posted");
      assert.equal(staged!.channel, channel);

      const ran: GateVerdict[] = [];
      const redrawn: string[] = [];
      await runReviewDecision(
        { viewId: "V1", channel, messageTs: staged!.proposalTs, userId: BILL_SLACK, decision: "confirm" },
        {
          threadState: w.deps.threadState,
          standingConfirmers: [BILL_SLACK],
          views: recordingViews({ alreadyOpen: ["V1"] }).client,
          delivery: () => recordingDelivery(),
          applyVerdict: async (v) => {
            ran.push(v);
            return [{ toolName: v.execute?.toolName ?? "", ok: true, result: "{}", message: "Created." }];
          },
          updateCard: async (at) => void redrawn.push(at),
          restage: async () => {},
          revise: async () => {},
        },
      );
      assert.equal(ran.length, 1);
      assert.equal(ran[0]!.execute?.toolName, "notion_create", "Approve runs the drafted write");
      assert.deepEqual(redrawn, [channel], "the card is redrawn where it posted");
    });
  }
});

describe("the 🐐 on an ask", () => {
  const reactions = (w: World) =>
    w.figma
      .writes()
      .filter((x) => x.method === "postReaction")
      .map((x) => ({ comment: x.args[1] as string, emoji: x.args[2] as string }));

  it("reacts to the ask it picked up, sent as :goat:, before the reply lands", async () => {
    const w = world();
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(reactions(w), [{ comment: "100", emoji: ":goat:" }]);
    assert.deepEqual(w.figma.writes().map((x) => x.method), ["postReaction", "replyToComment"]);
  });

  it("reacts to a reply that asks, not to its root", async () => {
    const w = world();
    const root = comment("100", "Should the bar show before a goal?");
    await ask(w, comment("101", "@goat what does the PRD say?", { parent_id: "100", client_meta: null }), [root]);
    assert.deepEqual(reactions(w), [{ comment: "101", emoji: ":goat:" }]);
  });

  it("never reacts to its own comment, read back as :goat:, nor to one that asks nothing", async () => {
    const w = world();
    await ask(w, comment("100", ":goat:: The PRD says hidden. @uno", { user: BILL }));
    await ask(w, comment("102", "hey @Meryem can you check the bar?"));
    assert.deepEqual(reactions(w), []);
  });

  it("reacts once, though the ask is retried", async () => {
    const w = world();
    w.figma.failNext("replyToComment", new FigmaRateLimitError("Figma comment reply 429", 30_000));
    const c = comment("100", "@uno when does the bar show?");
    assert.equal((await ask(w, c)).outcome, "deferred");
    assert.equal((await w.run(c)).outcome, "handled");
    assert.equal(reactions(w).length, 1);
    assert.equal(w.replies().length, 1);
  });

  it("still replies when Figma refuses the reaction", async () => {
    const w = world();
    w.figma.failNext("postReaction", new FigmaRequestError(400, "Figma comment reaction 400: Invalid emoji"));
    await ask(w, comment("100", "@uno when does the bar show?"));
    assert.deepEqual(reactions(w), []);
    assert.equal(w.replies().length, 1);
  });
});

describe("Figma's reactions, as the fake keeps them", () => {
  it("refuses the emoji character and takes the shortcode, as Figma does", async () => {
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { comments: [comment("100", "Should the bar show?")] });
    await assert.rejects(figma.postReaction(FILE, "100", "🐐"), (err: unknown) => err instanceof FigmaRequestError && err.status === 400);
    await figma.postReaction(FILE, "100", ":goat:");
    assert.deepEqual((await figma.reactions(FILE, "100")).reactions, [{ emoji: ":goat:", user: { id: "1000000001", handle: "token owner" } }]);
  });
});
