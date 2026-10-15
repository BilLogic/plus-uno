// The D1 ProposalRecords — `blueprint_proposals` in the usage database
// (migrations/usage/0016_blueprint_proposals.sql).
//
// Same discipline as `../usage/d1.ts`: bound parameters only, and every
// statement charged to the meter before it is sent (`chargeD1Query`).

import { chargeD1Query } from "../net";
import type { DrawnProposal, ProposalRecords, ProposalRow } from "./proposal-records";

/** The slice of `D1Database` this adapter uses. */
export interface ProposalDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
}

const COLUMNS = "proposal_ts, channel_id, thread_ts, reply_ts, requester_id, path_id, rows, written_at, card_id";

const RECORD =
  `INSERT INTO blueprint_proposals (${COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) ` +
  `ON CONFLICT (proposal_ts) DO NOTHING`;
const IN_THREAD = `SELECT ${COLUMNS} FROM blueprint_proposals WHERE channel_id = ?1 AND thread_ts = ?2 ORDER BY written_at, proposal_ts`;
const LINK = `UPDATE blueprint_proposals SET card_id = ?3, linked_at = ?4 WHERE channel_id = ?1 AND thread_ts = ?2 AND card_id IS NULL`;
const UNLINKED =
  `SELECT ${COLUMNS} FROM blueprint_proposals WHERE card_id IS NULL AND written_at <= ?1 ` +
  `ORDER BY written_at, proposal_ts LIMIT ?2`;

type Row = Record<"proposal_ts" | "channel_id" | "thread_ts" | "reply_ts" | "requester_id" | "path_id" | "rows" | "written_at" | "card_id", unknown>;

function rowsOf(json: unknown): ProposalRow[] {
  try {
    const parsed = JSON.parse(String(json)) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((r) => ({ laneId: String((r as ProposalRow).laneId), stepId: String((r as ProposalRow).stepId) }))
      : [];
  } catch {
    return [];
  }
}

function fromRow(r: Row): DrawnProposal {
  return {
    proposalTs: String(r.proposal_ts),
    channel: String(r.channel_id),
    threadTs: String(r.thread_ts),
    replyTs: String(r.reply_ts),
    requesterId: String(r.requester_id),
    pathId: String(r.path_id),
    rows: rowsOf(r.rows),
    writtenAt: Number(r.written_at),
    cardId: r.card_id == null ? null : String(r.card_id),
  };
}

/** @param deps.now - The clock a link is stamped with; `Date.now` by default */
export function createD1ProposalRecords(deps: { db: ProposalDatabase; now?: () => number }): ProposalRecords {
  const { db } = deps;
  const now = deps.now ?? Date.now;
  return {
    async record(p) {
      chargeD1Query();
      const rows = JSON.stringify(p.rows.map((r) => ({ laneId: r.laneId, stepId: r.stepId })));
      await db
        .prepare(RECORD)
        .bind(p.proposalTs, p.channel, p.threadTs, p.replyTs, p.requesterId, p.pathId, rows, p.writtenAt, p.cardId)
        .run();
    },
    async inThread(channel, threadTs) {
      chargeD1Query();
      const { results } = await db.prepare(IN_THREAD).bind(channel, threadTs).all<Row>();
      return results.map(fromRow);
    },
    async linkCard(channel, threadTs, cardId) {
      chargeD1Query();
      const res = (await db.prepare(LINK).bind(channel, threadTs, cardId, now()).run()) as { meta?: { changes?: number } };
      return Number(res?.meta?.changes ?? 0);
    },
    async unlinkedBefore(before, limit) {
      chargeD1Query();
      const { results } = await db.prepare(UNLINKED).bind(before, limit).all<Row>();
      return results.map(fromRow);
    },
  };
}
