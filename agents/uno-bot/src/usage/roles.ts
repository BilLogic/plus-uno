// Who on the team is a PM, a dev or a designer — the checked-in role map the
// ticket-kickoff record reads (`./proposal-events.ts`).
//
// Keyed by Slack user id, because that is what a turn knows about the person
// asking and the person they named. A role is the one thing recorded about
// either: the id of the person named in an ask is looked up here and dropped.
// Someone not on the map records no role, which a query reads as "unknown"
// rather than as any of the three.
//
// Edited by hand when someone joins or changes role; `tests/team-roles.test.ts`
// holds every entry to a Slack user id and one of the three roles.

/** The three roles "can you file that?" bounces between. */
export type TeamRole = "pm" | "dev" | "design";

export const TEAM_ROLES: Readonly<Record<string, TeamRole>> = {};

/** A person's role, or null when they are not on the map. */
export function roleOf(
  userId: string | null | undefined,
  roles: Readonly<Record<string, TeamRole>> = TEAM_ROLES,
): TeamRole | null {
  return (userId && Object.hasOwn(roles, userId) ? roles[userId] : undefined) ?? null;
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
