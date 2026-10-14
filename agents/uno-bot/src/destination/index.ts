// THE POSTING LADDER, as code: `routeFinding`, read by every job that posts
// with no requester. The rule is `docs/connectors/slack/overview.md` § The
// posting ladder (ADR-031 and its team-channel addendum).
//
// A team channel is named by role here and by id in the Worker's config
// (`resolveDestination`). All four team channels beside #plus-universal are
// private: uno-bot posts there once it is invited.
//
// PURE: no `Env`, no Slack module, no Workers global.

/** What kind of conversation the evidence was read in. */
export type ChannelKind = "public" | "private" | "group-dm" | "dm";

/** The pillar → channel map, as `docs/connectors/slack/overview.md` states it. Tutoring
 *  and Help Center have no channel. */
export const PILLAR_CHANNELS = {
  Universal: "plus-universal",
  Admin: "plus-admin",
  Toolkit: "plus-toolkit",
  Training: "plus-training",
  Marketing: "plus-marketing",
} as const;

/** A team with a channel. */
export type Team = keyof typeof PILLAR_CHANNELS;

/** A team channel, by role. */
export type TeamChannel = (typeof PILLAR_CHANNELS)[Team];

/** Every channel the ladder names by role. */
export type ChannelRole = TeamChannel | "plus-design";

/** Where a finding is posted. */
export type Destination =
  | { rung: "private"; channel: string; threadTs: string | null }
  | { rung: "thread"; channel: string; threadTs: string }
  | { rung: "team"; team: Team; channel: TeamChannel }
  | { rung: "design"; channel: "plus-design" };

/** Who a finding names: a Slack person, tagged, or a Figma handle, named. */
export type Addressee = { slack: string } | { figma: string };

/** What the ladder reads about a finding. */
export interface FindingContext {
  /** Where the evidence was read; null when it is no conversation (a Notion
   *  record, a check that reads none). */
  evidence: { channel: string; channelKind: ChannelKind; threadTs: string | null } | null;
  /** The linked Roadmap card: its Product Pillar values, and its design owner
   *  as a Slack id. */
  card?: { pillars: readonly string[]; designOwner?: string | null } | null;
  /** The Figma file the finding is about: its team as `FIGMA_TEAM_IDS` names
   *  it, and its creator's handle. */
  figmaFile?: { team?: string | null; creatorHandle?: string | null } | null;
}

/**
 * Where a finding goes and whom it names.
 *
 * @param context - Its evidence, its card and its Figma file
 */
export function routeFinding(context: FindingContext): { destination: Destination; addressee: Addressee | null } {
  return { destination: destinationOf(context), addressee: addresseeOf(context) };
}

function destinationOf({ evidence, card, figmaFile }: FindingContext): Destination {
  if (evidence && evidence.channelKind !== "public") {
    return { rung: "private", channel: evidence.channel, threadTs: evidence.threadTs };
  }
  if (evidence?.threadTs) return { rung: "thread", channel: evidence.channel, threadTs: evidence.threadTs };
  const named = card?.pillars.length ? card.pillars : figmaFile?.team ? [figmaFile.team] : [];
  const team = named.map(teamNamed).find((t): t is Team => t !== null);
  return team ? { rung: "team", team, channel: PILLAR_CHANNELS[team] } : { rung: "design", channel: "plus-design" };
}

function addresseeOf({ card, figmaFile }: FindingContext): Addressee | null {
  if (card?.designOwner) return { slack: card.designOwner };
  return figmaFile?.creatorHandle ? { figma: figmaFile.creatorHandle } : null;
}

/** The team a pillar or Figma team names, in any case, or null for none. */
export function teamNamed(name: string): Team | null {
  const wanted = name.trim().toLowerCase();
  return (Object.keys(PILLAR_CHANNELS) as Team[]).find((t) => t.toLowerCase() === wanted) ?? null;
}

/** The Worker's channel ids, by role, and #uno-bot's, which is never one. */
export interface ChannelIds {
  plusDesign?: string;
  plusUniversal?: string;
  plusAdmin?: string;
  plusToolkit?: string;
  plusTraining?: string;
  plusMarketing?: string;
  unoBot?: string;
}

const ID_KEYS: Record<ChannelRole, keyof ChannelIds> = {
  "plus-design": "plusDesign",
  "plus-universal": "plusUniversal",
  "plus-admin": "plusAdmin",
  "plus-toolkit": "plusToolkit",
  "plus-training": "plusTraining",
  "plus-marketing": "plusMarketing",
};

/** Every role, #plus-design first. */
export const CHANNEL_ROLES = Object.keys(ID_KEYS) as ChannelRole[];

/**
 * A role's channel id, or null when it is not configured or is #uno-bot.
 *
 * @param role - The channel, by role
 * @param ids - The Worker's channel ids
 */
export function channelIdOf(role: ChannelRole, ids: ChannelIds): string | null {
  const id = ids[ID_KEYS[role]]?.trim();
  return id && id !== ids.unoBot?.trim() ? id : null;
}

/**
 * The team whose channel an id is, or null for #plus-design or any other.
 *
 * @param channel - A channel id
 * @param ids - The Worker's channel ids
 */
export function teamOfChannel(channel: string, ids: ChannelIds): Team | null {
  return (Object.keys(PILLAR_CHANNELS) as Team[]).find((t) => channelIdOf(PILLAR_CHANNELS[t], ids) === channel) ?? null;
}

/**
 * A destination as a channel id and the thread to post under, or null when its
 * channel is not configured.
 *
 * @param destination - Where `routeFinding` sent it
 * @param ids - The Worker's channel ids
 */
export function resolveDestination(destination: Destination, ids: ChannelIds): { channel: string; threadTs: string | null } | null {
  if (destination.rung === "private" || destination.rung === "thread") {
    return { channel: destination.channel, threadTs: destination.threadTs };
  }
  const channel = channelIdOf(destination.channel, ids);
  return channel ? { channel, threadTs: null } : null;
}
