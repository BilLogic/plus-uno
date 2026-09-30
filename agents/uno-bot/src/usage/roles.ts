// Who on the team is a PM, a dev or a designer — the role map the
// ticket-kickoff record reads (`./proposal-events.ts`).
//
// Keyed by Slack user id, because that is what a turn knows about the person
// asking and the person they named. A role is the one thing recorded about
// either: the id of the person named in an ask is looked up here and dropped.
// Someone not on the map records no role, which a query reads as "unknown"
// rather than as any of the three.
//
// The map is built from the Notion Team Members database — the team CMS — by
// a daily job (`./team-roles-sync.ts`) and kept in KV; a turn reads the stored
// map and never calls Notion. `buildRoleMap` is the matching rule.

/** The three roles "can you file that?" bounces between. */
export type TeamRole = "pm" | "dev" | "design";

/** A Slack-id → role map, as the sync stores it. */
export type TeamRoles = Readonly<Record<string, TeamRole>>;

/** A person's role, or null when they are not on the map. */
export function roleOf(userId: string | null | undefined, roles: TeamRoles = {}): TeamRole | null {
  return (userId && Object.hasOwn(roles, userId) ? roles[userId] : undefined) ?? null;
}

/** The Team Members `Group` options that carry a role, exact-matched. Every
 *  other option — Researcher, QA Engineer, Advisor and the rest — carries none. */
export const GROUP_ROLES: TeamRoles = {
  "Product Manager": "pm",
  "Software Developer": "dev",
  "Product Designer": "design",
};

/** The `Affiliation` option whose rows are skipped: no longer on the team. */
export const PAST_COLLABORATORS = "Past Collaborators";

/** One Team Members row, as the sync reads it. */
export interface RosterRow {
  name: string;
  group?: string;
  affiliation?: string;
  /** The row's own Slack id, when the database carries one. */
  slackUserId?: string;
}

/** One Slack member, as the directory lists them. */
export interface DirectoryPerson {
  id: string;
  real_name?: string;
  profile?: { display_name?: string };
  is_bot?: boolean;
  deleted?: boolean;
}

/** A name compared by what it says: case, accents and runs of whitespace do
 *  not count. Nothing looser — no initials, nicknames or partial names. */
export function normalisePersonName(name: string): string {
  return name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** What matching the roster against the directory found. */
export interface RoleMatch {
  roles: TeamRoles;
  /** Rows with a role that landed on one Slack member. */
  matched: number;
  /** Rows with a role whose name no Slack member carries. */
  unmatched: string[];
  /** Rows with a role whose name more than one Slack member carries, or whose
   *  member another row gives a different role. */
  ambiguous: string[];
}

/**
 * The role map: each roster row with a role, matched to the one Slack member
 * whose real name or display name is the row's name once normalised. A row
 * that matches nobody, or more than one member, gives nobody a role; so does
 * a member two rows give different roles. A row's own Slack id, when it has
 * one, is taken as the match.
 *
 * @param roster - The Team Members rows
 * @param directory - The workspace's members
 */
export function buildRoleMap(roster: readonly RosterRow[], directory: readonly DirectoryPerson[]): RoleMatch {
  const byName = new Map<string, Set<string>>();
  for (const person of directory) {
    if (person.deleted || person.is_bot || person.id === "USLACKBOT") continue;
    for (const name of [person.real_name, person.profile?.display_name]) {
      const key = name ? normalisePersonName(name) : "";
      if (key) byName.set(key, (byName.get(key) ?? new Set()).add(person.id));
    }
  }
  const unmatched: string[] = [];
  const ambiguous: string[] = [];
  /** Each member's roles, and the rows that gave them. */
  const given = new Map<string, { roles: Set<TeamRole>; names: string[] }>();
  for (const row of roster) {
    if (row.affiliation === PAST_COLLABORATORS) continue;
    const role = row.group && Object.hasOwn(GROUP_ROLES, row.group) ? GROUP_ROLES[row.group] : undefined;
    if (!role) continue;
    const ids = row.slackUserId ? [row.slackUserId] : [...(byName.get(normalisePersonName(row.name)) ?? [])];
    const [id] = ids;
    if (!id) unmatched.push(row.name);
    else if (ids.length > 1) ambiguous.push(row.name);
    else {
      const entry = given.get(id) ?? { roles: new Set<TeamRole>(), names: [] };
      entry.roles.add(role);
      entry.names.push(row.name);
      given.set(id, entry);
    }
  }
  const roles: Record<string, TeamRole> = {};
  let matched = 0;
  for (const [id, entry] of given) {
    const [role] = entry.roles;
    if (!role || entry.roles.size > 1) {
      ambiguous.push(...entry.names);
      continue;
    }
    roles[id] = role;
    matched += entry.names.length;
  }
  return { roles, matched, unmatched, ambiguous };
}

/** A Slack user mention as it arrives in message text: `<@U123>` or `<@U123|name>`. */
const MENTION = /<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g;

/**
 * Who an ask was aimed at: the first person it names other than the asker.
 * The bot's own mention is already stripped from the text a turn carries.
 */
export function aimedAtOf(text: string, requesterId: string): string | null {
  for (const match of text.matchAll(MENTION)) {
    if (match[1] !== requesterId) return match[1]!;
  }
  return null;
}
