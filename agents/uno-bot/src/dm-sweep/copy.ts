// What the DM sweep says, in a person's DM with uno-bot and — once they
// approve it in Review, only then — in a team channel.
//
// Every line in the DM is uno-bot talking to the one person the DM is with,
// so none mentions anyone. The one line that may leave the DM is the raise
// note (`raiseNote`): uno-bot's own summary of what two sources disagree on,
// built only from the detector's short topic and source names — never a quote
// of the DM (the detector's parse refuses a topic that repeats the person's
// words), never who asked, never a link back. Every slot in it is escaped, so
// nothing a model wrote can mention or ping anyone.
//
// PURE: no `Env`, no Slack module, no Workers global.

import type { ChannelRole } from "../destination/index";
import { escapeSlackText } from "../slack/mrkdwn";
import { SHARE_CHANNEL_NAMES, shareCard } from "../sweep/cards";
import type { ProposalCard } from "../turn/index";
import type { ProposalOperation, ShareNoteFacts } from "../thread-state/index";
import { CARD_WINDOW_WORDS } from "../card-expiry";

/** The tag on the raise card, as on every post uno-bot makes in a DM, so the
 *  next night reads it as uno-bot's own post and never as an answer. */
export const DM_RAISE_EVENT = "uno_dm_raise";

/** The tool the raise card runs: the group-DM share's, which posts only to
 *  #plus-design or a team channel (`tools/sweep-share-post.ts`). */
export const RAISE_TOOL = "sweep_share_post";

/** The team channel a raise note goes to, by role. */
export type RaiseTo = ChannelRole;

/** What sits under the ask about a missed question: a button to let it go, and
 *  the way to answer it, which is a typed reply. */
export const ASK_FOOTER = {
  hint: "Or reply here with the answer or a link, and I'll suggest where it belongs.",
  choices: [{ glyph: "no_good", label: "Never mind" }],
} as const;

/** What replaces the buttons once the person says never mind. */
export const ASK_DROPPED = "No problem. I won't ask again.";

/**
 * "Yesterday", when `said` was the ET day before `today`; otherwise "On Fri".
 *
 * @param said - The ET day the answer was given (`etDayOf`)
 * @param today - The ET day it is said on
 * @param weekday - That day's short name (`dayLabel`)
 */
export function whenWord(said: number, today: number, weekday: string): string {
  return today - said <= 24 * 60 * 60 * 1000 ? "Yesterday" : `On ${weekday}`;
}

/** The morning ask about a question uno-bot could not answer (F6). */
export function askText(o: { when: string; what: string }): string {
  return `${o.when} I couldn't find ${escapeSlackText(o.what)}. Did you get it?`;
}

/**
 * The note a raise card's Approve posts in the team channel: uno-bot's words only.
 *
 * @param o.topic - What the two sources disagree on (the detector's topic)
 * @param o.sources - Their short names
 */
export function raiseNote(o: { topic: string; sources: readonly [string, string] }): string {
  const [a, b] = o.sources.map(plain);
  return (
    `While answering a question, le goat noticed that ${a} and ${b} disagree on ${plain(o.topic)}. ` +
    "Whoever owns it may want to check which one is right."
  );
}

/**
 * The raise card (C6), as data and its one operation: decided from Review.
 *
 * @param o.when - `whenWord`
 * @param o.channel - The team channel's id
 * @param o.to - Its role
 */
export function raiseCard(o: {
  when: string;
  topic: string;
  sources: readonly [string, string];
  channel: string;
  to: RaiseTo;
}): { card: ProposalCard; operations: ProposalOperation[]; facts: ShareNoteFacts } {
  const where = SHARE_CHANNEL_NAMES[o.to];
  const text = raiseNote(o);
  const operations: ProposalOperation[] = [{ toolName: RAISE_TOOL, input: { channel: o.channel, channel_name: where, text } }];
  const [a, b] = o.sources.map(plain);
  const lines = [
    `${o.when} I noticed ${a} and ${b} disagree on ${plain(o.topic)}. Want me to post a note about it in ${where}?`,
    "",
    `Approving posts exactly this note in ${where}. Nothing else from this DM goes with it: no quote, no names.`,
    "",
    `In ${where}:`,
    `> ${text}`,
    "",
    `Expires after ${CARD_WINDOW_WORDS}, with no reminder.`,
  ];
  return {
    card: shareCard({ where, lead: lines.join("\n"), operations }),
    operations,
    facts: {
      kind: "sweep_share_post",
      header: "Raise a disagreement",
      from: "this DM",
      notes: [`No quote and no names go with it. Expires after ${CARD_WINDOW_WORDS}, with no reminder.`],
    },
  };
}

/** A name or topic as it appears in a line: one line, trimmed, escaped. */
function plain(text: string): string {
  return escapeSlackText(text.replace(/\s+/g, " ").trim());
}
