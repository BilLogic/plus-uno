// The shared decision card: the one shape every report that asks someone to
// decide posts in. A plain parent line, then one `card` per item — a carousel
// when there are several, at most `MAX_REPORT_ITEMS` — each with Review, which
// opens that item's own proposal in the Review pop-up, and Open, its source.
//
// A REPORT SUPPLIES ITS ITEMS AND ITS PARENT LINE, nothing else. The buttons,
// the clipping to Block Kit's limits, the held-back line and the decided state
// are this module's, so every report reads alike and none of them teaches a
// gate of its own: no ✅/⛔ footer, nothing to type.
//
// ONE PROPOSAL PER ITEM. Each item is staged on its own, keyed by the message
// it sits in and its id (`itemProposalKey`), so the Gate's one-winner claim,
// confirmers, TTL and supersession hold per item. Review's action id carries
// the item (`DECISION_REVIEW_ACTION_PREFIX`), and `slack/interactive.ts` turns
// a press into that key. A decision edits only its own card: its subtitle
// says who decided and Review becomes View (`decidedItemBlocks`, through
// `proposal-render.ts` `notedCardBlocks`), and the edit lands on the message
// as it stands then (`withItemCardFrom`), so items decided one after another
// each keep their own state.
//
// Pure: no Env, no client.

import { carouselOf, logoFor } from "./answer-cards-block";
import { textSections } from "./render";
import { itemProposalKey } from "../thread-state/index";

export { cardMessageTs, itemOfKey, itemProposalKey } from "../thread-state/index";

/** A report's cards: Slack's carousel holds 1 to 10. The rest wait for the
 *  report's next run, wherever that report keeps its queue. */
export const MAX_REPORT_ITEMS = 10;

/** Each card's Review (View once decided) action id: this, then the item id —
 *  unique within the message, as Slack asks of action ids. */
export const DECISION_REVIEW_ACTION_PREFIX = "uno_decision_review:";

/** Slack's limits on a card's words (`card` block reference). */
export const CARD_TITLE_CHARS = 150;
export const CARD_BODY_CHARS = 200;

/** One item a report asks someone to decide. */
export interface DecisionItem {
  /** Stable within the report: Review's value, and the second half of its
   *  proposal's key. No `#`. */
  id: string;
  /** The page, file, component or comment the item is about. Plain text,
   *  clipped to 150. */
  title: string;
  /** Who and where — owner · source — as mrkdwn, so a `<@U…>` mention
   *  resolves. Clipped to 150. Replaced by the decision once decided. */
  subtitle?: string;
  /** What changes, plain: "Page says X · decision says Y". Clipped to 200;
   *  the whole text belongs in the item's proposal, which the pop-up shows. */
  body: string;
  /** The item's source. Label defaults to "Open". */
  open: { label?: string; url: string };
  /** A second source, as the card's third button. */
  also?: { label: string; url: string };
}

/** A report: its parent line, its items, and how many more are held back. */
export interface DecisionReport {
  /** What the job found, in one plain sentence: no emoji, no mark, no
   *  instructions — the buttons are the instructions. mrkdwn. */
  parent: string;
  /** 0 to `MAX_REPORT_ITEMS`; `heldBack` splits a longer list. */
  items: DecisionItem[];
  /** Items past these, waiting for the next report: the parent says so. */
  held?: number;
}

const plain = (text: string) => ({ type: "plain_text", text });

/** Text cut to `max`, its last character an ellipsis when cut. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

/** The items a report shows, and the ones that wait for its next run. */
export function heldBack<T>(items: readonly T[]): { shown: T[]; held: T[] } {
  return { shown: items.slice(0, MAX_REPORT_ITEMS), held: items.slice(MAX_REPORT_ITEMS) };
}

/** The parent line, with the held-back count when there is one. */
function parentLine(report: DecisionReport): string {
  const held = report.held ?? 0;
  if (!held) return report.parent;
  const shown = report.items.length;
  return `${report.parent} Showing ${shown} of ${shown + held}; the rest come in the next report.`;
}

/** One item's card. */
function itemCard(item: DecisionItem): Record<string, unknown> {
  const logo = logoFor(item.open.url);
  return {
    type: "card",
    icon: { type: "image", image_url: logo.url, alt_text: logo.name },
    title: plain(clip(item.title, CARD_TITLE_CHARS) || "untitled"),
    ...(item.subtitle ? { subtitle: { type: "mrkdwn", text: clip(item.subtitle, CARD_TITLE_CHARS) } } : {}),
    body: plain(clip(item.body, CARD_BODY_CHARS) || " "),
    actions: [
      { type: "button", action_id: `${DECISION_REVIEW_ACTION_PREFIX}${item.id}`, text: plain("Review"), value: item.id },
      { type: "button", text: plain(item.open.label ?? "Open"), url: item.open.url },
      ...(item.also ? [{ type: "button", text: plain(item.also.label), url: item.also.url }] : []),
    ],
  };
}

/**
 * A report's blocks: its parent line, then its items as one card or a
 * carousel. A report with no items is its parent line alone.
 *
 * @param report - The parent line and the items, at most `MAX_REPORT_ITEMS`
 */
export function decisionReportBlocks(report: DecisionReport): unknown[] {
  if (report.items.length > MAX_REPORT_ITEMS) {
    throw new Error(`a decision report holds at most ${MAX_REPORT_ITEMS} items; hold the rest back (heldBack)`);
  }
  const head = textSections(parentLine(report));
  return report.items.length ? [...head, carouselOf(report.items.map(itemCard))] : head;
}

/** A report as text: Slack's notification and fallback copy. */
export function decisionReportText(report: DecisionReport): string {
  return [parentLine(report), ...report.items.map((i) => `• ${clip(i.title, CARD_TITLE_CHARS)}: ${i.body}`)].join("\n");
}

// ── One item's proposal ──────────────────────────────────────────────────────

/** The proposal a press on an item's Review (or View) is about, or null for
 *  any other button. */
export function reviewKeyOf(actionId: string, messageTs: string): string | null {
  if (!actionId.startsWith(DECISION_REVIEW_ACTION_PREFIX)) return null;
  const itemId = actionId.slice(DECISION_REVIEW_ACTION_PREFIX.length);
  return itemId ? itemProposalKey(messageTs, itemId) : null;
}

type CardShape = { type?: string; elements?: unknown[]; actions?: unknown[]; title?: { text?: string }; subtitle?: { text?: string }; body?: { text?: string } };

/** Whether a card is the one item's: its Review carries the item's action id. */
function isItemCard(card: unknown, itemId: string): boolean {
  const actions = (card as CardShape | null)?.actions ?? [];
  return actions.some((a) => (a as { action_id?: string }).action_id === `${DECISION_REVIEW_ACTION_PREFIX}${itemId}`);
}

/** Every card in a message, with how to put one back in its place. */
function mapCards(blocks: readonly unknown[], edit: (card: CardShape) => CardShape): unknown[] {
  return blocks.map((block) => {
    const b = block as CardShape;
    if (b?.type === "carousel") return { ...b, elements: (b.elements ?? []).map((c) => edit(c as CardShape)) };
    if (b?.type === "card") return edit(b);
    return block;
  });
}

/** The cards of a message, a lone card or a carousel's. */
function cardsIn(blocks: readonly unknown[]): CardShape[] {
  return (blocks as CardShape[]).flatMap((b) => (b?.type === "carousel" ? ((b.elements ?? []) as CardShape[]) : b?.type === "card" ? [b] : []));
}

/** Whether a message's blocks hold this item's card. */
export function holdsItem(blocks: readonly unknown[], itemId: string): boolean {
  return cardsIn(blocks).some((c) => isItemCard(c, itemId));
}

/**
 * A message with one item's card decided: its subtitle the decision, plain —
 * the note's last line without a leading emoji — and its Review labelled
 * `button`. Every other card stays as it is.
 *
 * @param blocks - The message as posted
 * @param itemId - The decided item
 * @param note - The outcome, mrkdwn; its last line is what the card says
 * @param button - View once decided, Review while it can still be decided
 */
export function decidedItemBlocks(blocks: readonly unknown[], itemId: string, note: string, button: "Review" | "View"): unknown[] {
  const last = note.split("\n").filter((l) => l.trim()).at(-1) ?? "";
  const line = clip(last.replace(/^:[a-z0-9_+-]+:\s*/, ""), CARD_TITLE_CHARS);
  return mapCards(blocks, (card) => {
    if (!isItemCard(card, itemId)) return card;
    const actions = (card.actions ?? []).map((a) => {
      const action = a as { action_id?: string; text?: unknown };
      return action.action_id?.startsWith(DECISION_REVIEW_ACTION_PREFIX) ? { ...action, text: plain(button) } : a;
    });
    return { ...card, ...(line ? { subtitle: { type: "mrkdwn", text: line } } : {}), actions };
  });
}

/**
 * The message as it stands now with one item's card taken from `updated`:
 * how a decision lands without undoing another item decided since the
 * decider's record was written. A message without the card is left alone.
 *
 * @param current - The message's blocks as Slack holds them now
 * @param updated - Blocks holding the item's card as it should read
 * @param itemId - The item
 */
export function withItemCardFrom(current: readonly unknown[], updated: readonly unknown[], itemId: string): unknown[] {
  const card = cardsIn(updated).find((c) => isItemCard(c, itemId));
  if (!card) return [...current];
  return mapCards(current, (c) => (isItemCard(c, itemId) ? card : c));
}

/** One item's words off its message — title, subtitle and body — for View
 *  once its proposal is gone; null when the message has no such card. */
export function itemCardText(blocks: readonly unknown[], itemId: string): string | null {
  const card = cardsIn(blocks).find((c) => isItemCard(c, itemId));
  if (!card) return null;
  return [card.title?.text, card.subtitle?.text, card.body?.text].filter(Boolean).join("\n");
}
