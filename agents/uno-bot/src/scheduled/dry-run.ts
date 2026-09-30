// A scheduled run, rehearsed in one invocation — the body of `/debug/sweep`.
//
// The real run spends one alarm per job, each with a fresh 50. A rehearsal
// runs every job in ONE request, so it cannot give each job the whole ceiling:
// the ceiling is on the rehearsal's running count, each job gets what the jobs
// before it left, and once nothing is left the rest are reported `skipped`
// rather than run into the invocation's hard cap. A job the ceiling stopped
// reads `deferred`, exactly as the runner would keep it.
//
// Each job is read as the difference in the invocation's own meter across it,
// so the probe's envelope still counts everything the rehearsal spent
// (ADR-022): external subrequests (the ones capped at 50), Cloudflare-service
// hops, and D1 queries — the hops charged under the `"d1"` label, which read 0
// while no D1 database is bound. `cpu_ms` is always null: workerd advances its
// clocks only across I/O, so CPU time cannot be read from inside an
// invocation, and for the same reason `wall_ms` is time spent waiting on I/O —
// a job that makes no calls reads 0. Workers Logs records CPU time per
// invocation, which for a real run is one AgentRunner alarm per job.
//
// Must run inside a meter — the probe runs inside the Worker's. Outside one
// the counters read 0 and no ceiling applies.
//
// Free of `Env` and Workers globals: the job body is passed in, so the Node
// suite drives the rehearsal with fakes (tests/sweep-dry-run.test.ts).
import { LOOKUP_CEILING } from "../agent/loop-policy";
import { internalSubrequestsFor, internalSubrequestsUsed, subrequestsUsed } from "../net";
import { nextRunnable, runWithinCeiling } from "../runner/queue";
import type { ScheduledJob, ScheduledRun, ScheduledRunName } from "./runs";

/** What one job did in the rehearsal, and what it spent. */
export interface JobReading {
  key: string;
  kind: ScheduledJob["kind"];
  outcome: "handled" | "deferred" | "failed" | "skipped";
  /** Why a job was not rehearsed: the ceiling was spent, or it repeats a kind
   *  already rehearsed. Present only on a `skipped` reading. */
  skipped_because?: "ceiling" | "repeat-of-kind";
  subrequests: number;
  internal_subrequests: number;
  d1_queries: number;
  wall_ms: number;
  cpu_ms: null;
  /** What the job's body reported, when it reported anything — the sweep's
   *  findings and the text of the cards it would post. */
  detail?: unknown;
}

/** The rehearsal's report. */
export interface DryRunReport {
  run: ScheduledRunName;
  date: string;
  /** The jobs as planned, in plan order. */
  planned: { key: string; kind: ScheduledJob["kind"]; after: readonly string[] }[];
  /** One reading per job, in the order the runner would run them. */
  jobs: JobReading[];
  /** External subrequests the whole rehearsal spent. */
  total_subrequests: number;
  lookup_ceiling: number;
  cpu_note: string;
}

const CPU_NOTE =
  "cpu_ms is not readable in-invocation (workerd advances clocks only across I/O, so wall_ms is I/O wait). " +
  "For CPU time, read cpuTime in Workers Logs on the AgentRunner alarm invocations: one per job on a real run.";

/**
 * Rehearse a run: each job once, in runner order, each read off the meter.
 *
 * @param run - The planned run
 * @param execute - One job's body, as a dry run, with the run's date
 * @param now - Clock seam
 */
export async function dryRunScheduledRun(
  run: ScheduledRun,
  execute: (job: ScheduledJob, runDate: string) => Promise<unknown>,
  now: () => number = () => Date.now(),
): Promise<DryRunReport> {
  const queue = run.jobs.map((job) => ({ date: run.date, job }));
  const jobs: JobReading[] = [];
  const startSubrequests = subrequestsUsed();

  while (queue.length > 0) {
    // A plan whose jobs wait on each other would never run them; take them in
    // plan order rather than loop.
    const index = Math.max(nextRunnable(queue), 0);
    const [{ job }] = queue.splice(index, 1) as [{ date: string; job: ScheduledJob }];
    // ONE JOB PER KIND. A dry run writes nothing, so a second job of a kind
    // would read the same rows the first did and report the same work again —
    // five classify jobs would claim five batches from one. The first is
    // rehearsed; each repeat is reported as skipped, and why.
    if (jobs.some((j) => j.kind === job.kind)) {
      jobs.push({ ...reading(job, "skipped", 0, 0, 0, 0), skipped_because: "repeat-of-kind" });
      continue;
    }
    if (subrequestsUsed() - startSubrequests >= LOOKUP_CEILING) {
      jobs.push({ ...reading(job, "skipped", 0, 0, 0, 0), skipped_because: "ceiling" });
      continue;
    }
    const before = { ext: subrequestsUsed(), internal: internalSubrequestsUsed(), d1: internalSubrequestsFor("d1") };
    const startedAt = now();
    let detail: unknown;
    const outcome = await runWithinCeiling(async () => {
      detail = await execute(job, run.date);
    }, startSubrequests + LOOKUP_CEILING);
    jobs.push({
      ...reading(
        job,
        outcome,
        subrequestsUsed() - before.ext,
        internalSubrequestsUsed() - before.internal,
        internalSubrequestsFor("d1") - before.d1,
        now() - startedAt,
      ),
      ...(detail !== undefined ? { detail } : {}),
    });
  }

  return {
    run: run.name,
    date: run.date,
    planned: run.jobs.map((j) => ({ key: j.key, kind: j.kind, after: j.after ?? [] })),
    jobs,
    total_subrequests: subrequestsUsed() - startSubrequests,
    lookup_ceiling: LOOKUP_CEILING,
    cpu_note: CPU_NOTE,
  };
}

function reading(
  job: ScheduledJob,
  outcome: JobReading["outcome"],
  subrequests: number,
  internal: number,
  d1: number,
  wallMs: number,
): JobReading {
  return {
    key: job.key,
    kind: job.kind,
    outcome,
    subrequests,
    internal_subrequests: internal,
    d1_queries: d1,
    wall_ms: wallMs,
    cpu_ms: null,
  };
}
