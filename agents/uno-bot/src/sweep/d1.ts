// The D1 sweep records — `sweep_cursors`, `sweep_runs` and `sweep_items` in the
// usage database (migrations/usage/0002_sweep.sql).
//
// As the usage log does (`usage/d1.ts`): every statement prepared with bound
// parameters, and each charged to the meter BEFORE it is sent
// (`chargeD1Query`), so the per-invocation D1 cap refuses a query past it the
// way the subrequest limit refuses a call — which the sweep job reads as a
// budget stop and defers on. The database is taken BY NAME, typed as the calls
// this file makes, so the Node suite compiles it; the workerd conformance run
// exercises it against a local D1 with the real migrations.

import { chargeD1Query } from "../net";
import type { SweepItemRecord, SweepRecords, SweepRunRecord } from "./store";

/** The slice of `D1Database` this adapter uses. */
export interface SweepDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
}

const RUN_COLUMNS = [
  "run_id",
  "run_date",
  "run_name",
  "job_key",
  "channels",
  "threads",
  "items",
  "subrequests",
  "d1_queries",
  "outcome",
  "note",
  "started_at",
  "finished_at",
] as const;

const ITEM_COLUMNS = [
  "item_id",
  "finding_id",
  "destination",
  "run_date",
  "channel_id",
  "thread_ts",
  "block_id",
  "owner_id",
  "status",
  "card_key",
  "proposal_ts",
  "drift_at",
  "detected_at",
  "posted_at",
  "resolved_at",
] as const;

type RunRow = Record<(typeof RUN_COLUMNS)[number], unknown>;
type ItemRow = Record<(typeof ITEM_COLUMNS)[number], unknown>;

const placeholders = (n: number) => Array.from({ length: n }, () => "?").join(", ");

const UPSERT_CURSOR =
  "INSERT INTO sweep_cursors (channel_id, last_ts, updated_at) VALUES (?, ?, ?) " +
  "ON CONFLICT (channel_id) DO UPDATE SET last_ts = excluded.last_ts, updated_at = excluded.updated_at";
const SELECT_CURSOR = "SELECT last_ts FROM sweep_cursors WHERE channel_id = ?";
const UPSERT_RUN =
  `INSERT INTO sweep_runs (${RUN_COLUMNS.join(", ")}) VALUES (${placeholders(RUN_COLUMNS.length)}) ` +
  `ON CONFLICT (run_id) DO UPDATE SET ` +
  RUN_COLUMNS.filter((c) => c !== "run_id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");
const SELECT_RUN = `SELECT ${RUN_COLUMNS.join(", ")} FROM sweep_runs WHERE run_id = ?`;
// A card's items in one statement and one bound value: the rows travel as a
// JSON array and `json_each` unrolls them — ten rows of sixteen columns would
// be past D1's bound-parameter limit as plain placeholders. `WHERE true` is
// SQLite's rule for an upsert fed by a SELECT.
const INSERT_ITEMS =
  `INSERT INTO sweep_items (${ITEM_COLUMNS.join(", ")}) ` +
  `SELECT ${ITEM_COLUMNS.map((c) => `json_extract(value, '$.${c}')`).join(", ")} FROM json_each(?) WHERE true ` +
  `ON CONFLICT (item_id) DO NOTHING`;
const SELECT_ITEMS = `SELECT ${ITEM_COLUMNS.join(", ")} FROM sweep_items`;
const RECORD_FAILURE =
  "INSERT INTO sweep_thread_failures (channel_id, thread_ts, nights, last_run_date) VALUES (?, ?, 1, ?) " +
  "ON CONFLICT (channel_id, thread_ts) DO UPDATE SET " +
  "nights = CASE WHEN last_run_date = excluded.last_run_date THEN nights ELSE nights + 1 END, " +
  "last_run_date = excluded.last_run_date RETURNING nights";
const FAILING_THREADS = "SELECT thread_ts FROM sweep_thread_failures WHERE channel_id = ?";
const CLEAR_FAILURE = "DELETE FROM sweep_thread_failures WHERE channel_id = ? AND thread_ts = ?";
const MARK_POSTED = "UPDATE sweep_items SET proposal_ts = ?, posted_at = ? WHERE card_key = ?";
const RELEASE_CARD = "DELETE FROM sweep_items WHERE card_key = ? AND proposal_ts IS NULL";

const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));
const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));

function runRow(r: SweepRunRecord): unknown[] {
  const row: RunRow = {
    run_id: r.runId,
    run_date: r.runDate,
    run_name: r.runName,
    job_key: r.jobKey,
    channels: JSON.stringify(r.channels),
    threads: r.threads,
    items: r.items,
    subrequests: r.subrequests,
    d1_queries: r.d1Queries,
    outcome: r.outcome,
    note: r.note,
    started_at: r.startedAt,
    finished_at: r.finishedAt,
  };
  return RUN_COLUMNS.map((c) => row[c]);
}

function fromRunRow(row: RunRow): SweepRunRecord {
  const channels: unknown = JSON.parse(String(row.channels ?? "[]"));
  return {
    runId: String(row.run_id),
    runDate: String(row.run_date),
    runName: row.run_name === "morning" ? "morning" : "end-of-day",
    jobKey: String(row.job_key),
    channels: Array.isArray(channels) ? channels.map(String) : [],
    threads: Number(row.threads),
    items: Number(row.items),
    subrequests: Number(row.subrequests),
    d1Queries: Number(row.d1_queries),
    outcome: row.outcome as SweepRunRecord["outcome"],
    note: strOrNull(row.note),
    startedAt: Number(row.started_at),
    finishedAt: Number(row.finished_at),
  };
}

function itemRow(i: SweepItemRecord): ItemRow {
  return {
    item_id: i.itemId,
    finding_id: i.findingId,
    destination: i.destination,
    run_date: i.runDate,
    channel_id: i.channel,
    thread_ts: i.threadTs,
    block_id: i.blockId,
    owner_id: i.ownerId,
    status: i.status,
    card_key: i.cardKey,
    proposal_ts: i.proposalTs,
    drift_at: i.driftAt,
    detected_at: i.detectedAt,
    posted_at: i.postedAt,
    resolved_at: i.resolvedAt,
  };
}

function fromItemRow(row: ItemRow): SweepItemRecord {
  return {
    itemId: String(row.item_id),
    findingId: String(row.finding_id),
    destination: String(row.destination),
    runDate: String(row.run_date),
    channel: String(row.channel_id),
    threadTs: String(row.thread_ts),
    blockId: String(row.block_id),
    ownerId: String(row.owner_id),
    status: row.status as SweepItemRecord["status"],
    cardKey: String(row.card_key),
    proposalTs: strOrNull(row.proposal_ts),
    driftAt: Number(row.drift_at),
    detectedAt: Number(row.detected_at),
    postedAt: numOrNull(row.posted_at),
    resolvedAt: numOrNull(row.resolved_at),
  };
}

export function createD1SweepRecords(deps: { db: SweepDatabase }): SweepRecords {
  const { db } = deps;
  // `where` is one of this file's own constants, never a value.
  const items = async (where: string, ...values: string[]): Promise<SweepItemRecord[]> => {
    chargeD1Query();
    const { results } = await db.prepare(`${SELECT_ITEMS} WHERE ${where} ORDER BY item_id`).bind(...values).all<ItemRow>();
    return results.map(fromItemRow);
  };
  return {
    async cursor(channel) {
      chargeD1Query();
      const row = await db.prepare(SELECT_CURSOR).bind(channel).first<{ last_ts: unknown }>();
      return row ? String(row.last_ts) : null;
    },
    async saveCursor(channel, ts, at) {
      chargeD1Query();
      await db.prepare(UPSERT_CURSOR).bind(channel, ts, at).run();
    },
    async recordRun(run) {
      chargeD1Query();
      await db.prepare(UPSERT_RUN).bind(...runRow(run)).run();
    },
    async getRun(runId) {
      chargeD1Query();
      const row = await db.prepare(SELECT_RUN).bind(runId).first<RunRow>();
      return row ? fromRunRow(row) : null;
    },
    async addItems(added) {
      if (!added.length) return;
      chargeD1Query();
      await db.prepare(INSERT_ITEMS).bind(JSON.stringify(added.map(itemRow))).run();
    },
    itemsOnCard: (cardKey) => items("card_key = ?", cardKey),
    itemsForProposal: (proposalTs) => items("proposal_ts = ?", proposalTs),
    itemsForFindings: async (findingIds) =>
      findingIds.length ? items("finding_id IN (SELECT value FROM json_each(?))", JSON.stringify(findingIds)) : [],
    openItems: () => items("status = 'proposed'"),
    async recordThreadFailure(channel, threadTs, runDate) {
      chargeD1Query();
      const row = await db.prepare(RECORD_FAILURE).bind(channel, threadTs, runDate).first<{ nights: unknown }>();
      return Number(row?.nights ?? 1);
    },
    async failingThreads(channel) {
      chargeD1Query();
      const { results } = await db.prepare(FAILING_THREADS).bind(channel).all<{ thread_ts: unknown }>();
      return results.map((r) => String(r.thread_ts));
    },
    async clearThreadFailure(channel, threadTs) {
      chargeD1Query();
      await db.prepare(CLEAR_FAILURE).bind(channel, threadTs).run();
    },
    async markPosted(cardKey, proposalTs, at) {
      chargeD1Query();
      await db.prepare(MARK_POSTED).bind(proposalTs, at, cardKey).run();
    },
    async releaseCard(cardKey) {
      chargeD1Query();
      await db.prepare(RELEASE_CARD).bind(cardKey).run();
    },
    async updateItem(itemId, patch) {
      const sets: string[] = [];
      const values: unknown[] = [];
      if (patch.status !== undefined) {
        sets.push("status = ?");
        values.push(patch.status);
      }
      if (patch.proposalTs !== undefined) {
        sets.push("proposal_ts = ?");
        values.push(patch.proposalTs);
      }
      if (patch.postedAt !== undefined) {
        sets.push("posted_at = ?");
        values.push(patch.postedAt);
      }
      if (patch.resolvedAt !== undefined) {
        sets.push("resolved_at = ?");
        values.push(patch.resolvedAt);
      }
      if (!sets.length) return;
      chargeD1Query();
      await db.prepare(`UPDATE sweep_items SET ${sets.join(", ")} WHERE item_id = ?`).bind(...values, itemId).run();
    },
  };
}
