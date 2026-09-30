// What the morning ask says, and which replies answer it.
//
// The words are the persona's, fixed by the ticket: "you talked about <X> —
// is the Figma up to date?", with a link to the file. The card that carries
// the drafted intake leads with that question; any other thread that
// discussed the same file that day gets the question alone, pointing at the
// card. A "yes" in either closes the question and withdraws the card.
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

/** People one ask @-mentions: the owner first, then who else posted. */
export const MAX_MENTIONS = 6;

const SAID_CHARS = 200;

/** What the question asks about, in the persona's words. */
export function askedThing(kind: TargetKind): string {
  if (kind === "figma" || kind === "figma-library") return "the Figma";
  if (kind === "storybook") return "Storybook";
  return "the code";
}

/** The owner, then the thread's other posters, each once, capped. */
export function mentionsOf(owner: string, participants: readonly string[]): string[] {
  return [...new Set([owner, ...participants].filter(Boolean))].slice(0, MAX_MENTIONS);
}

/**
 * The question itself: the people, the file linked by its title, and whether
 * it is up to date.
 *
 * @param input.mentions - Slack user ids, owner first (`mentionsOf`)
 * @param input.title - The file's title as read — escaped here
 * @param input.url - The file's link
 * @param input.kind - What the file is
 */
export function askLine(input: { mentions: readonly string[]; title: string; url: string; kind: TargetKind }): string {
  const who = input.mentions.map((id) => `<@${id}>`).join(" ");
  const label = escapeSlackText(flat(input.title) || "this file");
  return `${who} you talked about <${input.url}|${label}> — is ${askedThing(input.kind)} up to date?`;
}

/** Who last published the file, by handle, in bold — never a mention. */
export function publisherLine(publisher: { handle: string; at: string } | null): string | null {
  if (!publisher?.handle) return null;
  const when = publisher.at ? ` on ${publisher.at.slice(0, 10)}` : "";
  return `Last published by *${escapeSlackText(flat(publisher.handle).replace(/\*/g, ""))}*${when}.`;
}

/** What the thread settled, and what the file shows, as the detector read them. */
export function saidLines(threadSays: string, sourceSays: string): string[] {
  const lines = [`• The thread settled: “${escapeSlackText(quote(threadSays))}”`];
  if (sourceSays.trim()) lines.push(`• The file shows: “${escapeSlackText(quote(sourceSays))}”`);
  return lines;
}

/** What a ✅ files, by lane. */
export function intakeWords(lane: IntakeLane): string {
  return lane === "roadmap" ? "a Roadmap card for the update" : "a `harness-intake` issue for the update";
}

/** The card's closing lines: the two answers, who decides, and its clock. */
export function cardTerms(lane: IntakeLane, kind: TargetKind): string {
  return (
    `If ${askedThing(kind)} is already current, reply \`yes\` and I'll withdraw this. ` +
    `If not, ✅ files ${intakeWords(lane)}. ` +
    "The people named here and anyone who posted in this thread can decide. " +
    `Expires in ${DRIFT_CARD_TTL_MS / 3_600_000} h, with no reminder.`
  );
}

/**
 * The question in a thread that discussed a file whose intake is drafted on a
 * card somewhere else.
 *
 * @param line - `askLine` for this thread
 * @param cardLink - The card's permalink, when it could be fetched
 */
export function pingText(line: string, cardLink: string | null): string {
  const where = cardLink ? `<${cardLink}|in another thread>` : "in another thread";
  return `${line} I've drafted the intake ${where}. If it's already current, reply \`yes\` here and I'll withdraw it.`;
}

/** What the card is edited to once someone says the file is up to date. */
export function withdrawnText(user: string, kind: TargetKind): string {
  return `:white_check_mark: Thanks, <@${user}>. ${capitalized(askedThing(kind))} is up to date, so I've withdrawn this intake.`;
}

/** Posted in the thread a "yes" came from, when the card is in another one. */
export function withdrawnElsewhereText(kind: TargetKind): string {
  return `Thanks! ${capitalized(askedThing(kind))} is up to date, so I've withdrawn the intake.`;
}

/** What a card that did not go through is edited to say. */
export const DRIFT_NOT_STAGED_TEXT =
  ":warning: This question didn't go through, so its intake can't be filed from here. I'll ask again.";

/** Words that say "no" or "not yet" — a reply holding one is not a yes. */
const NEGATION = /\b(no|nope|not|isn'?t|aren'?t|hasn'?t|haven'?t|wasn'?t|nah|yet)\b|n't\b/i;
/** A reply that opens with a yes. */
const YES = /^(yes|yep|yeah|yup|yea|y|correct|it is|it's current|all good|done|already (done|updated))\b/i;
/** A reply that says the file is current, wherever it says it. */
const CURRENT = /\b(up[ -]to[ -]date|already updated|already current|is current|figma is updated|code is updated)\b/i;
/** Characters of a reply read as an answer at all: a yes is short. */
const MAX_ANSWER_CHARS = 120;

/**
 * Whether a thread reply says the file is up to date: a short reply that opens
 * with a yes, or one that says "up to date" — and holds no no and no
 * question. Anything else is the thread's own conversation.
 *
 * @param text - The reply, as Slack sent it
 */
export function isUpToDateReply(text: string): boolean {
  const t = text
    .replace(/<@[A-Z0-9]+>/g, " ")
    .replace(/:[a-z0-9_+-]+:/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || t.length > MAX_ANSWER_CHARS) return false;
  // A question back ("is it up to date?") answers nothing.
  if (NEGATION.test(t) || t.includes("?")) return false;
  return YES.test(t) || CURRENT.test(t);
}

/** Why the Product Pillar was left off the intake, for the card. */
export function pillarNote(note: string): string {
  return `_Product Pillar: ${escapeSlackText(note)}_`;
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
