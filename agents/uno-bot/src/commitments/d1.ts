// The D1 commitment records — `commitments` in the usage database
// (migrations/usage/0006_commitments.sql).
//
// As the sweep's records do (`sweep/d1.ts`): every statement prepared with
// bound parameters and charged to the meter BEFORE it is sent
// (`chargeD1Query`), so the per-invocation D1 cap refuses a query past it as a
// budget stop. The database is taken BY NAME, typed as the calls this file
// makes; the workerd conformance run exercises it against a local D1 with the
// real migrations.

import { chargeD1Query } from "../net";
import type { SweepDatabase } from "../sweep/d1";
import { LIVE_STATES, type CommitmentPatch, type CommitmentRecord, type CommitmentRecords } from "./store";

const COLUMNS = [
  "commitment_id",
  "kind",
  "channel_id",
  "thread_ts",
  "message_ts",
  "promiser_id",
  "requester_id",
  "deadline_at",
  "due_at",
  "state",
  "nudges",
  "snoozes",
  "confidence",
  "promised_at",
  "detected_at",
  "run_date",
  "nudge_ts",
  "followup_ts",
  "checked_on",
  "resolved_at",
] as const;

type Row = Record<(typeof COLUMNS)[number], unknown>;

/** Record field → column, for the fields a patch may change. */
const PATCH_COLUMNS: Record<keyof CommitmentPatch, (typeof COLUMNS)[number]> = {
  state: "state",
  dueAt: "due_at",
  nudges: "nudges",
  snoozes: "snoozes",
  nudgeTs: "nudge_ts",
  followupTs: "followup_ts",
  checkedOn: "checked_on",
  resolvedAt: "resolved_at",
};

const SELECT = `SELECT ${COLUMNS.join(", ")} FROM commitments`;
// A batch in one statement and one bound value, as the sweep inserts a card's
// items: the rows travel as a JSON array and `json_each` unrolls them.
const INSERT =
  `INSERT INTO commitments (${COLUMNS.join(", ")}) ` +
  `SELECT ${COLUMNS.map((c) => `json_extract(value, '$.${c}')`).join(", ")} FROM json_each(?) WHERE true ` +
  `ON CONFLICT (commitment_id) DO NOTHING`;
const LIVE = LIVE_STATES.map((s) => `'${s}'`).join(", ");
const NEXT_DUE =
  `${SELECT} WHERE state IN (${LIVE}) AND due_at <= ? AND (checked_on IS NULL OR checked_on <> ?) ` +
  `ORDER BY due_at, commitment_id LIMIT 1`;
const BY_REMINDER = `${SELECT} WHERE nudge_ts = ? UNION ALL ${SELECT} WHERE followup_ts = ? LIMIT 1`;

const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

function toRow(r: CommitmentRecord): Row {
  return {
    commitment_id: r.id,
    kind: r.kind,
    channel_id: r.channel,
    thread_ts: r.threadTs,
    message_ts: r.messageTs,
    promiser_id: r.promiserId,
    requester_id: r.requesterId,
    deadline_at: r.deadlineAt,
    due_at: r.dueAt,
    state: r.state,
    nudges: r.nudges,
    snoozes: r.snoozes,
    confidence: r.confidence,
    promised_at: r.promisedAt,
    detected_at: r.detectedAt,
    run_date: r.runDate,
    nudge_ts: r.nudgeTs,
    followup_ts: r.followupTs,
    checked_on: r.checkedOn,
    resolved_at: r.resolvedAt,
  };
}

function fromRow(row: Row): CommitmentRecord {
  return {
    id: String(row.commitment_id),
    kind: row.kind as CommitmentRecord["kind"],
    channel: String(row.channel_id),
    threadTs: String(row.thread_ts),
    messageTs: String(row.message_ts),
    promiserId: String(row.promiser_id),
    requesterId: strOrNull(row.requester_id),
    deadlineAt: numOrNull(row.deadline_at),
    dueAt: Number(row.due_at),
    state: row.state as CommitmentRecord["state"],
    nudges: Number(row.nudges),
    snoozes: Number(row.snoozes),
    confidence: Number(row.confidence),
    promisedAt: Number(row.promised_at),
    detectedAt: Number(row.detected_at),
    runDate: String(row.run_date),
    nudgeTs: strOrNull(row.nudge_ts),
    followupTs: strOrNull(row.followup_ts),
    checkedOn: strOrNull(row.checked_on),
    resolvedAt: numOrNull(row.resolved_at),
  };
}

export function createD1CommitmentRecords(deps: { db: SweepDatabase }): CommitmentRecords {
  const { db } = deps;
  const first = async (sql: string, ...values: unknown[]): Promise<CommitmentRecord | null> => {
    chargeD1Query();
    const row = await db.prepare(sql).bind(...values).first<Row>();
    return row ? fromRow(row) : null;
  };
  return {
    async addCommitments(rows) {
      if (!rows.length) return;
      chargeD1Query();
      await db.prepare(INSERT).bind(JSON.stringify(rows.map(toRow))).run();
    },
    get: (id) => first(`${SELECT} WHERE commitment_id = ?`, id),
    nextDue: (now, runDate) => first(NEXT_DUE, now, runDate),
    byReminderTs: (ts) => first(BY_REMINDER, ts, ts),
    async update(id, patch) {
      const sets: string[] = [];
      const values: unknown[] = [];
      for (const [field, column] of Object.entries(PATCH_COLUMNS) as [keyof CommitmentPatch, string][]) {
        if (patch[field] === undefined) continue;
        sets.push(`${column} = ?`);
        values.push(patch[field]);
      }
      if (!sets.length) return;
      chargeD1Query();
      await db.prepare(`UPDATE commitments SET ${sets.join(", ")} WHERE commitment_id = ?`).bind(...values, id).run();
    },
  };
}
