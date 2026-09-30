// What the sweep keeps between runs, behind one port with two halves.
//
// THE RECORDS (`SweepRecords`) live in D1, in the usage database
// (migrations/usage/0002_sweep.sql): each channel's cursor, one `sweep_runs`
// row per job, and one `sweep_items` row per proposed fix, which moves from
// `proposed` to `confirmed`, `dropped`, `refused_stale`, `refused_unwritable`
// or `failed`. The cursor is here and never in KV: a cursor read a minute
// stale re-reads a day, or skips one. Nothing in these rows is message text (ADR-030) — ids, times, a status.
//
// THE QUEUE (`FindingQueue`) holds what the end-of-day jobs found until the
// morning post, and it DOES hold text: what the page says, what the thread
// says, the replacement. So it is not D1. Production keeps it in HARNESS_KV
// beside the Figma library's findings (`./env.ts`), with an expiry, and the
// morning job removes each finding as its card posts.
//
// Two adapters: in-memory (`./in-memory.ts`) for the Node suite, and D1
// (`./d1.ts`) for the records; one conformance suite holds the records equal
// (`tests/helpers/sweep-records-conformance.ts`, again under workerd).
//
// PURE: no `Env`, no Workers global.

import type { Destination, DriftFinding } from "./finding";

/** A finding waiting for its morning, as the queue holds it. */
export interface PendingFinding extends DriftFinding {
  /** `<channel>:<thread ts>:<block id>` — one finding per block per thread. */
  id: string;
  /** The end-of-day run date that found it, `YYYY-MM-DD`. */
  runDate: string;
  /** When it was detected, epoch ms. */
  detectedAt: number;
  /** When the thread first said the new thing — the earliest evidence
   *  message's time, epoch ms. Time from drift to fix is measured from here. */
  driftAt: number;
}

export type SweepItemStatus = "proposed" | "confirmed" | "dropped" | "refused_stale" | "refused_unwritable" | "failed";

/** One proposed fix, as `sweep_items` holds it. */
export interface SweepItemRecord {
  /** `<card key>#<block id>`. */
  itemId: string;
  /** The queued finding it came from (`PendingFinding.id`) — what the morning
   *  checks before proposing a fix the thread has already had. */
  findingId: string;
  /** Where its card lands (`destinationKey`) — what keeps one live card per
   *  place. */
  destination: string;
  runDate: string;
  channel: string;
  threadTs: string;
  blockId: string;
  ownerId: string;
  status: SweepItemStatus;
  /** `<post date>:<channel>:<thread ts>:<first block id>` — which card it
   *  went out on; content-derived, so a retry never mistakes one chunk for
   *  another. */
  cardKey: string;
  /** The live card's ts; a revision moves it to the successor. Null while the
   *  card is recorded but not yet posted and staged (`markPosted`). */
  proposalTs: string | null;
  driftAt: number;
  detectedAt: number;
  /** When its card was posted and staged; null until then. */
  postedAt: number | null;
  resolvedAt: number | null;
}

export type SweepRunOutcome = "handled" | "deferred" | "skipped";

/** One sweep job, as `sweep_runs` holds it. */
export interface SweepRunRecord {
  /** `<run date>:<job key>` — a retried job rewrites its own row. */
  runId: string;
  runDate: string;
  runName: "morning" | "end-of-day";
  jobKey: string;
  channels: string[];
  /** Threads read (end of day) or cards posted (morning). */
  threads: number;
  /** Findings kept (end of day) or items proposed (morning). */
  items: number;
  subrequests: number;
  d1Queries: number;
  outcome: SweepRunOutcome;
  /** Why, when the job was skipped or stopped short. Code's words, never a
   *  message's. */
  note: string | null;
  startedAt: number;
  finishedAt: number;
}

/** A change to one item. */
export interface SweepItemPatch {
  status?: SweepItemStatus;
  proposalTs?: string | null;
  postedAt?: number | null;
  resolvedAt?: number | null;
}

/** The D1 half. */
export interface SweepRecords {
  /** The last message ts this channel was fully swept to, or null. */
  cursor(channel: string): Promise<string | null>;
  saveCursor(channel: string, ts: string, at: number): Promise<void>;
  /** An upsert on `runId`. */
  recordRun(run: SweepRunRecord): Promise<void>;
  getRun(runId: string): Promise<SweepRunRecord | null>;
  /** Insert a card's items in ONE statement, ignoring an `itemId` already
   *  there — a retried post adds nothing. */
  addItems(items: SweepItemRecord[]): Promise<void>;
  itemsOnCard(cardKey: string): Promise<SweepItemRecord[]>;
  itemsForProposal(proposalTs: string): Promise<SweepItemRecord[]>;
  /** Every item ever carded from these queued findings, in one read. */
  itemsForFindings(findingIds: string[]): Promise<SweepItemRecord[]>;
  /** Every item still `proposed` — live cards, lapsed ones, and cards
   *  recorded but never marked posted. */
  openItems(): Promise<SweepItemRecord[]>;
  /** A card went up and was staged: its items take its ts, in one statement. */
  markPosted(cardKey: string, proposalTs: string, at: number): Promise<void>;
  /** A card that never went through: its unposted items are deleted, so its
   *  findings, still queued, are carded again. */
  releaseCard(cardKey: string): Promise<void>;
  updateItem(itemId: string, patch: SweepItemPatch): Promise<void>;
  /** The threads in a channel with a failed night on record, by root ts. */
  failingThreads(channel: string): Promise<string[]>;
  /** A thread failed to sweep on this run date: how many consecutive nights
   *  it has now failed (a same-night retry adds none). */
  recordThreadFailure(channel: string, threadTs: string, runDate: string): Promise<number>;
  /** The thread swept, or was skipped: its failures start again from none. */
  clearThreadFailure(channel: string, threadTs: string): Promise<void>;
}

/**
 * A card exactly as it was posted: its fixes (permalinks and all), where it
 * went, and the digest of the operations it showed. Kept from before the post
 * until the card is staged, so a retry stages what people saw — never
 * whatever the queue holds by then, which a later night may have re-detected
 * with new text and a fresher stamp.
 */
export interface CardSnapshot {
  key: string;
  destination: Destination;
  items: PendingFinding[];
  /** `operationsDigest` of the card's operations, also on its Slack tag. */
  digest: string;
}

/** The KV half. */
export interface FindingQueue {
  pendingFindings(): Promise<PendingFinding[]>;
  /** Adds, replacing a finding with the same id by the newer read. */
  addFindings(findings: PendingFinding[]): Promise<void>;
  removeFindings(ids: string[]): Promise<void>;
  /** Keep a card's snapshot until it is staged or released. */
  saveCard(snapshot: CardSnapshot): Promise<void>;
  cardSnapshot(cardKey: string): Promise<CardSnapshot | null>;
  dropCard(cardKey: string): Promise<void>;
}

export type SweepStore = SweepRecords & FindingQueue;

/** Merge a batch into the queue: same id, newer read wins; order kept. */
export function mergeFindings(queue: PendingFinding[], added: PendingFinding[]): PendingFinding[] {
  const byId = new Map(queue.map((f) => [f.id, f] as const));
  for (const f of added) byId.set(f.id, f);
  return [...byId.values()];
}
