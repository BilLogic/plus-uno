// The UsageLog conformance suite, run against the D1 ADAPTER under workerd.
//
// Same suite as the in-memory run (tests/usage-log-in-memory.test.ts); only the
// factory differs. The database is the wrangler config's `USAGE_DB` binding,
// which miniflare backs with a LOCAL D1 — the `database_id` in
// wrangler.toml is never contacted — and the real migrations from
// migrations/usage/ are applied to it first, so a column the adapter names and
// the schema lacks fails here.
//
// Every test works on its own turn ids, and the suite's "same turn twice keeps
// one row" case is an upsert on one id, so the tests can share the one database
// the binding gives them; the table is emptied between cases all the same, so
// no case can pass on another's row.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { D1_QUERY_CAP, d1QueriesUsed, internalSubrequestsUsed, isSubrequestBudgetError, runMetered } from "../../src/net";
import { createD1UsageLog } from "../../src/usage/d1";
import { runUsageLogConformance, turnRecord } from "../helpers/usage-log-conformance";
import { createD1ProposalEventLog } from "../../src/usage/proposal-events-d1";
import { runProposalEventConformance, stagedRow } from "../helpers/proposal-events-conformance";

const bindings = env as unknown as {
  USAGE_DB: D1Database;
  USAGE_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

beforeAll(async () => {
  await applyD1Migrations(bindings.USAGE_DB, bindings.USAGE_MIGRATIONS);
});

beforeEach(async () => {
  await bindings.USAGE_DB.prepare("DELETE FROM turns").run();
  await bindings.USAGE_DB.prepare("DELETE FROM proposal_events").run();
});

runUsageLogConformance("d1", () => createD1UsageLog({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

// The proposal-event suite on the same database: `noteSelfFiledTicket` writes
// the `turns` row the usage log reads back.
runProposalEventConformance(
  "d1",
  () => ({
    events: createD1ProposalEventLog({ db: bindings.USAGE_DB }),
    turns: createD1UsageLog({ db: bindings.USAGE_DB }),
  }),
  { it: (name, fn) => it(name, fn) },
);

describe("[d1] proposal events", () => {
  it("refuses an event kind the schema does not name", async () => {
    const events = createD1ProposalEventLog({ db: bindings.USAGE_DB });
    await expect(
      events.record({ ...stagedRow(), event: "approved" as never }),
    ).rejects.toThrow(/CHECK/);
  });

  it("charges one D1 query per statement, the expiry pass included", async () => {
    const events = createD1ProposalEventLog({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await events.record(stagedRow());
      await events.expireOverdue(Date.now());
      return d1QueriesUsed();
    });
    expect(spent).toBe(2);
  });
});

describe("[d1] the meter", () => {
  it("charges one D1 query, to the internal bucket, per statement", async () => {
    const log = createD1UsageLog({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await log.record(turnRecord());
      await log.get(turnRecord().turnId);
      return { d1: d1QueriesUsed(), internal: internalSubrequestsUsed() };
    });
    expect(spent).toEqual({ d1: 2, internal: 2 });
  });

  it("refuses the write past the cap as a budget stop, and sends nothing", async () => {
    const log = createD1UsageLog({ db: bindings.USAGE_DB });
    const err = await runMetered(async () => {
      for (let i = 0; i < D1_QUERY_CAP; i++) await log.get("C1:none");
      return log.record(turnRecord()).then(
        () => null,
        (e: unknown) => e,
      );
    });
    expect(isSubrequestBudgetError(err)).toBe(true);
    expect(await log.get(turnRecord().turnId)).toBeNull();
  });
});

describe("[d1] the first migration", () => {
  it("indexes time, requester and the unclassified rows", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'turns' AND sql IS NOT NULL ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual([
      "turns_by_requester",
      "turns_by_time",
      "turns_unclassified",
    ]);
  });

  it("serves the classifier's queue from the partial index", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "EXPLAIN QUERY PLAN SELECT turn_id FROM turns WHERE classified_at IS NULL AND test_traffic = 0 ORDER BY asked_at",
    ).all<{ detail: string }>();
    expect(results.map((r) => r.detail).join(" | ")).toMatch(/turns_unclassified/);
  });
});
