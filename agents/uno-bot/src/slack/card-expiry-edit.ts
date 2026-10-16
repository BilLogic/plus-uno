// A card that aged out with nobody touching it says so at its deadline (#1316).
//
// Before this a card's expiry was only ever noticed when someone acted on it:
// a late ✅ was told, and the card kept its Review button and its draft as if
// it could still be decided. Now the ThreadState alarm, woken at the card's
// deadline, hands the card over (`handOffExpiredCardsFor` in `events.ts`) and
// this job edits its message: the card as posted, its deadline line and its
// Review taken off, "Expired. Ask again for a fresh card." as its last line,
// and View — the same edit a late gesture makes (`postGateNote`).
//
// Run outside ThreadState, as a report's redraw is (`report-expiry.ts`): Slack
// is not called from inside the Durable Object, and the edit is one runner job
// on a budget of its own. Prepare, edit, acknowledge: an edit Slack refuses
// is left owed and handed over again on the alarm's next pass, unless the
// refusal is one no retry can change.
import type { ThreadState } from "../thread-state/index";
import { EXPIRED_CARD } from "./gate-note";
import { notedCardBlocks } from "./proposal-render";
import { PERMANENT_SLACK_ERRORS } from "./report-expiry";

/**
 * Edit one card to say it expired, when that edit is owed.
 *
 * @param proposalTs - The card's message ts
 * @param deps - The store, and the one Slack edit
 */
export async function showExpiredCard(proposalTs: string, deps: {
  store: Pick<ThreadState, "prepareCardExpiry" | "acknowledgeCardExpiry">;
  edit(channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<void>;
}): Promise<void> {
  const card = await deps.store.prepareCardExpiry(proposalTs);
  if (!card) return;
  try {
    await deps.edit(card.channel, proposalTs, {
      text: card.text,
      blocks: notedCardBlocks({ text: card.text, ...(card.blocks ? { blocks: card.blocks } : {}) }, EXPIRED_CARD, "View"),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    if (!PERMANENT_SLACK_ERRORS.has(reason)) throw err;
    console.error(`[slack] card expiry for ${proposalTs} ended: ${reason}`);
  }
  await deps.store.acknowledgeCardExpiry(proposalTs);
}
