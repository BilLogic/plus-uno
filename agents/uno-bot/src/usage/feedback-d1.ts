// The D1 AnswerFeedbackLog — the `answer_feedback` table
// (migrations/usage/0012_answer_feedback.sql).
//
// As `./d1.ts`: bound parameters only, and every statement charged to the
// meter before it is sent (`chargeD1Query`). A write is one upsert, so the
// last-word-wins rule (`mergeFeedback`) is spelled once more here, in SQL,
// where SQLite reads every SET against the row as it was.

import { chargeD1Query } from "../net";
import type { AnswerFeedbackLog, AnswerFeedbackRecord, FeedbackRating, FeedbackReason } from "./feedback";

/** The slice of `D1Database` this adapter uses. */
export interface AnswerFeedbackDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
  };
}

// ?1 answer · ?2 user · ?3 turn · ?4 rating · ?5 reason · ?6 has_note · ?7 at · ?8 channel.
const RECORD =
  `INSERT INTO answer_feedback (answer_ts, user_id, turn_id, rating, reason, has_note, at, channel) ` +
  `VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ` +
  `ON CONFLICT (channel, answer_ts, user_id) DO UPDATE SET ` +
  `turn_id = COALESCE(excluded.turn_id, answer_feedback.turn_id), ` +
  `reason = CASE WHEN excluded.rating = 'up' THEN NULL WHEN excluded.reason IS NOT NULL THEN excluded.reason ` +
  `WHEN answer_feedback.rating = 'down' THEN answer_feedback.reason ELSE NULL END, ` +
  `has_note = CASE WHEN excluded.rating = 'up' THEN 0 WHEN excluded.reason IS NOT NULL THEN excluded.has_note ` +
  `WHEN answer_feedback.rating = 'down' THEN answer_feedback.has_note ELSE 0 END, ` +
  `rating = excluded.rating, at = excluded.at`;

const GET =
  `SELECT channel, answer_ts, user_id, turn_id, rating, reason, has_note, at FROM answer_feedback ` +
  `WHERE channel = ?1 AND answer_ts = ?2 AND user_id = ?3`;

interface Row {
  channel: string;
  answer_ts: string;
  user_id: string;
  turn_id: string | null;
  rating: FeedbackRating;
  reason: FeedbackReason | null;
  has_note: number;
  at: number;
}

export function createD1AnswerFeedbackLog(deps: { db: AnswerFeedbackDatabase }): AnswerFeedbackLog {
  const { db } = deps;
  return {
    async record(f: AnswerFeedbackRecord) {
      const good = f.rating === "up";
      chargeD1Query();
      await db
        .prepare(RECORD)
        .bind(f.answerTs, f.userId, f.turnId, f.rating, good ? null : f.reason, !good && f.hasNote ? 1 : 0, f.at, f.channel)
        .run();
    },
    async get(channel, answerTs, userId) {
      chargeD1Query();
      const row = await db.prepare(GET).bind(channel, answerTs, userId).first<Row>();
      return row
        ? {
            channel: row.channel,
            answerTs: row.answer_ts,
            userId: row.user_id,
            turnId: row.turn_id,
            rating: row.rating,
            reason: row.reason,
            hasNote: row.has_note === 1,
            at: row.at,
          }
        : null;
    },
  };
}
