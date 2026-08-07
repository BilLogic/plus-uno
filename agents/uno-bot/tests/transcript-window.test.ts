import { test } from "node:test";
import assert from "node:assert/strict";
import { windowTranscript } from "../src/slack/transcript-window";

const line = (n: number, len = 20) => `u${n}: ${"x".repeat(len)}`;

test("a transcript that fits is untouched", () => {
  const lines = [line(1), line(2), line(3)];
  const out = windowTranscript(lines, 10_000);
  assert.deepEqual(out.lines, lines);
  assert.equal(out.dropped, 0);
});

test("the PARENT survives the cap — the regression this exists for", () => {
  // Old behaviour dropped oldest-first, so the parent went first and the model
  // got replies to a question it could not see.
  const lines = [ "PARENT: what did we decide about spacing?", ...Array.from({ length: 40 }, (_, i) => line(i)) ];
  const out = windowTranscript(lines, 300);
  assert.equal(out.lines[0], "PARENT: what did we decide about spacing?");
  assert.ok(out.dropped > 0);
});

test("the MOST RECENT replies are kept, not the oldest", () => {
  const lines = ["PARENT: q", line(1), line(2), line(3), line(4), "u5: NEWEST"];
  const out = windowTranscript(lines, 60);
  assert.equal(out.lines[0], "PARENT: q");
  assert.equal(out.lines[out.lines.length - 1] ?? "", "u5: NEWEST");
});

test("dropped counts the middle, so the caller can say it is partial", () => {
  const lines = ["PARENT: q", line(1), line(2), line(3), "u4: NEWEST"];
  const out = windowTranscript(lines, 40);
  assert.equal(out.dropped, lines.length - out.lines.length);
});

test("a parent bigger than the budget is kept alone", () => {
  // Replies with no question are worse than a question with no replies.
  const lines = [`PARENT: ${"y".repeat(500)}`, line(1), line(2)];
  const out = windowTranscript(lines, 100);
  assert.equal(out.lines.length, 1);
  assert.match(out.lines[0] ?? "", /^PARENT:/);
});

test("empty input is safe", () => {
  assert.deepEqual(windowTranscript([], 100), { lines: [], dropped: 0 });
});
