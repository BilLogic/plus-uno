// The weekly Figma tidy-up's words (#886 § 3.6): the parent line, each
// owner's bullet in the week's reply (the owner tagged once, by the shared
// card), one Review card per finding, and the all-clear post.
//
// Bill's ruling (2026-10-11): one shared decision card per finding, whose
// Review pop-up offers "Moved it" and "Leave as is". No API moves or renames a
// Figma file, so neither answer writes to Figma: a person moves the file, and
// the card records who answered and how. "Leave as is" is the spec's `skip`:
// its one operation keeps the file and check quiet until the file's title
// cards change (`leaveAsIs` in `./run.ts`).
//
// PURE.

import type { ReportItem, ReviewChoice, StatedCardWords, TidyFacts } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { shortDate, windowInWords } from "../slack/copy-words";
import type { ToolName } from "../agent/tool-table";
import { figmaFileUrl } from "../figma/links";
import { cardKey, isDeployed, type TidyCard, type TidyFinding, type TidyMove } from "./checks";

/** The tool a card names: "Leave as is" runs it, "Moved it" decides as a cancel. */
export const TIDY_TOOL: ToolName = "figma_tidy_up";

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
 * The parent line on a later morning, for the week's cards that did not fit
 * on an earlier message.
 *
 * @param week - The Monday the week's tidy-up ran
 * @param waiting - The cards still to show
 */
export function tidyCarriedParent(week: string, waiting: number): string {
  return `More from the Figma tidy-up for the week of ${shortDate(week)}: ${plural(waiting, "item", "items")} that did not fit before.`;
}

/**
 * One owner's bullet in the week's reply: how many of their files need a
 * tidy, and how many wait past the cards shown. The shared card opens it on
 * the owner, mentioned once (`decisionReport`'s `ownerLines`).
 *
 * @param owner - A Slack id, or null for the files with no owner
 * @param total - Their items this week
 * @param shown - How many the reply carries
 */
export function ownerLine(owner: string | null, total: number, shown: number): string {
  let more = "";
  if (shown === 0) more = ": they come in the next report";
  else if (shown < total) more = `: here ${shown === 1 ? "is" : "are"} ${shown}, and ${total - shown} more in the next report`;
  if (!owner) {
    const files = plural(total, "file has", "files have");
    return `${files} no owner I could find${more}.`;
  }
  return `${total === 1 ? "1 file needs" : `${total} files need`} a tidy${more}.`;
}

/** Where a finding says to move the file: the team's folder, by its own name. */
function destination(team: string, to: TidyMove): string {
  return `${team} › ${to.folder?.name ?? to.stage}`;
}

/** A card's stage, in its own words. */
function stageWords(c: TidyCard): string {
  return isDeployed(c) ? "deployed" : (c.designStatus ?? "");
}

/** What a finding says, plain. */
export function findingBody(finding: TidyFinding, likely: { number: number; title: string } | null): string {
  switch (finding.check) {
    case "wrong-folder":
      return `In ${finding.folder.name}, but Card ${finding.card} is ${stageWords(finding.known)}. Move it to ${destination(finding.file.team, finding.moveTo)}.`;
    case "no-active-card":
      return `Not on an active card, and not in ${finding.moveTo.folder?.name ?? "Archive"}. Move it to ${destination(finding.file.team, finding.moveTo)}.`;
    case "unknown-card":
      return likely
        ? `Card ${finding.card} isn't on the Roadmap. Likely Card ${likely.number}, "${likely.title}".`
        : `Card ${finding.card} isn't on the Roadmap, and no card's name matches the project.`;
    case "title": {
      const named = finding.retitle.missing.map((n) => `Card ${n}`);
      const list = named.length > 1 ? `${named.slice(0, -1).join(", ")} and ${named.at(-1)}` : named[0];
      return `Its pages or Cover name ${list}, which the title leaves out. Rename it to "${finding.retitle.title}".`;
    }
  }
}

const SUBTITLE: Record<TidyFinding["check"], string> = {
  "wrong-folder": "Wrong folder",
  "unknown-card": "Unknown card",
  "no-active-card": "Not on an active card",
  title: "Title misses a card",
};

/** A finding's card id: Slack-safe, unique in its reply. */
export function itemId(finding: TidyFinding): string {
  return `${finding.check}-${finding.file.key.replace(/[^A-Za-z0-9_-]+/g, "-")}-${finding.card ?? 0}`;
}

/**
 * One finding as its card: the file, the check and card, what to do, and the
 * file and its card (or the likely one) as buttons. `ownerName` names the
 * owner where a DM tags nobody.
 */
export function tidyItem(finding: TidyFinding, likely: { number: number; title: string; url: string } | null, ownerName?: string): ReportItem {
  const known = "known" in finding ? finding.known : likely;
  const card = known ? { label: `Card ${known.number}`, url: known.url } : null;
  return {
    id: itemId(finding),
    title: finding.file.name,
    subtitle: finding.card === null ? SUBTITLE[finding.check] : `${SUBTITLE[finding.check]} · Card ${finding.card}`,
    ...(finding.owner ? { owners: [{ slack: finding.owner, ...(ownerName ? { name: ownerName } : {}) }] } : {}),
    body: findingBody(finding, likely),
    open: { label: "Open file", url: figmaFileUrl(finding.file.key) },
    ...(card ? { also: card } : {}),
  };
}

/** What Review shows: the finding, and that answering writes nothing. */
export function tidyCard(finding: TidyFinding, likely: { number: number; title: string } | null): ProposalCard {
  return {
    kind: "stated",
    verb: "tidy this file",
    lead: [
      `*${escapeSlackText(finding.file.name)}* · <${figmaFileUrl(finding.file.key)}|open file>`,
      escapeSlackText(findingBody(finding, likely)),
      "Files are moved and renamed in Figma by a person. Answering here records what you did, and Leave as is stops asking until the file's cards change.",
    ].join("\n"),
    footer: "",
    fields: [],
    caveats: [],
    operations: [{ toolName: TIDY_TOOL, input: { file_key: finding.file.key, check: finding.check, card: finding.card, cards: cardKey(finding.file.name) } }],
  };
}

/** The finding as Review draws it (`PendingProposal.facts`): the file, the
 *  check and what it found, and the file's link for Open file. */
export function tidyFacts(finding: TidyFinding, likely: { number: number; title: string } | null): TidyFacts {
  return {
    kind: "figma_tidy_up",
    file: finding.file.name,
    check: SUBTITLE[finding.check],
    finding: findingBody(finding, likely),
    fileUrl: figmaFileUrl(finding.file.key),
    note: "Files are moved and renamed in Figma by a person. Your answer records what you did.",
  };
}

/** The two answers. Neither writes to Figma. */
export function tidyChoices(): ReviewChoice[] {
  return [
    { value: "moved", label: "Moved it", verdict: "cancel", decided: "Next week's tidy-up checks the file again." },
    { value: "leave", label: "Leave as is", past: "Left as is", verdict: "confirm", decided: "Not raised again until the file's cards change." },
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
export const TIDY_NOT_STAGED = "Didn't go through, so it comes back in tomorrow's report.";
