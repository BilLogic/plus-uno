// The daily role-map sync: the Notion Team Members roster matched against the
// Slack directory (`./roles.ts` `buildRoleMap`), the Slack-id → role map and
// the Figma-id → Slack-id map kept in KV together, for turns and Figma jobs to
// read without calling Notion.
//
// One Notion query, paged, and one users.list read, paged — both inside the
// run's lookup ceiling. A read that fails or stops short writes nothing, so a
// failed sync keeps the last map until its TTL runs out. The map lives in KV
// only: D1 holds no names, ids or roles beyond a kickoff's `aimed_at_role`
// (ADR-030). The job logs counts; a dry run lists the names that found no
// one, so the CMS can be fixed.
//
// A read that succeeds can still come back hollow — the database moved, rows
// restricted, a Group option renamed so nothing maps. So a new map that is
// empty, or under half the size of the stored one, does not replace a stored
// map that has entries; the run says so and the old map stands.
//
// Free of `Env`: its reads and its store are passed in (`./production.ts`
// binds them), so the Node suite drives it with fakes.

import { rethrowIfBudget } from "../net";
import { buildRoleMap, type DirectoryPerson, type FigmaPeople, type RosterRow, type TeamRoles } from "./roles";

/** The KV key the map is kept under. */
export const TEAM_ROLES_KV_KEY = "team-roles:map";

/** How long a stored map lasts: a few days, so a weekend and a failed sync or
 *  two keep it, and a roster nobody syncs any more stops being read. */
export const TEAM_ROLES_TTL_S = 4 * 24 * 60 * 60;

/** users.list pages read at most (200 members a page). A directory longer than
 *  this is a read that stopped short, and writes nothing. */
export const DIRECTORY_MAX_PAGES = 10;

/** The map as stored. */
export interface StoredTeamRoles {
  /** When it was built, epoch ms. */
  at: number;
  roles: TeamRoles;
  /** Figma user id → Slack id. Absent from a map stored before it was kept. */
  figmaPeople?: FigmaPeople;
}

/** What the sync reads and where it writes. */
export interface TeamRolesSyncDeps {
  /** The Team Members rows, and whether the read stopped before the last. */
  roster(): Promise<{ members: readonly RosterRow[]; truncated: boolean }>;
  /** One users.list page, and where the next starts. */
  listUsers(cursor?: string): Promise<{ ok: boolean; error?: string; members?: DirectoryPerson[]; next_cursor?: string }>;
  /** The map stored now, or null when there is none. */
  read(): Promise<StoredTeamRoles | null>;
  write(stored: StoredTeamRoles): Promise<void>;
  now(): number;
}

/** What one sync did. Names only on a dry run. */
export interface TeamRolesSyncReport {
  written: boolean;
  matched: number;
  unmatched: number;
  ambiguous: number;
  summary: string;
  /** True when the new map shrank too far and the stored one was kept. */
  keptPrevious?: boolean;
  unmatchedNames?: string[];
  ambiguousNames?: string[];
}

function kept(why: string): TeamRolesSyncReport {
  return { written: false, matched: 0, unmatched: 0, ambiguous: 0, summary: `${why} — last map kept` };
}

/**
 * Build the role map and store it.
 *
 * @param deps - The roster, the directory and the store
 * @param opts - `dryRun` reads, lists the unmatched names and writes nothing
 * @throws A budget stop, which the runner defers
 */
export async function syncTeamRoles(deps: TeamRolesSyncDeps, opts: { dryRun: boolean }): Promise<TeamRolesSyncReport> {
  let roster: Awaited<ReturnType<TeamRolesSyncDeps["roster"]>>;
  try {
    roster = await deps.roster();
  } catch (err) {
    rethrowIfBudget(err);
    return kept(`Team Members read failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (roster.truncated) return kept("Team Members read stopped short");

  const directory: DirectoryPerson[] = [];
  let cursor: string | undefined;
  for (let page = 0; ; page++) {
    if (page >= DIRECTORY_MAX_PAGES) return kept("users.list stopped short");
    const res = await deps.listUsers(cursor);
    if (!res.ok) return kept(`users.list failed: ${res.error ?? "unknown error"}`);
    directory.push(...(res.members ?? []));
    cursor = res.next_cursor;
    if (!cursor) break;
  }

  const match = buildRoleMap(roster.members, directory);
  let counts = `${match.matched} matched, ${match.unmatched.length} unmatched, ${match.ambiguous.length} ambiguous`;
  const figmaIds = Object.keys(match.figmaPeople).length;
  if (figmaIds) counts += `, ${figmaIds} Figma id${figmaIds === 1 ? "" : "s"}`;

  let previous: StoredTeamRoles | null;
  try {
    previous = await deps.read();
  } catch (err) {
    rethrowIfBudget(err);
    return kept(`stored map read failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  const had = Object.keys(match.roles).length;
  const of = previous ? Object.keys(previous.roles).length : 0;
  const shrunk = shrankTooFar(had, of);
  if (shrunk) counts += ` — kept previous map: new map had ${had} of ${of}`;

  const write = !opts.dryRun && !shrunk;
  if (write) await deps.write({ at: deps.now(), roles: match.roles, figmaPeople: match.figmaPeople });
  return {
    written: write,
    matched: match.matched,
    unmatched: match.unmatched.length,
    ambiguous: match.ambiguous.length,
    summary: opts.dryRun ? `dry run, nothing written: ${counts}` : counts,
    ...(shrunk ? { keptPrevious: true } : {}),
    ...(opts.dryRun ? { unmatchedNames: match.unmatched, ambiguousNames: match.ambiguous } : {}),
  };
}

/** Whether a new map of `had` entries is too hollow to replace a stored map
 *  of `of`: empty, or under half, and only when the stored one has entries. */
export function shrankTooFar(had: number, of: number): boolean {
  return of > 0 && (had === 0 || had * 2 < of);
}
