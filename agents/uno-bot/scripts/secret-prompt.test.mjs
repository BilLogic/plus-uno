/**
 * The keystroke reducer behind the no-echo prompt, and the flag parsing.
 *
 * Pulled out of set-secrets.mjs so both can be exercised without a terminal.
 * The one that matters is the multi-line paste: the first version resolved on
 * the first newline and dropped the rest of the chunk, so a value that had
 * wrapped across two lines was written half-complete and reported as "set".
 * Cloudflare stores secrets write-only, so the only way to discover that is to
 * enter it again.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { feedKeys, parseOnly } from "./secret-prompt.mjs";

const CTRL_C = "\u0003";
const DEL = "\u007f";
const ARROW_LEFT = "\u001b[D";

/* --------------------------------------------------------------- the prompt */

test("typing accumulates until Enter", () => {
  let s = feedKeys("", "abc");
  assert.equal(s.done, false);
  s = feedKeys(s.buf, "de\r");
  assert.deepEqual(
    { buf: s.buf, done: s.done, extra: s.extra },
    { buf: "abcde", done: true, extra: "" },
  );
});

test("a pasted value with a newline in the MIDDLE reports what was left over", () => {
  // The half-credential case. The reducer still stops at the newline — that is
  // what a line-oriented prompt does — but it hands back the remainder so the
  // caller can say so instead of printing "set (N chars)" over a truncation.
  const s = feedKeys("", "first-half\nsecond-half");
  assert.equal(s.buf, "first-half");
  assert.equal(s.done, true);
  assert.equal(s.extra, "second-half");
});

test("a trailing newline is not leftover — that is just Enter", () => {
  const s = feedKeys("", "token\n");
  assert.equal(s.buf, "token");
  assert.equal(s.extra, "");
});

test("CRLF counts as one Enter, not as a newline plus leftover", () => {
  // Terminals send CRLF. Reading the \n as a remainder would make every entry
  // on such a terminal claim it had been truncated.
  const s = feedKeys("", "token\r\n");
  assert.equal(s.buf, "token");
  assert.equal(s.extra, "");
});

test("backspace deletes, and deleting past the start is harmless", () => {
  assert.equal(feedKeys("ab", DEL).buf, "a");
  assert.equal(feedKeys("", DEL).buf, "");
  assert.equal(feedKeys("ab", "\b").buf, "a");
});

test("Ctrl-C is reported as cancelled rather than swallowed into the value", () => {
  const s = feedKeys("abc", CTRL_C);
  assert.equal(s.cancelled, true);
});

test("control characters are dropped, not embedded in the secret", () => {
  // An arrow key is an escape sequence. Appending it would put invisible bytes
  // in the middle of a token that nothing can read back to diagnose.
  assert.equal(feedKeys("", `ab${ARROW_LEFT}cd`).buf, "abcd");
});

/* ---------------------------------------------------------------- the flags */

test("--only takes the next argument, or an = value", () => {
  assert.deepEqual(parseOnly(["--only", "A,B"]), ["A", "B"]);
  assert.deepEqual(parseOnly(["--only=A,B"]), ["A", "B"]);
  assert.deepEqual(parseOnly(["--only", " A , B "]), ["A", "B"]);
});

test("--only with nothing after it is an ERROR, not a silent all-secrets run", () => {
  // Left as "no --only at all", the script quietly falls through to prompting
  // for every unset required secret — eight invisible prompts for someone who
  // meant to replace one rotated credential.
  assert.throws(() => parseOnly(["--only"]), /needs a comma-separated/);
  assert.throws(() => parseOnly(["--only="]), /needs a comma-separated/);
  assert.throws(() => parseOnly(["--only", "--all"]), /needs a comma-separated/);
});

test("no --only at all is null, which is a different thing from empty", () => {
  assert.equal(parseOnly(["--all"]), null);
  assert.equal(parseOnly([]), null);
});
