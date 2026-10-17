// A staged PRD's card posts first; a Check it offer may follow it (#1321).
//
// The card goes up with no blueprint work in front of it. Then, in the same
// turn, the quick service-change judgement runs on the idea: when the idea
// touches today's blueprint the bot offers to check it — the scenario named,
// a few minutes, the card reviewable meanwhile — with a Check it button and
// the shared deadline. When it does not, or the judgement fails, nothing more
// is posted. The path read, the drafted rows and the comparison are the
// check's, never the turn's.
//
// The seam is the whole turn: the real agent loop on a scripted model, the
// real gate on a scripted judgement, and the in-memory thread store.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { fakeProvider, type FakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import type { ModelPrompt, ModelProvider, ModelText } from "../src/agent/model-provider";
import { serviceChangeGate, serviceChangeJudgement } from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import { createInMemoryThreadState, type ThreadState } from "../src/thread-state/index";
import { cardExpiresAt } from "../src/card-expiry";
import { harness, request } from "./helpers/turn-harness";

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "Supervisor finds a fill-in", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Find a fill-in", matchedBy: "vector+keyword" },
];

const SERVICE_CHANGE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor finds a fill-in after a call-off",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
});
const NOT_A_SERVICE_CHANGE = JSON.stringify({ changes_service: false, confidence: 0.9, query: "", quote: "" });

const IDEA_SUMMARY = "Tutors post their own call-off and the first free tutor claims it. The supervisor only sees the result.";
/** Wednesday 2026-10-14, 10:00 ET: a weekday start, so the deadline is plain. */
const NOW = Date.parse("2026-10-14T14:00:00Z");

function world(opts: { replies: ScriptedReply[]; model?: ModelProvider; judgments?: string[]; threadState?: ThreadState; affordable?: boolean }) {
  const threadState = opts.threadState ?? createInMemoryThreadState({ now: () => NOW });
  const model = opts.model ?? fakeProvider({ generateReplies: opts.judgments ?? [] });
  // Every judgement the gate asked for, as it was asked.
  const generated: ModelPrompt[] = [];
  const gateModel = { generated };
  const searched: string[] = [];
  const h = harness({ replies: opts.replies, threadState, now: () => NOW });
  h.deps.serviceChangeJudgement = serviceChangeJudgement({
    gate: serviceChangeGate({
      provider: { ...model, generate: (prompt) => (generated.push(prompt), model.generate(prompt)) },
      search: async (q) => {
        searched.push(q);
        return MATCH;
      },
    }),
    affordable: () => opts.affordable ?? true,
  });
  return { h, gateModel, searched, threadState };
}

const stagePrd = (summary = IDEA_SUMMARY): ScriptedReply => ({
  text: "I've drafted the PRD on a card.",
  toolCalls: [
    {
      name: "notion_create",
      args: {
        surface: "prd",
        title: "Self-serve call-offs",
        summary,
        sections: [{ heading: "Open Questions", body: "Who sees a call-off nobody claims?" }],
      },
    },
  ],
});

/** What went into the thread, in order: the card, and any offer after it. */
const order = (w: ReturnType<typeof world>) =>
  w.h.delivery.calls.flatMap((c) => (c.kind === "proposal" ? ["card"] : c.kind === "check-offer" ? ["offer"] : c.kind === "note" ? ["note"] : []));

test("a PRD that touches today's blueprint posts its card, then the Check it offer", async () => {
  const w = world({ replies: [stagePrd()], judgments: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(order(w), ["card", "offer"], "the card first, with nothing in front of it");
  const offer = w.h.delivery.calls.find((c) => c.kind === "check-offer");
  assert.ok(offer?.kind === "check-offer");
  assert.equal(offer.offer.scenario, "Call-off");
  assert.equal(offer.offer.expiresAt, cardExpiresAt(NOW), "the offer's deadline is the shared rule's");
  // The judgement read the PRD's own words.
  assert.match(w.gateModel.generated[0]!.prompt, /Self-serve call-offs/);
  assert.match(w.gateModel.generated[0]!.prompt, /first free tutor claims it/);
});

test("the offer keeps what its check will need: the idea, the match, and the card it is under", async () => {
  const w = world({ replies: [stagePrd()], judgments: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);

  const offerTs = w.h.delivery.calls.flatMap((c, i) => (c.kind === "check-offer" ? [`offer-${i + 1}`] : []))[0]!;
  const kept = await w.threadState.getCheckOffer(offerTs);
  assert.ok(kept, "kept under the offer's ts");
  assert.equal(kept.cardTs, outcome.staged?.proposal.proposalTs);
  assert.equal(kept.requesterUserId, "U1");
  assert.equal(kept.milestone, "prd");
  assert.equal(kept.idea.title, "Self-serve call-offs");
  assert.match(kept.idea.text, /first free tutor claims it/);
  assert.deepEqual(
    { scenario: kept.scenario, path: kept.path, cellId: kept.cellId, quote: kept.quote, expiresAt: kept.expiresAt },
    { scenario: "Call-off", path: "Standard", cellId: "cell-2", quote: "Tutors post their own call-off and the first free tutor claims it.", expiresAt: cardExpiresAt(NOW) },
  );
});

test("a PRD that does not touch the service gets its card and nothing more", async () => {
  const w = world({
    replies: [stagePrd("Swap the Button's hover token for the new primary-hover token across the library.")],
    judgments: [NOT_A_SERVICE_CHANGE],
  });
  const outcome = await runTurn(request({ text: "write up the button token update as a PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "staged");
  assert.equal(w.gateModel.generated.length, 1, "the judgement was asked");
  assert.deepEqual(order(w), ["card"]);
});

test("a judgement that fails posts nothing more", async () => {
  const w = world({ replies: [stagePrd()], model: fakeProvider({ generateFailMessage: "HTTP 503: overloaded" }) });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(order(w), ["card"]);
});

test("a judgement with no JSON in it posts nothing more", async () => {
  const w = world({ replies: [stagePrd()], judgments: ["I think this probably changes the service."] });
  await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);
  assert.deepEqual(order(w), ["card"]);
});

test("a turn without the budget for the judgement asks nothing and offers nothing", async () => {
  const w = world({ replies: [stagePrd()], judgments: [SERVICE_CHANGE], affordable: false });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "staged");
  assert.equal(w.gateModel.generated.length, 0);
  assert.deepEqual(order(w), ["card"]);
});

/**
 * A judgement model whose output ceiling is shared with its thinking, as
 * Gemini's is: each run thinks for the next number of tokens on the list,
 * then needs `ANSWER_TOKENS` for the JSON. Past the ceiling the reply stops
 * mid-answer and says it was cut off — what made two identical ideas get
 * opposite verdicts.
 */
const ANSWER_TOKENS = 80;
function sharedCeilingModel(thinking: number[]): ModelProvider {
  const runs = [...thinking];
  const base = fakeProvider();
  return {
    ...base,
    async generate(prompt): Promise<ModelText> {
      const spent = runs.shift() ?? 0;
      const room = (prompt.maxTokens ?? Infinity) - spent;
      if (room >= ANSWER_TOKENS) return { ok: true, model: "fake-1", text: SERVICE_CHANGE };
      const kept = Math.max(0, Math.floor((SERVICE_CHANGE.length * room) / ANSWER_TOKENS));
      return { ok: true, model: "fake-1", text: SERVICE_CHANGE.slice(0, kept), cutOff: true };
    },
  };
}

test("the same idea gets the same judgement however long the model thinks first", async () => {
  // Three runs of one idea, thinking 300, 700 and 1,500 tokens before it answers.
  const model = sharedCeilingModel([300, 700, 1_500]);
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const offered: boolean[] = [];
  for (const [i, thread] of ["1700000000.100000", "1700000000.200000", "1700000000.300000"].entries()) {
    const w = world({ replies: [stagePrd()], model, threadState });
    await runTurn(request({ text: "turn this thread into a PRD", conversationTs: thread, replyTs: thread, userMsgTs: `1700000000.30000${i}` }), w.h.deps);
    offered.push(order(w).includes("offer"));
  }
  assert.deepEqual(offered, [true, true, true]);
});

test("a judgement cut off at its ceiling posts nothing more, rather than reading as no service change", async () => {
  const w = world({ replies: [stagePrd()], model: fakeProvider({ generateReplies: [SERVICE_CHANGE], generateCutOff: true }) });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(order(w), ["card"]);
  assert.deepEqual(w.searched, [], "a cut-off judgement is never searched on");
});
