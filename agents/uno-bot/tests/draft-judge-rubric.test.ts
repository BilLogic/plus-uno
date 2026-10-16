// The judge's condensed rubric is a COPY of docs/evals/rubrics/bot-answer.md,
// and a copy is a thing that drifts. It did, silently, for weeks: the confidence
// ritual was redesigned on 2026-07-16 from a trailing labeled rating to one
// woven clause. AGENT.md and the canonical rubric were both updated; the judge's
// prompt was not, so the mechanism meant to catch rubric violations went on
// requiring the retired format while nothing checked that the replacement was
// present at all.
//
// The prompt now lives in `src/agent/draft-judge.ts`, beside the call that
// sends it (#595); the leaf module it used to sit in existed only so this file
// could compile it apart from the Workers-typed graph, which the test compile
// stopped caring about.
//
// D9 itself is fixed. These tests are what stops the next drift. They are
// deliberately few and do not try to validate the whole prompt — they pin the
// one dimension that has already gone wrong, and they read the canonical rubric
// from disk so the copy and its source cannot disagree in silence.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { JUDGE_SYSTEM } from "../src/agent/draft-judge";

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
    /only when it is lower than a live read earns/,
    "D9 in bot-answer.md no longer limits the in-prose clause to lower sureness",
  );
  assert.doesNotMatch(rubric, /exactly one in-prose clause/, "bot-answer.md still asks for a clause on every answer");
});

test("D9 asks for a woven clause only when sureness is lower than a live read earns", () => {
  const d9 = d9Line();
  assert.doesNotMatch(d9, /exactly ONE/i, "D9 should not require a clause on every answer");
  assert.match(d9, /woven|inline/i, "D9 should say the clause is woven into the prose");
  assert.match(d9, /failed/i, "D9 should name a failed read as owing a hedge");
  assert.match(d9, /Sources box/, "D9 should leave a live read to the Sources box");
});

test("D9 still fails a false freshness claim", () => {
  assert.match(d9Line(), /freshness/i, "D9 should fail a freshness claim over data not fetched this turn");
});

test("D9 treats the trailing label as retired, not required", () => {
  const d9 = d9Line();
  assert.match(d9, /RETIRED/, "D9 should name the trailing labeled rating as retired");
  // The exact shape of the 2026-07-12 prompt, which told the judge a factual
  // answer "ends with a confidence line". Requiring it is the regression.
  assert.doesNotMatch(
    d9,
    /answer ends with a confidence line/i,
    "the judge is requiring the retired trailing confidence affix again",
  );
});

test("D9 passes a live read that carries no clause", () => {
  // Since 2026-10-11 a live read says nothing in prose: the Sources box shows
  // what was read, so a clause there only repeats it.
  assert.match(d9Line(), /live or cached read this turn needs no clause/i, "D9 should pass a live or cached read with no clause");
  assert.match(d9Line(), /none ran/i, "D9 should still ask an answer with no lookup to say what it rests on");
  assert.doesNotMatch(d9Line(), /or none at all/i, "D9 still fails a reply for carrying no clause");
});

test("the judge still carries the dimensions the rubric names as gating", () => {
  // Cheap breadth check: the condensed copy should not quietly lose a whole
  // dimension the way it lost the D9 redesign.
  for (const dim of ["- D1", "- D3", "- D5", "- D8", "- D9"]) {
    assert.ok(JUDGE_SYSTEM.includes(dim), `the judge prompt dropped ${dim}`);
  }
  assert.match(JUDGE_SYSTEM, /HARD GATES/, "the judge prompt dropped its hard gates");
});

test("the judge fails a reply that breaks the emoji budget", () => {
  const gate = JUDGE_SYSTEM.split("\n").find((l) => /emoji/i.test(l) && l.trimStart().startsWith("-"));
  assert.ok(gate, "the judge prompt names no emoji gate");
  assert.match(gate!, /🎉/, "the gate names the one emoji a reply may carry");
  assert.match(gate!, /error|refusal|factual/i, "the gate names where no emoji belongs at all");
  assert.match(gate!, /gate:emoji/, "the gate has a failure code");
});
