// When a card expires, as Slack shows it (#1316).
//
// Every proposal card, and every message whose buttons the bot asks someone
// to press, says when it stops taking an answer. The deadline itself comes
// from the one rule (`card-expiry.ts` `cardExpiresAt`); this is only how it
// reads.
//
// SLACK'S DATE MARKUP, SO EACH READER SEES THEIR OWN TIMEZONE. The line is
// `Expires <!date^…^{date_short_pretty}|…> at <!date^…^{time}|…>`: Slack
// renders each token in the reader's own zone ("Expires tomorrow at 2:00
// PM"), and wherever it cannot — a notification, a client that does not
// parse it, the plain-text Review pop-up (`toPlainText` keeps the label) —
// the fallback reads in ET: "Expires Tue, Oct 13 at 2:00 PM ET". Two tokens
// rather than one format with a space in it, because the markup sanitizer
// keeps a `<!date^…>` only when its format has no whitespace
// (`mrkdwn.ts` `validMarkup`), and a token it escaped would show as text.
//
// THE LINE RIDES IN THE CARD'S TEXT. A text-only card is redrawn from its
// text on every edit (`proposal-render.ts` `proposalCardBlocks`), so the
// deadline is the text copy's last line, where the redraw finds it again
// (`splitDeadline`) and shows it as the card's own context line while the
// card can still be decided. A card posted with blocks of its own carries the
// line as a context block of its own (`deadlineBlock`), which every note
// edited onto the card takes off (`isDeadlineBlock`): a decided or expired
// card says its outcome, not a deadline that no longer applies.
//
// Env-free: it formats, and posts nothing.

import { cardExpiresAt } from "../card-expiry";

/** Each piece of the ET fallback, read in New York's wall clock. ICU writes
 *  the space before AM/PM as a narrow no-break space; `et` makes it plain. */
const ET_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
});
const ET_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
});

function et(format: Intl.DateTimeFormat, at: Date): string {
  return format.format(at).replace(/\s/g, " ");
}

/** The block id a card's own deadline line carries, so a note finds it. */
export const DEADLINE_BLOCK_ID = "uno_card_deadline";

/** The deadline line, as `deadlineLine` writes it: its epoch, read back. */
const DEADLINE_LINE = /^Expires <!date\^(\d+)\^\{date_short_pretty\}\|[^>]*> at <!date\^\1\^\{time\}\|[^>]*>$/;

/**
 * A deadline as a card says it, mrkdwn: in each reader's timezone where Slack
 * renders it, and in ET wherever it falls back.
 *
 * @param expiresAt - The card's deadline, epoch ms (`cardExpiresAt`)
 */
export function deadlineLine(expiresAt: number): string {
  const at = new Date(expiresAt);
  const unix = Math.floor(expiresAt / 1000);
  return (
    `Expires <!date^${unix}^{date_short_pretty}|${et(ET_DATE, at)}>` +
    ` at <!date^${unix}^{time}|${et(ET_TIME, at)} ET>`
  );
}

/**
 * A card's text with its deadline line written as its last line.
 *
 * @param text - The card's text copy
 * @param expiresAt - Its deadline, epoch ms; absent, the text is unchanged
 */
export function withDeadline(text: string, expiresAt: number | undefined): string {
  return expiresAt === undefined ? text : `${text}\n${deadlineLine(expiresAt)}`;
}

/**
 * A card's text without its deadline line, and the line itself when it had
 * one — what a redraw from the text shows apart from the draft.
 *
 * @param text - The card's text copy
 */
export function splitDeadline(text: string): { text: string; deadline?: string } {
  const at = text.lastIndexOf("\n");
  const last = text.slice(at + 1);
  if (!DEADLINE_LINE.test(last)) return { text };
  return { text: at === -1 ? "" : text.slice(0, at), deadline: last };
}

/**
 * The deadline line as a context block of its own, for a card posted with
 * blocks of its own.
 *
 * @param expiresAt - The card's deadline, epoch ms
 */
export function deadlineBlock(expiresAt: number): unknown {
  return deadlineContext(deadlineLine(expiresAt));
}

/** A deadline line already written, as the card's context block. */
export function deadlineContext(line: string): unknown {
  return { type: "context", block_id: DEADLINE_BLOCK_ID, elements: [{ type: "mrkdwn", text: line }] };
}

/** Whether a block is a card's deadline line (`deadlineBlock`). */
export function isDeadlineBlock(block: unknown): boolean {
  return (block as { block_id?: string } | null)?.block_id === DEADLINE_BLOCK_ID;
}

/**
 * A card the Worker posts now, with the deadline it says and the lifetime it
 * is staged with, both from ONE reading of the clock: the one rule's from
 * `now`, unless the card names its own. Stage it with `ttlMs` — the store
 * counts it from its own clock a hop later, so the card lives those few
 * milliseconds past what it says and never a day past it, as stamping the
 * rule from the store's clock would when the hop crosses into a weekend.
 *
 * @param card - The card about to be rendered and posted
 * @param now - The clock as it goes up
 */
export function dueFromNow<C extends { expiresAt?: number }>(card: C, now: number = Date.now()): { card: C; ttlMs: number } {
  const expiresAt = card.expiresAt ?? cardExpiresAt(now);
  return { card: { ...card, expiresAt }, ttlMs: expiresAt - now };
}
