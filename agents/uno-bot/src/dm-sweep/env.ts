// The DM sweep on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • The DM list: `turns` in the usage database (`./active.ts`).
//   • The detector: `selectProvider(env)`, the Worker's one ModelProvider.
//   • The store: the commitment store (`commitments/store-env.ts`) — rows in
//     the usage database, wording in HARNESS_KV with an expiry.
//   • The DM posts: `chat.postMessage` with the bot token, in the DM thread;
//     the raise card rendered by the proposal renderer and staged in
//     ThreadState, its staging on the usage record.
//   • The in-place edit of an ask: `chat.update`.
//
// The DM reads themselves are the sweep's (`sweep/env.ts`): `conversations.history`
// and `.replies` on the bot's existing `im:history` scope.
//
// A Worker with either binding missing reads no DM and posts nothing.

import type { Env } from "../types";
import { selectProvider } from "../agent/run-agent";
import { rethrowIfBudget } from "../net";
import { postMessage, updateMessage } from "../slack/api";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import { measured } from "../sweep/env";
import type { ActiveDm, DmThread, DmThreadVerdict } from "../sweep/run";
import { threadStateFor } from "../thread-state/production";
import { proposalEventLogFor } from "../usage/production";
import { commitmentStoreFor } from "../commitments/store-env";
import type { CommitmentAction, ReminderReaction } from "../commitments/run";
import type { CommitmentRecord } from "../commitments/store";
import { activeDms } from "./active";
import { modelDmDetector } from "./detector";
import { answerDmAsk, dmAsksDue, dmThreadHook } from "./run";
import type { JobContext } from "../scheduled/runs";

/**
 * The DMs uno-bot answered in since a time, or undefined without the usage
 * database.
 *
 * @param env - Worker bindings
 */
export function activeDmsFor(env: Env): ((since: number) => Promise<ActiveDm[] | null>) | undefined {
  const db = env.USAGE_DB;
  if (!db) return undefined;
  return async (since) => {
    try {
      return await activeDms(db, since);
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[dm-sweep] the DMs could not be listed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };
}

/**
 * The end-of-day per-DM-thread hook, or undefined when the bindings are
 * missing.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` detects and keeps nothing; `runDate` dates what it keeps
 */
export function dmThreadHookFor(
  env: Env,
  opts: JobContext,
): ((thread: DmThread, since: string) => Promise<DmThreadVerdict>) | undefined {
  const store = commitmentStoreFor(env);
  if (!store) return undefined;
  const detector = modelDmDetector(selectProvider(env));
  return dmThreadHook({
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    store,
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}

/**
 * The morning's handler for DM rows, or undefined without the bindings.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` posts and writes nothing
 */
export function dmAsksFor(
  env: Env,
  opts: { dryRun: boolean },
): { due(c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction> } | undefined {
  const store = commitmentStoreFor(env);
  if (!store) return undefined;
  return dmAsksDue({
    store,
    slack: {
      async post(to, message) {
        const res = await postMessage(env, { channel: to.channel, thread_ts: to.threadTs, ...message });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async postCard(to, card, metadata) {
        const rendered = renderProposalCard(card);
        const res = await postMessage(env, {
          channel: to.channel,
          thread_ts: to.threadTs,
          text: rendered.text,
          blocks: rendered.blocks ?? proposalCardBlocks(rendered.text),
          metadata,
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts, text: rendered.text } : { ok: false };
      },
    },
    threadState: threadStateFor(env),
    proposalEvents: proposalEventLogFor(env),
    channels: {
      plusDesign: env.PLUS_DESIGN_CHANNEL_ID,
      plusUniversal: env.PLUS_UNIVERSAL_CHANNEL_ID,
      unoBot: env.UNO_BOT_CHANNEL_ID,
    },
    dryRun: opts.dryRun,
  });
}

/**
 * The reaction door's hand-off for a DM row, or undefined without the
 * bindings.
 *
 * @param env - Worker bindings
 */
export function dmAnswerFor(env: Env): ((c: CommitmentRecord, r: ReminderReaction) => Promise<void>) | undefined {
  const store = commitmentStoreFor(env);
  if (!store) return undefined;
  return answerDmAsk({
    store,
    async update(channel, ts, message) {
      return (await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks })).ok;
    },
    now: () => Date.now(),
  });
}
