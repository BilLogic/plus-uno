// DM Capture on `Env` (`./capture.ts`).
//
// What each port becomes:
//   • The records, the owner's own-token reads and a night's progress: DM
//     watch's own (`./env.ts`).
//   • The queue: HARNESS_KV, one key per person (`dmCaptureQueueFor`).
//   • The pages, the search and the two detectors: the sweep's
//     (`sweep/env.ts`), each read measured so a short read throws as the
//     budget stop it was.
//   • The report: `conversations.open` for the owner's DM with uno-bot,
//     `chat.postMessage` and `chat.update` there, its record in ThreadState,
//     and `stageSweepCard` for each fix — a staged row on the usage record
//     that names no channel, since it is a DM.
//
// A Worker without USAGE_DB or HARNESS_KV keeps no switches and runs no job.

import type { Env } from "../types";
import { selectProvider } from "../agent/run-agent";
import { budgetHeadroom } from "../net";
import { conversationsHistorySince, conversationsOpen, getBotIdentity, postMessage, updateMessage } from "../slack/api";
import { SWEEP_CARD_EVENT } from "../sweep/cards";
import { refusedForBlocks } from "../slack/delivery";
import { threadStateFor } from "../thread-state/production";
import { proposalEventLogFor } from "../usage/production";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import { modelCaptureDetector } from "../sweep/capture-detector";
import { modelDriftDetector } from "../sweep/detector";
import { measured, readSource, sweepSearchFor } from "../sweep/env";
import { stageSweepCard, sweepCardState } from "../sweep/run";
import { runDmCapturePost, runDmCaptureRead, type DmCaptureReport } from "./capture";
import { dmCaptureHoldsFor, dmCaptureQueueFor, dmWatchRecordsFor, ownerSlackFor, progressIn, removeCaptureCard, withdrawCaptureCard } from "./env";
import { CAPTURE_FEATURE } from "./store";

/** Everyone with DM Capture on, for the scheduled firing; none when unbound. */
export async function dmCapturersFor(env: Env): Promise<string[]> {
  return (await dmWatchRecordsFor(env)?.watchers([CAPTURE_FEATURE])) ?? [];
}

/** The end-of-day `dm-capture-read` job on `Env`. */
export async function runDmCaptureReadOnEnv(env: Env, job: ScheduledJob, opts: JobContext): Promise<DmCaptureReport | { summary: string }> {
  const records = dmWatchRecordsFor(env);
  const queue = dmCaptureQueueFor(env);
  const holds = dmCaptureHoldsFor(env);
  if (!records || !queue || !holds || !env.HARNESS_KV) return { summary: "USAGE_DB or HARNESS_KV not bound — no DM Capture" };
  const provider = selectProvider(env);
  const detector = modelDriftDetector(provider);
  const capture = modelCaptureDetector(provider);
  const bot = await measured(() => getBotIdentity(env));
  return runDmCaptureRead(job, {
    records,
    queue,
    ownerSlack: ownerSlackFor(env),
    botUserId: bot?.userId ?? null,
    progress: progressIn(env.HARNESS_KV),
    holds,
    sources: { read: (url, kind) => measured(() => readSource(env, url, kind)) },
    surfaces: {
      runningNotesDb: env.NOTION_RUNNING_NOTES_DB_ID?.trim() || undefined,
      // The team surfaces a search hit may come from, as the sweep reads them.
      teamSurfaceDbs: [
        env.NOTION_ROADMAP_DB_ID,
        env.NOTION_HELP_TUTORS_DB_ID,
        env.NOTION_HELP_TEACHERS_DB_ID,
        env.NOTION_DECISIONS_DB_ID,
        env.NOTION_MARKETPLACE_DB_ID,
      ].flatMap((id) => (id?.trim() ? [id.trim()] : [])),
    },
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    capture: { answers: (input) => measured(() => capture.answers(input)) },
    // Notion only: a DM's words never go to GitHub code search.
    search: { notion: sweepSearchFor(env).notion },
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}

/** The morning `dm-capture-post` job on `Env`. */
export async function runDmCapturePostOnEnv(env: Env, job: ScheduledJob, opts: JobContext): Promise<DmCaptureReport | { summary: string }> {
  const records = dmWatchRecordsFor(env);
  const queue = dmCaptureQueueFor(env);
  if (!records || !queue) return { summary: "USAGE_DB or HARNESS_KV not bound — no DM Capture" };
  return runDmCapturePost(job, {
    records,
    queue,
    bot: {
      dmChannel: (userId) => conversationsOpen(env, userId),
      async post(channel, message) {
        const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks, metadata: message.metadata });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false, refused: refusedForBlocks(res) };
      },
      async edit(channel, ts, message) {
        await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
      },
      withdraw: (channel, ts, ids, note) => withdrawCaptureCard(env, channel, ts, ids, note),
      remove: (channel, ts, ids) => removeCaptureCard(env, channel, ts, ids),
      async findPosted(channel, cardKey, since) {
        // One page of the DM's top level since the run's date: the job's card
        // is among the first messages uno-bot posts there that morning.
        const res = await measured(() => conversationsHistorySince(env, channel, since, undefined, { includeMetadata: true }));
        if (!res.ok) return "unknown";
        const hit = (res.messages ?? []).find(
          (m) => m.metadata?.event_type === SWEEP_CARD_EVENT && m.metadata.event_payload.card_key === cardKey && m.metadata.event_payload.role === "card",
        );
        if (hit) {
          const digest = hit.metadata?.event_payload.digest;
          return { ts: hit.ts, digest: typeof digest === "string" ? digest : "" };
        }
        return res.response_metadata?.next_cursor ? "unknown" : null;
      },
    },
    reports: threadStateFor(env),
    stage: (proposal) =>
      stageSweepCard(proposal, { threadState: threadStateFor(env), proposalEvents: proposalEventLogFor(env) }, Date.now(), "dm"),
    liveCards: (channel) => threadStateFor(env).getProposalsByChannel(channel),
    cardState: (proposalTs) => sweepCardState(proposalTs, { threadState: threadStateFor(env), proposalEvents: proposalEventLogFor(env) }),
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}
