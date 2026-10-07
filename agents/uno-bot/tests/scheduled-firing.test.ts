// The cron firing: a scheduled run on two slots, and nothing on the rest.
//
// Two triggers fire at each run's two UTC hours: 00:00 ET, the end-of-day
// run, is 04:00 UTC in EDT and 05:00 in EST, Tuesday to Saturday; 09:00 ET,
// the morning run, is 13:00 UTC in EDT and 14:00 in EST, Monday to Friday. The
// handler reads the scheduled time and enqueues the matching run, dated to the
// ET day it is for: the end-of-day run to the day it sweeps, the one before.
// The Figma library poll that used to run on every firing is the end-of-day
// run's job now. Driven through the firing's named dependency, so the test
// sees exactly what it asked for.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  onScheduledFiring,
  planRun,
  runnerNameForRun,
  runsForFiring,
  sweepChannelsFrom,
  type ScheduledRun,
} from "../src/scheduled/runs";
import { enqueueScheduledRun, runScheduledJob } from "../src/scheduled/jobs";
import { internalSubrequestsFor, runMetered } from "../src/net";
import type { Env } from "../src/types";
import { cronFirings } from "./helpers/cron";

/** A firing at `hh:mm` UTC on a weekday (2026-09-29 is a Tuesday). */
const at = (hh: number, mm: number): number => Date.UTC(2026, 8, 29, hh, mm);
/** Tuesday's morning run: 09:00 EDT. */
const MORNING = at(13, 0);
/** Tuesday's end-of-day run: Wednesday 00:00 EDT. */
const MIDNIGHT = Date.UTC(2026, 8, 30, 4, 0);

async function fire(scheduledTime: number) {
  const runs: ScheduledRun[] = [];
  await onScheduledFiring(scheduledTime, {
    enqueueRun: async (run) => {
      runs.push(run);
    },
  });
  return { runs };
}

test("a firing only enqueues: the Figma poll is a job of the end-of-day run", () => {
  // The dependency set is the whole of what a firing can do.
  const deps: Parameters<typeof onScheduledFiring>[1] = { enqueueRun: async () => {} };
  assert.deepEqual(Object.keys(deps), ["enqueueRun"]);
  assert.deepEqual(planRun("end-of-day", MIDNIGHT).jobs.map((j) => j.kind), [
    "figma-library-poll",
    "card-follow-through",
    "figma-drift-recheck",
    "figma-backstop",
    "figma-backstop",
    "figma-backstop",
    "usage-classify",
    "usage-classify",
    "usage-classify",
    "usage-classify",
    "usage-classify",
    "ask-resolution",
    "ask-resolution",
    "ask-resolution",
    "ask-resolution",
    "ask-resolution",
    "ask-resolution",
    "usage-text-purge",
    "proposal-expiry",
  ]);
});

test("in EDT, 13:00 UTC enqueues the morning run and 04:00 UTC the end-of-day run, dated to the day it sweeps", async () => {
  const morning = await fire(MORNING);
  assert.deepEqual(morning.runs.map((r) => [r.name, r.date]), [["morning", "2026-09-29"]]);

  const endOfDay = await fire(MIDNIGHT);
  assert.deepEqual(endOfDay.runs.map((r) => [r.name, r.date]), [["end-of-day", "2026-09-29"]]);
});

test("the runs keep their ET hours on both sides of the 1 Nov 2026 change", async () => {
  // Fri 30 Oct is EDT (UTC-4); Mon 2 Nov is EST (UTC-5). The morning run is
  // 09:00 ET and the end-of-day run 00:00 ET all year.
  const oct30 = (hh: number) => Date.UTC(2026, 9, 30, hh);
  const oct31 = (hh: number) => Date.UTC(2026, 9, 31, hh);
  const nov2 = (hh: number) => Date.UTC(2026, 10, 2, hh);
  const nov3 = (hh: number) => Date.UTC(2026, 10, 3, hh);
  assert.deepEqual(runsForFiring(oct30(13)), ["morning"]);
  assert.deepEqual(runsForFiring(oct30(14)), []);
  // Friday's work is swept at Saturday 00:00 EDT, 04:00 UTC.
  assert.deepEqual(runsForFiring(oct31(4)), ["end-of-day"]);
  assert.deepEqual(runsForFiring(oct31(5)), []);
  assert.deepEqual(runsForFiring(nov2(13)), []);
  assert.deepEqual(runsForFiring(nov2(14)), ["morning"]);
  // Monday's work is swept at Tuesday 00:00 EST, 05:00 UTC.
  assert.deepEqual(runsForFiring(nov3(4)), []);
  assert.deepEqual(runsForFiring(nov3(5)), ["end-of-day"]);
  const saturday = await fire(oct31(4));
  assert.deepEqual(saturday.runs.map((r) => [r.name, r.date]), [["end-of-day", "2026-10-30"]]);
  const morning = await fire(nov2(14));
  assert.deepEqual(morning.runs.map((r) => [r.name, r.date]), [["morning", "2026-11-02"]]);
  const endOfDay = await fire(nov3(5));
  assert.deepEqual(endOfDay.runs.map((r) => [r.name, r.date]), [["end-of-day", "2026-11-02"]]);
});

test("each run fires once a day, Monday to Friday's, in EDT and EST alike", async () => {
  for (const monday of [Date.UTC(2026, 8, 28), Date.UTC(2026, 10, 2)]) {
    const started: string[] = [];
    // The cron's firings, and every other hour of the week besides.
    for (let t = monday; t < monday + 7 * 86_400_000; t += 3_600_000) {
      for (const run of (await fire(t)).runs) started.push(`${run.name} ${run.date}`);
    }
    const days = [0, 1, 2, 3, 4].map((i) => new Date(monday + i * 86_400_000).toISOString().slice(0, 10));
    assert.deepEqual(started.sort(), [...days.map((d) => `end-of-day ${d}`), ...days.map((d) => `morning ${d}`)].sort());
    // Every run starts on a firing the triggers make.
    const firings = cronFirings(monday, 7);
    assert.equal(firings.length, 20);
    for (let t = monday; t < monday + 7 * 86_400_000; t += 3_600_000) {
      if (runsForFiring(t).length) assert.ok(firings.includes(t), new Date(t).toISOString());
    }
  }
});

test("no other firing enqueues a run", async () => {
  const others = cronFirings(Date.UTC(2026, 8, 28), 7).filter((t) => runsForFiring(t).length === 0);
  // One of each trigger's two hours, every day it fires.
  assert.equal(others.length, 10);
  for (const t of others) {
    const { runs } = await fire(t);
    assert.deepEqual(runs, [], new Date(t).toISOString());
  }
  // A firing that lands a few seconds late is still the same slot; one in the
  // neighbouring quarter-hour is not.
  assert.deepEqual(runsForFiring(MORNING + 20_000), ["morning"]);
  assert.deepEqual(runsForFiring(at(13, 15)), []);
  // Nor does a firing on a day with no run, whatever a trigger says: Monday
  // 00:00 ET would sweep a Sunday, and Saturday 09:00 is no morning.
  assert.deepEqual(runsForFiring(Date.UTC(2026, 9, 5, 4)), []);
  assert.deepEqual(runsForFiring(Date.UTC(2026, 9, 3, 13)), []);
});

test("a failed enqueue is logged and swallowed, not thrown out of the handler", async () => {
  const runs: string[] = [];
  await onScheduledFiring(MIDNIGHT, {
    enqueueRun: async (run) => {
      runs.push(run.name);
      throw new Error("runner down");
    },
  });
  assert.deepEqual(runs, ["end-of-day"]);
});

test("each run is planned with its jobs, keyed by the ET day it is for", () => {
  const morning = planRun("morning", MORNING);
  assert.equal(morning.date, "2026-09-29");
  assert.deepEqual(morning.jobs.map((j) => [j.key, j.kind]), [
    ["figma-library-post", "figma-library-post"],
    ["figma-library-track", "figma-library-track"],
    ["sweep-post", "sweep-post"],
    ["ds-precedence-post", "ds-precedence-post"],
    ["commitment-nudge", "commitment-nudge"],
    // A live drift question is looked at again before the morning asks anew.
    ["figma-drift-recheck", "figma-drift-recheck"],
    ["figma-drift-post", "figma-drift-post"],
    ["team-roles-sync", "team-roles-sync"],
    // Both runs purge, so text never outlives its 14 days over a weekend.
    ["usage-text-purge", "usage-text-purge"],
  ]);
  const endOfDay = planRun("end-of-day", MIDNIGHT);
  assert.equal(endOfDay.date, "2026-09-29");
  assert.deepEqual(endOfDay.jobs.map((j) => [j.key, j.kind, j.after]), [
    ["figma-library-poll", "figma-library-poll", undefined],
    ["card-follow-through", "card-follow-through", undefined],
    ["figma-drift-recheck", "figma-drift-recheck", undefined],
    // The Figma backstop's sweep, in as many jobs as it may need (#896).
    ["figma-backstop-1", "figma-backstop", undefined],
    ["figma-backstop-2", "figma-backstop", undefined],
    ["figma-backstop-3", "figma-backstop", undefined],
    // One job per classification batch.
    ["usage-classify-1", "usage-classify", undefined],
    ["usage-classify-2", "usage-classify", undefined],
    ["usage-classify-3", "usage-classify", undefined],
    ["usage-classify-4", "usage-classify", undefined],
    ["usage-classify-5", "usage-classify", undefined],
    // One job per `PASS_LIMIT` asks (src/usage/resolution-pass.ts).
    ["ask-resolution-1", "ask-resolution", undefined],
    ["ask-resolution-2", "ask-resolution", undefined],
    ["ask-resolution-3", "ask-resolution", undefined],
    ["ask-resolution-4", "ask-resolution", undefined],
    ["ask-resolution-5", "ask-resolution", undefined],
    ["ask-resolution-6", "ask-resolution", undefined],
    // Waits on nothing, so it runs whether or not the classify jobs did.
    ["usage-text-purge", "usage-text-purge", undefined],
    ["proposal-expiry", "proposal-expiry", undefined],
  ]);
});

test("the end-of-day run sweeps each listed channel as its own job, then the group DMs, the DMs, the notes and the cards, before the purge; the morning posts", () => {
  const endOfDay = planRun("end-of-day", MIDNIGHT, ["C0DESIGN", "C0OTHER"]);
  const jobs = endOfDay.jobs.map((j) => [j.key, j.kind, j.channel]);
  // The sweep jobs go straight before the purge; what the plan holds after it
  // stays after it.
  const purge = jobs.findIndex(([key]) => key === "usage-text-purge");
  assert.deepEqual(jobs.slice(purge - 6, purge + 1), [
    ["sweep:C0DESIGN", "sweep-channel", "C0DESIGN"],
    ["sweep:C0OTHER", "sweep-channel", "C0OTHER"],
    ["sweep:group-dms", "sweep-group-dms", undefined],
    ["sweep:dms", "sweep-dms", undefined],
    ["sweep:notes", "sweep-notes", undefined],
    ["sweep:cards", "sweep-cards", undefined],
    ["usage-text-purge", "usage-text-purge", undefined],
  ]);
  assert.deepEqual(jobs.slice(purge + 1).map(([key]) => key), ["proposal-expiry"]);
  // The channels are the end of day's alone: the morning run only posts.
  const morning = planRun("morning", MORNING, ["C0DESIGN"]).jobs;
  assert.equal(morning.some((j) => j.kind === "sweep-channel" || j.kind === "sweep-group-dms" || j.kind === "sweep-dms"), false);
  // A blank list sweeps nothing, the group DMs included.
  assert.equal(planRun("end-of-day", MIDNIGHT, []).jobs.some((j) => j.key.startsWith("sweep:")), false);
});

test("SWEEP_CHANNELS never includes #uno-bot or a DM, whatever it says", () => {
  assert.deepEqual(sweepChannelsFrom(" C0DESIGN, C0UNOBOT ,D0DM,,C0DESIGN", "C0UNOBOT"), ["C0DESIGN"]);
  assert.deepEqual(sweepChannelsFrom(undefined, "C0UNOBOT"), []);
});

test("a firing plans the end-of-day sweep over the channels it was handed", async () => {
  const runs: ScheduledRun[] = [];
  await onScheduledFiring(MIDNIGHT, {
    enqueueRun: async (run) => {
      runs.push(run);
    },
    sweepChannels: ["C0DESIGN"],
  });
  assert.deepEqual(runs[0]?.jobs.map((j) => j.key).slice(-7), [
    "sweep:C0DESIGN",
    "sweep:group-dms",
    "sweep:dms",
    "sweep:notes",
    "sweep:cards",
    "usage-text-purge",
    "proposal-expiry",
  ]);
});

test("a run's runner is never a thread's runner", () => {
  // A thread's AgentRunner is named `${channel}:${thread_ts}` — a Slack id,
  // then a ts. A run's name shares no shape with it, so a person's turn is
  // never queued behind a scheduled job on the same instance.
  for (const name of ["morning", "end-of-day"] as const) {
    const runner = runnerNameForRun(name);
    assert.doesNotMatch(runner, /^[A-Z][A-Z0-9]+:\d+(\.\d+)?$/);
    assert.notEqual(runnerNameForRun("morning"), runnerNameForRun("end-of-day"));
  }
});

test("the enqueue reaches the run's own runner, and costs one charged hop", async () => {
  const named: string[] = [];
  const bodies: unknown[] = [];
  const AGENT_RUNNER = {
    idFromName: (name: string) => {
      named.push(name);
      return name;
    },
    get: (id: string) => ({
      fetch: async (url: string, init: RequestInit) => {
        assert.equal(url, "https://do/enqueue-run");
        assert.equal(id, runnerNameForRun("end-of-day"));
        bodies.push(JSON.parse(String(init.body)));
        return Response.json({ ok: true, queued: 1 }, { status: 202 });
      },
    }),
  };
  const env = { AGENT_RUNNER } as unknown as Env;
  const run = planRun("end-of-day", MIDNIGHT);
  const hops = await runMetered(async () => {
    await enqueueScheduledRun(env, run);
    return internalSubrequestsFor("agent-runner");
  });
  assert.deepEqual(named, ["scheduled-run/end-of-day"]);
  assert.deepEqual(bodies, [run]);
  assert.equal(hops, 1);
});

test("the DS precedence check runs on Friday's end-of-day run only — Saturday 00:00 ET — right after the library poll", () => {
  // 2026-10-03 04:00 UTC is Saturday 00:00 EDT, the run that sweeps Friday 2 Oct.
  const friday = planRun("end-of-day", Date.UTC(2026, 9, 3, 4, 0));
  assert.equal(friday.date, "2026-10-02");
  assert.deepEqual(friday.jobs.slice(0, 2).map((j) => [j.key, j.after ?? []]), [
    ["figma-library-poll", []],
    ["ds-precedence-check", ["figma-library-poll"]],
  ]);
  const without = (at: number) => planRun("end-of-day", at).jobs.map((j) => j.key);
  for (let day = 29; day <= 30; day++) {
    // Tuesday and Wednesday 00:00 of the same week, which sweep Monday and
    // Tuesday, and Friday 00:00 below, which sweeps Thursday: no check.
    assert.equal(without(Date.UTC(2026, 8, day, 4, 0)).includes("ds-precedence-check"), false);
  }
  const thursday = Date.UTC(2026, 9, 2, 4, 0);
  assert.equal(without(thursday).includes("ds-precedence-check"), false);
  // The filter spares every other job, the spread-in batches included.
  assert.deepEqual(
    friday.jobs.filter((j) => j.kind !== "ds-precedence-check").map((j) => j.key),
    without(thursday),
  );
  assert.ok(friday.jobs.some((j) => j.kind === "usage-classify"));
  // In EST too: Saturday 7 Nov 00:00 is 05:00 UTC, and sweeps Friday 6 Nov.
  const est = planRun("end-of-day", Date.UTC(2026, 10, 7, 5, 0));
  assert.equal(est.date, "2026-11-06");
  assert.equal(est.jobs[1]?.key, "ds-precedence-check");
  // Another weekday's plan, on request, is that weekday's.
  assert.equal(planRun("end-of-day", MIDNIGHT, [], 5).jobs[1]?.key, "ds-precedence-check");
  // A rehearsal in working hours plans the coming night's run: today's.
  assert.equal(planRun("end-of-day", Date.UTC(2026, 9, 2, 19, 0)).jobs[1]?.key, "ds-precedence-check");
  // The post is on every morning, so a morning whose reads fail is retried.
  assert.ok(planRun("morning", Date.UTC(2026, 9, 5, 13, 0)).jobs.some((j) => j.kind === "ds-precedence-post"));
});

test("a dry run rehearses one ask-resolution job, not all of them", async () => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => lines.push(args.join(" "));
  try {
    for (const job of planRun("end-of-day", MIDNIGHT).jobs.filter((j) => j.kind === "ask-resolution")) {
      await runScheduledJob({} as Env, job, { dryRun: true, runDate: "2026-09-22" });
    }
  } finally {
    console.log = original;
  }
  // Only the first job ran; with no database bound it says so and stops.
  assert.deepEqual(lines, ["[resolution] no USAGE_DB binding — nothing to check"]);
});

test("wrangler.toml holds the two triggers these tests walk, with named weekdays", () => {
  // Cloudflare counts weekday 1 as Sunday, so the days are named, and the
  // helper the schedule tests walk (helpers/cron.ts) models exactly these.
  const toml = readFileSync(resolve(process.cwd(), "wrangler.toml"), "utf8");
  assert.match(toml, /^crons = \["0 4,5 \* \* TUE-SAT", "0 13,14 \* \* MON-FRI"\]$/m);
});
