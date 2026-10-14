/**
 * The answer-grading sample: the same rows and seed always pick the same
 * turns, whatever order the database returned them in; the second grader's
 * share is the head of the sample; links are Slack's archive form; and the
 * query's output is read in each shape wrangler or a person hands over.
 * What the query LISTS is held by the workerd suite.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { drawSample, eligibleRows, sampleCsv, seededRandom, slackLink } from "./sample-answers.mjs";

/** @param {number} i */
const row = (i) => ({
  turn_id: `C1:17900000${String(i).padStart(2, "0")}.000100`,
  channel: i % 5 === 0 ? "D1" : "C1",
  ask_ts: `17900000${String(i).padStart(2, "0")}.000100`,
  surface: i % 5 === 0 ? "assistant" : "channel",
  needs_permission: i % 5 === 0 ? 1 : 0,
});
const ROWS = Array.from({ length: 80 }, (_, i) => row(i));

test("the PRNG is a fixed sequence per seed, in [0, 1)", () => {
  const a = seededRandom("fall-2026");
  const b = seededRandom("fall-2026");
  const first = Array.from({ length: 5 }, () => a());
  assert.deepEqual(first, Array.from({ length: 5 }, () => b()));
  assert.notDeepEqual(first, Array.from({ length: 5 }, seededRandom("other")));
  assert.ok(first.every((x) => x >= 0 && x < 1));
});

test("the same rows and seed pick the same turns, whatever order the rows came in", () => {
  const once = drawSample(ROWS, { seed: "fall-2026", n: 50, second: 10 });
  const reversed = drawSample([...ROWS].reverse(), { seed: "fall-2026", n: 50, second: 10 });
  assert.deepEqual(once, reversed);
  assert.equal(once.length, 50);
  assert.equal(new Set(once.map((r) => r.turn_id)).size, 50, "no turn twice");
  assert.notDeepEqual(
    once.map((r) => r.turn_id),
    drawSample(ROWS, { seed: "spring-2027", n: 50, second: 10 }).map((r) => r.turn_id),
  );
});

test("the first --second of the sample are marked for a second grader", () => {
  const sample = drawSample(ROWS, { seed: "s", n: 50, second: 10 });
  assert.deepEqual(sample.map((r) => r.second_grade), [...Array(10).fill(1), ...Array(40).fill(0)]);
  assert.throws(() => drawSample(ROWS, { seed: "s", n: 5, second: 10 }), /more than --n/);
});

test("fewer rows than --n samples all of them", () => {
  assert.equal(drawSample(ROWS.slice(0, 7), { seed: "s", n: 50, second: 10 }).length, 7);
});

test("a Slack link drops the ts's dot", () => {
  assert.equal(slackLink("C0ABC", "1790000001.000100"), "https://slack.com/archives/C0ABC/p1790000001000100");
});

test("the CSV has the five columns, and a DM needs permission", () => {
  const csv = sampleCsv(drawSample([row(5), row(6)], { seed: "s", n: 2, second: 1 }));
  const lines = csv.trim().split("\n");
  assert.equal(lines[0], "turn_id,slack_link,surface,needs_permission,second_grade");
  assert.ok(lines.includes("C1:1790000005.000100,https://slack.com/archives/D1/p1790000005000100,assistant,1,1") ||
    lines.includes("C1:1790000005.000100,https://slack.com/archives/D1/p1790000005000100,assistant,1,0"));
});

test("reads wrangler's --json output, a plain array and CSV alike, and refuses another query's", () => {
  const wrangler = JSON.stringify([{ results: [row(1), row(2)], success: true, meta: {} }]);
  assert.deepEqual(eligibleRows(wrangler), [row(1), row(2)]);
  assert.deepEqual(eligibleRows(JSON.stringify([row(1)])), [row(1)]);
  const csv = "turn_id,channel,ask_ts,surface,needs_permission\nC1:1.2,C1,1.2,channel,0\n";
  assert.deepEqual(eligibleRows(csv), [{ turn_id: "C1:1.2", channel: "C1", ask_ts: "1.2", surface: "channel", needs_permission: 0 }]);
  assert.throws(() => eligibleRows(JSON.stringify([{ cohort: "correct" }])), /no turn_id/);
});
