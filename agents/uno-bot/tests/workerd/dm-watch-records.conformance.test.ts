// The DM watch records conformance suite, run against the D1 ADAPTER under
// workerd, with the real migrations applied to a local D1 — the account's
// database is never contacted. Same suite as the in-memory run
// (tests/dm-watch-records-in-memory.test.ts); only the factory differs.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { d1QueriesUsed, runMetered } from "../../src/net";
import { createD1DmWatchRecords } from "../../src/dm-watch/d1";
import { dmRow, runDmWatchRecordsConformance } from "../helpers/dm-watch-records-conformance";

const bindings = env as unknown as {
  USAGE_DB: D1Database;
  USAGE_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

beforeAll(async () => {
  await applyD1Migrations(bindings.USAGE_DB, bindings.USAGE_MIGRATIONS);
});

beforeEach(async () => {
  await bindings.USAGE_DB.prepare("DELETE FROM dm_watch").run();
  await bindings.USAGE_DB.prepare("DELETE FROM dm_commitments").run();
  await bindings.USAGE_DB.prepare("DELETE FROM dm_read_positions").run();
});

runDmWatchRecordsConformance("d1", () => createD1DmWatchRecords({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

describe("[d1] the DM watch migration", () => {
  it("charges one D1 query per statement", async () => {
    const records = createD1DmWatchRecords({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await records.setSwitch("U0MAYA", "promises_made", true, { now: 1, readThrough: "1.0" });
      await records.watchers();
      await records.addCommitments([dmRow()]);
      await records.nextDue("U0MAYA", Number.MAX_SAFE_INTEGER, "2026-10-01");
      await records.lapseLive("U0MAYA", ["made", "made_to"], 2);
      return d1QueriesUsed();
    });
    expect(spent).toBe(5);
  });

  it("a later switch needs no rebuild: feature has no CHECK", async () => {
    await bindings.USAGE_DB.prepare("INSERT INTO dm_watch (user_id, feature, since, read_through) VALUES ('U0MAYA', 'decisions', 1, '1.0')").run();
    const records = createD1DmWatchRecords({ db: bindings.USAGE_DB });
    // A switch this Worker does not know is neither shown nor read.
    expect(await records.switches("U0MAYA")).toEqual([]);
  });

  it("refuses a kind or a state outside the lists", async () => {
    const records = createD1DmWatchRecords({ db: bindings.USAGE_DB });
    await expect(records.addCommitments([dmRow({ kind: "thread_promise" as never })])).rejects.toThrow(/CHECK/);
    await expect(records.addCommitments([dmRow({ state: "expired" as never })])).rejects.toThrow(/CHECK/);
  });

  it("holds no summary and no id of the other person", async () => {
    const { results } = await bindings.USAGE_DB.prepare("SELECT name FROM pragma_table_info('dm_commitments')").all<{ name: string }>();
    const names = results.map((r) => r.name);
    // `reminder_channel` is the owner's own DM with uno-bot, never the other person's.
    for (const name of names.filter((n) => n !== "reminder_channel")) {
      expect(name).not.toMatch(/text|summary|what|promiser|requester|counterparty|channel|user/);
    }
    expect(names).toContain("permalink");
  });

  it("serves the morning and a reaction from their indexes", async () => {
    const plan = async (sql: string) =>
      (await bindings.USAGE_DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).all<{ detail: string }>()).results.map((r) => r.detail).join(" | ");
    expect(await plan("SELECT commitment_id FROM dm_commitments WHERE reminder_channel = 'D' AND nudge_ts = 'x'")).toMatch(/dm_commitments_by_nudge/);
    expect(await plan("SELECT commitment_id FROM dm_commitments WHERE reminder_channel = 'D' AND followup_ts = 'x'")).toMatch(/dm_commitments_by_followup/);
    expect(await plan("SELECT commitment_id FROM dm_commitments WHERE owner_id = 'U' AND state IN ('open') AND due_at <= 5")).toMatch(
      /dm_commitments_by_owner_due/,
    );
  });
});
