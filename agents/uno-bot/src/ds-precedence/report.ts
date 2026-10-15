// The weekly DS precedence check, drafted: the report the morning posts in
// #plus-universal on the shared decision card (`slack/decision-cards.ts`),
// each card's proposal, and the week's one `harness-intake` issue.
//
// ONE CARD PER COMPONENT. The parent line says how many components disagree
// and that code wins; each card names the component, the side that needs the
// fix, and what differs, with Review, Code and Figma. Nothing on the card or
// in the proposal says what to type or react: Review is the gate. Approve
// adds the component to the week's intake; Needs changes disputes it, its
// note written on the intake (`./dispute.ts`); Reject means the difference is
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

import type { PrecedenceFacts, ProposalOperation, ReportItem, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import type { Addressee } from "../destination/index";
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

/** A card's id: the component's name, with only Slack-safe characters, kept
 *  apart from the other cards on the sweep's morning message by its prefix. */
export function componentId(component: string): string {
  return `ds-${component.replace(/[^A-Za-z0-9_-]+/g, "-") || "component"}`;
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
export function precedenceParent(components: number, ruleUrl: string, addressee: Addressee | null = null): string {
  const what = components === 1 ? "1 component" : `${components} components`;
  const line = `ode and the library disagree on ${what}. <${ruleUrl}|Code wins> unless a difference is deliberate.`;
  if (!addressee) return `C${line}`;
  return `${"slack" in addressee ? `<@${addressee.slack}>` : escapeSlackText(addressee.figma)}, c${line}`;
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
 * What a dispute adds to the week's intake: the component, who disputed it,
 * and their note.
 *
 * @param component - The component
 * @param name - Who disputed it, by display name
 * @param note - Why, in their words
 */
export function disputeSection(component: string, name: string, note: string): string {
  return `**${component}**: disputed by ${name} — ${note.trim()}`;
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
    `uno-bot's weekly check compares the component index and each component's props (\`component-registry.json\`) with the published ${SOURCE_NAMES.library}. ` +
      `Where they disagree, the DS precedence rule decides — ${RULE} — and the losing artifact is listed here. Existence and variant axes only; token values are out of scope.`,
    "",
    `Each component below was approved in #plus-universal, or disputed there with a note. One rejected there was left as deliberate, and is not listed.`,
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
      `Approving adds it to the DS precedence intake for the week of ${shortDate(weekOf)}, filing the intake if this is the week's first. Needs changes puts your note on the intake instead, for a library that is right or a difference that is deliberate.`,
    ].join("\n"),
    footer: "",
    fields: [],
    caveats: [],
    operations: [precedenceOperation(finding, weekOf)],
  };
}

/** The side that needs the fix, as the finding says it. */
const FIXES: Record<DsSource, string> = { code: "code needs the fix", library: "the library needs the fix", "spec-pages": "the spec pages need the fix" };

/**
 * One component as Review draws it (`PendingProposal.facts`): the finding,
 * what differs with each prop in backticks, both sources, and the week.
 *
 * @param finding - The component
 * @param weekOf - The check's date
 */
export function precedenceFacts(finding: ComponentFinding, weekOf: string): PrecedenceFacts {
  const first = finding.items[0]!;
  return {
    kind: "ds_precedence_intake",
    finding: `${finding.component}: ${FIXES[first.loser]}`,
    week: shortDate(weekOf),
    differences: finding.items.map((i) => `${i.summary.charAt(0).toUpperCase()}${i.summary.slice(1)}`),
    codeUrl: first.codeUrl,
    figmaUrl: first.figmaUrl,
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

/** What Review's pop-up says once a weekly card's Needs changes is taken. */
export const PRECEDENCE_NOTE_TAKEN = "Your note goes on this week's intake.";

/** What a turn says when it would change a weekly card. */
export const PRECEDENCE_REVISION_REFUSAL =
  "A DS precedence card is decided as it stands: press Review on it. Approve adds the component to this week's intake, Needs changes puts your note on the intake, and Reject leaves the difference as deliberate.";
