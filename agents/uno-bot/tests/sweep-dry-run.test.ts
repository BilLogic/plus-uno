// `/debug/sweep?dry_run=1` — a scheduled run, rehearsed in one request.
//
// The probe plans a run the way the cron does, then runs each job in the order
// the runner would and reads what each one spent off the invocation's meter:
// external subrequests, Cloudflare-service hops, D1 queries, and time. The sum
// is held under the lookup ceiling, because the rehearsal is ONE invocation
// where the real run is one alarm per job — and it stays on that one meter, so
// the probe's envelope counts it too.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIAGNOSTIC_ROUTES } from "../src/diagnostics/routes";
import { sweepProbe } from "../src/diagnostics/probes/sweep";
import { dryRunScheduledRun } from "../src/scheduled/dry-run";
import { charge, countedFetch, internalSubrequestsUsed, runMetered, SubrequestBudgetError, subrequestsUsed } from "../src/net";
import { LOOKUP_CEILING } from "../src/agent/loop-policy";
import type { ScheduledRun } from "../src/scheduled/runs";
import type { Env } from "../src/types";

const plan: ScheduledRun = {
  name: "end-of-day",
  date: "2026-09-29",
  jobs: [
    // Two kinds: a rehearsal runs one job per kind.
    { key: "assemble", kind: "figma-library-post", after: ["a"] },
    { key: "a", kind: "noop" },
  ],
};

/** A fetch that costs one subrequest and never leaves the process. */
const oneCall = () => countedFetch("data:text/plain,x").then(() => undefined);

test("the sweep probe is a token-gated GET in the route table", () => {
  assert.deepEqual(DIAGNOSTIC_ROUTES.sweep, { method: "GET", path: "/debug/sweep", auth: "debug-token" });
});

test("a dry run reports the planned jobs and one reading per job, in runner order", async () => {
  const dates: string[] = [];
  const report = await runMetered(() =>
    dryRunScheduledRun(plan, async (job, runDate) => {
      dates.push(runDate);
      if (job.key === "a") {
        charge(2, "d1");
        await oneCall();
      }
    }),
  );
  assert.equal(report.run, "end-of-day");
  assert.equal(report.date, "2026-09-29");
  assert.deepEqual(report.planned.map((j) => j.key), ["assemble", "a"]);
  assert.deepEqual(report.jobs.map((j) => j.key), ["a", "assemble"]);
  const [a, assemble] = report.jobs;
  assert.equal(a?.outcome, "handled");
  assert.equal(a?.subrequests, 1);
  assert.equal(a?.d1_queries, 2);
  assert.equal(a?.internal_subrequests, 2);
  assert.equal(assemble?.subrequests, 0, "each reading is its own job's");
  assert.equal(assemble?.d1_queries, 0, "no D1 bound is a zero, not a missing field");
  assert.equal(typeof a?.wall_ms, "number");
  assert.equal(a?.cpu_ms, null);
  assert.match(report.cpu_note, /Workers Logs/);
  assert.equal(report.total_subrequests, 1);
  assert.deepEqual(dates, ["2026-09-29", "2026-09-29"], "each job is rehearsed under the run's date");
});

test("what the jobs spent stays on the invocation's meter, which the envelope reads", async () => {
  const seen = await runMetered(async () => {
    await dryRunScheduledRun(plan, async () => {
      await oneCall();
      charge(1, "d1");
    });
    return { external: subrequestsUsed(), internal: internalSubrequestsUsed() };
  });
  assert.deepEqual(seen, { external: 2, internal: 2 });
});

test("a job the budget stops is reported as deferred, not as done", async () => {
  const report = await runMetered(() =>
    dryRunScheduledRun(plan, async (job) => {
      if (job.key === "a") throw new SubrequestBudgetError(LOOKUP_CEILING);
    }),
  );
  assert.equal(report.jobs[0]?.outcome, "deferred");
});

test("the rehearsal stops before the invocation's budget is gone", async () => {
  // Each job tries to spend past the WHOLE ceiling; the second gets nothing left.
  const greedy: ScheduledRun = {
    name: "morning",
    date: "2026-09-29",
    jobs: [{ key: "a", kind: "noop" }, { key: "b", kind: "figma-library-post" }],
  };
  const report = await runMetered(() =>
    dryRunScheduledRun(greedy, async () => {
      for (let i = 0; i < LOOKUP_CEILING + 5; i++) await oneCall();
    }),
  );
  assert.equal(report.jobs[0]?.subrequests, LOOKUP_CEILING);
  assert.equal(report.jobs[0]?.outcome, "deferred");
  assert.equal(report.jobs[1]?.outcome, "skipped");
  assert.equal(report.jobs[1]?.skipped_because, "ceiling");
  assert.equal(report.total_subrequests, LOOKUP_CEILING);
});

test("a rehearsal runs one job of each kind, and reports the repeats as skipped", async () => {
  // A dry run writes nothing, so five classify jobs would read the same batch
  // five times and claim five batches' work.
  const repeats: ScheduledRun = {
    name: "end-of-day",
    date: "2026-09-29",
    jobs: [
      { key: "usage-classify-1", kind: "usage-classify" },
      { key: "usage-classify-2", kind: "usage-classify" },
      { key: "usage-text-purge", kind: "usage-text-purge" },
    ],
  };
  const ran: string[] = [];
  const report = await runMetered(() =>
    dryRunScheduledRun(repeats, async (job) => {
      ran.push(job.key);
    }),
  );
  assert.deepEqual(ran, ["usage-classify-1", "usage-text-purge"]);
  assert.deepEqual(
    report.jobs.map((j) => [j.key, j.outcome, j.skipped_because]),
    [
      ["usage-classify-1", "handled", undefined],
      ["usage-classify-2", "skipped", "repeat-of-kind"],
      ["usage-text-purge", "handled", undefined],
    ],
  );
});

test("the probe dry-runs the named run's jobs", async () => {
  // An unconfigured Worker: no channel to post in and no repo to track, so
  // every morning job says so and spends nothing.
  const url = new URL("https://w/debug/sweep?dry_run=1&run=morning");
  const report = await runMetered(() => sweepProbe({} as Env, url, new Request(url)));
  assert.ok("body" in report);
  const body = report.body as { ok: boolean; run: string; planned: unknown[]; jobs: { key: string; outcome: string; subrequests: number }[] };
  assert.equal(body.ok, true);
  assert.equal(body.run, "morning");
  assert.equal(body.planned.length, 8);
  assert.deepEqual(body.jobs.map((j) => [j.key, j.outcome, j.subrequests]), [
    ["figma-library-post", "handled", 0],
    ["figma-library-track", "handled", 0],
    ["sweep-post", "handled", 0],
    ["ds-precedence-post", "handled", 0],
    ["commitment-nudge", "handled", 0],
    ["figma-drift-post", "handled", 0],
    // No Notion key: the roster read refuses before spending anything.
    ["team-roles-sync", "handled", 0],
    // No usage database bound: nothing to purge, nothing spent.
    ["usage-text-purge", "handled", 0],
  ]);
});

test("the probe rehearses another weekday's jobs: Friday's DS precedence check on any day", async () => {
  // Unconfigured, so the check says so and spends nothing — what matters is
  // that it is planned right after the library poll and rehearsed, not skipped.
  const url = new URL("https://w/debug/sweep?dry_run=1&run=end-of-day&weekday=fri");
  const report = await runMetered(() => sweepProbe({} as Env, url, new Request(url)));
  assert.ok("body" in report);
  const body = report.body as {
    ok: boolean;
    planned: { key: string; after: string[] }[];
    jobs: { key: string; outcome: string; skipped_because?: string }[];
  };
  assert.equal(body.ok, true);
  assert.deepEqual(body.planned.slice(0, 2).map((j) => [j.key, j.after]), [
    ["figma-library-poll", []],
    ["ds-precedence-check", ["figma-library-poll"]],
  ]);
  const check = body.jobs.find((j) => j.key === "ds-precedence-check");
  assert.deepEqual([check?.outcome, check?.skipped_because], ["handled", undefined]);

  const tuesday = new URL("https://w/debug/sweep?dry_run=1&run=end-of-day&weekday=tue");
  const plain = await runMetered(() => sweepProbe({} as Env, tuesday, new Request(tuesday)));
  assert.ok("body" in plain);
  assert.equal((plain.body as { planned: { key: string }[] }).planned.some((j) => j.key === "ds-precedence-check"), false);

  const bad = new URL("https://w/debug/sweep?dry_run=1&weekday=someday");
  const refused = await sweepProbe({} as Env, bad, new Request(bad));
  assert.ok("body" in refused);
  assert.equal(refused.status, 400);
});

test("each job's own report rides beside its reading", async () => {
  const report = await runMetered(() =>
    dryRunScheduledRun(plan, async (job) => (job.key === "a" ? { findings: 2, cards: ["text"] } : undefined)),
  );
  const a = report.jobs.find((j) => j.key === "a");
  assert.deepEqual(a?.detail, { findings: 2, cards: ["text"] });
  assert.equal("detail" in (report.jobs.find((j) => j.key === "assemble") ?? {}), false);
});

test("the end-of-day probe plans one sweep job per SWEEP_CHANNELS entry, #uno-bot left out, then the group DMs, the notes and the cards", async () => {
  const url = new URL("https://w/debug/sweep?dry_run=1");
  const env = { SWEEP_CHANNELS: "C0DESIGN,C0UNOBOT,C0OTHER", UNO_BOT_CHANNEL_ID: "C0UNOBOT" } as unknown as Env;
  const report = await runMetered(() => sweepProbe(env, url, new Request(url)));
  assert.ok("body" in report);
  const body = report.body as {
    planned: { key: string }[];
    jobs: { key: string; outcome: string; skipped_because?: string; detail?: { summary: string } }[];
  };
  assert.deepEqual(
    body.planned.map((j) => j.key).filter((k) => k.startsWith("sweep:")),
    ["sweep:C0DESIGN", "sweep:C0OTHER", "sweep:group-dms", "sweep:dms", "sweep:notes", "sweep:cards"],
  );
  const keys = body.planned.map((j) => j.key);
  assert.ok(keys.indexOf("sweep:C0OTHER") < keys.indexOf("usage-text-purge"), "the sweeps run before the purge");
  // Unbound here, so the job says it did nothing rather than reading anything.
  assert.match(body.jobs.find((j) => j.key === "sweep:C0DESIGN")?.detail?.summary ?? "", /not bound/);
  // A rehearsal runs one job per kind: the second channel is reported, not run.
  const other = body.jobs.find((j) => j.key === "sweep:C0OTHER");
  assert.deepEqual([other?.outcome, other?.skipped_because], ["skipped", "repeat-of-kind"]);
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
