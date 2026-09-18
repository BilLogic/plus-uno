// Who a stream is being opened FOR, and whether one can be opened at all.
//
// Its own module because this is the one part of the answer path's streaming
// decision that is pure. `slack/delivery.ts` takes an `Env` and posts through
// the Slack client, so the Node suite can compile that file and has nothing to
// call it with — and a rule this small deserves to be checked by RUNNING it
// rather than by reading its source for a substring.
//
// `slack/delivery.ts` is the last adapter on the answer path still holding
// `Env` rather than taking its Slack client by name, which is why
// `tests/stream-recipient.test.ts` still keeps ONE source assertion over it.
// Splitting it the way the Delivery adapter (#594), the stop doors (#593) and
// the reaction door (#592) were split is its own ticket, not #595's.

/** The asker and their workspace: `chat.startStream`'s `recipient_user_id` and
 *  `recipient_team_id`. The argument contract is stated once, in `slack/api.ts`
 *  above `startStream`; this is only the pair travelling to the call.
 *
 *  `team` is optional here because a Slack event may not carry one — not
 *  because the API treats it as optional. `decideStream` refuses the half, and names it. */
export interface StreamRecipient {
  userId: string;
  team?: string;
}

/** Why no stream is being opened.
 *
 *  `"recipient"` — no usable ids at all, on a path that was never going to
 *  stream. Unremarkable, and nothing logs it.
 *
 *  `"user"` / `"team"` — a recipient turned up HALF built. That is the
 *  surprising one and the caller says so out loud; see `slack/delivery.ts`. */
export type StreamMissing = "recipient" | "user" | "team";

/** May the answer open — or reuse — a stream, and if not, what was missing. */
export type StreamDecision = { open: true } | { open: false; missing: StreamMissing };

/**
 * Decide whether the answer opens (or reuses) a stream.
 *
 * A stream already open for this turn (plan mode's) is reused whatever the
 * recipient looks like: it was opened with the ids, and the answer only closes
 * it. Otherwise BOTH ids must be in hand. The reason is not a budget: a call
 * that cannot succeed should not be made, and Slack documents the pair as
 * required when a stream goes to a channel.
 *
 * It returns what was missing rather than logging it, because this module is
 * in the Node test lane and stays free of `console` and `Env` alike — the
 * caller holds the words.
 *
 * `recipient` is typed as possibly absent although `postTextVerified` requires
 * it, because `userId` arrives through a non-null assertion on the Slack event
 * (`event.user!`, `slack/turn-adapter.ts`) — so `undefined` and `""` are both
 * reachable at runtime however the type reads.
 */
export function decideStream(
  openStreamTs: string | undefined,
  recipient: StreamRecipient | undefined,
): StreamDecision {
  if (openStreamTs) return { open: true };
  const user = recipient?.userId;
  const team = recipient?.team;
  if (user && team) return { open: true };
  // Neither half is a path that never had a recipient; one half is a turn that
  // lost one, and those are told apart so only the second is worth a log line.
  if (!user && !team) return { open: false, missing: "recipient" };
  return { open: false, missing: user ? "team" : "user" };
}
