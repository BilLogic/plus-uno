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

const SKIPS_KEY = "follow-through:skipped";

/**
 * The end-of-day scan's skip marks: follow-up ids (a page id and a timestamp,
 * never a title or a link — ADR-030) it passed over without keeping a row,
 * each with the time it may be looked at again. One key, read once a night,
 * so a card with nobody to ask costs no re-read on every night and retry.
 */
export async function readScanSkips(kv: ReplyMarkKv): Promise<Record<string, number>> {
  charge(1, "kv");
  const raw = await kv.get(SKIPS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter((e): e is [string, number] => typeof e[1] === "number"));
  } catch {
    return {};
  }
}

/**
 * Write the scan's skip marks, the expired dropped; the key lives as long as
 * its latest mark.
 *
 * @param kv - The harness KV namespace
 * @param marks - Follow-up id → epoch ms it may be looked at again
 * @param now - Now, epoch ms
 */
export async function writeScanSkips(kv: ReplyMarkKv, marks: Record<string, number>, now: number): Promise<void> {
  const live = Object.fromEntries(Object.entries(marks).filter(([, until]) => until > now));
  const last = Math.max(now, ...Object.values(live));
  charge(1, "kv");
  await kv.put(SKIPS_KEY, JSON.stringify(live), { expirationTtl: Math.max(60, Math.ceil((last - now) / 1000)) });
}
