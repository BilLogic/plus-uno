// The results ENVELOPE and the gate a run exits on (#617).
//
// Two properties, and both are about a file somebody reads a week later:
// every row of `eval-results.json` carries the same keys whichever branch of
// the walk wrote it, and what the run exits on is derived from those rows
// rather than counted alongside them.
//
// Run: npm run test:bundle (from agents/uno-bot)

import { test } from "node:test";
import assert from "node:assert/strict";
import { isError, exitCodeFor } from "../../../scripts/lib/findings.mjs";
import { RESULT_KEYS, findingsFor, resultRow } from "./eval-results.mjs";

// ── The row ──────────────────────────────────────────────────────────────────

test("every row carries the same keys, whatever the branch that wrote it knew", () => {
  // The five branches of the walk, at their thinnest and their fullest.
  const rows = [
    resultRow({ id: "R0", name: "no recording", skipped: true, unreachable: true, reason: "no recording for R0" }),
    resultRow({ id: "B2", name: "subject read failed", failures: ["subject route for 'scenario-any': HTTP 500"] }),
    resultRow({ id: "B2", name: "nothing satisfies it", skipped: true, need: "scenario-any", reason: "nothing on this board" }),
    resultRow({ id: "B2", name: "placeholder unfilled", need: "scenario-any", subject: { name: "x" }, failures: ["carries no 'phase'"] }),
    resultRow({ id: "R3", name: "ran", pass: true, samples: 3, passedRuns: 3, judged: true, judge: { verdict: "pass" }, ms: 12 }),
  ];
  for (const row of rows) assert.deepEqual(Object.keys(row), RESULT_KEYS, `row ${row.id} has its own shape`);
});

test("absent is not a value: a skipped row still answers 'did it pass?'", () => {
  const row = resultRow({ id: "R0", name: "no recording", skipped: true, unreachable: true, reason: "no recording" });
  assert.equal(row.pass, false, "a case that did not run did not pass, and the field says so");
  assert.equal(row.skipped, true, "and `skipped` is the field that keeps it out of the denominator");
  assert.deepEqual(row.failures, []);
  assert.equal(row.judged, false);
  assert.equal(row.judge, null);
  assert.equal(row.transcript, null);
});

test("a key outside the vocabulary is refused, not written", () => {
  // A misspelt key in a results file is a fact that silently stops being
  // recorded — `passedRun` would simply never appear and nothing would say so.
  assert.throws(
    () => resultRow({ id: "R3", name: "ran", passedRun: 3 }),
    /results row for 'R3' carries unknown key 'passedRun'/,
  );
});

test("a results row written before #656 still reads: ungated is unreachable", () => {
  const row = resultRow({ id: "R0", name: "no recording", skipped: true, ungated: true, reason: "no recording" });
  assert.equal(row.unreachable, true);
  assert.equal("ungated" in row, false, "the old key does not survive on the row");
  assert.deepEqual(Object.keys(row), RESULT_KEYS);
});

// ── The gate ─────────────────────────────────────────────────────────────────

const ran = (fields) => resultRow({ name: "a case", samples: 1, ...fields });

test("a failed blocker is an error and a failed non-blocker is a warning", () => {
  const summary = {
    results: [
      ran({ id: "R3", blocker: true, pass: false, failures: ["R3: tool=marketplace_register (expected shareout_post)"] }),
      ran({ id: "P4", blocker: false, pass: false, judge: { verdict: "fail", reason: "D4: no provenance" } }),
      ran({ id: "R1", blocker: true, pass: true }),
    ],
  };
  const findings = findingsFor(summary);
  assert.equal(findings.length, 2);
  assert.ok(isError(findings[0]));
  assert.match(findings[0].message, /^BLOCKER R3 — a case: R3: tool=marketplace_register/);
  assert.equal(findings[1].severity, "warning");
  // The judge's reason is the failure where there are no deterministic ones.
  assert.match(findings[1].message, /^P4 — a case: D4: no provenance/);
  assert.equal(exitCodeFor(findings), 1, "a failing blocker fails the run");
});

test("a run where everything passed finds nothing, and exits 0", () => {
  const summary = { results: [ran({ id: "R1", blocker: true, pass: true }), ran({ id: "R2", pass: true })] };
  assert.deepEqual(findingsFor(summary), []);
  assert.equal(exitCodeFor(findingsFor(summary)), 0);
});

test("a skipped or unreachable case is not a finding, so a missing recording cannot redden the gate", () => {
  // A gate that is red for "no recording" is a gate that gets switched off.
  // But a run that scored NOTHING reads as a clean sweep and measured nothing,
  // so it says so — as a warning, which prints and does not fail.
  const summary = {
    results: [
      resultRow({ id: "R0", name: "a case", skipped: true, unreachable: true, blocker: true, reason: "no recording" }),
      resultRow({ id: "B2", name: "a case", skipped: true, blocker: true, reason: "nothing on this board" }),
    ],
  };
  const findings = findingsFor(summary);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "warning");
  assert.match(findings[0].message, /nothing was scored: all 2 case\(s\) skipped or unreachable/);
  assert.equal(exitCodeFor(findings), 0, "two unmeasured blockers must not fail the run");
});
