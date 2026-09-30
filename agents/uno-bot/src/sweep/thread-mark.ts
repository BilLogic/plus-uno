// Which threads uno-bot entered through an end-of-day sweep card.
//
// A sweep card is posted uninvited into the team's own thread. What follows it
// — a ✅'s batch result, a ⛔, a drop's revision, a lock note — is the bot
// answering the card, not joining the conversation, so none of it makes later
// replies there addressed to the bot. The mark says so durably: in a marked
// thread only an @mention, a whole-message pick of the card's fixes or a typed
// gate emoji engages (`slack/events.ts` `shouldHandleMessage`), whatever the
// thread's history or the bot's other posts there.
//
// Set when a card is staged into a thread the bot had no history in, and kept
// past the card's own 72 h by a few days, so the replies that come after it is
// resolved are read by the same rule.
//
// PURE of `Env`: the KV namespace is handed in.

import { charge } from "../net";
import { SWEEP_CARD_TTL_MS } from "./cards";

/** How long a thread stays marked: the card's lifetime and four days. */
export const SWEEP_THREAD_TTL_MS = SWEEP_CARD_TTL_MS + 4 * 24 * 60 * 60 * 1000;

const PREFIX = "sweep:thread:";

/** The KV surface the mark uses. */
export type SweepThreadKv = Pick<KVNamespace, "get" | "put">;

/**
 * Mark a thread as one the bot entered through a sweep card.
 *
 * @param kv - The harness KV namespace
 * @param channel - The thread's channel
 * @param thread - The thread's root ts (a card at a channel's top is its own root)
 */
export async function markSweepThread(kv: SweepThreadKv, channel: string, thread: string): Promise<void> {
  charge(1, "kv");
  await kv.put(`${PREFIX}${channel}:${thread}`, "1", { expirationTtl: SWEEP_THREAD_TTL_MS / 1000 });
}

/** Whether the bot entered this thread through a sweep card. */
export async function isSweepThread(kv: SweepThreadKv, channel: string, thread: string): Promise<boolean> {
  charge(1, "kv");
  return (await kv.get(`${PREFIX}${channel}:${thread}`)) !== null;
}
