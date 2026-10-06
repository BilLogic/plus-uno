// The weekly DS precedence check, drafted: the list the #plus-universal
// thread opens with, the one `harness-intake` issue it files or updates, and
// the card that does it.
//
// ONE INTAKE, EVER OPEN. The issue's body opens with `PRECEDENCE_MARKER`; the
// morning post looks for an open `harness-intake` carrying it, and when there
// is one the card comments this week's list on it (`github_issue_update`)
// rather than filing a second. The comment is the update in place: the tool
// can comment, relabel and close, and editing a body is none of those.
//
// Items keep the number they were posted with, so `drop 2` means the same
// item on every revision of the card.
//
// THE WORDS are #886 § 3.4's (approved 2026-09-30): the list leads with the
// finding, the rule is one clause and a link, and the reply verb is `drop` —
// the sweep's verb — where it used to be `dispute`. The list ends with that
// instruction; the card in its thread carries the one ✅/⛔ footer, beside its
// buttons. `docs/connectors/slack.md` § Figma messages holds the rules, and
// tests/figma-copy.test.ts pins them.
//
// Pure: no `Env`, no fetch.

import type { ProposalOperation, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { largestFitting, namesInWords, ONE_POST_CHARS, packLines, shortDate, windowInWords } from "../slack/copy-words";
import { SOURCE_NAMES, type Disagreement } from "./compare";

/** The hidden line the weekly intake's body opens with. */
export const PRECEDENCE_MARKER = "<!-- uno-bot:ds-precedence -->";
export const PRECEDENCE_INTAKE_TITLE = "Weekly DS precedence check: code and the Figma library disagree";

/** A disagreement with the number the thread gave it. */
export type NumberedItem = Disagreement & { n: number };

/** Where the card's ✅ writes: a new intake, or the one already open. */
export type IntakeTarget = { kind: "create" } | { kind: "update"; issue: number; url: string };

const RULE = `${SOURCE_NAMES.code} > ${SOURCE_NAMES.library} > ${SOURCE_NAMES["spec-pages"]}`;

/**
 * Where the precedence rule is written: AGENTS.md § Conventions on the
 * harness repo's main branch.
 *
 * @param repo - `owner/name`
 */
export function precedenceRuleUrl(repo: string): string {
  return `https://github.com/${repo}/blob/main/AGENTS.md#conventions--what-agents-obey`;
}

/**
 * The item numbers a reply drops. Only a reply that STARTS with `drop` and a
 * number counts — `drop 2`, `drop #2, 4`, `drop 1 and 3`, then anything —
 * after any leading @mentions. "I wouldn't drop 2" and "should we drop 3?" are
 * a conversation, and go to the agent. `dispute`, the verb a thread posted
 * before #886 asks for, still works the same way.
 *
 * @param text - The reply
 */
export function droppedItems(text: string): number[] {
  const m = /^\s*(?:<@[A-Z0-9]+>[\s,:]*)*(?:drop|dispute)\s+((?:#?\d+)(?:\s*(?:,|and|&)\s*#?\d+)*)(?![\w.]*\?)(?!\w)/i.exec(text);
  if (!m) return [];
  return [...new Set(m[1]!.match(/\d+/g)!.map(Number))].sort((a, b) => a - b);
}

/** "item 2", "items 2 and 4", "items 1, 2 and 3". */
function itemWords(ns: readonly number[]): string {
  return `item${ns.length === 1 ? "" : "s"} ${namesInWords(ns.map(String))}`;
}

function itemLine(i: NumberedItem): string {
  return `${i.n}. ${escapeSlackText(i.component)}: ${escapeSlackText(i.summary)} · <${i.codeUrl}|code> · <${i.figmaUrl}|Figma>`;
}

/** The list post, and the items that would not fit in it. */
export interface PrecedenceList {
  text: string;
  /** Replies for the thread, before the card: the items past the cut, with
   *  the numbers they were given. */
  overflow: string[];
}

/**
 * The list the weekly thread opens with (#886 § 3.4), in Slack mrkdwn. It
 * leads with the finding; N counts the components named in the items, so the
 * count is the names. The library is always the side that loses in this
 * check (`findDisagreements`), which is what the rule clause says.
 *
 * @param items - This week's disagreements
 * @param weekOf - The check's date, `YYYY-MM-DD`
 * @param ruleUrl - Where the precedence rule is written (`precedenceRuleUrl`)
 */
export function precedenceList(items: readonly NumberedItem[], weekOf: string, ruleUrl: string): PrecedenceList {
  const components = new Set(items.map((i) => i.component)).size;
  const head = [
    `*Code and the library disagree on ${components} component${components === 1 ? "" : "s"}* (week of ${shortDate(weekOf)})`,
    `Code wins by our <${ruleUrl}|precedence rule>, so the library side needs the fix unless it's deliberate.`,
    "",
  ];
  const tail = ["", `Reply \`drop ${items[Math.min(1, items.length - 1)]!.n}\` for any that's deliberate, and I'll revise the card.`];
  const lines = items.map(itemLine);
  const whole = [...head, ...lines, ...tail].join("\n");
  if (whole.length <= ONE_POST_CHARS || lines.length < 2) return { text: whole, overflow: [] };

  // Too long for one post: as many items as fit, the rest counted here and
  // listed in the thread under their own numbers.
  const cut = (k: number) => [...head, ...lines.slice(0, k), `and ${lines.length - k} more, listed in the thread.`, ...tail].join("\n");
  const shown = largestFitting(1, lines.length - 1, (k) => cut(k).length <= ONE_POST_CHARS);
  return { text: cut(shown), overflow: packLines(lines.slice(shown)) };
}

function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

function table(items: readonly NumberedItem[]): string[] {
  return [
    "| # | Component | Disagreement | Code | Figma | Loses |",
    "|---|---|---|---|---|---|",
    ...items.map(
      (i) =>
        `| ${i.n} | ${cell(i.component)} | ${cell(i.summary)} | [code](${i.codeUrl}) | [Figma](${i.figmaUrl}) | ${SOURCE_NAMES[i.loser]} |`,
    ),
  ];
}

/** The intake a first week files. */
export function intakeBody(items: readonly NumberedItem[], weekOf: string): string {
  return [
    PRECEDENCE_MARKER,
    "",
    "## What disagrees",
    "",
    `uno-bot's weekly check compares the component index and each component's props (\`component-registry.json\`) with the published ${SOURCE_NAMES.library}, when no library publish is carrying the component. ` +
      `Where they disagree, the DS precedence rule decides — ${RULE} — and the losing artifact is listed here. Existence and variant axes only; token values are out of scope.`,
    "",
    `### Week of ${weekOf}`,
    "",
    ...table(items),
    "",
    "## Done when",
    "",
    "- [ ] Each losing artifact is brought in line with the winner, or the disagreement is recorded as deliberate in the component's `figmaMeta`",
    "",
    "The next week that finds disagreements comments its list here while this issue is open.",
  ].join("\n");
}

/** The comment a later week adds to the open intake. */
export function intakeComment(items: readonly NumberedItem[], weekOf: string): string {
  return [`### Week of ${weekOf}`, "", ...table(items)].join("\n");
}

/**
 * The card's batch: file the intake, or comment on the one already open.
 *
 * @param items - The items not disputed
 * @param target - Where the ✅ writes
 * @param weekOf - The check's date
 */
export function precedenceOperations(
  items: readonly NumberedItem[],
  target: IntakeTarget,
  weekOf: string,
): ProposalOperation[] {
  if (target.kind === "update") {
    return [{ toolName: "github_issue_update", input: { issue_number: target.issue, comment: intakeComment(items, weekOf) } }];
  }
  return [{ toolName: "github_issue_create", input: { title: PRECEDENCE_INTAKE_TITLE, body: intakeBody(items, weekOf) } }];
}

/**
 * The card as data: a `stated` card whose one footer says what ✅ and ⛔ do
 * and names the items, so its single operation is in words. A revision leads
 * with what it left out.
 *
 * @param items - The items the card files
 * @param dropped - Item numbers dropped by a reply
 * @param target - Where the ✅ writes
 * @param operations - Its batch
 * @param ttlHours - How long it stays live, as the card states it
 */
export function precedenceCard(
  items: readonly NumberedItem[],
  dropped: readonly number[],
  target: IntakeTarget,
  operations: ProposalOperation[],
  ttlHours: number,
): ProposalCard {
  const which = itemWords(items.map((i) => i.n));
  const approve =
    target.kind === "update"
      ? `:white_check_mark: adds ${which} to the <${target.url}|weekly intake>.`
      : `:white_check_mark: files ${which} as the weekly intake.`;
  return {
    kind: "stated",
    verb: target.kind === "update" ? "update the weekly intake" : "file the weekly intake",
    ...(dropped.length ? { lead: `Revised without ${itemWords(dropped)}.` } : {}),
    footer: `${approve} :no_entry: files nothing.\nAnyone in this channel can decide, for the next ${windowInWords(ttlHours)}.`,
    fields: target.kind === "update" ? [{ label: "intake", value: `#${target.issue}` }] : [{ label: "intake", value: PRECEDENCE_INTAKE_TITLE }],
    caveats: [],
    operations,
  };
}

/**
 * What the weekly card says at the gate (`PendingProposal.stated`). A ⛔ files
 * nothing, as the footer says; and a late ✅ or ⛔ is told the card closed,
 * rather than "ask me again" — a later week's check is what asks again.
 *
 * @param windowHours - The card's whole window, from the first post
 */
export function precedenceCardWords(windowHours: number): StatedCardWords {
  return {
    cancelled: "Nothing filed this week",
    expired: `That card closed after ${windowInWords(windowHours)} with no decision, so nothing was filed.`,
  };
}
