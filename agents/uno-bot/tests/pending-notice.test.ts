// Proposal B: does the reply say anything about the card still sitting there?
//
// The bias here is the whole design. A false "addressed" costs one missing log
// line; a false "unaddressed" inflates the rate this exists to measure and
// makes the number worthless — and the number is the point, because a visible
// bounce notice will be built on it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bounceLogLine, proposalWasAddressed } from "../src/agent/pending-notice";

describe("a reply that addresses the pending proposal", () => {
  it("counts gate vocabulary, whatever the tool", () => {
    for (const reply of [
      "I've staged that card — approve when you're ready.",
      "Still have it pending on your side.",
      "Say go ahead and I'll file it.",
      "Want me to cancel that one first?",
      "It's waiting on you above.",
    ]) {
      assert.equal(proposalWasAddressed(reply, "notion_create"), true, reply);
    }
  });

  it("counts the tool's own noun, which is how people actually write", () => {
    assert.equal(proposalWasAddressed("The card covers the reconfirm step.", "notion_create"), true);
    assert.equal(proposalWasAddressed("That email is ready to go.", "email_send"), true);
    assert.equal(proposalWasAddressed("The prototype would need the PRD first.", "prototype_scaffold"), true);
    assert.equal(proposalWasAddressed("I'd share that for feedback once it's ready.", "shareout_post"), true);
  });
});

describe("a reply that walks away from it", () => {
  it("is the bounce — an answer about something else entirely", () => {
    // The 2026-07-10 shape: the person said yes, the model answered adjacent,
    // and nothing anywhere recorded that the approval went nowhere.
    const reply =
      "The reconfirmation step sits under Standard Scheduling — I checked the " +
      "blueprint just now. It's owned by the Ops lane at the day-of column.";
    assert.equal(proposalWasAddressed(reply, "email_send"), false);
  });

  it("treats an empty reply as unaddressed", () => {
    assert.equal(proposalWasAddressed("", "notion_create"), false);
    assert.equal(proposalWasAddressed("   ", "notion_create"), false);
  });

  it("does not credit a noun belonging to a different tool", () => {
    // "email" says nothing about a staged Notion card.
    assert.equal(proposalWasAddressed("I'll email Alex about it.", "notion_create"), false);
  });

  it("matches whole words only — 'reconfirmation' is not 'confirm'", () => {
    // The regression this codebase would actually hit: the reconfirmation flow
    // is the most-discussed subject here, so a substring match would mark
    // almost every blueprint answer as addressed and zero out the rate.
    const reply = "The reconfirmation step sits under Standard Scheduling.";
    assert.equal(proposalWasAddressed(reply, "email_send"), false, reply);
    assert.equal(proposalWasAddressed("please confirm that", "email_send"), true);
  });

  it("is case-insensitive", () => {
    assert.equal(proposalWasAddressed("STAGED and waiting", "email_send"), true);
  });

  it("falls back to gate words for a tool it has no nouns for", () => {
    assert.equal(proposalWasAddressed("nothing relevant here", "some_new_tool"), false);
    assert.equal(proposalWasAddressed("it is still pending", "some_new_tool"), true);
  });
});

describe("the log line", () => {
  it("names the tool and carries both sides, clipped", () => {
    const line = bounceLogLine("notion_create", "go ahead", "Sure — here's the lane breakdown.");
    assert.match(line, /^\[gate\] pending notion_create UNADDRESSED/);
    assert.ok(line.includes('user="go ahead"'), line);
    assert.ok(line.includes("lane breakdown"), line);
  });

  it("collapses newlines so one bounce is one grep-able line", () => {
    const line = bounceLogLine("email_send", "yes\n\ndo it", "a\nb\nc");
    assert.equal(line.includes("\n"), false, line);
  });

  it("clips a long reply rather than flooding the log", () => {
    const line = bounceLogLine("email_send", "x".repeat(400), "y".repeat(400));
    // 800 chars of input in, a bounded line out.
    assert.ok(line.length < 400, `line was ${line.length} chars`);
  });
});
