// A reminder's button, pressed: which door's answer stands, and what the
// tapper is told.
//
// A reaction left unanswered is fine; a button that does nothing reads as
// broken. So every press that changed nothing, or changed it out of sight,
// gets a line back to the tapper alone, and a failure is never passed off as
// "no longer tracked".
//
// PURE: no `Env`, no Slack module, no Workers global.

import { TAP_FAILED, TAP_RECORDED, TAP_REFUSED, type ReminderOutcome } from "./copy";

/** A press, in a reaction's facts. */
export interface ReminderPress {
  channel: string;
  messageTs: string;
  glyph: string;
  userId: string;
  messageAuthorId?: string;
  /** How the answer came: a deliberate tap, or a reaction that may only mean "seen". */
  via?: "button" | "reaction";
}

export type ReminderPressDoor = (r: ReminderPress) => Promise<ReminderOutcome>;

/**
 * A DM reminder's door first (it looks only at DMs), then the thread
 * reminders'. The first door to claim the press answers it, refusal and all;
 * when neither claims it, a failed lookup in either is the outcome.
 */
export function eitherDoor(first: ReminderPressDoor | undefined, second: ReminderPressDoor | undefined): ReminderPressDoor | undefined {
  if (!first || !second) return first ?? second;
  return async (r) => {
    const a = await first(r);
    if (a.claimed) return a;
    const b = await second(r);
    if (b.claimed) return b;
    return a.failed || b.failed ? { claimed: false, failed: true } : { claimed: false };
  };
}

/**
 * The line a tapper gets back, or null when the answer shows on the message.
 *
 * @param outcome - The doors' outcome, or `"error"` when they threw (a budget stop included)
 */
export function tapReply(outcome: ReminderOutcome | "error"): string | null {
  if (outcome === "error") return TAP_FAILED;
  if (!outcome.claimed) return outcome.failed ? TAP_FAILED : TAP_REFUSED.gone;
  if (outcome.refused) return outcome.refused;
  return outcome.unedited ? TAP_RECORDED : null;
}
