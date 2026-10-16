// A build handed to the IDE gets the same Check it offer a PRD's card does (#1324).
//
// While someone explores an idea with the bot, a build handed to the IDE with
// `uno-prototype` means the idea has a concrete flow. The reply posts as the
// model wrote it, with nothing of the blueprint folded in. Then, in the same
// turn, the quick service-change judgement runs on the idea: when the idea
// touches today's blueprint the Check it offer posts under the reply, and
// what its check will need is kept under the offer — with no card, since a
// hand-off stages none. When it does not, or the judgement fails, nothing
// more is posted. (A PRD's card gets the offer too:
// `blueprint-check-offer-turn.test.ts`; the check a press runs is
// `handoff-blueprint-check.test.ts`.)
//
// The seam is the whole turn: the real agent loop on a scripted model, the
// real gate on a scripted judgement, and the in-memory thread store.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { fakeProvider, type FakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import { serviceChangeGate, serviceChangeJudgement } from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import { createInMemoryThreadState } from "../src/thread-state/index";
import { checkOfferMessage } from "../src/slack/blueprint-check";
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

/** Wednesday 2026-10-14, 10:00 ET: a weekday start, so the deadline is plain. */
const NOW = Date.parse("2026-10-14T14:00:00Z");

function world(opts: { replies: ScriptedReply[]; judgments?: string[]; gateModel?: FakeProvider; affordable?: boolean }) {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const gateModel: FakeProvider = opts.gateModel ?? fakeProvider({ generateReplies: opts.judgments ?? [] });
  const searched: string[] = [];
  const h = harness({ replies: opts.replies, threadState, now: () => NOW });
  h.deps.serviceChangeJudgement = serviceChangeJudgement({
    gate: serviceChangeGate({
      provider: gateModel,
      search: async (q) => {
        searched.push(q);
        return MATCH;
      },
    }),
    affordable: () => opts.affordable ?? true,
  });
  return { h, gateModel, searched, threadState };
}

const HAND_OFF = [
  "The ticket is filed. Here's the prompt for the build:",
  "",
  "```",
  "A self-serve call-off board: tutors post their own call-off and the first free tutor claims it.",
  "- Run in the IDE: uno-prototype",
  "- Touches: prototypes/call-off-board/",
  "- PRD: [Self-serve call-offs](https://notion.so/prd-1) · fidelity: mid-fi",
  "- Open picks: none",
  "```",
].join("\n");

/** What went into the thread, in order: the reply, and any offer after it. */
const order = (w: ReturnType<typeof world>) =>
  w.h.delivery.calls.flatMap((c) => (c.kind === "answer" ? ["reply"] : c.kind === "check-offer" ? ["offer"] : c.kind === "proposal" ? ["card"] : []));

const offerOf = (w: ReturnType<typeof world>) => {
  const at = w.h.delivery.calls.findIndex((c) => c.kind === "check-offer");
  const call = w.h.delivery.calls[at];
  return call?.kind === "check-offer" ? { ts: `offer-${at + 1}`, note: call.offer } : null;
};

test("an uno-prototype hand-off that touches today's blueprint posts its reply as written, then the Check it offer", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.deepEqual(order(w), ["reply", "offer"], "the reply first, the offer under it, and no card");
  const reply = w.h.delivery.posted[0]!;
  assert.match(reply, /Run in the IDE: uno-prototype/);
  assert.doesNotMatch(reply, /Call off a session|blueprint\.example|works today/, "no comparison folded into the reply");
  const offer = offerOf(w)!;
  assert.equal(offer.note.scenario, "Call-off");
  assert.equal(offer.note.expiresAt, cardExpiresAt(NOW), "the offer's deadline is the shared rule's");
  // The judgement read the hand-off's own words.
  assert.match(w.gateModel.generated[0]!.prompt, /first free tutor claims it/);
});

test("the hand-off's offer speaks of no card, since there is none", () => {
  const message = checkOfferMessage({ scenario: "Call-off", expiresAt: cardExpiresAt(NOW), underCard: false });
  assert.match(message.text, /This changes how \*Call-off\* works today — check it against the blueprint\? Takes a few minutes\./);
  assert.doesNotMatch(message.text, /card/);
});

test("the offer keeps what its check will need: the hand-off's idea and the match, and no card", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE] });
  await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);

  const offer = offerOf(w)!;
  assert.equal(offer.note.underCard, false);
  const kept = await w.threadState.getCheckOffer(offer.ts);
  assert.ok(kept, "kept under the offer's ts");
  assert.equal(kept.cardTs, undefined);
  assert.equal(kept.milestone, "prototype-hand-off");
  assert.equal(kept.requesterUserId, "U1");
  assert.equal(kept.idea.title, "build the call-off board from the PRD");
  assert.match(kept.idea.text, /first free tutor claims it/);
  assert.deepEqual(
    { scenario: kept.scenario, path: kept.path, cellId: kept.cellId, expiresAt: kept.expiresAt },
    { scenario: "Call-off", path: "Standard", cellId: "cell-2", expiresAt: cardExpiresAt(NOW) },
  );
});

test("the thread remembers the offer after the reply", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);
  const said = outcome.wrote.turns.filter((t) => t.role === "assistant").map((t) => t.content).join("\n");
  assert.match(said, /Run in the IDE: uno-prototype[\s\S]*offer: check Call-off against today's blueprint/);
});

test("a hand-off that does not touch the service gets its reply and nothing more", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [NOT_A_SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "hand the button token update to the IDE" }), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 1, "the judgement was asked");
  assert.deepEqual(w.searched, [], "a non-service idea is never searched");
  assert.deepEqual(order(w), ["reply"]);
});

test("a judgement that fails leaves the reply answered and offers nothing", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], gateModel: fakeProvider({ generateFailMessage: "HTTP 503: overloaded" }) });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "answered");
  assert.deepEqual(order(w), ["reply"]);
});

test("an answer that is no milestone never asks the judgement", async () => {
  const w = world({
    replies: [{ text: "Today a call-off goes to the supervisor, who finds a fill-in in Slack." }],
    judgments: [SERVICE_CHANGE],
  });
  const outcome = await runTurn(request(), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 0);
  assert.deepEqual(order(w), ["reply"]);
});

test("a reply that only mentions uno-prototype, before any PRD exists, is no hand-off", async () => {
  const w = world({
    replies: [{ text: "A build needs a PRD before uno-prototype can take it, so let's draft that first. What should the board do?" }],
    judgments: [SERVICE_CHANGE],
  });
  await runTurn(request({ text: "build me a call-off board" }), w.h.deps);
  assert.equal(w.gateModel.generated.length, 0);
  assert.deepEqual(order(w), ["reply"]);
});

test("a critique turn is no milestone, whatever its reply names", async () => {
  const w = world({
    replies: [
      { text: "Reading the critique guide.", toolCalls: [{ name: "read_reference", args: { name: "critique-a-design" } }] },
      { text: HAND_OFF },
    ],
    judgments: [SERVICE_CHANGE],
  });
  const outcome = await runTurn(request({ text: "critique this call-off board frame" }), w.h.deps);
  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 0);
  assert.deepEqual(order(w), ["reply"]);
});

test("a turn without the budget for the judgement asks nothing and offers nothing", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], affordable: false });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 0);
  assert.deepEqual(order(w), ["reply"]);
});
