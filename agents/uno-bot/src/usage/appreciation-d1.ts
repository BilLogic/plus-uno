// The D1 AppreciationLog — the `appreciation` table
// (migrations/usage/0013_measurement.sql).
//
// As `./d1.ts`: bound parameters only, and every statement charged to the
// meter before it is sent (`chargeD1Query`). A write is ONE statement: the
// turn a known message belongs to, and that turn's conversation type, are read
// inside the insert, so a reaction costs one query whatever it finds.

import { chargeD1Query } from "../net";
import { asConversationType } from "../turn/turn";
import type { AppreciationLog, AppreciationRecord, ThanksReaction } from "./appreciation";

/** The slice of `D1Database` this adapter uses. */
export interface AppreciationDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
  };
}

// The turn a known message belongs to: an answer whose feedback buttons named
// it, else a card a turn in that channel staged (`turns_by_proposal`).
// ?1 channel · ?2 item ts.
const KNOWN_TURN =
  `COALESCE(` +
  `(SELECT f.turn_id FROM answer_feedback f WHERE f.channel = ?1 AND f.answer_ts = ?2 AND f.turn_id IS NOT NULL LIMIT 1), ` +
  `(SELECT t.turn_id FROM turns t WHERE t.proposal_id = ?2 AND substr(t.turn_id, 1, length(?1) + 1) = ?1 || ':' LIMIT 1))`;

// ?3 user · ?4 emoji · ?5 at · ?6 conversation type the channel id proves.
// `WHERE true` lets the upsert clause parse after a SELECT.
const RECORD =
  `INSERT INTO appreciation (channel, item_ts, user_id, emoji, at, conversation_type, turn_id) ` +
  `SELECT ?1, ?2, ?3, ?4, ?5, ` +
  `COALESCE((SELECT t.conversation_type FROM turns t WHERE t.turn_id = k.turn_id), ?6), k.turn_id ` +
  `FROM (SELECT ${KNOWN_TURN} AS turn_id) k WHERE true ` +
  `ON CONFLICT (channel, item_ts, user_id, emoji) DO NOTHING`;

const GET =
  `SELECT channel, item_ts, user_id, emoji, at, conversation_type, turn_id FROM appreciation ` +
  `WHERE channel = ?1 AND item_ts = ?2 AND user_id = ?3 AND emoji = ?4`;

interface Row {
  channel: string;
  item_ts: string;
  user_id: string;
  emoji: string;
  at: number;
  conversation_type: string | null;
  turn_id: string | null;
}

export function createD1AppreciationLog(deps: { db: AppreciationDatabase }): AppreciationLog {
  const { db } = deps;
  return {
    async record(r: ThanksReaction) {
      chargeD1Query();
      await db.prepare(RECORD).bind(r.channel, r.itemTs, r.userId, r.emoji, r.at, r.conversationType).run();
    },
    async get(channel, itemTs, userId, emoji): Promise<AppreciationRecord | null> {
      chargeD1Query();
      const row = await db.prepare(GET).bind(channel, itemTs, userId, emoji).first<Row>();
      return row
        ? {
            channel: row.channel,
            itemTs: row.item_ts,
            userId: row.user_id,
            emoji: row.emoji,
            at: Number(row.at),
            conversationType: asConversationType(row.conversation_type) ?? null,
            turnId: row.turn_id,
          }
        : null;
    },
  };
}
