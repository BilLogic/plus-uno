// What the morning's drift report says, on the shared decision card
// (`slack/decision-cards.ts`).
//
// #886 § 3.3's question, approved by Bill on 2026-09-30, became the card's
// parent line and one card per file (the review board's "Figma drift" mock,
// approved 2026-10-09):
//
//   This thread settled two decisions that their Figma files have not caught up with.
//   [PLUS BS4 Foundation]  <@owner> · last changed Oct 2
//     Thread settled "primary buttons use brand-600" on Oct 6 · the file has not changed since Oct 2.
//     [Review] [Open in Figma]
//
// Each card is decided in its Review pop-up alone: Approve files the file's
// intake, Reject files nothing. Nothing here teaches a gate of its own — no
// ✅/⛔ footer, no `drop N`, no typed `skip` or "yes". A file whose intake is
// drafted in another thread is no card here: the parent gains a one-line
// pointer to it. Once a file catches up, its card (or a pointer-only message)
// is edited in place to say so.
//
// MENTIONS: each card's subtitle @-mentions its file's owner and nobody else.
//
// EVERY NOTION- AND FIGMA-SOURCED STRING IN mrkdwn IS ESCAPED
// (`escapeSlackText`): a file title or a thread paraphrase holding
// `<!channel>` pings nobody. A card's title and body are plain_text, which
// Slack never reads for mentions, so they stay as written.
//
// PURE: no `Env`, no Slack module, no Workers global.

import { escapeSlackText } from "../slack/mrkdwn";
import { shortDate, windowInWords } from "../slack/copy-words";
import { etDayOf } from "../sweep/schedule";
import type { ProposalOperation, ReportItem, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { TargetKind } from "../sweep/finding";
import type { IntakeLane } from "./finding";

/** How long a drift card stays decidable. */
export const DRIFT_CARD_TTL_MS = 72 * 60 * 60 * 1000;

/** Characters of a paraphrase quoted on a card, so its 200-character body
 *  keeps what the file did. */
const CARD_SAID_CHARS = 90;
/** Characters of a paraphrase quoted where Review shows it. */
const SAID_CHARS = 200;

/** A file as the report names it. */
export interface AskedFileWords {
  title: string;
  url: string;
  kind: TargetKind;
}

/**
 * What the morning learned about a file's last change, against the decision:
 *   • `unchanged` — its last change is at or before the decision;
 *   • `changed` — it changed after, and its frame could not be confirmed to
 *     show the decision (a frame that does is not asked about at all);
 *   • `unknown` — not read: a failed read, or a file that is not Figma's.
 */
export type FileChange = { kind: "unchanged"; at: number } | { kind: "changed"; at: number } | { kind: "unknown" };

/** One file the report names: what the thread settled about it, and when. */
export interface DriftFileWords {
  file: AskedFileWords;
  /** What the thread settled. */
  threadSays: string;
  /** When it settled it — the earliest evidence message, epoch ms. */
  decidedAt: number;
  change: FileChange;
}

/**
 * A file as the report names it: "<file> — <frame>" for a Figma link to a
 * frame, the file's name taken from the link and the frame's from its read;
 * otherwise the title the sweep read.
 *
 * @param file - The file, its title as the sweep read it
 */
export function fileName(file: Pick<AskedFileWords, "title" | "url">): string {
  const title = flat(file.title);
  const fromLink = figmaFileName(file.url);
  if (!fromLink) return title || "this file";
  return title && title.toLowerCase() !== fromLink.toLowerCase() ? `${fromLink} — ${title}` : fromLink;
}

/** A file linked by its name, escaped. */
export function fileLink(file: Pick<AskedFileWords, "title" | "url">): string {
  return `<${file.url}|${escapeSlackText(fileName(file))}>`;
}

/** A moment as its ET day, "Sep 24". */
export function dayWords(at: number): string {
  return shortDate(new Date(etDayOf(at)).toISOString());
}

/**
 * The report's parent line: what the thread settled that its files have not
 * caught up with — one plain sentence, every file the thread discussed
 * counted, its own cards and the ones drafted elsewhere alike.
 *
 * @param kinds - The kind of each file the thread discussed
 */
export function driftParent(kinds: readonly TargetKind[]): string {
  if (kinds.length === 1) return `This thread settled a decision that ${singular(kinds[0]!)} has not caught up with.`;
  const whose = kinds.every(isFigma) ? "their Figma files" : "their files";
  return `This thread settled ${countWords(kinds.length)} decisions that ${whose} have not caught up with.`;
}

/**
 * The parent's pointer to a file whose intake is drafted in another thread.
 *
 * @param file - The file
 * @param cardLink - That report's link, or null when it could not be read
 */
export function elsewhereLine(file: Pick<AskedFileWords, "title" | "url">, cardLink: string | null): string {
  return `The intake for ${fileLink(file)} is drafted ${cardLink ? `<${cardLink}|in another thread>` : "in another thread"}.`;
}

/**
 * One file as its card: the file, its owner and last change, what the thread
 * settled and what the file did since; Open goes to the link the thread used,
 * so a Figma link opens on its frame.
 *
 * @param input.id - The card's id in its report
 * @param input.owner - The file's owner's Slack id, or null
 * @param input.lane - What Approve files
 */
export function driftItem(input: DriftFileWords & { id: string; owner: string | null; lane: IntakeLane }): ReportItem {
  const { file, change } = input;
  const title = fileName(file);
  const when = change.kind === "unknown" ? null : `last changed ${dayWords(change.at)}`;
  const subtitle = [input.owner ? `<@${input.owner}>` : null, when].filter(Boolean).join(" · ");
  return {
    id: input.id,
    title,
    ...(subtitle ? { subtitle } : {}),
    body: `Thread settled "${quoted(input.threadSays, CARD_SAID_CHARS)}" on ${dayWords(input.decidedAt)} · ${sinceWords(file.kind, change)}.`,
    open: { label: openLabel(file.kind), url: file.url },
    done: `${input.lane === "roadmap" ? "a Roadmap card" : "an intake"} to update ${title}`,
  };
}

/**
 * What Review shows for one file's card: the file linked, what the thread
 * settled and when, what the file did since, and why the Product Pillar was
 * left off when it was — above the intake it files. No footer: Review's own
 * buttons decide it.
 *
 * @param input.note - The pillar's note (`pillarNote`), or null
 * @param operation - The intake it files
 */
export function driftReview(input: DriftFileWords & { lane: IntakeLane; note: string | null }, operation: ProposalOperation): ProposalCard {
  const lead = `*${fileLink(input.file)}:* this thread settled "${escapeSlackText(quoted(input.threadSays, SAID_CHARS))}" on ${dayWords(input.decidedAt)}, and ${reviewChangeWords(input.file.kind, input.change)}.`;
  return {
    kind: "stated",
    verb: input.lane === "roadmap" ? "file this Roadmap card" : "file this intake",
    lead: input.note ? `${lead}\n${input.note}` : lead,
    footer: "",
    fields: [],
    caveats: [],
    operations: [operation],
  };
}

/**
 * What the gate says on a drift card, in place of its generic lines: nobody
 * asked for this card, so "tell me what to change" and "ask me again" would
 * be wrong, and #886 promises no re-ping (`PendingProposal.stated`).
 *
 * @param ttlHours - The card's whole window, in hours
 */
export function driftCardWords(ttlHours: number): StatedCardWords {
  return {
    cancelled: "No intake filed",
    expired: `That card closed after ${windowInWords(ttlHours)} with no decision, so nothing was filed.`,
  };
}

/** What a turn says to Needs changes on a drift card: the intake is drafted
 *  from the thread as it stands, so it is not redrafted. */
export const DRIFT_NO_REVISION =
  "This intake is drafted from the thread as it stands, so I don't redraft it. In its Review, Approve files it as it is and Reject files nothing.";

// ── Withdrawals: the same message, edited ────────────────────────────────────

/** A card whose file now shows the decision, in place of who and where. */
export function caughtUpNote(at: number): string {
  return `Updated ${dayWords(at)}. Nothing to do.`;
}

/**
 * A pointer-only message, edited in once every file it names shows the
 * thread's decision.
 *
 * @param files - How many files it names
 * @param at - The latest change that showed it
 */
export function caughtUpText(files: number, at: number): string {
  return files === 1
    ? `The file now shows this thread's decision, updated ${dayWords(at)}. Nothing to do.`
    : `The files now show this thread's decisions, updated ${dayWords(at)}. Nothing to do.`;
}

/** What a card that showed and did not stage says in place of who and where. */
export const DRIFT_NOT_STAGED = "Didn't go through, so I'll ask again tomorrow morning.";

/** What a report none of whose cards could be kept is edited to say. */
export const DRIFT_NOT_POSTED_TEXT = "These intakes didn't go through, so I'll ask again tomorrow morning.";

/**
 * Why the Product Pillar was left off an intake, for what Review shows.
 *
 * @param note - Why (`matchPillar`)
 */
export function pillarNote(note: string): string {
  return `_Product Pillar: ${escapeSlackText(note)}_`;
}

// ── Cards from before the shared card ────────────────────────────────────────
//
// A card posted before the drift report moved to the shared card is one
// message and one proposal, with a ✅/⛔ footer and `drop N`/`skip` in its
// words. It lives out its 72 h as it posted; these are the two lines it may
// still need.

/**
 * Such a card, edited once every file it names shows its decision: its own
 * question struck through.
 *
 * @param headline - Its question, as its live record kept it
 * @param at - The latest change that showed it
 */
export function legacyCaughtUpText(headline: string, at: number): string {
  return `~${headline}~ Yes, updated ${dayWords(at)}. Nothing to do.`;
}

/** What a reply that answers such a card's footer in words is told. */
export const LEGACY_DRIFT_REPLY =
  "That card is decided from its Review button now: Approve files its intakes as drafted, and Reject files nothing.";

// ── Words ────────────────────────────────────────────────────────────────────

function isFigma(kind: TargetKind): boolean {
  return kind === "figma" || kind === "figma-library";
}

/** One file, as the parent's subject names it. */
function singular(kind: TargetKind): string {
  if (isFigma(kind)) return "its Figma file";
  if (kind === "storybook") return "Storybook";
  return "the code";
}

/** What the file is, as a card's body names it. */
function thing(kind: TargetKind): string {
  if (isFigma(kind)) return "the file";
  if (kind === "storybook") return "Storybook";
  return "the code";
}

function openLabel(kind: TargetKind): string {
  if (isFigma(kind)) return "Open in Figma";
  if (kind === "storybook") return "Open in Storybook";
  return "Open on GitHub";
}

/** What the file did since the decision, as a card's body ends. */
function sinceWords(kind: TargetKind, change: FileChange): string {
  if (change.kind === "unchanged") return `${thing(kind)} has not changed since ${dayWords(change.at)}`;
  if (change.kind === "changed") return `${thing(kind)} changed ${dayWords(change.at)}, unconfirmed`;
  return `${thing(kind)} may not show it yet`;
}

/** What the file did since the decision, as Review's sentence ends. */
function reviewChangeWords(kind: TargetKind, change: FileChange): string {
  if (change.kind === "unchanged") return `${thing(kind)} hasn't changed since ${dayWords(change.at)}`;
  if (change.kind === "changed") return `${thing(kind)} last changed ${dayWords(change.at)}`;
  return `${thing(kind)} may not show it yet`;
}

const COUNTS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function countWords(n: number): string {
  return COUNTS[n] ?? String(n);
}

/** A Figma frame link's file name, off its slug ("Session-Recap" →
 *  "Session Recap"); null for any other link, or one naming no frame. */
function figmaFileName(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)figma\.com$/i.test(u.hostname) || !u.searchParams.get("node-id")) return null;
    const slug = u.pathname.split("/")[3];
    return slug ? decodeURIComponent(slug).replace(/[-_]+/g, " ").trim() || null : null;
  } catch {
    return null;
  }
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** A thread's paraphrase as a quote: one line, capped, with no closing full
 *  stop doubled inside the quote marks. */
function quoted(text: string, max: number): string {
  const f = flat(text).replace(/[.\s]+$/, "");
  return f.length > max ? `${f.slice(0, max - 1).trimEnd()}…` : f;
}
