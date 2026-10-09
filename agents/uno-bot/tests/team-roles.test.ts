// The kickoff role map: the Notion Team Members roster matched to the Slack
// directory (`src/usage/roles.ts` `buildRoleMap`), and the daily sync that
// stores it (`src/usage/team-roles-sync.ts`).
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  aimedAtOf,
  buildRoleMap,
  normalisePersonName,
  roleOf,
  slackPersonOfFigma,
  syncTeamRoles,
  DIRECTORY_MAX_PAGES,
  TEAM_ROLES_KV_KEY,
  type DirectoryPerson,
  type RosterRow,
  type StoredTeamRoles,
  type TeamRolesSyncDeps,
} from "../src/usage/index";
import { SubrequestBudgetError } from "../src/net";
import { figmaPeopleFor, teamRolesFor } from "../src/usage/production";
import type { Env } from "../src/types";

const ROSTER: RosterRow[] = [
  { name: "Ana Pérez", group: "Product Manager", affiliation: "Current Member" },
  { name: "  bo   CHEN ", group: "Software Developer" },
  { name: "Cy Diaz", group: "Product Designer" },
  { name: "Dee Evans", group: "Researcher" },
  { name: "Eli Fox", group: "Software Developer", affiliation: "Past Collaborators" },
];

const DIRECTORY: DirectoryPerson[] = [
  { id: "U0ANA0001", real_name: "Ana Perez" },
  { id: "U0BO00001", real_name: "Robert Chen", profile: { display_name: "Bo Chen" } },
  { id: "U0CY00001", real_name: "Cy Diaz" },
  { id: "U0DEE0001", real_name: "Dee Evans" },
  { id: "U0ELI0001", real_name: "Eli Fox" },
];

test("the Group options map to pm, dev and design; every other option to no role", () => {
  const { roles, matched, unmatched, ambiguous } = buildRoleMap(ROSTER, DIRECTORY);
  assert.deepEqual(roles, { U0ANA0001: "pm", U0BO00001: "dev", U0CY00001: "design" });
  assert.deepEqual([matched, unmatched, ambiguous], [3, [], []]);
  assert.equal(roleOf("U0DEE0001", roles), null);
});

test("a Past Collaborator is skipped, whatever their group", () => {
  assert.equal(roleOf("U0ELI0001", buildRoleMap(ROSTER, DIRECTORY).roles), null);
});

test("names match across case, accents and whitespace, and nothing looser", () => {
  assert.equal(normalisePersonName("  ÁNA   Pérez "), "ana perez");
  const { roles, unmatched } = buildRoleMap(
    [
      { name: "Ana P.", group: "Product Manager" },
      { name: "Ana", group: "Product Manager" },
    ],
    DIRECTORY,
  );
  assert.deepEqual(roles, {});
  assert.deepEqual(unmatched, ["Ana P.", "Ana"]);
});

test("a name two members carry is ambiguous and gives nobody a role", () => {
  const { roles, matched, ambiguous } = buildRoleMap(
    [{ name: "Cy Diaz", group: "Product Designer" }],
    [...DIRECTORY, { id: "U0CY00002", real_name: "Someone", profile: { display_name: "cy diaz" } }],
  );
  assert.deepEqual([roles, matched, ambiguous], [{}, 0, ["Cy Diaz"]]);
});

test("a member two rows give different roles is ambiguous; the same role twice is not", () => {
  const twoRoles = buildRoleMap(
    [
      { name: "Cy Diaz", group: "Product Designer" },
      { name: "cy diaz", group: "Product Manager" },
    ],
    DIRECTORY,
  );
  assert.deepEqual([twoRoles.roles, twoRoles.ambiguous], [{}, ["Cy Diaz", "cy diaz"]]);
  const sameRole = buildRoleMap(
    [
      { name: "Cy Diaz", group: "Product Designer" },
      { name: "cy diaz", group: "Product Designer" },
    ],
    DIRECTORY,
  );
  assert.deepEqual(sameRole.roles, { U0CY00001: "design" });
});

test("deactivated members and bots are never matched", () => {
  const { roles, unmatched } = buildRoleMap(
    [{ name: "Cy Diaz", group: "Product Designer" }],
    [
      { id: "U0CY00001", real_name: "Cy Diaz", deleted: true },
      { id: "B0CY00001", real_name: "Cy Diaz", is_bot: true },
    ],
  );
  assert.deepEqual([roles, unmatched], [{}, ["Cy Diaz"]]);
});

test("a row's own Slack id is taken as its match", () => {
  const { roles } = buildRoleMap(
    [{ name: "Nobody Listed", group: "Software Developer", slackUserId: "U0ZED0001" }],
    [{ id: "U0ZED0001", real_name: "Zed Young" }],
  );
  assert.deepEqual(roles, { U0ZED0001: "dev" });
});

test("a row's Slack id that is not an active, non-bot member gets no role and counts as unmatched", () => {
  const { roles, unmatched, matched } = buildRoleMap(
    [
      { name: "Not In Slack", group: "Software Developer", slackUserId: "U0GONE001" },
      { name: "Left Us", group: "Product Manager", slackUserId: "U0LEFT001" },
      { name: "A Bot", group: "Product Designer", slackUserId: "B0BOT0001" },
      { name: "Slackbot", group: "Product Designer", slackUserId: "USLACKBOT" },
    ],
    [
      { id: "U0LEFT001", real_name: "Left Us", deleted: true },
      { id: "B0BOT0001", real_name: "A Bot", is_bot: true },
      { id: "USLACKBOT", real_name: "Slackbot" },
    ],
  );
  assert.deepEqual([roles, matched, unmatched], [{}, 0, ["Not In Slack", "Left Us", "A Bot", "Slackbot"]]);
});

test("someone off the map, or nobody at all, has no role", () => {
  assert.equal(roleOf("U0NOBODY", {}), null);
  assert.equal(roleOf(null), null);
  assert.equal(roleOf("U0ANA0001"), null);
  // Inherited keys are not people.
  assert.equal(roleOf("toString", {}), null);
});

// ── Figma commenters ────────────────────────────────────────────────────────

test("a Figma user id maps to the Slack person its row matches; an unmapped id to nobody", () => {
  const { figmaPeople } = buildRoleMap(
    [
      { name: "Cy Diaz", group: "Product Designer", figmaUserId: "1105000000000000001" },
      { name: "Ana Pérez", group: "Product Manager" },
    ],
    DIRECTORY,
  );
  assert.equal(slackPersonOfFigma("1105000000000000001", figmaPeople), "U0CY00001");
  assert.equal(slackPersonOfFigma("9999999999999999999", figmaPeople), null);
  assert.equal(slackPersonOfFigma(null, figmaPeople), null);
  // Inherited keys are not people.
  assert.equal(slackPersonOfFigma("toString", figmaPeople), null);
});

test("a Figma id maps whatever the row's group; never for a Past Collaborator", () => {
  const { figmaPeople, roles } = buildRoleMap(
    [
      { name: "Dee Evans", group: "Researcher", figmaUserId: "1105000000000000004" },
      { name: "Eli Fox", group: "Software Developer", affiliation: "Past Collaborators", figmaUserId: "1105000000000000005" },
    ],
    DIRECTORY,
  );
  assert.deepEqual(figmaPeople, { "1105000000000000004": "U0DEE0001" });
  assert.deepEqual(roles, {});
});

test("a Figma id follows the role map's matching: no match, an ambiguous name or a row's own Slack id", () => {
  const { figmaPeople } = buildRoleMap(
    [
      { name: "Gus Hale", group: "Researcher", figmaUserId: "1105000000000000007" },
      { name: "Cy Diaz", group: "Product Designer", figmaUserId: "1105000000000000003" },
      { name: "Nobody Listed", figmaUserId: "1105000000000000008", slackUserId: "U0ZED0001" },
    ],
    [...DIRECTORY, { id: "U0CY00002", real_name: "cy diaz" }, { id: "U0ZED0001", real_name: "Zed Young" }],
  );
  assert.deepEqual(figmaPeople, { "1105000000000000008": "U0ZED0001" });
});

test("one Figma id two rows give to different people maps to nobody", () => {
  const { figmaPeople } = buildRoleMap(
    [
      { name: "Ana Pérez", figmaUserId: "1105000000000000001" },
      { name: "Cy Diaz", figmaUserId: "1105000000000000001" },
      { name: "Dee Evans", figmaUserId: "1105000000000000004" },
      { name: "dee evans", figmaUserId: "1105000000000000004" },
    ],
    DIRECTORY,
  );
  assert.deepEqual(figmaPeople, { "1105000000000000004": "U0DEE0001" });
});

test("the person an ask is aimed at is the first one it names other than the asker", () => {
  assert.equal(aimedAtOf("<@U1> <@U2|bo> file it", "U1"), "U2");
  assert.equal(aimedAtOf("<@U1> only me", "U1"), null);
  assert.equal(aimedAtOf("<#C123|general> is a channel, not a person", "U1"), null);
});

// ── The sync ────────────────────────────────────────────────────────────────

function syncDeps(over: Partial<TeamRolesSyncDeps> = {}): TeamRolesSyncDeps & { written: StoredTeamRoles[]; pages: number } {
  const written: StoredTeamRoles[] = [];
  const state = { pages: 0 };
  const deps = {
    written,
    get pages() {
      return state.pages;
    },
    roster: async () => ({ members: ROSTER, truncated: false }),
    // Two pages, so the cursor is followed.
    listUsers: async (cursor?: string) => {
      state.pages++;
      return cursor
        ? { ok: true, members: DIRECTORY.slice(2) }
        : { ok: true, members: DIRECTORY.slice(0, 2), next_cursor: "page-2" };
    },
    read: async () => null,
    write: async (stored: StoredTeamRoles) => {
      written.push(stored);
    },
    now: () => 1_000,
    ...over,
  };
  return deps;
}

test("a sync reads every directory page and stores the map, reporting counts only", async () => {
  const deps = syncDeps();
  const report = await syncTeamRoles(deps, { dryRun: false });
  assert.equal(deps.pages, 2);
  assert.deepEqual(deps.written, [{ at: 1_000, roles: { U0ANA0001: "pm", U0BO00001: "dev", U0CY00001: "design" }, figmaPeople: {} }]);
  assert.deepEqual(report, { written: true, matched: 3, unmatched: 0, ambiguous: 0, summary: "3 matched, 0 unmatched, 0 ambiguous" });
});

test("a sync stores the Figma ids with the roles, so a webhook job never reads Notion", async () => {
  const deps = syncDeps({
    roster: async () => ({
      members: ROSTER.map((row) => (row.name === "Dee Evans" ? { ...row, figmaUserId: "1105000000000000004" } : row)),
      truncated: false,
    }),
  });
  const report = await syncTeamRoles(deps, { dryRun: false });
  assert.deepEqual(deps.written[0]?.figmaPeople, { "1105000000000000004": "U0DEE0001" });
  assert.equal(report.summary, "3 matched, 0 unmatched, 0 ambiguous, 1 Figma id");
  const kv = fakeKv(async (key) => (key === TEAM_ROLES_KV_KEY ? deps.written[0] : null));
  assert.equal(slackPersonOfFigma("1105000000000000004", await figmaPeopleFor(kv)), "U0DEE0001");
  assert.equal(slackPersonOfFigma("1105000000000000009", await figmaPeopleFor(kv)), null);
});

test("a map stored before Figma ids, no map, no KV or a failed read maps no Figma id", async () => {
  const old: StoredTeamRoles = { at: 1, roles: { U0ANA0001: "pm" } };
  assert.deepEqual(await figmaPeopleFor(fakeKv(async () => old)), {});
  assert.deepEqual(await figmaPeopleFor(fakeKv(async () => null)), {});
  assert.deepEqual(await figmaPeopleFor({}), {});
  assert.deepEqual(await figmaPeopleFor(fakeKv(async () => { throw new Error("kv down"); })), {});
  await assert.rejects(figmaPeopleFor(fakeKv(async () => { throw new SubrequestBudgetError(38); })), SubrequestBudgetError);
});

test("a dry run lists the unmatched and ambiguous names and writes nothing", async () => {
  const deps = syncDeps({
    roster: async () => ({
      members: [...ROSTER, { name: "Gus Hale", group: "Product Manager" }],
      truncated: false,
    }),
  });
  const report = await syncTeamRoles(deps, { dryRun: true });
  assert.deepEqual(deps.written, []);
  assert.equal(report.written, false);
  assert.deepEqual(report.unmatchedNames, ["Gus Hale"]);
  assert.deepEqual(report.ambiguousNames, []);
  assert.match(report.summary, /^dry run, nothing written: 3 matched, 1 unmatched, 0 ambiguous$/);
});

test("a failed or short read writes nothing, so the last map is kept", async () => {
  const cases: Partial<TeamRolesSyncDeps>[] = [
    { roster: async () => { throw new Error("Notion 404 object_not_found"); } },
    { roster: async () => ({ members: ROSTER, truncated: true }) },
    { listUsers: async () => ({ ok: false, error: "ratelimited" }) },
    // A directory that never ends stops at the page cap.
    { listUsers: async () => ({ ok: true, members: [], next_cursor: "more" }) },
    { read: async () => { throw new Error("kv down"); } },
  ];
  for (const over of cases) {
    const deps = syncDeps(over);
    const report = await syncTeamRoles(deps, { dryRun: false });
    assert.deepEqual(deps.written, []);
    assert.equal(report.written, false);
    assert.match(report.summary, /last map kept$/);
  }
});

test("the directory read stays inside its page cap", async () => {
  let pages = 0;
  const deps = syncDeps({
    listUsers: async () => {
      pages++;
      return { ok: true, members: [], next_cursor: "more" };
    },
  });
  await syncTeamRoles(deps, { dryRun: false });
  assert.equal(pages, DIRECTORY_MAX_PAGES);
});

test("a budget stop is thrown through, for the runner to defer", async () => {
  const deps = syncDeps({ roster: async () => { throw new SubrequestBudgetError(38); } });
  await assert.rejects(syncTeamRoles(deps, { dryRun: false }), SubrequestBudgetError);
});

// ── The shrink guard ────────────────────────────────────────────────────────

/** A stored map of `n` entries, none of them the ones the fixtures build. */
function storedOf(n: number): StoredTeamRoles {
  return { at: 1, roles: Object.fromEntries(Array.from({ length: n }, (_, i) => [`U0OLD${String(i).padStart(4, "0")}`, "dev" as const])) };
}

test("an empty read keeps a stored map that has entries", async () => {
  const deps = syncDeps({
    roster: async () => ({ members: ROSTER.map((row) => ({ ...row, group: "Designer" })), truncated: false }),
    read: async () => storedOf(3),
  });
  const report = await syncTeamRoles(deps, { dryRun: false });
  assert.deepEqual(deps.written, []);
  assert.equal(report.written, false);
  assert.equal(report.keptPrevious, true);
  assert.equal(report.summary, "0 matched, 0 unmatched, 0 ambiguous — kept previous map: new map had 0 of 3");
});

test("a new map 60% smaller than the stored one keeps it", async () => {
  // Two entries (Ana, Bo) against a stored five.
  const deps = syncDeps({ roster: async () => ({ members: ROSTER.slice(0, 2), truncated: false }), read: async () => storedOf(5) });
  const report = await syncTeamRoles(deps, { dryRun: false });
  assert.deepEqual(deps.written, []);
  assert.equal(report.keptPrevious, true);
  assert.match(report.summary, /kept previous map: new map had 2 of 5$/);
});

test("a normal change writes: a new map at least half the stored one, or any map over an empty one", async () => {
  for (const stored of [storedOf(6), storedOf(4), storedOf(0), null]) {
    const deps = syncDeps({ read: async () => stored });
    const report = await syncTeamRoles(deps, { dryRun: false });
    assert.equal(deps.written.length, 1);
    assert.equal(report.written, true);
    assert.equal(report.keptPrevious, undefined);
  }
});

test("a dry run reports a shrink the same way, and writes nothing", async () => {
  const deps = syncDeps({ roster: async () => ({ members: [], truncated: false }), read: async () => storedOf(4) });
  const report = await syncTeamRoles(deps, { dryRun: true });
  assert.deepEqual(deps.written, []);
  assert.equal(report.keptPrevious, true);
  assert.equal(report.summary, "dry run, nothing written: 0 matched, 0 unmatched, 0 ambiguous — kept previous map: new map had 0 of 4");
});

// ── The stored map, as a turn reads it ──────────────────────────────────────

function fakeKv(get: (key: string) => Promise<unknown>): Pick<Env, "HARNESS_KV"> {
  return { HARNESS_KV: { get } as unknown as KVNamespace };
}

test("a turn reads the stored map; no map, no KV or a failed read reads as none", async () => {
  const stored: StoredTeamRoles = { at: 1, roles: { U0ANA0001: "pm" } };
  assert.deepEqual(await teamRolesFor(fakeKv(async (key) => (key === TEAM_ROLES_KV_KEY ? stored : null))), stored.roles);
  assert.deepEqual(await teamRolesFor(fakeKv(async () => null)), {});
  assert.deepEqual(await teamRolesFor({}), {});
  assert.deepEqual(await teamRolesFor(fakeKv(async () => { throw new Error("kv down"); })), {});
});

test("a budget stop reading the stored map is thrown through, not read as no map", async () => {
  await assert.rejects(teamRolesFor(fakeKv(async () => { throw new SubrequestBudgetError(38); })), SubrequestBudgetError);
});
