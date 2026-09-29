// The D1 ResolutionLog — the resolution columns of the `turns` table
// (migrations/usage/0004_resolution.sql).
//
// Same discipline as `./d1.ts`: bound parameters only, and every statement
// charged to the meter before it is sent (`chargeD1Query`). Each write is one
// `UPDATE`, so finding the row and changing it is one statement and one charge.

import { chargeD1Query } from "../net";
import type { AskResolution, PassCandidate, ResolutionLog } from "./resolution";
import { channelOfTurnId } from "./resolution";

/** The slice of `D1Database` this adapter uses. */
export interface ResolutionDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
}

// What a person's signal may replace: nothing yet, or the pass's own answer.
const PERSON_OPEN = "(resolution IS NULL OR resolution IN ('none', 'no_escalation'))";

// A reacted message that is any turn's card is never an answer: one statement
// still, the card lookup riding `turns_by_proposal`.
const RECORD_REACTION =
  `UPDATE turns SET resolution = 'reaction', resolved_at = ?1 ` +
  `WHERE turn_id = ?2 AND requester_id = ?3 AND ${PERSON_OPEN} ` +
  `AND NOT EXISTS (SELECT 1 FROM turns WHERE proposal_id = ?4) RETURNING turn_id`;

const RECORD_TASK =
  `UPDATE turns SET resolution = 'task_completed', resolved_at = ?1 ` +
  `WHERE proposal_id = ?2 AND ${PERSON_OPEN} RETURNING turn_id`;

// Never-read asks first, then the oldest: re-reading the unknowns must not
// starve a new ask of its first read.
const PENDING =
  `SELECT turn_id, requester_id, ask_ts, asked_at, resolution, resolution_attempts FROM turns ` +
  `WHERE resolution_checked_at IS NULL AND test_traffic = 0 AND asked_at > ?1 AND asked_at <= ?2 ` +
  `AND (resolution_attempted_at IS NULL OR resolution_attempted_at <= ?3) ` +
  `ORDER BY resolution_attempts > 0, asked_at LIMIT ?4`;

// ?1 at · ?2 escalated (0/1/null) · ?3 resolution (or null) · ?4 settled (0/1) · ?5 turn.
// The pass's answer replaces only its own (PERSON_OPEN is exactly that set);
// `resolved_at` moves only when the resolution itself changes, so a re-read to
// the same verdict writes nothing but the attempt. A later read that overturns
// a `none` (a person replied after all) leaves `resolution` NULL: legal, and
// the same row a first read reaching that verdict would have written. SQLite evaluates every SET
// against the row as it was, so the CASEs all see the old `resolution`.
const RECORD_PASS =
  `UPDATE turns SET resolution_attempts = resolution_attempts + 1, resolution_attempted_at = ?1, ` +
  `resolution_checked_at = CASE WHEN ?4 = 1 THEN ?1 ELSE resolution_checked_at END, ` +
  `escalated_to_lead = COALESCE(?2, escalated_to_lead), ` +
  `resolved_at = CASE WHEN ${PERSON_OPEN} THEN ` +
  `(CASE WHEN ?3 IS NULL THEN NULL WHEN resolution IS ?3 THEN resolved_at ELSE ?1 END) ELSE resolved_at END, ` +
  `resolution = CASE WHEN ${PERSON_OPEN} THEN ?3 ELSE resolution END ` +
  `WHERE turn_id = ?5`;

const GET =
  `SELECT resolution, resolved_at, escalated_to_lead, resolution_checked_at, resolution_attempts, ` +
  `resolution_attempted_at FROM turns WHERE turn_id = ?`;

type PendingRow = {
  turn_id: unknown;
  requester_id: unknown;
  ask_ts: unknown;
  asked_at: unknown;
  resolution: unknown;
  resolution_attempts: unknown;
};
type ResolutionRow = {
  resolution: unknown;
  resolved_at: unknown;
  escalated_to_lead: unknown;
  resolution_checked_at: unknown;
  resolution_attempts: unknown;
  resolution_attempted_at: unknown;
};

const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));
const personResolved = (r: unknown): boolean => r === "reaction" || r === "task_completed";

export function createD1ResolutionLog(deps: { db: ResolutionDatabase }): ResolutionLog {
  const { db } = deps;
  const turnIdIfUpdated = async (stmt: ReturnType<ReturnType<ResolutionDatabase["prepare"]>["bind"]>) => {
    chargeD1Query();
    const row = await stmt.first<{ turn_id: unknown }>();
    return row ? String(row.turn_id) : null;
  };
  return {
    recordReaction(q) {
      return turnIdIfUpdated(db.prepare(RECORD_REACTION).bind(q.at, q.turnId, q.requesterId, q.reactedTs));
    },
    recordTaskCompleted(proposalId, at) {
      return turnIdIfUpdated(db.prepare(RECORD_TASK).bind(at, proposalId));
    },
    async pendingPass(q) {
      chargeD1Query();
      const { results } = await db
        .prepare(PENDING)
        .bind(q.askedAfter, q.askedBefore, q.attemptedBefore, q.limit)
        .all<PendingRow>();
      return results.map(
        (r): PassCandidate => ({
          turnId: String(r.turn_id),
          requesterId: String(r.requester_id),
          channel: channelOfTurnId(String(r.turn_id)),
          askTs: String(r.ask_ts),
          askedAt: Number(r.asked_at),
          resolved: personResolved(r.resolution),
          attempts: Number(r.resolution_attempts),
        }),
      );
    },
    async recordPass(turnId, outcome, at) {
      chargeD1Query();
      const escalated = outcome.escalatedToLead === null ? null : outcome.escalatedToLead ? 1 : 0;
      await db
        .prepare(RECORD_PASS)
        .bind(at, escalated, outcome.resolution, outcome.settled ? 1 : 0, turnId)
        .run();
    },
    async getResolution(turnId) {
      chargeD1Query();
      const row = await db.prepare(GET).bind(turnId).first<ResolutionRow>();
      if (!row) return null;
      const escalated = numOrNull(row.escalated_to_lead);
      return {
        resolution: (row.resolution ?? null) as AskResolution["resolution"],
        resolvedAt: numOrNull(row.resolved_at),
        escalatedToLead: escalated === null ? null : escalated === 1,
        resolutionCheckedAt: numOrNull(row.resolution_checked_at),
        resolutionAttempts: Number(row.resolution_attempts ?? 0),
        resolutionAttemptedAt: numOrNull(row.resolution_attempted_at),
      };
    },
  };
}
