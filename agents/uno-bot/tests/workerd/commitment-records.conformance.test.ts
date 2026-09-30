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

  it("0010 rebuilds the table for \"remind me\" and copies every row as it was", async () => {
    const all = bindings.USAGE_MIGRATIONS;
    await bindings.USAGE_DB.prepare("DROP TABLE commitments").run();
    await bindings.USAGE_DB.prepare("DELETE FROM d1_migrations WHERE name >= '0006'").run();
    await applyD1Migrations(bindings.USAGE_DB, all.filter((m) => m.name < "0010"));
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    const before = commitmentRow({ state: "nudged", nudges: 1, nudgeTs: "111.1", checkedOn: "2026-10-01", remindedOn: "2026-10-01", holds: 1 });
    await records.addCommitments([before]);
    await expect(records.addCommitments([commitmentRow({ id: "C:self", kind: "self_reminder" })])).rejects.toThrow(/CHECK/);
    await applyD1Migrations(bindings.USAGE_DB, all);
    expect(await records.get(before.id)).toEqual(before);
    await records.addCommitments([commitmentRow({ id: "C:self", kind: "self_reminder" })]);
    expect((await records.get("C:self"))?.kind).toBe("self_reminder");
    await expect(records.addCommitments([commitmentRow({ id: "C:odd", kind: "other" as never })])).rejects.toThrow(/CHECK/);
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
