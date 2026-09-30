// The D1 commitment records — `commitments` in the usage database
// (migrations/usage/0006_commitments.sql, and 0007_commitment_answers.sql for
// where each promise was made, and 0011_card_follow_ups.sql for card
// follow-ups and their card id).
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
  "channel_kind",
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
  "holds",
  "reminded_on",
  "resolved_at",
  "card_id",
] as const;

type Row = Record<(typeof COLUMNS)[number], unknown>;

/** Record field → column, for the fields a patch may change. */
const PATCH_COLUMNS: Record<keyof CommitmentPatch, (typeof COLUMNS)[number]> = {
  state: "state",
  dueAt: "due_at",
  deadlineAt: "deadline_at",
  nudges: "nudges",
  snoozes: "snoozes",
  nudgeTs: "nudge_ts",
  followupTs: "followup_ts",
  checkedOn: "checked_on",
  holds: "holds",
  remindedOn: "reminded_on",
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
  `AND promiser_id NOT IN (SELECT value FROM json_each(?)) ORDER BY due_at, commitment_id LIMIT 1`;
const REMINDED_ON = "SELECT promiser_id, COUNT(*) AS n FROM commitments WHERE reminded_on = ? GROUP BY promiser_id";
const LIVE_IN_THREAD =
  `${SELECT} WHERE kind = 'thread_promise' AND channel_id = ? AND thread_ts = ? AND promiser_id = ? AND state IN (${LIVE}) ` +
  `ORDER BY promised_at, commitment_id LIMIT 1`;
// One statement for both answers: each capped on its own, then merged newest
// first. A row from a DM or another private place never matches.
const answers = (state: "done" | "not_promise") =>
  `SELECT * FROM (${SELECT} WHERE kind = 'thread_promise' AND state = '${state}' AND (channel_kind = 'public' OR channel_id = ?) ` +
  `ORDER BY resolved_at DESC, commitment_id DESC LIMIT ?)`;
const LATEST_ANSWERS = `${answers("done")} UNION ALL ${answers("not_promise")} ORDER BY resolved_at DESC, commitment_id DESC`;
const LATEST_FOR_CARD = `${SELECT} WHERE card_id = ? ORDER BY detected_at DESC, commitment_id DESC LIMIT 1`;
const BY_REMINDER = `${SELECT} WHERE nudge_ts = ? UNION ALL ${SELECT} WHERE followup_ts = ? LIMIT 1`;

const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

function toRow(r: CommitmentRecord): Row {
  return {
    commitment_id: r.id,
    kind: r.kind,
    channel_id: r.channel,
    channel_kind: r.channelKind,
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
    holds: r.holds,
    reminded_on: r.remindedOn,
    resolved_at: r.resolvedAt,
    card_id: r.cardId ?? null,
  };
}

function fromRow(row: Row): CommitmentRecord {
  return {
    id: String(row.commitment_id),
    kind: row.kind as CommitmentRecord["kind"],
    channel: String(row.channel_id),
    channelKind: row.channel_kind as CommitmentRecord["channelKind"],
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
    holds: Number(row.holds ?? 0),
    remindedOn: strOrNull(row.reminded_on),
    resolvedAt: numOrNull(row.resolved_at),
    // A promise carries no card id at all, as it was written.
    ...(row.card_id == null ? {} : { cardId: String(row.card_id) }),
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
    nextDue: (now, runDate, skip = []) => first(NEXT_DUE, now, runDate, JSON.stringify(skip)),
    async remindedOn(runDate) {
      chargeD1Query();
      const { results } = await db.prepare(REMINDED_ON).bind(runDate).all<{ promiser_id: unknown; n: unknown }>();
      return Object.fromEntries(results.map((r) => [String(r.promiser_id), Number(r.n)]));
    },
    liveInThread: (channel, threadTs, promiserId) => first(LIVE_IN_THREAD, channel, threadTs, promiserId),
    byReminderTs: (ts) => first(BY_REMINDER, ts, ts),
    latestForCard: (cardId) => first(LATEST_FOR_CARD, cardId),
    async latestAnswers(channel, limit) {
      if (limit <= 0) return [];
      chargeD1Query();
      const { results } = await db.prepare(LATEST_ANSWERS).bind(channel, limit, channel, limit).all<Row>();
      return results.map(fromRow);
    },
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
