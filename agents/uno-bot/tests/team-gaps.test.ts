// Monday's DM to the lead: the in-scope Team Members rows the daily sync
// could not match to one Slack person, and the matched ones with no Notion
// Person (`src/usage/team-gaps.ts`), so the directory card follow-ups tag
// through can be kept complete.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTeamGaps, type StoredTeamRoles, type TeamGapsDeps } from "../src/usage/index";
import { SubrequestBudgetError } from "../src/net";
import { planRun } from "../src/scheduled/runs";

const LEAD = "U0LEAD0001";
/** Monday 2026-10-12, 09:00 ET: the morning run. */
const MONDAY = Date.UTC(2026, 9, 12, 13, 0);
const HOUR = 60 * 60 * 1000;

function deps(stored: StoredTeamRoles | null, over: Partial<TeamGapsDeps> = {}) {
  const sent: Array<{ to: string; text: string }> = [];
  const d: TeamGapsDeps = {
    read: async () => stored,
    lead: LEAD,
    dm: async (to, text) => {
      sent.push({ to, text });
      return { ok: true };
    },
    now: () => MONDAY,
    ...over,
  };
  return { d, sent };
}

/** As this morning's sync stored it, minutes ago. */
const STORED: StoredTeamRoles = { at: 1, roles: {}, gaps: ["Gus Hale", "Ivy <Jun>"], noNotionPerson: [], gapsAt: MONDAY - 0.1 * HOUR };

test("the lead alone is DMed the names the sync could not match", async () => {
  const { d, sent } = deps(STORED);
  const report = await runTeamGaps(d, { dryRun: false });
  assert.deepEqual(sent.map((s) => s.to), [LEAD]);
  assert.match(sent[0]!.text, /Gus Hale/);
  assert.match(sent[0]!.text, /Ivy &lt;Jun&gt;/, "a name is escaped, so it pings nobody");
  assert.doesNotMatch(sent[0]!.text, /<@/, "nobody is mentioned");
  assert.doesNotMatch(sent[0]!.text, /Notion Person|last good sync/);
  assert.deepEqual([report.sent, report.summary], [true, "DMed the lead 2 unmatched, 0 without a Notion Person"]);
});

test("a second section lists matched people with no Notion Person, alone when nothing else is missing", async () => {
  const { d, sent } = deps({ ...STORED, gaps: [], noNotionPerson: ["Cy Diaz", "Bo Chen"] });
  const report = await runTeamGaps(d, { dryRun: false });
  assert.equal(sent.length, 1);
  assert.doesNotMatch(sent[0]!.text, /couldn't match/);
  assert.match(sent[0]!.text, /no Notion Person[^\n]*:\n• Cy Diaz\n• Bo Chen/);
  assert.equal(report.summary, "DMed the lead 0 unmatched, 2 without a Notion Person");

  const both = deps({ ...STORED, noNotionPerson: ["Cy Diaz"] });
  await runTeamGaps(both.d, { dryRun: false });
  assert.match(both.sent[0]!.text, /• Ivy &lt;Jun&gt;\n[\s\S]*no Notion Person[^\n]*:\n• Cy Diaz/);
});

test("a list from before today's sync says it is from the last good sync, and its date", async () => {
  const { d, sent } = deps({ ...STORED, gapsAt: MONDAY - 3 * 24 * HOUR });
  await runTeamGaps(d, { dryRun: false });
  assert.match(sent[0]!.text, /^This list is from the last good sync, on Oct 9: today's did not finish\./);
  // A map stored before the lists were dated reads by its build time.
  const old = deps({ at: MONDAY - 2 * 24 * HOUR, roles: {}, gaps: ["Gus Hale"] });
  await runTeamGaps(old.d, { dryRun: false });
  assert.match(old.sent[0]!.text, /last good sync, on Oct 10/);
});

test("nothing missing, no stored map, or no lead sends nothing", async () => {
  for (const [stored, lead, summary] of [
    [{ ...STORED, gaps: [], noNotionPerson: [] }, LEAD, "every in-scope row matched with a Notion Person — no DM"],
    [{ at: 1, roles: {} }, LEAD, "every in-scope row matched with a Notion Person — no DM"],
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
  const { d, sent } = deps({ ...STORED, noNotionPerson: ["Cy Diaz"] });
  const report = await runTeamGaps(d, { dryRun: true });
  assert.deepEqual(sent, []);
  assert.deepEqual(report.names, ["Gus Hale", "Ivy <Jun>"]);
  assert.deepEqual(report.noNotionPerson, ["Cy Diaz"]);
  assert.equal(report.sent, false);
});

test("a DM Slack refuses is reported; a budget stop is thrown through", async () => {
  const refused = deps(STORED, { dm: async () => ({ ok: false, error: "channel_not_found" }) });
  assert.equal((await runTeamGaps(refused.d, { dryRun: false })).summary, "DM to the lead failed: channel_not_found");
  const stopped = deps(STORED, { dm: async () => { throw new SubrequestBudgetError(38); } });
  await assert.rejects(runTeamGaps(stopped.d, { dryRun: false }), SubrequestBudgetError);
});

test("the DM is planned on Monday's morning run alone, after the sync", () => {
  const monday = planRun("morning", MONDAY);
  const job = monday.jobs.find((j) => j.kind === "team-roles-gaps");
  assert.deepEqual(job?.after, ["team-roles-sync"]);
  const tuesday = planRun("morning", MONDAY + 24 * HOUR);
  assert.equal(tuesday.jobs.some((j) => j.kind === "team-roles-gaps"), false);
});
