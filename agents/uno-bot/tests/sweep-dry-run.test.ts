// `/debug/sweep?dry_run=1` — a scheduled run, rehearsed in one request.
//
// The probe plans a run the way the cron does, then runs each job in the order
// the runner would, each under its own meter, and reports what each one spent:
// external subrequests, Cloudflare-service hops, D1 queries, and time. The
// sum is held under the lookup ceiling, because the rehearsal is ONE
// invocation where the real run is one alarm per job.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIAGNOSTIC_ROUTES } from "../src/diagnostics/routes";
import { sweepProbe } from "../src/diagnostics/probes/sweep";
import { dryRunScheduledRun } from "../src/scheduled/dry-run";
import { charge, countedFetch, SubrequestBudgetError } from "../src/net";
import { LOOKUP_CEILING } from "../src/agent/loop-policy";
import type { ScheduledRun } from "../src/scheduled/runs";
import type { Env } from "../src/types";

const plan: ScheduledRun = {
  name: "end-of-day",
  date: "2026-09-29",
  jobs: [
    { key: "assemble", kind: "noop", after: ["a"] },
    { key: "a", kind: "noop" },
  ],
};

test("the sweep probe is a token-gated GET in the route table", () => {
  assert.deepEqual(DIAGNOSTIC_ROUTES.sweep, { method: "GET", path: "/debug/sweep", auth: "debug-token" });
});

test("a dry run reports the planned jobs and one reading per job, in runner order", async () => {
  const report = await dryRunScheduledRun(plan, async (job) => {
    if (job.key === "a") charge(2, "d1");
  });
  assert.equal(report.run, "end-of-day");
  assert.equal(report.date, "2026-09-29");
  assert.deepEqual(report.planned.map((j) => j.key), ["assemble", "a"]);
  assert.deepEqual(report.jobs.map((j) => j.key), ["a", "assemble"]);
  const [a, assemble] = report.jobs;
  assert.equal(a?.outcome, "handled");
  assert.equal(a?.subrequests, 0);
  assert.equal(a?.d1_queries, 2);
  assert.equal(a?.internal_subrequests, 2);
  assert.equal(assemble?.d1_queries, 0, "no D1 bound is a zero, not a missing field");
  assert.equal(typeof a?.wall_ms, "number");
  assert.ok("cpu_ms" in (a ?? {}), "every reading carries the CPU field");
});

test("a job the budget stops is reported as deferred, not as done", async () => {
  const report = await dryRunScheduledRun(plan, async (job) => {
    if (job.key === "a") throw new SubrequestBudgetError(LOOKUP_CEILING);
  });
  assert.equal(report.jobs[0]?.outcome, "deferred");
});

test("the rehearsal stops before the invocation's budget is gone", async () => {
  // Each job spends the WHOLE ceiling; the second one gets nothing left.
  const greedy: ScheduledRun = {
    name: "morning",
    date: "2026-09-29",
    jobs: [{ key: "a", kind: "noop" }, { key: "b", kind: "noop" }],
  };
  const report = await dryRunScheduledRun(greedy, async () => {
    for (let i = 0; i < LOOKUP_CEILING + 5; i++) {
      await countedFetch("data:text/plain,x").catch((err: unknown) => {
        if (err instanceof SubrequestBudgetError) throw err;
      });
    }
  });
  assert.equal(report.jobs[0]?.subrequests, LOOKUP_CEILING);
  assert.equal(report.jobs[0]?.outcome, "deferred");
  assert.equal(report.jobs[1]?.outcome, "skipped");
});

test("the probe dry-runs the named run with the no-op job", async () => {
  const url = new URL("https://w/debug/sweep?dry_run=1&run=morning");
  const report = await sweepProbe({} as Env, url, new Request(url));
  assert.ok("body" in report);
  const body = report.body as { ok: boolean; run: string; planned: unknown[]; jobs: { outcome: string }[] };
  assert.equal(body.ok, true);
  assert.equal(body.run, "morning");
  assert.equal(body.planned.length, 1);
  assert.deepEqual(body.jobs.map((j) => j.outcome), ["handled"]);
});

test("the probe refuses a live run and an unknown run name", async () => {
  const live = new URL("https://w/debug/sweep?run=morning");
  const refused = await sweepProbe({} as Env, live, new Request(live));
  assert.ok("body" in refused);
  assert.equal(refused.status, 400);

  const unknown = new URL("https://w/debug/sweep?dry_run=1&run=lunch");
  const bad = await sweepProbe({} as Env, unknown, new Request(unknown));
  assert.ok("body" in bad);
  assert.equal(bad.status, 400);
});
