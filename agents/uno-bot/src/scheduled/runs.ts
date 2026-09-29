// Scheduled runs: which firing starts one, what it holds, and where it queues.
//
// No cron is added for them. The free plan caps an account at five cron
// triggers, and the weekday `*/15 13-23 * * 1-5` trigger the Figma poll runs
// on already fires at the two times a run needs — 14:00 UTC (the morning run)
// and 22:00 UTC (the end-of-day run). So a firing reads its own scheduled time
// and enqueues the matching run BESIDE the poll, which still runs on every
// firing exactly as it did. The wrangler.toml cron comment gives the ET times.
//
// The handler only ENQUEUES. A scheduled invocation gets about 10 ms of CPU,
// and a run's work belongs on its runner, where each alarm runs one job with a
// fresh subrequest budget (src/runner/queue.ts).
//
// Free of `Env` and Workers globals, so the Node suite drives the whole firing
// through its two named dependencies (tests/scheduled-firing.test.ts).

/** The two runs a weekday holds. */
export type ScheduledRunName = "morning" | "end-of-day";

/** What a scheduled job does. `noop` proves the path and does nothing else. */
export type ScheduledJobKind = "noop";

/** One unit of a run — one alarm's work. */
export interface ScheduledJob {
  /** Unique within its run; with the run date, the job's idempotency key. */
  readonly key: string;
  readonly kind: ScheduledJobKind;
  /**
   * Makes this an assemble-type job: the keys of jobs in the same run that must
   * be done first. The runner passes over it while any of them is pending.
   */
  readonly after?: readonly string[];
}

/** A run, planned for one date. */
export interface ScheduledRun {
  readonly name: ScheduledRunName;
  /** The UTC date of the firing, `YYYY-MM-DD`. */
  readonly date: string;
  readonly jobs: readonly ScheduledJob[];
}

/** The UTC hour each run is anchored to. Cron fires on the minute. */
const RUN_HOURS: Record<ScheduledRunName, number> = {
  morning: 14,
  "end-of-day": 22,
};

/** Every run's jobs. Each holds the no-op job until a run has real work. */
const RUN_PLANS: Record<ScheduledRunName, readonly ScheduledJob[]> = {
  morning: [{ key: "noop", kind: "noop" }],
  "end-of-day": [{ key: "noop", kind: "noop" }],
};

/** The run names, for a caller that takes one as input. */
export const RUN_NAMES = Object.keys(RUN_HOURS) as ScheduledRunName[];

/**
 * The runs a firing starts: the one anchored to its hour, when the firing is
 * that hour's :00 slot, and none otherwise.
 *
 * Compared by hour and minute, not to the millisecond, so a `scheduledTime` a
 * few seconds past the slot still lands in it.
 *
 * @param scheduledTime - The firing's scheduled time, epoch ms
 */
export function runsForFiring(scheduledTime: number): ScheduledRunName[] {
  const d = new Date(scheduledTime);
  if (d.getUTCMinutes() !== 0) return [];
  return RUN_NAMES.filter((name) => RUN_HOURS[name] === d.getUTCHours());
}

/**
 * A run, planned for the UTC date of `at`.
 *
 * @param name - Which run
 * @param at - When it fires, epoch ms
 */
export function planRun(name: ScheduledRunName, at: number): ScheduledRun {
  return { name, date: new Date(at).toISOString().slice(0, 10), jobs: RUN_PLANS[name] };
}

/**
 * The AgentRunner instance a run queues on.
 *
 * Its own instance, never a thread's: a thread's runner is named
 * `${channel}:${thread_ts}` and drains one job per alarm, so a run queued on it
 * would put a person's next turn behind every job of the run.
 *
 * @param name - Which run
 */
export function runnerNameForRun(name: ScheduledRunName): string {
  return `scheduled-run/${name}`;
}

/** What a firing needs, by name. */
export interface FiringDeps {
  /** The Figma library poll, as it has always run. */
  pollFigma(): Promise<void>;
  /** Put a planned run on its runner. */
  enqueueRun(run: ScheduledRun): Promise<void>;
}

/**
 * One cron firing: the Figma poll, and the run anchored to this slot if any.
 *
 * Settled side by side, so neither can cost the other: a failed enqueue still
 * polls, and a failed poll still enqueues. Each failure is logged and
 * swallowed, as the poll's always was — a thrown scheduled handler is retried.
 *
 * @param scheduledTime - The firing's scheduled time, epoch ms
 * @param deps - The poll and the enqueue
 */
export async function onScheduledFiring(scheduledTime: number, deps: FiringDeps): Promise<void> {
  const runs = runsForFiring(scheduledTime).map((name) => planRun(name, scheduledTime));
  await Promise.all([
    deps.pollFigma().catch((err: unknown) => {
      console.error(`[figma-poll] failed: ${message(err)}`);
    }),
    ...runs.map((run) =>
      deps.enqueueRun(run).catch((err: unknown) => {
        console.error(`[scheduled] ${run.name} ${run.date} enqueue failed: ${message(err)}`);
      }),
    ),
  ]);
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
