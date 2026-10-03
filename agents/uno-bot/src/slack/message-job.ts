// One queued `message` job, from the dedup claim to the turn — the part of
// `onMessage` that decides WHAT runs, on named dependencies so the orderings
// that matter are driven with fakes (tests/ds-precedence-queued.test.ts).
//
// A reply handled ahead of the turn — a `drop N` in a weekly DS precedence
// list thread, a "yes, it's up to date" to a file-drift ask, an answer under a
// card follow-up — is handled HERE, at the head of the thread's own job, and
// nowhere earlier. Which handler, if any, was decided when the message was
// queued (`chainReplyHandlers`), so a reply no handler wanted pays no claim
// and no second engagement check here. For a handled reply:
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
//   • a handler that throws falls through to the ordinary turn in the same
//     job, so the reply is answered rather than dropped. The DS revision
//     relies on this. The drift handler catches its own failures but a
//     budget stop, which it re-throws as on main; the card handler catches
//     every failure, a budget stop included.

import type { RunClaim } from "../thread-state/index";
import type { SlackMessageEvent } from "./types";

export interface MessageJobDeps {
  /** Claim a run key; fails open to "claimed" upstream. */
  claim(runKey: string): Promise<RunClaim>;
  /** Mark a run key done. Best-effort. */
  markDone(runKey: string): Promise<void>;
  /** Whether the event could be a weekly-thread dispute, or a "yes, it's up
   *  to date" to a file-drift ask (`figma-drift/`) — no reads. Both take this
   *  one path. */
  disputeCandidate(event: SlackMessageEvent): boolean;
  /** Handle it; true when it did, and the turn is then skipped. */
  dispute(event: SlackMessageEvent): Promise<boolean>;
  /** Whether the reply engages uno-bot at all (`shouldHandleMessage`). */
  engages(event: SlackMessageEvent): Promise<boolean>;
  /** The ordinary turn. */
  turn(event: SlackMessageEvent): Promise<void>;
}

/** One reply handled ahead of the turn: a shape check that reads nothing, and
 *  the handler, true when the reply was its. A handler that throws sends the
 *  reply to the turn (`runMessageJob`). */
export interface ReplyHandler {
  name: string;
  candidate(event: SlackMessageEvent): boolean;
  handle(event: SlackMessageEvent): Promise<boolean>;
}

/**
 * Several ahead-of-the-turn handlers as the job's one dispute door. `matched`
 * is the handler the message was queued for (its name), or null for none —
 * the job then tries no handler at all. Left out (a job queued before this
 * was carried), or naming a handler this code does not have (a job queued by
 * another version), every handler whose shape fits is a candidate, first to
 * handle it wins, and an unhandled reply takes the engagement check. A throw
 * propagates as it did from one handler, so the job runs the turn.
 *
 * @param handlers - In the order tried
 * @param matched - The handler chosen when the message was queued
 */
export function chainReplyHandlers(
  handlers: readonly ReplyHandler[],
  matched?: string | null,
): Pick<MessageJobDeps, "disputeCandidate" | "dispute"> {
  const known = matched != null && handlers.some((h) => h.name === matched);
  const tried = matched === null ? [] : known ? handlers.filter((h) => h.name === matched) : handlers;
  return {
    disputeCandidate: (event) => tried.some((h) => h.candidate(event)),
    async dispute(event) {
      for (const h of tried) {
        if (h.candidate(event) && (await h.handle(event))) return true;
      }
      return false;
    },
  };
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
