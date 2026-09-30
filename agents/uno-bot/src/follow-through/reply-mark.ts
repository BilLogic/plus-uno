// Which threads may hold a reply that answers a card follow-up: an F4
// question (whose replies may name the card's owner) or an F5 list of Design
// Status options (whose replies may pick one).
//
// The mark is what keeps a reply elsewhere cheap. Every short reply or
// @-mention in #plus-design and #plus-universal could be such an answer; only
// one in a marked thread is worth the D1 read that finds its follow-up
// (`handleCardReply`). Set when the question or the list posts, for as long
// as it takes answers — the sweep thread mark's pattern (`sweep/thread-mark.ts`).
//
// PURE of `Env`: the KV namespace is handed in.

import { charge } from "../net";

const PREFIX = "follow-through:reply:";

/** The KV surface the mark uses. */
export type ReplyMarkKv = Pick<KVNamespace, "get" | "put">;

/**
 * Mark a thread whose replies may answer a follow-up.
 *
 * @param kv - The harness KV namespace
 * @param channel - The thread's channel
 * @param thread - The thread's root ts
 * @param ttlMs - How long it takes answers
 */
export async function markReplyThread(kv: ReplyMarkKv, channel: string, thread: string, ttlMs: number): Promise<void> {
  charge(1, "kv");
  // KV's floor is a minute.
  await kv.put(`${PREFIX}${channel}:${thread}`, "1", { expirationTtl: Math.max(60, Math.ceil(ttlMs / 1000)) });
}

/** Whether a thread's replies may answer a follow-up. */
export async function isReplyThread(kv: ReplyMarkKv, channel: string, thread: string): Promise<boolean> {
  charge(1, "kv");
  return (await kv.get(`${PREFIX}${channel}:${thread}`)) !== null;
}
