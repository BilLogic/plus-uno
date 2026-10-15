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
//   • `pickDestination` — where a finding is posted: the posting ladder
//     (`../destination/`) read with the finding's evidence and target.
//
// PURE: no `Env`, no Slack module, no Workers global.

import type { KeyDecision } from "../decisions-db/row";
import { routeFinding, type ChannelKind, type Destination, type FindingContext } from "../destination/index";

export { resolveDestination, type ChannelIds, type ChannelKind, type Destination } from "../destination/index";

/** The turn record's name for a kind of conversation (`ConversationType`),
 *  so the usage record's rules read a sweep place as they read a turn's. */
export function conversationTypeOf(kind: ChannelKind): "channel" | "group" | "mpim" | "im" {
  return kind === "public" ? "channel" : kind === "private" ? "group" : kind === "group-dm" ? "mpim" : "im";
}

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
  /** The URLs its rich text links or mentions — how a note or a card names
   *  the page it is about. */
  links?: string[];
  /** True when uno-bot's own integration made its last edit: never evidence. */
  byBot?: boolean;
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
  /** `search` when nobody linked it and a search found it (`./search.ts`);
   *  absent for a linked source. */
  foundBy?: "search";
  /** Notion only: the database the page is a row of, dashes removed, or null
   *  for a page that is none's — what `./surfaces.ts` reads. */
  parentDatabaseId?: string | null;
  /** Notion only: Notion's `parent.type` — `workspace` for a top-level page. */
  parentType?: string | null;
  /** Notion only: select, multi-select and status values by property name. */
  properties?: Record<string, string>;
  /** Notion only: the page runs past the blocks read, so its last block read
   *  is not its end. */
  truncated?: boolean;
  /** Notion only: the pages nested in its body, in order, each by its id and
   *  title — a Roadmap card's PRD among them. */
  subpages?: Array<{ id: string; title: string }>;
}

/** The target a finding is about. */
export interface FindingTarget {
  url: string;
  kind: TargetKind;
  writable: boolean;
  title: string;
  pillars: string[];
  /** The Roadmap card's design owner as a Slack id, when known: whom the
   *  ladder tags. */
  designOwner?: string | null;
  /** The Figma file's creator by handle, when known: whom the ladder names
   *  when there is no card. */
  creatorHandle?: string | null;
  /** `search` when a search found the page, so the card says so. */
  foundBy?: "search";
}

/**
 * Evidence that is not a Slack message: a running note's blocks, or a Roadmap
 * card's comments and body edits (`./records.ts`). Its finding has no thread,
 * so it goes to its team's channel, or #plus-design (`pickDestination`).
 */
export interface RecordEvidence {
  kind: "note" | "card";
  /** The note's or the card's page. */
  url: string;
  title: string;
  /** The note blocks, or the card's comments and blocks, that record it. */
  entryIds: string[];
}

/**
 * What an undocumented answer adds (C3): the text goes in after the block the
 * finding names — the last block of `section`, or the page's last block when
 * it opens `newSection`. Absent on a drift finding, which replaces its block.
 */
export interface FindingAddition {
  /** The heading it goes under, as the page shows it; null for a new section. */
  section: string | null;
  /** The heading of the section it opens on the page; null under `section`. */
  newSection: string | null;
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
  /** Set when the evidence is a note or a card rather than a message:
   *  `channel` is then the source's queue name and `threadTs` null. */
  record?: RecordEvidence;
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
  /** Set when the fix adds an answer rather than replacing a block. */
  add?: FindingAddition;
  /** A key decision's Decisions DB row (`../decisions-db/row.ts`): its card,
   *  the row as the rules kept it, and the Notion user of each person it
   *  names. Drafted in the morning, once the evidence has its permalink. */
  row?: { cardUrl: string; key: KeyDecision; notion: Record<string, string> };
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
 * Where a sweep finding goes: the posting ladder (`../destination/`), read with
 * the finding's evidence and its target (`ladderTarget`).
 */
export function pickDestination(finding: Pick<DriftFinding, "evidence" | "target">): Destination {
  return pickRoute(finding).destination;
}

/** Where a sweep finding goes and whom it names: the whole ladder answer. */
export function pickRoute(finding: Pick<DriftFinding, "evidence" | "target">): ReturnType<typeof routeFinding> {
  return routeFinding({ evidence: finding.evidence, ...ladderTarget(finding.target) });
}

/** The Figma team the design-system library file lives in. */
export const LIBRARY_TEAM = "Universal";

/**
 * What the ladder reads from a target: a Notion page's pillars are its card's
 * (empty off the Roadmap); the library file is in the Universal team, and
 * design-system code and Storybook are that library's code, so they take its
 * team. Any other target names no team.
 */
function ladderTarget(
  target: Pick<FindingTarget, "kind" | "pillars" | "designOwner" | "creatorHandle">,
): Pick<FindingContext, "card" | "figmaFile"> {
  const creatorHandle = target.creatorHandle ?? null;
  if (target.kind === "notion") return { card: { pillars: target.pillars, designOwner: target.designOwner ?? null } };
  if (target.kind === "figma-library" || target.kind === "design-system-code" || target.kind === "storybook") {
    return { figmaFile: { team: LIBRARY_TEAM, creatorHandle } };
  }
  if (target.kind === "figma") return { figmaFile: { creatorHandle } };
  return {};
}

/**
 * Where a group-DM finding's reworded note goes once someone in the group DM
 * ✅s it: the rung the finding would take with its evidence set aside — its
 * team's channel, or #plus-design. Never a thread, never the group DM, never
 * #uno-bot.
 */
export function shareDestination(
  target: Pick<FindingTarget, "kind" | "pillars">,
): Extract<Destination, { rung: "team" | "design" }> {
  const { destination } = routeFinding({ evidence: null, ...ladderTarget(target) });
  return destination.rung === "team" ? destination : { rung: "design", channel: "plus-design" };
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
