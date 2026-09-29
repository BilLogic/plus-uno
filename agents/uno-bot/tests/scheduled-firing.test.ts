// The cron firing: the Figma poll on every one, a scheduled run on two.
//
// No cron was added for the runs. The weekday `*/15 13-23` trigger already
// fires at 14:00 and 22:00 UTC, so the handler reads the scheduled time and
// enqueues the matching run beside the poll. Driven through the firing's named
// dependencies, so the test sees exactly which of the two it asked for.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  onScheduledFiring,
  planRun,
  runnerNameForRun,
  runsForFiring,
  type ScheduledRun,
} from "../src/scheduled/runs";

/** A firing at `hh:mm` UTC on a weekday (2026-09-29 is a Tuesday). */
const at = (hh: number, mm: number): number => Date.UTC(2026, 8, 29, hh, mm);

/** Every quarter-hour the weekday cron fires at. */
function everyFiring(): number[] {
  const times: number[] = [];
  for (let h = 13; h <= 23; h++) for (const m of [0, 15, 30, 45]) times.push(at(h, m));
  return times;
}

async function fire(scheduledTime: number) {
  const polls: number[] = [];
  const runs: ScheduledRun[] = [];
  await onScheduledFiring(scheduledTime, {
    pollFigma: async () => {
      polls.push(scheduledTime);
    },
    enqueueRun: async (run) => {
      runs.push(run);
    },
  });
  return { polls, runs };
}

test("the Figma poll runs on every firing, exactly once", async () => {
  for (const t of everyFiring()) {
    const { polls } = await fire(t);
    assert.equal(polls.length, 1, new Date(t).toISOString());
  }
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

test("a failed enqueue does not cost the Figma poll, nor a failed poll the run", async () => {
  const polls: string[] = [];
  const runs: string[] = [];
  await onScheduledFiring(at(22, 0), {
    pollFigma: async () => {
      polls.push("ran");
      throw new Error("figma down");
    },
    enqueueRun: async (run) => {
      runs.push(run.name);
      throw new Error("runner down");
    },
  });
  assert.deepEqual(polls, ["ran"]);
  assert.deepEqual(runs, ["end-of-day"]);
});

test("each run is planned as its no-op job, keyed by the UTC run date", () => {
  const run = planRun("morning", at(14, 0));
  assert.equal(run.date, "2026-09-29");
  assert.deepEqual(run.jobs.map((j) => [j.key, j.kind]), [["noop", "noop"]]);
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
