// One queued `message` job, from the dedup claim to the turn — the part of
// `onMessage` that decides WHAT runs, on named dependencies so the orderings
// that matter are driven with fakes (tests/ds-precedence-queued.test.ts).
//
// A `dispute N` reply in the weekly DS precedence thread is handled HERE, at
// the head of the thread's own job, and nowhere earlier. Being on the queued
// path is what makes it safe:
//   • the `message` event and its `app_mention` twin claim the same run key,
//     so whichever arrives second finds the first done and the dispute is
//     handled once;
//   • the thread's runner takes one job at a time, so two quick disputes each
//     read the thread record the other left;
//   • a revision that throws falls through to the ordinary turn in the same
//     job, so the reply is answered rather than dropped.
// A dispute posted "also send to channel" arrives as a `thread_broadcast`
// subtype; it is the one subtype let through, and only as a dispute.

import type { SlackMessageEvent } from "./types";

/** The run-lease answer `ThreadState.claimRun` gives. */
export type RunClaimAnswer = "claimed" | "running" | "done";

export interface MessageJobDeps {
  /** Claim the message's run key; fails open to "claimed" upstream. */
  claim(runKey: string): Promise<RunClaimAnswer>;
  /** Mark the run key done. Best-effort. */
  markDone(runKey: string): Promise<void>;
  /** Whether the event could be a weekly-thread dispute — no reads. */
  disputeCandidate(event: SlackMessageEvent): boolean;
  /** Handle it; true when it did, and the turn is then skipped. */
  dispute(event: SlackMessageEvent): Promise<boolean>;
  /** The ordinary turn. */
  turn(event: SlackMessageEvent): Promise<void>;
}

/** A person's own plain message: no bot, no subtype, some text. */
export function isUserTurn(event: SlackMessageEvent): boolean {
  if (event.bot_id) return false;
  if (event.subtype) return false;
  if (!event.text) return false;
  if (!event.user) return false;
  return true;
}

/**
 * Run one message job.
 *
 * @param event - The message
 * @param deps - The claim, the dispute and the turn
 * @returns "deferred" while another invocation holds the run's lease
 */
export async function runMessageJob(event: SlackMessageEvent, deps: MessageJobDeps): Promise<"handled" | "deferred"> {
  const candidate = deps.disputeCandidate(event);
  if (!isUserTurn(event) && !candidate) {
    console.log(`[slack] skipping subtype=${event.subtype ?? ""} bot=${event.bot_id ?? ""}`);
    return "handled";
  }
  const runKey = `msg:${event.channel}:${event.ts}`;
  const claim = await deps.claim(runKey);
  if (claim === "done") {
    console.log(`[slack] dedup: msg ${event.channel}/${event.ts} already handled`);
    return "handled";
  }
  if (claim === "running") {
    console.log(`[slack] dedup: msg ${event.channel}/${event.ts} in-flight — deferring (reclaims if the run died)`);
    return "deferred";
  }
  try {
    if (candidate) {
      const handled = await deps.dispute(event).catch((err: unknown) => {
        // A failed revision leaves the reply to the turn rather than to nobody.
        console.error(`[ds-precedence] dispute not handled: ${err instanceof Error ? err.message : String(err)}`);
        return false;
      });
      if (handled) return "handled";
      // A broadcast is let through only as a dispute.
      if (!isUserTurn(event)) return "handled";
    }
    await deps.turn(event);
  } finally {
    // Also marks done on a throw: the thrown path posts a visible ❌ upstream.
    await deps.markDone(runKey);
  }
  return "handled";
}
