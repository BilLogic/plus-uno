// The AgentRunner's scheduling, over its storage port.
//
// Two queues, one rule. A THREAD runner (named `${channel}:${thread_ts}`)
// drains a person's turns, reactions and cut-off runs; a RUN runner (named by
// `runnerNameForRun`) drains a scheduled run's jobs. Either way an alarm runs
// ONE job: free-tier Workers cap subrequests at 50 per invocation, a single
// agent turn spends most of that, and a second job in the same firing blew the
// cap live (2026-07-10: "Too many subrequests"), killing the first job's reply.
// Each firing gets a fresh budget, so the queue is drained one job per firing.
//
// The Durable Object (src/agent-runner.ts) is a shell over this file: it hands
// in `state.storage` and the job bodies. The in-memory runner
// (./storage.ts) hands in a map, and tests/runner-queue.test.ts drives the
// ordering rules against it.
//
// A job is never rethrown out of here: a thrown alarm is auto-retried, which
// would re-run a possibly half-delivered turn. The pipeline's own visible
// failure posts remain the user-facing error path.

import type { RunnerJobPayload } from "../slack/types";
import type { ScheduledJob, ScheduledRun, ScheduledRunName } from "../scheduled/runs";
// The retry cadence for a deferred job is one HALF of a single rule — how long
// a lease is trusted (`RUN_LEASE_MS`) and how often a deferred job comes back
// to test it — and the whole rule lives in ThreadState (#494).
import { DEFER_RETRY_MS } from "../thread-state/index";
import { LOOKUP_CEILING } from "../agent/loop-policy";
import { isSubrequestBudgetError, subrequestBudgetTrips, withSubrequestLimit } from "../net";
import type { RunnerStorage } from "./storage";

/** A thread job as it is stored. */
export interface RunnerJob {
  job: RunnerJobPayload;
  enqueuedAt: number;
}

/** A scheduled job as it is stored, with the run it belongs to. */
interface QueuedRunJob {
  run: ScheduledRunName;
  date: string;
  job: ScheduledJob;
  /** How many times the budget has cut it short. */
  deferrals: number;
}

const JOB_PREFIX = "job:";
/** `run:<date>:<position>:<key>` — date, then plan position, orders the queue. */
const RUN_PREFIX = "run:";
/** `done:<date>:<key>` — what makes a re-enqueued run add nothing. */
const DONE_PREFIX = "done:";

/**
 * How many times the budget may cut one scheduled job short before the run
 * gives up on it. Each retry is a fresh budget, so a job that trips this often
 * does more than one alarm can hold, and retrying it every two minutes for the
 * rest of the day would only hold up the jobs behind it.
 */
export const MAX_JOB_DEFERRALS = 3;

/** What a job resolves to. `deferred` keeps it; `handled` drops it. */
export type JobOutcome = "handled" | "deferred";

/** The job bodies and clock the queue runs with, by name. */
export interface RunnerDeps {
  now(): number;
  /** A person's turn, a reaction or a cut-off run. */
  runThreadJob(job: RunnerJobPayload): Promise<JobOutcome>;
  /** One scheduled job. Resolving is done; a budget stop is caught here. */
  runScheduledJob(job: ScheduledJob): Promise<void>;
}

/**
 * Queue a thread job and make sure an alarm will pick it up.
 *
 * @param storage - The runner's storage
 * @param job - The payload and when it was enqueued
 * @param now - Epoch ms
 */
export async function enqueueThreadJob(storage: RunnerStorage, job: RunnerJob, now: number): Promise<void> {
  // Monotonic-enough key: jobs drain in enqueue order within the thread.
  const key = `${JOB_PREFIX}${String(job.enqueuedAt).padStart(15, "0")}:${crypto.randomUUID()}`;
  await storage.put(key, job);
  if ((await storage.getAlarm()) === null) await storage.setAlarm(now);
}

/**
 * Queue a scheduled run, idempotently per (run date, job key).
 *
 * Alarms are at-least-once and a cron can fire twice, so a job already pending
 * or already done for this date is not queued again. Done markers from other
 * dates are dropped here, which keeps the instance's storage to one day's.
 *
 * @param storage - The run's runner's storage
 * @param run - The planned run
 * @param now - Epoch ms
 * @returns How many jobs were newly queued
 */
export async function enqueueRun(storage: RunnerStorage, run: ScheduledRun, now: number): Promise<number> {
  const pending = new Set(
    [...(await storage.list<QueuedRunJob>({ prefix: `${RUN_PREFIX}${run.date}:` })).values()].map((q) => q.job.key),
  );
  const done = await storage.list<true>({ prefix: DONE_PREFIX });
  for (const key of done.keys()) {
    if (!key.startsWith(`${DONE_PREFIX}${run.date}:`)) await storage.delete(key);
  }

  let queued = 0;
  for (const [position, job] of run.jobs.entries()) {
    if (pending.has(job.key) || done.has(doneKey(run.date, job.key))) continue;
    const entry: QueuedRunJob = { run: run.name, date: run.date, job, deferrals: 0 };
    await storage.put(`${RUN_PREFIX}${run.date}:${String(position).padStart(4, "0")}:${job.key}`, entry);
    queued += 1;
  }
  if (queued > 0 && (await storage.getAlarm()) === null) await storage.setAlarm(now);
  return queued;
}

/**
 * The first job that may run now: in queue order, passing over an assemble
 * job while any job it waits on is still pending in its run. A dependency the
 * run no longer holds counts as done — including one that failed or was given
 * up, so an assemble job works with what its run produced rather than waiting
 * forever.
 *
 * Shared with the dry run, so a rehearsal runs jobs in the order the runner
 * would.
 *
 * @param queue - Pending jobs, in queue order, with their run date
 * @returns Its index, or -1 when every pending job is waiting
 */
export function nextRunnable(queue: readonly { date: string; job: ScheduledJob }[]): number {
  return queue.findIndex(({ date, job }) =>
    (job.after ?? []).every((dep) => !queue.some((q) => q.date === date && q.job.key === dep)),
  );
}

/**
 * Run one job body under the lookup ceiling, and say whether it finished.
 *
 * The ceiling is ADR-022's: lookups stop at `LOOKUP_CEILING` of the 50, and
 * the call that would cross it throws. A job the ceiling stopped is DEFERRED,
 * not done — whether the stop reached here as a throw or a paging loop
 * returned a partial result cleanly, which is why the trip counter is read on
 * both sides rather than trusting the catch alone.
 *
 * @param fn - The job body
 * @param limit - The invocation's running-count ceiling: `LOOKUP_CEILING` on an
 *   alarm's fresh meter, what earlier jobs left in a rehearsal
 * @returns `handled`, `deferred`, or `failed` for any other error (logged)
 */
export async function runWithinCeiling(
  fn: () => Promise<void>,
  limit: number = LOOKUP_CEILING,
): Promise<JobOutcome | "failed"> {
  const tripsBefore = subrequestBudgetTrips();
  try {
    await withSubrequestLimit(limit, fn);
  } catch (err) {
    if (isSubrequestBudgetError(err)) return "deferred";
    console.error(`[runner] scheduled job failed: ${err instanceof Error ? err.message : String(err)}`);
    return "failed";
  }
  return subrequestBudgetTrips() > tripsBefore ? "deferred" : "handled";
}

/**
 * One alarm firing: run the next job, then set the alarm for the one after.
 *
 * @param storage - The runner's storage
 * @param deps - The job bodies and the clock
 */
export async function runOneJob(storage: RunnerStorage, deps: RunnerDeps): Promise<void> {
  const threadJobs = await storage.list<RunnerJob>({ prefix: JOB_PREFIX, limit: 1 });
  if (threadJobs.size > 0) {
    await drainThreadJob(storage, deps, threadJobs);
    return;
  }
  await drainScheduledJob(storage, deps);
}

async function drainThreadJob(storage: RunnerStorage, deps: RunnerDeps, jobs: Map<string, RunnerJob>): Promise<void> {
  for (const [key, job] of jobs) {
    let outcome: JobOutcome = "handled";
    try {
      outcome = await deps.runThreadJob(job.job);
    } catch (err) {
      // Never rethrow: alarm retries would re-run the agent turn.
      console.error(`[runner] job failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (outcome === "deferred") {
      // The turn's run-lease is held elsewhere. Deleting here is how killed
      // runs used to go permanently silent — instead KEEP the job and check
      // back: it resolves to "done" (drop) or a stale-lease reclaim (re-run).
      console.log("[runner] job deferred — run-lease held; retrying in 2 min");
      await storage.setAlarm(deps.now() + DEFER_RETRY_MS);
      return;
    }
    await storage.delete(key);
  }
  // More queued (the drained job's sibling duplicate, or new arrivals):
  // process them in a fresh invocation with a fresh subrequest budget.
  const remaining = await storage.list({ prefix: JOB_PREFIX, limit: 1 });
  if (remaining.size > 0) await storage.setAlarm(deps.now());
}

async function drainScheduledJob(storage: RunnerStorage, deps: RunnerDeps): Promise<void> {
  const entries = [...(await storage.list<QueuedRunJob>({ prefix: RUN_PREFIX })).entries()];
  const index = nextRunnable(entries.map(([, q]) => q));
  if (index < 0) {
    if (entries.length > 0) {
      // Only reachable through a plan whose jobs wait on each other: nothing
      // can ever run, so say so rather than spin.
      console.error(`[runner] ${entries.length} scheduled job(s) wait on each other; none can run`);
    }
    return;
  }
  const [key, queued] = entries[index]!;
  const label = `${queued.run} ${queued.date} ${queued.job.key}`;
  const outcome = await runWithinCeiling(() => deps.runScheduledJob(queued.job));

  if (outcome === "deferred" && queued.deferrals + 1 < MAX_JOB_DEFERRALS) {
    // Kept under the same key, so it is still first in line: it runs again
    // before any job queued after it, on a fresh budget.
    await storage.put(key, { ...queued, deferrals: queued.deferrals + 1 });
    console.log(`[runner] ${label} deferred — budget stopped it; retrying in 2 min`);
    await storage.setAlarm(deps.now() + DEFER_RETRY_MS);
    return;
  }
  if (outcome === "deferred") {
    console.error(`[runner] ${label} given up after ${MAX_JOB_DEFERRALS} budget stops`);
  } else if (outcome === "handled") {
    await storage.put(doneKey(queued.date, queued.job.key), true);
  }
  // A failed job is dropped without a done marker: re-enqueuing its run is how
  // it is tried again.
  await storage.delete(key);

  if (entries.length > 1) await storage.setAlarm(deps.now());
}

function doneKey(date: string, key: string): string {
  return `${DONE_PREFIX}${date}:${key}`;
}
