// The head of a decided card's pop-up: what View says above the draft.
//
// Every decided card — an item of a report, or a single card asked for in a
// thread — opens on the same head, in this order:
//
//   1. an `alert` at the outcome's level, the outcome and what it changed:
//      "Approved. Added to this week's DS precedence intake.";
//   2. one rich text sentence naming who decided and when, a pill for the
//      person: "Approved by @Bill on Oct 19 at 9:13 AM." — ending in a colon
//      when a quote follows, and absent when nobody decided (expired,
//      replaced);
//   3. the note or reason, as a quote;
//   4. a next step, only when something failed or nothing ran;
//   5. a divider, under which the caller draws the draft read-only.
//
// An alert names nobody: Slack's docs say nothing of a mention inside one,
// so the people go on the rich text line, where they render as pills.
//
// Pure: no Env, no Slack client. It decides words and blocks only.

import { decidedLine } from "./decision-cards";
import { richElements } from "./rich-text";
import type { ReportEntry, ReportKind } from "../thread-state/index";

/** An outcome's alert level. */
export type OutcomeLevel = "success" | "info" | "warning" | "error";

/** What a decided card's pop-up says above its draft. */
export interface DecisionOutcome {
  level: OutcomeLevel;
  /** The outcome, then what it changed. Plain text, naming nobody. */
  alert: string;
  /** Who decided what, mrkdwn with `<@U…>` mentions: "Approved by <@U1>".
   *  Absent when nobody decided. */
  byline?: string;
  /** When it was decided, epoch ms. Absent on a card decided before the
   *  time was kept: the byline then names no time. */
  at?: number;
  /** The note or reason the decision came with, as typed. */
  quote?: string;
  /** What to do next, only for an outcome that failed or ran nothing. */
  next?: string;
}

/** What each report's pop-up is titled: the report, not "Review proposal".
 *  At most Slack's 24 characters. */
export const REPORT_TITLES: Record<ReportKind, string> = {
  "ds-precedence": "DS precedence",
  "roadmap-check-in": "Roadmap check-in",
  "figma-tidy-up": "Figma tidy-up",
  "figma-drift": "Figma drift",
  "doc-fix": "Doc fix",
  "dev-mode-links": "Dev Mode links",
  "figma-comment": "Figma comment",
  "blueprint-upkeep": "Blueprint upkeep",
};

/** Slack's cap on a view title. */
export const VIEW_TITLE_CHARS = 24;

/** Slack's cap on an alert's text. */
const ALERT_CHARS = 200;
/** Slack's cap on a text element. */
const RICH_TEXT_CHARS = 3000;

/** When a card was decided, as its byline says it, in ET: "Oct 19 at 9:13 AM". */
export function decidedWhen(at: number): string {
  const part = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", ...opts }).format(new Date(at));
  return `${part({ month: "short", day: "numeric" })} at ${part({ hour: "numeric", minute: "2-digit" })}`;
}

/** Words as a sentence: trimmed, opened on a capital, closed on a stop. */
export function asSentence(words: string): string {
  const t = words.trim();
  if (!t) return "";
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

/** An answer's past tense as an alert says it: no one named. "Assigned to
 *  <@U1>" is "Assigned". */
function unnamed(label: string): string {
  return label.replace(/\s*(?:to\s+)?<@[A-Z0-9]+>/g, "").trim();
}

/** The outcome, then what it changed, as one alert. */
function alertOf(outcome: string, changed: string | undefined): string {
  const said = changed ? asSentence(changed) : "";
  return [asSentence(outcome), said].filter(Boolean).join(" ");
}

/** What an expired card's pop-up says. */
export const EXPIRED_OUTCOME = "Expired. Nothing was written.";

/** What a failed write's pop-up says to do next. */
export const ASK_AGAIN = "Ask again in the thread for a fresh card.";

/**
 * What an item of a report says at the top of its pop-up, from where its
 * record says it stands. Null for an item still open or never staged: it
 * has no decision to show.
 *
 * @param entry - The item's entry on its report's record
 */
export function reportOutcome(entry: ReportEntry): DecisionOutcome | null {
  const { item, state } = entry;
  const byline = decidedLine(state) ?? undefined;
  const at = "at" in state && typeof state.at === "number" ? { at: state.at } : {};
  switch (state.kind) {
    case "approved":
      return {
        level: "success",
        alert: alertOf(state.as ? unnamed(state.as.label) : "Approved", state.done ?? state.as?.decided ?? item.done),
        byline: byline!,
        ...at,
      };
    case "failed":
      return { level: "error", alert: alertOf("Not written", state.reason), byline: byline!, ...at, next: ASK_AGAIN };
    case "rejected":
      return {
        level: "info",
        alert: alertOf(state.as ? unnamed(state.as.label) : "Rejected", state.as?.decided ?? "Nothing was written"),
        byline: byline!,
        ...at,
        ...(state.reason?.trim() ? { quote: state.reason.trim() } : {}),
      };
    case "noted":
      return { level: "info", alert: "Noted. Added to the intake as disputed.", byline: byline!, ...at, quote: state.note };
    case "changes-asked":
      return { level: "info", alert: "Changes asked. A revised card posts in this thread.", byline: byline!, ...at };
    case "expired":
      return { level: "warning", alert: EXPIRED_OUTCOME };
    case "open":
    case "not-staged":
      return null;
  }
}

/**
 * The head's blocks: the alert, the byline, the quote, the next step, then a
 * divider for the draft to follow.
 *
 * @param outcome - What the pop-up says (`reportOutcome`, `cardOutcomeHead`)
 */
export function outcomeHead(outcome: DecisionOutcome): unknown[] {
  const blocks: unknown[] = [{ type: "alert", level: outcome.level, text: { type: "plain_text", text: clip(outcome.alert, ALERT_CHARS) } }];
  const quote = outcome.quote?.trim();
  if (outcome.byline) {
    const when = outcome.at !== undefined ? ` on ${decidedWhen(outcome.at)}` : "";
    const elements = [...richElements(outcome.byline), { type: "text", text: `${when}${quote ? ":" : "."}` }];
    blocks.push({ type: "rich_text", elements: [{ type: "rich_text_section", elements: merged(elements) }] });
  }
  if (quote) {
    blocks.push({ type: "rich_text", elements: [{ type: "rich_text_quote", elements: [{ type: "text", text: clip(quote, RICH_TEXT_CHARS) }] }] });
  }
  if (outcome.next) blocks.push({ type: "section", text: { type: "mrkdwn", text: outcome.next } });
  blocks.push({ type: "divider" });
  return blocks;
}

/** Adjacent text elements as one, so a sentence is not cut in pieces. */
function merged(elements: readonly unknown[]): unknown[] {
  const out: Array<Record<string, unknown>> = [];
  for (const e of elements as Array<Record<string, unknown>>) {
    const last = out.at(-1);
    if (last?.type === "text" && e.type === "text" && !last.style && !e.style) last.text = `${String(last.text)}${String(e.text)}`;
    else out.push({ ...e });
  }
  return out;
}

/** Text cut to `max`, its last character an ellipsis when cut. */
function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
