// Where `Env` becomes the resolution record's dependencies: the D1 log, the
// reaction door's recorder, the completed-task write, and the end-of-day pass's
// reads (`./resolution.ts`, `./resolution-pass.ts`).
//
// Beside `./production.ts` rather than in it, so the resolution record and the
// turn record keep separate front doors; the same rule holds — a caller with an
// `Env` imports it by path, and `./index.ts` does not re-export it.
//
// THE LEAD'S TOKEN. The pass reads the asker's DMs with the lead on the lead's
// OWN connected token (`getSlackAccessTokenFor`, `own: true` only — never the
// legacy workspace slot), and keeps a boolean. That is a scheduled use of a
// per-user token by its own owner for aggregate output: ADR-020's 2026-09-29
// amendment.

import type { Env } from "../types";
import { rethrowIfBudget } from "../net";
import { getSlackAccessTokenFor } from "../oauth/slack";
import { conversationsReplies, getBotIdentity, slackReadAs } from "../slack/api";
import { createD1ResolutionLog } from "./resolution-d1";
import {
  batchCompleted,
  recordAnswerReaction,
  wholeThread,
  type AnswerReaction,
  type ResolutionLog,
  type ThreadMessage,
} from "./resolution";
import {
  createLeadDmReader,
  passThreadOf,
  runResolutionPass,
  type LeadDmReader,
  type PassThread,
} from "./resolution-pass";

/** A log that keeps nothing — the Worker without `USAGE_DB`. `./production.ts` says so once. */
const NO_RESOLUTION_LOG: ResolutionLog = {
  async recordReaction() {
    return null;
  },
  async recordTaskCompleted() {
    return null;
  },
  async pendingPass() {
    return [];
  },
  async recordPass() {},
  async getResolution() {
    return null;
  },
};

export function resolutionLogFor(env: Pick<Env, "USAGE_DB">): ResolutionLog {
  return env.USAGE_DB ? createD1ResolutionLog({ db: env.USAGE_DB }) : NO_RESOLUTION_LOG;
}

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * The reaction door's `recordReaction`, bound: the answer's thread read on the
 * bot token, then `recordAnswerReaction`. A budget stop is thrown through, as
 * everywhere; any other failure is logged and swallowed.
 */
export function reactionRecorderFor(env: Env) {
  return async (r: AnswerReaction): Promise<void> => {
    try {
      await recordAnswerReaction(r, {
        log: resolutionLogFor(env),
        threadOf: (channel, rootTs) => wholeThreadAt(env, channel, rootTs),
        now: () => Date.now(),
      });
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[resolution] reaction not recorded: ${message(err)}`);
    }
  };
}

/**
 * A ✅ batch came back: record `task_completed` on the turn that staged the
 * card, when every approved operation succeeded. Throws only a budget stop.
 */
export async function recordTaskCompletion(
  env: Env,
  proposalTs: string,
  approved: number,
  outcomes: readonly { ok: boolean }[],
): Promise<void> {
  if (!batchCompleted(approved, outcomes)) return;
  try {
    await resolutionLogFor(env).recordTaskCompleted(proposalTs, Date.now());
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[resolution] task completion not recorded: ${message(err)}`);
  }
}

// ── the end-of-day pass ──────────────────────────────────────────────────────

/** One page of a thread, the most one read returns. */
const THREAD_PAGE = 200;

/** A thread read on the bot token, whole or not at all (`wholeThread`). */
async function wholeThreadAt(env: Env, channel: string, ts: string): Promise<ThreadMessage[] | null> {
  return wholeThread(await conversationsReplies(env, channel, ts, THREAD_PAGE));
}

/** A thread read for the pass: a failure for now is told apart (`passThreadOf`). */
async function passThreadAt(env: Env, channel: string, ts: string): Promise<PassThread> {
  return passThreadOf(await conversationsReplies(env, channel, ts, THREAD_PAGE));
}

/** The ask's whole thread, oldest first, on the bot token (`PassThread`). */
async function threadOf(env: Env, channel: string, askTs: string): Promise<PassThread> {
  const first = await passThreadAt(env, channel, askTs);
  if (!Array.isArray(first)) return first;
  // Asked inside a thread: read from its root so every reply is in view.
  const root = first[0]?.thread_ts;
  if (root && root !== first[0]!.ts) return passThreadAt(env, channel, root);
  return first;
}

/**
 * The asker's DM with the lead, read on the lead's own token. Null when the
 * lead has not connected one: the legacy workspace slot is not the lead's.
 */
async function leadDmReader(env: Env, leadUserId: string, announce: boolean): Promise<LeadDmReader | null> {
  const stored = await getSlackAccessTokenFor(env, leadUserId).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  if (!stored?.own) return null;
  const token = stored.token;
  // `slackReadAs` takes only read methods (its type is the guard): the pass
  // never writes on the lead's token.
  return createLeadDmReader((method, params) => slackReadAs(token, method, params), { announce });
}

/**
 * The `ask-resolution` job: the end-of-day pass, on the Worker's bindings.
 *
 * @param env - The Worker environment
 * @param opts - `dryRun` for the sweep probe: counts the asks due, and makes no
 *   Slack read and no token lookup (a lookup can refresh the lead's token).
 *   `announce` for the run's first job only, so a missing token is one log
 *   line per run.
 */
export async function runAskResolution(
  env: Env,
  opts: { dryRun: boolean; announce: boolean },
): Promise<{ summary: string }> {
  if (!env.USAGE_DB) return { summary: "no USAGE_DB binding — nothing to check" };
  const leadUserId = env.LEAD_USER_ID?.trim() || null;
  return runResolutionPass({
    log: resolutionLogFor(env),
    now: () => Date.now(),
    leadUserId,
    botUserId: async () => (await getBotIdentity(env))?.userId,
    threadOf: (channel, askTs) => threadOf(env, channel, askTs),
    leadDmsWith: leadUserId && !opts.dryRun ? await leadDmReader(env, leadUserId, opts.announce) : null,
    dryRun: opts.dryRun,
    announce: opts.announce,
  });
}
