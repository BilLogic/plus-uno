// The words of a comment-decision thread in #plus-design (#886 § 3.5, #900),
// on the shared decision card (`slack/decision-cards.ts`).
//
// The thread opens with one message: a parent line naming the file and the
// count for its owner, then one card per decision — a carousel when there are
// several — each with Review and Open comment:
//
//   <@sarah>, 2 comments in Goal Setting read like decisions.
//   ┌ 1 · Keep the progress bar hidden until the first goal is set
//   │ sarah · Specs page · resolved Sep 29
//   │ PRD › Goal states: add this rule. The progress bar stays hidden until…
//   └ [Review] [Open comment] [Open page]
//
// The card is short; the decision's whole text — the quote, who said it where
// and when, what the write does and every word it writes (the PRD line, the
// intake's body) — is its proposal's, which Review shows and decides. Nothing
// on the card or in the text says what to type or react: Review is the gate.
//
// Where this goes past § 3.5's example:
//   • the number, which ties a revision and the thread's record to one card;
//   • the commenter and a file's creator by Figma handle, never mentioned:
//     nothing maps a Figma person to a Slack one yet.
// "Read like decisions" admits a judgement call, which invites correction.
//
// PURE.

import { escapeSlackText } from "../slack/mrkdwn";
import type { DecisionItem } from "../slack/decision-cards";
import type { StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { dayWords } from "../figma-drift/copy";
import type { DecisionUpdate } from "./draft";
import type { FileOwner, QueuedDecision, QueuedFile } from "./queue";

/** The file's name, on one line. */
function fileName(file: Pick<QueuedFile, "title">): string {
  return escapeSlackText(file.title.replace(/\s+/g, " ").trim() || "this file");
}

/**
 * The thread's parent line: whom it is for, the file and the count, in one
 * plain sentence.
 *
 * @param file - The file
 * @param count - How many decisions it has, held-back ones included
 */
export function decisionParent(file: Pick<QueuedFile, "title" | "url" | "owner">, count: number): string {
  const what = count === 1 ? "1 comment in" : `${count} comments in`;
  const reads = count === 1 ? "reads like a decision" : "read like decisions";
  return `${ownerOf(file.owner)}${what} <${file.url}|${fileName(file)}> ${reads}.`;
}

/** The parent, edited, when none of its cards went up this morning. */
export function decisionParentWaiting(file: Pick<QueuedFile, "title" | "url">): string {
  return `Comments in <${file.url}|${fileName(file)}> read like decisions. Their cards didn't go through this morning, so they'll post here tomorrow morning.`;
}

/** Whom the parent is for: the owner by Slack mention, else by Figma handle. */
function ownerOf(owner: FileOwner | null): string {
  if (owner && "slack" in owner) return `<@${owner.slack}>, `;
  if (owner) return `${escapeSlackText(owner.figma)}, `;
  return "";
}

/** When the comment was resolved or made. */
function whenWords(d: Pick<QueuedDecision, "resolvedAt" | "createdAt">): string {
  return d.resolvedAt ? `resolved ${dayWords(Date.parse(d.resolvedAt))}` : `commented ${dayWords(Date.parse(d.createdAt))}`;
}

/** Who said it, where and when, and the comment's link. */
function saidLine(d: Pick<QueuedDecision, "by" | "section" | "resolvedAt" | "createdAt">, commentUrl: string): string {
  return `${escapeSlackText(d.by)} on the ${d.section} page, ${whenWords(d)} · <${commentUrl}|see comment>`;
}

/** The decision's lead: the quote, who said it where and when, and what the write does. */
export function decisionLead(
  n: number,
  d: Pick<QueuedDecision, "quote" | "by" | "section" | "resolvedAt" | "createdAt" | "update">,
  commentUrl: string,
): string {
  return [`*${n} · "${escapeSlackText(d.quote)}"*`, saidLine(d, commentUrl), `• ${updateLine(d.update)}`].join("\n");
}

/** What the write does, in one line. */
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

/** What the write does, plain, for a card's body: no markup, no link. */
function updateWords(u: DecisionUpdate): string {
  if (u.kind === "card") return `Card ${u.card} › ${u.field}: ${u.from ? `${u.from} → ${u.to}` : `set to ${u.to}`}`;
  if (u.kind === "intake") return `Intake: "${u.title}"`;
  if (u.kind === "no-prd") return u.card === null ? "PRD: none found" : `PRD: none found under Card ${u.card}`;
  return `${u.section ? `PRD › ${u.section}` : "PRD"}: ${u.change === "add" ? "add this rule" : "change this rule"}`;
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

/** The drafted words, quoted whole under the update, so Review shows them. */
export function draftedWords(d: Pick<QueuedDecision, "operation">): string | null {
  const text = draftedText(d);
  return text ? quoted(text) : null;
}

/**
 * One decision as the proposal Review shows and decides: its whole text, and
 * no footer — the card's Review is the only instruction.
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
    footer: "",
    fields: [],
    caveats: [],
    operations: d.operation ? [d.operation] : [],
  };
}

/**
 * One decision as its card in the thread's carousel: the quote, who said it
 * where and when, what the write does and the start of what it writes. Open
 * goes to the comment, and a PRD or card decision's page is the third button.
 *
 * @param n - Its number in the thread
 * @param d - A decision with an operation
 * @param commentUrl - Its comment's link
 */
export function decisionItem(n: number, d: QueuedDecision, commentUrl: string): DecisionItem {
  const drafted = draftedText(d);
  const target = d.update.kind === "prd" ? { label: "Open page", url: d.update.page.url } : d.update.kind === "card" ? { label: "Open card", url: d.update.url } : null;
  return {
    id: d.commentId,
    title: `${n} · ${d.quote}`,
    subtitle: `${escapeSlackText(d.by)} · ${d.section} page · ${whenWords(d)}`,
    body: drafted ? `${updateWords(d.update)}. ${drafted}` : updateWords(d.update),
    open: { label: "Open comment", url: commentUrl },
    ...(target ? { also: target } : {}),
  };
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
