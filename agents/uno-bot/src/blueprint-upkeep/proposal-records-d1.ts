// The D1 ProposalRecords — `blueprint_proposals` in the usage database
// (migrations/usage/0016_blueprint_proposals.sql; the clean-up marks
// `offered_at` and `withdrawn_at`, 0017_blueprint_proposal_cleanup.sql).
//
// Same discipline as `../usage/d1.ts`: bound parameters only, and every
// statement charged to the meter before it is sent (`chargeD1Query`).

import { chargeD1Query } from "../net";
import type { DrawnProposal, ProposalRecords } from "./proposal-records";

/** The slice of `D1Database` this adapter uses. */
export interface ProposalDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
}

const COLUMNS = "proposal_ts, channel_id, thread_ts, reply_ts, requester_id, path_id, today_path_id, cell_ids, written_at, card_id";

const RECORD =
  `INSERT INTO blueprint_proposals (${COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10) ` +
  `ON CONFLICT (proposal_ts) DO NOTHING`;
const IN_THREAD = `SELECT ${COLUMNS} FROM blueprint_proposals WHERE channel_id = ?1 AND thread_ts = ?2 ORDER BY written_at, proposal_ts`;
const LINK = `UPDATE blueprint_proposals SET card_id = ?3, linked_at = ?4 WHERE channel_id = ?1 AND thread_ts = ?2 AND card_id IS NULL AND withdrawn_at IS NULL`;
const UNLINKED =
  `SELECT ${COLUMNS} FROM blueprint_proposals WHERE card_id IS NULL AND written_at <= ?1 ` +
  `ORDER BY written_at, proposal_ts LIMIT ?2`;

const STANDING = `SELECT ${COLUMNS}, offered_at, withdrawn_at FROM blueprint_proposals WHERE proposal_ts = ?1`;
const STANDING_IN_THREAD =
  `SELECT ${COLUMNS} FROM blueprint_proposals WHERE channel_id = ?1 AND thread_ts = ?2 AND withdrawn_at IS NULL ` +
  `ORDER BY written_at, proposal_ts`;
const WITHDRAW = `UPDATE blueprint_proposals SET withdrawn_at = ?2 WHERE proposal_ts = ?1 AND withdrawn_at IS NULL`;
const DUE_FOR_OFFER =
  `SELECT ${COLUMNS} FROM blueprint_proposals ` +
  `WHERE card_id IS NULL AND offered_at IS NULL AND withdrawn_at IS NULL AND written_at <= ?1 ` +
  `ORDER BY written_at, proposal_ts LIMIT ?2`;
const CLAIM_OFFER = `UPDATE blueprint_proposals SET offered_at = ?2 WHERE proposal_ts = ?1 AND offered_at IS NULL`;
const RELEASE_OFFER = `UPDATE blueprint_proposals SET offered_at = NULL WHERE proposal_ts = ?1`;

const changed = (res: unknown) => Number((res as { meta?: { changes?: number } } | null)?.meta?.changes ?? 0);
const timeOrNull = (v: unknown) => (v == null ? null : Number(v));
const BY_CARD = `SELECT ${COLUMNS} FROM blueprint_proposals WHERE card_id = ?1 AND withdrawn_at IS NULL ORDER BY written_at, proposal_ts LIMIT ?2`;

type Row = Record<
  "proposal_ts" | "channel_id" | "thread_ts" | "reply_ts" | "requester_id" | "path_id" | "today_path_id" | "cell_ids" | "written_at" | "card_id",
  unknown
>;

function idsOf(json: unknown): string[] {
  try {
    const parsed = JSON.parse(String(json)) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
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
    todayPathId: String(r.today_path_id),
    cellIds: idsOf(r.cell_ids),
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
      await db
        .prepare(RECORD)
        .bind(p.proposalTs, p.channel, p.threadTs, p.replyTs, p.requesterId, p.pathId, p.todayPathId, JSON.stringify(p.cellIds), p.writtenAt, p.cardId)
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
    async standing(proposalTs) {
      chargeD1Query();
      const { results } = await db.prepare(STANDING).bind(proposalTs).all<Row & Record<"offered_at" | "withdrawn_at", unknown>>();
      const row = results[0];
      return row ? { proposal: fromRow(row), offeredAt: timeOrNull(row.offered_at), withdrawnAt: timeOrNull(row.withdrawn_at) } : null;
    },
    async standingInThread(channel, threadTs) {
      chargeD1Query();
      const { results } = await db.prepare(STANDING_IN_THREAD).bind(channel, threadTs).all<Row>();
      return results.map(fromRow);
    },
    async withdraw(proposalTs, at) {
      chargeD1Query();
      return changed(await db.prepare(WITHDRAW).bind(proposalTs, at).run()) > 0;
    },
    async dueForOffer(before, limit) {
      chargeD1Query();
      const { results } = await db.prepare(DUE_FOR_OFFER).bind(before, limit).all<Row>();
      return results.map(fromRow);
    },
    async claimOffer(proposalTs, at) {
      chargeD1Query();
      return changed(await db.prepare(CLAIM_OFFER).bind(proposalTs, at).run()) > 0;
    },
    async releaseOffer(proposalTs) {
      chargeD1Query();
      await db.prepare(RELEASE_OFFER).bind(proposalTs).run();
    },
    async byCard(cardId, limit) {
      chargeD1Query();
      const { results } = await db.prepare(BY_CARD).bind(cardId, limit).all<Row>();
      return results.map(fromRow);
    },
  };
}
