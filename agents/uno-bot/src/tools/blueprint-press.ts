// The blueprint press's shared steps, for both of its ✅ executors
// (`./blueprint-revise.ts`, `./blueprint-withdraw.ts`): the refusals checked
// before the first blueprint call — no write identity, then a cost the alarm
// cannot cover beside the press's reserve (ADR-022) — and the thread told
// what happened, whatever happened.

import type { Env, SlackContext } from "../types";
import { budgetHeadroom, rethrowIfBudget } from "../net";
import { postMessage } from "../slack/api";
import { signInCalls, writeIdentityGap } from "../blueprint-write/index";

/**
 * External subrequests the press keeps for itself once the write is done: the
 * thread's reply, and what the Gate does after the batch (the result post on a
 * batch, the proposal events). A write that would eat into them is refused
 * before its first call rather than cut off half-written.
 */
export const PRESS_RESERVE = 4;

/** What a refusal says: what the press needs the calls for, and what it left undone. */
export interface PressWords {
  /** "this revision needs" */
  needs: string;
  /** "nothing was written" */
  nothing: string;
}

/**
 * Why the press may not start, before any blueprint call: the write identity
 * missing, or a cost past the alarm's headroom less the reserve. Null when it
 * may.
 *
 * @param check - The identity gap (null when there is one), the calls the write costs, and the alarm's headroom
 * @param words - How the refusal names the work
 */
export function pressRefusal(check: { gap: string | null; cost: number; headroom: number }, words: PressWords): string | null {
  if (check.gap) return check.gap;
  const left = check.headroom - PRESS_RESERVE;
  if (check.cost > left) return `${words.needs} up to ${check.cost} blueprint calls and the press has ${Math.max(0, left)} left; ${words.nothing}`;
  return null;
}

/**
 * The press's refusal on `Env`: the identity, then the sign-in and the write's
 * own calls against what the alarm has left.
 *
 * @param env - Worker bindings
 * @param writeCalls - The blueprint calls the write itself makes
 * @param words - How the refusal names the work
 */
export function pressRefusalOn(env: Env, writeCalls: () => number, words: PressWords): string | null {
  const gap = writeIdentityGap(env);
  if (gap) return gap;
  return pressRefusal({ gap: null, cost: signInCalls(env) + writeCalls(), headroom: budgetHeadroom().subrequests }, words);
}

/**
 * Tell the press's thread one line: under the reply target, else the thread.
 * Silent on a batched operation, whose summary the Gate posts; a failed post
 * is logged, past a budget stop.
 *
 * @param env - Worker bindings
 * @param slack - The press's context
 * @param what - The log's name for the line
 */
export function threadTeller(env: Env, slack: SlackContext, what: string): (text: string) => Promise<void> {
  return async (text) => {
    if (slack.batched) return;
    const thread = slack.replyTs ?? slack.threadTs;
    try {
      await postMessage(env, { channel: slack.channel, ...(thread ? { thread_ts: thread } : {}), text });
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[blueprint] ${what} not posted: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}
