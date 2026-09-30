// What each scheduled job kind does, and how a run reaches its runner.
//
// A job body is paired with its kind as a `Record<ScheduledJobKind, JobBody>`,
// the way Diagnostics pairs a route with its probe: a kind with no body fails
// the typecheck rather than failing at 22:00. Every body takes a `JobContext`:
// `dryRun`, because `/debug/sweep?dry_run=1` runs the bodies in the probe's own
// invocation, and under a dry run a body reads and spends as it would but
// writes nothing; and `runDate`, the date of the run the job was queued under,
// which a body dates its records, skips and labels with instead of the clock's
// UTC date (`JobContext` says why). What
// a body returns is its report, which the rehearsal shows beside the job's
// reading — the sweep's findings and card text among them.
import type { Env } from "../types";
import { charge } from "../net";
import { runFigmaPoll } from "../figma-poll";
import { selectProvider } from "../agent/run-agent";
import { runClassifyBatch, runTextPurge } from "../usage/classify-run";
import { askCategoriesFor, proposalEventLogFor, runTeamRolesSync } from "../usage/production";
import { runLibraryPost, runLibraryTrack } from "../figma-library/env";
import { runDsPrecedenceCheck, runDsPrecedencePost } from "../ds-precedence/env";
import { runSweepJobOnEnv } from "../sweep/env";
import { commitmentThreadHookFor, runCommitmentNudgesOnEnv } from "../commitments/env";
import { cardTodoNoteHookFor, cardTodoThreadHookFor, runCardFollowThroughOnEnv } from "../follow-through/env";
import type { SweepThread } from "../sweep/finding";
import type { SweepDeps } from "../sweep/run";
import { fileDriftSinkFor, runDriftAsksOnEnv } from "../figma-drift/env";
import { dmThreadHookFor } from "../dm-sweep/env";
import { runProposalExpiry } from "../usage/index";
import { runAskResolution } from "../usage/resolution-env";
import {
  FIRST_ASK_RESOLUTION_KEY,
  runnerNameForRun,
  type JobContext,
  type ScheduledJob,
  type ScheduledJobKind,
  type ScheduledRun,
} from "./runs";

/** One job kind's work, answering with its report. Resolving is done; a
 *  budget stop is thrown through. */
export type JobBody = (env: Env, job: ScheduledJob, ctx: JobContext) => Promise<unknown>;

/** Every sweep kind: one body, since `runSweepJob` tells them apart. The
 *  end-of-day channel read hands each thread to card to-dos and commitment
 *  reminders too — that kind only: both cover channel threads, not group DMs
 *  or any other conversation a sweep kind may read. The notes job hands each
 *  team note to card to-dos. */
const sweepBody: JobBody = async (env, job, ctx) => {
  // Drift in a file uno-bot cannot write, queued for the morning's ask.
  // Never a DM's: what a DM finds stays in it, and a drafted intake would not.
  const fileDrift = job.kind === "sweep-post" || job.kind === "sweep-dms" ? undefined : fileDriftSinkFor(env);
  const report = await runSweepJobOnEnv(env, job, ctx, {
    ...sweepHooks(env, job, ctx),
    ...(fileDrift ? { fileDrift } : {}),
  });
  console.log(`[sweep] ${job.key}: ${report.summary}`);
  return report;
};

/** The hooks a sweep job feeds: per thread for a channel read, per note for
 *  the notes job, per DM thread for the DM job, none otherwise. */
export function sweepHooks(env: Env, job: ScheduledJob, ctx: JobContext): Pick<SweepDeps, "onThread" | "onNote" | "onDmThread"> {
  if (job.kind === "sweep-channel") {
    const onThread = threadHooks(env, ctx);
    return onThread ? { onThread } : {};
  }
  if (job.kind === "sweep-notes") {
    const onNote = cardTodoNoteHookFor(env, ctx);
    return onNote ? { onNote } : {};
  }
  if (job.kind === "sweep-dms") {
    const onDmThread = dmThreadHookFor(env, ctx);
    return onDmThread ? { onDmThread } : {};
  }
  return {};
}

/** The per-thread hooks the end-of-day channel read feeds, one after the
 *  other; each swallows its own failures and throws only a budget stop. Card
 *  to-dos first, so a message kept as one is passed over as a promise. */
export function threadHooks(env: Env, ctx: JobContext): ((thread: SweepThread, since: string) => Promise<void>) | undefined {
  const hooks = [cardTodoThreadHookFor(env, ctx), commitmentThreadHookFor(env, ctx)].filter(
    (h): h is (thread: SweepThread, since: string) => Promise<void> => !!h,
  );
  if (!hooks.length) return undefined;
  return async (thread, since) => {
    for (const hook of hooks) await hook(thread, since);
  };
}

const JOB_BODIES: Record<ScheduledJobKind, JobBody> = {
  // Proves the path end to end — the enqueue, one alarm, the done marker —
  // and spends nothing.
  noop: async () => {},
  // End of day: diff the DS file against the snapshot and keep what changed
  // for the morning (src/figma-poll.ts).
  "figma-library-poll": async (env, _job, { dryRun }) => {
    console.log(`[figma-poll] ${(await runFigmaPoll(env, { dryRun })).summary}`);
  },
  // Morning: each change set becomes one card in #plus-universal.
  "figma-library-post": async (env, _job, { dryRun }) => {
    console.log(`[figma-library] post: ${(await runLibraryPost(env, { dryRun })).summary}`);
  },
  // Morning: link each posted card's PR, and close its intake on merge.
  "figma-library-track": async (env, _job, { dryRun }) => {
    console.log(`[figma-library] track: ${(await runLibraryTrack(env, { dryRun })).summary}`);
  },
  // End of day, one per swept channel: read the day, keep its drift findings
  // for the morning (src/sweep/run.ts).
  "sweep-channel": sweepBody,
  // End of day: the same, for every group DM uno-bot is in.
  "sweep-group-dms": sweepBody,
  // End of day: each 1:1 DM uno-bot answered in, for the next morning's asks
  // in that DM (src/dm-sweep/).
  "sweep-dms": sweepBody,
  // End of day: decisions recorded in the running notes and on Roadmap cards
  // edited that day (src/sweep/records.ts).
  "sweep-notes": sweepBody,
  "sweep-cards": sweepBody,
  // Morning: the findings whose morning has come become proposal cards.
  "sweep-post": sweepBody,
  // End of day: label one batch of the channel asks still holding text, and
  // null that text in the same write. Counts only — never the model's words.
  "usage-classify": async (env, job, { dryRun }) => {
    const store = askCategoriesFor(env);
    if (!store) return;
    const r = await runClassifyBatch({ store, provider: selectProvider(env), now: () => Date.now(), dryRun });
    const verb = dryRun ? "would label" : "labelled";
    console.log(
      `[usage] ${job.key}: ${verb} ${r.labelled} ask(s) (${r.blank} blank), ${r.failed} failed, ${r.givenUp} given up`,
    );
  },
  // Both runs: text past the purge cutoff goes, whatever happened to it.
  "usage-text-purge": async (env, _job, { dryRun }) => {
    const store = askCategoriesFor(env);
    if (!store) return;
    const cleared = await runTextPurge({ store, now: () => Date.now(), dryRun });
    console.log(`[usage] text purge: ${dryRun ? "dry run, nothing cleared" : `${cleared} row(s) cleared`}`);
  },
  // End of day: 24 h on, record how each ask was resolved (src/usage/resolution-pass.ts).
  // A dry run rehearses one of them: the rest would re-read the same asks.
  "ask-resolution": async (env, job, { dryRun }) => {
    const first = job.key === FIRST_ASK_RESOLUTION_KEY;
    if (dryRun && !first) return;
    console.log(`[resolution] ${(await runAskResolution(env, { dryRun, announce: first })).summary}`);
  },
  // End of day: every card that aged out with no outcome gets its `expired`
  // event, dated to when it aged out. Idempotent, so a retried alarm adds none.
  "proposal-expiry": async (env, _job, { dryRun }) => {
    const { summary } = await runProposalExpiry(proposalEventLogFor(env), Date.now(), { dryRun });
    console.log(`[usage] proposal expiry: ${summary}`);
  },
  // Friday's end of day: compare code with the library and keep the
  // disagreements for the morning (src/ds-precedence/).
  "ds-precedence-check": async (env, _job, ctx) => {
    console.log(`[ds-precedence] check: ${(await runDsPrecedenceCheck(env, ctx)).summary}`);
  },
  // Morning: each due commitment is checked for completion, then nudged in its
  // thread (src/commitments/).
  "commitment-nudge": async (env, job, ctx) => {
    const report = await runCommitmentNudgesOnEnv(env, job, ctx);
    console.log(`[commitments] ${job.key}: ${report.summary}`);
    return report;
  },
  // Morning: each file drift the sweep kept is asked about in its thread, with
  // one drafted intake per file (src/figma-drift/).
  "figma-drift-post": async (env, job, { dryRun }) => {
    const report = await runDriftAsksOnEnv(env, job, { dryRun });
    console.log(`[figma-drift] ${job.key}: ${report.summary}`);
    return report;
  },
  // Morning: the kickoff role map, rebuilt from the Notion Team Members
  // database into KV. Counts in the log; a dry run's report lists the names
  // that matched no one (src/usage/team-roles-sync.ts).
  "team-roles-sync": async (env, _job, { dryRun }) => {
    const report = await runTeamRolesSync(env, { dryRun });
    console.log(`[usage] team roles: ${report.summary}`);
    return report;
  },
  // End of day: each active Roadmap card nobody owns, or that has stopped
  // moving, becomes a follow-up the morning asks about (src/follow-through/).
  "card-follow-through": async (env, job, ctx) => {
    const report = await runCardFollowThroughOnEnv(env, job, ctx);
    console.log(`[follow-through] ${job.key}: ${report.summary}`);
    return report;
  },
  // Morning: a waiting report becomes one thread and one card in #plus-universal.
  "ds-precedence-post": async (env, _job, { dryRun }) => {
    console.log(`[ds-precedence] post: ${(await runDsPrecedencePost(env, { dryRun })).summary}`);
  },
};

/**
 * Run one scheduled job's body.
 *
 * @param env - The Worker environment
 * @param job - The job
 * @param ctx - `dryRun` for the sweep probe, and the run's date
 */
export async function runScheduledJob(env: Env, job: ScheduledJob, ctx: JobContext): Promise<void> {
  await JOB_BODIES[job.kind](env, job, ctx);
}

/**
 * Rehearse one scheduled job, answering with its report — the probe's form.
 *
 * @param env - The Worker environment
 * @param job - The job
 * @param runDate - The rehearsed run's date
 */
export function rehearseScheduledJob(env: Env, job: ScheduledJob, runDate: string): Promise<unknown> {
  return JOB_BODIES[job.kind](env, job, { dryRun: true, runDate });
}

/**
 * Put a planned run on its own AgentRunner instance. One Durable Object hop —
 * all the scheduled handler spends, which is what fits its CPU limit.
 *
 * @param env - Carries the AGENT_RUNNER binding
 * @param run - The planned run
 * @throws When the runner refuses the enqueue, so the firing logs it
 */
export async function enqueueScheduledRun(env: Env, run: ScheduledRun): Promise<void> {
  const stub = env.AGENT_RUNNER.get(env.AGENT_RUNNER.idFromName(runnerNameForRun(run.name)));
  charge(1, "agent-runner"); // DO stub call — a subrequest the meter can't see.
  const res = await stub.fetch("https://do/enqueue-run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(run),
  });
  if (!res.ok) throw new Error(`runner refused the enqueue: ${res.status}`);
  const { queued } = (await res.json()) as { queued: number };
  console.log(`[scheduled] ${run.name} ${run.date}: ${queued} of ${run.jobs.length} job(s) queued`);
}
