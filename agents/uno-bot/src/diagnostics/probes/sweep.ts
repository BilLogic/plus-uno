// A scheduled run, rehearsed:
// `/debug/sweep?dry_run=1[&run=morning|end-of-day][&weekday=sun…sat]`.
// Plans the run the cron would enqueue (end-of-day unless `run` says
// otherwise; today's jobs unless `weekday` names another day's, so the weekly
// DS precedence check can be rehearsed with `&weekday=fri` on any day) and
// dry-runs every job in this request, reporting the planned
// jobs and, per job, its subrequests, D1 queries, time and report — for the
// drift sweep, the findings and the card text, posted nowhere. Dry runs only:
// the runs themselves fire from the cron, one alarm per job.
import { probeBody } from "../router";
import type { ProbeRun } from "../probe";
import { planRun, RUN_NAMES, sweepChannelsFrom, WEEKDAYS, type ScheduledRunName } from "../../scheduled/runs";
import { rehearseScheduledJob } from "../../scheduled/jobs";
import { dryRunScheduledRun } from "../../scheduled/dry-run";

export const sweepProbe: ProbeRun = async (env, url) => {
  const name = url.searchParams.get("run") ?? "end-of-day";
  if (!RUN_NAMES.includes(name as ScheduledRunName)) {
    return probeBody({ ok: false, error: `unknown run "${name}" — one of ${RUN_NAMES.join(", ")}` }, 400);
  }
  if (url.searchParams.get("dry_run") !== "1") {
    return probeBody({ ok: false, error: "dry runs only (?dry_run=1): the runs fire from the cron" }, 400);
  }
  const weekdayParam = url.searchParams.get("weekday");
  const weekday = weekdayParam === null ? undefined : WEEKDAYS.indexOf(weekdayParam.trim().toLowerCase() as (typeof WEEKDAYS)[number]);
  if (weekday === -1) {
    return probeBody({ ok: false, error: `unknown weekday "${weekdayParam}" — one of ${WEEKDAYS.join(", ")}` }, 400);
  }
  const run = planRun(
    name as ScheduledRunName,
    Date.now(),
    sweepChannelsFrom(env.SWEEP_CHANNELS, env.UNO_BOT_CHANNEL_ID),
    weekday,
  );
  const report = await dryRunScheduledRun(run, (job) => rehearseScheduledJob(env, job));
  return probeBody({ ok: true, dryRun: true, ...report });
};
