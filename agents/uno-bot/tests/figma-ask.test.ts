// @uno in a Figma comment (#903), at the webhook job's seam.
//
// Each case queues what the notification route queues for a FILE_COMMENT and
// runs the job on the shared in-memory Figma, the in-memory ThreadState, and
// the REAL turn behind a fake model (`tests/helpers/turn-harness.ts`). The ask
// has no way to post to Slack, so what is asserted is what a person sees in
// Figma: the reply on the comment, and what Figma was asked to write — never
// which helper ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import { FigmaRateLimitError, FigmaRequestError, type FigmaComment } from "../src/figma/client";
import { runFigmaEventJob } from "../src/figma-notify/job";
import { readFigmaEvent, jobOf, eventIdOf, type FigmaEventJob } from "../src/figma-notify/event";
import { answerFigmaAsk, MAX_ASK_TRIES, type AskMark, type FigmaAskDeps } from "../src/figma-ask/job";
import type { FigmaAskDelivery } from "../src/figma-ask/delivery";
import { isOwnComment } from "../src/figma-ask/trigger";
import { CANT_FIND_LINE, CUT_LINE, MAX_LINE_CHARS } from "../src/figma-ask/copy";
import { candidateThreads } from "../src/figma-comments/threads";
import { runTurn } from "../src/turn/index";
import { watchedTurnDeps, type CapacityOutage } from "../src/turn/capacity-outage";
import { SubrequestBudgetError } from "../src/net";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness } from "./helpers/turn-harness";
import { readGithub } from "../src/tools/github-read";
import { gapNotes, type StoredTeamRoles } from "../src/usage/index";
import { figmaAskDepsFor } from "../src/figma-ask/env";
import type { Env } from "../src/types";

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
  /** Run the job the route queues for `c`, from the payload's fragments (its text, by default). */
  run(c: FigmaComment, fragments?: unknown[]): Promise<{ outcome: string; line: string }>;
  /** What each turn was told of its asker. */
  askers: Array<{ unmappedAsker: boolean; fileKey: string }>;
  /** Replies uno-bot posted on the file, in order. */
  replies(): Array<{ root: string; message: string }>;
  /** Notes about a Team Members gap, as DMs: to whom, and what. */
  notes: Array<{ to: string; text: string }>;
  /** The clock the gap notes' marks read, epoch ms. */
  clock: { now: number };
  /** The usage rows the turns left. */
  usage: () => Array<{ disposition: string; proposalId: string | null }>;
}

function world(
  opts: {
    replies?: ScriptedReply[];
    people?: Record<string, string>;
    comments?: FigmaComment[];
    toolResultFor?: (name: string, args: Record<string, unknown>) => string;
    preflightAsk?: string;
    /** The stored Team Members map; by default Sarah is mapped, and the rows
     *  "Guest" and "Rae Ng" have no Figma User ID. */
    roster?: StoredTeamRoles | null;
    lead?: string | null;
    /** The model fails: both models, or the main one with a backup. */
    providerFailure?: { times: number; status: number; backupModel: string | null };
    /** Where a Figma ask's model runs report a capacity outage, watched as
     *  production watches them (`watchedTurnDeps`); with `testChannelIds`. */
    outage?: { outage: CapacityOutage; testChannelIds?: string[] };
  } = {},
): World {
  const figma = createInMemoryFigma({ me: BILL, now: () => NOW });
  figma.seedFile(FILE, { name: "Goal Setting / Card 2482 / Meryem", comments: opts.comments ?? [], creator: SARAH });
  const h = harness({ replies: opts.replies ?? reads(`The bar stays hidden until the first goal is set. [Goal Setting PRD](${PRD})`), toolResult: PRD_FOUND, ...(opts.toolResultFor ? { toolResultFor: opts.toolResultFor } : {}), ...(opts.preflightAsk ? { preflightAsk: opts.preflightAsk } : {}), ...(opts.providerFailure ? { providerFailure: opts.providerFailure } : {}) });
  const askers: Array<{ unmappedAsker: boolean; fileKey: string }> = [];
  const marks = new Map<string, AskMark>();
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
      const turnDeps = opts.outage
        ? watchedTurnDeps(
            { origin: "figma", channel: request.channel, testChannelIds: opts.outage.testChannelIds ?? [] },
            () => opts.outage!.outage,
            h.deps,
          )
        : h.deps;
      return runTurn(request, { ...turnDeps, delivery });
    },
    channel: DESIGN,
    gaps,
    now: () => NOW,
  };
  return {
    figma,
    deps,
    notes,
    clock,
    marks,
    askers,
    usage: () => h.usage.records(),
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
        message: ["🐐: Hidden until the first goal is set. It shows once a goal exists.", `Source: Goal Setting PRD — ${PRD}`].join("\n"),
      },
    ]);
  });

  it("keeps the answer to three lines, and says so above the source when it cut the rest", async () => {
    const w = world({ replies: reads(`One.\nTwo.\nThree.\nFour.\nFive. [PRD](${PRD})`) });
    await ask(w, comment("100", "@uno list them"));
    const lines = w.replies()[0]!.message.split("\n");
    assert.deepEqual(lines, ["🐐: One.", "Two.", "Three.", CUT_LINE, `Source: Goal Setting PRD — ${PRD}`]);
  });

  // #1565: a bulleted list counted one line per item, so a lead-in and two
  // bullets filled the reply and the rest vanished without a word.
  it("folds a list into the line that introduces it, every item kept", async () => {
    const w = world({
      replies: reads(
        `Buttons come in these styles:\n- primary\n- secondary\n- tertiary\n- success\n- danger\n\nSizes are small, medium and large. [PRD](${PRD})`,
      ),
    });
    await ask(w, comment("100", "@uno what button options are there?"));
    assert.deepEqual(w.replies()[0]!.message.split("\n"), [
      "🐐: Buttons come in these styles: primary; secondary; tertiary; success; danger.",
      "Sizes are small, medium and large. PRD",
      `Source: Goal Setting PRD — ${PRD}`,
    ]);
  });

  it("folds a list with no lead-in into one line of its own", async () => {
    const w = world({ replies: reads(`- Filled\n- Tonal\n- Outline [PRD](${PRD})`) });
    await ask(w, comment("100", "@uno fills?"));
    assert.deepEqual(w.replies()[0]!.message.split("\n"), ["🐐: Filled; Tonal; Outline PRD.", `Source: Goal Setting PRD — ${PRD}`]);
  });

  it("folds a list bulleted with asterisks too", async () => {
    const w = world({ replies: reads(`Styles:\n* primary\n* secondary\n* tertiary [PRD](${PRD})`) });
    await ask(w, comment("100", "@uno styles?"));
    assert.deepEqual(w.replies()[0]!.message.split("\n"), ["🐐: Styles: primary; secondary; tertiary PRD.", `Source: Goal Setting PRD — ${PRD}`]);
  });

  it("drops a Sources list whole, never folding its labels into the answer's list", async () => {
    const w = world({ replies: reads(`Fills:\n- filled\n- tonal\n\nSources:\n- [Goal Setting PRD](${PRD})`) });
    await ask(w, comment("100", "@uno fills?"));
    assert.deepEqual(w.replies()[0]!.message.split("\n"), ["🐐: Fills: filled; tonal.", `Source: Goal Setting PRD — ${PRD}`]);
  });

  it("introduces a list under a heading or an unpunctuated lead with a colon, and starts a new sentence after a full stop", async () => {
    const heading = world({ replies: reads(`## Options\n- filled\n- tonal [PRD](${PRD})`) });
    await ask(heading, comment("100", "@uno options?"));
    assert.equal(heading.replies()[0]!.message.split("\n")[0], "🐐: Options: filled; tonal PRD.");

    const sentence = world({ replies: reads(`Use one of these.\n- filled\n- tonal [PRD](${PRD})`) });
    await ask(sentence, comment("100", "@uno options?"));
    assert.equal(sentence.replies()[0]!.message.split("\n")[0], "🐐: Use one of these. Filled; tonal PRD.");
  });

  it("says it cut a line it shortened, and never when the answer fits", async () => {
    const long = `${"word ".repeat(80).trim()}. [PRD](${PRD})`;
    const cut = world({ replies: reads(long) });
    await ask(cut, comment("100", "@uno long?"));
    const lines = cut.replies()[0]!.message.split("\n");
    assert.equal(lines.at(-2), CUT_LINE);
    assert.ok((lines[0] ?? "").length <= MAX_LINE_CHARS + "🐐: ".length);

    const fits = world({ replies: reads(`Hidden until the first goal is set. [PRD](${PRD})`) });
    await ask(fits, comment("100", "@uno short?"));
    assert.ok(!fits.replies()[0]!.message.includes(CUT_LINE));
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
  const ANSWER_ONLY = "🐐: I can't make changes from a Figma comment, so nothing was changed.";
  const TO_SLACK = "Ask le goat in Slack, and I'll draft it there for a teammate to approve.";

  it("gets one Figma reply saying what uno-bot would do and pointing at le goat in Slack, and nothing is staged", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno please add to the PRD: hide the bar until the first goal"));
    assert.deepEqual(w.replies(), [{ root: "100", message: [ANSWER_ONLY, `To make it, I'd create this card in Notion. ${TO_SLACK}`].join("\n") }]);
    assert.deepEqual(w.figma.writes().map((c) => c.method), ["postReaction", "replyToComment"], "Figma gets only the 🐐 and the reply");
    assert.equal(await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: `figma:${FILE}:100` }), null, "no proposal staged");
  });

  it("is recorded as answered, not failed, and the thread remembers the reply's lines", async () => {
    const errors: string[] = [];
    const error = console.error;
    console.error = (...args: unknown[]) => void errors.push(args.join(" "));
    try {
      const w = world({ replies: STAGES });
      await ask(w, comment("100", "@uno please add to the PRD: hide the bar until the first goal"));
      assert.deepEqual(
        w.usage().map((r) => ({ disposition: r.disposition, proposalId: r.proposalId })),
        [{ disposition: "answered", proposalId: null }],
      );
      const remembered = (await w.deps.threadState.readHistory({ channel: DESIGN, thread: `figma:${FILE}:100` }))
        .filter((t) => t.role === "assistant")
        .map((t) => t.content);
      assert.deepEqual(remembered, [w.replies()[0]!.message.replace(/^🐐: /, "")]);

      const stranger = world({ replies: STAGES });
      await ask(stranger, comment("100", "@uno add it to the PRD", { user: STRANGER }));
      assert.deepEqual(stranger.usage().map((r) => r.disposition), ["answered"]);
    } finally {
      console.error = error;
    }
    assert.deepEqual(errors.filter((e) => /proposal card was not staged/.test(e)), [], "a deliberate refusal is no error");
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

  for (const [write, args, ask_, would] of [
    ["notion_update", { page_url: "https://www.notion.so/card-2482", append: "Sessions list newest first" }, "the live app shows sessions oldest first, newest should be first", "update this Notion page"],
    ["notion_create", { title: "Heading reads Your schedule" }, 'change the heading on this screen to "Your schedule"', "create this card in Notion"],
    ["github_issue_create", { title: "Blueprint app: phase filter drops a scenario", body: "Seen in Figma.", repo: "plus-uno-blueprint" }, "the blueprint app's phase filter drops a scenario", "file a GitHub issue"],
  ] as const) {
    it(`a change routed to ${write} is answered only: the reply names it, and nothing is staged`, async () => {
      const w = world({ replies: [{ text: "Drafting it.", toolCalls: [{ name: write, args: { ...args } }] }] });
      await ask(w, comment("100", `@uno ${ask_}`));
      assert.deepEqual(w.replies().map((r) => r.message), [[ANSWER_ONLY, `To make it, I'd ${would}. ${TO_SLACK}`].join("\n")]);
      assert.equal(await w.deps.threadState.getProposalByThread({ channel: DESIGN, thread: `figma:${FILE}:100` }), null);
    });
  }

  it("from someone not on Team Members is answered only, and pointed at #plus-design", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno add it to the PRD", { user: STRANGER }));
    assert.deepEqual(w.replies().map((r) => r.message), [`${ANSWER_ONLY} Ask in #plus-design.`]);
  });

  it("is answered once: a redelivery runs no second turn and posts no second reply", async () => {
    const w = world({ replies: STAGES });
    let turns = 0;
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery, asker) => {
      turns += 1;
      return answer(request, delivery, asker);
    };
    const c = comment("100", "@uno add it to the PRD");
    await ask(w, c);
    await w.run(c);
    await answerFigmaAsk({ fileKey: FILE, commentId: "100" }, w.deps);
    assert.equal(turns, 1);
    assert.equal(w.replies().length, 1);
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

  it("tells a teammate's turn no change is made from Figma, the write that fits naming it, and a stranger's to propose none", async () => {
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
    assert.match(teammate!, /no change is made from a Figma comment/i);
    assert.match(teammate!, /le goat in Slack/);
    assert.doesNotMatch(teammate!, /#plus-design/);
    assert.match(teammate!, /live PLUS app[^;]*frame's Roadmap card[^;]*`notion_update`[^;]*new Roadmap card \(`notion_create`\)/);
    assert.match(teammate!, /plus-uno repo[^;]*blueprint[^;]*Storybook[^;]*harness[^;]*prototypes[^;]*`github_issue_create`/);
    assert.match(teammate!, /design-system component → that repo's GitHub issue/);
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
  const BUTTON = "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/forms-and-inputs/Button/Button.jsx";
  const BUTTON_PATH = "design-system/src/components/forms-and-inputs/Button/Button.jsx";
  const STORYBOOK_BUTTON = "https://plus-uno.netlify.app/storybook/?path=/docs/components-forms-and-inputs-button-button--docs";
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
      assert.match(lines[0] ?? "", /^Source: Button\.jsx — https:\/\/github\.com\/BilLogic\/plus-uno\/blob\/[^/]+\/design-system\/src\/components\/forms-and-inputs\/Button\/Button\.jsx$/);
    });
  });

  // Failing a cited match, the file read stands behind the answer (#1563).
  it("falls back to the file read when the path the answer names is only its folder", async () => {
    const read = await readResult("BilLogic/plus-uno", BUTTON_PATH);
    const w = world({
      replies: [
        { text: "Reading the Button.", toolCalls: [{ name: "github_read", args: { path: BUTTON_PATH } }] },
        { text: "It comes in small, medium and large (`design-system/src/components/forms-and-inputs/Button`)." },
      ],
      toolResultFor: (name) => (name === "github_read" ? read : PRD_FOUND),
    });
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    assert.deepEqual(w.replies().map((r) => r.message.split("\n").at(-1)), [`Source: Storybook: Button — ${STORYBOOK_BUTTON}`]);
  });

  it("falls back to what was read, never the link cited, when the cited file is not the one read", async () => {
    const w = await answered(BUTTON, await readResult("BilLogic/plus-uno", BUTTON_PATH.replace("Button.jsx", "Button.stories.jsx")));
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    const [message] = w.replies().map((r) => r.message);
    assert.equal(message?.split("\n").at(-1), `Source: Storybook: Button — ${STORYBOOK_BUTTON}`);
    assert.ok(!message?.includes(BUTTON), "the cited link is never posted");
  });

  it("falls back to the last GitHub file read when no Storybook page was read", async () => {
    const OTHER_PATH = "src/hero.astro";
    const read = await readResult("BilLogic/plus-marketing-website", OTHER_PATH);
    const w = await answered(BUTTON, read);
    await ask(w, comment("100", "@uno what sizes does the Button component come in?"));
    const readUrl = (JSON.parse(read) as { url: string }).url;
    assert.deepEqual(w.replies().map((r) => r.message.split("\n").at(-1)), [`Source: hero.astro — ${readUrl}`]);
  });

  it("never falls back to a code-search hit or an intake issue: only a file or folder read", async () => {
    const HIT = "https://github.com/BilLogic/plus-uno/blob/3f9c2a1/src/hero.astro";
    const ISSUE = "https://github.com/BilLogic/plus-uno/issues/5";
    const search = JSON.stringify({ ok: true, repo: "BilLogic/plus-uno", search: "hero", count: 1, hits: [{ path: "src/hero.astro", url: HIT }] });
    const intake = JSON.stringify({ ok: true, count: 1, matches: [{ title: "Hero copy", url: ISSUE }] });
    const w = world({
      replies: [
        { text: "Finding it.", toolCalls: [{ name: "github_read", args: { search: "hero" } }] },
        { text: "Checking intakes.", toolCalls: [{ name: "github_intake_search", args: { keywords: "hero" } }] },
        { text: `It comes in small, medium and large. [Button.jsx](${BUTTON})` },
      ],
      toolResultFor: (name) => (name === "github_read" ? search : name === "github_intake_search" ? intake : PRD_FOUND),
    });
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

describe("a Storybook link the turn made up (#1563)", () => {
  const FILES = [
    "design-system/agent-views/components/index.md",
    "design-system/src/components/forms-and-inputs/Button/index.md",
    "design-system/src/components/forms-and-inputs/Button/Button.mdx",
    "design-system/src/components/forms-and-inputs/Button/Button.stories.jsx",
  ];
  const REAL = "https://plus-uno.netlify.app/storybook/?path=/docs/components-forms-and-inputs-button-button--docs";
  const MADE_UP = "https://plus-uno.netlify.app/storybook/?path=/docs/components-forms-button--docs";
  const read = (path: string) =>
    readGithub(
      { path },
      {
        resolveRepo: () => ({ ok: true, entry: { repo: "BilLogic/plus-uno", purpose: "design system", workflows: [] }, isDefault: true }),
        readPath: async (_t, p) => ({ path: p, kind: "file", text: "Button: primary, secondary, tertiary…" }),
        searchCode: async () => [],
      },
    );
  const turn = async (answer: string) => {
    const results = new Map(await Promise.all(FILES.map(async (f) => [f, await read(f)] as const)));
    return world({
      replies: [
        ...FILES.map((path) => ({ text: "Reading.", toolCalls: [{ name: "github_read", args: { path } }] })),
        { text: answer },
      ],
      toolResultFor: (name, args) => (name === "github_read" ? results.get(String(args.path))! : PRD_FOUND),
    });
  };

  it("answers with the real Storybook page as its source, as r768 should have", async () => {
    const w = await turn(`Buttons come in primary, secondary and tertiary styles. [Button](${MADE_UP})`);
    await ask(w, comment("100", "@le goat what button options does plus design system provide?"));
    const [message] = w.replies().map((r) => r.message);
    assert.equal(message?.split("\n").at(-1), `Source: Storybook: Button — ${REAL}`);
    assert.doesNotMatch(message ?? "", /components-forms-button--docs/);
    assert.doesNotMatch(message ?? "", new RegExp(CANT_FIND_LINE.slice(0, 20)));
  });

  it("matches a cited Storybook link to the page read only when its docs id is the same", async () => {
    const w = await turn(`Buttons come in primary, secondary and tertiary styles. [Button](${REAL})`);
    await ask(w, comment("100", "@le goat what button options does plus design system provide?"));
    assert.deepEqual(w.replies().map((r) => r.message.split("\n").at(-1)), [`Source: Storybook: Button — ${REAL}`]);
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
        comment("101", ":goat:: I can't make changes from a Figma comment, so nothing was changed.", { parent_id: "100", user: BILL, client_meta: null }),
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
    await ask(w, comment("102", "@uno and the color?", { user: RAE }));
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

describe("the ask on Env", () => {
  const PLUS_DESIGN = "C03FC8AS69K";
  const env = (vars: Partial<Env>) =>
    ({ FIGMA_ACCESS_TOKEN: "figd_test", HARNESS_KV: {}, THREAD_STATE: {}, PLUS_DESIGN_CHANNEL_ID: PLUS_DESIGN, ...vars }) as unknown as Env;

  it("holds nothing that posts to Slack: Figma, the people map, the marks, the turn and the gap notes", () => {
    const deps = figmaAskDepsFor(env({ FIGMA_ASK_CHANNEL_ID: "D0APTB20SK0" }));
    assert.ok(deps);
    assert.deepEqual(Object.keys(deps).sort(), ["answer", "channel", "figma", "gaps", "marks", "now", "people", "threadState"]);
  });

  it("runs the turn as #plus-design, whatever FIGMA_ASK_CHANNEL_ID names", () => {
    assert.equal(figmaAskDepsFor(env({ FIGMA_ASK_CHANNEL_ID: "D0APTB20SK0" }))?.channel, PLUS_DESIGN);
    assert.equal(figmaAskDepsFor(env({ PLUS_DESIGN_CHANNEL_ID: " " }))?.channel, undefined);
  });
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

describe("both models out of capacity", () => {
  const OVERLOADED = "I'm overloaded right now and couldn't answer. Try again in a few minutes.";
  const BOTH_FAIL = { times: 2, status: 429, backupModel: "fake-backup" };

  function recording() {
    const calls: string[] = [];
    return {
      calls,
      outage: {
        failed: async () => void calls.push("failed"),
        succeeded: async () => void calls.push("succeeded"),
      } satisfies CapacityOutage,
    };
  }

  it("the asker gets one reply in Figma with the plain overloaded line, once per comment", async () => {
    const w = world({ providerFailure: BOTH_FAIL });
    const c = comment("100", "@uno when does the progress bar show?");
    await ask(w, c);
    assert.equal(w.replies().length, 1);
    assert.ok(w.replies()[0]!.message.includes(OVERLOADED), w.replies()[0]!.message);
    assert.ok(w.replies()[0]!.message.includes("🐐"), "labeled as uno-bot's");
    // Figma redelivers, the runner retries: the mark keeps it to one reply.
    await w.run(c);
    assert.equal(w.replies().length, 1);
  });

  it("counts toward the outage like a Slack turn", async () => {
    const r = recording();
    const w = world({ providerFailure: BOTH_FAIL, outage: { outage: r.outage } });
    await ask(w, comment("100", "@uno when does the progress bar show?"));
    assert.deepEqual(r.calls, ["failed"]);
  });

  it("a main model out of capacity with a backup that answers is a plain answer, and a success", async () => {
    const r = recording();
    const w = world({ providerFailure: { times: 1, status: 429, backupModel: "fake-backup" }, outage: { outage: r.outage } });
    await ask(w, comment("100", "@uno when does the progress bar show?"));
    assert.equal(w.replies().length, 1);
    assert.ok(!w.replies()[0]!.message.includes("overloaded"), w.replies()[0]!.message);
    assert.deepEqual(r.calls, ["succeeded"]);
  });

  it("a failure that is not capacity keeps the ordinary failed reply", async () => {
    const w = world({ providerFailure: { times: 2, status: 400, backupModel: "fake-backup" } });
    await ask(w, comment("100", "@uno when does the progress bar show?"));
    assert.equal(w.replies().length, 1);
    assert.ok(!w.replies()[0]!.message.includes("overloaded"), w.replies()[0]!.message);
  });

  it("test traffic neither counts nor closes an outage", async () => {
    const r = recording();
    const w = world({ providerFailure: BOTH_FAIL, outage: { outage: r.outage, testChannelIds: [DESIGN] } });
    await ask(w, comment("100", "@uno when does the progress bar show?"));
    assert.deepEqual(r.calls, []);
  });
});
