// Which Notion pages the sweep may read as a source or aim a fix at.
//
// TWO RULES, both applied to every path that reads a page as a source or a fix
// target — a link, a search hit, a note's own page:
//
//   • A PRIVATE NOTE IS NEVER A SOURCE. A row of Design Running Notes is read
//     only when it is a team note (`isTeamNote`): its `Note Type` does not hold
//     `1:1`, and neither its title (`<Qi / Bill> 1:1`) nor any other select
//     value marks it one. A 1:1 that someone linked, or that a search turned
//     up, is refused after the read and before anything quotes it, so a card
//     never says "page says" from it and no answer is placed in it.
//
//   • A SEARCH HIT COMES FROM A TEAM SURFACE (`isTeamSurface`): a row of one of
//     the databases the team writes its specs and answers in (the Roadmap, the
//     Help Centers, the Decisions log, the Marketplace — `teamSurfaceDbs`), or
//     a standalone page titled as a PRD or spec. Anything else a search finds —
//     a page someone shared with the integration, a running note, a row of an
//     unlisted database — is no hit. It is dropped before it is read, by the
//     parent Notion's search reports, and checked again on the parent the read
//     reports. A GitHub hit is in the Worker's own default repo and read-only.
//
// PURE: no `Env`.

import type { SweepSource, TargetKind } from "./finding";
import type { SearchHit } from "./search";

/** What the rules read from the sweep's configuration. */
export interface SurfaceConfig {
  /** Design Running Notes (`NOTION_RUNNING_NOTES_DB_ID`). */
  runningNotesDb?: string;
  /** The databases a search hit may be a row of. */
  teamSurfaceDbs?: readonly string[];
}

/** What marks a running note as a 1:1 rather than a team note. */
const ONE_ON_ONE = /\b1\s*[:/–-]\s*1\b|\b1[\s-]*on[\s-]*1\b|\bone[\s-]*on[\s-]*one\b/i;

/** A standalone page that names itself a spec. */
const SPEC_TITLE = /\b(?:PRDs?|spec|specs|specification)\b/i;

/**
 * Whether a running-notes row is a team-visible consensus note — the only kind
 * the sweep reads: its own parent is the running-notes database, its
 * `Note Type` does not hold `1:1`, and neither its title nor any other select
 * value marks it a 1:1.
 *
 * @param row - The row: its parent, title and select values by property name
 * @param notesDb - `NOTION_RUNNING_NOTES_DB_ID`
 */
export function isTeamNote(
  row: { parentDatabaseId?: string | null; title: string; properties?: Record<string, string> },
  notesDb: string,
): boolean {
  if (!row.parentDatabaseId || row.parentDatabaseId !== bare(notesDb)) return false;
  const properties = row.properties ?? {};
  const noteType = (properties["Note Type"] ?? "").split(",").map((v) => v.trim());
  if (noteType.includes("1:1")) return false;
  return !ONE_ON_ONE.test(row.title) && !Object.values(properties).some((v) => ONE_ON_ONE.test(v));
}

/**
 * Whether a read page is a running note that is not a team note — never a
 * source, never a target.
 *
 * @param source - The page as read
 * @param config - Where the running notes live
 */
export function isPrivateNote(source: SweepSource, config: SurfaceConfig): boolean {
  if (source.kind !== "notion" || !config.runningNotesDb) return false;
  if (source.parentDatabaseId !== bare(config.runningNotesDb)) return false;
  return !isTeamNote(source, config.runningNotesDb);
}

/**
 * Whether a search hit, or the page it read as, is on one of the team's
 * surfaces. A Notion page whose parent is unknown is not.
 *
 * @param hit - Its kind, title and parent database
 * @param config - The team's databases
 */
export function isTeamSurface(
  hit: { kind: TargetKind; title: string; parentDatabaseId?: string | null },
  config: SurfaceConfig,
): boolean {
  if (hit.kind !== "notion") return true;
  if (hit.parentDatabaseId === undefined) return false;
  if (hit.parentDatabaseId === null) return SPEC_TITLE.test(hit.title);
  if (config.runningNotesDb && hit.parentDatabaseId === bare(config.runningNotesDb)) return false;
  return (config.teamSurfaceDbs ?? []).some((db) => bare(db) === hit.parentDatabaseId);
}

/**
 * Read a page the sweep means to use as a source or a target, or null when it
 * may not be used: a private note, or — for a search hit — a page off the
 * team's surfaces.
 *
 * @param reader - The source reads
 * @param config - The surfaces
 * @param url - The page
 * @param kind - Its estate
 * @param searched - Whether a search found it
 */
export async function readUsable(
  reader: { read(url: string, kind: TargetKind): Promise<SweepSource | null> },
  config: SurfaceConfig,
  url: string,
  kind: TargetKind,
  searched = false,
): Promise<SweepSource | null> {
  const source = await reader.read(url, kind);
  if (!source || isPrivateNote(source, config)) return null;
  if (searched && !isTeamSurface(source, config)) return null;
  return searched ? { ...source, foundBy: "search" } : source;
}

/** A search hit's gate, for `SourceSearch.allowed`. */
export function searchGate(config: SurfaceConfig): (hit: SearchHit) => boolean {
  return (hit) => isTeamSurface(hit, config);
}

function bare(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}
