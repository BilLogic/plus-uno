// The commitment records conformance suite, run against the D1 ADAPTER under
// workerd.
//
// Same suite as the in-memory run (tests/commitment-records-in-memory.test.ts);
// only the factory differs. The database is the wrangler config's `USAGE_DB`
// binding, which miniflare backs with a LOCAL D1 — the account's database is
// never contacted — with the real migrations from migrations/usage/ applied
// first, so a column the adapter names and the schema lacks fails here.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { d1QueriesUsed, runMetered } from "../../src/net";
import { createD1CommitmentRecords } from "../../src/commitments/d1";
import { commitmentRow, runCommitmentRecordsConformance } from "../helpers/commitment-records-conformance";

const bindings = env as unknown as {
  USAGE_DB: D1Database;
  USAGE_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

/** A row as a Worker before 0009 wrote it: every column but `card_id`, which
 *  that schema lacks — the adapter names it, so it cannot write the old table. */
async function insertAsBefore0009(row: ReturnType<typeof commitmentRow>): Promise<void> {
  const cols = {
    commitment_id: row.id, kind: row.kind, channel_id: row.channel, channel_kind: row.channelKind, thread_ts: row.threadTs,
    message_ts: row.messageTs, promiser_id: row.promiserId, requester_id: row.requesterId, deadline_at: row.deadlineAt,
    due_at: row.dueAt, state: row.state, nudges: row.nudges, snoozes: row.snoozes, confidence: row.confidence,
    promised_at: row.promisedAt, detected_at: row.detectedAt, run_date: row.runDate, nudge_ts: row.nudgeTs,
    followup_ts: row.followupTs, checked_on: row.checkedOn, holds: row.holds, reminded_on: row.remindedOn,
    resolved_at: row.resolvedAt,
  };
  const names = Object.keys(cols);
  await bindings.USAGE_DB.prepare(`INSERT INTO commitments (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`)
    .bind(...Object.values(cols))
    .run();
}

beforeAll(async () => {
  await applyD1Migrations(bindings.USAGE_DB, bindings.USAGE_MIGRATIONS);
});

beforeEach(async () => {
  await bindings.USAGE_DB.prepare("DELETE FROM commitments").run();
});

runCommitmentRecordsConformance("d1", () => createD1CommitmentRecords({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

describe("[d1] the commitments migration", () => {
  it("charges one D1 query per statement", async () => {
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await records.addCommitments([commitmentRow()]);
      await records.nextDue(Number.MAX_SAFE_INTEGER, "2026-10-01");
      await records.byReminderTs("111.1");
      await records.update(commitmentRow().id, { state: "nudged" });
      await records.latestAnswers("C0DESIGN", 3);
      return d1QueriesUsed();
    });
    expect(spent).toBe(5);
  });

  it("refuses a place outside the four kinds", async () => {
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    await expect(records.addCommitments([commitmentRow({ channelKind: "shared" as never })])).rejects.toThrow(/CHECK/);
  });

  it("0007 fails closed: an unknown old row reads private, a backfilled public channel's row reads public", async () => {
    // Rebuild the table as 0006 left it, write rows the way the pre-0007
    // Worker did, then apply 0007 itself over them.
    const all = bindings.USAGE_MIGRATIONS;
    await bindings.USAGE_DB.prepare("DROP TABLE commitments").run();
    await bindings.USAGE_DB.prepare("DELETE FROM d1_migrations WHERE name >= '0006'").run();
    await applyD1Migrations(bindings.USAGE_DB, all.filter((m) => m.name < "0007"));
    const old = (id: string, channel: string) =>
      bindings.USAGE_DB.prepare(
        "INSERT INTO commitments (commitment_id, kind, channel_id, thread_ts, message_ts, promiser_id, due_at, state, confidence, promised_at, detected_at, run_date) " +
          "VALUES (?, 'thread_promise', ?, '1.0', ?, 'U0MAYA', 1, 'done', 0.9, 1, 1, '2026-09-29')",
      )
        .bind(id, channel, id)
        .run();
    await old("C03FC8AS69K:1", "C03FC8AS69K"); // plus-design, public
    await old("C074QG2V7DJ:1", "C074QG2V7DJ"); // plus-design-feedback, private
    await old("C0UNKNOWN:1", "C0UNKNOWN");
    await applyD1Migrations(bindings.USAGE_DB, all);
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    expect((await records.get("C03FC8AS69K:1"))?.channelKind).toBe("public");
    expect((await records.get("C074QG2V7DJ:1"))?.channelKind).toBe("private");
    expect((await records.get("C0UNKNOWN:1"))?.channelKind).toBe("private");
    // Leave the table as the other cases find it: empty, and planned as empty
    // (0007's PRAGMA optimize just measured these three rows).
    await bindings.USAGE_DB.prepare("DELETE FROM commitments").run();
    await bindings.USAGE_DB.prepare("ANALYZE commitments").run();
  });

  it("0008 rebuilds the table for \"remind me\" and copies every row as it was", async () => {
    const all = bindings.USAGE_MIGRATIONS;
    await bindings.USAGE_DB.prepare("DROP TABLE commitments").run();
    await bindings.USAGE_DB.prepare("DELETE FROM d1_migrations WHERE name >= '0006'").run();
    await applyD1Migrations(bindings.USAGE_DB, all.filter((m) => m.name < "0008"));
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    const before = commitmentRow({ state: "nudged", nudges: 1, nudgeTs: "111.1", checkedOn: "2026-10-01", remindedOn: "2026-10-01", holds: 1 });
    await insertAsBefore0009(before);
    await expect(insertAsBefore0009(commitmentRow({ id: "C:self", kind: "self_reminder" }))).rejects.toThrow(/CHECK/);
    await applyD1Migrations(bindings.USAGE_DB, all);
    expect(await records.get(before.id)).toEqual(before);
    await records.addCommitments([commitmentRow({ id: "C:self", kind: "self_reminder" })]);
    expect((await records.get("C:self"))?.kind).toBe("self_reminder");
    await expect(records.addCommitments([commitmentRow({ id: "C:odd", kind: "other" as never })])).rejects.toThrow(/CHECK/);
    await bindings.USAGE_DB.prepare("DELETE FROM commitments").run();
    await bindings.USAGE_DB.prepare("ANALYZE commitments").run();
  });

  it("0009 rebuilds the table for card follow-ups: both earlier kinds read back unchanged, and the card kinds are valid", async () => {
    const all = bindings.USAGE_MIGRATIONS;
    await bindings.USAGE_DB.prepare("DROP TABLE commitments").run();
    await bindings.USAGE_DB.prepare("DELETE FROM d1_migrations WHERE name >= '0006'").run();
    await applyD1Migrations(bindings.USAGE_DB, all.filter((m) => m.name < "0009"));
    const promise = commitmentRow({ state: "nudged", nudges: 1, nudgeTs: "111.1", checkedOn: "2026-10-01", remindedOn: "2026-10-01", holds: 1 });
    const self = commitmentRow({ id: "D0MAYA:222.2", kind: "self_reminder", channel: "D0MAYA", channelKind: "dm", requesterId: "U0MAYA", state: "snoozed", snoozes: 1 });
    await insertAsBefore0009(promise);
    await insertAsBefore0009(self);
    await expect(insertAsBefore0009(commitmentRow({ id: "card:p1", kind: "card_stale" }))).rejects.toThrow(/CHECK/);
    await applyD1Migrations(bindings.USAGE_DB, all);
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    expect(await records.get(promise.id)).toEqual(promise);
    expect(await records.get(self.id)).toEqual(self);
    const { results } = await bindings.USAGE_DB.prepare("SELECT card_id FROM commitments").all<{ card_id: unknown }>();
    expect(results.map((r) => r.card_id)).toEqual([null, null]);
    for (const kind of ["card_todo", "card_unowned", "card_stale"] as const) {
      const row = commitmentRow({ id: `card:${kind}`, kind, cardId: "p1" });
      await records.addCommitments([row]);
      expect(await records.get(row.id)).toEqual(row);
    }
    // Widened, not dropped: a kind outside the list is still refused, and a
    // place still defaults to private.
    await expect(records.addCommitments([commitmentRow({ id: "C:odd", kind: "other" as never })])).rejects.toThrow(/CHECK/);
    const { results: cols } = await bindings.USAGE_DB.prepare("SELECT name, dflt_value FROM pragma_table_info('commitments')").all<{
      name: string;
      dflt_value: string | null;
    }>();
    expect(cols.find((c) => c.name === "channel_kind")?.dflt_value).toBe("'private'");
    const { results: indexes } = await bindings.USAGE_DB.prepare("SELECT name FROM pragma_index_list('commitments')").all<{ name: string }>();
    expect(indexes.map((i) => i.name).filter((n) => n.startsWith("commitments_by_")).sort()).toEqual([
      "commitments_by_answer",
      "commitments_by_card",
      "commitments_by_due",
      "commitments_by_followup",
      "commitments_by_nudge",
      "commitments_by_reminded",
      "commitments_by_thread",
    ]);
    await bindings.USAGE_DB.prepare("DELETE FROM commitments").run();
    await bindings.USAGE_DB.prepare("ANALYZE commitments").run();
  });

  it("refuses a state outside the lifecycle", async () => {
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    await expect(records.addCommitments([commitmentRow({ state: "expired" as never })])).rejects.toThrow(/CHECK/);
  });

  it("serves the morning and a reaction from their indexes", async () => {
    const plan = async (sql: string) =>
      (await bindings.USAGE_DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).all<{ detail: string }>()).results
        .map((r) => r.detail)
        .join(" | ");
    expect(await plan("SELECT commitment_id FROM commitments WHERE nudge_ts = 'x'")).toMatch(/commitments_by_nudge/);
    expect(await plan("SELECT commitment_id FROM commitments WHERE followup_ts = 'x'")).toMatch(/commitments_by_followup/);
    expect(await plan("SELECT commitment_id FROM commitments WHERE state IN ('open') AND due_at <= 5")).toMatch(
      /commitments_by_due/,
    );
    expect(
      await plan("SELECT commitment_id FROM commitments WHERE state = 'done' AND (channel_kind = 'public' OR channel_id = 'C') ORDER BY resolved_at DESC LIMIT 3"),
    ).toMatch(/commitments_by_answer/);
  });

  it("holds no text column: ids, times, a state and counts", async () => {
    const { results } = await bindings.USAGE_DB.prepare("SELECT name FROM pragma_table_info('commitments')").all<{
      name: string;
    }>();
    const names = results.map((r) => r.name);
    for (const name of names) expect(name).not.toMatch(/text|summary|what|link|url|permalink/);
  });
});
