// A scheduled run, rehearsed in one invocation — the body of `/debug/sweep`.
//
// The real run spends one alarm per job, each with a fresh 50. A rehearsal
// runs every job in ONE request, so it cannot give each job the whole ceiling:
// each job runs under what is left of `LOOKUP_CEILING` after the jobs before
// it, and once nothing is left the rest are reported `skipped` rather than
// run into the invocation's hard cap. A job the rehearsal stopped reads
// `deferred`, exactly as the runner would keep it.
//
// Each job runs under its own meter, so its reading is its own: external
// subrequests (the ones capped at 50), Cloudflare-service hops, and D1
// queries — the hops charged under the `"d1"` label, which read 0 while no D1
// database is bound. `cpu_ms` is always null: workerd advances its clocks only
// across I/O, so CPU time cannot be read from inside an invocation. Workers
// Logs records it per invocation, which for a real run is per job.
//
// Free of `Env` and Workers globals: the job body is passed in, so the Node
// suite drives the rehearsal with fakes (tests/sweep-dry-run.test.ts).
import { LOOKUP_CEILING } from "../agent/loop-policy";
import { internalSubrequestsFor, internalSubrequestsUsed, runMetered, subrequestsUsed } from "../net";
import { nextRunnable, runWithinCeiling } from "../runner/queue";
import type { ScheduledJob, ScheduledRun, ScheduledRunName } from "./runs";

/** What one job did in the rehearsal, and what it spent. */
export interface JobReading {
  key: string;
  kind: ScheduledJob["kind"];
  outcome: "handled" | "deferred" | "failed" | "skipped";
  subrequests: number;
  internal_subrequests: number;
  d1_queries: number;
  wall_ms: number;
  cpu_ms: null;
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
  "not readable in-invocation (workerd advances clocks only across I/O); Workers Logs records CPU time per invocation, one per job on a real run";

/**
 * Rehearse a run: each job once, in runner order, each metered on its own.
 *
 * @param run - The planned run
 * @param execute - One job's body, as a dry run
 * @param now - Clock seam
 */
export async function dryRunScheduledRun(
  run: ScheduledRun,
  execute: (job: ScheduledJob) => Promise<void>,
  now: () => number = () => Date.now(),
): Promise<DryRunReport> {
  const queue = run.jobs.map((job) => ({ date: run.date, job }));
  const jobs: JobReading[] = [];
  let spent = 0;

  while (queue.length > 0) {
    // A plan whose jobs wait on each other would never run them; take them in
    // plan order rather than loop.
    const index = Math.max(nextRunnable(queue), 0);
    const [{ job }] = queue.splice(index, 1) as [{ date: string; job: ScheduledJob }];
    const left = LOOKUP_CEILING - spent;
    if (left <= 0) {
      jobs.push(reading(job, "skipped", 0, 0, 0, 0));
      continue;
    }
    const startedAt = now();
    const measured = await runMetered(async () => {
      const outcome = await runWithinCeiling(() => execute(job), left);
      return {
        outcome,
        subrequests: subrequestsUsed(),
        internal: internalSubrequestsUsed(),
        d1: internalSubrequestsFor("d1"),
      };
    });
    spent += measured.subrequests;
    jobs.push(reading(job, measured.outcome, measured.subrequests, measured.internal, measured.d1, now() - startedAt));
  }

  return {
    run: run.name,
    date: run.date,
    planned: run.jobs.map((j) => ({ key: j.key, kind: j.kind, after: j.after ?? [] })),
    jobs,
    total_subrequests: spent,
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
