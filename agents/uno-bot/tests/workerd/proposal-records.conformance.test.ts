// The drawn-proposal records conformance suite, run against the D1 ADAPTER
// under workerd, with the real migrations applied to a local D1 — the
// account's database is never contacted. Same suite as the in-memory run
// (tests/proposal-records-in-memory.test.ts); only the factory differs.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { d1QueriesUsed, runMetered } from "../../src/net";
import { createD1ProposalRecords } from "../../src/blueprint-upkeep/proposal-records-d1";
import { drawn, runProposalRecordsConformance } from "../helpers/proposal-records-conformance";

const bindings = env as unknown as {
  USAGE_DB: D1Database;
  USAGE_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

beforeAll(async () => {
  await applyD1Migrations(bindings.USAGE_DB, bindings.USAGE_MIGRATIONS);
});

beforeEach(async () => {
  await bindings.USAGE_DB.prepare("DELETE FROM blueprint_proposals").run();
});

runProposalRecordsConformance("d1", () => createD1ProposalRecords({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

describe("[d1] the blueprint proposals migration", () => {
  it("charges one D1 query per statement", async () => {
    const records = createD1ProposalRecords({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await records.record(drawn());
      await records.inThread("C0TEAM", "1700000000.000100");
      await records.linkCard("C0TEAM", "1700000000.000100", "page-a");
      await records.unlinkedBefore(Number.MAX_SAFE_INTEGER, 10);
      return d1QueriesUsed();
    });
    expect(spent).toBe(4);
  });

  it("holds ids and times only — no text", async () => {
    const { results } = await bindings.USAGE_DB.prepare("SELECT name FROM pragma_table_info('blueprint_proposals')").all<{ name: string }>();
    for (const { name } of results) expect(name).not.toMatch(/text|content|title|summary|label|scenario/);
  });

  it("serves a thread's lookup, the unlinked check and a card's lookup from their indexes", async () => {
    const plan = async (sql: string) =>
      (await bindings.USAGE_DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).all<{ detail: string }>()).results.map((r) => r.detail).join(" | ");
    expect(await plan("SELECT proposal_ts FROM blueprint_proposals WHERE channel_id = 'C' AND thread_ts = 't'")).toMatch(
      /blueprint_proposals_by_thread/,
    );
    expect(await plan("SELECT proposal_ts FROM blueprint_proposals WHERE card_id IS NULL AND written_at <= 5 ORDER BY written_at")).toMatch(
      /blueprint_proposals_unlinked/,
    );
    expect(
      await plan(
        "SELECT proposal_ts FROM blueprint_proposals WHERE card_id IS NULL AND offered_at IS NULL AND withdrawn_at IS NULL AND written_at <= 5 ORDER BY written_at",
      ),
    ).toMatch(/blueprint_proposals_unlinked/);
    // A card's lookup rides the same index: card_id leads it.
    expect(await plan("SELECT proposal_ts FROM blueprint_proposals WHERE card_id = 'page-a' ORDER BY written_at")).toMatch(
      /blueprint_proposals_unlinked/,
    );
  });

  it("charges one D1 query per clean-up statement", async () => {
    const records = createD1ProposalRecords({ db: bindings.USAGE_DB });
    await records.record(drawn());
    const spent = await runMetered(async () => {
      await records.standing(drawn().proposalTs);
      await records.standingInThread("C0TEAM", "1700000000.000100");
      await records.dueForOffer(Number.MAX_SAFE_INTEGER, 10);
      await records.claimOffer(drawn().proposalTs, 1);
      await records.releaseOffer(drawn().proposalTs);
      await records.withdraw(drawn().proposalTs, 2);
      return d1QueriesUsed();
    });
    expect(spent).toBe(6);
  });
});
