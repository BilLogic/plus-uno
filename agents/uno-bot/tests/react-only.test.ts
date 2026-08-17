import { test } from "node:test";
import assert from "node:assert/strict";
import { reactOnlyEmoji } from "../src/slack/react-only";

test("bare acknowledgements get an emoji", () => {
  for (const ack of ["thanks", "Thanks!", "ty", "got it", "perfect", "Nice work.", "noted"]) {
    assert.notEqual(reactOnlyEmoji(ack), null, ack);
  }
});

test("emoji-only messages count as acknowledgements", () => {
  assert.notEqual(reactOnlyEmoji(":thumbsup:"), null);
  assert.notEqual(reactOnlyEmoji("🙏"), null);
});

// The whole design rests on this: anything outside the closed set takes the
// ordinary path. A false positive here is the 👀-then-silence failure.
test("anything that could be a question or an instruction takes the model path", () => {
  for (const real of [
    "thanks — can you also check the Roadmap?",
    "got it, now file the card",
    "perfect, what about accessibility?",
    "nice — where are the docs?",
    "thanks?",
    "ok so what happened to the badge component",
    "is this still true",
  ]) {
    assert.equal(reactOnlyEmoji(real), null, real);
  }
});

test("proposal-decision vocabulary is never in the closed set", () => {
  // These are CONFIRM_PHRASES / CANCEL_PHRASES in loop-shared. Reacting to one
  // would leave a proposal card unresolved and the person waiting.
  for (const decision of ["yes", "sure", "do it", "go ahead", "ship it", "confirm", "lgtm", "no", "cancel", "stop"]) {
    assert.equal(reactOnlyEmoji(decision), null, decision);
  }
});

test("long text is never an acknowledgement", () => {
  assert.equal(reactOnlyEmoji("thanks ".repeat(20)), null);
});
