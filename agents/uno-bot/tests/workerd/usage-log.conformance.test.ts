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
import { createD1AskCategories } from "../../src/usage/category-store";
import { createD1UsageLog } from "../../src/usage/d1";
import { createD1ResolutionLog } from "../../src/usage/resolution-d1";
import { runResolutionLogConformance } from "../helpers/resolution-log-conformance";
import { runCategoryConformance, runUsageLogConformance, turnRecord } from "../helpers/usage-log-conformance";
import { createD1ProposalEventLog } from "../../src/usage/proposal-events-d1";
import { createD1AnswerFeedbackLog } from "../../src/usage/feedback-d1";
import { runAnswerFeedbackConformance } from "../helpers/answer-feedback-conformance";
import { eventRow, runProposalEventConformance, stagedRow } from "../helpers/proposal-events-conformance";
import { createD1AppreciationLog } from "../../src/usage/appreciation-d1";
import { runAppreciationConformance, thanks } from "../helpers/appreciation-conformance";

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
  await bindings.USAGE_DB.prepare("DELETE FROM answer_feedback").run();
  await bindings.USAGE_DB.prepare("DELETE FROM appreciation").run();
});

runUsageLogConformance("d1", () => createD1UsageLog({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

// The corpus-category cases — the classifier's queue, its one write, the
// 14-day purge on a fake clock — against the real schema.
runCategoryConformance(
  "d1",
  () => ({
    log: createD1UsageLog({ db: bindings.USAGE_DB }),
    store: createD1AskCategories({ db: bindings.USAGE_DB }),
  }),
  { it: (name, fn) => it(name, fn) },
);

runResolutionLogConformance(
  "d1",
  () => ({
    usage: createD1UsageLog({ db: bindings.USAGE_DB }),
    resolutions: createD1ResolutionLog({ db: bindings.USAGE_DB }),
  }),
  { it: (name, fn) => it(name, fn) },
);

// The proposal-event suite on the same database: `noteSelfFiledTicket` writes
// the `turns` row the usage log reads back.
runProposalEventConformance(
  "d1",
  () => ({
    events: createD1ProposalEventLog({ db: bindings.USAGE_DB }),
    turns: createD1UsageLog({ db: bindings.USAGE_DB }),
    resolutions: createD1ResolutionLog({ db: bindings.USAGE_DB }),
  }),
  { it: (name, fn) => it(name, fn) },
);

runAnswerFeedbackConformance("d1", () => createD1AnswerFeedbackLog({ db: bindings.USAGE_DB }), {
  it: (name, fn) => it(name, fn),
});

// A message is known to the D1 log through the rows its one statement reads:
// the answer's feedback naming its turn, and that turn's own row.
runAppreciationConformance(
  "d1",
  () => ({
    log: createD1AppreciationLog({ db: bindings.USAGE_DB }),
    async know(channel, itemTs, known) {
      await createD1AnswerFeedbackLog({ db: bindings.USAGE_DB }).record({
        channel, answerTs: itemTs, userId: "U0RATER", turnId: known.turnId, rating: "up", reason: null, hasNote: false, at: 1,
      });
      await createD1UsageLog({ db: bindings.USAGE_DB }).record(
        turnRecord({ turnId: known.turnId, conversationType: known.conversationType, proposalId: null }),
      );
    },
  }),
  { it: (name, fn) => it(name, fn) },
);

describe("[d1] appreciation", () => {
  it("a thanks on a card a turn staged in that channel joins the turn, and only in that channel", async () => {
    await createD1UsageLog({ db: bindings.USAGE_DB }).record(
      turnRecord({ turnId: "C1:1700000000.000200", proposalId: "1700000000.000300", conversationType: "channel" }),
    );
    const log = createD1AppreciationLog({ db: bindings.USAGE_DB });
    await log.record(thanks({ itemTs: "1700000000.000300" }));
    await log.record(thanks({ channel: "C10", itemTs: "1700000000.000300" }));
    expect((await log.get("C1", "1700000000.000300", "U1", "pray"))?.turnId).toBe("C1:1700000000.000200");
    expect((await log.get("C10", "1700000000.000300", "U1", "pray"))?.turnId).toBeNull();
  });

  it("a thanks costs one D1 query, whatever it looks up", async () => {
    const log = createD1AppreciationLog({ db: bindings.USAGE_DB });
    const spent = await runMetered(async () => {
      await log.record(thanks());
      return d1QueriesUsed();
    });
    expect(spent).toBe(1);
  });

  it("turns.thanks and proposal_events.revises_proposal_id are on the schema", async () => {
    await createD1UsageLog({ db: bindings.USAGE_DB }).record(turnRecord({ thanks: true }));
    await expect(bindings.USAGE_DB.prepare("UPDATE turns SET thanks = 2").run()).rejects.toThrow(/CHECK/);
    const events = createD1ProposalEventLog({ db: bindings.USAGE_DB });
    await events.record(stagedRow({ revisesProposalId: "1700000000.000250" }));
    expect((await events.eventsOf(stagedRow().proposalId))[0]?.revisesProposalId).toBe("1700000000.000250");
  });

  it("proposal_events.confirmed_edited is on the schema, and holds only 0 or 1", async () => {
    const events = createD1ProposalEventLog({ db: bindings.USAGE_DB });
    await events.record(eventRow("confirmed", { proposalId: "1700000000.000700", via: "review", confirmedEdited: true }));
    expect((await events.eventsOf("1700000000.000700"))[0]?.confirmedEdited).toBe(true);
    await expect(
      bindings.USAGE_DB.prepare("UPDATE proposal_events SET confirmed_edited = 2 WHERE proposal_id = '1700000000.000700'").run(),
    ).rejects.toThrow(/CHECK/);
  });
});

describe("[d1] answer feedback", () => {
  it("refuses a reason the schema does not name", async () => {
    const log = createD1AnswerFeedbackLog({ db: bindings.USAGE_DB });
    await expect(
      log.record({ channel: "C1", answerTs: "1.2", userId: "U1", turnId: null, rating: "down", reason: "rude" as never, hasNote: false, at: 1 }),
    ).rejects.toThrow(/CHECK/);
  });
});

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

describe("[d1] the migrations", () => {
  it("index time, requester, the unclassified rows, the resolution queue and the card", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'turns' AND sql IS NOT NULL ORDER BY name",
    ).all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual([
      "turns_by_proposal",
      "turns_by_requester",
      "turns_by_time",
      "turns_resolution_unchecked",
      "turns_unclassified",
      "turns_with_text",
    ]);
  });

  it("serves the classifier's queue from the partial index", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "EXPLAIN QUERY PLAN SELECT turn_id FROM turns WHERE classified_at IS NULL AND test_traffic = 0 ORDER BY asked_at",
    ).all<{ detail: string }>();
    expect(results.map((r) => r.detail).join(" | ")).toMatch(/turns_unclassified/);
  });

  it("serves the resolution pass's queue from its partial index", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "EXPLAIN QUERY PLAN SELECT turn_id FROM turns WHERE resolution_checked_at IS NULL AND test_traffic = 0 AND asked_at > 0 ORDER BY asked_at",
    ).all<{ detail: string }>();
    expect(results.map((r) => r.detail).join(" | ")).toMatch(/turns_resolution_unchecked/);
  });
});

describe("[d1] the categories migration", () => {
  it("serves the purge from the rows-with-text index", async () => {
    const { results } = await bindings.USAGE_DB.prepare(
      "EXPLAIN QUERY PLAN UPDATE turns SET request_text = NULL WHERE request_text IS NOT NULL AND asked_at < 1",
    ).all<{ detail: string }>();
    expect(results.map((r) => r.detail).join(" | ")).toMatch(/turns_with_text/);
  });

  it("refuses a pain_category outside 1–7", async () => {
    await createD1UsageLog({ db: bindings.USAGE_DB }).record(turnRecord());
    await expect(
      bindings.USAGE_DB.prepare("UPDATE turns SET pain_category = 8").run(),
    ).rejects.toThrow(/CHECK/);
  });
});
