// The judge's condensed rubric is a COPY of docs/evals/rubrics/bot-answer.md,
// and a copy is a thing that drifts. It did, silently, for weeks: the confidence
// ritual was redesigned on 2026-07-16 from a trailing labelled rating to one
// woven clause. AGENT.md and the canonical rubric were both updated; the judge's
// prompt was not, so the mechanism meant to catch rubric violations went on
// requiring the retired format while nothing checked that the replacement was
// present at all.
//
// D9 itself is fixed. These tests are what stops the next drift. They are
// deliberately few and do not try to validate the whole prompt — they pin the
// one dimension that has already gone wrong, and they read the canonical rubric
// from disk so the copy and its source cannot disagree in silence.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { JUDGE_SYSTEM } from "../src/agent/draft-judge-rubric";

// Resolved from the package dir (npm test runs from agents/uno-bot) rather than
// from the compiled file, which lives under .test-build/.
const RUBRIC = path.resolve(process.cwd(), "../../docs/evals/rubrics/bot-answer.md");

function d9Line(): string {
  const line = JUDGE_SYSTEM.split("\n").find((l) => l.trimStart().startsWith("- D9"));
  assert.ok(line, "the judge prompt has no D9 line at all");
  return line!;
}

test("the canonical rubric still describes the ritual these tests pin", () => {
  // If this fails, the ritual changed again and the assertions below are what
  // need re-deriving — not the prompt.
  const rubric = readFileSync(RUBRIC, "utf8");
  assert.match(
    rubric,
    /retired trailing high\/medium\/low affix must NOT appear/,
    "bot-answer.md no longer retires the trailing affix; re-derive these tests from it",
  );
  assert.match(
    rubric,
    /exactly one in-prose clause/,
    "D9 in bot-answer.md no longer asks for exactly one in-prose clause",
  );
});

test("D9 asks for exactly one clause woven into the prose", () => {
  const d9 = d9Line();
  assert.match(d9, /\bONE\b/, "D9 should require exactly one clause");
  assert.match(d9, /woven|inline/i, "D9 should say the clause is woven into the prose");
});

test("D9 treats the trailing label as retired, not required", () => {
  const d9 = d9Line();
  assert.match(d9, /RETIRED/, "D9 should name the trailing labelled rating as retired");
  // The exact shape of the 2026-07-12 prompt, which told the judge a factual
  // answer "ends with a confidence line". Requiring it is the regression.
  assert.doesNotMatch(
    d9,
    /answer ends with a confidence line/i,
    "the judge is requiring the retired trailing confidence affix again",
  );
});

test("D9 fails a reply that carries no clause at all", () => {
  // The complaint that started this: replies going out with no calibration,
  // which the old D9 could not catch because it only looked for a sign-off.
  assert.match(
    d9Line(),
    /or none at all|no such clause fails/i,
    "D9 should fail a factual reply that carries no confidence clause",
  );
});

test("the judge still carries the dimensions the rubric names as gating", () => {
  // Cheap breadth check: the condensed copy should not quietly lose a whole
  // dimension the way it lost the D9 redesign.
  for (const dim of ["- D1", "- D3", "- D5", "- D8", "- D9"]) {
    assert.ok(JUDGE_SYSTEM.includes(dim), `the judge prompt dropped ${dim}`);
  }
  assert.match(JUDGE_SYSTEM, /HARD GATES/, "the judge prompt dropped its hard gates");
});
