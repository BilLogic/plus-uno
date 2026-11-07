// Single proposal cards close in the same wording as report cards
// (render seam): an outcome in, the card's last line, its button and its
// pop-up head out. The gesture lines (`STALE_POST`, `SUPERSEDED_POST`,
// `EXPIRED_CARD`) stay as they were: only the line on the card changes.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  EXPIRED_CARD,
  EXPIRED_CARD_LINE,
  STALE_POST,
  SUPERSEDED_POST,
  cardNoteButton,
  cutOffCardLine,
  decidedCardLine,
  renderCardNote,
  renderGateNote,
} from "../src/slack/gate-note";
import { decidedCard, notedCardBlocks, proposalCardBlocks } from "../src/slack/proposal-render";
import { cardOutcome, outcomeHead } from "../src/slack/decision-head";

const BILL = "U03FYQJRQHX";
const AT = Date.UTC(2026, 9, 17, 14, 47); // Oct 17, 10:47 AM ET

/** The card's one button, by its words. */
function buttonOf(blocks: unknown[]): string | undefined {
  const row = (blocks as Array<{ block_id?: string; elements?: Array<{ text: { text: string } }> }>).find((b) => b.block_id === "uno_proposal_actions");
  return row?.elements?.[0]?.text.text;
}

describe("a single card's last line", () => {
  it("approved: Approved by <@who>", () => {
    assert.equal(decidedCardLine({ decision: "confirm", by: BILL }), `Approved by <@${BILL}>`);
  });
  it("rejected in the pop-up: Rejected by <@who>, the reason left to View", () => {
    assert.equal(decidedCardLine({ decision: "cancel", by: BILL, rejected: { reason: "wait for the copy" } }), `Rejected by <@${BILL}>`);
  });
  it("canceled by a ⛔: Canceled by <@who>, how to try again left to View", () => {
    assert.equal(decidedCardLine({ decision: "cancel", by: BILL }), `Canceled by <@${BILL}>`);
  });
  it("expired: Expired with no decision", () => {
    assert.equal(renderCardNote({ kind: "expired" }), EXPIRED_CARD_LINE);
    assert.equal(EXPIRED_CARD_LINE, "Expired with no decision");
  });
  it("replaced: Replaced by the new card's headline", () => {
    assert.equal(renderCardNote({ kind: "superseded", by: "Absence alerts v2" }), "Replaced by Absence alerts v2");
    assert.equal(renderCardNote({ kind: "superseded" }), "Replaced by a newer card");
  });
  it("cut off: Approved by <@who>, cut off", () => {
    assert.equal(cutOffCardLine(BILL), `Approved by <@${BILL}>, cut off`);
    assert.equal(cutOffCardLine(), "Approved, cut off");
  });
  it("keeps the gesture lines as they were", () => {
    assert.equal(renderGateNote({ kind: "expired" }), EXPIRED_CARD);
    assert.equal(renderGateNote({ kind: "superseded" }), SUPERSEDED_POST);
    assert.equal(renderGateNote({ kind: "already-resolved" }), STALE_POST);
  });
});

describe("a single card's button", () => {
  it("View decision once someone decided it", () => {
    const card = decidedCard({ proposalText: "Ready to create a Roadmap card" }, `Approved by <@${BILL}>`);
    assert.equal(buttonOf(card.blocks), "View decision");
    assert.equal(cardNoteButton({ kind: "already-resolved" }), "View decision");
  });
  it("View card when nobody did: expired or replaced", () => {
    assert.equal(cardNoteButton({ kind: "expired" }), "View card");
    assert.equal(cardNoteButton({ kind: "superseded", by: "x" }), "View card");
    assert.equal(buttonOf(notedCardBlocks({ text: "Ready to create a Roadmap card" }, EXPIRED_CARD_LINE, "View card")), "View card");
  });
  it("Review while the card can still be decided", () => {
    assert.equal(cardNoteButton({ kind: "not-a-confirmer", confirmers: [BILL] }), "Review");
    assert.equal(buttonOf(proposalCardBlocks("Ready to create a Roadmap card")), "Review");
  });
});

/** The head as read: alert, then each line, a pill as `@id`. */
function head(outcome: ReturnType<typeof cardOutcome>): string[] {
  return (outcomeHead(outcome) as Array<Record<string, any>>).map((b) => {
    if (b.type === "alert") return `[${b.level}] ${b.text.text}`;
    if (b.type === "divider") return "---";
    if (b.type === "section") return `next: ${b.text.text}`;
    const inner = b.elements[0];
    const words = inner.elements.map((e: Record<string, string>) => (e.type === "user" ? `@${e.user_id}` : e.text)).join("");
    return inner.type === "rich_text_quote" ? `> ${words}` : words;
  });
}

describe("a single card's View decision head", () => {
  const card = {};
  it("approved", () => {
    assert.deepEqual(head(cardOutcome({ decision: "confirm", by: BILL, at: AT }, card)), ["[success] Approved.", `Approved by @${BILL} on Oct 17 at 10:47 AM.`, "---"]);
  });
  it("rejected with a reason: quoted under who and when", () => {
    assert.deepEqual(head(cardOutcome({ decision: "cancel", by: BILL, at: AT, reason: "wait until the waitlist copy is final" }, card)), [
      "[info] Rejected. Nothing ran.",
      `Rejected by @${BILL} on Oct 17 at 10:47 AM:`,
      "> wait until the waitlist copy is final",
      "---",
    ]);
  });
  it("rejected with no reason reads as rejected when the card says so", () => {
    assert.equal(head(cardOutcome({ decision: "cancel", by: BILL, at: AT }, card, `Rejected by <@${BILL}>`))[0], "[info] Rejected. Nothing ran.");
  });
  it("canceled by a ⛔: says how to try again", () => {
    assert.deepEqual(head(cardOutcome({ decision: "cancel", by: BILL, at: AT }, card, `Canceled by <@${BILL}>`)), [
      "[info] Canceled. Nothing ran.",
      `Canceled by @${BILL} on Oct 17 at 10:47 AM.`,
      "next: To try again, say what to change in the thread.",
      "---",
    ]);
  });
  it("expired: no byline, and how to ask again", () => {
    assert.deepEqual(head(cardOutcome({ decision: "expired", at: AT }, card)), ["[warning] Expired. Nothing ran.", "next: Ask again in the thread for a fresh card.", "---"]);
  });
  it("replaced: no byline, and where to decide", () => {
    assert.deepEqual(head(cardOutcome({ decision: "replaced", by: BILL, at: AT }, card)), ["[warning] Replaced. Nothing ran.", "next: Decide on the newest card in this thread.", "---"]);
  });
  it("cut off: an error, and what to check", () => {
    assert.deepEqual(head(cardOutcome({ decision: "confirm", by: BILL, at: AT }, card, `Approved by <@${BILL}>, cut off`)), [
      "[error] Cut off before it reported back.",
      `Approved by @${BILL}, cut off on Oct 17 at 10:47 AM.`,
      "next: Check the thread for what finished before asking again.",
      "---",
    ]);
  });
});
