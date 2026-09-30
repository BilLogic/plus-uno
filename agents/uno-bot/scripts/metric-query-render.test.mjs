/**
 * The metric query renderer: a checked-in query file, a window and the CSV
 * inputs a query reads (the graded answers, the corpus export, GitHub's
 * closures) become one statement `wrangler d1 execute --file` can run.
 *
 * What each query COMPUTES is held by the workerd suite, on a seeded local D1
 * (tests/workerd/metric-queries.test.ts). This file holds the rendering: the
 * window lines, the inputs as VALUES, and every refusal.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  D1_STATEMENT_LIMIT,
  inputRows,
  parseCsv,
  referencedInputs,
  renderMetricQuery,
} from "./metric-query-render.mjs";

const QUERY = `-- a query
WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  -- @input graded_answers
  x AS (SELECT 1)
SELECT COUNT(*) FROM graded_answers, win;
`;

/* ------------------------------------------------------------------ csv */

test("parseCsv reads a header row into records, quotes and CRLF included", () => {
  const rows = parseCsv('turn_id,grade,grader,note\r\nC1:1.2,correct,bill,"said ""yes"", then no"\r\nC1:1.3,wrong,bill,\r\n');
  assert.deepEqual(rows, [
    { turn_id: "C1:1.2", grade: "correct", grader: "bill", note: 'said "yes", then no' },
    { turn_id: "C1:1.3", grade: "wrong", grader: "bill", note: "" },
  ]);
});

test("parseCsv keeps a newline inside quotes and skips blank lines", () => {
  const rows = parseCsv('a,b\n"one\ntwo",2\n\n');
  assert.deepEqual(rows, [{ a: "one\ntwo", b: "2" }]);
});

test("parseCsv refuses a row with the wrong number of fields", () => {
  assert.throws(() => parseCsv("a,b\n1,2,3\n"), /row 2 has 3 fields, the header has 2/);
});

/* ------------------------------------------------------------------ inputs */

test("graded answers keep only the three grades", () => {
  assert.deepEqual(inputRows("graded_answers", [{ turn_id: "t1", grade: " Correct ", grader: "bill", note: "" }]), [
    ["t1", "correct", "bill", null],
  ]);
  assert.throws(
    () => inputRows("graded_answers", [{ turn_id: "t1", grade: "ok", grader: "bill", note: "" }]),
    /graded_answers row 1: grade "ok" is not correct, partial or wrong/,
  );
});

test("a graded answer names its turn", () => {
  assert.throws(
    () => inputRows("graded_answers", [{ turn_id: "", grade: "correct", grader: "bill", note: "" }]),
    /graded_answers row 1: turn_id is empty/,
  );
});

test("the corpus export takes ISO times or epoch ms, and a blank reply", () => {
  const rows = inputRows("corpus_threads", [
    { thread_id: "a", asked_at: "2025-02-03T10:00:00Z", first_reply_at: "1738577400000", lead_replied_first: "1" },
    { thread_id: "b", asked_at: "1738577400000", first_reply_at: "", lead_replied_first: "false" },
  ]);
  assert.deepEqual(rows, [
    ["a", Date.parse("2025-02-03T10:00:00Z"), 1738577400000, 1],
    ["b", 1738577400000, null, 0],
  ]);
  assert.throws(
    () => inputRows("corpus_threads", [{ thread_id: "a", asked_at: "soon", first_reply_at: "", lead_replied_first: "0" }]),
    /corpus_threads row 1: asked_at "soon" is not a time/,
  );
});

test("closures come from GitHub's own JSON field names too", () => {
  assert.deepEqual(
    inputRows("ticket_closures", [
      { url: "https://github.com/BilLogic/plus-uno/issues/1", closedAt: "2026-08-13T10:00:00Z" },
      { url: "https://github.com/BilLogic/plus-uno/issues/2", closedAt: null },
    ]),
    [
      ["https://github.com/BilLogic/plus-uno/issues/1", Date.parse("2026-08-13T10:00:00Z")],
      ["https://github.com/BilLogic/plus-uno/issues/2", null],
    ],
  );
});

test("an input nobody defined is refused", () => {
  assert.throws(() => inputRows("secrets", []), /no input named "secrets"/);
});

/* ------------------------------------------------------------------ render */

test("a query names the inputs it reads by marker", () => {
  assert.deepEqual(referencedInputs(QUERY), ["graded_answers"]);
  assert.deepEqual(referencedInputs("SELECT 1"), []);
});

test("the window replaces the two marked dates and nothing else", () => {
  const sql = renderMetricQuery(QUERY, {
    from: "2026-08-03",
    to: "2026-08-17",
    inputs: { graded_answers: [] },
  });
  assert.match(sql, /strftime\('%s', '2026-08-03'\) AS INTEGER\) \* 1000,  -- @from/);
  assert.match(sql, /strftime\('%s', '2026-08-17'\) AS INTEGER\) \* 1000   -- @to/);
  assert.doesNotMatch(sql, /2026-09-01|2027-01-01/);
});

test("with no window given, the file's own dates stand", () => {
  const sql = renderMetricQuery(QUERY, { inputs: { graded_answers: [] } });
  assert.match(sql, /'2026-09-01'/);
  assert.match(sql, /'2027-01-01'/);
});

test("a window must be two dates, start before end", () => {
  const inputs = { graded_answers: [] };
  assert.throws(() => renderMetricQuery(QUERY, { from: "2026-08-03'; DROP TABLE turns; --", inputs }), /YYYY-MM-DD/);
  assert.throws(() => renderMetricQuery(QUERY, { from: "2026-08-17", to: "2026-08-03", inputs }), /before/);
});

test("an input becomes a VALUES table with its values quoted", () => {
  const sql = renderMetricQuery(QUERY, {
    inputs: { graded_answers: [["C1:1.2", "correct", "o'brien", null]] },
  });
  assert.match(sql, /graded_answers\(turn_id, grade, grader, note\) AS \(VALUES\n    \('C1:1\.2', 'correct', 'o''brien', NULL\)\n  \),/);
  assert.doesNotMatch(sql, /-- @input/);
});

test("an empty input is a table with no rows, not a syntax error", () => {
  const sql = renderMetricQuery(QUERY, { inputs: { graded_answers: [] } });
  assert.match(sql, /graded_answers\(turn_id, grade, grader, note\) AS \(SELECT NULL, NULL, NULL, NULL WHERE 0\),/);
});

test("a query whose input was not supplied is refused, naming it", () => {
  assert.throws(() => renderMetricQuery(QUERY, {}), /reads graded_answers, and none was given/);
});

test("a statement past D1's size limit is refused before it is sent", () => {
  const many = Array.from({ length: 2_000 }, (_, i) => [`C1:${i}.${"9".repeat(40)}`, "correct", "bill", "x".repeat(20)]);
  assert.throws(() => renderMetricQuery(QUERY, { inputs: { graded_answers: many } }), new RegExp(`${D1_STATEMENT_LIMIT}`));
});
