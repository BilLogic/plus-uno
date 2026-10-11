// Monday's DM to the lead: the in-scope Team Members rows the daily sync
// could not match to one Slack person (`src/usage/team-gaps.ts`), so the
// directory card follow-ups tag through can be kept complete.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTeamGaps, type StoredTeamRoles, type TeamGapsDeps } from "../src/usage/index";
import { SubrequestBudgetError } from "../src/net";
import { planRun } from "../src/scheduled/runs";

const LEAD = "U0LEAD0001";

function deps(stored: StoredTeamRoles | null, over: Partial<TeamGapsDeps> = {}) {
  const sent: Array<{ to: string; text: string }> = [];
  const d: TeamGapsDeps = {
    read: async () => stored,
    lead: LEAD,
    dm: async (to, text) => {
      sent.push({ to, text });
      return { ok: true };
    },
    ...over,
  };
  return { d, sent };
}

const STORED: StoredTeamRoles = { at: 1, roles: {}, gaps: ["Gus Hale", "Ivy <Jun>"] };

test("the lead alone is DMed the names the sync could not match", async () => {
  const { d, sent } = deps(STORED);
  const report = await runTeamGaps(d, { dryRun: false });
  assert.deepEqual(sent.map((s) => s.to), [LEAD]);
  assert.match(sent[0]!.text, /Gus Hale/);
  assert.match(sent[0]!.text, /Ivy &lt;Jun&gt;/, "a name is escaped, so it pings nobody");
  assert.doesNotMatch(sent[0]!.text, /<@/, "nobody is mentioned");
  assert.deepEqual([report.sent, report.summary], [true, "DMed the lead 2 unmatched name(s)"]);
});

test("nothing unmatched, no stored map, or no lead sends nothing", async () => {
  for (const [stored, lead, summary] of [
    [{ ...STORED, gaps: [] }, LEAD, "every in-scope row matched — no DM"],
    [{ at: 1, roles: {} }, LEAD, "every in-scope row matched — no DM"],
    [null, LEAD, "no stored team map — no DM"],
    [STORED, null, "LEAD_USER_ID not set — no DM"],
  ] as const) {
    const { d, sent } = deps(stored, { lead });
    const report = await runTeamGaps(d, { dryRun: false });
    assert.deepEqual(sent, []);
    assert.equal(report.summary, summary);
  }
});

test("a dry run lists the names and DMs nobody", async () => {
  const { d, sent } = deps(STORED);
  const report = await runTeamGaps(d, { dryRun: true });
  assert.deepEqual(sent, []);
  assert.deepEqual(report.names, ["Gus Hale", "Ivy <Jun>"]);
  assert.equal(report.sent, false);
});

test("a DM Slack refuses is reported; a budget stop is thrown through", async () => {
  const refused = deps(STORED, { dm: async () => ({ ok: false, error: "channel_not_found" }) });
  assert.equal((await runTeamGaps(refused.d, { dryRun: false })).summary, "DM to the lead failed: channel_not_found");
  const stopped = deps(STORED, { dm: async () => { throw new SubrequestBudgetError(38); } });
  await assert.rejects(runTeamGaps(stopped.d, { dryRun: false }), SubrequestBudgetError);
});

test("the DM is planned on Monday's morning run alone, after the sync", () => {
  const monday = planRun("morning", Date.UTC(2026, 9, 12, 13, 0));
  const job = monday.jobs.find((j) => j.kind === "team-roles-gaps");
  assert.deepEqual(job?.after, ["team-roles-sync"]);
  const tuesday = planRun("morning", Date.UTC(2026, 9, 13, 13, 0));
  assert.equal(tuesday.jobs.some((j) => j.kind === "team-roles-gaps"), false);
});
