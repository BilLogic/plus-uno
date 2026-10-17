// The proposal drafter on its own: what it asks the model for, and what it
// says when a reply draws no cell. Live, every offer came back empty with one
// log line that could not tell a cut-off reply from an idea needing a step
// the path does not have; these pin the room the reply gets and the reason
// each empty draft is logged with.

import { test } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { DRAFT_MAX_TOKENS, draftProposal, draftRevision, PROPOSAL_MAX_TOKENS, PROPOSAL_SYSTEM, type PathToday } from "../src/blueprint-upkeep/index";
import type { Comparison } from "../src/blueprint-upkeep/milestone";
import { MAX_TOKENS as TURN_MAX_TOKENS } from "../src/agent/loop-policy";
import { logsOf } from "./helpers/console-capture";

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

async function draftWith(text: string, opts: { cutOff?: boolean; thinking?: number; comparison?: Comparison } = {}) {
  const model = fakeProvider({
    generateReplies: [text],
    ...(opts.cutOff ? { generateCutOff: true } : {}),
    ...(opts.thinking !== undefined ? { generateThinkingTokens: opts.thinking } : {}),
  });
  const { value: draft, lines } = await logsOf(() => draftProposal({ provider: model, affordable: () => true })(opts.comparison ?? COMPARISON, IDEA));
  return { draft, lines, asked: model.generated };
}

const RECAP = reply({ rows: [{ change: "changed", step_id: "s-open", lane_id: "l-tutor", content: "Tutor writes a two-line recap" }] });

test("the drafter leaves room for the model's thinking and the JSON after it: a turn's own ceiling", async () => {
  const { asked } = await draftWith(RECAP);
  assert.equal(asked[0]!.maxTokens, PROPOSAL_MAX_TOKENS);
  // Thinking spends the same ceiling as the answer, and 8,000 left a
  // medium-level proposal draft cut off: a turn's ceiling, sized for the
  // same all-thinking risk, is what it gets.
  assert.equal(PROPOSAL_MAX_TOKENS, TURN_MAX_TOKENS);
});

test("a shipped-work revision keeps its own, smaller ceiling", async () => {
  const model = fakeProvider({ generateReplies: [reply({})] });
  await draftRevision(model, { title: "t", text: "x", today: TODAY, target: "live" });
  assert.equal(model.generated[0]!.maxTokens, DRAFT_MAX_TOKENS);
  assert.equal(DRAFT_MAX_TOKENS, 8_000);
});

test("each draft logs what its thinking spent of the ceiling, drawn or cut off", async () => {
  const drawn = await draftWith(RECAP, { thinking: 3_100 });
  assert.ok(typeof drawn.draft === "object");
  assert.ok(drawn.lines.some((l) => l === `[proposal] Session Reflection: drafted (thinking 3100 of ${PROPOSAL_MAX_TOKENS})`), drawn.lines.join("\n"));

  const cut = await draftWith('{"rows":[', { cutOff: true, thinking: 16_300 });
  assert.ok(cut.lines.some((l) => l.endsWith(`the reply stopped at the output ceiling (thinking 16300 of ${PROPOSAL_MAX_TOKENS})`)), cut.lines.join("\n"));

  const { value: _draft, lines } = await logsOf(() =>
    draftRevision(fakeProvider({ generateReplies: [reply({})], generateCutOff: true, generateThinkingTokens: 7_990 }), { title: "t", text: "x", today: TODAY, target: "live" }),
  );
  assert.ok(lines.some((l) => l.endsWith(`the reply stopped at the output ceiling (thinking 7990 of ${DRAFT_MAX_TOKENS})`)), lines.join("\n"));
});

test("rows that are all off the path's grid are a draft that did not finish", async () => {
  const { draft, lines } = await draftWith(reply({ rows: [{ change: "added", step_id: "s-invented", lane_id: "l-nobody", content: "Tutor writes a recap" }] }));
  assert.equal(draft, "unfinished");
  assert.ok(lines.some((l) => /no offer — every row it drew was on a step or lane the path does not have/.test(l)), lines.join("\n"));
});

test("rows on the grid none of which can be written are a draft that did not finish", async () => {
  // A change of no kind the draft knows, on a real step and lane, writes nothing.
  const { draft, lines } = await draftWith(reply({ rows: [{ change: "moved", step_id: "s-submit", lane_id: "l-tutor", content: "Tutor submits later" }] }));
  assert.equal(draft, "unfinished");
  assert.ok(lines.some((l) => /no offer — no row it drew could be written/.test(l)), lines.join("\n"));
});

test("a path read without its scenario asks the model nothing, and says why", async () => {
  const { scenarioId: _id, ...today } = TODAY;
  const { draft, lines, asked } = await draftWith(RECAP, { comparison: { scenario: TODAY.scenario, today } as unknown as Comparison });
  assert.equal(draft, "no-scenario");
  assert.equal(asked.length, 0);
  assert.ok(lines.some((l) => /no offer — today's path was read without its scenario/.test(l)), lines.join("\n"));
});

test("an idea with no rows and nothing missing draws nothing", async () => {
  const { draft, lines } = await draftWith(reply({}));
  assert.equal(draft, "nothing-to-draw");
  assert.ok(lines.some((l) => /no offer — the reply drew no rows/.test(l)), lines.join("\n"));
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
