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

/** The context line under a reminder until someone answers it. */
export const REMINDER_LEGEND = "🙌 Done · ⏳ Soon · 🙅 Not doing it · 🤔 Not a promise";

/** What replaces the legend once the promiser answers. */
export function acknowledgement(answer: ReminderAnswer, checkBackDay?: string): string {
  switch (answer) {
    case "done":
      return "Nice, marked done.";
    case "soon":
      return `Got it. I'll check back ${checkBackDay ?? "soon"}.`;
    case "not_doing":
      return "Noted. I won't ask again.";
    case "not_promise":
      return "My mistake, thanks. I'll read that kind of message better next time.";
  }
}

/** Characters of a summary a reminder repeats. */
export const MAX_WHAT_CHARS = 140;

/**
 * A summary made safe to store and to repeat: no Slack markup (so no mention,
 * no link, no channel ping), no surrounding quotes, one line, capped. Empty
 * when nothing is left.
 */
export function cleanWhat(raw: string): string {
  const text = raw
    .replace(/<(?:https?:)[^|>]*\|([^>]*)>/g, "$1") // a link keeps its label
    .replace(/<[^>]*>/g, " ")
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
 * The first reminder.
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
  const link = original(input.permalink);
  if (input.deadlineLabel) {
    return `Hey <@${input.promiser}>, you said you'd ${input.what} by ${input.deadlineLabel}. I haven't spotted it yet, so I'm checking in.${link}`;
  }
  return `Hey <@${input.promiser}>, on ${input.promisedLabel} you said you'd ${input.what}. Did it happen?${link}`;
}

/** The second and last reminder. */
export function followUpText(promiser: string): string {
  return `<@${promiser}> Still on your list? A reaction is all I need.`;
}

/** A reminder as Slack blocks: its body, then the legend or an answer's
 *  acknowledgement as a context line. */
export function reminderBlocks(body: string, footer: string): unknown[] {
  return [
    { type: "section", text: { type: "mrkdwn", text: body } },
    { type: "context", elements: [{ type: "mrkdwn", text: footer }] },
  ];
}

// ── "Remind me" ──────────────────────────────────────────────────────────────
//
// A reminder a person asked for answers to two glyphs only: 🙌 done and ⏳
// snooze. Its last allowed post offers 🙌 alone, since a ⏳ there could bring
// nothing more.

/** The legend under a "remind me" while a ⏳ can still bring it back. */
export const SELF_REMINDER_LEGEND = "🙌 Done · ⏳ Snooze 2 days";
/** The legend under its last allowed post. */
export const SELF_REMINDER_LAST_LEGEND = "🙌 Done";

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
