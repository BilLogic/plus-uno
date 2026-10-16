// A thread with a Check it offer in it, for the blueprint check's button-seam
// tests (#1322): a real PRD turn on the turn harness posts the card and the
// offer, and the fixtures below are what the check's path read and drafter
// see. The press, Stop and the job are then driven by the test itself.

import assert from "node:assert/strict";

import { runTurn } from "../../src/turn/index";
import { fakeProvider, type ScriptedReply } from "../../src/agent/providers/fake";
import { serviceChangeGate, serviceChangeJudgement, type PathToday } from "../../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../../src/integrations/blueprint";
import { createInMemoryThreadState } from "../../src/thread-state/index";
import { harness, request } from "./turn-harness";

export const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "Supervisor finds a fill-in", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Find a fill-in", matchedBy: "vector+keyword" },
];

export const TODAY: PathToday = {
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
  ],
  cells: [
    { id: "cell-1", laneId: "l-tutor", stepId: "s-1", content: "Tutor messages the supervisor", status: "live" },
    { id: "cell-2", laneId: "l-sup", stepId: "s-2", content: "Supervisor asks around in Slack", status: "live" },
  ],
  link: "https://blueprint.example/?cell=cell-1",
};

const SERVICE_CHANGE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor finds a fill-in after a call-off",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
});

/** One addition on an empty slot: enough for the Draw on blueprint card. */
export const DRAFT = JSON.stringify({
  rows: [{ change: "added", step_id: "s-2", lane_id: "l-tutor", content: "Free tutor claims the posted call-off" }],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});

/** The card's requester: the person whose PRD turn it was. */
export const REQUESTER = "U1REQUESTER";
/** Wednesday 2026-10-14, 10:00 ET. */
export const NOW = Date.parse("2026-10-14T14:00:00Z");

const stagePrd: ScriptedReply = {
  text: "I've drafted the PRD on a card.",
  toolCalls: [
    {
      name: "notion_create",
      args: {
        surface: "prd",
        title: "Self-serve call-offs",
        summary: "Tutors post their own call-off and the first free tutor claims it.",
        sections: [{ heading: "Open Questions", body: "Who sees a call-off nobody claims?" }],
      },
    },
  ],
};

/** A thread where a PRD turn posted its card and the Check it offer. */
export async function offered(clock = { t: NOW }) {
  const threadState = createInMemoryThreadState({ now: () => clock.t });
  const h = harness({ replies: [stagePrd], threadState, now: () => clock.t });
  h.deps.serviceChangeJudgement = serviceChangeJudgement({
    gate: serviceChangeGate({ provider: fakeProvider({ generateReplies: [SERVICE_CHANGE] }), search: async () => MATCH }),
    affordable: () => true,
  });
  const outcome = await runTurn(request({ text: "turn this thread into a PRD", userId: REQUESTER }), h.deps);
  const at = h.delivery.calls.findIndex((c) => c.kind === "check-offer");
  assert.ok(at >= 0, "the turn offered the check");
  return { threadState, clock, offerTs: `offer-${at + 1}`, cardTs: outcome.staged!.proposal.proposalTs };
}

/** Resolve once `ready()` holds, a turn of the event loop at a time. */
export async function until(ready: () => boolean): Promise<void> {
  for (let i = 0; i < 1_000 && !ready(); i++) await new Promise((r) => setImmediate(r));
  assert.ok(ready(), "never got there");
}
