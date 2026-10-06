// The PLUS Figma teams, from `FIGMA_TEAM_IDS` (wrangler.toml `[vars]`).
//
// Figma has no call that lists a token's teams ("It is not possible to
// programmatically obtain team IDs"), so the ids are written down: `name=id`
// pairs, comma-separated, each name the team as people say it — Universal,
// Training, Toolkit, Admin, Others, MISC. The subscription setup picks teams
// by that name, and the nightly backstop (#896) lists every one.
//
// A malformed entry is refused rather than skipped. A team silently missing
// from the list is a team whose comments never reach uno-bot, and nothing
// downstream would say so.
//
// PURE.

export interface FigmaTeam {
  /** The team as people say it. */
  name: string;
  /** Figma's team id: the number in the team's URL. */
  id: string;
}

/**
 * The teams `FIGMA_TEAM_IDS` names, in its order.
 *
 * @param raw - The setting: `Universal=1279226364199713409,Training=…`
 * @returns Every team, or none when the setting is blank
 * @throws When an entry is not `name=id`, or a name or id appears twice
 */
export function figmaTeamsFrom(raw: string | undefined): FigmaTeam[] {
  if (!raw?.trim()) return [];
  const teams: FigmaTeam[] = [];
  for (const entry of raw.split(",")) {
    const m = /^\s*([^=]*\S)\s*=\s*(\d+)\s*$/.exec(entry);
    if (!m) throw new Error(`FIGMA_TEAM_IDS: "${entry.trim()}" is not name=id`);
    const [, name, id] = m as unknown as [string, string, string];
    const twice = teams.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.id === id);
    if (twice) throw new Error(`FIGMA_TEAM_IDS: ${name}=${id} repeats ${twice.name}=${twice.id}`);
    teams.push({ name, id });
  }
  return teams;
}

/**
 * The teams a run asked for: `all`, or names, comma-separated, in any case.
 *
 * @param teams - Every team the setting names
 * @param wanted - `all`, or `Universal,Training`
 * @throws When a name matches no team, so a typo creates nothing anywhere
 */
export function selectTeams(teams: readonly FigmaTeam[], wanted: string): FigmaTeam[] {
  if (wanted.trim().toLowerCase() === "all") return [...teams];
  const names = wanted
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) throw new Error("no team named — pass `all` or team names");
  const picked = names.map((name) => {
    const team = teams.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!team) throw new Error(`no team named "${name}" — FIGMA_TEAM_IDS has ${teams.map((t) => t.name).join(", ")}`);
    return team;
  });
  return picked.filter((team, i) => picked.indexOf(team) === i);
}
