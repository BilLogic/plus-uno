// Scheduled runs: which firing starts one, what it holds, and where it queues.
//
// No cron is added for them. The free plan caps an account at five cron
// triggers, and the weekday `*/15 13-23 * * 1-5` trigger already fires at the
// two times a run needs — 14:00 UTC (the morning run) and 22:00 UTC (the
// end-of-day run). So a firing reads its own scheduled time and enqueues the
// matching run; every other firing does nothing. The Figma library poll that
// once ran on every firing is the end-of-day run's `figma-library-poll` job.
// The wrangler.toml cron comment gives the ET times.
//
// The handler only ENQUEUES. A scheduled invocation gets about 10 ms of CPU,
// and a run's work belongs on its runner, where each alarm runs one job with a
// fresh subrequest budget (src/runner/queue.ts).
//
// Free of `Env` and Workers globals, so the Node suite drives the whole firing
// through its two named dependencies (tests/scheduled-firing.test.ts).

/** The two runs a weekday holds. */
export type ScheduledRunName = "morning" | "end-of-day";

/**
 * What a scheduled job does. `noop` proves the path and does nothing else.
 * The Figma library's three: the end-of-day poll finds a publish, the morning
 * post turns it into a card in #plus-universal, and the morning track follows
 * each posted card to its PR (src/figma-poll.ts, src/figma-library/). The
 * weekly DS precedence check's two: Friday's end-of-day check, and the morning
 * post that opens its thread in #plus-universal (src/ds-precedence/).
 */
export type ScheduledJobKind =
  | "noop"
  | "figma-library-poll"
  | "figma-library-post"
  | "figma-library-track"
  | "ds-precedence-check"
  | "ds-precedence-post";

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
  /** The UTC weekday (0 Sunday … 6 Saturday) the job is planned on; absent,
   *  every day its run fires. */
  readonly weekday?: number;
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

/** Friday, as `Date.getUTCDay` numbers it. */
const FRIDAY = 5;

/**
 * Every run's jobs. A publish found at the end of the day is posted the next
 * morning, like every proactive job; the tracker follows cards already posted.
 *
 * The DS precedence check is weekly, on FRIDAY's end-of-day run: the week's
 * merges and any library publish have landed, so it reads where the week
 * ended, and its thread opens Monday's morning run — the start of the week
 * the team has to act on it, with the card live until the next check. It runs
 * after the library poll, so a publish found that evening is already among
 * the components it leaves to the library flow. Its post is on every morning,
 * not only Monday's: a report waits in KV until a morning posts it.
 */
const RUN_PLANS: Record<ScheduledRunName, readonly ScheduledJob[]> = {
  morning: [
    { key: "figma-library-post", kind: "figma-library-post" },
    { key: "figma-library-track", kind: "figma-library-track" },
    { key: "ds-precedence-post", kind: "ds-precedence-post" },
  ],
  "end-of-day": [
    { key: "figma-library-poll", kind: "figma-library-poll" },
    { key: "ds-precedence-check", kind: "ds-precedence-check", after: ["figma-library-poll"], weekday: FRIDAY },
  ],
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

/** Weekday names as a caller spells them, in `Date.getUTCDay` order. */
export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * A run, planned for the UTC date of `at`: its jobs for that weekday, or for
 * `weekday` when given — how the sweep probe rehearses Friday's jobs on a
 * Tuesday. The date stays `at`'s.
 *
 * @param name - Which run
 * @param at - When it fires, epoch ms
 * @param weekday - Plan this weekday's jobs instead (0 Sunday … 6 Saturday)
 */
export function planRun(name: ScheduledRunName, at: number, weekday?: number): ScheduledRun {
  const d = new Date(at);
  const day = weekday ?? d.getUTCDay();
  const jobs = RUN_PLANS[name].filter((job) => job.weekday === undefined || job.weekday === day);
  return { name, date: d.toISOString().slice(0, 10), jobs };
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
  /** Put a planned run on its runner. */
  enqueueRun(run: ScheduledRun): Promise<void>;
}

/**
 * One cron firing: the run anchored to this slot, if any.
 *
 * A failure is logged and swallowed: the handler has already handed its work
 * to `waitUntil`, and nothing downstream would act on a rejection.
 *
 * @param scheduledTime - The firing's scheduled time, epoch ms
 * @param deps - The enqueue
 */
export async function onScheduledFiring(scheduledTime: number, deps: FiringDeps): Promise<void> {
  const runs = runsForFiring(scheduledTime).map((name) => planRun(name, scheduledTime));
  await Promise.all(
    runs.map((run) =>
      deps.enqueueRun(run).catch((err: unknown) => {
        console.error(`[scheduled] ${run.name} ${run.date} enqueue failed: ${message(err)}`);
      }),
    ),
  );
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
