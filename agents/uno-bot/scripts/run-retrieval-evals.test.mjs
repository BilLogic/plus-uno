// The retrieval suite's WALK, and what it shares with the turn suite (#619).
//
// The scorer's own arithmetic is pinned by `--self-test`, which runs in CI
// before anything is scored and needs no test runner. What is here is the part
// that needs one: the walk driven from a fake instrument, and the three shared
// pieces reaching the retrieval suite intact — the row envelope, the summary
// spine's tallies, and the gate's error/warning split.
//
// Run: npm run test:bundle (from agents/uno-bot)

import { test } from "node:test";
import assert from "node:assert/strict";
import { exitCodeFor, isError } from "../../../scripts/lib/findings.mjs";
import { findingsFor } from "./eval-results.mjs";
import {
  RETRIEVAL_FIXTURE_PATH,
  RETRIEVAL_RESULT_KEYS,
  loadRetrievalCases,
  summariseRetrieval,
  walkRetrieval,
} from "./run-retrieval-evals.mjs";

const cell = (id) => ({ id, scenario: "S", path: "P", step: "T", lane: "L", score: 0.7 });

/** An instrument that answers from a table, so the walk needs no Worker. */
const canned = (answers) => (q) =>
  Promise.resolve(answers[q] ?? { ok: false, error: "no canned answer" });

const cases = [
  { id: "X1", class: "paraphrase", blocker: true, k: 5, q: "hit", expectCellIds: ["a"] },
  { id: "X2", class: "aggregate", k: 5, q: "miss", expectCellIds: ["z"] },
];
const answers = {
  hit: { ok: true, retrieval: "semantic", rows: [cell("a")], subrequests: 2, ms: 30, embed_model: "m" },
  miss: { ok: true, retrieval: "semantic", rows: [cell("b")], subrequests: 2, ms: 31, embed_model: "m" },
};

test("the walk scores every case from whatever instrument it is handed", async () => {
  const lines = [];
  const results = await walkRetrieval({ cases, search: canned(answers), log: (l) => lines.push(l) });

  assert.equal(results.length, 2);
  assert.equal(results[0].pass, true);
  assert.equal(results[0].rank, 1, "the rank of the first matching row is a retrieval measurement");
  assert.equal(results[1].pass, false);
  // A blocker reads FAIL and a diagnostic reads diag — the per-case log is this
  // suite's own and is the reason the check stays spawn-shaped.
  assert.match(lines[0], /^\[PASS\] X1 \(paraphrase\) rank=1 /);
  assert.match(lines[1], /^\[diag\] X2 \(aggregate\) rank=- /);
});

test("every row carries the same keys, and the shared spine's word for a failure", async () => {
  const results = await walkRetrieval({ cases, search: canned(answers), log() {} });
  for (const row of results) {
    assert.deepEqual(Object.keys(row), RETRIEVAL_RESULT_KEYS, `row ${row.id} has its own shape`);
  }
  // `failures`, not `reasons`: the gate reads that key on both suites, which is
  // what lets one `findingsFor` serve them.
  assert.deepEqual(results[0].failures, []);
  assert.match(results[1].failures[0], /none of 1 expected cell id\(s\) in top-5/);
});

test("the summary says what it measured against, and counts its tallies off the rows", async () => {
  const results = await walkRetrieval({ cases, search: canned(answers), log() {} });
  const summary = summariseRetrieval(results, { worker: "https://example.invalid", rpc: undefined });

  // The criterion #619 names: a retrieval results file that can say which
  // fixture asked the questions.
  assert.equal(summary.fixture.path, "docs/evals/fixtures/blueprint-retrieval-cases.json",
    "named repo-relative, so a results file worth committing names the document");
  assert.match(summary.fixture.sha256, /^[0-9a-f]{12}$/);

  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.skipped, 0);
  assert.equal(summary.blockerFailures, 0, "the failing case is a diagnostic, not a blocker");
  assert.equal(summary.cases, 2);
  assert.equal(summary.recallOverall, 0.5);
  // Its own measurements, which the turn suite has no field for.
  assert.equal(summary.rpc, "search_blueprint", "recorded always, not only when overridden");
  assert.equal(summary.embedModel, "m", "what the WORKER said it embedded with");
  assert.deepEqual(summary.byClass.paraphrase, { cases: 1, passed: 1, recall: 1, mrr: 1 });
  assert.equal(summary.byClass.aggregate.mrr, 0, "a miss contributes 0 to MRR");
});

test("a failing blocker is an error; a failing diagnostic is a warning that does not fail the job", async () => {
  const summary = summariseRetrieval(
    await walkRetrieval({ cases, search: canned(answers), log() {} }),
  );
  const findings = findingsFor(summary);
  assert.equal(findings.length, 1, "only the failing case is a finding");
  assert.equal(findings[0].severity, "warning");
  assert.equal(exitCodeFor(findings), 0, "a failing aggregate case reports and does not redden CI");

  // And the other way round: the same miss on a blocker exits 1.
  const blocking = summariseRetrieval(
    await walkRetrieval({
      cases: [{ ...cases[1], blocker: true }],
      search: canned(answers),
      log() {},
    }),
  );
  const red = findingsFor(blocking);
  assert.ok(isError(red[0]));
  assert.match(red[0].message, /^BLOCKER X2: none of 1 expected cell id/);
  assert.equal(exitCodeFor(red), 1);
});

test("a transport failure is scored a miss, so nothing is waved through as unreachable", async () => {
  const results = await walkRetrieval({
    cases: [cases[0]],
    search: () => Promise.resolve({ ok: false, error: "HTTP 404: not found" }),
    log() {},
  });
  assert.equal(results[0].pass, false);
  assert.equal(results[0].skipped, false, "the retrieval suite has no unreachable case");
  assert.equal("unreachable" in results[0], false, "unreachable is a turn measurement; retrieval has no such field");
  assert.match(results[0].failures[0], /request failed: HTTP 404/);
});

test("the repository's fixture is the one every case in it is read from", () => {
  const fixture = loadRetrievalCases();
  assert.equal(fixture.path, RETRIEVAL_FIXTURE_PATH);
  assert.ok(fixture.cases.length > 0);
  assert.ok(fixture.cases.every((c) => c.id && c.q && c.class));
  assert.ok(fixture.readme.includes("search_blueprint"), "the fixture's prose is its own, not a case");
});
