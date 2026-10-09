// What a commitment reminder says, and what each answer to it means.
//
// The words are the persona's, drafted with /ux-copy and fixed by the ticket:
// the reminder with and without a stated deadline, the legend of four
// answers, each answer's acknowledgement (which replaces the legend in place,
// with no new ping), and the one follow-up. A reminder mentions the promiser
// and nobody else — the summary it quotes back is the detector's paraphrase,
// stripped of any mention before it is ever stored.
//
// THE FOUR GLYPHS are the reminder's own vocabulary. None is in the gate's
// confirm or cancel sets, so an emoji keeps exactly one meaning in the product
// (`gate/reactions.ts`), and `tests/commitment-reminders.test.ts` asserts it.
//
// PURE: no `Env`, no Slack module, no Workers global.

/** What an answer to a reminder means. */
export type ReminderAnswer = "done" | "soon" | "not_doing" | "not_promise";

/** Slack's names for the four glyphs (a reaction event sends a name). */
export const REMINDER_REACTIONS: Readonly<Record<string, ReminderAnswer>> = {
  raised_hands: "done", // 🙌
  hourglass_flowing_sand: "soon", // ⏳
  hourglass: "soon", // ⌛, the nearest reach for ⏳
  no_good: "not_doing", // 🙅
  thinking_face: "not_promise", // 🤔
};

/**
 * The answer a reaction name carries, or null. A skin tone rides on the name
 * (`no_good::skin-tone-3`) and does not change it.
 */
export function reminderAnswer(name: string): ReminderAnswer | null {
  return REMINDER_REACTIONS[name.replace(/::skin-tone-\d$/, "")] ?? null;
}

/** One answer a reminder offers: a button that stands in for the reaction. */
export interface ReminderChoice {
  /** Slack's name for the glyph, as a reaction event sends it: the answer's key. */
  glyph: string;
  /** The button's label. */
  label: string;
}

/** What sits under a reminder: the answers as buttons, with an optional hint
 *  line below them, or only a line of words (an answer's acknowledgement, or
 *  a prompt that wants a typed reply). */
export type ReminderFooter = string | { hint?: string; choices: readonly ReminderChoice[] };

/** The button row's action ids all start here; the glyph follows. */
export const REMINDER_ACTION_PREFIX = "uno_reminder_";

/** The answers under a reminder until someone answers it. The labels are
 *  words: the glyphs still answer as reactions, but a button is no place for
 *  one. */
export const REMINDER_CHOICES: readonly ReminderChoice[] = [
  { glyph: "raised_hands", label: "Done" },
  { glyph: "hourglass_flowing_sand", label: "Later" },
  { glyph: "no_good", label: "Dropped" },
  { glyph: "thinking_face", label: "Wasn't a promise" },
];

/** What replaces the legend once the promiser answers. */
export function acknowledgement(answer: ReminderAnswer, checkBackDay?: string): string {
  switch (answer) {
    case "done":
      return "Nice, marked done.";
    case "soon":
      return `No problem. I'll check back ${checkBackDay ?? "soon"}.`;
    case "not_doing":
      return "Understood. I won't ask again.";
    case "not_promise":
      return "My mistake, thanks.";
  }
}

/** Why a tapped answer changed nothing, in the words the tapper sees, only to
 *  them. A reaction can go unanswered; a button that does nothing reads as
 *  broken, so every refused tap is told why. */
export const TAP_REFUSED = {
  settled: "This one's already been answered, so that tap changed nothing.",
  snoozeSpent: "This can't be put off again, so that tap changed nothing.",
  notAnAnswer: "That answer doesn't apply here any more, so nothing changed.",
  gone: "I'm no longer tracking this one, so that tap changed nothing.",
  notYours: (owner: string) => `Only <@${owner}> can answer this reminder, so that tap changed nothing.`,
} as const;

/** What a reminder door made of a press: not a reminder's at all, or the
 *  reminder's, with why it changed nothing when it didn't. */
export type ReminderOutcome = { claimed: false } | { claimed: true; refused?: string };

/** Characters of a summary a reminder repeats. */
export const MAX_WHAT_CHARS = 140;

/**
 * A summary made safe to store and to repeat: no Slack markup (so no mention,
 * no link, no channel ping), no bare URL or domain Slack would link, no
 * surrounding quotes, one line, capped. Empty
 * when nothing is left.
 */
export function cleanWhat(raw: string): string {
  const text = raw
    .replace(/<(?:https?:)[^|>]*\|([^>]*)>/g, "$1") // a link keeps its label
    .replace(/<[^>]*>/g, " ")
    // A bare URL, or a bare domain Slack would link, never reaches a post.
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ")
    .replace(/\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|app|dev|ai|me|ly|gg|xyz|info|link|site|so|us)\b\S*/gi, " ")
    .replace(/[@#]\S+/g, " ")
    .replace(/[<>&*_~`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'“‘]+|["'”’.]+$/g, "")
    .trim();
  if (!text) return "";
  const lead = text.charAt(0).toLowerCase() + text.slice(1);
  return lead.length > MAX_WHAT_CHARS ? `${lead.slice(0, MAX_WHAT_CHARS - 1).trimEnd()}…` : lead;
}

/** The link back to the promise, when its permalink was fetched. */
function original(permalink: string | null): string {
  return permalink ? ` <${permalink}|Original message>` : "";
}

/**
 * The first reminder, laid out like a card: a bold heading line saying what
 * was promised and by when, then a line under it with the mention, the
 * question and the link back (`reminderBlocks` sets that line small).
 *
 * @param input.promiser - The one Slack user id it mentions
 * @param input.what - The cleaned summary (`cleanWhat`)
 * @param input.deadlineLabel - The stated deadline as said ("Thu"), or null
 *   when none was stated
 * @param input.promisedLabel - The day the promise was made ("Tue")
 * @param input.permalink - The promising message's permalink, when fetched
 */
export function reminderText(input: {
  promiser: string;
  what: string;
  deadlineLabel: string | null;
  promisedLabel: string;
  permalink: string | null;
}): string {
  const link = input.permalink ? ` · <${input.permalink}|Original message>` : "";
  if (input.deadlineLabel) {
    return `*You said you'd ${input.what} by ${input.deadlineLabel}*\n<@${input.promiser}> I haven't spotted it yet. Is it done, or does the date need to move?${link}`;
  }
  return `*On ${input.promisedLabel} you said you'd ${input.what}*\n<@${input.promiser}> I haven't spotted it yet. Is it done, or still in progress?${link}`;
}

/** The second and last reminder. */
export function followUpText(promiser: string): string {
  return `<@${promiser}> Checking in once more. Is it done, or does it need more time?`;
}

/** A body whose first line is wholly bold is a heading with a line under it. */
const HEADED = /^(\*[^*\n]+\*)\n(.+)$/s;

/** A reminder as Slack blocks: its body, then either the answers as buttons
 *  (with a hint line under them, when the footer has one) or a line of words,
 *  such as an answer's acknowledgement, as a context line.
 *
 *  A body that opens with a bold heading line (`reminderText`) is laid out the
 *  way a card is: the heading as the section, the lines under it as a small
 *  context line. Any other body is one section, as every reminder was before,
 *  so a reminder posted in that shape still edits in it. */
export function reminderBlocks(body: string, footer: ReminderFooter): unknown[] {
  const headed = HEADED.exec(body);
  const blocks: unknown[] = headed
    ? [
        { type: "section", text: { type: "mrkdwn", text: headed[1] } },
        { type: "context", elements: [{ type: "mrkdwn", text: headed[2] }] },
      ]
    : [{ type: "section", text: { type: "mrkdwn", text: body } }];
  if (typeof footer === "string") {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: footer }] });
    return blocks;
  }
  blocks.push({
    type: "actions",
    block_id: "uno_reminder_actions",
    elements: footer.choices.map((c) => ({
      type: "button",
      action_id: `${REMINDER_ACTION_PREFIX}${c.glyph}`,
      text: { type: "plain_text", text: c.label, emoji: true },
      value: c.glyph,
    })),
  });
  if (footer.hint) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: footer.hint }] });
  return blocks;
}

/** The labels a footer shows, for a test or a log: its buttons, or its words. */
export function footerLabels(blocks: readonly unknown[]): string {
  const first = blocks[0] as { text?: { text?: string } } | undefined;
  // A headed reminder spends two blocks on its body: the heading and the line under it.
  const heading = /^\*[^*\n]+\*$/.test(first?.text?.text ?? "");
  const rest = blocks.slice(heading ? 2 : 1) as Array<{ type: string; elements: Array<{ text: string | { text: string } }> }>;
  return rest
    .flatMap((b) => b.elements.map((e) => (typeof e.text === "string" ? e.text : e.text.text)))
    .join(" · ");
}

// ── "Remind me" ──────────────────────────────────────────────────────────────
//
// A reminder a person asked for answers to two glyphs only: 🙌 done and ⏳
// snooze. Its last allowed post offers 🙌 alone, since a ⏳ there could bring
// nothing more.

/** The answers under a "remind me" while a ⏳ can still bring it back. */
export const SELF_REMINDER_CHOICES: readonly ReminderChoice[] = [
  { glyph: "raised_hands", label: "Done" },
  { glyph: "hourglass_flowing_sand", label: "Snooze 2 days" },
];
/** The answer under its last allowed post. */
export const SELF_REMINDER_LAST_CHOICES: readonly ReminderChoice[] = [{ glyph: "raised_hands", label: "Done" }];

/**
 * The reminder a person asked for, mentioning only them.
 *
 * @param input.requester - The one Slack user id it mentions
 * @param input.what - The cleaned summary (`cleanWhat`)
 * @param input.permalink - The asking message's permalink, when fetched
 */
export function selfReminderText(input: { requester: string; what: string; permalink: string | null }): string {
  return `Hey <@${input.requester}>, here's your reminder: ${input.what}.${original(input.permalink)}`;
}

/** What replaces the legend once a ⏳ moves a "remind me". */
export function snoozeAcknowledgement(day: string): string {
  return `Got it. I'll remind you again ${day}.`;
}
