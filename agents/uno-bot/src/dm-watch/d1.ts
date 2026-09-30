// The D1 DM watch records — `dm_watch` and `dm_commitments` in the usage
// database (migrations/usage/0011_dm_watch.sql).
//
// As the commitment records do (`commitments/d1.ts`): every statement prepared
// with bound parameters and charged to the meter BEFORE it is sent
// (`chargeD1Query`), so the per-invocation D1 cap refuses a query past it as a
// budget stop. The workerd conformance run exercises it against a local D1 with
// the real migrations.

import { chargeD1Query } from "../net";
import type { SweepDatabase } from "../sweep/d1";
import { LIVE_STATES } from "../commitments/store";
import { isDmWatchFeature, type DmCommitmentPatch, type DmCommitmentRecord, type DmWatchRecords, type DmWatchSwitch } from "./store";

const COLUMNS = [
  "commitment_id",
  "owner_id",
  "kind",
  "permalink",
  "due_at",
  "state",
  "nudges",
  "snoozes",
  "detected_at",
  "reminder_channel",
  "nudge_ts",
  "followup_ts",
  "checked_on",
  "holds",
  "reminded_on",
  "resolved_at",
] as const;

type Row = Record<(typeof COLUMNS)[number], unknown>;

const PATCH_COLUMNS: Record<keyof DmCommitmentPatch, (typeof COLUMNS)[number]> = {
  state: "state",
  dueAt: "due_at",
  nudges: "nudges",
  snoozes: "snoozes",
  reminderChannel: "reminder_channel",
  nudgeTs: "nudge_ts",
  followupTs: "followup_ts",
  checkedOn: "checked_on",
  holds: "holds",
  remindedOn: "reminded_on",
  resolvedAt: "resolved_at",
};

const LIVE = LIVE_STATES.map((s) => `'${s}'`).join(", ");
const SELECT = `SELECT ${COLUMNS.join(", ")} FROM dm_commitments`;
const INSERT =
  `INSERT INTO dm_commitments (${COLUMNS.join(", ")}) ` +
  `SELECT ${COLUMNS.map((c) => `json_extract(value, '$.${c}')`).join(", ")} FROM json_each(?) WHERE true ` +
  `ON CONFLICT (commitment_id) DO NOTHING`;
const NEXT_DUE =
  `${SELECT} WHERE owner_id = ? AND state IN (${LIVE}) AND due_at <= ? AND (checked_on IS NULL OR checked_on <> ?) ` +
  `ORDER BY due_at, commitment_id LIMIT 1`;
const BY_REMINDER =
  `${SELECT} WHERE reminder_channel = ? AND nudge_ts = ? UNION ALL ${SELECT} WHERE reminder_channel = ? AND followup_ts = ? LIMIT 1`;
const SAVE_POSITIONS =
  `INSERT INTO dm_read_positions (user_id, channel_id, read_through) ` +
  `SELECT ?, key, value FROM json_each(?) WHERE true ` +
  `ON CONFLICT (user_id, channel_id) DO UPDATE SET read_through = excluded.read_through`;
const LAPSE_LIVE =
  `UPDATE dm_commitments SET state = 'lapsed', resolved_at = ? ` +
  `WHERE owner_id = ? AND state IN (${LIVE}) AND kind IN (SELECT value FROM json_each(?))`;
// On again keeps the place a switch already has.
const SWITCH_ON =
  `INSERT INTO dm_watch (user_id, feature, since, read_through) VALUES (?, ?, ?, ?) ` +
  `ON CONFLICT (user_id, feature) DO NOTHING`;

const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

function toRow(r: DmCommitmentRecord): Row {
  return {
    commitment_id: r.id,
    owner_id: r.ownerId,
    kind: r.kind,
    permalink: r.permalink,
    due_at: r.dueAt,
    state: r.state,
    nudges: r.nudges,
    snoozes: r.snoozes,
    detected_at: r.detectedAt,
    reminder_channel: r.reminderChannel,
    nudge_ts: r.nudgeTs,
    followup_ts: r.followupTs,
    checked_on: r.checkedOn,
    holds: r.holds,
    reminded_on: r.remindedOn,
    resolved_at: r.resolvedAt,
  };
}

function fromRow(row: Row): DmCommitmentRecord {
  return {
    id: String(row.commitment_id),
    ownerId: String(row.owner_id),
    kind: row.kind as DmCommitmentRecord["kind"],
    permalink: String(row.permalink),
    dueAt: Number(row.due_at),
    state: row.state as DmCommitmentRecord["state"],
    nudges: Number(row.nudges),
    snoozes: Number(row.snoozes),
    detectedAt: Number(row.detected_at),
    reminderChannel: strOrNull(row.reminder_channel),
    nudgeTs: strOrNull(row.nudge_ts),
    followupTs: strOrNull(row.followup_ts),
    checkedOn: strOrNull(row.checked_on),
    holds: Number(row.holds ?? 0),
    remindedOn: strOrNull(row.reminded_on),
    resolvedAt: numOrNull(row.resolved_at),
  };
}

export function createD1DmWatchRecords(deps: { db: SweepDatabase }): DmWatchRecords {
  const { db } = deps;
  const first = async (sql: string, ...values: unknown[]): Promise<DmCommitmentRecord | null> => {
    chargeD1Query();
    const row = await db.prepare(sql).bind(...values).first<Row>();
    return row ? fromRow(row) : null;
  };
  const run = async (sql: string, ...values: unknown[]): Promise<void> => {
    chargeD1Query();
    await db.prepare(sql).bind(...values).run();
  };
  return {
    async switches(userId) {
      chargeD1Query();
      const { results } = await db
        .prepare("SELECT feature, since, read_through FROM dm_watch WHERE user_id = ? ORDER BY feature")
        .bind(userId)
        .all<{ feature: unknown; since: unknown; read_through: unknown }>();
      const on: DmWatchSwitch[] = [];
      // A switch this Worker does not know — one a newer Worker wrote — is
      // neither shown nor read.
      for (const r of results) if (isDmWatchFeature(r.feature)) on.push({ feature: r.feature, since: Number(r.since), readThrough: String(r.read_through) });
      return on;
    },
    setSwitch: (userId, feature, on, at) =>
      on
        ? run(SWITCH_ON, userId, feature, at.now, at.readThrough)
        : run("DELETE FROM dm_watch WHERE user_id = ? AND feature = ?", userId, feature),
    async watchers() {
      chargeD1Query();
      const { results } = await db.prepare("SELECT DISTINCT user_id FROM dm_watch ORDER BY user_id").bind().all<{ user_id: unknown }>();
      return results.map((r) => String(r.user_id));
    },
    async positions(userId) {
      chargeD1Query();
      const { results } = await db
        .prepare("SELECT channel_id, read_through FROM dm_read_positions WHERE user_id = ?")
        .bind(userId)
        .all<{ channel_id: unknown; read_through: unknown }>();
      return Object.fromEntries(results.map((r) => [String(r.channel_id), String(r.read_through)]));
    },
    async savePositions(userId, positions) {
      if (!Object.keys(positions).length) return;
      await run(SAVE_POSITIONS, userId, JSON.stringify(positions));
    },
    clearPositions: (userId) => run("DELETE FROM dm_read_positions WHERE user_id = ?", userId),
    async addCommitments(rows) {
      if (!rows.length) return;
      await run(INSERT, JSON.stringify(rows.map(toRow)));
    },
    get: (id) => first(`${SELECT} WHERE commitment_id = ?`, id),
    nextDue: (ownerId, now, runDate) => first(NEXT_DUE, ownerId, now, runDate),
    async remindedCount(ownerId, runDate) {
      chargeD1Query();
      const row = await db
        .prepare("SELECT COUNT(*) AS n FROM dm_commitments WHERE owner_id = ? AND reminded_on = ?")
        .bind(ownerId, runDate)
        .first<{ n: unknown }>();
      return Number(row?.n ?? 0);
    },
    byReminderTs: (channel, ts) => first(BY_REMINDER, channel, ts, channel, ts),
    async update(id, patch) {
      const sets: string[] = [];
      const values: unknown[] = [];
      for (const [field, column] of Object.entries(PATCH_COLUMNS) as [keyof DmCommitmentPatch, string][]) {
        if (patch[field] === undefined) continue;
        sets.push(`${column} = ?`);
        values.push(patch[field]);
      }
      if (!sets.length) return;
      await run(`UPDATE dm_commitments SET ${sets.join(", ")} WHERE commitment_id = ?`, ...values, id);
    },
    async lapseLive(ownerId, kinds, now) {
      if (!kinds.length) return;
      await run(LAPSE_LIVE, now, ownerId, JSON.stringify(kinds));
    },
  };
}
