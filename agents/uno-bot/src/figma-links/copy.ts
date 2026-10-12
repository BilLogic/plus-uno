// The Dev Mode links' words: the parent line, one Review card per write, what
// the gate says, and the one comment Approve leaves in Figma the first time a
// component gets its links. Figma messages (docs/connectors/slack.md
// § Figma messages): "component", never "component set" or "node".
//
// PURE.

import type { ReportItem, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { namesInWords, windowInWords } from "../slack/copy-words";
import type { ToolName } from "../agent/tool-table";
import { FIGMA_LABEL } from "../figma-ask/trigger";
import type { DevLink } from "./links";

/** The tool a card names: Approve runs it. */
export const DEV_LINKS_TOOL: ToolName = "figma_dev_links";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One card's write: the links, and the components whose first links they are. */
export interface DevLinksWrite {
  links: DevLink[];
  /** Each gets one comment, on its first library component. */
  introduce: Array<{ file_key: string; node_id: string; component: string }>;
}

/** What a card is for: a component's Code and Storybook links, or a merged PR's. */
export type DevLinksSubject =
  | { kind: "component"; component: string; figmaUrl: string; storybook: string | null }
  | { kind: "pr"; number: number; url: string; components: string[] };

/** A card's id: Slack-safe, unique in its report. */
export function devLinksItemId(subject: DevLinksSubject): string {
  return subject.kind === "pr" ? `pr-${subject.number}` : `links-${subject.component.replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

/** How many of the component's library components the write touches. */
const touched = (write: DevLinksWrite) => new Set(write.links.map((l) => `${l.file_key}|${l.node_id}`)).size;

/** What a card says it adds, plain. */
export function devLinksBody(subject: DevLinksSubject, write: DevLinksWrite): string {
  const where = plural(touched(write), "library component", "library components");
  if (subject.kind === "pr") return `Adds the PR's link to ${namesInWords(subject.components)} in Dev Mode, on ${where}.`;
  const comment = write.introduce.length ? ", and one comment on the first saying what they are" : "";
  return `Adds ${plural(write.links.length, "link", "links")} in Dev Mode to ${where}${comment}.`;
}

/** One write as its card. */
export function devLinksItem(subject: DevLinksSubject, write: DevLinksWrite): ReportItem {
  if (subject.kind === "pr") {
    return {
      id: devLinksItemId(subject),
      title: `PR #${subject.number} merged`,
      subtitle: `Dev Mode links · ${namesInWords(subject.components)}`,
      body: devLinksBody(subject, write),
      open: { label: "Open PR", url: subject.url },
      done: "PR link added in Dev Mode.",
    };
  }
  return {
    id: devLinksItemId(subject),
    title: subject.component,
    subtitle: "Dev Mode links · Code and Storybook",
    body: devLinksBody(subject, write),
    open: { label: "Open in Figma", url: subject.figmaUrl },
    ...(subject.storybook ? { also: { label: "Storybook", url: subject.storybook } } : {}),
    done: "Links added in Dev Mode.",
  };
}

/** What Review shows: every distinct link, where it goes, and what Approve does. */
export function devLinksCard(subject: DevLinksSubject, write: DevLinksWrite): ProposalCard {
  const distinct = [...new Map(write.links.map((l) => [l.name, l.url])).entries()];
  const head =
    subject.kind === "pr"
      ? `*PR #${subject.number}* · <${subject.url}|open PR>`
      : `*${escapeSlackText(subject.component)}* · <${subject.figmaUrl}|open in Figma>`;
  const where = plural(touched(write), "library component", "library components");
  const comment = write.introduce.length ? ` and leaves one comment on ${namesInWords(write.introduce.map((i) => i.component))}'s first saying what they are` : "";
  return {
    kind: "stated",
    verb: "add these Dev Mode links",
    lead: [
      head,
      ...distinct.map(([name, url]) => `• <${url}|${escapeSlackText(name)}>`),
      `Approving adds ${plural(write.links.length, "link", "links")} in Dev Mode on ${where}${comment}. A link already there is not added twice. Reject adds nothing.`,
    ].join("\n"),
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

/**
 * The parent line: the first message's, above its cards.
 *
 * @param subjects - Every card the run posts, in order
 * @param shown - How many the first message carries
 */
export function devLinksParent(subjects: readonly DevLinksSubject[], shown: number): string {
  const first = subjects[0]!;
  if (first.kind === "pr") {
    return `PR #${first.number} merged, so its link is ready for Review on ${namesInWords(first.components)} in Dev Mode.`;
  }
  if (subjects.length === 1) return `Dev Mode links for ${first.component} are ready for Review.`;
  const rest = subjects.length > shown ? `: ${shown} here, the rest in the thread` : "";
  return `Dev Mode links for ${subjects.length} components are ready for Review${rest}.`;
}

/** A reply's line in the thread, above its cards. */
export function devLinksBatchLine(from: number, to: number, total: number): string {
  return `Components ${from}–${to} of ${total}.`;
}

/**
 * The comment Approve leaves on a component's first library component, the
 * first time it gets its links. Plain text: Figma shows a comment as typed.
 */
export function devLinksComment(component: string): string {
  return [
    FIGMA_LABEL,
    `Added Dev Mode links to ${component}: Code opens its source on GitHub, and Storybook opens its docs page. They're under Dev resources in Dev Mode.`,
  ].join("\n");
}
