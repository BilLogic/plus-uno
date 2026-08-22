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

  it("cancels on ⛔ — the one the card names — and the crosses", () => {
    // `no_entry` (⛔, red circle with a white bar) is the card's cancel
    // gesture (user decision 2026-08-22); the crosses are accepted because
    // people reach for whichever is closest.
    assert.equal(mapReaction("no_entry"), "cancel");
    assert.equal(mapReaction("x"), "cancel");
    assert.equal(mapReaction("negative_squared_cross_mark"), "cancel");
    assert.equal(mapReaction("no_entry_sign"), "cancel");
  });

  // 👍 confirms again, and the round trip is the point. It was pulled on
  // 2026-08-21 because the answer footer put a 👍 BUTTON under every
  // substantive reply, so the gesture meant "that was useful" AND "write to
  // Notion". Retiring the footer buttons — and making a reaction resolve only
  // the proposal it is placed on — retired the collision instead of the
  // gesture.
  it("lets a thumbs-up confirm, now that it means nothing else", () => {
    assert.equal(mapReaction("+1"), "confirm");
    assert.equal(mapReaction("thumbsup"), "confirm");
  });

  // The invariant that keeps it safe. If 👍 is ever given a second job — a
  // feedback button, a poll, a reaction shortcut — it has to leave this set
  // the same day, because a confirmation gesture may mean exactly one thing.
  it("keeps the confirm set free of gestures the product uses elsewhere", () => {
    // 👎 is the one to watch: it was 👍's twin in the retired footer, and it
    // has never been a cancel. Cancelling is ❌.
    for (const name of ["-1", "thumbsdown", "eyes", "wave", "handshake"]) {
      assert.equal(mapReaction(name), null, `${name} must carry no decision`);
    }
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
