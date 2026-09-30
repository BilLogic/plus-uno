// Scheduled runs: which firing starts one, what it holds, and where it queues.
//
// Two cron triggers of the free plan's five fire at each run's two UTC
// hours — 00:00 ET (the end-of-day run) is 04:00 or 05:00 UTC, Tuesday to
// Saturday, and 09:00 ET (the morning run) 13:00 or 14:00 UTC, Monday to
// Friday — so each run is there whether ET is UTC-4 or UTC-5. A firing reads
// its own scheduled time in ET and enqueues the matching run; the firing an
// hour off does nothing. The end-of-day run is dated to the ET day it sweeps,
// the one that ended at its midnight (`sweptDayOf`). The Figma library poll
// that once ran on every firing is the end-of-day run's `figma-library-poll`
// job. The wrangler.toml cron comment gives the ET times.
//
// The handler only ENQUEUES. A scheduled invocation gets about 10 ms of CPU,
// and a run's work belongs on its runner, where each alarm runs one job with a
// fresh subrequest budget (src/runner/queue.ts).
//
// Free of `Env` and Workers globals, so the Node suite drives the whole firing
// through its two named dependencies (tests/scheduled-firing.test.ts).

import { END_OF_DAY_RUN_HOUR_ET, etDayOf, etParts, MORNING_RUN_HOUR_ET, sweptDayOf } from "../sweep/schedule";
import { CLASSIFY_BATCHES } from "../usage/classify-run";
import { ASK_RESOLUTION_JOBS } from "../usage/resolution-pass";

/** The end-of-day run's first `ask-resolution` job: the one that announces a
 *  missing token, and the one a dry run rehearses. */
export const FIRST_ASK_RESOLUTION_KEY = "ask-resolution-1";

/** The end-of-day job that sweeps every group DM uno-bot is in. */
export const GROUP_DM_SWEEP_KEY = "sweep:group-dms";

/** The end-of-day job that reads each 1:1 DM uno-bot answered in lately. */
export const DM_SWEEP_KEY = "sweep:dms";

/** The end-of-day jobs that read the running notes and the Roadmap cards. */
export const NOTES_SWEEP_KEY = "sweep:notes";
export const CARDS_SWEEP_KEY = "sweep:cards";

/** The two runs a weekday holds. */
export type ScheduledRunName = "morning" | "end-of-day";

/**
 * What a scheduled job does. `noop` proves the path and does nothing else.
 * The Figma library's three: the end-of-day poll finds a publish, the morning
 * post turns it into a card in #plus-universal, and the morning track follows
 * each posted card to its PR (src/figma-poll.ts, src/figma-library/). The
 * usage record's two: the end-of-day classify jobs label a batch of channel
 * asks each, and the purge — in both runs — keeps text under its 14 days
 * (src/usage/classify-run.ts). `ask-resolution` is the end-of-day 24 h pass
 * that records how each ask was resolved (src/usage/resolution-pass.ts).
 * The end-of-day `proposal-expiry` records every card that aged out untouched
 * (src/usage/proposal-events.ts).
 * The sweep's five: one end-of-day `sweep-channel` job per swept channel reads
 * the day and keeps its drift findings, one `sweep-group-dms` job does the
 * same for every group DM uno-bot is in, one `sweep-dms` job reads each 1:1 DM
 * uno-bot answered in for what it could not answer, what it saw disagree and
 * decisions told to it (src/dm-sweep/), `sweep-notes` and `sweep-cards` read
 * the running notes and Roadmap cards edited that day for recorded decisions,
 * and the morning `sweep-post` stages them as proposal cards (src/sweep/).
 * The weekly DS precedence check's two: Friday's end-of-day check, and the morning
 * post that opens its thread in #plus-universal (src/ds-precedence/).
 * The morning `commitment-nudge` reminds each promiser whose commitment is due,
 * in the promise's thread (src/commitments/).
 * The morning `figma-drift-post` asks each thread whose decision may have left
 * a Figma file or code stale whether it is up to date, with a drafted intake
 * (src/figma-drift/).
 * The morning `team-roles-sync` rebuilds the kickoff role map from the Notion
 * Team Members database (src/usage/team-roles-sync.ts).
 * The end-of-day `card-follow-through` keeps a follow-up for each active
 * Roadmap card nobody owns or that has stopped moving; the morning
 * `commitment-nudge` asks about it (src/follow-through/).
 * DM watch's two, one job per person with a promise switch on: the
 * end-of-day `dm-promise-read` reads that person's DMs with their own token,
 * and the morning `dm-promise-nudge` reminds them in their DM with uno-bot
 * (src/dm-watch/). DM Capture's two, one job per person with its switch on:
 * the end-of-day `dm-capture-read` reads their DMs for drift and undocumented
 * answers, and the morning `dm-capture-post` offers the fixes on a card in
 * their DM with uno-bot that only they can confirm (src/dm-watch/capture.ts).
 */
export type ScheduledJobKind =
  | "noop"
  | "figma-library-poll"
  | "figma-library-post"
  | "figma-library-track"
  | "usage-classify"
  | "usage-text-purge"
  | "ask-resolution"
  | "proposal-expiry"
  | "sweep-channel"
  | "sweep-group-dms"
  | "sweep-dms"
  | "sweep-notes"
  | "sweep-cards"
  | "sweep-post"
  | "ds-precedence-check"
  | "ds-precedence-post"
  | "commitment-nudge"
  | "figma-drift-post"
  | "team-roles-sync"
  | "card-follow-through"
  | "dm-promise-read"
  | "dm-promise-nudge"
  | "dm-capture-read"
  | "dm-capture-post";

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
  /** The person a DM watch job reads and reminds for. */
  readonly user?: string;
  /** The UTC weekday (0 Sunday … 6 Saturday) the job is planned on; absent,
   *  every day its run fires. */
  readonly weekday?: number;
}

/**
 * What every job body is handed beside its job.
 *
 * `runDate` is the date the job's records, skips and labels carry, however
 * late it runs. The end-of-day run fires at 00:00 ET, after the day it sweeps
 * has ended, so a date read off the clock would name the wrong day — and a
 * job deferred on a budget stop, or the retry of a half-done one, must keep
 * the date its run was planned under.
 */
export interface JobContext {
  /** Reads and spends as a real run does, and writes nothing. */
  readonly dryRun: boolean;
  /** The date of the run the job was queued under (`ScheduledRun.date`). */
  readonly runDate: string;
}

/** A run, planned for one date. */
export interface ScheduledRun {
  readonly name: ScheduledRunName;
  /** The ET day the run is for, `YYYY-MM-DD`: the morning's own, or the day
   *  the end-of-day run sweeps (`sweptDayOf`). */
  readonly date: string;
  readonly jobs: readonly ScheduledJob[];
}

/** The ET hour each run is anchored to. Cron fires on the minute. */
const RUN_HOURS: Record<ScheduledRunName, number> = {
  morning: MORNING_RUN_HOUR_ET,
  "end-of-day": END_OF_DAY_RUN_HOUR_ET,
};

/** Friday, as `Date.getUTCDay` numbers it. */
const FRIDAY = 5;

/**
 * Every run's jobs. A publish found at the end of the day is posted the next
 * morning, like every proactive job; the tracker follows cards already posted.
 *
 * The DS precedence check is weekly, on FRIDAY's end-of-day run — the one
 * that fires at Saturday 00:00 ET and is dated Friday: the week's merges and
 * any library publish have landed, so it reads where the week ended, and its
 * thread opens Monday's morning run — the start of the week
 * the team has to act on it, with the card live until the next check. It runs
 * after the library poll, so a publish found that evening is already among
 * the components it leaves to the library flow. Its post is on every morning,
 * not only Monday's: a report waits in KV until a morning posts it.
 */
const RUN_PLANS: Record<ScheduledRunName, readonly ScheduledJob[]> = {
  morning: [
    { key: "figma-library-post", kind: "figma-library-post" },
    { key: "figma-library-track", kind: "figma-library-track" },
    { key: "sweep-post", kind: "sweep-post" },
    { key: "ds-precedence-post", kind: "ds-precedence-post" },
    { key: "commitment-nudge", kind: "commitment-nudge" },
    { key: "figma-drift-post", kind: "figma-drift-post" },
    { key: "team-roles-sync", kind: "team-roles-sync" },
    // Both runs purge, so no text outlives 14 days across a weekend and one
    // missed run (src/usage/classify-run.ts `PURGE_AFTER_MS`).
    { key: "usage-text-purge", kind: "usage-text-purge" },
  ],
  "end-of-day": [
    { key: "figma-library-poll", kind: "figma-library-poll" },
    // Second, so a rehearsal reaches it before the batches spend the ceiling.
    { key: "ds-precedence-check", kind: "ds-precedence-check", after: ["figma-library-poll"], weekday: FRIDAY },
    // Early too, for the same reason: one Roadmap read, a few lookups a card.
    { key: "card-follow-through", kind: "card-follow-through" },
    // One job per classification batch, each an alarm of its own. Each takes
    // whatever is still pending, so a quiet day's later jobs find nothing.
    ...Array.from({ length: CLASSIFY_BATCHES }, (_, i) => ({
      key: `usage-classify-${i + 1}`,
      kind: "usage-classify" as const,
    })),
    // One alarm reads `PASS_LIMIT` asks; the run holds enough jobs for a day's
    // (src/usage/resolution-pass.ts states the budget math).
    ...Array.from({ length: ASK_RESOLUTION_JOBS }, (_, i) => ({
      key: i === 0 ? FIRST_ASK_RESOLUTION_KEY : `ask-resolution-${i + 1}`,
      kind: "ask-resolution" as const,
    })),
    // Not after the classify jobs: the purge holds whether or not they ran.
    { key: "usage-text-purge", kind: "usage-text-purge" },
    { key: "proposal-expiry", kind: "proposal-expiry" },
  ],
};

/** The run names, for a caller that takes one as input. */
export const RUN_NAMES = Object.keys(RUN_HOURS) as ScheduledRunName[];

/**
 * The runs a firing starts: the one anchored to its ET hour, when the firing
 * is that hour's :00 slot, and none otherwise. Each run is once a day all
 * year: 13:00 UTC is the morning run under EDT and nothing under EST (08:00
 * ET), and 05:00 UTC the end-of-day run under EST and nothing under EDT.
 * Only on a run day, whatever the cron says: a morning Monday to Friday, and
 * an end-of-day run that sweeps Monday to Friday — Tuesday to Saturday 00:00.
 *
 * Compared by hour and minute, not to the millisecond, so a `scheduledTime` a
 * few seconds past the slot still lands in it. ET is a whole-hour offset, so
 * the UTC minute is the ET minute.
 *
 * @param scheduledTime - The firing's scheduled time, epoch ms
 */
export function runsForFiring(scheduledTime: number): ScheduledRunName[] {
  if (new Date(scheduledTime).getUTCMinutes() !== 0) return [];
  const hour = etParts(scheduledTime).h;
  return RUN_NAMES.filter((name) => RUN_HOURS[name] === hour && isWorkday(runDayOf(name, scheduledTime)));
}

/** The ET day a run at `at` is for: the morning's own, or the day the
 *  end-of-day run sweeps. */
function runDayOf(name: ScheduledRunName, at: number): number {
  return name === "end-of-day" ? sweptDayOf(at) : etDayOf(at);
}

function isWorkday(day: number): boolean {
  const wd = new Date(day).getUTCDay();
  return wd >= 1 && wd <= 5;
}

/** Weekday names as a caller spells them, in `Date.getUTCDay` order. */
export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * A run, planned for its ET day — the morning's own, and for the end-of-day
 * run the day it sweeps (`sweptDayOf`: at Saturday 00:00 ET, Friday): its
 * jobs for that day's weekday — or for `weekday` when given, which is how the
 * sweep probe rehearses Friday's jobs on a Tuesday; the date stays the run's.
 * The weekday filter covers every
 * job, the spread-in batches and the sweep jobs included. The end-of-day run
 * adds one `sweep-channel` job per swept channel after its fixed jobs, keyed
 * `sweep:<channel>`, then one `sweep-group-dms` job, keyed `sweep:group-dms`,
 * then one `sweep-dms` job, keyed `sweep:dms`, then the running-notes and Roadmap-card jobs, keyed `sweep:notes` and
 * `sweep:cards` — only while the sweep is on at all, so a blank list still
 * sweeps nothing. Both runs add one DM watch job per person in
 * `dmWatchers`: `dm-promise-read:<user>` at the end of the day,
 * `dm-promise-nudge:<user>` in the morning; and one per person in
 * `dmCapturers`: `dm-capture-read:<user>`, then `dm-capture-post:<user>`.
 *
 * @param name - Which run
 * @param at - When it fires, epoch ms
 * @param sweepChannels - The channels to sweep (`sweepChannelsFrom`)
 * @param weekday - Plan this weekday's jobs instead (0 Sunday … 6 Saturday)
 * @param dmWatchers - Everyone with a DM promise switch on
 * @param dmCapturers - Everyone with DM Capture on
 */
export function planRun(
  name: ScheduledRunName,
  at: number,
  sweepChannels: readonly string[] = [],
  weekday?: number,
  dmWatchers: readonly string[] = [],
  dmCapturers: readonly string[] = [],
): ScheduledRun {
  const sweeps: ScheduledJob[] =
    name === "end-of-day" && sweepChannels.length
      ? [
          ...sweepChannels.map((channel): ScheduledJob => ({ key: `sweep:${channel}`, kind: "sweep-channel", channel })),
          { key: GROUP_DM_SWEEP_KEY, kind: "sweep-group-dms" },
          { key: DM_SWEEP_KEY, kind: "sweep-dms" },
          { key: NOTES_SWEEP_KEY, kind: "sweep-notes" },
          { key: CARDS_SWEEP_KEY, kind: "sweep-cards" },
        ]
      : [];
  const kind = name === "end-of-day" ? "dm-promise-read" : "dm-promise-nudge";
  const captureKind = name === "end-of-day" ? "dm-capture-read" : "dm-capture-post";
  const dms = [
    ...[...new Set(dmWatchers)].map((user): ScheduledJob => ({ key: `${kind}:${user}`, kind, user })),
    ...[...new Set(dmCapturers)].map((user): ScheduledJob => ({ key: `${captureKind}:${user}`, kind: captureKind, user })),
  ];
  // The sweep and DM jobs go before the purge, which stays last in every run.
  const plan = RUN_PLANS[name];
  const purge = plan.findIndex((j) => j.kind === "usage-text-purge");
  const all = purge < 0 ? [...plan, ...sweeps, ...dms] : [...plan.slice(0, purge), ...sweeps, ...dms, ...plan.slice(purge)];
  const d = new Date(runDayOf(name, at));
  const day = weekday ?? d.getUTCDay();
  const jobs = all.filter((job) => job.weekday === undefined || job.weekday === day);
  return { name, date: d.toISOString().slice(0, 10), jobs };
}

/**
 * The channels the end-of-day sweep reads, from `SWEEP_CHANNELS` — a
 * comma-separated list of channel ids, and the one line to grow when uno-bot
 * joins another design channel. #uno-bot is never swept, whatever the list
 * says: it is where the team reports problems with uno-bot, not a design
 * channel. A DM id (`D…`) is never read either; a private channel on the list
 * but off `SLACK_SEARCH_PRIVATE_ALLOWLIST` is refused by the job itself, which
 * is the one that can ask Slack what kind it is.
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
  /** Everyone with a DM promise switch on — read only when a run fires. */
  dmWatchers?(): Promise<readonly string[]>;
  /** Everyone with DM Capture on — read only when a run fires. */
  dmCapturers?(): Promise<readonly string[]>;
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
  const names = runsForFiring(scheduledTime);
  if (!names.length) return;
  // One read for the firing. A failure plans no DM jobs and keeps the rest.
  const watchers = deps.dmWatchers
    ? await deps.dmWatchers().catch((err: unknown) => {
        console.error(`[scheduled] DM watchers could not be read: ${message(err)}`);
        return [] as readonly string[];
      })
    : [];
  const capturers = deps.dmCapturers
    ? await deps.dmCapturers().catch((err: unknown) => {
        console.error(`[scheduled] DM Capture watchers could not be read: ${message(err)}`);
        return [] as readonly string[];
      })
    : [];
  const runs = names.map((name) => planRun(name, scheduledTime, deps.sweepChannels, undefined, watchers, capturers));
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
