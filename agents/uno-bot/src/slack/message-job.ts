// One queued `message` job, from the dedup claim to the turn — the part of
// `onMessage` that decides WHAT runs, on named dependencies so the orderings
// that matter are driven with fakes (tests/ds-precedence-queued.test.ts).
//
// A `dispute N` reply in a weekly DS precedence list thread is handled HERE,
// at the head of the thread's own job, and nowhere earlier:
//   • the dispute has its own claim (`dispute:` + channel + ts), so the
//     `message` event and its `app_mention` twin try it once between them;
//     one that is handled also marks the message's own key done, so the twin
//     that lands second runs no turn;
//   • the thread's runner takes one job at a time, so two quick disputes each
//     read the thread record the other left;
//   • a dispute that is NOT handled (not a list thread) leaves the message's
//     key alone and takes the ordinary path exactly as the message would have
//     without it: a subtype such as a `thread_broadcast` is skipped unclaimed,
//     and a reply the engagement gate would not have queued runs nothing —
//     so an `app_mention` twin arriving second still gets its turn;
//   • a revision that throws falls through to the ordinary turn in the same
//     job, so the reply is answered rather than dropped.

import type { RunClaim } from "../thread-state/index";
import type { SlackMessageEvent } from "./types";

export interface MessageJobDeps {
  /** Claim a run key; fails open to "claimed" upstream. */
  claim(runKey: string): Promise<RunClaim>;
  /** Mark a run key done. Best-effort. */
  markDone(runKey: string): Promise<void>;
  /** Whether the event could be a weekly-thread dispute — no reads. */
  disputeCandidate(event: SlackMessageEvent): boolean;
  /** Handle it; true when it did, and the turn is then skipped. */
  dispute(event: SlackMessageEvent): Promise<boolean>;
  /** Whether the reply engages uno-bot at all (`shouldHandleMessage`). */
  engages(event: SlackMessageEvent): Promise<boolean>;
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
 * @param deps - The claims, the dispute and the turn
 * @returns "deferred" while another invocation holds a lease this job needs
 */
export async function runMessageJob(event: SlackMessageEvent, deps: MessageJobDeps): Promise<"handled" | "deferred"> {
  const runKey = `msg:${event.channel}:${event.ts}`;
  let threw = false;
  if (deps.disputeCandidate(event)) {
    const disputeKey = `dispute:${event.channel}:${event.ts}`;
    const claim = await deps.claim(disputeKey);
    if (claim === "running") return "deferred";
    if (claim === "claimed") {
      let handled = false;
      try {
        handled = await deps.dispute(event);
      } catch (err) {
        // A failed revision leaves the reply to the turn rather than to nobody.
        console.error(`[ds-precedence] dispute not handled: ${err instanceof Error ? err.message : String(err)}`);
        threw = true;
      }
      await deps.markDone(disputeKey);
      if (handled) {
        await deps.markDone(runKey);
        return "handled";
      }
    }
    // Not handled: the ordinary path, as if the dispute had never been tried.
    if (!isUserTurn(event)) return skip(event);
    if (!threw && !(await deps.engages(event))) return "handled";
  } else if (!isUserTurn(event)) {
    return skip(event);
  }

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
    await deps.turn(event);
  } finally {
    // Also marks done on a throw: the thrown path posts a visible ❌ upstream.
    await deps.markDone(runKey);
  }
  return "handled";
}

function skip(event: SlackMessageEvent): "handled" {
  console.log(`[slack] skipping subtype=${event.subtype ?? ""} bot=${event.bot_id ?? ""}`);
  return "handled";
}
