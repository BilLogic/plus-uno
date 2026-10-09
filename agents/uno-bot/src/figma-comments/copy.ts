// The words of a comment-decision thread in #plus-design (#886 § 3.5, #900).
//
// The parent names the file and the count, and asks one person to check the
// drafts. Each decision is a reply of its own, decided from its Review button
// like every card:
//
//   *1 · "Keep the progress bar hidden until the first goal is set"*
//   sarah on the Specs page, resolved Sep 29 · see comment
//   • PRD › Goal states: add this rule · page
//   > The progress bar stays hidden until a goal is set.
//   ✅ writes it · ⛔ drops it
//
// Where this goes past § 3.5's example:
//   • the number, which ties a revision and the thread's record to one card;
//   • the whole text the write makes under the update line — the PRD line, or
//     the intake's body — so a ✅ consents to what is written, not to a quote
//     of the comment. A card past the checklist's 1,500 characters shows a cut
//     of it in the thread, and the whole of it in its text and in Review;
//   • "✅ writes it" for one write, "✅ files the intake" for an intake: § 3.5's
//     "writes both" also counted a Decisions DB row, which this job does not
//     write;
//   • the commenter and a file's creator by Figma handle, never mentioned:
//     nothing maps a Figma person to a Slack one yet.
// "Read like decisions" admits a judgement call, which invites correction.
//
// PURE.

import { escapeSlackText } from "../slack/mrkdwn";
import { textSections } from "../slack/render";
import { proposalActionBlocks, proposalCardBlocks } from "../slack/proposal-render";
import type { StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { dayWords } from "../figma-drift/copy";
import type { DecisionUpdate } from "./draft";
import type { FileOwner, QueuedDecision, QueuedFile } from "./queue";

/** A card past this many characters shows a cut of its draft in the thread
 *  (slack.md § Figma messages, checklist 8). */
export const CARD_CHARS = 1_500;
/** Characters of the draft a cut card shows. */
const CUT_DRAFT_CHARS = 600;

/** The file's thread opens with this. */
export function decisionParent(file: Pick<QueuedFile, "title" | "url" | "owner">, count: number): string {
  const title = escapeSlackText(file.title.replace(/\s+/g, " ").trim() || "this file");
  const head = count === 1 ? `*1 comment in <${file.url}|${title}> reads like a decision*` : `*${count} comments in <${file.url}|${title}> read like decisions*`;
  return `${head}\n${askOf(file.owner, count)}`;
}

/** The parent, edited, when none of its cards went up this morning. */
export function decisionParentWaiting(file: Pick<QueuedFile, "title" | "url">): string {
  const title = escapeSlackText(file.title.replace(/\s+/g, " ").trim() || "this file");
  return `*Comments in <${file.url}|${title}> read like decisions*\nTheir cards didn't go through this morning, so they'll post here tomorrow morning.`;
}

function askOf(owner: FileOwner | null, count: number): string {
  const what = count === 1 ? "the update I've drafted below" : "the updates I've drafted below";
  if (owner && "slack" in owner) return `<@${owner.slack}>, can you check ${what}?`;
  if (owner) return `${escapeSlackText(owner.figma)}, can you check ${what}?`;
  return `Can someone on the card check ${what}?`;
}

/** Who said it, where and when, and the comment's link. */
function saidLine(d: Pick<QueuedDecision, "by" | "section" | "resolvedAt" | "createdAt">, commentUrl: string): string {
  const when = d.resolvedAt ? `resolved ${dayWords(Date.parse(d.resolvedAt))}` : `commented ${dayWords(Date.parse(d.createdAt))}`;
  return `${escapeSlackText(d.by)} on the ${d.section} page, ${when} · <${commentUrl}|see comment>`;
}

/** The reply's lead: the quote, who said it where and when, and what the ✅ writes. */
export function decisionLead(
  n: number,
  d: Pick<QueuedDecision, "quote" | "by" | "section" | "resolvedAt" | "createdAt" | "update">,
  commentUrl: string,
): string {
  return [`*${n} · "${escapeSlackText(d.quote)}"*`, saidLine(d, commentUrl), `• ${updateLine(d.update)}`].join("\n");
}

/** What the ✅ writes, in one line. */
export function updateLine(u: DecisionUpdate): string {
  if (u.kind === "card") {
    const change = u.from ? `${escapeSlackText(u.from)} → ${escapeSlackText(u.to)}` : `set to ${escapeSlackText(u.to)}`;
    return `*Card ${u.card} › ${escapeSlackText(u.field)}:* ${change} · <${u.url}|card>`;
  }
  if (u.kind === "intake") return `*Intake:* "${escapeSlackText(u.title)}"`;
  if (u.kind === "no-prd") return u.card === null ? "*PRD:* none found" : `*PRD:* none found under Card ${u.card}`;
  const where = u.section ? `PRD › ${escapeSlackText(u.section)}` : "PRD";
  return `*${where}:* ${u.change === "add" ? "add this rule" : "change this rule"} · <${u.page.url}|page>`;
}

/** The whole text a decision's write makes — a PRD line, or an intake's body — or null for a card field. */
export function draftedText(d: Pick<QueuedDecision, "operation">): string | null {
  const input = (d.operation?.input ?? {}) as { replace?: Array<{ content?: string }>; insert?: Array<{ content?: string }>; body?: string };
  const text = input.replace?.[0]?.content ?? input.insert?.[0]?.content ?? (d.operation?.toolName === "github_issue_create" ? input.body : undefined);
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

/** Text as a Slack quote, every line of it. */
function quoted(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${escapeSlackText(line)}`.trimEnd())
    .join("\n");
}

/** The drafted words, quoted whole under the update so the ✅ sees them. */
export function draftedWords(d: Pick<QueuedDecision, "operation">): string | null {
  const text = draftedText(d);
  return text ? quoted(text) : null;
}

/** The card's one footer: what ✅ and ⛔ do. */
export function decisionFooter(route: QueuedDecision["route"]): string {
  const yes = route === "design-system" ? ":white_check_mark: files the intake" : ":white_check_mark: writes it";
  return `${yes} · :no_entry: drops it`;
}

/**
 * One decision as a `stated` card. Its text carries the whole draft.
 *
 * @param n - Its number in the thread
 * @param d - The decision
 * @param commentUrl - Its comment's link
 */
export function decisionCard(n: number, d: QueuedDecision, commentUrl: string): ProposalCard {
  const drafted = draftedWords(d);
  return {
    kind: "stated",
    verb: d.route === "design-system" ? "file this intake" : "write this decision",
    lead: drafted ? `${decisionLead(n, d, commentUrl)}\n${drafted}` : decisionLead(n, d, commentUrl),
    footer: decisionFooter(d.route),
    fields: [],
    caveats: [],
    operations: d.operation ? [d.operation] : [],
  };
}

/**
 * What a decision card posts as: its whole text, and the blocks the thread
 * shows. A card within `CARD_CHARS` shows its text whole; a longer one shows
 * its lead, the start of the draft and where the rest is, so the thread stays
 * readable — the text, which is the notification and what is staged, keeps
 * every word, and Review shows the whole write.
 *
 * @param n - Its number in the thread
 * @param d - The decision
 * @param commentUrl - Its comment's link
 * @param text - The card's rendered text
 */
export function decisionCardBlocks(n: number, d: QueuedDecision, commentUrl: string, text: string): unknown[] {
  if (text.length <= CARD_CHARS) return proposalCardBlocks(text);
  const draft = draftedText(d) ?? "";
  const cut = draft.length > CUT_DRAFT_CHARS ? `${draft.slice(0, CUT_DRAFT_CHARS - 1).trimEnd()}…` : draft;
  const short = [
    decisionLead(n, d, commentUrl),
    ...(cut ? [quoted(cut)] : []),
    `_The whole text, ${draft.length.toLocaleString("en-US")} characters, is in Review._`,
    "",
    decisionFooter(d.route),
  ].join("\n");
  return [...textSections(short), ...proposalActionBlocks()];
}

/**
 * A decision with no PRD to write to: said in the thread, carded nowhere.
 *
 * @param d - The decision
 * @param commentUrl - Its comment's link
 */
export function noPrdNote(d: Pick<QueuedDecision, "quote" | "by" | "section" | "resolvedAt" | "createdAt" | "decision" | "update">, commentUrl: string): string {
  const where = d.update.kind === "no-prd" && d.update.card !== null ? `Card ${d.update.card} has no PRD page` : "this file has no card with a PRD page";
  return [
    `*"${escapeSlackText(d.quote)}"*`,
    saidLine(d, commentUrl),
    `This reads like a PRD change, but ${where}, so I haven't drafted it anywhere: ${escapeSlackText(d.decision)}`,
  ].join("\n");
}

/** What a decision card says at the gate (`PendingProposal.stated`). */
export function decisionCardWords(): StatedCardWords {
  return {
    cancelled: "Dropped, nothing written",
    expired: "That card closed after 72 h with no decision, so nothing was written.",
  };
}

/** What a turn says in a decision thread when it would change a card. */
export function rewordInstead(n: number): string {
  return `To change decision ${n}'s wording, press Review on its card and choose Needs changes.`;
}

/** The answer to a reword that names no number while the thread holds several decisions. */
export function whichOne(open: readonly number[]): string {
  const example = open[0] ?? 1;
  return `Which one? Press Review on that decision's card and choose Needs changes, or start the reply with its number, like \`${example}: …\`.`;
}
