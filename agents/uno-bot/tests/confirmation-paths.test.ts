// The three deterministic ways to resolve a card agree with each other, and
// there is deliberately no fourth.
//
// Slack devoli/C0ARJ2A3A69 p1787296549114929, 2026-08-21: Bryan typed "sure go
// ahead" and the bot asked for confirmation a second time. The fix on the day
// was a wider phrase list. The fix on 2026-08-22 was to delete the phrase
// lists: a typed reply in words goes to the model, which reads it with the
// proposal in context and calls proposal_resolve. What this file pins is the
// part that stays deterministic — an emoji has exactly one meaning, whether
// it is reacted on the card, pressed as a button, or typed alone — and that
// nothing typed in words resolves without the model.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANCEL_REACTIONS,
  CONFIRM_REACTIONS,
  GATE_RESERVED,
  mapReaction,
  typedEmojiDecision,
} from "../src/slack/gate-reactions";

describe("a typed emoji is the reaction, typed", () => {
  it("confirms on the glyphs the card names", () => {
    for (const text of ["✅", "👍", "✔️", ":white_check_mark:", ":+1:", ":thumbsup:", " ✅ ", "✅✅"]) {
      assert.equal(typedEmojiDecision(text), "confirm", JSON.stringify(text));
    }
  });

  it("cancels on the glyphs the card names", () => {
    for (const text of ["⛔", "❌", "❎", "🚫", ":no_entry:", ":x:"]) {
      assert.equal(typedEmojiDecision(text), "cancel", JSON.stringify(text));
    }
  });

  it("tolerates a skin tone on the thumbs-up", () => {
    assert.equal(typedEmojiDecision("👍🏽"), "confirm");
  });

  it("agrees with the reaction path on every name", () => {
    assert.equal(mapReaction("white_check_mark"), typedEmojiDecision(":white_check_mark:"));
    assert.equal(mapReaction("no_entry"), typedEmojiDecision(":no_entry:"));
    assert.equal(mapReaction("+1"), typedEmojiDecision("👍"));
    assert.equal(mapReaction("x"), typedEmojiDecision("❌"));
  });
});

describe("words go to the model — always", () => {
  // Each of these used to resolve, or be reacted to, with no model call.
  // None of them may now. The model is the reader; this is the whole point.
  it("does not resolve a typed yes or no", () => {
    for (const text of [
      "yes", "sure go ahead", "ok", "sounds good", "lgtm", "go ahead",
      "no", "cancel", "nope", "stop", "never mind",
    ]) {
      assert.equal(typedEmojiDecision(text), null, text);
    }
  });

  it("does not resolve an emoji with words beside it", () => {
    // "👍 but rename it" is an amendment; executing the staged input verbatim
    // would drop the rename. Language goes to the model.
    for (const text of ["👍 but rename it", "✅ tier 1 please", "nice work 👍", "⛔ actually wait"]) {
      assert.equal(typedEmojiDecision(text), null, text);
    }
  });

  it("does not resolve a pleasantry", () => {
    for (const text of ["thanks", "thank you", "perfect", "got it", "🙏", "🎉"]) {
      assert.equal(typedEmojiDecision(text), null, text);
    }
  });

  it("does not resolve empty input", () => {
    for (const text of ["", "   ", "\n"]) {
      assert.equal(typedEmojiDecision(text), null, JSON.stringify(text));
    }
  });
});

describe("the gate's emoji are off-limits to the bot", () => {
  it("reserves exactly the union of the two sets", () => {
    for (const name of CONFIRM_REACTIONS) assert.ok(GATE_RESERVED.has(name), name);
    for (const name of CANCEL_REACTIONS) assert.ok(GATE_RESERVED.has(name), name);
    assert.equal(GATE_RESERVED.size, CONFIRM_REACTIONS.size + CANCEL_REACTIONS.size);
  });

  it("leaves the bot's own state signals free", () => {
    for (const name of ["eyes", "hourglass_flowing_sand", "warning", "handshake", "wave", "pray", "raised_hands"]) {
      assert.ok(!GATE_RESERVED.has(name), name);
    }
  });
});
