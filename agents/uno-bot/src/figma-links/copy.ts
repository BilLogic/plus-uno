// The Dev Mode links' words: the parent line, the one Review card a run posts,
// what the gate says, the replies a batch write leaves in its thread, and the
// one comment Approve leaves in Figma the first time a component gets its
// links. Figma messages (docs/connectors/slack.md § Figma messages):
// "component", never "component set" or "node".
//
// PURE.

import type { ReportItem, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { namesInWords, windowInWords } from "../slack/copy-words";
import type { ToolName } from "../agent/tool-table";
import { isOwnComment, labelled, withoutLabel } from "../figma-ask/trigger";
import type { DevLink } from "./links";

/** The tool a card names: Approve runs it. */
export const DEV_LINKS_TOOL: ToolName = "figma_dev_links";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One card's write: the links, and the components whose first links they are. */
export interface DevLinksWrite {
  /** Every link the card leaves on Figma: the ones it adds, and the ones it renames to. */
  links: DevLink[];
  /** Each gets one comment, on its first library component. */
  introduce: Array<{ file_key: string; node_id: string; component: string }>;
  /** How many of `links` are renames of a link already there. Words only: Approve plans again. */
  renames?: number;
}

/** One component on a batch card: what its links add, and whether its Code link is renamed. */
export interface DevLinksBatchEntry {
  component: string;
  adds: Array<{ name: string; url: string }>;
  renamed: boolean;
}

/** What a card is for: one component's links, or several on one card. */
export type DevLinksSubject =
  | { kind: "component"; component: string; figmaUrl: string; storybook: string | null }
  | { kind: "batch"; figmaUrl: string; components: DevLinksBatchEntry[] };

/** A card's id: Slack-safe, unique in its report. */
export function devLinksItemId(subject: DevLinksSubject): string {
  if (subject.kind === "batch") return "links-batch";
  return `links-${subject.component.replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

/** How many of the component's library components the write touches. */
const touched = (write: DevLinksWrite) => new Set(write.links.map((l) => `${l.file_key}|${l.node_id}`)).size;

/** What a write changes, in words: "adds 2 links in Dev Mode to 2 library components". */
function changeWords(write: DevLinksWrite): string {
  const renames = write.renames ?? 0;
  const adds = write.links.length - renames;
  const where = plural(touched(write), "library component", "library components");
  if (!renames) return `adds ${plural(adds, "link", "links")} in Dev Mode to ${where}`;
  if (!adds) return `renames ${plural(renames, "link", "links")} in Dev Mode on ${where}`;
  return `adds ${plural(adds, "link", "links")} and renames ${renames} in Dev Mode on ${where}`;
}

const capital = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}`;

/** What a card says it does, plain. */
export function devLinksBody(subject: DevLinksSubject, write: DevLinksWrite): string {
  const comment = !write.introduce.length
    ? ""
    : subject.kind === "batch"
      ? ", and one comment on each new component's first saying what they are"
      : ", and one comment on the first saying what they are";
  return `${capital(changeWords(write))}${comment}.`;
}

/** One write as its card. */
export function devLinksItem(subject: DevLinksSubject, write: DevLinksWrite): ReportItem {
  if (subject.kind === "batch") {
    return {
      id: devLinksItemId(subject),
      title: plural(subject.components.length, "component", "components"),
      subtitle: "Dev Mode links · Code (plus-uno) and Storybook",
      body: devLinksBody(subject, write),
      open: { label: "Open in Figma", url: subject.figmaUrl },
      done: "Links going into Dev Mode.",
    };
  }
  return {
    id: devLinksItemId(subject),
    title: subject.component,
    subtitle: "Dev Mode links · Code (plus-uno) and Storybook",
    body: devLinksBody(subject, write),
    open: { label: "Open in Figma", url: subject.figmaUrl },
    ...(subject.storybook ? { also: { label: "Storybook", url: subject.storybook } } : {}),
    done: "Links added in Dev Mode.",
  };
}

/** A link's label on a batch card: its name without the component. */
const labelOf = (name: string) => name.slice(0, name.indexOf(": "));

/** One component's line on a batch card. */
function batchLine(entry: DevLinksBatchEntry): string {
  const parts = entry.adds.map((l) => `<${l.url}|${escapeSlackText(labelOf(l.name))}>`);
  if (entry.renamed) parts.push("renames its Code link to Code (plus-uno)");
  return `• *${escapeSlackText(entry.component)}* · ${parts.join(" · ")}`;
}

/** What Review shows: every link, where it goes, and what Approve does. */
export function devLinksCard(subject: DevLinksSubject, write: DevLinksWrite): ProposalCard {
  const comment = !write.introduce.length
    ? ""
    : subject.kind === "batch"
      ? ", and leaves one comment on each new component's first library component saying what they are"
      : ` and leaves one comment on ${namesInWords(write.introduce.map((i) => i.component))}'s first saying what they are`;
  let lines: string[];
  if (subject.kind === "batch") {
    lines = [
      `*${plural(subject.components.length, "component", "components")}* · <${subject.figmaUrl}|open in Figma>`,
      ...subject.components.map(batchLine),
      `Approving ${changeWords(write)}${comment}. A link already there is not added twice. A batch this size writes in steps; a reply in this thread says when the last link is in. Reject adds nothing.`,
    ];
  } else {
    const distinct = [...new Map(write.links.map((l) => [l.name, l.url])).entries()];
    lines = [
      `*${escapeSlackText(subject.component)}* · <${subject.figmaUrl}|open in Figma>`,
      ...distinct.map(([name, url]) => `• <${url}|${escapeSlackText(name)}>`),
      `Approving ${changeWords(write)}${comment}. A link already there is not added twice. Reject adds nothing.`,
    ];
  }
  return {
    kind: "stated",
    verb: "add these Dev Mode links",
    lead: lines.join("\n"),
    footer: "",
    fields: [],
    caveats: [],
    operations: [{ toolName: DEV_LINKS_TOOL, input: { links: write.links, introduce: write.introduce } }],
  };
}

/** What the gate says on a Dev Mode links card in place of its generic lines. */
export function devLinksCardWords(windowHours: number): StatedCardWords {
  return {
    cancelled: "Nothing added",
    expired: `That card closed after ${windowInWords(windowHours)} with no decision, so no links were added.`,
  };
}

/** What a turn says when it would change a Dev Mode links card. */
export const DEV_LINKS_REVISION_REFUSAL = "A Dev Mode links card is decided as it stands in its Review: Approve adds the links, Reject adds none.";

/** A card that showed and did not stage says this in its place. */
export const DEV_LINKS_NOT_STAGED = "Didn't go through. Run it again to post a fresh card.";

/** The parent line, above the run's one card. */
export function devLinksParent(subject: DevLinksSubject): string {
  if (subject.kind === "batch") return `Dev Mode links for ${plural(subject.components.length, "component", "components")} are ready for Review, on one card.`;
  return `Dev Mode links for ${subject.component} are ready for Review.`;
}

/** Approve's account when the write carries on past this press. */
export function devLinksCarryOn(added: number, renamed: number): string {
  const done = renamed ? `Added ${plural(added, "link", "links")} and renamed ${renamed} so far` : `Added ${plural(added, "link", "links")} so far`;
  return `${done}; the rest carry on in the background, and a reply in this thread says when the last link is in.`;
}

/** Said when the rest of a batch could not be handed on. */
export function devLinksNotCarried(reason: string): string {
  return `Some links went in, but the rest did not start: ${reason}. Run it again to post a fresh card for what is missing.`;
}

/** The reply once the last of a batch is in. */
export function devLinksFinished(total: { links: number; components: number; comments: number }, problem?: string): string {
  const comments = total.comments ? `, with ${plural(total.comments, "comment", "comments")}` : "";
  const lead = `The rest of the Dev Mode links are in: ${plural(total.links, "link", "links")} on ${plural(total.components, "component", "components")}${comments}.`;
  return problem ? `${lead} Not everything landed: ${problem}.` : lead;
}

/** The reply when a batch is still unfinished a day after Approve. */
export function devLinksGaveUp(): string {
  return "The Dev Mode links stopped after a day without finishing. Run it again to post a fresh card for what is missing.";
}

/** The reply when the rest of a batch failed for a reason a retry would meet again. */
export function devLinksStopped(reason: string): string {
  return `The Dev Mode links stopped before the last one: ${reason}. Run it again to post a fresh card for what is missing.`;
}

/** Why a write stopped: a component's comment is already on Figma more than once. */
export function devLinksDoubled(components: readonly string[]): string {
  return `the comment on ${namesInWords(components)} is already on Figma twice, so no more will post`;
}

/** Why a write stopped: it came back this many times and landed nothing. */
export function devLinksIdle(steps: number): string {
  return `${steps} tries in a row added nothing`;
}

/**
 * The comment Approve leaves on a component's first library component, the
 * first time it gets its links. Plain text: Figma shows a comment as typed.
 */
export function devLinksComment(component: string): string {
  return labelled([
    `Added Dev Mode links to ${component}: Code (plus-uno) opens its source on GitHub, and Storybook opens its docs page. They're under Dev resources in Dev Mode.`,
  ]);
}

/** Whether a comment is the one Approve leaves for this component, in any wording it has had, as posted or as Figma reads it back. */
export function isDevLinksComment(message: string, component: string): boolean {
  return isOwnComment(message) && withoutLabel(message).startsWith(`Added Dev Mode links to ${component}:`);
}
