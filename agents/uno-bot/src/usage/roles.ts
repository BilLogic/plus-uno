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
// map and never calls Notion. `matchRoster` is the matching rule.
//
// The same match also gives a Figma people map: a member who fills in their
// row's optional Figma User ID is mapped to the Slack person their row
// matches, whatever their group. No Figma API returns an email, so the id is
// the only join, and the map lets a Figma commenter be matched to a teammate.
// A row's optional Notion Person gives a Notion people map by the same rule,
// which is how a card follow-up tags a Contributor before it tries a name.
//
// The roles are for analytics only, never for access: nothing is allowed or
// refused on them. The Figma people map is for access: a commenter it does not
// map gets public facts only and no write proposals, and one it does map still
// goes through the review gate (the ✅) for anything written. Both are only as
// trustworthy as their inputs — names match on Slack real and display names,
// which each member edits, and anyone who can edit Team Members can set a
// row's group, Slack id or Figma id.

/** The three roles "can you file that?" bounces between. */
export type TeamRole = "pm" | "dev" | "design";

/** A Slack-id → role map, as the sync stores it. */
export type TeamRoles = Readonly<Record<string, TeamRole>>;

/** A Figma user id → Slack id map, as the sync stores it. */
export type FigmaPeople = Readonly<Record<string, string>>;

/** A Notion user id → Slack id map, as the sync stores it. */
export type NotionPeople = Readonly<Record<string, string>>;

/** A key's entry in a stored map, or null when it has none. Inherited keys are not entries. */
function entryOf<T>(key: string | null | undefined, map: Readonly<Record<string, T>>): T | null {
  return (key && Object.hasOwn(map, key) ? map[key] : undefined) ?? null;
}

/** The Slack person a Figma user id maps to, or null when it maps to nobody. */
export function slackPersonOfFigma(figmaUserId: string | null | undefined, people: FigmaPeople = {}): string | null {
  return entryOf(figmaUserId, people);
}

/** The Slack person a Notion user id maps to, or null when it maps to nobody. */
export function slackPersonOfNotion(notionUserId: string | null | undefined, people: NotionPeople = {}): string | null {
  return entryOf(notionUserId, people);
}

/** The one Notion user a Slack person is mapped from, or null when none is,
 *  or more than one. */
export function notionPersonOfSlack(slackUserId: string | null | undefined, people: NotionPeople = {}): string | null {
  if (!slackUserId) return null;
  const ids = Object.keys(people).filter((id) => people[id] === slackUserId);
  return ids.length === 1 ? ids[0]! : null;
}

/** A person's role, or null when they are not on the map. */
/** The first of a card's Contributors, as Slack ids, the roles name a designer. */
export function designerAmong(contributors: readonly string[], roles: TeamRoles): string | null {
  return contributors.find((id) => roleOf(id, roles) === "design") ?? null;
}

export function roleOf(userId: string | null | undefined, roles: TeamRoles = {}): TeamRole | null {
  return entryOf(userId, roles);
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
  /** The row's Figma User ID cell as the member filled it in;
   *  `normalizeFigmaId` reads the id out of it. */
  figmaUserId?: string;
  /** The Notion users in the row's Notion Person cell. */
  notionUserIds?: readonly string[];
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
export function normalizePersonName(name: string): string {
  return name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * A Figma user id read out of a Team Members cell: the `fuid=` value of a
 * pasted Figma URL, else the first run of six or more digits. Undefined when
 * the cell holds neither.
 */
export function normalizeFigmaId(raw: string): string | undefined {
  return raw.match(/fuid=(\d+)/)?.[1] ?? raw.match(/\d{6,}/)?.[0];
}

/** What matching the roster against the directory found. */
export interface RosterMatch {
  roles: TeamRoles;
  /** Rows with a role that landed on one Slack member. */
  matched: number;
  /** Rows with a role whose name no Slack member carries. */
  unmatched: string[];
  /** Rows with a role whose name more than one Slack member carries, or whose
   *  member another row gives a different role. */
  ambiguous: string[];
  /** Each Figma user id a row carries, to the one Slack member that row
   *  matched. An id two rows give different members maps to nobody. */
  figmaPeople: FigmaPeople;
  /** Rows whose Figma User ID is filled in but holds no id `normalizeFigmaId` reads. */
  unreadableFigma: string[];
  /** Each Notion user a row's Notion Person names, to the one Slack member
   *  that row matched, by the Figma map's rule. */
  notionPeople: NotionPeople;
  /** Rows with a role that no active Slack member matches, or more than one
   *  does — what a person fixes on the row. Not a row whose only match is a
   *  deactivated account (no longer on the team), and not a row matched to
   *  one member another row gives a different role (in `ambiguous`). */
  gaps: string[];
  /** Rows with a role matched to one Slack member, whose Notion Person is empty. */
  noNotionPerson: string[];
  /** Rows, Past Collaborators aside, with no Figma User ID `normalizeFigmaId` reads. */
  noFigmaId: string[];
}

/**
 * The role map and the Figma people map. The role map: each roster row with a role, matched to the one Slack member
 * whose real name or display name is the row's name once normalized. A row
 * that matches nobody, or more than one member, gives nobody a role; so does
 * a member two rows give different roles. A row's own Slack id, when it has
 * one, is taken as the match — but only when it is an active, non-bot member
 * of the directory; otherwise the row is unmatched.
 *
 * A row's Figma user id, and each Notion user its Notion Person names, maps
 * to the member the row matched, by the same rule, whether or not the row has
 * a role. Only the role rows count towards
 * `matched`, `unmatched` and `ambiguous`.
 *
 * @param roster - The Team Members rows
 * @param directory - The workspace's members
 */
export function matchRoster(roster: readonly RosterRow[], directory: readonly DirectoryPerson[]): RosterMatch {
  const byName = new Map<string, Set<string>>();
  const active = new Set<string>();
  /** Deactivated accounts, by id and by name: a row only they match has left. */
  const deactivated = new Set<string>();
  for (const person of directory) {
    if (person.is_bot || person.id === "USLACKBOT") continue;
    const names = [person.real_name, person.profile?.display_name].map((n) => (n ? normalizePersonName(n) : "")).filter(Boolean);
    if (person.deleted) {
      deactivated.add(person.id);
      for (const key of names) deactivated.add(`name:${key}`);
      continue;
    }
    active.add(person.id);
    for (const key of names) byName.set(key, (byName.get(key) ?? new Set()).add(person.id));
  }
  const gaps: string[] = [];
  const noNotionPerson: string[] = [];
  const noFigmaId: string[] = [];
  const unmatched: string[] = [];
  const ambiguous: string[] = [];
  /** Each member's roles, and the rows that gave them. */
  const given = new Map<string, { roles: Set<TeamRole>; names: string[] }>();
  /** Each Figma id's members, from every row that carries it. */
  const figma = new Map<string, Set<string>>();
  /** Each Notion user's members, from every row that names it. */
  const notion = new Map<string, Set<string>>();
  const unreadableFigma: string[] = [];
  for (const row of roster) {
    if (row.affiliation === PAST_COLLABORATORS) continue;
    const ids = row.slackUserId
      ? active.has(row.slackUserId) ? [row.slackUserId] : []
      : [...(byName.get(normalizePersonName(row.name)) ?? [])];
    const [id] = ids;
    // A row that matches nobody, or more than one member, maps its ids to nobody.
    const member = id && ids.length === 1 ? id : "";
    const figmaId = row.figmaUserId?.trim() ? normalizeFigmaId(row.figmaUserId) : undefined;
    if (row.figmaUserId?.trim() && !figmaId) unreadableFigma.push(row.name);
    if (!figmaId) noFigmaId.push(row.name);
    if (figmaId) figma.set(figmaId, (figma.get(figmaId) ?? new Set<string>()).add(member));
    for (const notionId of new Set(row.notionUserIds ?? [])) {
      if (notionId) notion.set(notionId, (notion.get(notionId) ?? new Set<string>()).add(member));
    }
    const role = row.group && Object.hasOwn(GROUP_ROLES, row.group) ? GROUP_ROLES[row.group] : undefined;
    if (!role) continue;
    const left = row.slackUserId ? deactivated.has(row.slackUserId) : deactivated.has(`name:${normalizePersonName(row.name)}`);
    if (!id) {
      unmatched.push(row.name);
      if (!left) gaps.push(row.name);
    } else if (ids.length > 1) {
      ambiguous.push(row.name);
      gaps.push(row.name);
    } else {
      if (!row.notionUserIds?.length) noNotionPerson.push(row.name);
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
  return {
    roles,
    matched,
    unmatched,
    ambiguous,
    figmaPeople: soleMembers(figma),
    unreadableFigma,
    notionPeople: soleMembers(notion),
    gaps,
    noNotionPerson,
    noFigmaId,
  };
}

/** Each key whose rows all matched the same one member, to that member. */
function soleMembers(byKey: ReadonlyMap<string, ReadonlySet<string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, members] of byKey) {
    const [id] = members;
    if (id && members.size === 1) out[key] = id;
  }
  return out;
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
