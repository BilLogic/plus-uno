// Check it under an IDE hand-off runs the same blueprint check a PRD's card
// gets (#1324): today's steps beside the idea's as a follow-up, then the Draw
// on blueprint card for the requester. There is no card to add notes to, so
// nothing else follows. (The check after a PRD's card:
// `blueprint-check-button.test.ts`.)
//
// The seam is the button over the turn: a real hand-off turn (the turn
// harness, its in-memory thread store) posts the offer, the Check it door
// presses it, and the job reads today's path, drafts the idea's rows on the
// real drafter and posts. What is asserted is what the thread sees and what a
// ✅ on the Draw on blueprint card would run, as the store holds it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { fakeProvider } from "../src/agent/providers/fake";
import {
  draftProposal,
  runBlueprintCheck,
  serviceChangeGate,
  serviceChangeJudgement,
  type CheckOutcome,
  type PathToday,
} from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import { createInMemoryThreadState, proposalOperations, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { runCheckItDoor } from "../src/slack/blueprint-check";
import type { RunnerJobPayload } from "../src/slack/types";
import { cardExpiresAt } from "../src/card-expiry";
import { CHANNEL, harness, request } from "./helpers/turn-harness";

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "Supervisor finds a fill-in", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Find a fill-in", matchedBy: "vector+keyword" },
];

const TODAY: PathToday = {
  pathId: "path-1",
  scenarioId: "scenario-1",
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
  quote: "A self-serve call-off board: tutors post their own call-off and the first free tutor claims it.",
});

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
const ONLY_REMOVES = JSON.stringify({
  rows: [{ change: "deprecated", step_id: "s-3", lane_id: "l-sup", content: "" }],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});

const REQUESTER = "U1";
/** Wednesday 2026-10-14, 10:00 ET. */
const NOW = Date.parse("2026-10-14T14:00:00Z");

const HAND_OFF = [
  "The ticket is filed. Here's the prompt for the build:",
  "",
  "```",
  "A self-serve call-off board: tutors post their own call-off and the first free tutor claims it.",
  "- Run in the IDE: uno-prototype",
  "- PRD: [Self-serve call-offs](https://notion.so/prd-1) · fidelity: mid-fi",
  "```",
].join("\n");

/** A thread where a hand-off turn posted its reply and the Check it offer,
 *  and the requester pressed it: what the press queued. */
async function pressed() {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const h = harness({ replies: [{ text: HAND_OFF }], threadState, now: () => NOW });
  h.deps.serviceChangeJudgement = serviceChangeJudgement({
    gate: serviceChangeGate({ provider: fakeProvider({ generateReplies: [SERVICE_CHANGE] }), search: async () => MATCH }),
    affordable: () => true,
  });
  await runTurn(request({ text: "build the call-off board from the PRD" }), h.deps);
  const at = h.delivery.calls.findIndex((c) => c.kind === "check-offer");
  assert.ok(at >= 0, "the hand-off offered the check");
  const offerTs = `offer-${at + 1}`;
  const queued: RunnerJobPayload[] = [];
  await runCheckItDoor(
    { channel: CHANNEL, offerTs, userId: REQUESTER },
    {
      store: threadState,
      enqueue: async (job) => void queued.push(job),
      replaceOffer: async () => {},
      replyEphemeral: async () => {},
      now: () => NOW,
    },
  );
  assert.deepEqual(queued.map((j) => j.kind), ["blueprint-check"], "the press queued the check");
  return { threadState, offerTs, h };
}

/** The check's world: every post, card and status edit in thread order. */
async function check(threadState: ThreadState, offerTs: string, drafts = [DRAFT]) {
  const seen: Array<{ kind: "post"; text: string } | { kind: "card"; lead: string } | { kind: "settle"; outcome: CheckOutcome }> = [];
  const draftModel = fakeProvider({ generateReplies: drafts });
  let cards = 0;
  await runBlueprintCheck(offerTs, {
    store: threadState,
    readPath: async () => TODAY,
    draft: draftProposal({ provider: draftModel, affordable: () => true }),
    post: async (_offer, text) => void seen.push({ kind: "post", text }),
    postCard: async (_offer, card) => {
      seen.push({ kind: "card", lead: card.lead ?? "" });
      return { ts: `draw-${++cards}`, text: card.lead ?? "", ttlMs: cardExpiresAt(NOW) - NOW };
    },
    recordStaged: async () => {},
    settle: async (_offer, outcome) => void seen.push({ kind: "settle", outcome }),
  });
  return { seen, draftModel };
}

async function liveCard(threadState: ThreadState, ts: string): Promise<PendingProposal> {
  const found = await threadState.getProposalByTs(ts);
  assert.equal(found.state, "found", `the card ${ts} is live`);
  return (found as Extract<typeof found, { state: "found" }>).proposal;
}

test("the hand-off's check posts today's steps beside the idea's, then the Draw on blueprint card, and nothing to add to a card", async () => {
  const { threadState, offerTs, h } = await pressed();
  const { seen, draftModel } = await check(threadState, offerTs);

  assert.deepEqual(seen.map((s) => s.kind), ["post", "card", "settle"], "results, Draw on blueprint, done — and no add-to-card action");
  const results = (seen[0] as { text: string }).text;
  assert.match(results, /\*\*Your idea changes how \[\*Call-off\*\]\(https:\/\/blueprint\.example\/\?cell=cell-1\) works today\.\*\*/);
  assert.match(results, /\*\*Find a fill-in\*\*\n- Today: Supervisor asks around in Slack \(`Supervisor`\)\n- Your idea: Free tutor claims the posted call-off \(`Tutor`\); Supervisor sees who claimed it \(`Supervisor`\)/);
  assert.deepEqual(seen[2], { kind: "settle", outcome: { kind: "done" } });
  // The idea it drafted is the hand-off's, kept with the offer.
  assert.match(draftModel.generated[0]!.prompt, /self-serve call-off board/);
  // The turn staged no card of its own; the Draw on blueprint card is the
  // thread's only one.
  assert.equal(h.delivery.stagedCards.length, 0);
});

test("the Draw on blueprint card shows which cells the idea changes and removes, and only the requester may approve it", async () => {
  const { threadState, offerTs } = await pressed();
  const { seen } = await check(threadState, offerTs);

  const lead = (seen[1] as { lead: string }).lead;
  assert.match(lead, /Changes Find a fill-in \(Supervisor\): Supervisor asks around in Slack → Supervisor sees who claimed it/);
  assert.match(lead, /No longer happens at Confirm the fill-in \(Supervisor\): Supervisor confirms by DM/);
  const draw = await liveCard(threadState, "draw-1");
  assert.deepEqual(draw.confirmers, [REQUESTER]);
  assert.equal(draw.exclusiveConfirmers, true, "the standing confirmers are not added");
  const [op] = proposalOperations(draw);
  assert.equal(op!.toolName, "blueprint_revise");
  assert.deepEqual(op!.input, {
    pathId: "path-1",
    label: "Call-off › Standard",
    rows: [
      { stepId: "s-2", laneId: "l-tutor", content: "Free tutor claims the posted call-off", from: null, to: "proposed" },
      { stepId: "s-3", laneId: "l-tutor", content: "Claiming tutor confirms on the board", from: null, to: "proposed" },
      { stepId: "s-2", laneId: "l-sup", content: "Supervisor sees who claimed it", from: null, to: "proposed" },
    ],
    variant: {
      scenarioId: "scenario-1",
      name: "build the call-off board from the PRD",
      status: "proposed",
      lanes: { "l-tutor": "Tutor", "l-sup": "Supervisor" },
    },
  });
});

test("a hand-off whose draft only removes a moment still gets today's steps and its own words, and no card", async () => {
  const { threadState, offerTs } = await pressed();
  const { seen } = await check(threadState, offerTs, [ONLY_REMOVES]);
  assert.deepEqual(seen.map((s) => s.kind), ["post", "settle"]);
  assert.match((seen[0] as { text: string }).text, /This idea: "A self-serve call-off board: tutors post their own call-off and the first free tutor claims it\."/);
});
