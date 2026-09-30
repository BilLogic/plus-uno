// What the morning ask says, and which replies answer it.
//
// The words are the persona's, fixed by the ticket: "you talked about <X> —
// is the Figma up to date?", with a link to the file. A thread is asked once a
// morning, naming every file it discussed: the card that carries the drafted
// intakes leads with that question, and a thread whose files' intakes are
// drafted elsewhere gets the question alone, pointing at them. A "yes" closes
// the question and withdraws the card.
//
// MENTIONS: the ask @-mentions each file's owner and nobody else. The thread's
// other posters already follow it, so the ask reaches them without a ping.
//
// EVERY NOTION- AND FIGMA-SOURCED STRING IS ESCAPED (`escapeSlackText`): a file
// title or a thread paraphrase holding `<!channel>` pings nobody. The Figma
// publisher is named by their handle in bold and never @-mentioned — the
// versions API gives a handle and no Slack id.
//
// PURE: no `Env`, no Slack module, no Workers global.

import { escapeSlackText } from "../slack/mrkdwn";
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

/** What the question asks about, in the persona's words. */
export function askedThing(kind: TargetKind): string {
  if (kind === "figma" || kind === "figma-library") return "the Figma";
  if (kind === "storybook") return "Storybook";
  return "the code";
}

/** The owners to mention, each once, in order. */
export function mentionsOf(owners: readonly string[]): string[] {
  return [...new Set(owners.filter(Boolean))];
}

/** A file linked by its title, escaped. */
export function fileLink(file: Pick<AskedFileWords, "title" | "url">): string {
  return `<${file.url}|${escapeSlackText(flat(file.title) || "this file")}>`;
}

/**
 * The question itself: the owners, each file linked by its title, and whether
 * it is up to date.
 *
 * @param input.mentions - Slack user ids of the files' owners (`mentionsOf`)
 * @param input.files - The files, in the order the card numbers them
 */
export function askLine(input: { mentions: readonly string[]; files: readonly AskedFileWords[] }): string {
  const who = input.mentions.map((id) => `<@${id}>`).join(" ");
  const links = input.files.map(fileLink);
  const named = links.length <= 1 ? (links[0] ?? "this file") : `${links.slice(0, -1).join(", ")} and ${links[links.length - 1]}`;
  const question =
    input.files.length === 1 ? `is ${askedThing(input.files[0]!.kind)} up to date?` : "are they up to date?";
  return `${who ? `${who} ` : ""}you talked about ${named} — ${question}`;
}

/** Who last published the file, by handle, in bold — never a mention. */
export function publisherLine(publisher: { handle: string; at: string } | null): string | null {
  if (!publisher?.handle) return null;
  const when = publisher.at ? ` on ${publisher.at.slice(0, 10)}` : "";
  return `Last published by *${escapeSlackText(flat(publisher.handle).replace(/\*/g, ""))}*${when}.`;
}

/** What the thread settled, and what the file shows, as the detector read them. */
export function saidLines(threadSays: string, sourceSays: string, indent = ""): string[] {
  const lines = [`${indent}• The thread settled: “${escapeSlackText(quote(threadSays))}”`];
  if (sourceSays.trim()) lines.push(`${indent}• The file shows: “${escapeSlackText(quote(sourceSays))}”`);
  return lines;
}

/** What a ✅ files, by lane. */
export function intakeWords(lane: IntakeLane): string {
  return lane === "roadmap" ? "a Roadmap card for the update" : "a `harness-intake` issue for the update";
}

/**
 * The card's closing lines: the two answers, who decides, and its clock.
 *
 * @param intakes - The lanes of the intakes the card files, in card order
 * @param kind - The file's kind, when the card asks about one file
 */
export function cardTerms(intakes: readonly IntakeLane[], kind: TargetKind): string {
  const answers =
    intakes.length === 1
      ? `If ${askedThing(kind)} is already current, reply \`yes\` and I'll withdraw this. If not, ✅ files ${intakeWords(intakes[0]!)}. `
      : `If they're already current, reply \`yes\` and I'll withdraw this. If not, one ✅ files all ${intakes.length} intakes; reply \`drop 2\` to leave one out. `;
  return (
    answers +
    "The people named here and anyone who posted in this thread can decide. " +
    `Expires in ${DRIFT_CARD_TTL_MS / 3_600_000} h, with no reminder.`
  );
}

/** Where a file's intake is drafted, for a file this card does not file. */
export function elsewhereWords(cardLink: string | null): string {
  return `its intake is drafted ${cardLink ? `<${cardLink}|in another thread>` : "in another thread"}`;
}

/**
 * The question in a thread whose files' intakes are drafted on cards in other
 * threads.
 *
 * @param line - `askLine` for this thread
 * @param files - Each file's link to the card that drafts its intake
 */
export function pingText(line: string, files: ReadonlyArray<{ file: AskedFileWords; cardLink: string | null }>): string {
  if (files.length === 1) {
    const where = files[0]!.cardLink ? `<${files[0]!.cardLink}|in another thread>` : "in another thread";
    return `${line} I've drafted the intake ${where}. If it's already current, reply \`yes\` here and I'll withdraw it.`;
  }
  return [
    line,
    ...files.map((f) => `• ${fileLink(f.file)}: ${elsewhereWords(f.cardLink)}`),
    "If they're already current, reply `yes` here and I'll withdraw them.",
  ].join("\n");
}

/** What the card is edited to once someone says its files are up to date. */
export function withdrawnText(user: string, kinds: readonly TargetKind[]): string {
  return `:white_check_mark: Thanks, <@${user}>. ${capitalized(currentWords(kinds))}, so I've withdrawn this intake.`;
}

/** Posted in the thread a "yes" came from, when the card is in another one. */
export function withdrawnElsewhereText(kinds: readonly TargetKind[]): string {
  return `Thanks! ${capitalized(currentWords(kinds))}, so I've withdrawn the intake.`;
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
export const DRIFT_NOT_STAGED_TEXT =
  ":warning: This question didn't go through, so its intake can't be filed from here. I'll ask again.";

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
/** Characters of a reply read as an answer at all: an answer is short. */
const MAX_ANSWER_CHARS = 120;

/**
 * What a thread reply says about the asked file:
 *   • `bare` — the whole message is a bare affirmative ("yes", "yep", "yes it
 *     is", "yes, up to date", "it's up to date", "already updated");
 *   • `explicit` — it says the file is current ("the Figma is up to date");
 *   • null — anything else: a question, a no, or a message that asks for
 *     something to happen ("yes please file it", "go ahead", "ship it").
 *
 * @param text - The reply, as Slack sent it
 */
export function upToDateAnswer(text: string): "bare" | "explicit" | null {
  const t = text
    .replace(/<@[A-Z0-9]+>/g, " ")
    .replace(/:[a-z0-9_+-]+:/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!t || t.length > MAX_ANSWER_CHARS || t.includes("?")) return null;
  if (NEGATION.test(t) || ACTION.test(t)) return null;
  const whole = t.replace(/[.!,\s]+$/g, "").replace(/^[,\s]+/, "");
  if (BARE.test(whole)) return "bare";
  if (EXPLICIT.test(t)) return "explicit";
  return null;
}

/** Whether a thread reply says the asked file is up to date (`upToDateAnswer`). */
export function isUpToDateReply(text: string): boolean {
  return upToDateAnswer(text) !== null;
}

/** Why the Product Pillar was left off an intake, for the card. */
export function pillarNote(note: string): string {
  return `_Product Pillar: ${escapeSlackText(note)}_`;
}

function currentWords(kinds: readonly TargetKind[]): string {
  const things = [...new Set(kinds.map(askedThing))];
  return things.length === 1 ? `${things[0]} is up to date` : "the files are up to date";
}

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function quote(text: string): string {
  const f = flat(text);
  return f.length > SAID_CHARS ? `${f.slice(0, SAID_CHARS - 1)}…` : f;
}
