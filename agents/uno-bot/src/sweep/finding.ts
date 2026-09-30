// What the end-of-day sweep reads and finds, and the two decisions every
// finding needs before anything is posted: whose it is, and where it goes.
//
// A DRIFT FINDING is one place where a Slack thread and the source it links
// disagree: the page says one thing, the thread settled another. It carries the
// target and whether uno-bot can write it, both sides in brief, the evidence,
// the owner and the detector's confidence. Only a writable target (Notion)
// becomes a proposal card; a finding on anything else is counted and left
// alone.
//
// TWO PURE DECISIONS live here because every proactive job shares them:
//
//   • `routeOwner` — who is @-mentioned: whoever claimed or did the work in the
//     thread, then the linked Roadmap card's Contributor, then the thread
//     starter. Never a default to the lead.
//   • `pickDestination` — where a finding is posted. Four rungs, in order:
//     evidence in a private channel, group DM or DM goes back there only; a
//     Slack thread gets the reply in that thread; a design-system target goes
//     to #plus-universal; anything else to #plus-design. Never #uno-bot.
//
// PURE: no `Env`, no Slack module, no Workers global.

/** What kind of conversation a message was read in. */
export type ChannelKind = "public" | "private" | "group-dm" | "dm";

/** What a linked source is, as far as the sweep's two decisions care. */
export type TargetKind =
  | "notion"
  | "figma-library"
  | "figma"
  | "design-system-code"
  | "github"
  | "storybook"
  | "canvas";

/** One human message in a swept thread. */
export interface SweepMessage {
  ts: string;
  user: string;
  text: string;
}

/** A thread as the detector reads it: its root first, then the replies. */
export interface SweepThread {
  channel: string;
  channelKind: ChannelKind;
  rootTs: string;
  messages: SweepMessage[];
}

/** One body block of a writable source, with the stamp a replace must match. */
export interface SweepBlock {
  id: string;
  lastEditedTime: string;
  text: string;
  /** Notion's block type; absent reads as a paragraph. */
  type?: string;
  /** False when its rich text carries a link, mention, equation or
   *  formatting a text replace would drop; absent reads as plain. */
  plain?: boolean;
}

/** A linked source, read. */
export interface SweepSource {
  url: string;
  kind: TargetKind;
  /** True only for Notion: the one estate uno-bot writes in place. */
  writable: boolean;
  title: string;
  /** Body blocks, in order — Notion only; empty elsewhere. */
  blocks: SweepBlock[];
  /** Plain text for context, capped — what a non-writable source says. */
  text: string;
  /** The Roadmap card's `Product Pillar` values, when the source is a card. */
  pillars: string[];
  /** The Roadmap card's `Contributor` names, when the source is a card. */
  contributors: string[];
}

/** The target a finding is about. */
export interface FindingTarget {
  url: string;
  kind: TargetKind;
  writable: boolean;
  title: string;
  pillars: string[];
}

/** Where the evidence was read. */
export interface FindingEvidence {
  channel: string;
  channelKind: ChannelKind;
  /** The thread root the evidence sits in; null for a message outside any. */
  threadTs: string | null;
  /** The messages that say the new thing, oldest first. */
  messageTs: string[];
  /** Their permalinks, fetched rather than built, when a fetch succeeded. */
  permalinks: string[];
}

/** One drift, typed. */
export interface DriftFinding {
  target: FindingTarget;
  /** The block to replace, and the stamp the sweep read — null off Notion. */
  blockId: string | null;
  lastEditedTime: string | null;
  /** The block's whole text as read, so the card can show what changes. */
  original: string;
  /** What the source says now. */
  sourceSays: string;
  /** What the thread says. */
  threadSays: string;
  /** The block's new text, when the target is writable. */
  replacement: string;
  evidence: FindingEvidence;
  /** The Slack user id to @-mention (`routeOwner`). */
  owner: string;
  /** 0–1, the detector's. Below the floor a finding never reaches here. */
  confidence: number;
  /** Everyone who posted in the thread — confirmers beside the owner. */
  participants: string[];
}

// ── Owner routing ────────────────────────────────────────────────────────────

/** Which rung named the owner. */
export type OwnerRung = "claimed" | "contributor" | "starter";

/**
 * Who a finding belongs to.
 *
 * @param input.claimedBy - Who the detector read as having claimed or done the
 *   work; honoured only when that person posted in the thread, since a name the
 *   thread never shows is a guess
 * @param input.participants - Everyone who posted in the thread
 * @param input.contributorIds - The linked card's Contributors, as Slack ids
 * @param input.starter - Who posted the thread's root
 */
export function routeOwner(input: {
  claimedBy: string | null;
  participants: readonly string[];
  contributorIds: readonly string[];
  starter: string;
}): { owner: string; rung: OwnerRung } {
  if (input.claimedBy && input.participants.includes(input.claimedBy)) {
    return { owner: input.claimedBy, rung: "claimed" };
  }
  const contributor = input.contributorIds.find(Boolean);
  if (contributor) return { owner: contributor, rung: "contributor" };
  return { owner: input.starter, rung: "starter" };
}

// ── Where it posts ───────────────────────────────────────────────────────────

/**
 * Where a finding is posted. A private place or a thread is named by id; the
 * two team channels are named by role, and the Worker's config maps each to
 * its id (`resolveDestination`).
 */
export type Destination =
  | { rung: "private"; channel: string; threadTs: string | null }
  | { rung: "thread"; channel: string; threadTs: string }
  | { rung: "design-system"; channel: "plus-universal" }
  | { rung: "design"; channel: "plus-design" };

/**
 * True when the target is the design system: the Figma library file,
 * `design-system/` code, Storybook, or a Roadmap card whose Product Pillar is
 * Universal.
 */
export function isDesignSystemTarget(target: Pick<FindingTarget, "kind" | "pillars">): boolean {
  if (target.kind === "figma-library" || target.kind === "design-system-code" || target.kind === "storybook") {
    return true;
  }
  return target.kind === "notion" && target.pillars.some((p) => p.trim().toLowerCase() === "universal");
}

/**
 * Where a finding goes, for every proactive job. The first rung that matches
 * wins:
 *   1. evidence in a private channel, a group DM or a DM → that place only;
 *   2. evidence in a Slack thread → that thread;
 *   3. a design-system target → #plus-universal;
 *   4. otherwise → #plus-design.
 * Never #uno-bot, and never a default to the lead.
 */
export function pickDestination(finding: Pick<DriftFinding, "evidence" | "target">): Destination {
  const { evidence } = finding;
  if (evidence.channelKind !== "public") {
    return { rung: "private", channel: evidence.channel, threadTs: evidence.threadTs };
  }
  if (evidence.threadTs) return { rung: "thread", channel: evidence.channel, threadTs: evidence.threadTs };
  if (isDesignSystemTarget(finding.target)) return { rung: "design-system", channel: "plus-universal" };
  return { rung: "design", channel: "plus-design" };
}

/** The Worker's channel ids for the two roles `pickDestination` names. */
export interface TeamChannels {
  plusUniversal?: string;
  plusDesign?: string;
}

/**
 * A destination as a channel id and the thread to post under, or null when the
 * role's channel is not configured.
 */
export function resolveDestination(
  destination: Destination,
  channels: TeamChannels,
): { channel: string; threadTs: string | null } | null {
  switch (destination.rung) {
    case "private":
      return { channel: destination.channel, threadTs: destination.threadTs };
    case "thread":
      return { channel: destination.channel, threadTs: destination.threadTs };
    case "design-system":
      return channels.plusUniversal ? { channel: channels.plusUniversal, threadTs: null } : null;
    case "design":
      return channels.plusDesign ? { channel: channels.plusDesign, threadTs: null } : null;
  }
}

// ── Links ────────────────────────────────────────────────────────────────────

/**
 * What a linked URL is, or null when the sweep does not follow it.
 *
 * @param url - A URL out of a message
 * @param figmaLibraryKey - The DS library file's key (`FIGMA_FILE_KEY`)
 */
export function classifyLink(url: string, figmaLibraryKey?: string): TargetKind | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (/(^|\.)notion\.so$/.test(host) || /(^|\.)notion\.site$/.test(host) || host === "app.notion.com") return "notion";
  if (/(^|\.)figma\.com$/.test(host)) {
    const key = u.pathname.split("/")[2];
    return figmaLibraryKey && key === figmaLibraryKey ? "figma-library" : "figma";
  }
  if (/(^|\.)github\.com$/.test(host) || /(^|\.)raw\.githubusercontent\.com$/.test(host)) {
    return /\/design-system\//.test(u.pathname) ? "design-system-code" : "github";
  }
  if (/(^|\.)slack\.com$/.test(host) && /\/(canvas|docs)\//.test(u.pathname)) return "canvas";
  if (/\/storybook(\/|$)/.test(u.pathname)) return "storybook";
  return null;
}

/**
 * The URLs a Slack message links, in order, each once. Slack sends a link as
 * `<url>` or `<url|label>`; a bare URL is taken too.
 */
export function linksIn(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/<(https?:\/\/[^|>\s]+)(?:\|[^>]*)?>|(https?:\/\/[^\s<>|)"']+)/g)) {
    const url = (m[1] ?? m[2] ?? "").replace(/[.,;:!?]+$/, "");
    if (url && !found.includes(url)) found.push(url);
  }
  return found;
}
