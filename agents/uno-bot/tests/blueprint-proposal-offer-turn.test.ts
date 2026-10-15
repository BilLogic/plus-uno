// Under a milestone's comparison, a ✅ card offers to draft the idea on the
// blueprint as a proposal.
//
// The seam is the whole turn, as in `milestone-comparison-turn.test.ts`: the
// real agent loop on a scripted model, the real gate on a scripted judgement,
// the real drafter on a scripted draft, and the in-memory thread store. What
// is asserted is what the person sees posted and what a ✅ on the card would
// run, as the store holds it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { fakeProvider, type FakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import { draftProposal, milestoneComparison, serviceChangeGate, type PathToday } from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import { createInMemoryThreadState, proposalOperations, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { harness, request } from "./helpers/turn-harness";

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "Supervisor finds a fill-in", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Find a fill-in", matchedBy: "vector+keyword" },
];

const TODAY: PathToday = {
  pathId: "path-1",
  scenario: "Call-off",
  path: "Standard",
  status: "live",
  lanes: [
    { id: "l-tutor", name: "Tutor" },
    { id: "l-sup", name: "Supervisor" },
  ],
  steps: [
    { id: "s-1", name: "Call off a session" },
    { id: "s-2", name: "Find a fill-in" },
    { id: "s-3", name: "Confirm the fill-in" },
  ],
  cells: [
    { id: "cell-1", laneId: "l-tutor", stepId: "s-1", content: "Tutor messages the supervisor", status: "live" },
    { id: "cell-2", laneId: "l-sup", stepId: "s-2", content: "Supervisor asks around in Slack", status: "live" },
    { id: "cell-3", laneId: "l-sup", stepId: "s-3", content: "Supervisor confirms by DM", status: "live" },
  ],
  link: "https://blueprint.example/?cell=cell-1",
};

const SERVICE_CHANGE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor finds a fill-in after a call-off",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
});
const NOT_A_SERVICE_CHANGE = JSON.stringify({ changes_service: false, confidence: 0.9, query: "", quote: "" });

/** Two additions on empty slots, one change to a live cell, one deprecation. */
const DRAFT = JSON.stringify({
  rows: [
    { change: "added", step_id: "s-2", lane_id: "l-tutor", content: "Free tutor claims the posted call-off" },
    { change: "added", step_id: "s-3", lane_id: "l-tutor", content: "Claiming tutor confirms on the board" },
    { change: "changed", step_id: "s-2", lane_id: "l-sup", content: "Supervisor sees who claimed it" },
    { change: "deprecated", step_id: "s-3", lane_id: "l-sup", content: "" },
  ],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});
const ONLY_CHANGES = JSON.stringify({
  rows: [{ change: "changed", step_id: "s-2", lane_id: "l-sup", content: "Supervisor sees who claimed it" }],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});

const REQUESTER = "U1";
const IDEA_SUMMARY = "Tutors post their own call-off and the first free tutor claims it. The supervisor only sees the result.";

function world(opts: { replies: ScriptedReply[]; judgements: string[]; drafts?: string[]; threadState?: ThreadState; draftAffordable?: boolean }) {
  const threadState = opts.threadState ?? createInMemoryThreadState();
  const gateModel: FakeProvider = fakeProvider({ generateReplies: opts.judgements });
  const draftModel: FakeProvider = fakeProvider({ generateReplies: opts.drafts ?? [DRAFT] });
  const h = harness({ replies: opts.replies, threadState });
  h.deps.milestoneComparison = milestoneComparison({
    gate: serviceChangeGate({ provider: gateModel, search: async () => MATCH }),
    readPath: async () => TODAY,
    firstInThread: (ref, scenario) => threadState.claimComparison(ref, scenario),
    affordable: () => true,
  });
  h.deps.proposalDraft = draftProposal({ provider: draftModel, affordable: () => opts.draftAffordable ?? true });
  return { h, threadState, draftModel };
}

const stagePrd = (summary = IDEA_SUMMARY): ScriptedReply => ({
  text: "I've drafted the PRD on a card.",
  toolCalls: [
    {
      name: "notion_create",
      args: { surface: "prd", title: "Self-serve call-offs", summary, sections: [{ heading: "Open Questions", body: "Who sees a call-off nobody claims?" }] },
    },
  ],
});

const HAND_OFF = [
  "The ticket is filed. Here's the prompt for the build:",
  "",
  "```",
  "A self-serve call-off board: tutors post their own call-off and the first free tutor claims it.",
  "- Run in the IDE: uno-prototype",
  "- PRD: [Self-serve call-offs](https://notion.so/prd-1) · fidelity: mid-fi",
  "```",
].join("\n");

const offerCards = (h: ReturnType<typeof world>["h"]) =>
  h.delivery.stagedCards.filter((c) => /Draft this on the blueprint as a proposal\?/.test(c.lead ?? ""));

async function liveCard(threadState: ThreadState, ts: string): Promise<PendingProposal> {
  const found = await threadState.getProposalByTs(ts);
  assert.equal(found.state, "found", `the card ${ts} is live`);
  return (found as Extract<typeof found, { state: "found" }>).proposal;
}

test("a PRD that changes a path today gets the offer under its comparison, before the PRD's own card", async () => {
  const w = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);

  assert.equal(outcome.disposition, "staged");
  const order = w.h.delivery.calls.flatMap((c) =>
    c.kind === "note" ? ["comparison"] : c.kind === "proposal" ? [/as a proposal\?/.test(c.card.lead ?? "") ? "offer" : "prd"] : [],
  );
  assert.deepEqual(order, ["comparison", "offer", "prd"], "the PRD's card stays the last message, so a typed ✅ still means it");
  assert.equal(outcome.staged?.proposal.toolName, "notion_create", "the PRD's card is the turn's own card");

  const [card] = offerCards(w.h);
  assert.match(card!.lead!, /Call-off › Standard/);
  assert.match(card!.lead!, /Added Find a fill-in \(Tutor\): Free tutor claims the posted call-off/);
  assert.match(card!.lead!, /Added Confirm the fill-in \(Tutor\): Claiming tutor confirms on the board/);
  assert.match(card!.lead!, /`proposed`/);
});

test("the offer writes only additions at `proposed`, and only the requester may approve it", async () => {
  const w = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE] });
  await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);

  const ts = w.h.delivery.stagedAt[0]!;
  const offer = await liveCard(w.threadState, ts);
  assert.deepEqual(offer.confirmers, [REQUESTER]);
  assert.equal(offer.exclusiveConfirmers, true, "the standing confirmers are not added");
  const [op] = proposalOperations(offer);
  assert.equal(op!.toolName, "blueprint_revise");
  assert.deepEqual(op!.input, {
    pathId: "path-1",
    label: "Call-off › Standard",
    rows: [
      { stepId: "s-2", laneId: "l-tutor", content: "Free tutor claims the posted call-off", from: null, to: "proposed" },
      { stepId: "s-3", laneId: "l-tutor", content: "Claiming tutor confirms on the board", from: null, to: "proposed" },
    ],
  });
  // The PRD's card is still live beside it, in the thread's own slot.
  const prd = await liveCard(w.threadState, w.h.delivery.stagedAt[1]!);
  assert.equal(prd.toolName, "notion_create");
});

test("a change or removal of today's cell is left out of the proposal and named on the card", async () => {
  const w = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE] });
  await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);

  const lead = offerCards(w.h)[0]!.lead!;
  assert.match(lead, /left out the change at Find a fill-in \(Supervisor\)/);
  assert.match(lead, /left out the removal at Confirm the fill-in \(Supervisor\)/);
  assert.doesNotMatch(lead, /Supervisor sees who claimed it/);
});

test("an uno-prototype hand-off gets the offer after the reply that carries its comparison", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgements: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  const kinds = w.h.delivery.calls.map((c) => c.kind).filter((k) => k === "answer" || k === "proposal");
  assert.deepEqual(kinds, ["answer", "proposal"]);
  const offer = await liveCard(w.threadState, w.h.delivery.stagedAt[0]!);
  assert.deepEqual(offer.confirmers, [REQUESTER]);
  assert.match(offer.proposalText, /as a proposal\?/);
});

test("no comparison, no offer: a PRD that does not change the service drafts nothing", async () => {
  const w = world({ replies: [stagePrd("Swap the Button's hover token across the library.")], judgements: [NOT_A_SERVICE_CHANGE] });
  await runTurn(request({ text: "write up the button token update as a PRD" }), w.h.deps);
  assert.deepEqual(offerCards(w.h), []);
  assert.equal(w.draftModel.generated.length, 0);
});

test("a second milestone on the same scenario in the thread offers nothing again", async () => {
  const threadState = createInMemoryThreadState();
  const first = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE], threadState });
  await runTurn(request({ text: "turn this thread into a PRD" }), first.h.deps);
  assert.equal(offerCards(first.h).length, 1);

  const second = world({ replies: [{ text: HAND_OFF }], judgements: [SERVICE_CHANGE], threadState });
  await runTurn(request({ text: "now hand it to the IDE", userMsgTs: "1700000000.000300" }), second.h.deps);
  assert.deepEqual(offerCards(second.h), []);
  assert.equal(second.draftModel.generated.length, 0);
});

test("a draft that only changes today's cells is no offer", async () => {
  const w = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE], drafts: [ONLY_CHANGES] });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(offerCards(w.h), []);
  assert.equal(outcome.comparison?.scenario, "Call-off", "the comparison still stands");
});

test("the draft runs on the default tier, and not at all without the budget for it", async () => {
  const w = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE] });
  await runTurn(request({ text: "turn this thread into a PRD" }), w.h.deps);
  assert.equal(w.draftModel.generated[0]!.tier, "default");
  assert.match(w.draftModel.generated[0]!.prompt, /Self-serve call-offs/);

  const poor = world({ replies: [stagePrd()], judgements: [SERVICE_CHANGE], draftAffordable: false });
  await runTurn(request({ text: "turn this thread into a PRD" }), poor.h.deps);
  assert.equal(poor.draftModel.generated.length, 0);
  assert.deepEqual(offerCards(poor.h), []);
});
