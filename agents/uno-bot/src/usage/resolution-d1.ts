// The D1 ResolutionLog — the resolution columns of the `turns` table
// (migrations/usage/0004_resolution.sql).
//
// Same discipline as `./d1.ts`: bound parameters only, and every statement
// charged to the meter before it is sent (`chargeD1Query`). Each write is one
// `UPDATE … RETURNING turn_id`, so finding the row and changing it is one
// statement and one charge.

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

// First signal wins; `none` gives way to a real one.
const OPEN = "(resolution IS NULL OR resolution = 'none')";

// The channel's turn ids are the half-open range [`C…:`, `C…;`) — `;` sorts
// straight after `:` — so the lookup walks the primary key, and a channel id is
// bound, never matched with LIKE.
const RECORD_REACTION =
  `UPDATE turns SET resolution = 'reaction', resolved_at = ? ` +
  `WHERE turn_id = (SELECT turn_id FROM turns ` +
  `WHERE turn_id >= ? AND turn_id < ? AND requester_id = ? AND asked_at BETWEEN ? AND ? ` +
  `ORDER BY asked_at DESC LIMIT 1) AND ${OPEN} RETURNING turn_id`;

const RECORD_TASK =
  `UPDATE turns SET resolution = 'task_completed', resolved_at = ? ` +
  `WHERE proposal_id = ? AND ${OPEN} RETURNING turn_id`;

const PENDING =
  `SELECT turn_id, requester_id, ask_ts, asked_at, resolution FROM turns ` +
  `WHERE resolution_checked_at IS NULL AND test_traffic = 0 AND asked_at > ? AND asked_at <= ? ` +
  `ORDER BY asked_at LIMIT ?`;

// The pass only ever settles an OPEN ask, and `escalated_to_lead` is its own.
// An ask whose escalation it could not tell stays in the queue.
const RECORD_PASS =
  `UPDATE turns SET resolution_checked_at = CASE WHEN ?2 IS NULL THEN NULL ELSE ?1 END, escalated_to_lead = ?2, ` +
  `resolved_at = CASE WHEN ?3 IS NOT NULL AND ${OPEN} THEN ?1 ELSE resolved_at END, ` +
  `resolution = CASE WHEN ?3 IS NOT NULL AND ${OPEN} THEN ?3 ELSE resolution END ` +
  `WHERE turn_id = ?4`;

const GET =
  `SELECT resolution, resolved_at, escalated_to_lead, resolution_checked_at FROM turns WHERE turn_id = ?`;

type PendingRow = { turn_id: unknown; requester_id: unknown; ask_ts: unknown; asked_at: unknown; resolution: unknown };
type ResolutionRow = { resolution: unknown; resolved_at: unknown; escalated_to_lead: unknown; resolution_checked_at: unknown };

const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

export function createD1ResolutionLog(deps: { db: ResolutionDatabase }): ResolutionLog {
  const { db } = deps;
  const changedTurnId = async (stmt: ReturnType<ReturnType<ResolutionDatabase["prepare"]>["bind"]>) => {
    chargeD1Query();
    const row = await stmt.first<{ turn_id: unknown }>();
    return row ? String(row.turn_id) : null;
  };
  return {
    recordReaction(q) {
      return changedTurnId(
        db.prepare(RECORD_REACTION).bind(q.at, `${q.channel}:`, `${q.channel};`, q.requesterId, q.fromMs, q.toMs),
      );
    },
    recordTaskCompleted(proposalId, at) {
      return changedTurnId(db.prepare(RECORD_TASK).bind(at, proposalId));
    },
    async pendingPass(q) {
      chargeD1Query();
      const { results } = await db.prepare(PENDING).bind(q.askedAfter, q.askedBefore, q.limit).all<PendingRow>();
      return results.map(
        (r): PassCandidate => ({
          turnId: String(r.turn_id),
          requesterId: String(r.requester_id),
          channel: channelOfTurnId(String(r.turn_id)),
          askTs: String(r.ask_ts),
          askedAt: Number(r.asked_at),
          resolved: r.resolution != null && r.resolution !== "none",
        }),
      );
    },
    async recordPass(turnId, outcome, at) {
      chargeD1Query();
      const escalated = outcome.escalatedToLead === null ? null : outcome.escalatedToLead ? 1 : 0;
      await db.prepare(RECORD_PASS).bind(at, escalated, outcome.resolution, turnId).run();
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
      };
    },
  };
}
