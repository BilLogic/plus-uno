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
 * sweep's two: one end-of-day `sweep-channel` job per swept channel reads the
 * day and keeps its drift findings, and the morning `sweep-post` stages them as
 * proposal cards (src/sweep/).
 */
export type ScheduledJobKind =
  | "noop"
  | "figma-library-poll"
  | "figma-library-post"
  | "figma-library-track"
  | "sweep-channel"
  | "sweep-post";

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
  /** The channel a `sweep-channel` job reads. */
  readonly channel?: string;
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

/**
 * Every run's jobs. A publish found at the end of the day is posted the next
 * morning, like every proactive job; the tracker follows cards already posted.
 */
const RUN_PLANS: Record<ScheduledRunName, readonly ScheduledJob[]> = {
  morning: [
    { key: "figma-library-post", kind: "figma-library-post" },
    { key: "figma-library-track", kind: "figma-library-track" },
    { key: "sweep-post", kind: "sweep-post" },
  ],
  "end-of-day": [{ key: "figma-library-poll", kind: "figma-library-poll" }],
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
 * A run, planned for the UTC date of `at`. The end-of-day run adds one
 * `sweep-channel` job per swept channel after its fixed jobs, keyed
 * `sweep:<channel>`.
 *
 * @param name - Which run
 * @param at - When it fires, epoch ms
 * @param sweepChannels - The channels to sweep (`sweepChannelsFrom`)
 */
export function planRun(name: ScheduledRunName, at: number, sweepChannels: readonly string[] = []): ScheduledRun {
  const sweeps: ScheduledJob[] =
    name === "end-of-day"
      ? sweepChannels.map((channel) => ({ key: `sweep:${channel}`, kind: "sweep-channel", channel }))
      : [];
  return { name, date: new Date(at).toISOString().slice(0, 10), jobs: [...RUN_PLANS[name], ...sweeps] };
}

/**
 * The channels the end-of-day sweep reads, from `SWEEP_CHANNELS` — a
 * comma-separated list of channel ids, and the one line to grow when uno-bot
 * joins another design channel. #uno-bot is never swept, whatever the list
 * says: it is where the team reports problems with uno-bot, not a design
 * channel. A DM id (`D…`) is never read either; a private channel on the list
 * is refused by the job itself, which is the one that can ask Slack.
 *
 * @param value - `SWEEP_CHANNELS`
 * @param unoBotChannel - `UNO_BOT_CHANNEL_ID`
 */
export function sweepChannelsFrom(value: string | undefined, unoBotChannel?: string): string[] {
  const never = unoBotChannel?.trim();
  const ids = (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id && id !== never && !id.startsWith("D"));
  return [...new Set(ids)];
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
  /** The channels the end-of-day run sweeps (`sweepChannelsFrom`). */
  sweepChannels?: readonly string[];
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
  const runs = runsForFiring(scheduledTime).map((name) => planRun(name, scheduledTime, deps.sweepChannels));
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
