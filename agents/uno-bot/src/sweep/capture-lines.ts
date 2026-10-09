// What a sweep report says about the Capture items beyond thread drift: an
// undocumented answer it adds (C3), a decision a running note or a card
// recorded (C4), and a page nobody linked that a search found.
//
// `./cards.ts` asks here where an item was said and what an added answer
// writes, so the kinds read the same way side by side in one report.
//
// PURE: no `Env`, no Slack call.

import type { PendingFinding } from "./store";

/** What a search-found page's card says beside its owner. */
export const FOUND_BY_SEARCH = "page found by search";

/**
 * What an added answer writes: its line, under a new heading when it opens a
 * section.
 *
 * @param item - The finding
 */
export function addedContent(item: Pick<PendingFinding, "add" | "replacement">): string {
  const heading = item.add?.newSection?.trim();
  return heading ? `## ${heading}\n${item.replacement}` : item.replacement;
}

/** The clause a confirm line ends with: the deployment's standing confirmers
 *  (`STANDING_CONFIRMER_IDS`) may resolve it too. Plain words, never a
 *  mention, so a card pings nobody it does not name. */
export const STANDING_TOO = " The team's standing confirmers can too.";

/**
 * Where an item was said, as its card's subtitle and its report's parent
 * line name it.
 *
 * @param item - The finding
 * @param inThread - Whether the report posts in the thread the item came from
 */
export function saidIn(item: Pick<PendingFinding, "evidence">, inThread: boolean): string {
  const record = item.evidence.record;
  if (record) return record.kind === "note" ? "the running notes" : "a card comment";
  return inThread ? "this thread" : "a thread";
}

/** The link to where an item was said — a note's block, a card, or the
 *  thread's message — or null when there is none. */
export function saidAt(item: Pick<PendingFinding, "evidence">): string | null {
  const record = item.evidence.record;
  if (record) return recordLink(record.url, record.entryIds[0]);
  return item.evidence.permalinks[0] ?? null;
}

/** A note's link to the block that records it; a card comment's, to the card. */
function recordLink(url: string, entryId: string | undefined): string {
  if (!entryId || entryId.startsWith("comment:")) return url;
  return `${url.split("#")[0]}#${entryId.replace(/-/g, "")}`;
}
