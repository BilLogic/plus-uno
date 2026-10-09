// The words of a comment-decision thread in #plus-design (#886 § 3.5, #900).
//
// The parent names the file and the count, and asks one person to check the
// drafts. Each decision is a reply of its own, so it can be ✅'d from a phone
// notification:
//
//   *1 · "Keep the progress bar hidden until the first goal is set"*
//   sarah on the Specs page, resolved Sep 29 · see comment
//   • PRD › Goal states: add "Hide the progress bar until a goal is set" · page
//   ✅ writes it · ⛔ drops it · reply "1: …" to change the wording
//
// Where this goes past § 3.5's example, for Bill to confirm (flagged in the PR):
//   • the number, which a reply names to change one decision's wording;
//   • the drafted words on the update line, so the ✅ consents to the text it
//     writes, not only to a quote of the comment;
//   • "✅ writes it" for one write, "✅ files the intake" for an intake — § 3.5's
//     "writes both" also counted a Decisions DB row, which is #901's;
//   • the commenter and a card-less file's creator by Figma handle, unmentioned,
//     until #902 maps Figma people to Slack.
// "Read like decisions" admits a judgement call, which invites correction.
//
// PURE.

import { escapeSlackText } from "../slack/mrkdwn";
import type { StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { dayWords } from "../figma-drift/copy";
import type { DecisionUpdate } from "./draft";
import type { FileOwner, QueuedDecision, QueuedFile } from "./queue";

/** Characters of drafted text an update line shows before it is cut, with "…". */
const DRAFT_CHARS = 160;

/** The file's thread opens with this. */
export function decisionParent(file: Pick<QueuedFile, "title" | "url" | "owner">, count: number): string {
  const title = escapeSlackText(file.title.replace(/\s+/g, " ").trim() || "this file");
  const head = count === 1 ? `*1 comment in <${file.url}|${title}> reads like a decision*` : `*${count} comments in <${file.url}|${title}> read like decisions*`;
  return `${head}\n${askOf(file.owner, count)}`;
}

function askOf(owner: FileOwner | null, count: number): string {
  const what = count === 1 ? "the update I've drafted below" : "the updates I've drafted below";
  if (owner && "slack" in owner) return `<@${owner.slack}>, can you check ${what}?`;
  if (owner) return `${escapeSlackText(owner.figma)}, can you check ${what}?`;
  return `Can someone on the card check ${what}?`;
}

/** The reply's lead: the quote, who said it where and when, and what the ✅ writes. */
export function decisionLead(n: number, d: Pick<QueuedDecision, "quote" | "by" | "section" | "resolvedAt" | "createdAt" | "update">, commentUrl: string): string {
  const when = d.resolvedAt ? `resolved ${dayWords(Date.parse(d.resolvedAt))}` : `commented ${dayWords(Date.parse(d.createdAt))}`;
  return [
    `*${n} · "${escapeSlackText(d.quote)}"*`,
    `${escapeSlackText(d.by)} on the ${d.section} page, ${when} · <${commentUrl}|see comment>`,
    `• ${updateLine(d.update)}`,
  ].join("\n");
}

/** What the ✅ writes, in one line. */
export function updateLine(u: DecisionUpdate): string {
  if (u.kind === "card") {
    const change = u.from ? `${escapeSlackText(u.from)} → ${escapeSlackText(u.to)}` : `set to ${escapeSlackText(u.to)}`;
    return `*Card ${u.card} › ${escapeSlackText(u.field)}:* ${change} · <${u.url}|card>`;
  }
  if (u.kind === "intake") return `*Intake:* "${escapeSlackText(cut(u.title))}"`;
  const where = u.section ? `PRD › ${escapeSlackText(u.section)}` : "PRD";
  return `*${where}:* ${u.change === "add" ? "add this rule" : "change this rule"} · <${u.page.url}|page>`;
}

/** The drafted words a PRD line writes, shown under the update so the ✅ sees them. */
export function draftedWords(d: Pick<QueuedDecision, "operation">): string | null {
  const input = d.operation.input as { replace?: Array<{ content?: string }>; insert?: Array<{ content?: string }> };
  const text = input.replace?.[0]?.content ?? input.insert?.[0]?.content;
  return typeof text === "string" && text.trim() ? `> ${escapeSlackText(cut(text.replace(/\s+/g, " ").trim()))}` : null;
}

/** The card's one footer: what ✅ and ⛔ do, and how to change the wording. */
export function decisionFooter(n: number, route: QueuedDecision["route"]): string {
  const yes = route === "design-system" ? ":white_check_mark: files the intake" : ":white_check_mark: writes it";
  return `${yes} · :no_entry: drops it · reply "${n}: …" to change the wording`;
}

/**
 * One decision as a `stated` card.
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
    footer: decisionFooter(n, d.route),
    fields: [],
    caveats: [],
    operations: [d.operation],
  };
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
  return `To change decision ${n}'s wording, reply with its number and the new wording, like \`${n}: …\`.`;
}

/** The answer to an unnumbered reply when the thread holds several decisions. */
export function whichOne(open: readonly number[]): string {
  const example = open[0] ?? 1;
  return `Which one? Reply with its number and the new wording, like \`${example}: …\`.`;
}

function cut(text: string): string {
  return text.length > DRAFT_CHARS ? `${text.slice(0, DRAFT_CHARS - 1)}…` : text;
}
