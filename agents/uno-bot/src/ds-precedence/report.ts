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
// Items keep the number they were posted with, so `dispute 2` means the same
// item on every revision of the card.
//
// Pure: no `Env`, no fetch.

import type { ProposalOperation } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
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
 * The item numbers a reply disputes: `dispute 2`, `dispute #2, 4`,
 * `dispute 1 and 3`. Nothing looser — a reply that only mentions a number is
 * a conversation, and goes to the agent.
 *
 * @param text - The reply
 */
export function disputedItems(text: string): number[] {
  const m = /\bdispute\s+((?:#?\d+)(?:\s*(?:,|and|&)\s*#?\d+)*)/i.exec(text);
  if (!m) return [];
  return [...new Set(m[1]!.match(/\d+/g)!.map(Number))].sort((a, b) => a - b);
}

/**
 * The list the weekly thread opens with, in Slack mrkdwn.
 *
 * @param items - This week's disagreements
 * @param weekOf - The check's date, `YYYY-MM-DD`
 */
export function threadText(items: readonly NumberedItem[], weekOf: string): string {
  const lines = [
    `:scales: *Weekly DS precedence check* (${weekOf}) — ${items.length} disagreement${items.length === 1 ? "" : "s"} between code and the ${SOURCE_NAMES.library}, and nobody published.`,
    `The DS precedence rule decides each one (${RULE}); the losing side is named, and gets the intake.`,
    "",
  ];
  for (const i of items) {
    lines.push(
      `*${i.n}.* ${escapeSlackText(i.summary)} · <${i.codeUrl}|code> · <${i.figmaUrl}|Figma> · loses: *${SOURCE_NAMES[i.loser]}*`,
    );
  }
  lines.push(
    "",
    `Reply \`dispute ${items[Math.min(1, items.length - 1)]!.n}\` (or several, \`dispute 1, 3\`) to drop an item; the card below is revised without it.`,
  );
  return lines.join("\n");
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
 * The card as data.
 *
 * @param items - The items the card files
 * @param disputed - Item numbers dropped by a reply
 * @param target - Where the ✅ writes
 * @param operations - Its batch
 * @param ttlHours - How long it stays live, as the card states it
 */
export function precedenceCard(
  items: readonly NumberedItem[],
  disputed: readonly number[],
  target: IntakeTarget,
  operations: ProposalOperation[],
  ttlHours: number,
): ProposalCard {
  const where =
    target.kind === "update"
      ? `adds this week's list to the open intake <${target.url}|#${target.issue}>`
      : "files one `harness-intake` issue";
  return {
    kind: "confirm",
    verb: target.kind === "update" ? "update the weekly intake" : "file the weekly intake",
    lead:
      `${disputed.length ? "*Revised:* " : ""}:white_check_mark: ${where} with item${items.length === 1 ? "" : "s"} ` +
      `${items.map((i) => i.n).join(", ")}` +
      (disputed.length ? ` — disputed and dropped: ${disputed.join(", ")}` : "") +
      `. :no_entry: files nothing. Any #plus-universal member can decide, for ${Math.round(ttlHours)} hours.`,
    fields: target.kind === "update" ? [{ label: "intake", value: `#${target.issue}` }] : [{ label: "intake", value: PRECEDENCE_INTAKE_TITLE }],
    caveats: [],
    operations,
  };
}
