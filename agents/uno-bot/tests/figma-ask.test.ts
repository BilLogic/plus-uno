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
import { FigmaRateLimitError, type FigmaComment } from "../src/figma/client";
import { runFigmaEventJob } from "../src/figma-notify/job";
import { readFigmaEvent, jobOf, eventIdOf, type FigmaEventJob } from "../src/figma-notify/event";
import { answerFigmaAsk, type AskMark, type FigmaAskDeps } from "../src/figma-ask/job";
import { FIGMA_LABEL } from "../src/figma-ask/trigger";
import { CANT_FIND_LINE } from "../src/figma-ask/copy";
import { candidateThreads } from "../src/figma-comments/threads";
import { recordingDelivery, runTurn, type RecordingDelivery } from "../src/turn/index";
import { SubrequestBudgetError } from "../src/net";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness } from "./helpers/turn-harness";

const FILE = "FILEKEY1";
const DESIGN = "CDESIGN1";
const BILL = { id: "900000001", handle: "Bill" };
const SARAH = { id: "1500001", handle: "sarah" };
const STRANGER = { id: "1500999", handle: "guest" };
const NOW = Date.parse("2026-10-09T15:00:00Z");
const PRD = "https://www.notion.so/goal-setting-prd-1";

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
function queuedFor(c: FigmaComment): FigmaEventJob {
  const event = readFigmaEvent({
    event_type: "FILE_COMMENT",
    timestamp: c.created_at,
    webhook_id: "3301",
    file_key: FILE,
    file_name: "Goal Setting / Card 2482 / Meryem",
    comment: [{ text: c.message }],
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
  run(c: FigmaComment): Promise<{ outcome: string; line: string }>;
  /** Replies uno-bot posted on the file, in order. */
  replies(): Array<{ root: string; message: string }>;
}

function world(opts: { replies?: ScriptedReply[]; people?: Record<string, string>; comments?: FigmaComment[]; design?: boolean } = {}): World {
  const figma = createInMemoryFigma({ me: BILL, now: () => NOW });
  figma.seedFile(FILE, { name: "Goal Setting / Card 2482 / Meryem", comments: opts.comments ?? [], creator: SARAH });
  const h = harness({ replies: opts.replies ?? [{ text: `The bar stays hidden until the first goal is set. [Goal Setting PRD](${PRD})` }] });
  const marks = new Map<string, AskMark>();
  const leads: string[] = [];
  const cards: RecordingDelivery[] = [];
  const deps: FigmaAskDeps = {
    figma,
    people: async () => opts.people ?? { [SARAH.id]: "USARAH" },
    marks: {
      get: async (id) => marks.get(id) ?? null,
      put: async (id, mark) => void marks.set(id, mark),
    },
    threadState: h.threadState,
    answer: (request, delivery) => runTurn(request, { ...h.deps, delivery }),
    ...(opts.design === false
      ? {}
      : {
          design: {
            channel: DESIGN,
            post: async (text) => {
              leads.push(text);
              return { ts: `1760000000.00000${leads.length}` };
            },
            permalink: async (ts) => `https://plus.slack.com/archives/${DESIGN}/p${ts.replace(".", "")}`,
            cardDelivery: () => {
              const d = recordingDelivery();
              cards.push(d);
              return d;
            },
          },
        }),
    now: () => NOW,
  };
  return {
    figma,
    deps,
    marks,
    leads,
    cards,
    async run(c) {
      const result = await runFigmaEventJob(queuedFor(c), { onAsk: (job) => answerFigmaAsk(job, deps) });
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

describe("the reply", () => {
  it("leads with the label, answers in plain lines, and ends on the source, on the root comment", async () => {
    const w = world({
      replies: [{ text: `**Hidden** until the first goal is set.\n\n- It shows once a goal exists.\n\nSources: [Goal Setting PRD](${PRD})` }],
    });
    const root = comment("100", "Should the bar show before a goal?");
    await ask(w, comment("101", "@uno what does the PRD say?", { parent_id: "100", client_meta: null }), [root]);
    assert.deepEqual(w.replies(), [
      {
        root: "100",
        message: [FIGMA_LABEL, "Hidden until the first goal is set.", "It shows once a goal exists.", `Source: ${PRD}`].join("\n"),
      },
    ]);
  });

  it("keeps the answer to three lines", async () => {
    const w = world({ replies: [{ text: `One.\nTwo.\nThree.\nFour.\nFive. [PRD](${PRD})` }] });
    await ask(w, comment("100", "@uno list them"));
    const lines = w.replies()[0]!.message.split("\n");
    assert.equal(lines[0], FIGMA_LABEL);
    assert.deepEqual(lines.slice(1), ["One.", "Two.", "Three.", `Source: ${PRD}`]);
  });

  it("says it couldn't find this, pointing at #plus-design, when nothing answers it", async () => {
    const w = world({ replies: [{ text: "Probably after the first goal, I think." }] });
    await ask(w, comment("100", "@goat when does the bar show?"));
    assert.deepEqual(w.replies().map((r) => r.message), [[FIGMA_LABEL, CANT_FIND_LINE].join("\n")]);
    assert.match(CANT_FIND_LINE, /^I couldn't find this.*#plus-design/);
  });

  it("is plain text: no Slack markup reaches the file", async () => {
    const w = world({ replies: [{ text: `*Hidden* until <${PRD}|the PRD> says otherwise, per <@U123|meryem>.` }] });
    await ask(w, comment("100", "@uno bar?"));
    const message = w.replies()[0]!.message;
    assert.doesNotMatch(message, /[<>*`]/);
    assert.match(message, new RegExp(`Source: ${PRD}$`));
  });

  it("reads the ask, the file and the thread so far, and answers from #plus-design's public view", async () => {
    let seen: { text: string; channel: string; userId: string; scope: string } | null = null;
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery) => {
      seen = { text: request.attachmentsText ?? request.text, channel: request.channel, userId: request.userId, scope: request.scopeInstruction ?? "" };
      return answer(request, delivery);
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

  it("is drafted as a card in #plus-design under a lead naming who asked, and the reply links it", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno please add to the PRD: hide the bar until the first goal"));

    assert.equal(w.leads.length, 1);
    assert.match(w.leads[0]!, /^<@USARAH> asked for a change in a Figma comment on <https:\/\/www\.figma\.com\/design\/FILEKEY1\|Goal Setting \/ Card 2482 \/ Meryem>\./);
    assert.match(w.leads[0]!, /please add to the PRD: hide the bar until the first goal/);
    assert.equal(w.cards.length, 1);
    assert.equal(w.cards[0]!.stagedCards.length, 1, "one card, staged in the lead's thread");

    const link = `https://plus.slack.com/archives/${DESIGN}/p1760000000000001`;
    assert.deepEqual(w.replies().map((r) => r.message), [
      [FIGMA_LABEL, `I drafted this change for approval in #plus-design: ${link}`, "Nothing changes in the file or anywhere else until a teammate approves it there."].join("\n"),
    ]);
  });

  it("writes nothing from Figma: the card waits in #plus-design's thread, and Figma gets only the reply", async () => {
    const w = world({ replies: STAGES });
    await ask(w, comment("100", "@uno add it to the PRD"));
    assert.deepEqual(w.figma.writes().map((c) => c.method), ["replyToComment"]);
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
    assert.match(w.replies()[0]!.message, /^🐐 le goat \(uno-bot\) · AI-generated\nI draft changes only for teammates/);
  });

  it("a stranger is answered from public facts only, and told the turn so", async () => {
    let scope = "";
    const w = world();
    const answer = w.deps.answer;
    w.deps.answer = (request, delivery) => {
      scope = request.scopeInstruction ?? "";
      return answer(request, delivery);
    };
    await ask(w, comment("100", "@uno when does the bar show?", { user: STRANGER }));
    assert.match(scope, /public facts only, and propose no change/);
    assert.match(w.replies()[0]!.message, /Source: /);
  });
});

describe("the loop guards", () => {
  it("never replies to its own comment, though it is Bill's and names @uno", async () => {
    const w = world();
    const own = comment("200", `${FIGMA_LABEL}\nAsk @uno again with the card number.`, { user: BILL, parent_id: "100" });
    w.figma.seedFile(FILE, { comments: [comment("100", "a question"), own] });
    // The route does not even queue the read…
    await w.run(own);
    // …and a job that reaches the comment anyway leaves it.
    const result = await answerFigmaAsk({ fileKey: FILE, commentId: "200" }, w.deps);
    assert.equal(result.said, "uno-bot's own comment");
    assert.deepEqual(w.replies(), []);
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
        comment("101", `${FIGMA_LABEL}\nThe PRD says hidden.`, { parent_id: "100", user: BILL, client_meta: null }),
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
    w.deps.answer = (request, delivery) => {
      turns += 1;
      return answer(request, delivery);
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
});
