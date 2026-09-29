// What each scheduled job kind does, and how a run reaches its runner.
//
// A job body is paired with its kind as a `Record<ScheduledJobKind, JobBody>`,
// the way Diagnostics pairs a route with its probe: a kind with no body fails
// the typecheck rather than failing at 22:00. Every body takes `dryRun`:
// `/debug/sweep?dry_run=1` runs the bodies in the probe's own invocation, and
// under a dry run a body reads and spends as it would but writes nothing.
import type { Env } from "../types";
import { charge } from "../net";
import { runnerNameForRun, type ScheduledJob, type ScheduledJobKind, type ScheduledRun } from "./runs";

/** One job kind's work. Resolving is done; a budget stop is thrown through. */
export type JobBody = (env: Env, job: ScheduledJob, opts: { dryRun: boolean }) => Promise<void>;

const JOB_BODIES: Record<ScheduledJobKind, JobBody> = {
  // Proves the path end to end — the enqueue, one alarm, the done marker —
  // and spends nothing.
  noop: async () => {},
};

/**
 * Run one scheduled job's body.
 *
 * @param env - The Worker environment
 * @param job - The job
 * @param opts - `dryRun` for the sweep probe
 */
export function runScheduledJob(env: Env, job: ScheduledJob, opts: { dryRun: boolean }): Promise<void> {
  return JOB_BODIES[job.kind](env, job, opts);
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
