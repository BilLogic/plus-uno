// A card's deadline, as the cards no longer show it.
//
// Every proposal card, and every message whose buttons the bot asks someone
// to press, stops taking an answer at the one rule's deadline
// (`card-expiry.ts` `cardExpiresAt`). The cards do not say when: Bill ruled
// the deadline line out of every card and button message. What is left here
// is the staging clock (`dueFromNow`) and the reading of the line cards
// posted before that ruling still carry — the last line of a text-only card's
// text (`splitDeadline`), or a context block of its own (`isDeadlineBlock`) —
// so a redraw or an edited note drops it.
//
// Env-free: it formats nothing and posts nothing.

import { cardExpiresAt } from "../card-expiry";

/** The block id a card's own deadline line carries, so a note finds it. */
export const DEADLINE_BLOCK_ID = "uno_card_deadline";

/** The deadline line older cards were posted with: its epoch, read back. */
const DEADLINE_LINE = /^Expires <!date\^(\d+)\^\{date_short_pretty\}\|[^>]*> at <!date\^\1\^\{time\}\|[^>]*>$/;



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



/** Whether a block is the deadline line an older card was posted with. */
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
