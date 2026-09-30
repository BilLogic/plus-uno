// DM Capture on `Env` (`./capture.ts`).
//
// What each port becomes:
//   • The records, the owner's own-token reads and a night's progress: DM
//     watch's own (`./env.ts`).
//   • The queue: HARNESS_KV, one key per person (`dmCaptureQueueFor`).
//   • The pages, the search and the two detectors: the sweep's
//     (`sweep/env.ts`), each read measured so a short read throws as the
//     budget stop it was.
//   • The card: the proposal renderer; `conversations.open` for the owner's DM
//     with uno-bot, `chat.postMessage` there, and `stageSweepCard` — a staged
//     row on the usage record that names no channel, since it is a DM.
//
// A Worker without USAGE_DB or HARNESS_KV keeps no switches and runs no job.

import type { Env } from "../types";
import { selectProvider } from "../agent/run-agent";
import { budgetHeadroom } from "../net";
import { conversationsOpen, getBotIdentity, postMessage, updateMessage } from "../slack/api";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import { threadStateFor } from "../thread-state/production";
import { proposalEventLogFor } from "../usage/production";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import { modelCaptureDetector } from "../sweep/capture-detector";
import { modelDriftDetector } from "../sweep/detector";
import { measured, readSource, sweepSearchFor } from "../sweep/env";
import { stageSweepCard, WITHDRAWN_TEXT } from "../sweep/run";
import { runDmCapturePost, runDmCaptureRead, type DmCaptureReport } from "./capture";
import { dmCaptureQueueFor, dmWatchRecordsFor, ownerSlackFor, progressIn } from "./env";
import { CAPTURE_FEATURE } from "./store";

/** Everyone with DM Capture on, for the scheduled firing; none when unbound. */
export async function dmCapturersFor(env: Env): Promise<string[]> {
  return (await dmWatchRecordsFor(env)?.watchers([CAPTURE_FEATURE])) ?? [];
}

/** The end-of-day `dm-capture-read` job on `Env`. */
export async function runDmCaptureReadOnEnv(env: Env, job: ScheduledJob, opts: JobContext): Promise<DmCaptureReport | { summary: string }> {
  const records = dmWatchRecordsFor(env);
  const queue = dmCaptureQueueFor(env);
  if (!records || !queue || !env.HARNESS_KV) return { summary: "USAGE_DB or HARNESS_KV not bound — no DM Capture" };
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
    search: sweepSearchFor(env),
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
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async withdraw(channel, ts) {
        // Out of reach first: a card that says it didn't go through can't be ✅'d.
        await threadStateFor(env).retireProposal(ts);
        await updateMessage(env, { channel, ts, text: WITHDRAWN_TEXT });
      },
    },
    render(card) {
      const rendered = renderProposalCard(card);
      return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
    },
    stage: (proposal) =>
      stageSweepCard(proposal, { threadState: threadStateFor(env), proposalEvents: proposalEventLogFor(env) }, Date.now(), "dm"),
    async cardLive(proposalTs) {
      return (await threadStateFor(env).getProposalByTs(proposalTs)).state === "found";
    },
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
    runDate: opts.runDate,
  });
}
