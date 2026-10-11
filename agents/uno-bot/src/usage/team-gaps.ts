// Monday's DM to the lead: the Team Members rows in scope — current
// developers, designers and PMs, never a Past Collaborator — that the daily
// sync could not match to one Slack person (`./team-roles-sync.ts` keeps their
// names as `gaps`). A row missing from the directory is a person card
// follow-ups can only find by name, so the lead is told once a week, and
// nobody else is DMed about it.
//
// One KV read and, when there is something to say, one DM. Free of `Env`:
// `./production.ts` binds the read, the lead and the DM.

import { rethrowIfBudget } from "../net";
import { escapeSlackText } from "../slack/mrkdwn";
import type { StoredTeamRoles } from "./team-roles-sync";

/** What the DM reads and where it goes. */
export interface TeamGapsDeps {
  /** The stored team map, or null when there is none. */
  read(): Promise<StoredTeamRoles | null>;
  /** `LEAD_USER_ID`: the one person DMed, or null when unset. */
  lead: string | null;
  /** A DM to one person. */
  dm(userId: string, text: string): Promise<{ ok: boolean; error?: string }>;
}

/** What one Monday did. Names only on a dry run. */
export interface TeamGapsReport {
  sent: boolean;
  summary: string;
  names?: readonly string[];
}

/** The DM's words: the names, one a line, escaped so none of them pings. */
export function teamGapsText(names: readonly string[]): string {
  return [
    "Team Members rows I couldn't match to one Slack person this week (current developers, designers and PMs), so card follow-ups can only look for them by name:",
    ...names.map((n) => `• ${escapeSlackText(n.replace(/\s+/g, " ").trim())}`),
    "A Slack ID on the row, or a row name that matches their Slack name, fixes it.",
  ].join("\n");
}

/**
 * DM the lead the in-scope rows the sync could not match.
 *
 * @param deps - The stored map, the lead and the DM
 * @param opts - `dryRun` lists the names and DMs nobody
 * @throws A budget stop, which the runner defers
 */
export async function runTeamGaps(deps: TeamGapsDeps, opts: { dryRun: boolean }): Promise<TeamGapsReport> {
  if (!deps.lead) return { sent: false, summary: "LEAD_USER_ID not set — no DM" };
  const stored = await deps.read();
  if (!stored) return { sent: false, summary: "no stored team map — no DM" };
  const names = stored.gaps ?? [];
  if (!names.length) return { sent: false, summary: "every in-scope row matched — no DM" };
  if (opts.dryRun) return { sent: false, summary: `dry run, nothing sent: ${names.length} unmatched name(s)`, names };
  let res: { ok: boolean; error?: string };
  try {
    res = await deps.dm(deps.lead, teamGapsText(names));
  } catch (err) {
    rethrowIfBudget(err);
    res = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return res.ok
    ? { sent: true, summary: `DMed the lead ${names.length} unmatched name(s)` }
    : { sent: false, summary: `DM to the lead failed: ${res.error ?? "unknown error"}` };
}
