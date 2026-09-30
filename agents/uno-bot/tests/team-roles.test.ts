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
  syncTeamRoles,
  DIRECTORY_MAX_PAGES,
  TEAM_ROLES_KV_KEY,
  type DirectoryPerson,
  type RosterRow,
  type StoredTeamRoles,
  type TeamRolesSyncDeps,
} from "../src/usage/index";
import { SubrequestBudgetError } from "../src/net";
import { teamRolesFor } from "../src/usage/production";
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
  const { roles } = buildRoleMap([{ name: "Nobody Listed", group: "Software Developer", slackUserId: "U0ZED0001" }], []);
  assert.deepEqual(roles, { U0ZED0001: "dev" });
});

test("someone off the map, or nobody at all, has no role", () => {
  assert.equal(roleOf("U0NOBODY", {}), null);
  assert.equal(roleOf(null), null);
  assert.equal(roleOf("U0ANA0001"), null);
  // Inherited keys are not people.
  assert.equal(roleOf("toString", {}), null);
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
  assert.deepEqual(deps.written, [{ at: 1_000, roles: { U0ANA0001: "pm", U0BO00001: "dev", U0CY00001: "design" } }]);
  assert.deepEqual(report, { written: true, matched: 3, unmatched: 0, ambiguous: 0, summary: "3 matched, 0 unmatched, 0 ambiguous" });
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
