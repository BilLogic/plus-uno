// What the morning ask says, and which replies answer it.
//
// The words are #886 § 3.3's, approved by Bill on 2026-09-30:
//
//   *Is the Figma file still current?* This thread settled "<what>" on Sep 24,
//   and <file> hasn't changed since Sep 20.
//   <@owner>, update the frame, or reply `skip` if the decision didn't touch Figma.
//
// and, once the file catches up, the same message edited to
// "~Is the Figma file still current?~ Yes, updated Sep 30. Nothing to do."
// Everything else here — the variants for a file that changed but can't be
// confirmed, for code and Storybook, for several files, the card's footer, the
// lines a `yes` and a `skip` leave, and what the gate says on this card —
// follows that register and is Bill's to confirm (`slack.md` § Figma messages
// holds the rules, and `tests/figma-copy.test.ts` pins every line to them).
//
// A thread is asked once a morning, naming every file it discussed: the card
// that carries the drafted intakes leads with the question, and a thread whose
// files' intakes are drafted elsewhere gets the question alone, pointing at them.
//
// MENTIONS: the ask @-mentions each file's owner and nobody else. The thread's
// other posters already follow it, so the ask reaches them without a ping.
//
// EVERY NOTION- AND FIGMA-SOURCED STRING IS ESCAPED (`escapeSlackText`): a file
// title or a thread paraphrase holding `<!channel>` pings nobody.
//
// PURE: no `Env`, no Slack module, no Workers global.

import { escapeSlackText } from "../slack/mrkdwn";
import { shortDate, windowInWords } from "../slack/copy-words";
import { etDayOf } from "../sweep/schedule";
import type { StatedCardWords } from "../thread-state/index";
import type { TargetKind } from "../sweep/finding";
import type { IntakeLane } from "./finding";

/** How long a drift card stays confirmable. */
export const DRIFT_CARD_TTL_MS = 72 * 60 * 60 * 1000;

const SAID_CHARS = 200;

/** A file as the ask names it. */
export interface AskedFileWords {
  title: string;
  url: string;
  kind: TargetKind;
}

/**
 * What the morning learned about a file's last change, against the decision:
 *   • `unchanged` — its last change is at or before the decision;
 *   • `changed` — it changed after, and its frame could not be confirmed to
 *     show the decision (a frame that does is not asked about at all);
 *   • `unknown` — not read: a failed read, or a file that is not Figma's.
 */
export type FileChange = { kind: "unchanged"; at: number } | { kind: "changed"; at: number } | { kind: "unknown" };

/** One file the ask names. */
export interface AskItem {
  file: AskedFileWords;
  /** What the thread settled. */
  threadSays: string;
  /** When it settled it — the earliest evidence message, epoch ms. */
  decidedAt: number;
  change: FileChange;
  /** Set for a file whose intake is drafted on a card in another thread:
   *  that card's link, or null when it could not be read. */
  elsewhere?: { cardLink: string | null };
}

/** The owners to mention, each once, in order. */
export function mentionsOf(owners: readonly string[]): string[] {
  return [...new Set(owners.filter(Boolean))];
}

/** A file linked by its title, escaped. */
export function fileLink(file: Pick<AskedFileWords, "title" | "url">): string {
  return `<${file.url}|${escapeSlackText(flat(file.title) || "this file")}>`;
}

/** A moment as its ET day, "Sep 24". */
export function dayWords(at: number): string {
  return shortDate(new Date(etDayOf(at)).toISOString());
}

/**
 * The question the ask opens with, and its withdrawal strikes through.
 *
 * @param kinds - The kinds of every file the message names
 */
export function driftHeadline(kinds: readonly TargetKind[]): string {
  if (kinds.length !== 1) return "Are these files still current?";
  const [kind] = kinds;
  if (kind === "figma" || kind === "figma-library") return "Is the Figma file still current?";
  if (kind === "storybook") return "Is Storybook still current?";
  return "Is the code still current?";
}

/**
 * Everything the ask says above a card's footer: the question in bold, what
 * the thread settled and when, what the file did since, and who is asked to
 * do what. A file drafted elsewhere says where its intake is.
 *
 * @param input.mentions - Slack user ids of the files' owners (`mentionsOf`)
 * @param input.items - The files, those this card drafts first, in card order
 */
export function askLead(input: { mentions: readonly string[]; items: readonly AskItem[] }): string {
  const items = input.items;
  const headline = `*${driftHeadline(items.map((i) => i.file.kind))}*`;
  const ask = askLine(input.mentions, items);
  if (items.length === 1) {
    const [item] = items;
    const settled = `This thread settled "${said(item!.threadSays)}" on ${dayWords(item!.decidedAt)}, and ${fileLink(item!.file)} ${changeWords(item!.change)}.`;
    return [`${headline} ${settled}`, `${ask}${item!.elsewhere ? ` ${elsewhereSentence(item!.elsewhere.cardLink)}` : ""}`].join("\n");
  }
  // A card's own files are numbered when there are several, so `drop 2` names
  // one; a file drafted elsewhere is a bullet, since no `drop` reaches it.
  const drafted = items.filter((i) => !i.elsewhere).length;
  let n = 0;
  const lines = items.map((item) => {
    const mark = !item.elsewhere && drafted > 1 ? `${(n += 1)}.` : "•";
    const line = `${mark} ${fileLink(item.file)}: settled "${said(item.threadSays)}" on ${dayWords(item.decidedAt)}, and it ${changeWords(item.change)}.`;
    return item.elsewhere ? `${line} ${elsewhereSentence(item.elsewhere.cardLink)}` : line;
  });
  return [`${headline} This thread settled a decision about each of these files:`, ...lines, ask].join("\n");
}

/** What the file did since the decision, as the ask's sentence ends. */
function changeWords(change: FileChange): string {
  if (change.kind === "unchanged") return `hasn't changed since ${dayWords(change.at)}`;
  if (change.kind === "changed") return `last changed ${dayWords(change.at)}`;
  return "may not show it yet";
}

/** The one action, from the files' owners. */
function askLine(mentions: readonly string[], items: readonly AskItem[]): string {
  const who = mentions.map((id) => `<@${id}>`).join(" ");
  const kinds = items.map((i) => i.file.kind);
  let rest: string;
  if (kinds.length !== 1) rest = "update them, or reply `skip` if the decisions didn't touch them.";
  else if (kinds[0] === "figma" || kinds[0] === "figma-library") rest = "update the frame, or reply `skip` if the decision didn't touch Figma.";
  else if (kinds[0] === "storybook") rest = "update Storybook, or reply `skip` if the decision didn't touch it.";
  else rest = "update the code, or reply `skip` if the decision didn't touch it.";
  return who ? `${who}, ${rest}` : capitalized(rest);
}

function elsewhereSentence(cardLink: string | null): string {
  return `Its intake is drafted ${cardLink ? `<${cardLink}|in another thread>` : "in another thread"}.`;
}

/**
 * The card's one footer: what ✅ and ⛔ each do, who decides, and for how long.
 *
 * @param intakes - The lanes of the intakes the card files, in card order
 */
export function driftFooter(intakes: readonly IntakeLane[]): string {
  const files =
    intakes.length === 1
      ? `files ${intakes[0] === "roadmap" ? "a Roadmap card" : "an intake"} for the update`
      : `files ${intakes.length === 2 ? "both intakes" : `all ${intakes.length} intakes`}; reply \`drop 2\` to leave one out`;
  return [
    `:white_check_mark: ${files}. :no_entry: files nothing.`,
    `The people named here and anyone who posted in this thread can decide, for the next ${windowInWords(DRIFT_CARD_TTL_MS / 3_600_000)}.`,
  ].join("\n");
}

/**
 * What the gate says on a drift card, in place of its generic lines: nobody
 * asked for this card, so "tell me what to change" and "ask me again" would
 * be wrong, and #886 promises no re-ping (`PendingProposal.stated`).
 *
 * @param ttlHours - The card's whole window, in hours
 */
export function driftCardWords(ttlHours: number): StatedCardWords {
  return {
    cancelled: "No intake filed",
    expired: `That card closed after ${windowInWords(ttlHours)} with no decision, so nothing was filed.`,
  };
}

// ── Withdrawals: the same message, edited ────────────────────────────────────

/** Edited in once every file the message names shows its decision (#886 § 3.3). */
export function caughtUpText(headline: string, at: number): string {
  return `~${headline}~ Yes, updated ${dayWords(at)}. Nothing to do.`;
}

/** Edited in when someone in the thread says the files are current. */
export function confirmedText(headline: string, user: string): string {
  return `~${headline}~ Yes, confirmed by <@${user}>. Nothing to do.`;
}

/** Edited in when someone replies `skip`: the decision didn't touch the file. */
export function skippedText(headline: string, user: string): string {
  return `~${headline}~ Skipped by <@${user}>. Nothing to do.`;
}

/** Posted in the thread a yes came from, when the card is in another one. */
export function withdrawnElsewhereText(intakes: number): string {
  return `Thanks, I've withdrawn the drafted ${intakes === 1 ? "intake" : "intakes"} in the other thread.`;
}

/**
 * Posted when a "yes" covers only some of a card's files: the card stays, and
 * the reply says how to leave the answered ones out.
 *
 * @param numbers - The answered files' numbers on the card
 */
export function partlyAnsweredText(numbers: readonly number[]): string {
  const which = numbers.join(" and ");
  return `Thanks! That card also drafts intakes for files this thread didn't discuss, so it stays. Reply \`drop ${which}\` under it to leave ${numbers.length === 1 ? "this file" : "these files"} out.`;
}

/** What a card that did not go through is edited to say. */
export const DRIFT_NOT_STAGED_TEXT = "This question didn't go through, so its intake can't be filed from here. I'll ask again.";

// ── Replies ──────────────────────────────────────────────────────────────────

/** Words that say "no" or "not yet". */
const NEGATION = /\b(no|nope|not|nah|yet)\b|n't\b/;
/** Words that ask for something to happen — an approval or a plan, not an
 *  answer that the file is current. "file" is read as the verb ("file it",
 *  "file the card"), so "the file is current" still answers. */
const ACTION =
  /\b(please|pls|go ahead|file (it|them|this|that|the|a|an|one)|filing|filed|update it|should update|needs? (an? )?update|ship|shipping|merg\w*|option)\b/;
/** A whole message that is a bare affirmative. */
const BARE =
  /^(yes|yep|yeah|yup|yes it is|yep it is|it is|yes,? (it'?s |it is )?(up[ -]to[ -]date|current|updated)|(yes,? )?(it'?s|it is) (already )?(up[ -]to[ -]date|current|updated)|already (updated|current|up[ -]to[ -]date))$/;
/** A message that says the file itself is current. */
const EXPLICIT =
  /\b(it|it'?s|figma|figma'?s|file|file'?s|code|storybook|design|frames?|screens?)\b[\w\s']{0,30}?\b(up[ -]to[ -]date|updated|current)\b/;
/** The ask's own verb, as a whole message. */
const SKIP = /^skip$/;
/** Characters of a reply read as an answer at all: an answer is short. */
const MAX_ANSWER_CHARS = 120;

/**
 * What a thread reply says about the asked file:
 *   • `bare` — the whole message is a bare affirmative ("yes", "yep", "yes it
 *     is", "yes, up to date", "it's up to date", "already updated");
 *   • `explicit` — it says the file is current ("the file is up to date");
 *   • `skip` — the whole message is the ask's `skip`: the decision didn't
 *     touch the file;
 *   • null — anything else: a question, a no, or a message that asks for
 *     something to happen ("yes please file it", "go ahead", "ship it").
 *
 * @param text - The reply, as Slack sent it
 */
export function driftAnswer(text: string): "bare" | "explicit" | "skip" | null {
  const t = text
    .replace(/<@[A-Z0-9]+>/g, " ")
    .replace(/:[a-z0-9_+-]+:/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!t || t.length > MAX_ANSWER_CHARS || t.includes("?")) return null;
  const whole = t.replace(/[.!,\s]+$/g, "").replace(/^[,\s]+/, "");
  if (SKIP.test(whole)) return "skip";
  if (NEGATION.test(t) || ACTION.test(t)) return null;
  if (BARE.test(whole)) return "bare";
  if (EXPLICIT.test(t)) return "explicit";
  return null;
}

/**
 * Why the Product Pillar was left off an intake, for the card.
 *
 * @param note - Why (`matchPillar`)
 * @param intake - The intake's number, on a card that files several
 */
export function pillarNote(note: string, intake?: number): string {
  return `_Product Pillar${intake ? ` (intake ${intake})` : ""}: ${escapeSlackText(note)}_`;
}

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** A thread's paraphrase as the ask quotes it: one line, capped, escaped,
 *  with no closing full stop doubled inside the quote marks. */
function said(text: string): string {
  const f = flat(text).replace(/[.\s]+$/, "");
  return escapeSlackText(f.length > SAID_CHARS ? `${f.slice(0, SAID_CHARS - 1)}…` : f);
}
