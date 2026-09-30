// Commitment reminders on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • Slack: the sweep's own measured reads (`sweepSlackFor`), `chat.getPermalink`,
//     `chat.postMessage` for a reminder and `chat.update` for an answer's
//     acknowledgement, all with the bot token.
//   • Sources: the sweep's `readSource` — Notion in full, GitHub as read-only
//     context.
//   • The detector and the judge: `selectProvider(env)`, the Worker's one
//     ModelProvider.
//   • The store: `./store-env.ts` — the records in the usage database, the
//     wording in HARNESS_KV with an expiry.
//   • The thread mark: the sweep card's (`markSweepThread`).
//
// A Worker with either binding missing keeps no commitments and sends nothing.

import type { Env } from "../types";
import { selectProvider } from "../agent/run-agent";
import { budgetHeadroom } from "../net";
import { getBotIdentity, getPermalink, postMessage, updateMessage } from "../slack/api";
import type { ScheduledJob } from "../scheduled/runs";
import { measured, readSource, sweepSlackFor } from "../sweep/env";
import { markSweepThread } from "../sweep/thread-mark";
import type { SweepThread } from "../sweep/finding";
import { modelCommitmentDetector, modelEvidenceJudge } from "./detector";
import { cardAnswerFor, cardFollowUpsFor } from "../follow-through/env";
import { commitmentStoreFor } from "./store-env";
import {
  answerReminder,
  commitmentThreadHook,
  runCommitmentNudges,
  type CommitmentDeps,
  type CommitmentJobReport,
  type NudgeDeps,
  type ReminderReaction,
} from "./run";

/**
 * The end-of-day sweep's per-thread hook, or undefined when the bindings are
 * missing.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` detects and keeps nothing
 */
export function commitmentThreadHookFor(
  env: Env,
  opts: { dryRun: boolean },
): ((thread: SweepThread, since: string) => Promise<void>) | undefined {
  const store = commitmentStoreFor(env);
  if (!store) return undefined;
  const provider = selectProvider(env);
  const detector = modelCommitmentDetector(provider);
  return commitmentThreadHook({
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    store,
    config: { unoBot: env.UNO_BOT_CHANNEL_ID?.trim() || undefined },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  });
}

/**
 * The morning's `commitment-nudge` job on `Env`.
 *
 * @param env - Worker bindings
 * @param job - The job
 * @param opts - `dryRun` reads and judges, and writes and posts nothing
 */
export async function runCommitmentNudgesOnEnv(
  env: Env,
  job: ScheduledJob,
  opts: { dryRun: boolean },
): Promise<CommitmentJobReport | { summary: string }> {
  const store = commitmentStoreFor(env);
  if (!store || !env.HARNESS_KV) return { summary: "USAGE_DB or HARNESS_KV not bound — no commitments to nudge" };
  const kv = env.HARNESS_KV;
  const provider = selectProvider(env);
  const judge = modelEvidenceJudge(provider);
  const bot = await measured(() => getBotIdentity(env));
  const deps: NudgeDeps = {
    slack: {
      ...pick(sweepSlackFor(env)),
      permalink: (channel, ts) => measured(() => getPermalink(env, channel, ts)),
      async post(to, message) {
        const res = await postMessage(env, {
          channel: to.channel,
          text: message.text,
          blocks: message.blocks,
          ...(to.threadTs ? { thread_ts: to.threadTs } : {}),
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      update: (channel, ts, message) => updateReminder(env, channel, ts, message),
    },
    sources: { read: (url, kind) => measured(() => readSource(env, url, kind)) },
    judge: { judge: (input) => measured(() => judge.judge(input)) },
    store,
    markThread: (channel, thread) => markSweepThread(kv, channel, thread),
    config: {
      unoBot: env.UNO_BOT_CHANNEL_ID?.trim() || undefined,
      botUserId: bot?.userId ?? null,
      figmaLibraryKey: env.FIGMA_FILE_KEY?.trim() || undefined,
    },
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  };
  const cards = cardFollowUpsFor(env, opts, bot?.userId ?? null);
  return runCommitmentNudges(job, cards ? { ...deps, cards } : deps);
}

/**
 * The reaction door's first look: true when the reacted message is a reminder
 * (`answerReminder`). A Worker without the bindings has no reminders.
 *
 * @param env - Worker bindings
 */
export function reminderDoorFor(env: Env): ((r: ReminderReaction) => Promise<boolean>) | undefined {
  const store = commitmentStoreFor(env);
  if (!store) return undefined;
  const cards = cardAnswerFor(env);
  return (r) =>
    answerReminder(r, {
      store,
      ...(cards ? { cards } : {}),
      update: (channel, ts, message) => updateReminder(env, channel, ts, message),
      botUserId: async () => (await getBotIdentity(env))?.userId,
      now: () => Date.now(),
    });
}

async function updateReminder(env: Env, channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<boolean> {
  const res = await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
  return res.ok;
}

function pick(slack: ReturnType<typeof sweepSlackFor>): Pick<CommitmentDeps["slack"], "replies" | "history"> {
  return { replies: slack.replies, history: slack.history };
}
