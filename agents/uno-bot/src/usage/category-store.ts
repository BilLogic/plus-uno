// Where the end-of-day classifier reads asks and writes their labels — a port
// with an in-memory and a D1 adapter, held equal by the conformance suite
// (`tests/helpers/usage-log-conformance.ts`).
//
// Its own port rather than three more methods on `UsageLog`: Turn writes one
// row and never reads a queue, and the classifier and the purge never write a
// turn. Both adapters work on the same rows the UsageLog writes.

import { chargeD1Query } from "../net";
import type { PainCategory, SubType } from "./categories";
import type { InMemoryUsageLog } from "./in-memory";

/** A channel ask waiting for its label. */
export interface PendingAsk {
  turnId: string;
  text: string;
  /** The turn staged a card or intake — pain_category 7. */
  staged: boolean;
}

/** One ask's label, as the classifier decided it. */
export interface AskLabel {
  turnId: string;
  /** Null is blank. */
  subType: SubType | null;
  painCategory: PainCategory | null;
}

export interface AskCategoryStore {
  /** Real asks still holding text and not yet classified, oldest first. */
  pendingAsks(limit: number): Promise<PendingAsk[]>;
  /** Label these asks and null their text, in ONE write: no row is ever
   *  labelled with its text still on it, or stripped of text unlabelled. */
  label(labels: readonly AskLabel[], at: number): Promise<void>;
  /** Null every text asked before `cutoff` (epoch ms), whatever happened to
   *  it — ONE statement. Answers with how many rows it cleared. */
  purgeTextBefore(cutoff: number): Promise<number>;
}

/** The in-memory store, over the in-memory UsageLog's rows. */
export function createInMemoryAskCategories(log: InMemoryUsageLog): AskCategoryStore {
  return {
    async pendingAsks(limit) {
      return log
        .records()
        .filter((r) => r.requestText !== null && r.classifiedAt === null && !r.testTraffic)
        .sort((a, b) => a.askedAt - b.askedAt)
        .slice(0, limit)
        .map((r) => ({ turnId: r.turnId, text: r.requestText!, staged: r.proposalId !== null }));
    },
    async label(labels, at) {
      for (const l of labels) {
        const row = await log.get(l.turnId);
        if (!row || row.classifiedAt !== null) continue;
        await log.record({ ...row, subType: l.subType, painCategory: l.painCategory, classifiedAt: at, requestText: null });
      }
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
  batch(statements: CategoryStatement[]): Promise<unknown>;
}

interface CategoryStatement {
  run(): Promise<{ meta?: { changes?: number } }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

const PENDING =
  "SELECT turn_id, request_text, proposal_id FROM turns " +
  "WHERE classified_at IS NULL AND test_traffic = 0 AND request_text IS NOT NULL " +
  "ORDER BY asked_at LIMIT ?";

// Guarded on `classified_at IS NULL` so a label written twice (a retried job)
// keeps the first.
const LABEL =
  "UPDATE turns SET sub_type = ?, pain_category = ?, classified_at = ?, request_text = NULL " +
  "WHERE turn_id = ? AND classified_at IS NULL";

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
        .all<{ turn_id: unknown; request_text: unknown; proposal_id: unknown }>();
      return results.map((r) => ({
        turnId: String(r.turn_id),
        text: String(r.request_text),
        staged: r.proposal_id != null,
      }));
    },
    async label(labels, at) {
      if (labels.length === 0) return;
      for (let i = 0; i < labels.length; i++) chargeD1Query();
      await db.batch(labels.map((l) => db.prepare(LABEL).bind(l.subType, l.painCategory, at, l.turnId)));
    },
    async purgeTextBefore(cutoff) {
      chargeD1Query();
      const res = await db.prepare(PURGE).bind(cutoff).run();
      return res.meta?.changes ?? 0;
    },
  };
}
