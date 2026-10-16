// The Review pop-up's shared anatomy: the five zones every draft is built
// from, in order, and the words around them — the pop-up's title and what each
// decision does — per tool.
//
// THE ZONES (`docs/plans/2026-10-15-review-modal-redesign.md` § The shared
// anatomy). A tool's reading (`review-draft.ts` § `anatomyOf`) supplies what
// goes in each; this file decides the blocks.
//   1. What this does, and where: a `header` in a person's words, then one
//      `rich_text` line of native `channel`, `user` and `link` elements. The
//      destination is said there and nowhere else.
//   2. What needs attention: an `alert` per caveat, two at most, near the top.
//   3. The thing itself: a `card` (`card-block.ts`, which also holds its
//      fallback).
//   4. The content: short facts as `section` fields, lists and quotes as
//      `rich_text`, and every text a confirmer would fix as a prefilled input.
//   5. The decision: a divider, the radio with a `description` per option,
//      and the note — `review-view.ts`, with the words from `decisionWords`.
//
// Only blocks a modal takes: no `table`, `markdown` or `container`.
//
// PURE: blocks out, nothing posted, nothing read.
import { clip, isLink, objectCardBlocks, type ObjectCard } from "./card-block";
import { escapeSlackText } from "./mrkdwn";
import { issueUpdateFromInput, type IssueUpdate } from "../tools/github-issue-update-render";
import type { ProposalOperation } from "../thread-state/index";

/** One element of the where line, as Slack's rich text takes it. */
export type WhereElement =
  | { type: "text"; text: string; style?: { bold?: boolean; code?: boolean } }
  | { type: "channel"; channel_id: string }
  | { type: "user"; user_id: string }
  | { type: "link"; url: string; text?: string };

/** A caveat, as the pop-up's alert says it. */
export interface DraftAlert {
  level: "default" | "info" | "warning" | "error" | "success";
  text: string;
}

/** A draft read into its zones. */
export interface DraftAnatomy {
  /** Zone 1: the action in a person's words. */
  header: string;
  /** Zone 1: where it goes and who it reaches. */
  where?: WhereElement[];
  /** Zone 2: the caveats. */
  alerts?: DraftAlert[];
  /** Zone 3: the thing shared or touched. */
  object?: ObjectCard;
  /** Zone 4: blocks built with this file's builders and the field inputs. */
  content: unknown[];
  /** What Approve does on this card, when the tool's words need the draft
   *  (`decisionWords` otherwise). */
  approve?: string;
  /** Where Approve sends it, as mrkdwn after "to" ("post in <#C…>"): what the
   *  decided card's alert says it was approved for. */
  destination?: string;
  /** What Needs changes does on this card, when it does something other than
   *  redraft (`decisionWords` otherwise). */
  revise?: string;
  /** How the draft reads once decided, opened from View, where that is more
   *  than the same zones without the where line and the caveats: a blueprint
   *  revision also drops the questions it asked before it was written. */
  settled?: DraftAnatomy;
}

/** Slack's caps: a header's text 150, an alert's 200, a section field 2,000
 *  and ten fields to a section, a section's text 3,000, an option's
 *  description 75. */
const HEADER_CHARS = 150;
const ALERT_CHARS = 200;
const FIELD_CHARS = 2000;
const MAX_FIELDS = 10;
const TEXT_CHARS = 3000;
export const DESCRIPTION_CHARS = 75;
/** Alerts to a draft, by the anatomy's rule; a further caveat is a context line. */
const MAX_ALERTS = 2;

/** A `notion_create`'s surface, as its title and its words both read it. */
function surfaceOf(input: Record<string, unknown>): string {
  return typeof input.surface === "string" ? input.surface.trim().toLowerCase() : "";
}

/** Zone 1's headline. */
export function headerBlock(text: string): unknown {
  return { type: "header", text: { type: "plain_text", text: clip(text, HEADER_CHARS) } };
}

/** Zone 1's where line: one rich text section of native elements. */
export function whereLine(elements: readonly WhereElement[]): unknown {
  return { type: "rich_text", elements: [{ type: "rich_text_section", elements: elements.map((e) => ({ ...e })) }] };
}

/** A where-line element as mrkdwn, for an alert that names it: a channel or
 *  a person as their pill, a link as a link, words escaped. */
export function whereMrkdwn(element: WhereElement): string {
  switch (element.type) {
    case "channel":
      return `<#${element.channel_id}>`;
    case "user":
      return `<@${element.user_id}>`;
    case "link":
      return element.text ? `<${element.url}|${escapeSlackText(element.text)}>` : `<${element.url}>`;
    case "text":
      return escapeSlackText(element.text);
  }
}

/** Zone 2: an alert per caveat, two at most, each plain text under 200
 *  characters; any further caveat stays on the draft as a context line, so
 *  none is lost. */
export function alertBlocks(alerts: readonly DraftAlert[]): unknown[] {
  const shown = alerts.slice(0, MAX_ALERTS).map((a) => ({ type: "alert", level: a.level, text: { type: "plain_text", text: clip(a.text, ALERT_CHARS) } }));
  const rest = alerts.slice(MAX_ALERTS);
  return rest.length ? [...shown, { type: "context", elements: [{ type: "mrkdwn", text: rest.map((a) => escapeSlackText(a.text)).join("\n") }] }] : shown;
}

/** Mrkdwn emphasis and emoji shortcodes out of a caveat line, for an alert's
 *  plain text. */
function plainOf(line: string): string {
  return line
    .replace(/:[a-z0-9_+-]+:\s*/g, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "a, b or c". */
function orList(items: readonly string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)!}`;
}

/**
 * The card's caveat lines (`review-draft.ts` § `caveatsOf`) as alerts, each
 * in one sentence: the bundle audit by what is missing, anything else in its
 * own words without the mrkdwn. A line continuing the caveat above it folds
 * into that one.
 */
export function alertsFromCaveats(lines: readonly string[]): DraftAlert[] {
  const alerts: DraftAlert[] = [];
  for (const line of lines) {
    const bundle = /Bundle incomplete — missing: (.+?)\.\*/.exec(line);
    if (bundle) {
      const missing = bundle[1]!.split(" · ").map((s) => s.trim()).filter(Boolean);
      alerts.push({
        level: "warning",
        text: `Bundle incomplete: no ${orList(missing)}. Approving posts it without them, or drop the links in the thread first.`,
      });
      continue;
    }
    if (line.startsWith("Approving posts it")) continue;
    const warning = line.startsWith(":warning:");
    const text = plainOf(line);
    if (text) alerts.push({ level: warning ? "warning" : "info", text: clip(text, ALERT_CHARS) });
  }
  return alerts;
}

/** One short fact: its label, its value, and where the value opens, when it
 *  is a link (a source thread, a Roadmap card). */
export type Fact = readonly [label: string, value: string, url?: string];

/** Zone 4: short facts in two columns, ten at most, the accessory beside them
 *  (Edit fields, where its selects can be edited). A fact with an http(s)
 *  address reads as its value, linked. */
export function factsSection(facts: ReadonlyArray<Fact>, accessory?: unknown): unknown {
  const valueOf = (value: string, url?: string) =>
    url && isLink(url) ? `<${url}|${escapeSlackText(value)}>` : escapeSlackText(value);
  return {
    type: "section",
    fields: facts
      .slice(0, MAX_FIELDS)
      .map(([label, value, url]) => ({ type: "mrkdwn", text: clip(`*${escapeSlackText(label)}*\n${valueOf(value, url)}`, FIELD_CHARS) })),
    ...(accessory ? { accessory } : {}),
  };
}

const boldLine = (label: string) => ({ type: "rich_text_section", elements: [{ type: "text", text: label, style: { bold: true } }] });
const textSection = (text: string) => ({ type: "rich_text_section", elements: [{ type: "text", text: clip(text, TEXT_CHARS) }] });

/** Zone 4: a list under a bold label, as rich text bullets. */
export function listBlock(label: string, items: readonly string[]): unknown {
  return {
    type: "rich_text",
    elements: [boldLine(label), { type: "rich_text_list", style: "bullet", elements: items.map(textSection) }],
  };
}

/** Zone 4: text that goes out verbatim and is not edited here, quoted under a
 *  bold label. */
export function quoteBlock(label: string, text: string): unknown {
  return {
    type: "rich_text",
    elements: [boldLine(label), { type: "rich_text_quote", elements: [{ type: "text", text: clip(text, TEXT_CHARS) }] }],
  };
}

/** Said where a value is too long to be an input. */
export const TOO_LONG_TO_EDIT =
  "This text is over the 3,000 characters a pop-up field holds, so it can't be edited here. Choose Needs changes to ask for a different wording.";

/** Zone 4: a text shown, not edited, under a bold label. */
export function labelledText(label: string, text: string): unknown {
  return { type: "rich_text", elements: [boldLine(label), textSection(text)] };
}

/**
 * Zones 1–4, in order, as blocks.
 *
 * @param anatomy - The draft, read into its zones
 * @param lead - Blocks the view puts at the head of the content: Edit fields,
 *   and the line naming what was edited there
 */
export function anatomyBlocks(anatomy: DraftAnatomy, lead: readonly unknown[] = []): unknown[] {
  return [
    headerBlock(anatomy.header),
    ...(anatomy.where?.length ? [whereLine(anatomy.where)] : []),
    ...alertBlocks(anatomy.alerts ?? []),
    ...(anatomy.object ? objectCardBlocks(anatomy.object) : []),
    ...lead,
    ...anatomy.content,
  ];
}

// ── Around the draft: the title, and what each decision does ────────────────

/** The title a pop-up falls back to: a tool with no title of its own. */
export const DEFAULT_TITLE = "Review proposal";

/** Each tool's title, at most 24 characters: Slack's cap on a modal title. */
const TITLES: Readonly<Record<string, string | ((input: Record<string, unknown>) => string)>> = {
  shareout_post: "Review share-out",
  github_issue_create: "Review new issue",
  github_issue_update: "Review issue update",
  notion_create: (input) => {
    const surface = surfaceOf(input);
    if (surface === "prd" || surface === "intake") return "Review Roadmap card";
    if (surface === "decision") return "Review decision";
    if (surface === "marketplace") return "Review Marketplace row";
    return "Review Notion page";
  },
  notion_update: "Review page update",
  notion_archive: "Review archive",
  github_workflow_run: "Review workflow run",
  dm_relay: "Review DM",
  figma_tidy_up: "Figma tidy-up",
  ds_precedence_intake: "Review DS intake",
  sweep_share_post: "Review shared note",
  figma_dev_links: "Review Dev Mode links",
  // A revision with a `variant` draws an idea beside today's path: a proposal.
  blueprint_revise: (input) => (input.variant ? "Blueprint proposal" : "Blueprint revision"),
  blueprint_withdraw: "Remove proposal",
};

/**
 * The pop-up's title for this batch: its tool's, a batch of DMs by its size
 * ("Review 2 DMs"), any other batch by its operations ("Review 3 operations").
 *
 * @param operations - The batch the card runs
 */
export function reviewTitle(operations: readonly ProposalOperation[]): string {
  if (operations.length > 1) {
    if (operations.every((op) => op.toolName === "sweep_share_post")) return "Review shared notes";
    return operations.every((op) => op.toolName === "dm_relay") ? `Review ${operations.length} DMs` : `Review ${operations.length} operations`;
  }
  const op = operations[0];
  const title = op ? TITLES[op.toolName] : undefined;
  if (!title) return DEFAULT_TITLE;
  return typeof title === "function" ? title(op!.input) : title;
}

/** What each decision does on a card, as its radio option's description. */
export interface DecisionWords {
  confirm: string;
  revise: string;
  cancel: string;
}

const REVISE = "I redraft it from your note and post a new card.";

/** What Approve and Reject do, per tool. */
const WORDS: Readonly<Record<string, readonly [string, string] | ((input: Record<string, unknown>) => readonly [string, string])>> = {
  shareout_post: (input) => [shareoutApprove(input), "Nothing posts."],
  notion_create: (input) => {
    const surface = surfaceOf(input);
    if (surface === "prd" || surface === "intake") return ["Creates the card now and links it in the thread.", "Nothing happens."];
    if (surface === "decision") return ["Logs the decision now and links it in the thread.", "Nothing happens."];
    return ["Creates the page now and links it in the thread.", "Nothing happens."];
  },
  notion_update: ["Writes the changes to the page now.", "Nothing changes."],
  notion_archive: ["Archives it now.", "Nothing is archived."],
  dm_relay: ["Sends the DM now.", "Nothing is sent."],
  github_issue_create: ["Files the issue now and links it in the thread.", "Nothing happens."],
  github_issue_update: (input) => [issueUpdateApprove(input), "Nothing happens."],
  github_workflow_run: ["Starts the run; its runs page posts in the thread.", "Nothing runs."],
  sweep_share_post: ["Posts exactly this note.", "Nothing posts."],
  figma_dev_links: ["Adds the links and the comment in Figma.", "Adds nothing."],
  ds_precedence_intake: ["Adds it to this week's intake.", "Left as deliberate. Nothing is filed."],
  figma_tidy_up: ["Leaves the file as it is.", "Nothing is recorded."],
  blueprint_revise: (input) => [blueprintApprove(input), "Nothing is written."],
};

/** A blueprint revision's Approve, by what it writes: "Writes the 4 changes
 *  to the blueprint now.", a proposal's rows on their new path, or a path's
 *  status alone. */
export function blueprintApprove(input: Record<string, unknown>): string {
  const rows = Array.isArray(input.rows) ? input.rows.length : 0;
  const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
  if (input.variant) return `Writes ${plural(rows, "proposed row")} on a new path beside today's.`;
  const path = (input.path ?? null) as { to?: unknown } | null;
  if (!rows && typeof path?.to === "string") return `Sets the path to ${path.to} now.`;
  return `Writes the ${plural(rows, "change")} to the blueprint now.`;
}

/** A share-out's Approve: it posts, and pings however many it names. */
export function shareoutApprove(input: Record<string, unknown>): string {
  const n = Array.isArray(input.reviewers) ? input.reviewers.filter((r) => typeof r === "string" && r.trim()).length : 0;
  return n ? `Posts it now and pings ${n} reviewer${n === 1 ? "" : "s"}.` : "Posts it now.";
}

/** What one follow-up does to its issue, each step in the third person, in
 *  the order the pop-up's heading names them: the comment, the state, then
 *  the labels ("comments", "closes", "labels"). */
function issueUpdateVerbs(update: IssueUpdate): string[] {
  const verbs: string[] = [];
  if (update.comment) verbs.push("comments");
  if (update.state) verbs.push(update.state === "open" ? "reopens" : "closes");
  if (update.addLabels.length || update.removeLabels.length) verbs.push(update.removeLabels.length ? "relabels" : "labels");
  return verbs;
}

/** "a, b and c". */
function andList(items: readonly string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)!}`;
}

/** An issue follow-up's Approve: what it does to the issue, by number
 *  ("Comments, closes and labels #688 now."), read as the executor reads the
 *  input. */
export function issueUpdateApprove(input: Record<string, unknown>): string {
  const read = issueUpdateFromInput(input);
  if (!read.ok) return "Updates the issue now.";
  const verbs = issueUpdateVerbs(read.update);
  // A comment alone is a comment on the issue, never "comments #688".
  const words = verbs.length === 1 && verbs[0] === "comments" ? "comments on" : andList(verbs);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} #${read.update.issue} now.`;
}

/**
 * What Approve, Needs changes and Reject do on this card, each 75 characters
 * or fewer: the tool's words for one operation, a batch's by its size.
 *
 * @param operations - The batch the card runs
 */
export function decisionWords(operations: readonly ProposalOperation[]): DecisionWords {
  if (operations.length > 1) {
    const dms = operations.every((op) => op.toolName === "dm_relay");
    const n = operations.length;
    return dms
      ? { confirm: n === 2 ? "Sends both DMs now." : `Sends all ${n} DMs now.`, revise: REVISE, cancel: "Nothing is sent." }
      : { confirm: `Runs all ${n} operations now, in order.`, revise: REVISE, cancel: "Nothing runs." };
  }
  const op = operations[0];
  const words = op ? WORDS[op.toolName] : undefined;
  const [confirm, cancel] = typeof words === "function" ? words(op!.input) : (words ?? ["Runs it now.", "Nothing runs."]);
  return { confirm: clip(confirm, DESCRIPTION_CHARS), revise: REVISE, cancel: clip(cancel, DESCRIPTION_CHARS) };
}
