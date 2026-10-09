// The weekly DS precedence check, drafted: the report the morning posts in
// #plus-universal on the shared decision card (`slack/decision-cards.ts`),
// each card's proposal, and the week's one `harness-intake` issue.
//
// ONE CARD PER COMPONENT. The parent line says how many components disagree
// and that code wins; each card names the component, the side that needs the
// fix, and what differs, with Review, Code and Figma. Nothing on the card or
// in the proposal says what to type or react: Review is the gate. Approve
// adds the component to the week's intake; Reject means the difference is
// deliberate, and nothing is written.
//
// ONE INTAKE A WEEK. Every card's operation is the same Worker tool,
// `ds_precedence_intake` (`./intake.ts`), and it decides where the component
// goes when it runs, not when the card posts: the first Approve of the week
// files the intake, whose body opens with that week's marker
// (`precedenceMarker`), and every later Approve finds it open and comments the
// component on it.
//
// Pure: no `Env`, no fetch.

import type { ProposalOperation, ReportItem, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { shortDate, windowInWords } from "../slack/copy-words";
import { SOURCE_NAMES, type Disagreement, type DsSource } from "./compare";

/** The Worker tool every card runs (`./intake.ts`). */
export const PRECEDENCE_INTAKE_TOOL = "ds_precedence_intake";

/** What every week's intake body opens with, before its week. */
export const PRECEDENCE_MARKER = "<!-- uno-bot:ds-precedence";

/**
 * The hidden line one week's intake body opens with, which a later Approve
 * that week finds it by.
 *
 * @param weekOf - The check's date, `YYYY-MM-DD`
 */
export function precedenceMarker(weekOf: string): string {
  return `${PRECEDENCE_MARKER} week=${weekOf} -->`;
}

/** The week's intake title. */
export function precedenceIntakeTitle(weekOf: string): string {
  return `DS precedence, week of ${shortDate(weekOf)}: code and the library disagree`;
}

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

/** One component and everything that differs about it, in check order. */
export interface ComponentFinding {
  component: string;
  items: Disagreement[];
}

/** The disagreements grouped by component, in the order the check found them. */
export function byComponent(items: readonly Disagreement[]): ComponentFinding[] {
  const out: ComponentFinding[] = [];
  for (const item of items) {
    const found = out.find((c) => c.component === item.component);
    if (found) found.items.push(item);
    else out.push({ component: item.component, items: [item] });
  }
  return out;
}

/** A card's id: the component's name, with only Slack-safe characters. */
export function componentId(component: string): string {
  return component.replace(/[^A-Za-z0-9_-]+/g, "-") || "component";
}

/** The side that needs the fix, as a card's subtitle names it. */
const SIDE: Record<DsSource, string> = { code: "Code side", library: "Library side", "spec-pages": "Spec pages side" };

/** What differs, plain: no backticks, a capital first, a full stop last. */
function differs(finding: ComponentFinding): string {
  const text = finding.items.map((i) => i.summary.replace(/`/g, "")).join("; ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/**
 * The report's parent line: how many components disagree, and the rule, in
 * plain words with the rule linked. mrkdwn.
 *
 * @param components - How many components disagree, held-back ones included
 * @param ruleUrl - Where the precedence rule is written (`precedenceRuleUrl`)
 */
export function precedenceParent(components: number, ruleUrl: string): string {
  const what = components === 1 ? "1 component" : `${components} components`;
  return `Code and the library disagree on ${what}. <${ruleUrl}|Code wins> unless a difference is deliberate.`;
}

/**
 * One component as its card: the component, the side that needs the fix,
 * what differs, and its code and library as the card's second and third
 * buttons.
 */
export function precedenceItem(finding: ComponentFinding): ReportItem {
  const first = finding.items[0]!;
  return {
    id: componentId(finding.component),
    title: finding.component,
    subtitle: SIDE[first.loser],
    body: differs(finding),
    open: { label: "Code", url: first.codeUrl },
    also: { label: "Figma", url: first.figmaUrl },
    done: "added to this week's DS precedence intake.",
  };
}

function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

/** The component's section of the intake: its heading and its table. */
export function intakeSection(finding: ComponentFinding): string {
  return [
    `### ${finding.component}`,
    "",
    "| Disagreement | Code | Figma | Loses |",
    "|---|---|---|---|",
    ...finding.items.map((i) => `| ${cell(i.summary)} | [code](${i.codeUrl}) | [Figma](${i.figmaUrl}) | ${SOURCE_NAMES[i.loser]} |`),
  ].join("\n");
}

/**
 * The intake the week's first Approve files: the week's marker, what the
 * check compares and the rule, then the approved component's section.
 *
 * @param weekOf - The check's date
 * @param section - The first component's section (`intakeSection`)
 */
export function intakeBody(weekOf: string, section: string): string {
  return [
    precedenceMarker(weekOf),
    "",
    "## What disagrees",
    "",
    `uno-bot's weekly check compares the component index and each component's props (\`component-registry.json\`) with the published ${SOURCE_NAMES.library}, when no library publish is carrying the component. ` +
      `Where they disagree, the DS precedence rule decides — ${RULE} — and the losing artifact is listed here. Existence and variant axes only; token values are out of scope.`,
    "",
    `Each component below was approved in #plus-universal; one rejected there was deliberate, and is not listed.`,
    "",
    section,
    "",
    "## Done when",
    "",
    "- [ ] Each losing artifact is brought in line with the winner, or the disagreement is recorded as deliberate in the component's `figmaMeta`",
  ].join("\n");
}

/**
 * A card's one operation: add its component to the week's intake, filing the
 * intake when the week has none open.
 *
 * @param finding - The component
 * @param weekOf - The check's date
 */
export function precedenceOperation(finding: ComponentFinding, weekOf: string): ProposalOperation {
  return { toolName: PRECEDENCE_INTAKE_TOOL, input: { week_of: weekOf, component: finding.component, section: intakeSection(finding) } };
}

/**
 * One component as the proposal Review shows and decides: what differs, both
 * sources, and where Approve writes. No footer: the card's Review is the
 * only instruction.
 *
 * @param finding - The component
 * @param weekOf - The check's date
 */
export function precedenceCard(finding: ComponentFinding, weekOf: string): ProposalCard {
  const first = finding.items[0]!;
  const lines = finding.items.map((i) => `• ${escapeSlackText(i.summary)}`);
  return {
    kind: "stated",
    verb: "add this to the week's intake",
    lead: [
      `*${escapeSlackText(finding.component)}* · ${SIDE[first.loser].toLowerCase()} needs the fix · <${first.codeUrl}|code> · <${first.figmaUrl}|Figma>`,
      ...lines,
      `Approving adds it to the DS precedence intake for the week of ${shortDate(weekOf)}, filing the intake if this is the week's first.`,
    ].join("\n"),
    footer: "",
    fields: [],
    caveats: [],
    operations: [precedenceOperation(finding, weekOf)],
  };
}

/**
 * What a weekly card says at the gate (`PendingProposal.stated`): a Reject
 * means the difference is deliberate, and a card that closes undecided files
 * nothing — a later week's check is what asks again.
 *
 * @param windowHours - The card's whole window
 */
export function precedenceCardWords(windowHours: number): StatedCardWords {
  return {
    cancelled: "Left as deliberate, nothing filed",
    expired: `That card closed after ${windowInWords(windowHours)} with no decision, so nothing was filed.`,
  };
}

/** What a turn says when it would change a weekly card. */
export const PRECEDENCE_REVISION_REFUSAL =
  "A DS precedence card is decided as it stands: press Review on it, and Approve adds the component to this week's intake or Reject leaves the difference as deliberate.";
