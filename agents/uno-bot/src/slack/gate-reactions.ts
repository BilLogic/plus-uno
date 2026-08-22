// Which emoji reactions resolve a staged proposal.
//
// Split out of gate.ts so it can be tested: gate.ts reaches for Env, the DO
// client and the Slack API, none of which exist under `npm test`. This module
// is pure on purpose — the question "does 👍 authorize an irreversible write"
// deserves an assertion, not a code review.

export type Decision = "confirm" | "cancel";

/**
 * ✅, ✔️ and 👍.
 *
 * 👍 was removed on 2026-08-21 and restored the same day, and the round trip
 * is the useful part: it was never the gesture that was wrong, it was the
 * gesture MEANING TWO THINGS. The answer footer put a 👍 button under every
 * substantive reply, so the product taught "thumbs-up = that was useful"
 * while one flavour of thumbs-up meant "yes, write to Notion" — and a person
 * told to "give the thumbs up" reaches for whichever is closer.
 *
 * Two changes retired the collision rather than the gesture:
 *   • the footer no longer carries 👍/👎 at all, so nothing else in the
 *     product asks for that gesture;
 *   • a reaction now only resolves the proposal it is placed ON. A 👍 on a
 *     colleague's message, or on the bot's earlier answer, does nothing — it
 *     used to execute the thread's pending write.
 *
 * With those in place 👍 is what it should have been all along: the most
 * natural way to say yes in Slack. Making someone hunt for ✅ instead is
 * friction with nothing left to protect.
 *
 * The rule this leaves behind: a confirmation gesture must have exactly one
 * meaning in the product. If 👍 is ever given a second job again, it comes out
 * of this set the same day.
 */
export const CONFIRM_REACTIONS: ReadonlySet<string> = new Set([
  "white_check_mark",
  "heavy_check_mark",
  "+1",
  "thumbsup",
]);

export const CANCEL_REACTIONS: ReadonlySet<string> = new Set([
  "x",
  "negative_squared_cross_mark",
  "no_entry_sign",
]);

/** The decision an emoji name carries, or null when it carries none. */
export function mapReaction(name: string): Decision | null {
  if (CONFIRM_REACTIONS.has(name)) return "confirm";
  if (CANCEL_REACTIONS.has(name)) return "cancel";
  return null;
}
