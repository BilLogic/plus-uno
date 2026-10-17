// The proposal drafter on its own: what it asks the model for, and what it
// says when a reply draws no cell. Live, every offer came back empty with one
// log line that could not tell a cut-off reply from an idea needing a step
// the path does not have; these pin the room the reply gets and the reason
// each empty draft is logged with.

import { test } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { DRAFT_MAX_TOKENS, draftProposal, draftRevision, PROPOSAL_SYSTEM, type PathToday } from "../src/blueprint-upkeep/index";
import type { Comparison } from "../src/blueprint-upkeep/milestone";
import { MAX_TOKENS as TURN_MAX_TOKENS } from "../src/agent/loop-policy";

const TODAY: PathToday = {
  pathId: "path-1",
  scenarioId: "scenario-1",
  scenario: "Session Reflection",
  path: "Filed in one sitting",
  status: "live",
  lanes: [{ id: "l-tutor", name: "Regular Tutor" }],
  steps: [
    { id: "s-open", name: "Open the form" },
    { id: "s-submit", name: "Submit" },
  ],
  cells: [
    { id: "cell-1", laneId: "l-tutor", stepId: "s-open", content: "Tutor opens the reflection form", status: "live" },
    { id: "cell-2", laneId: "l-tutor", stepId: "s-submit", content: "Tutor submits the form", status: "live" },
  ],
};

const COMPARISON = { scenario: TODAY.scenario, today: TODAY } as unknown as Comparison;
const IDEA = { title: "Two-line session recap", text: "After every session the tutor writes a two-line recap." };

const reply = (o: Record<string, unknown>) => JSON.stringify({ rows: [], new_steps_or_lanes: [], confidence: 0.7, gaps: [], ...o });

async function draftWith(text: string, opts: { cutOff?: boolean } = {}) {
  const model = fakeProvider({ generateReplies: [text], ...(opts.cutOff ? { generateCutOff: true } : {}) });
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => void lines.push(args.map(String).join(" "));
  try {
    const draft = await draftProposal({ provider: model, affordable: () => true })(COMPARISON, IDEA);
    return { draft, lines, asked: model.generated };
  } finally {
    console.log = original;
  }
}

test("the drafter leaves room for the model's thinking and the JSON after it", async () => {
  const { asked } = await draftWith(reply({ rows: [{ change: "changed", step_id: "s-open", lane_id: "l-tutor", content: "Tutor writes a two-line recap" }] }));
  assert.equal(asked[0]!.maxTokens, DRAFT_MAX_TOKENS);
  // Thinking spends the same ceiling as the answer: 2,000 left a medium-level
  // model cut off mid-JSON, and live on r671 8,000 was cut off too. A turn's
  // own ceiling, sized for the same all-thinking risk, is the floor here.
  assert.ok(DRAFT_MAX_TOKENS >= TURN_MAX_TOKENS);
});

test("a shipped-work revision is asked with the same ceiling", async () => {
  const model = fakeProvider({ generateReplies: [reply({})] });
  await draftRevision(model, { title: "t", text: "x", today: TODAY, target: "live" });
  assert.equal(model.generated[0]!.maxTokens, DRAFT_MAX_TOKENS);
});

test("a reply cut off at the ceiling is logged as cut off, and is a draft that did not finish", async () => {
  const { draft, lines } = await draftWith('{"rows":[{"change":"added","step_id":"s-op', { cutOff: true });
  assert.equal(draft, "unfinished");
  assert.ok(lines.some((l) => /\[proposal\] Session Reflection: no offer — the reply stopped at the output ceiling/.test(l)), lines.join("\n"));
});

test("an idea that only needs a step the path does not have is logged with that step", async () => {
  const { draft, lines } = await draftWith(reply({ new_steps_or_lanes: ["Write a two-line recap (step)"] }));
  assert.equal(draft, "nothing-to-draw");
  assert.ok(lines.some((l) => /no offer — it needs only steps or lanes the path does not have: Write a two-line recap \(step\)/.test(l)), lines.join("\n"));
});

test("an idea that only removes moments is logged as such", async () => {
  const { draft, lines } = await draftWith(reply({ rows: [{ change: "deprecated", step_id: "s-submit", lane_id: "l-tutor", content: "" }] }));
  assert.equal(draft, "nothing-to-draw");
  assert.ok(lines.some((l) => /no offer — it only removes moments/.test(l)), lines.join("\n"));
});

test("a reply with no JSON in it is logged as unreadable", async () => {
  const { draft, lines } = await draftWith("I think the tutor would write a recap.");
  assert.equal(draft, "unfinished");
  assert.ok(lines.some((l) => /no offer — the reply held no rows to read/.test(l)), lines.join("\n"));
});

test("a moment with no step of its own is drawn at the nearest step, with the missing step named", async () => {
  assert.match(PROPOSAL_SYSTEM, /nearest/);
  const { draft } = await draftWith(
    reply({
      rows: [{ change: "changed", step_id: "s-submit", lane_id: "l-tutor", content: "Tutor writes a two-line recap, then submits" }],
      new_steps_or_lanes: ["Write a two-line recap (step)"],
    }),
  );
  assert.ok(typeof draft === "object", "the offer stands");
  assert.equal(draft.changes.length, 1);
  assert.ok(draft.gaps.some((g) => /Write a two-line recap/.test(g)));
});

test("a model that fails is a draft that did not finish", async () => {
  const model = fakeProvider({ generateFailMessage: "HTTP 503: overloaded" });
  const draft = await draftProposal({ provider: model, affordable: () => true })(COMPARISON, IDEA);
  assert.equal(draft, "unfinished");
});
