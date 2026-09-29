// The cron firing: a scheduled run on two slots, and nothing on the rest.
//
// No cron was added for the runs. The weekday `*/15 13-23` trigger already
// fires at 14:00 and 22:00 UTC, so the handler reads the scheduled time and
// enqueues the matching run. The Figma library poll that used to run on every
// firing is the end-of-day run's job now. Driven through the firing's named
// dependency, so the test sees exactly what it asked for.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  onScheduledFiring,
  planRun,
  runnerNameForRun,
  runsForFiring,
  type ScheduledRun,
} from "../src/scheduled/runs";
import { enqueueScheduledRun } from "../src/scheduled/jobs";
import { internalSubrequestsFor, runMetered } from "../src/net";
import type { Env } from "../src/types";

/** A firing at `hh:mm` UTC on a weekday (2026-09-29 is a Tuesday). */
const at = (hh: number, mm: number): number => Date.UTC(2026, 8, 29, hh, mm);

/** Every quarter-hour the weekday cron fires at. */
function everyFiring(): number[] {
  const times: number[] = [];
  for (let h = 13; h <= 23; h++) for (const m of [0, 15, 30, 45]) times.push(at(h, m));
  return times;
}

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
  assert.deepEqual(planRun("end-of-day", at(22, 0)).jobs.map((j) => j.kind), [
    "figma-library-poll",
    "usage-classify",
    "usage-classify",
    "usage-classify",
    "usage-classify",
    "usage-classify",
    "usage-text-purge",
  ]);
});

test("14:00 UTC enqueues the morning run and 22:00 UTC the end-of-day run", async () => {
  const morning = await fire(at(14, 0));
  assert.deepEqual(morning.runs.map((r) => [r.name, r.date]), [["morning", "2026-09-29"]]);

  const endOfDay = await fire(at(22, 0));
  assert.deepEqual(endOfDay.runs.map((r) => [r.name, r.date]), [["end-of-day", "2026-09-29"]]);
});

test("no other firing enqueues a run", async () => {
  const others = everyFiring().filter((t) => t !== at(14, 0) && t !== at(22, 0));
  assert.equal(others.length, 42);
  for (const t of others) {
    const { runs } = await fire(t);
    assert.deepEqual(runs, [], new Date(t).toISOString());
  }
  // A firing that lands a few seconds late is still the same slot; one in the
  // neighbouring quarter-hour is not.
  assert.deepEqual(runsForFiring(at(14, 0) + 20_000), ["morning"]);
  assert.deepEqual(runsForFiring(at(14, 15)), []);
});

test("a failed enqueue is logged and swallowed, not thrown out of the handler", async () => {
  const runs: string[] = [];
  await onScheduledFiring(at(22, 0), {
    enqueueRun: async (run) => {
      runs.push(run.name);
      throw new Error("runner down");
    },
  });
  assert.deepEqual(runs, ["end-of-day"]);
});

test("each run is planned with its jobs, keyed by the UTC run date", () => {
  const morning = planRun("morning", at(14, 0));
  assert.equal(morning.date, "2026-09-29");
  assert.deepEqual(morning.jobs.map((j) => [j.key, j.kind]), [
    ["figma-library-post", "figma-library-post"],
    ["figma-library-track", "figma-library-track"],
    // Both runs purge, so text never outlives its 14 days over a weekend.
    ["usage-text-purge", "usage-text-purge"],
  ]);
  const endOfDay = planRun("end-of-day", at(22, 0));
  assert.deepEqual(endOfDay.jobs.map((j) => [j.key, j.kind, j.after]), [
    ["figma-library-poll", "figma-library-poll", undefined],
    // One job per classification batch.
    ["usage-classify-1", "usage-classify", undefined],
    ["usage-classify-2", "usage-classify", undefined],
    ["usage-classify-3", "usage-classify", undefined],
    ["usage-classify-4", "usage-classify", undefined],
    ["usage-classify-5", "usage-classify", undefined],
    // Waits on nothing, so it runs whether or not the classify jobs did.
    ["usage-text-purge", "usage-text-purge", undefined],
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
  const run = planRun("end-of-day", at(22, 0));
  const hops = await runMetered(async () => {
    await enqueueScheduledRun(env, run);
    return internalSubrequestsFor("agent-runner");
  });
  assert.deepEqual(named, ["scheduled-run/end-of-day"]);
  assert.deepEqual(bodies, [run]);
  assert.equal(hops, 1);
});
