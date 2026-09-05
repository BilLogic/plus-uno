// How a sampled eval case is scored.
//
// #249: `samples: N` used to require EVERY run to pass. That is the opposite of
// what sampling normally buys, and the arithmetic is not subtle — with a
// per-run flake probability p, a 1-sample case fails at p and a 3-sample case
// at 1-(1-p)^3, roughly 3p. The fixture ran 13 cases at 3 samples with 17 of 20
// marked blocker, so at a 1% judge-flake rate the job was red about 37% of the
// time with nothing wrong. Observed: 1 of 3 runs green, a DIFFERENT case
// failing each time.
//
// It is now a majority. These tests pin both the rule and the reason.
import { test } from "node:test";
import assert from "node:assert/strict";
import { passesCase, argMatches, toolCallMatches, describeCalls } from "./eval-scoring.mjs";

test("a single sample still passes on its own run", () => {
  assert.equal(passesCase(1, 1), true);
  assert.equal(passesCase(0, 1), false);
});

test("three samples need two", () => {
  assert.equal(passesCase(3, 3), true);
  assert.equal(passesCase(2, 3), true);
  assert.equal(passesCase(1, 3), false);
  assert.equal(passesCase(0, 3), false);
});

test("one dissenting judge no longer fails a case", () => {
  // THE REGRESSION THIS FILE EXISTS FOR. R4 was recorded as a blocker failure
  // at [2/3 samples]: two judges said pass, one said fail. Under the old rule
  // that was red.
  assert.equal(passesCase(2, 3), true);
});

test("a majority is strict, not a tie", () => {
  // An even sample count must not pass on a split. 2/4 is not agreement, and
  // `passedRuns >= samples / 2` would call it one.
  assert.equal(passesCase(2, 4), false);
  assert.equal(passesCase(3, 4), true);
  assert.equal(passesCase(1, 2), false);
  assert.equal(passesCase(2, 2), true);
});

test("sampling now reduces the false-red rate instead of tripling it", () => {
  // The arithmetic from the issue, asserted rather than asserted-in-prose, so
  // that reverting the rule fails here and not just in a comment.
  const p = 0.01; // per-run flake probability
  const falseRedAtAll = 1 - (1 - p) ** 3; // old rule: any sample fails
  const falseRedAtMajority = 3 * p ** 2 * (1 - p) + p ** 3; // two or more fail

  assert.ok(falseRedAtAll > 0.029, `old rule should be ~3p, got ${falseRedAtAll}`);
  assert.ok(falseRedAtMajority < 0.0004, `majority should be ~3p^2, got ${falseRedAtMajority}`);
  assert.ok(falseRedAtMajority * 50 < falseRedAtAll, "majority must be far quieter, not marginally");
});

test("a genuinely broken case still goes red", () => {
  // The risk of loosening: a real regression hiding behind the majority. A case
  // that fails 90% of runs must still be caught essentially always, or this
  // change trades one broken instrument for another.
  const p = 0.9;
  const goesRed = 3 * p ** 2 * (1 - p) + p ** 3;
  assert.ok(goesRed > 0.97, `a 90%-failing case should be red ~always, got ${goesRed}`);
});

// ── The tool-call matcher (#415) ─────────────────────────────────────────────
//
// `expectToolCalled` is how a case asserts that a read happened MID-turn and
// what it named — the result alone shows only the final text or proposal. The
// matcher lived untested inside run-evals.mjs until the blueprint cases needed
// a third matching mode.

const CALLS = [
  { name: "search_blueprint", args: { query: "zoom", include: ["touchpoints", "findings"], granularity: "path" } },
  { name: "notion_search", args: { query: "zoom" } },
];

test("a list argument matches by membership, not by equality", () => {
  // The model may ask for more than the case names, and `===` on two arrays is
  // never true, so an equality matcher would fail every list assertion.
  assert.equal(argMatches(["touchpoints", "findings"], ["touchpoints"]), true);
  assert.equal(argMatches(["findings"], ["touchpoints"]), false);
  assert.equal(argMatches("touchpoints", ["touchpoints"]), false, "a scalar is not a one-element list");
  assert.equal(argMatches("path", "path"), true);
  assert.equal(argMatches(undefined, "path"), false, "an unsent argument matches nothing");
});

test("a call matches when the tool and every named argument match", () => {
  assert.equal(toolCallMatches(CALLS, { tool: "search_blueprint", args: { include: ["touchpoints"] } }), true);
  assert.equal(toolCallMatches(CALLS, { tool: "search_blueprint", args: { include: ["slices"] } }), false);
  assert.equal(toolCallMatches(CALLS, { tool: "figma_read" }), false);
  assert.equal(toolCallMatches(CALLS, { tool: "notion_search" }), true, "no args means the tool alone");
  assert.equal(toolCallMatches(undefined, { tool: "notion_search" }), false, "an unreported list is not a pass");
});

test("argsOneOf accepts any of several right answers and refuses the default", () => {
  // Asked what shape a phase has, `scenario`, `path` and `step` are all
  // correct and `cell` is the wrong one. Pinning one rung would grade a
  // preference nobody holds; asserting nothing would let the default through,
  // which is the behaviour the case was written to catch.
  const rungs = { tool: "search_blueprint", argsOneOf: { granularity: ["scenario", "path", "step"] } };
  assert.equal(toolCallMatches(CALLS, rungs), true);
  assert.equal(
    toolCallMatches([{ name: "search_blueprint", args: { granularity: "cell" } }], rungs),
    false,
    "the default rung is exactly what this assertion exists to fail",
  );
  assert.equal(
    toolCallMatches([{ name: "search_blueprint", args: {} }], rungs),
    false,
    "an unsent granularity is the default, not an open choice",
  );
});

test("args and argsOneOf both apply to the SAME call", () => {
  // Two calls, each satisfying one half, must not add up to a pass: the case
  // asserts one scoped search, not two unscoped ones.
  const split = [
    { name: "search_blueprint", args: { filter_scenario: "Quiet Harbour", granularity: "cell" } },
    { name: "search_blueprint", args: { granularity: "path" } },
  ];
  const want = {
    tool: "search_blueprint",
    args: { filter_scenario: "Quiet Harbour" },
    argsOneOf: { granularity: ["scenario", "path", "step"] },
  };
  assert.equal(toolCallMatches(split, want), false);
  assert.equal(
    toolCallMatches([{ name: "search_blueprint", args: { filter_scenario: "Quiet Harbour", granularity: "path" } }], want),
    true,
  );
});

test("the failure line shows the wanted tool's arguments and the rest by name", () => {
  // "no search_blueprint call with granularity" beside a bare `search_blueprint`
  // tells a reader nothing about which rung it asked for.
  const seen = describeCalls(CALLS, "search_blueprint");
  assert.match(seen, /search_blueprint\(\{"query":"zoom"/);
  assert.match(seen, /, notion_search$/);
  assert.equal(describeCalls([], "search_blueprint"), "none");
});

test("more passes than samples is a caller bug, not a pass", () => {
  // Defensive: the scorer derives both numbers from the same array, so this is
  // unreachable today. It is asserted so that a future refactor which passes
  // them separately cannot make it silently true.
  assert.throws(() => passesCase(4, 3), /passedRuns/);
  assert.throws(() => passesCase(-1, 3), /passedRuns/);
  assert.throws(() => passesCase(0, 0), /samples/);
});
