// The daily role-map sync: the Notion Team Members roster matched against the
// Slack directory (`./roles.ts` `matchRoster`), the Slack-id → role map kept
// in KV for turns to read. The Figma-id → Slack-id map is kept beside it, so a
// Figma commenter can be matched to a teammate without a call to Notion.
//
// One Notion query, paged, and one users.list read, paged — both inside the
// run's lookup ceiling. A read that fails or stops short writes nothing, so a
// failed sync keeps the last map until its TTL runs out. The map lives in KV
// only: D1 holds no names, ids or roles beyond a kickoff's `aimed_at_role`
// (ADR-030). The job logs counts, Figma User ID cells it cannot read among
// them; a dry run lists the names that found no one, so the CMS can be fixed.
//
// A read that succeeds can still come back hollow — the database moved, rows
// restricted, a Group option renamed so nothing maps. So a new map that is
// empty, or under half the size of the stored one, does not replace a stored
// map that has entries; the run says so and the old roles stand, with the
// expiry they already had. The Figma map is not held back with them: it is
// rebuilt from every read that succeeds, so an id taken off a row stops
// mapping at the next good sync, and a fall from some ids to none is called
// out in the summary rather than held.
//
// Free of `Env`: its reads and its store are passed in (`./production.ts`
// binds them), so the Node suite drives it with fakes.

import { rethrowIfBudget } from "../net";
import { matchRoster, type DirectoryPerson, type FigmaPeople, type RosterRow, type TeamRoles } from "./roles";

/** The KV key the map is kept under. */
export const TEAM_ROLES_KV_KEY = "team-roles:map";

/** How long a stored map lasts: a few days, so a weekend and a failed sync or
 *  two keep it, and a roster nobody syncs any more stops being read. */
export const TEAM_ROLES_TTL_S = 4 * 24 * 60 * 60;

/** KV's shortest expiry: kept roles near the end of theirs are written for this long. */
const MIN_TTL_S = 60;

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
  /** Store the map, to lapse in `ttlS` seconds. */
  write(stored: StoredTeamRoles, ttlS: number): Promise<void>;
  now(): number;
}

/** What one sync did. Names only on a dry run. */
export interface TeamRolesSyncReport {
  written: boolean;
  matched: number;
  unmatched: number;
  ambiguous: number;
  summary: string;
  /** True when the new roles shrank too far and the stored ones were kept. */
  keptPrevious?: boolean;
  unmatchedNames?: string[];
  ambiguousNames?: string[];
  /** Rows whose Figma User ID could not be read. */
  unreadableFigmaNames?: string[];
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

  const match = matchRoster(roster.members, directory);
  let counts = `${match.matched} matched, ${match.unmatched.length} unmatched, ${match.ambiguous.length} ambiguous`;
  const unreadable = match.unreadableFigma.length;
  if (unreadable) counts += `, ${unreadable} unreadable Figma id${unreadable === 1 ? "" : "s"}`;
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
  if (shrunk) counts += ` — kept previous roles: new map had ${had} of ${of}`;
  const figmaBefore = Object.keys(previous?.figmaPeople ?? {}).length;
  if (figmaBefore && !figmaIds) counts += ` — warning: Figma ids fell from ${figmaBefore} to 0`;

  const write = !opts.dryRun;
  if (write) {
    const now = deps.now();
    // Kept roles keep their own build time and lapse when they would have.
    const held = shrunk && previous ? previous : null;
    const at = held ? held.at : now;
    const ttlS = Math.max(MIN_TTL_S, TEAM_ROLES_TTL_S - Math.floor((now - at) / 1000));
    await deps.write({ at, roles: held ? held.roles : match.roles, figmaPeople: match.figmaPeople }, ttlS);
  }
  return {
    written: write,
    matched: match.matched,
    unmatched: match.unmatched.length,
    ambiguous: match.ambiguous.length,
    summary: opts.dryRun ? `dry run, nothing written: ${counts}` : counts,
    ...(shrunk ? { keptPrevious: true } : {}),
    ...(opts.dryRun
      ? { unmatchedNames: match.unmatched, ambiguousNames: match.ambiguous, unreadableFigmaNames: match.unreadableFigma }
      : {}),
  };
}

/** Whether a new map of `had` entries is too hollow to replace a stored map
 *  of `of`: empty, or under half, and only when the stored one has entries. */
export function shrankTooFar(had: number, of: number): boolean {
  return of > 0 && (had === 0 || had * 2 < of);
}
