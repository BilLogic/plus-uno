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

  it("refuses a place outside the four kinds, and reads a row from before 0007 as public", async () => {
    const records = createD1CommitmentRecords({ db: bindings.USAGE_DB });
    await expect(records.addCommitments([commitmentRow({ channelKind: "shared" as never })])).rejects.toThrow(/CHECK/);
    const row = commitmentRow();
    await bindings.USAGE_DB.prepare(
      "INSERT INTO commitments (commitment_id, kind, channel_id, thread_ts, message_ts, promiser_id, due_at, state, confidence, promised_at, detected_at, run_date) " +
        "VALUES (?, 'thread_promise', ?, ?, ?, ?, 1, 'done', 0.9, 1, 1, '2026-09-29')",
    )
      .bind(row.id, row.channel, row.threadTs, row.messageTs, row.promiserId)
      .run();
    expect((await records.get(row.id))?.channelKind).toBe("public");
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
