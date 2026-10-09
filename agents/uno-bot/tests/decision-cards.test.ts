// The shared decision card (render seam): a report's parent line and items
// in, Slack's blocks out, in every state a card can show. What a test checks
// is what a person would see — the parent line, one card per item, each
// card's words and buttons — and that Slack would take it
// (`tests/helpers/slack-block-rules.ts`).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DECISION_REVIEW_ACTION_PREFIX,
  MAX_REPORT_ITEMS,
  decisionReport,
  failureReason,
  itemProposal,
  itemText,
  reportMessage,
  reportRecord,
  reviewPressOf,
} from "../src/slack/decision-cards";
import { CONFIRM_FOOTER } from "../src/slack/proposal-render";
import { renderGateNote } from "../src/slack/gate-note";
import type { ReportItem, ReportItemState } from "../src/thread-state/index";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

const item = (n: number, over: Partial<ReportItem> = {}): ReportItem => ({
  id: `c${n}`,
  title: `Page ${n}`,
  subtitle: `<@U0OWNER${n}> · card comment`,
  body: `Page says ${n} · decision says ${n + 1}.`,
  open: { url: `https://www.notion.so/page${n}` },
  ...over,
});

type Card = {
  type: string;
  title?: { text: string };
  subtitle?: { text: string };
  body?: { text: string };
  actions?: Array<{ text: { text: string }; action_id?: string; value?: string; url?: string }>;
};

/** The cards a message shows, a lone card or a carousel's. */
function cardsOf(blocks: unknown[]): Card[] {
  return (blocks as Array<Card & { elements?: Card[] }>).flatMap((b) =>
    b.type === "carousel" ? b.elements! : b.type === "card" ? [b] : [],
  );
}

const labels = (card: Card) => card.actions!.map((a) => a.text.text);
const parentOf = (blocks: unknown[]) => (blocks[0] as { text: { text: string } }).text.text;

/** One item's card in a given state. */
function cardIn(state: ReportItemState, over: Partial<ReportItem> = {}): Card {
  const report = decisionReport([item(1, over)], "One page.");
  const record = reportRecord("C1", "1790000000.000100", report, 3_600_000);
  return cardsOf(reportMessage({ ...record, entries: [{ ...record.entries[0]!, state }] }).blocks)[0]!;
}

describe("the shared decision card", () => {
  it("posts one item as the parent line and one card with Review and Open", () => {
    const { blocks, shown, held } = decisionReport([item(1)], "A card comment settled something a page still states the old way.");
    assert.equal(messageBlocksRefusal(blocks), null);
    assert.equal(parentOf(blocks), "A card comment settled something a page still states the old way.");
    const [card] = cardsOf(blocks);
    assert.equal(blocks[1], card, "one item is a lone card, not a carousel");
    assert.equal(card!.title!.text, "Page 1");
    assert.equal(card!.subtitle!.text, "<@U0OWNER1> · card comment");
    assert.equal(card!.body!.text, "Page says 1 · decision says 2.");
    assert.deepEqual(labels(card!), ["Review", "Open"]);
    const [review, open] = card!.actions!;
    assert.equal(review!.action_id, `${DECISION_REVIEW_ACTION_PREFIX}c1`);
    assert.equal(open!.url, "https://www.notion.so/page1");
    assert.deepEqual([shown.length, held.length], [1, 0]);
  });

  it("posts several items as a carousel, each card reviewing only its own item", () => {
    const { blocks } = decisionReport([item(1), item(2), item(3)], "Three pages still state what their threads changed.");
    assert.equal(messageBlocksRefusal(blocks), null);
    assert.equal((blocks[1] as { type: string }).type, "carousel");
    assert.deepEqual(cardsOf(blocks).map((c) => c.actions![0]!.value), ["c1", "c2", "c3"]);
  });

  it("holds every card to Block Kit's limits: 3 buttons, a 150-char title, a 200-char body", () => {
    const long = item(1, {
      title: "T".repeat(400),
      subtitle: "S".repeat(400),
      body: "B".repeat(900),
      open: { label: "Open page", url: "https://www.notion.so/a" },
      also: { label: "Open DM", url: "https://slack.com/archives/D1/p1" },
    });
    const ten = Array.from({ length: MAX_REPORT_ITEMS }, (_, i) => (i === 0 ? long : item(i + 1)));
    const { blocks } = decisionReport(ten, "Ten.");
    assert.equal(messageBlocksRefusal(blocks), null);
    const [card] = cardsOf(blocks);
    assert.equal(card!.title!.text.length, 150);
    assert.equal(card!.subtitle!.text.length, 150);
    assert.equal(card!.body!.text.length, 200);
    assert.ok(card!.body!.text.endsWith("…"));
    assert.deepEqual(labels(card!), ["Review", "Open page", "Open DM"]);
  });

  it("shows ten and holds the rest, and the parent line counts the same set", () => {
    const all = Array.from({ length: 14 }, (_, i) => item(i + 1));
    const report = decisionReport(all, "Fourteen pages are behind.");
    assert.deepEqual(report.shown.map((i) => i.id), all.slice(0, 10).map((i) => i.id));
    assert.deepEqual(report.held.map((i) => i.id), ["c11", "c12", "c13", "c14"]);
    assert.equal(parentOf(report.blocks), "Fourteen pages are behind. Showing 10 of 14; the rest come in the next report.");
    assert.equal(cardsOf(report.blocks).length, 10);
    assert.equal(messageBlocksRefusal(report.blocks), null);
  });

  it("states the report in its text copy, item by item, with no instruction to type anything", () => {
    assert.equal(decisionReport([item(1), item(2)], "Two pages.").text, "Two pages.\n• Page 1: Page says 1 · decision says 2.\n• Page 2: Page says 2 · decision says 3.");
  });

  it("stages each item as its own proposal, keyed on its message, in its own slot", () => {
    assert.deepEqual(itemProposal("1790000000.000100", "c2"), {
      proposalTs: "1790000000.000100#c2",
      userMsgTs: "1790000000.000100",
      supersedeKey: "report-item:1790000000.000100:c2",
      item: { messageTs: "1790000000.000100", id: "c2" },
    });
    assert.equal(itemProposal("1790000000.000100", "c2~1").supersedeKey, "report-item:1790000000.000100:c2", "a revision shares its slot");
    assert.deepEqual(reviewPressOf("uno_decision_review:c2", "1790000000.000100"), {
      key: "1790000000.000100#c2",
      item: { messageTs: "1790000000.000100", id: "c2" },
    });
    assert.equal(reviewPressOf("uno_proposal_review", "1790000000.000100"), null, "a turn's card keeps its own Review");
  });
});

describe("what a card shows once decided", () => {
  // 2026-10-09 15:26 UTC is 11:26 ET.
  const AT = Date.UTC(2026, 9, 9, 15, 26);

  it("approved and written: who, when (ET), and what was written; View", () => {
    const card = cardIn({ kind: "approved", by: "U0BILL", at: AT }, { done: "the percentage is deleted." });
    assert.equal(card.subtitle!.text, "Approved by <@U0BILL> · written 11:26");
    assert.equal(card.body!.text, "Written: the percentage is deleted.");
    assert.deepEqual(labels(card), ["View", "Open"]);
    assert.equal(card.actions![0]!.action_id, `${DECISION_REVIEW_ACTION_PREFIX}c1`, "View opens the same item");
  });

  it("approved and not written: why, and nothing written", () => {
    const card = cardIn({ kind: "failed", by: "U0BILL", at: AT, reason: "the page changed since" });
    assert.equal(card.subtitle!.text, "Approved by <@U0BILL> · not written: the page changed since");
    assert.equal(card.body!.text, "Nothing written.");
    assert.deepEqual(labels(card), ["View", "Open"]);
  });

  it("rejected: who, and the reason in the body when given", () => {
    const card = cardIn({ kind: "rejected", by: "U0BILL", reason: "deliberate, the library is ahead" });
    assert.equal(card.subtitle!.text, "Rejected by <@U0BILL>");
    assert.equal(card.body!.text, "Nothing written. Reason: deliberate, the library is ahead");
    assert.equal(cardIn({ kind: "rejected", by: "U0BILL" }).body!.text, "Nothing written.");
  });

  it("closed with no decision; View", () => {
    const card = cardIn({ kind: "expired" });
    assert.equal(card.subtitle!.text, "Closed, no decision");
    assert.deepEqual(labels(card), ["View", "Open"]);
  });

  it("changes asked: who asked, and Review stays", () => {
    const card = cardIn({ kind: "changes-asked", by: "U0A" });
    assert.equal(card.subtitle!.text, "Changes asked by <@U0A>");
    assert.deepEqual(labels(card), ["Review", "Open"]);
  });

  it("never staged: says so, and offers nothing to review", () => {
    const card = cardIn({ kind: "not-staged", note: "Didn't go through, so it's queued again for tomorrow morning." });
    assert.equal(card.subtitle!.text, "Didn't go through, so it's queued again for tomorrow morning.");
    assert.deepEqual(labels(card), ["Open"]);
  });

  it("keeps the whole reason for View, past what the card's body holds", () => {
    const reason = "R".repeat(400);
    const record = reportRecord("C1", "1790000000.000100", decisionReport([item(1)], "One."), 3_600_000);
    const rejected = { ...record, entries: [{ ...record.entries[0]!, state: { kind: "rejected" as const, by: "U0BILL", reason } }] };
    assert.equal(cardsOf(reportMessage(rejected).blocks)[0]!.body!.text.length, 200);
    assert.equal(itemText(rejected, "c1"), `Page 1\nRejected by <@U0BILL>\nNothing written. Reason: ${reason}`);
    assert.equal(itemText(rejected, "c9"), null);
  });

  it("says why a write failed without the emoji its line led with, shortcode or character", () => {
    assert.equal(failureReason(":x: The page changed since the read."), "The page changed since the read");
    assert.equal(failureReason("❌ The page changed since the read."), "The page changed since the read");
    assert.equal(failureReason("✏️ Updated"), "Updated");
  });
});

describe("shared gate copy", () => {
  it("teaches no ✅/⛔ footer and no typed gate word", () => {
    const lines = [
      CONFIRM_FOOTER,
      decisionReport([item(1), item(2)], "Two pages.").text,
      renderGateNote({ kind: "not-on-the-card", toolName: "notion_update", glyph: "white_check_mark", userId: "U1" }),
      renderGateNote({ kind: "not-on-the-card", toolName: "notion_update", glyph: "white_check_mark", userId: "U1", stated: true }),
      renderGateNote({ kind: "which-card", count: 2 }),
      renderGateNote({ kind: "review-only" }),
    ];
    for (const line of lines) {
      assert.doesNotMatch(line, /white_check_mark:? (applies|writes|files)|:no_entry: (drops|files)|✅|⛔|\bdrop \d|\bdrop N\b|\bskip\b|"yes"|\breact\b/i, line);
    }
  });
});
