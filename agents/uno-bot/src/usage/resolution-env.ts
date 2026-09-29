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
import { batchCompleted, reactionWindow, type AnswerReaction, type ResolutionLog } from "./resolution";
import {
  createLeadDmReader,
  runResolutionPass,
  type LeadDmReader,
  type ThreadMessage,
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

/** The reaction door's `recordReaction`, bound. Logs and swallows a failed write. */
export function reactionRecorderFor(env: Env) {
  return async (r: AnswerReaction): Promise<void> => {
    try {
      await resolutionLogFor(env).recordReaction({
        channel: r.channel,
        requesterId: r.userId,
        ...reactionWindow(r.threadRoot, r.reactedTs),
        at: Date.now(),
      });
    } catch (err) {
      console.error(`[resolution] reaction not recorded: ${message(err)}`);
    }
  };
}

/**
 * A ✅ batch came back: record `task_completed` on the turn that staged the
 * card, when every approved operation succeeded. Never throws.
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
    console.error(`[resolution] task completion not recorded: ${message(err)}`);
  }
}

// ── the end-of-day pass ──────────────────────────────────────────────────────

/** The ask's whole thread, oldest first, on the bot token; null when unreadable. */
async function threadOf(env: Env, channel: string, askTs: string): Promise<ThreadMessage[] | null> {
  const first = await conversationsReplies(env, channel, askTs, 200);
  if (!first.ok || !Array.isArray(first.messages) || first.messages.length === 0) return null;
  // Asked inside a thread: read from its root so every reply is in view.
  const root = first.messages[0]!.thread_ts;
  if (root && root !== first.messages[0]!.ts) {
    const whole = await conversationsReplies(env, channel, root, 200);
    return whole.ok && Array.isArray(whole.messages) ? whole.messages : null;
  }
  return first.messages;
}

/**
 * The asker's DM with the lead, read on the lead's own token. Null when the
 * lead has not connected one: the legacy workspace slot is not the lead's.
 */
async function leadDmReader(env: Env, leadUserId: string): Promise<LeadDmReader | null> {
  const stored = await getSlackAccessTokenFor(env, leadUserId).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  if (!stored?.own) return null;
  const token = stored.token;
  // GET only (`slackReadAs`): the pass never writes on the lead's token.
  return createLeadDmReader((method, params) => slackReadAs(token, method, params));
}

/**
 * The `ask-resolution` job: the end-of-day pass, on the Worker's bindings.
 *
 * @param env - The Worker environment
 * @param opts - `dryRun` for the sweep probe: reads, writes nothing
 */
export async function runAskResolution(env: Env, opts: { dryRun: boolean }): Promise<{ summary: string }> {
  if (!env.USAGE_DB) return { summary: "no USAGE_DB binding — nothing to check" };
  const leadUserId = env.LEAD_USER_ID?.trim() || null;
  return runResolutionPass({
    log: resolutionLogFor(env),
    now: () => Date.now(),
    leadUserId,
    botUserId: async () => (await getBotIdentity(env))?.userId,
    threadOf: (channel, askTs) => threadOf(env, channel, askTs),
    leadDmsWith: leadUserId ? await leadDmReader(env, leadUserId) : null,
    dryRun: opts.dryRun,
  });
}
