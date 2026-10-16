// An idea handed to the IDE is set beside today's blueprint, once.
//
// While someone explores an idea with the bot, a build handed to the IDE with
// `uno-prototype` means the idea has a concrete flow. The turn runs the
// service-change gate on the idea, and when the idea changes how a matched
// path works today, the reply carries a short comparison: today's steps as `step (lane)`, the idea's own
// words, and a link into the blueprint app. Once per thread per scenario, and
// nothing is written. (A PRD staged on its card gets the Check it offer
// instead: `blueprint-check-offer-turn.test.ts`.)
//
// The seam is the whole turn: the real agent loop on a scripted model, the
// real gate on a scripted judgment, and the in-memory thread store.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { fakeProvider, type FakeProvider } from "../src/agent/providers/fake";
import { milestoneComparison, serviceChangeGate, type PathToday } from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import { createInMemoryThreadState, type ThreadState } from "../src/thread-state/index";
import type { ScriptedReply } from "../src/agent/providers/fake";
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


function world(opts: { replies: ScriptedReply[]; judgments: string[]; threadState?: ThreadState; affordable?: boolean; unreadable?: boolean }) {
  const threadState = opts.threadState ?? createInMemoryThreadState();
  const gateModel: FakeProvider = fakeProvider({ generateReplies: opts.judgments });
  const searched: string[] = [];
  const pathReads: string[] = [];
  const h = harness({ replies: opts.replies, threadState });
  h.deps.milestoneComparison = milestoneComparison({
    gate: serviceChangeGate({
      provider: gateModel,
      search: async (q) => {
        searched.push(q);
        return MATCH;
      },
    }),
    readPath: async (cellId) => {
      pathReads.push(cellId);
      return opts.unreadable ? null : TODAY;
    },
    firstInThread: (ref, scenario) => threadState.claimComparison(ref, scenario),
    affordable: () => opts.affordable ?? true,
  });
  return { h, gateModel, searched, pathReads };
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

test("an uno-prototype hand-off that changes a path today carries the comparison in the reply", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(w.h.delivery.posted.length, 1, "one reply, comparison inside it");
  const reply = w.h.delivery.posted[0]!;
  assert.match(reply, /Run in the IDE: uno-prototype/);
  assert.match(reply, /Call off a session \(Tutor\) → Find a fill-in \(Supervisor\)/);
  assert.match(reply, /\[Call-off › Standard\]\(https:\/\/blueprint\.example\/\?cell=cell-1\)/);
  assert.equal(outcome.comparison?.cellId, "cell-2");
});

test("a hand-off that does not change the service gets nothing beside it", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [NOT_A_SERVICE_CHANGE] });
  const outcome = await runTurn(request({ text: "hand the button token update to the IDE" }), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 1, "the gate was asked");
  assert.deepEqual(w.searched, [], "a non-service idea is never searched");
  assert.equal(outcome.comparison, undefined);
  assert.doesNotMatch(w.h.delivery.posted.join("\n"), /Call off a session \(Tutor\)/);
});

test("a second milestone on the same scenario in the thread shows nothing; the first one stands", async () => {
  const threadState = createInMemoryThreadState();
  const first = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], threadState });
  await runTurn(request({ text: "build the call-off board from the PRD" }), first.h.deps);
  assert.ok(first.h.delivery.posted.some((p) => /Call-off › Standard/.test(p)));

  const second = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], threadState });
  const outcome = await runTurn(request({ text: "now hand it to the IDE", userMsgTs: "1700000000.000300" }), second.h.deps);

  assert.equal(outcome.comparison, undefined);
  assert.doesNotMatch(second.h.delivery.posted.join("\n"), /Call off a session \(Tutor\)/);
  assert.equal(second.gateModel.generated.length, 1, "a repeat still asks the gate which scenario it is");
});

test("a milestone whose path could not be read leaves the scenario's one comparison for the next", async () => {
  const threadState = createInMemoryThreadState();
  const failed = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], threadState, unreadable: true });
  const first = await runTurn(request({ text: "build the call-off board from the PRD" }), failed.h.deps);
  assert.equal(first.comparison, undefined);

  const next = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], threadState });
  const outcome = await runTurn(request({ text: "now hand it to the IDE", userMsgTs: "1700000000.000300" }), next.h.deps);
  assert.equal(outcome.comparison?.scenario, "Call-off", "the failed read did not use up the offer");
  assert.match(next.h.delivery.posted.join("\n"), /Call off a session \(Tutor\)/);
});

test("the same scenario in another thread is compared again", async () => {
  const threadState = createInMemoryThreadState();
  const first = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], threadState });
  await runTurn(request({ text: "build the call-off board from the PRD" }), first.h.deps);

  const other = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], threadState });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD", conversationTs: "1700000000.900000" }), other.h.deps);
  assert.equal(outcome.comparison?.scenario, "Call-off");
});

test("an answer that is no milestone never asks the gate", async () => {
  const w = world({
    replies: [{ text: "Today a call-off goes to the supervisor, who finds a fill-in in Slack." }],
    judgments: [SERVICE_CHANGE],
  });
  const outcome = await runTurn(request(), w.h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 0);
  assert.equal(outcome.comparison, undefined);
});

test("a reply that only mentions uno-prototype, before any PRD exists, is no hand-off", async () => {
  const w = world({
    replies: [{ text: "A build needs a PRD before uno-prototype can take it, so let's draft that first. What should the board do?" }],
    judgments: [SERVICE_CHANGE],
  });
  await runTurn(request({ text: "build me a call-off board" }), w.h.deps);
  assert.equal(w.gateModel.generated.length, 0);
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
});

test("a turn without the budget left for it shows nothing and spends nothing", async () => {
  const w = world({ replies: [{ text: HAND_OFF }], judgments: [SERVICE_CHANGE], affordable: false });
  const outcome = await runTurn(request({ text: "build the call-off board from the PRD" }), w.h.deps);
  assert.equal(outcome.disposition, "answered");
  assert.equal(w.gateModel.generated.length, 0);
  assert.equal(outcome.comparison, undefined);
});
