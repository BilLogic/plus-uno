// Who a stream is being opened FOR, and whether one can be opened at all.
//
// Its own module because this is the one part of the answer path's streaming
// decision that is pure. `slack/delivery.ts` names `Env` and the Slack client,
// so the Node test lane cannot reach it — and a rule this small deserves to be
// checked by RUNNING it rather than by reading its source for a substring.

/** The asker and their workspace: `chat.startStream`'s `recipient_user_id` and
 *  `recipient_team_id`. The argument contract is stated once, in `slack/api.ts`
 *  above `startStream`; this is only the pair travelling to the call.
 *
 *  `team` is optional here because a Slack event may not carry one — not
 *  because the API treats it as optional. `canOpenStream` refuses the half. */
export interface StreamRecipient {
  userId: string;
  team?: string;
}

/**
 * May the answer open — or reuse — a stream?
 *
 * A stream already open for this turn (plan mode's) is reused whatever the
 * recipient looks like: it was opened with the ids, and the answer only closes
 * it. Otherwise BOTH ids must be in hand. The reason is not a budget: a call
 * that cannot succeed should not be made, and Slack documents the pair as
 * required when a stream goes to a channel.
 *
 * `recipient` is typed as possibly absent although `postTextVerified` requires
 * it, because `userId` arrives through a non-null assertion on the Slack event
 * (`event.user!`, `slack/turn-adapter.ts`) — so `undefined` and `""` are both
 * reachable at runtime however the type reads.
 */
export function canOpenStream(
  openStreamTs: string | undefined,
  recipient: StreamRecipient | undefined,
): boolean {
  if (openStreamTs) return true;
  return !!recipient?.userId && !!recipient.team;
}
