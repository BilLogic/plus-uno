// The shared decision card (render seam): a report's parent line and items in,
// Slack's blocks out. What a test checks is what a person would see — the
// parent line, one card per item, each card's Review and Open — and that
// Slack would take it (`tests/helpers/slack-block-rules.ts`).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DECISION_REVIEW_ACTION_PREFIX,
  MAX_REPORT_ITEMS,
  decisionReportBlocks,
  decisionReportText,
  heldBack,
  itemCardText,
  itemOfKey,
  itemProposalKey,
  withItemCardFrom,
  type DecisionItem,
} from "../src/slack/decision-cards";
import { notedCardBlocks } from "../src/slack/proposal-render";
import { CONFIRM_FOOTER } from "../src/slack/proposal-render";
import { renderGateNote } from "../src/slack/gate-note";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

const item = (n: number, over: Partial<DecisionItem> = {}): DecisionItem => ({
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

describe("the shared decision card", () => {
  it("posts one item as the parent line and one card with Review and Open", () => {
    const blocks = decisionReportBlocks({ parent: "A card comment settled something a page still states the old way.", items: [item(1)] });
    assert.equal(messageBlocksRefusal(blocks), null);
    assert.equal((blocks[0] as { text: { text: string } }).text.text, "A card comment settled something a page still states the old way.");
    const [card] = cardsOf(blocks);
    assert.equal(blocks[1], card, "one item is a lone card, not a carousel");
    assert.equal(card!.title!.text, "Page 1");
    assert.equal(card!.subtitle!.text, "<@U0OWNER1> · card comment");
    assert.equal(card!.body!.text, "Page says 1 · decision says 2.");
    assert.deepEqual(labels(card!), ["Review", "Open"]);
    const [review, open] = card!.actions!;
    assert.equal(review!.action_id, `${DECISION_REVIEW_ACTION_PREFIX}c1`);
    assert.equal(review!.value, "c1");
    assert.equal(open!.url, "https://www.notion.so/page1");
  });

  it("posts several items as a carousel, each card reviewing only its own item", () => {
    const blocks = decisionReportBlocks({ parent: "Three pages still state what their threads changed.", items: [item(1), item(2), item(3)] });
    assert.equal(messageBlocksRefusal(blocks), null);
    assert.equal((blocks[1] as { type: string }).type, "carousel");
    assert.deepEqual(cardsOf(blocks).map((c) => c.actions![0]!.value), ["c1", "c2", "c3"]);
  });

  it("holds every card to Block Kit's limits: 3 buttons, a 150-char title, a 200-char body, 10 cards", () => {
    const long = item(1, {
      title: "T".repeat(400),
      subtitle: "S".repeat(400),
      body: "B".repeat(900),
      open: { label: "Open page", url: "https://www.notion.so/a" },
      also: { label: "Open DM", url: "https://slack.com/archives/D1/p1" },
    });
    const ten = Array.from({ length: MAX_REPORT_ITEMS }, (_, i) => (i === 0 ? long : item(i + 1)));
    const blocks = decisionReportBlocks({ parent: "Ten.", items: ten });
    assert.equal(messageBlocksRefusal(blocks), null);
    const [card] = cardsOf(blocks);
    assert.equal(card!.title!.text.length, 150);
    assert.equal(card!.subtitle!.text.length, 150);
    assert.equal(card!.body!.text.length, 200);
    assert.ok(card!.body!.text.endsWith("…"));
    assert.deepEqual(labels(card!), ["Review", "Open page", "Open DM"]);
    assert.throws(() => decisionReportBlocks({ parent: "Eleven.", items: [...ten, item(11)] }), /at most 10/);
  });

  it("holds back what passes ten, and the parent line says how many wait", () => {
    const all = Array.from({ length: 14 }, (_, i) => item(i + 1));
    const { shown, held } = heldBack(all);
    assert.deepEqual(shown.map((i) => i.id), all.slice(0, 10).map((i) => i.id));
    assert.deepEqual(held.map((i) => i.id), ["c11", "c12", "c13", "c14"]);
    const blocks = decisionReportBlocks({ parent: "Fourteen pages are behind.", items: shown, held: held.length });
    assert.equal((blocks[0] as { text: { text: string } }).text.text, "Fourteen pages are behind. Showing 10 of 14; the rest come in the next report.");
    assert.equal(cardsOf(blocks).length, 10);
  });

  it("states the report in its text copy, item by item, with no instruction to type anything", () => {
    const text = decisionReportText({ parent: "Two pages.", items: [item(1), item(2)] });
    assert.equal(text, "Two pages.\n• Page 1: Page says 1 · decision says 2.\n• Page 2: Page says 2 · decision says 3.");
  });

  it("keys each item's proposal on its message and its own id", () => {
    const key = itemProposalKey("1790000000.000100", "c2");
    assert.deepEqual(itemOfKey(key), { messageTs: "1790000000.000100", itemId: "c2" });
    assert.equal(itemOfKey("1790000000.000100"), null, "a card's own ts is no item");
  });
});

describe("a decided item", () => {
  const posted = () => decisionReportBlocks({ parent: "Three pages.", items: [item(1), item(2), item(3)] });

  it("says who decided where its subtitle was, and its Review becomes View; the others stay as they were", () => {
    const before = posted();
    const after = notedCardBlocks({ text: "(text)", blocks: before }, ":white_check_mark: Approved by <@U0BILL>", "View", "c2");
    assert.equal(messageBlocksRefusal(after), null);
    const [one, two, three] = cardsOf(after);
    assert.equal(two!.subtitle!.text, "Approved by <@U0BILL>");
    assert.deepEqual(labels(two!), ["View", "Open"]);
    assert.equal(two!.actions![0]!.action_id, `${DECISION_REVIEW_ACTION_PREFIX}c2`, "View opens the same item");
    assert.deepEqual([one, three], [cardsOf(before)[0], cardsOf(before)[2]]);
    assert.equal(after.length, before.length, "no note line under the carousel");
  });

  it("names the decision, not the edit line above it, and a card still live keeps Review", () => {
    const after = notedCardBlocks({ text: "", blocks: posted() }, "Edited by <@U0A>: Status\n:pencil2: Needs changes, asked by <@U0A>.", "Review", "c1");
    const [one] = cardsOf(after);
    assert.equal(one!.subtitle!.text, "Needs changes, asked by <@U0A>.");
    assert.deepEqual(labels(one!), ["Review", "Open"]);
  });

  it("is edited into the message as it stands now, so another item decided meanwhile keeps its state", () => {
    const live = notedCardBlocks({ text: "", blocks: posted() }, "Approved by <@U0A>", "View", "c1");
    // Item 3's record still holds the blocks as first posted.
    const stale = notedCardBlocks({ text: "", blocks: posted() }, "Rejected by <@U0B>", "View", "c3");
    const merged = withItemCardFrom(live, stale, "c3");
    const cards = cardsOf(merged);
    assert.equal(cards[0]!.subtitle!.text, "Approved by <@U0A>");
    assert.equal(cards[2]!.subtitle!.text, "Rejected by <@U0B>");
  });

  it("reads back one item's words, for View once its proposal is gone", () => {
    assert.equal(itemCardText(posted(), "c2"), "Page 2\n<@U0OWNER2> · card comment\nPage says 2 · decision says 3.");
    assert.equal(itemCardText(posted(), "c9"), null);
  });
});

describe("shared gate copy", () => {
  it("teaches no ✅/⛔ footer and no typed gate word", () => {
    const lines = [
      CONFIRM_FOOTER,
      decisionReportText({ parent: "Two pages.", items: [item(1), item(2)] }),
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
