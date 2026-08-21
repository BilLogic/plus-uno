// The reaction vocabulary is the outer wall of the confirmation gate: whatever
// is in CONFIRM_REACTIONS can, by itself, cause an irreversible Notion write.
// The rejection cases below matter more than the accepting ones.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapReaction, CONFIRM_REACTIONS } from "../src/slack/gate-reactions";

describe("gate reactions", () => {
  it("confirms on the check marks", () => {
    assert.equal(mapReaction("white_check_mark"), "confirm");
    assert.equal(mapReaction("heavy_check_mark"), "confirm");
  });

  it("cancels on the crosses", () => {
    assert.equal(mapReaction("x"), "cancel");
    assert.equal(mapReaction("negative_squared_cross_mark"), "cancel");
    assert.equal(mapReaction("no_entry_sign"), "cancel");
  });

  // The one that matters. 👍 was a confirm reaction until 2026-08-21, while the
  // answer footer shipped a 👍 button on every substantive reply and the bot's
  // own proposal copy asked people for "the thumbs up". Three meanings, one
  // gesture, and one of them wrote to Notion.
  it("does not let a thumbs-up authorize anything", () => {
    for (const name of ["+1", "thumbsup", "thumbsup_all", "+1::skin-tone-2"]) {
      assert.equal(
        mapReaction(name),
        null,
        `${name} must not resolve a proposal — the footer trains this gesture as feedback`,
      );
    }
    assert.equal(CONFIRM_REACTIONS.has("+1"), false);
    assert.equal(CONFIRM_REACTIONS.has("thumbsup"), false);
  });

  it("ignores ordinary reactions", () => {
    for (const name of ["eyes", "tada", "heart", "rocket", "wave", "handshake", ""]) {
      assert.equal(mapReaction(name), null, `${name} should carry no decision`);
    }
  });

  it("keeps confirm and cancel disjoint", () => {
    // A name in both sets would resolve as whichever branch is checked first —
    // a coin flip on an irreversible action.
    for (const name of CONFIRM_REACTIONS) {
      assert.equal(mapReaction(name), "confirm");
    }
  });

  it("matches exactly, never by prefix", () => {
    // Slack sends the emoji name without colons; a near-miss must not resolve.
    for (const name of [":white_check_mark:", "white_check_mark ", "WHITE_CHECK_MARK"]) {
      assert.equal(mapReaction(name), null, `${name} is not the canonical name`);
    }
  });
});
