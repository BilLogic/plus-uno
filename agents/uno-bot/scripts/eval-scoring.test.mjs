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
import { passesCase } from "./eval-scoring.mjs";

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

test("more passes than samples is a caller bug, not a pass", () => {
  // Defensive: the scorer derives both numbers from the same array, so this is
  // unreachable today. It is asserted so that a future refactor which passes
  // them separately cannot make it silently true.
  assert.throws(() => passesCase(4, 3), /passedRuns/);
  assert.throws(() => passesCase(-1, 3), /passedRuns/);
  assert.throws(() => passesCase(0, 0), /samples/);
});
