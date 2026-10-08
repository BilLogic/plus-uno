// The emoji counter both the draft judge and the fixed-copy guard read
// (`src/voice/emoji.ts`): what it counts as an emoji, and what it leaves as
// text.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { emojiIn, replyEmojiBreach } from "../src/voice/emoji";

describe("what counts as an emoji", () => {
  it("counts glyphs and shortcodes, in order", () => {
    assert.deepEqual(emojiIn(":tada: shipped ⚠️ and 🐐"), [":tada:", "⚠️", "🐐"]);
  });

  it("leaves the typographic symbols Unicode files as pictographic", () => {
    assert.deepEqual(emojiIn("PLUS® and Notion™ © 2026 ↔ ↩ ↪ ‼ ⁉ ℹ"), []);
  });

  it("still counts one of those drawn as an emoji", () => {
    assert.deepEqual(emojiIn("back ↩️"), ["↩️"]);
  });

  it("reads a shortcode only as a word of its own", () => {
    assert.deepEqual(emojiIn("a:b:c"), []);
    assert.deepEqual(emojiIn("key:value: pairs"), []);
    assert.deepEqual(emojiIn("at 10:30:00"), []);
    assert.deepEqual(emojiIn("done :rocket:, then"), [":rocket:"]);
  });

  it("does not hold a reply with a trademark to the budget", () => {
    assert.equal(replyEmojiBreach("Figma™ and Notion® are both linked."), null);
  });
});
