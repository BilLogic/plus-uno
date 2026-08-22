// Both ways of saying yes must work, on the transcript that actually failed.
//
// Slack devoli/C0ARJ2A3A69 p1787296549114929, 2026-08-21: Bryan asked for a
// maintenance ticket, the bot drafted it in prose and asked for a thumbs up,
// Bryan typed "sure go ahead" — and the bot posted a SECOND confirmation. Two
// separate faults met there:
//
//   1. Nothing was staged during the prose round, so the deterministic branch
//      never ran (it is gated on a pending proposal). That is fixed by the
//      model staging the card directly — AGENT.md rule 4 — so by the time a
//      confirmation is typed there is always something pending.
//   2. Even with a proposal pending, "sure go ahead" would not have resolved:
//      the matcher required the whole message to equal one listed phrase, and
//      only "sure" and "go ahead" were listed, separately.
//
// This file pins the second half, plus the reaction path beside it, so the two
// cannot drift apart again. What it cannot reach is the Worker/DO wiring — see
// the plan's testing section.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { typedResolution, fastPathAllowed, requiresReaction } from "../src/agent/resolution";
import { mapReaction } from "../src/slack/gate-reactions";

/** The card the Worker posts once the model stages a notion_create. */
const PROPOSAL_CARD =
  ":warning: About to *create this card in Notion*:\n" +
  "• *Surface:* intake\n" +
  "• *Title:* uno-blueprint responses omitting confidence level\n" +
  "• *Suggested tier:* Tier 2\n" +
  'React :white_check_mark: / :x: — or just say "go ahead" / "cancel".';

describe("Bryan's confirmation, both ways", () => {
  it("resolves from the words he actually typed", () => {
    assert.equal(typedResolution("sure go ahead"), "confirm");
  });

  it("resolves from a check-mark reaction on the card", () => {
    assert.equal(mapReaction("white_check_mark"), "confirm");
  });

  it("does not let the card's own footer suppress the fast path", () => {
    // The footer names ✅ and ❌ and ends in a full stop. If it had carried two
    // question marks, the multi-question guard would have closed the text path
    // on every proposal — the guard has to coexist with the card, not fight it.
    assert.equal(fastPathAllowed(PROPOSAL_CARD), true);
  });

  it("lets a filed card be confirmed by text, since it can be deleted", () => {
    assert.equal(requiresReaction("notion_create"), false);
  });

  it("accepts the other ways people say the same thing", () => {
    for (const text of [
      "sure go ahead",
      "yes please",
      "go ahead",
      "yep",
      "ok do it",
      "sounds good",
      "lgtm",
      "👍",
    ]) {
      assert.equal(typedResolution(text), "confirm", text);
    }
  });

  it("still refuses the ones that are not a plain yes", () => {
    // Each of these would have executed the staged input verbatim, dropping
    // whatever the person actually asked for.
    for (const text of [
      "sure go ahead but make it Tier 1",
      "go ahead and also archive the old card",
      "no go ahead",
      "actually cancel",
    ]) {
      assert.equal(typedResolution(text), null, text);
    }
  });
});

describe("the two paths cannot both fire", () => {
  it("agrees on what confirm and cancel mean", () => {
    // The reaction path and the text path resolve the same proposal through
    // the same claim, so a disagreement about vocabulary would show up as one
    // path executing and the other reporting nothing happened.
    assert.equal(mapReaction("white_check_mark"), typedResolution("go ahead"));
    assert.equal(mapReaction("x"), typedResolution("cancel"));
  });

  it("keeps 👍 out of the reaction path but allows it typed", () => {
    // Deliberately asymmetric. As a REACTION, 👍 doubles as the answer
    // footer's feedback button, so it must not authorize a write. As a message
    // someone deliberately typed into a thread with a card in it, nothing else
    // in the product makes you do that.
    assert.equal(mapReaction("+1"), null);
    assert.equal(typedResolution("👍"), "confirm");
  });
});
