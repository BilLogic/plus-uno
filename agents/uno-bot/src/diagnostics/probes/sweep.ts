// A scheduled run, rehearsed: `/debug/sweep?dry_run=1[&run=morning|end-of-day]`.
// Plans the run the cron would enqueue (end-of-day unless `run` says
// otherwise) and dry-runs every job in this request, reporting the planned
// jobs and, per job, its subrequests, D1 queries and time. Dry runs only: the
// runs themselves fire from the cron, one alarm per job.
import { probeBody } from "../router";
import type { ProbeRun } from "../probe";
import { planRun, RUN_NAMES, type ScheduledRunName } from "../../scheduled/runs";
import { runScheduledJob } from "../../scheduled/jobs";
import { dryRunScheduledRun } from "../../scheduled/dry-run";

export const sweepProbe: ProbeRun = async (env, url) => {
  const name = url.searchParams.get("run") ?? "end-of-day";
  if (!RUN_NAMES.includes(name as ScheduledRunName)) {
    return probeBody({ ok: false, error: `unknown run "${name}" — one of ${RUN_NAMES.join(", ")}` }, 400);
  }
  if (url.searchParams.get("dry_run") !== "1") {
    return probeBody({ ok: false, error: "dry runs only (?dry_run=1): the runs fire from the cron" }, 400);
  }
  const run = planRun(name as ScheduledRunName, Date.now());
  const report = await dryRunScheduledRun(run, (job) => runScheduledJob(env, job, { dryRun: true }));
  return probeBody({ ok: true, dryRun: true, ...report });
};
