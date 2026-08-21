// Which emoji reactions resolve a staged proposal.
//
// Split out of gate.ts so it can be tested: gate.ts reaches for Env, the DO
// client and the Slack API, none of which exist under `npm test`. This module
// is pure on purpose — the question "does 👍 authorize an irreversible write"
// deserves an assertion, not a code review.

export type Decision = "confirm" | "cancel";

/**
 * ✅ and ✔️ only.
 *
 * 👍 (`+1` / `thumbsup`) was in this set until 2026-08-21 and must not return.
 * The answer footer puts a 👍 BUTTON on every substantive reply, so in this
 * product the gesture already means "that was useful" — and the bot's own
 * proposal copy used to ask people for a thumbs up, teaching precisely the
 * reflex that then fired a Notion write. A confirmation must be a gesture with
 * no second meaning.
 *
 * Buttons and reactions are different Slack mechanisms, so the footer button
 * never reached this code. That is not much comfort: a person told to "give
 * the thumbs up" reaches for whichever one is closer.
 */
export const CONFIRM_REACTIONS: ReadonlySet<string> = new Set([
  "white_check_mark",
  "heavy_check_mark",
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
