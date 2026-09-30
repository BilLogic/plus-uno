// The sweep records conformance suite, run against the D1 ADAPTER under workerd.
//
// Same suite as the in-memory run (tests/sweep-records-in-memory.test.ts); only
// the factory differs. The database is the wrangler config's `USAGE_DB`
// binding, which miniflare backs with a LOCAL D1 — the account's database is
// never contacted — with the real migrations from migrations/usage/ applied
// first, so a column the adapter names and the schema lacks fails here.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { d1QueriesUsed, runMetered } from "../../src/net";
import { createD1SweepRecords } from "../../src/sweep/d1";
import { runSweepRecordsConformance, sweepItem } from "../helpers/sweep-records-conformance";

const bindings = env as unknown as {
  USAGE_DB: D1Database;
  USAGE_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

beforeAll(async () => {
  await applyD1Migrations(bindings.USAGE_DB, bindings.USAGE_MIGRATIONS);
});

beforeEach(async () => {
  for (const table of ["sweep_cursors", "sweep_runs", "sweep_items"]) {
    await bindings.USAGE_DB.prepare(`DELETE FROM ${table}`).run();
  }
});

runSweepRecordsConformance("d1", () => createD1SweepRecords({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

describe("[d1] the sweep migration", () => {
  it("charges one D1 query per statement", async () => {
    const records = createD1SweepRecords({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await records.addItems([sweepItem()]);
      await records.itemsForProposal(sweepItem().proposalTs!);
      await records.cursor("C0DESIGN");
      return d1QueriesUsed();
    });
    expect(spent).toBe(3);
  });

  it("refuses a status outside the item lifecycle", async () => {
    const records = createD1SweepRecords({ db: bindings.USAGE_DB });
    await expect(
      records.addItems([sweepItem({ status: "expired" as never })]),
    ).rejects.toThrow(/CHECK/);
  });

  it("serves a card's items and a proposal's items from their indexes", async () => {
    const plan = async (sql: string) =>
      (await bindings.USAGE_DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).all<{ detail: string }>()).results
        .map((r) => r.detail)
        .join(" | ");
    expect(await plan("SELECT item_id FROM sweep_items WHERE proposal_ts = 'x'")).toMatch(/sweep_items_by_proposal/);
    expect(await plan("SELECT item_id FROM sweep_items WHERE card_key = 'x'")).toMatch(/sweep_items_by_card/);
  });

  it("leaves the turns table as the first migration made it", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('turns', 'sweep_cursors', 'sweep_runs', 'sweep_items') ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(["sweep_cursors", "sweep_items", "sweep_runs", "turns"]);
  });
});
