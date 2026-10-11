// The weekly Figma tidy-up's words (#886 § 3.6): the parent line, each
// owner's reply, one Review card per finding, and the all-clear post.
//
// Bill's ruling (2026-10-11): one shared decision card per finding, whose
// Review pop-up offers "Moved it" and "Leave as is". No API moves or renames a
// Figma file, so neither answer writes anything: a person moves the file, and
// the card records who answered and how.
//
// PURE.

import type { ReportItem, ReviewChoice, StatedCardWords } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { shortDate, windowInWords } from "../slack/copy-words";
import type { TidyFinding } from "./checks";

/** A reply's cards at most; the rest wait for next week's. */
export const MAX_ITEMS_PER_OWNER = 5;

/** The tool a card names. Neither answer runs it: both decide as a cancel. */
export const TIDY_TOOL = "figma_tidy_up";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The parent line, top level in the channel.
 *
 * @param runDate - The Monday, `YYYY-MM-DD`
 * @param fresh - New items found this week
 * @param stillOpen - Items shown in earlier weeks and still to tidy
 */
export function tidyParent(runDate: string, fresh: number, stillOpen: number): string {
  const open = stillOpen ? `, and ${stillOpen} still open from earlier weeks` : "";
  return `Figma tidy-up for the week of ${shortDate(runDate)}: ${plural(fresh, "new item", "new items")}${open}.`;
}

/**
 * One owner's reply: the owner mentioned once, and how many wait past the five shown.
 *
 * @param owner - A Slack id, or null for the unassigned reply
 * @param total - Their items this week
 * @param shown - How many the reply carries
 */
export function ownerLine(owner: string | null, total: number, shown: number): string {
  const more = total > shown ? `: here are ${shown}, and ${total - shown} more next week` : "";
  if (!owner) {
    const files = plural(total, "file has", "files have");
    return `${files} no owner I could find${more}.`;
  }
  const files = total === 1 ? "1 of your files needs" : `${total} of your files need`;
  return `<@${owner}>, ${files} a tidy${more}.`;
}

/** Where a finding says to move the file: the team's folder, by its own name. */
function destination(finding: TidyFinding): string {
  const to = finding.moveTo!;
  return `${finding.file.team} › ${to.folder?.name ?? to.stage}`;
}

/** A card's stage, in its own words. */
function stageWords(finding: TidyFinding): string {
  const c = finding.known!;
  return /^deployed$/i.test(c.devStatus?.trim() ?? "") ? "deployed" : (c.designStatus ?? "");
}

/** What a finding says, plain. */
export function findingBody(finding: TidyFinding, likely: { number: number; title: string } | null): string {
  switch (finding.check) {
    case "wrong-folder":
      return `In ${finding.folder.name}, but Card ${finding.card} is ${stageWords(finding)}. Move it to ${destination(finding)}.`;
    case "no-active-card":
      return `Not on an active card, and not in ${finding.moveTo!.folder?.name ?? "Archive"}. Move it to ${destination(finding)}.`;
    case "unknown-card":
      return likely
        ? `Card ${finding.card} isn't on the Roadmap. Likely Card ${likely.number}, "${likely.title}".`
        : `Card ${finding.card} isn't on the Roadmap, and no card's name matches the project.`;
  }
}

const SUBTITLE: Record<TidyFinding["check"], string> = {
  "wrong-folder": "Wrong folder",
  "unknown-card": "Unknown card",
  "no-active-card": "Not on an active card",
};

/** A finding's card id: Slack-safe, unique in its reply. */
export function itemId(finding: TidyFinding): string {
  return `${finding.check}-${finding.file.key.replace(/[^A-Za-z0-9_-]+/g, "-")}-${finding.card ?? 0}`;
}

export function fileUrl(fileKey: string): string {
  return `https://www.figma.com/design/${encodeURIComponent(fileKey)}`;
}

/**
 * One finding as its card: the file, the check and card, what to do, and the
 * file and its card (or the likely one) as buttons.
 */
export function tidyItem(finding: TidyFinding, likely: { number: number; title: string; url: string } | null): ReportItem {
  const card = finding.known ? { label: `Card ${finding.known.number}`, url: finding.known.url } : likely ? { label: `Card ${likely.number}`, url: likely.url } : null;
  return {
    id: itemId(finding),
    title: finding.file.name,
    subtitle: finding.card === null ? SUBTITLE[finding.check] : `${SUBTITLE[finding.check]} · Card ${finding.card}`,
    body: findingBody(finding, likely),
    open: { label: "Open file", url: fileUrl(finding.file.key) },
    ...(card ? { also: card } : {}),
  };
}

/** What Review shows: the finding, and that answering writes nothing. */
export function tidyCard(finding: TidyFinding, likely: { number: number; title: string } | null): ProposalCard {
  return {
    kind: "stated",
    verb: "tidy this file",
    lead: [
      `*${escapeSlackText(finding.file.name)}* · <${fileUrl(finding.file.key)}|open file>`,
      escapeSlackText(findingBody(finding, likely)),
      "Files are moved and renamed in Figma by a person. Answering here records what you did and writes nothing.",
    ].join("\n"),
    footer: "",
    fields: [],
    caveats: [],
    operations: [{ toolName: TIDY_TOOL, input: { file_key: finding.file.key, check: finding.check, card: finding.card } }],
  };
}

/** The two answers. Both decide the card and write nothing. */
export function tidyChoices(): ReviewChoice[] {
  return [
    { value: "moved", label: "Moved it", verdict: "cancel", decided: "Next week's tidy-up checks the file again." },
    { value: "leave", label: "Leave as is", past: "Left as is", verdict: "cancel", decided: "Not raised again for 5 weeks." },
  ];
}

/** What the gate says on a tidy-up card in place of its generic lines. */
export function tidyCardWords(windowHours: number): StatedCardWords {
  return {
    cancelled: "Nothing written",
    expired: `That card closed after ${windowInWords(windowHours)} with no answer, so nothing changed.`,
  };
}

/** What a turn says when it would change a tidy-up card. */
export const TIDY_REVISION_REFUSAL = "A Figma tidy-up card is answered in its Review: Moved it, or Leave as is.";

/** The week everything shown before is fixed (#886 § 3.6). */
export function allClearText(fixed: number): string {
  return `*Figma tidy-up: all clear* 🎉 Last week's ${plural(fixed, "item is", "items are")} fixed. Nice work.`;
}

/** A card that showed and did not stage says this in its place. */
export const TIDY_NOT_STAGED = "Didn't go through, so it comes back next week.";
