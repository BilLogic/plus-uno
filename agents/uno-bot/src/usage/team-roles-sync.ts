// The daily role-map sync: the Notion Team Members roster matched against the
// Slack directory (`./roles.ts` `buildRoleMap`), the Slack-id → role map kept
// in KV for turns to read.
//
// One Notion query, paged, and one users.list read, paged — both inside the
// run's lookup ceiling. A read that fails or stops short writes nothing, so a
// failed sync keeps the last map until its TTL runs out. The map lives in KV
// only: D1 holds no names, ids or roles beyond a kickoff's `aimed_at_role`
// (ADR-030). The job logs counts; a dry run lists the names that found no
// one, so the CMS can be fixed.
//
// Free of `Env`: its reads and its store are passed in (`./production.ts`
// binds them), so the Node suite drives it with fakes.

import { rethrowIfBudget } from "../net";
import { buildRoleMap, type DirectoryPerson, type RosterRow, type TeamRoles } from "./roles";

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
}

/** What the sync reads and where it writes. */
export interface TeamRolesSyncDeps {
  /** The Team Members rows, and whether the read stopped before the last. */
  roster(): Promise<{ members: readonly RosterRow[]; truncated: boolean }>;
  /** One users.list page, and where the next starts. */
  listUsers(cursor?: string): Promise<{ ok: boolean; error?: string; members?: DirectoryPerson[]; next_cursor?: string }>;
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
  const counts = `${match.matched} matched, ${match.unmatched.length} unmatched, ${match.ambiguous.length} ambiguous`;
  if (!opts.dryRun) await deps.write({ at: deps.now(), roles: match.roles });
  return {
    written: !opts.dryRun,
    matched: match.matched,
    unmatched: match.unmatched.length,
    ambiguous: match.ambiguous.length,
    summary: opts.dryRun ? `dry run, nothing written: ${counts}` : counts,
    ...(opts.dryRun ? { unmatchedNames: match.unmatched, ambiguousNames: match.ambiguous } : {}),
  };
}
