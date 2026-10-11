// Monday's DM to the lead, from the lists the daily sync keeps
// (`./team-roles-sync.ts`), over the Team Members rows in scope — current
// developers, designers and PMs, never a Past Collaborator or a deactivated
// Slack account:
//   • rows no Slack member matched, or more than one did — a person card
//     follow-ups can only look for by name;
//   • rows matched to one member whose Notion Person is empty — names only,
//     so the lead can fill them.
// A row matched to one member that two rows give different roles is a role
// conflict, not a gap, and stays out of it. The lead alone is DMed; nobody
// else is DMed about it. A list older than this morning's sync says it is
// from the last good sync, and when that was.
//
// One KV read and, when there is something to say, one DM. Free of `Env`:
// `./production.ts` binds the read, the lead and the DM.

import { rethrowIfBudget } from "../net";
import { escapeSlackText } from "../slack/mrkdwn";
import { shortDate } from "../slack/copy-words";
import { etDayOf } from "../sweep/schedule";
import type { StoredTeamRoles } from "./team-roles-sync";

/** The DM runs right after the morning's sync, so lists older than this come
 *  from an earlier morning: today's sync did not write. */
export const GAPS_FRESH_MS = 20 * 60 * 60 * 1000;

/** What the DM reads and where it goes. */
export interface TeamGapsDeps {
  /** The stored team map, or null when there is none. */
  read(): Promise<StoredTeamRoles | null>;
  /** `LEAD_USER_ID`: the one person DMed, or null when unset. */
  lead: string | null;
  /** A DM to one person. */
  dm(userId: string, text: string): Promise<{ ok: boolean; error?: string }>;
  now(): number;
}

/** What one Monday did. Names only on a dry run. */
export interface TeamGapsReport {
  sent: boolean;
  summary: string;
  names?: readonly string[];
  noNotionPerson?: readonly string[];
}

function bullets(names: readonly string[]): string[] {
  return names.map((n) => `• ${escapeSlackText(n.replace(/\s+/g, " ").trim())}`);
}

/**
 * The DM's words: each list, one name a line, escaped so none of them pings;
 * led by where the lists came from when they are not this morning's.
 *
 * @param stale - The ET day of the last good sync, when it was not today's
 */
export function teamGapsText(gaps: readonly string[], noNotionPerson: readonly string[], stale: string | null): string {
  const lines: string[] = [];
  if (stale) lines.push(`This list is from the last good sync, on ${stale}: today's did not finish.`);
  if (gaps.length) {
    lines.push(
      "Team Members rows I couldn't match to one Slack person (current developers, designers and PMs), so card follow-ups can only look for them by name:",
      ...bullets(gaps),
      "A Slack ID on the row, or a row name that matches their Slack name, fixes it.",
    );
  }
  if (noNotionPerson.length) {
    if (gaps.length) lines.push("");
    lines.push("Matched in Slack, with no Notion Person on their row:", ...bullets(noNotionPerson));
  }
  return lines.join("\n");
}

/**
 * DM the lead what the sync could not match, and who has no Notion Person.
 *
 * @param deps - The stored map, the lead, the DM and the clock
 * @param opts - `dryRun` lists the names and DMs nobody
 * @throws A budget stop, which the runner defers
 */
export async function runTeamGaps(deps: TeamGapsDeps, opts: { dryRun: boolean }): Promise<TeamGapsReport> {
  if (!deps.lead) return { sent: false, summary: "LEAD_USER_ID not set — no DM" };
  const stored = await deps.read();
  if (!stored) return { sent: false, summary: "no stored team map — no DM" };
  const gaps = stored.gaps ?? [];
  const noNotionPerson = stored.noNotionPerson ?? [];
  if (!gaps.length && !noNotionPerson.length) return { sent: false, summary: "every in-scope row matched with a Notion Person — no DM" };
  const builtAt = stored.gapsAt ?? stored.at;
  const stale = deps.now() - builtAt > GAPS_FRESH_MS ? shortDate(new Date(etDayOf(builtAt)).toISOString()) : null;
  const counts = `${gaps.length} unmatched, ${noNotionPerson.length} without a Notion Person`;
  if (opts.dryRun) return { sent: false, summary: `dry run, nothing sent: ${counts}`, names: gaps, noNotionPerson };
  let res: { ok: boolean; error?: string };
  try {
    res = await deps.dm(deps.lead, teamGapsText(gaps, noNotionPerson, stale));
  } catch (err) {
    rethrowIfBudget(err);
    res = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return res.ok
    ? { sent: true, summary: `DMed the lead ${counts}${stale ? ` (from the sync of ${stale})` : ""}` }
    : { sent: false, summary: `DM to the lead failed: ${res.error ?? "unknown error"}` };
}
