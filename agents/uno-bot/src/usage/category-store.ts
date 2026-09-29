// Where the end-of-day classifier reads asks and writes their labels — a port
// with an in-memory and a D1 adapter, held equal by the conformance suite
// (`tests/helpers/usage-log-conformance.ts`).
//
// Its own port rather than more methods on `UsageLog`: Turn writes one row and
// never reads a queue, and the classifier and the purge never write a turn.
// Both adapters work on the same rows the UsageLog writes. The attempt count
// is the classifier's alone, so it is not on `TurnRecord` and a turn's upsert
// never touches it.

import { chargeD1Query } from "../net";
import type { PainCategory, SubType } from "./categories";
import type { InMemoryUsageLog } from "./in-memory";

/** A channel ask waiting for its label. */
export interface PendingAsk {
  turnId: string;
  text: string;
  /** The turn staged a card or intake — pain_category 7. */
  staged: boolean;
  /** Classifications of it that have failed so far. */
  attempts: number;
}

/** One ask's label, as the classifier decided it. */
export interface AskLabel {
  turnId: string;
  /** Null is blank. */
  subType: SubType | null;
  painCategory: PainCategory | null;
}

export interface AskCategoryStore {
  /** Real asks still holding text and not yet classified: fewest failed
   *  attempts first, then oldest — so an ask that keeps failing sinks behind
   *  newer ones instead of heading every batch. */
  pendingAsks(limit: number): Promise<PendingAsk[]>;
  /** Label these asks and null their text, in ONE write: no row is ever
   *  labelled with its text still on it, or stripped of text unlabelled. */
  label(labels: readonly AskLabel[], at: number): Promise<void>;
  /**
   * Count one failed classification against each of these asks, in ONE write.
   * An ask whose count reaches `giveUpAt` is given up on in the same write:
   * classified as blank (a staged turn keeps its 7) and its text nulled, so it
   * stops holding a place in the queue.
   *
   * @returns How many were given up on
   */
  recordFailures(turnIds: readonly string[], giveUpAt: number, at: number): Promise<number>;
  /** Null every text asked before `cutoff` (epoch ms), whatever happened to
   *  it — ONE statement. Answers with how many rows it cleared. */
  purgeTextBefore(cutoff: number): Promise<number>;
}

/** The in-memory store, over the in-memory UsageLog's rows. */
export function createInMemoryAskCategories(log: InMemoryUsageLog): AskCategoryStore {
  const attempts = new Map<string, number>();
  const attemptsOf = (turnId: string) => attempts.get(turnId) ?? 0;
  return {
    async pendingAsks(limit) {
      return log
        .records()
        .filter((r) => r.requestText !== null && r.classifiedAt === null && !r.testTraffic)
        .sort((a, b) => attemptsOf(a.turnId) - attemptsOf(b.turnId) || a.askedAt - b.askedAt)
        .slice(0, limit)
        .map((r) => ({
          turnId: r.turnId,
          text: r.requestText!,
          staged: r.proposalId !== null,
          attempts: attemptsOf(r.turnId),
        }));
    },
    async label(labels, at) {
      for (const l of labels) {
        const row = await log.get(l.turnId);
        if (!row || row.classifiedAt !== null) continue;
        await log.record({ ...row, subType: l.subType, painCategory: l.painCategory, classifiedAt: at, requestText: null });
      }
    },
    async recordFailures(turnIds, giveUpAt, at) {
      let givenUp = 0;
      for (const turnId of turnIds) {
        const row = await log.get(turnId);
        if (!row || row.classifiedAt !== null) continue;
        const count = attemptsOf(turnId) + 1;
        attempts.set(turnId, count);
        if (count >= giveUpAt) {
          await log.record({ ...row, classifiedAt: at, requestText: null });
          givenUp += 1;
        }
      }
      return givenUp;
    },
    async purgeTextBefore(cutoff) {
      let cleared = 0;
      for (const row of log.records()) {
        if (row.requestText === null || row.askedAt >= cutoff) continue;
        await log.record({ ...row, requestText: null });
        cleared += 1;
      }
      return cleared;
    },
  };
}

/** The slice of `D1Database` this adapter uses. */
export interface CategoryDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): CategoryStatement;
  };
  batch(statements: CategoryStatement[]): Promise<{ meta?: { changes?: number } }[]>;
}

interface CategoryStatement {
  run(): Promise<{ meta?: { changes?: number } }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

const PENDING =
  "SELECT turn_id, request_text, proposal_id, classify_attempts FROM turns " +
  "WHERE classified_at IS NULL AND test_traffic = 0 AND request_text IS NOT NULL " +
  "ORDER BY classify_attempts, asked_at LIMIT ?";

// Guarded on `classified_at IS NULL` so a label written twice (a retried job)
// keeps the first.
const LABEL =
  "UPDATE turns SET sub_type = ?, pain_category = ?, classified_at = ?, request_text = NULL " +
  "WHERE turn_id = ? AND classified_at IS NULL";

// One statement per ask: the right-hand sides read the row as it was, so
// `classify_attempts + 1` is the new count in all three places. Reaching the
// limit classifies the row as blank — sub_type stays null, a staged turn's 7
// stays — and nulls its text.
const FAILURE =
  "UPDATE turns SET classify_attempts = classify_attempts + 1, " +
  "classified_at = CASE WHEN classify_attempts + 1 >= ? THEN ? ELSE classified_at END, " +
  "request_text = CASE WHEN classify_attempts + 1 >= ? THEN NULL ELSE request_text END " +
  "WHERE turn_id = ? AND classified_at IS NULL";

const GIVEN_UP = "SELECT COUNT(*) AS n FROM turns WHERE classified_at = ? AND classify_attempts >= ? AND turn_id IN ";

const PURGE = "UPDATE turns SET request_text = NULL WHERE request_text IS NOT NULL AND asked_at < ?";

/**
 * The D1 store. Statements are bound, never assembled from values, and each is
 * charged to the meter before it is sent — a `batch()` is charged per statement
 * in it, the conservative reading until a batch is measured as one query.
 */
export function createD1AskCategories(deps: { db: CategoryDatabase }): AskCategoryStore {
  const { db } = deps;
  return {
    async pendingAsks(limit) {
      chargeD1Query();
      const { results } = await db
        .prepare(PENDING)
        .bind(limit)
        .all<{ turn_id: unknown; request_text: unknown; proposal_id: unknown; classify_attempts: unknown }>();
      return results.map((r) => ({
        turnId: String(r.turn_id),
        text: String(r.request_text),
        staged: r.proposal_id != null,
        attempts: Number(r.classify_attempts ?? 0),
      }));
    },
    async label(labels, at) {
      if (labels.length === 0) return;
      for (let i = 0; i < labels.length; i++) chargeD1Query();
      await db.batch(labels.map((l) => db.prepare(LABEL).bind(l.subType, l.painCategory, at, l.turnId)));
    },
    async recordFailures(turnIds, giveUpAt, at) {
      if (turnIds.length === 0) return 0;
      for (let i = 0; i <= turnIds.length; i++) chargeD1Query();
      const results = await db.batch([
        ...turnIds.map((id) => db.prepare(FAILURE).bind(giveUpAt, at, giveUpAt, id)),
        // Placeholders only — one `?` per id; the ids themselves are bound.
        db
          .prepare(`${GIVEN_UP}(${turnIds.map(() => "?").join(", ")})`)
          .bind(at, giveUpAt, ...turnIds),
      ]);
      const counted = results.at(-1) as unknown as { results?: { n?: unknown }[] } | undefined;
      return Number(counted?.results?.[0]?.n ?? 0);
    },
    async purgeTextBefore(cutoff) {
      chargeD1Query();
      const res = await db.prepare(PURGE).bind(cutoff).run();
      return res.meta?.changes ?? 0;
    },
  };
}
