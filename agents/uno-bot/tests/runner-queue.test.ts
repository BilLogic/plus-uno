// The AgentRunner's scheduling, on the in-memory runner.
//
// The Durable Object is a shell over `src/runner/queue.ts`: it hands the
// queue its storage and the two job bodies, and the queue decides what runs
// on each alarm. So the ordering rules are asserted here, against the storage
// port, with a clock the test owns and alarms the test fires by hand:
//
//   one job per alarm — a run of N jobs takes N alarms, each with a fresh
//   budget, because two jobs in one invocation blew the 50-subrequest cap live
//
//   idempotent per (run date, job key) — alarms are at-least-once and a cron
//   can fire twice, so enqueuing a run again adds nothing it already holds
//
//   the budget keeps the job — a job the lookup ceiling cut short stays at the
//   head of the queue and runs again before any later job (ADR-022)
//
//   an assemble job waits — it does not run while a job it depends on is
//   still pending, whatever order they were queued in
//
//   a once-key queues once — a sender that redelivers (Figma, #895) gets one
//   job per key for as long as the key is remembered
import { test } from "node:test";
import assert from "node:assert/strict";
import { createInMemoryRunnerStorage, type InMemoryRunnerStorage } from "../src/runner/storage";
import { SEEN_KEEP_MS, enqueueRun, enqueueThreadJob, enqueueThreadJobOnce, runOneJob, type RunnerDeps } from "../src/runner/queue";
import { DEFER_RETRY_MS } from "../src/thread-state/index";
import {
  runMetered,
  subrequestBudgetSpent,
  SubrequestBudgetError,
  withSubrequestLimit,
} from "../src/net";
import type { ScheduledJob, ScheduledRun } from "../src/scheduled/runs";
import type { RunnerJobPayload } from "../src/slack/types";

const DATE = "2026-09-29";

function run(jobs: ScheduledJob[], date = DATE): ScheduledRun {
  return { name: "end-of-day", date, jobs };
}

const noop = (key: string, after?: string[]): ScheduledJob =>
  after ? { key, kind: "noop", after } : { key, kind: "noop" };

/** A runner the test drives: storage, a clock, and a log of what each job did. */
function harness(execute?: (job: ScheduledJob, runDate: string) => Promise<void>) {
  const storage = createInMemoryRunnerStorage();
  const clock = { t: 1_000_000 };
  const ran: string[] = [];
  const threadRan: string[] = [];
  const deps: RunnerDeps = {
    now: () => clock.t,
    runThreadJob: async (job) => {
      threadRan.push(job.kind);
      return "handled";
    },
    runScheduledJob: async (job, runDate) => {
      ran.push(job.key);
      await execute?.(job, runDate);
    },
  };
  return { storage, clock, ran, threadRan, deps };
}

/**
 * Fire alarms until none is set, the way the runtime does: advance to the
 * alarm's time, clear it, run the handler under a fresh meter. Returns how
 * many alarms fired.
 */
async function drain(h: { storage: InMemoryRunnerStorage; clock: { t: number }; deps: RunnerDeps }, cap = 50): Promise<number> {
  let firings = 0;
  for (;;) {
    const alarm = h.storage.takeAlarm();
    if (alarm === null) return firings;
    h.clock.t = Math.max(h.clock.t, alarm);
    firings += 1;
    assert.ok(firings <= cap, "the queue never settles");
    await runMetered(() => runOneJob(h.storage, h.deps));
  }
}

test("a run of N jobs takes N alarms, in plan order", async () => {
  const h = harness();
  await enqueueRun(h.storage, run([noop("a"), noop("b"), noop("c"), noop("d")]), h.clock.t);
  assert.equal(await drain(h), 4);
  assert.deepEqual(h.ran, ["a", "b", "c", "d"]);
  assert.equal((await h.storage.list({ prefix: "run:" })).size, 0, "the queue is empty");
});

test("re-enqueuing a run is idempotent per (run date, job key)", async () => {
  const h = harness();
  const plan = run([noop("a"), noop("b")]);
  await enqueueRun(h.storage, plan, h.clock.t);
  // Twice while pending: nothing doubles.
  await enqueueRun(h.storage, plan, h.clock.t);
  assert.equal(await drain(h), 2);
  // Again once done: nothing re-runs.
  await enqueueRun(h.storage, plan, h.clock.t);
  assert.equal(await drain(h), 0);
  assert.deepEqual(h.ran, ["a", "b"]);

  // The next day's run is its own: the same keys run again.
  await enqueueRun(h.storage, run([noop("a"), noop("b")], "2026-09-30"), h.clock.t);
  assert.equal(await drain(h), 2);
  assert.deepEqual(h.ran, ["a", "b", "a", "b"]);
});

test("a job cut short by the budget keeps its key and runs before later jobs", async () => {
  let tripped = 0;
  const h = harness(async (job) => {
    if (job.key === "b" && tripped === 0) {
      tripped += 1;
      throw new SubrequestBudgetError(38);
    }
  });
  await enqueueRun(h.storage, run([noop("a"), noop("b"), noop("c")]), h.clock.t);

  const before = h.clock.t;
  assert.equal(await drain(h), 4, "three jobs and one retry");
  assert.deepEqual(h.ran, ["a", "b", "b", "c"]);
  assert.ok(h.clock.t >= before + DEFER_RETRY_MS, "the retry waited the deferred interval");
});

test("a job is handed its run's date, also when its retry runs on a later calendar day", async () => {
  // The end-of-day run fires at 00:00 ET and is dated to the ET day it
  // sweeps, the one before: a job the budget stops, and its retry, run on
  // the next calendar day, still under the run's date.
  const dates: string[] = [];
  let tripped = false;
  const h = harness(async (job, runDate) => {
    dates.push(`${job.key} ${runDate}`);
    if (!tripped) {
      tripped = true;
      throw new SubrequestBudgetError(38);
    }
  });
  h.clock.t = Date.UTC(2026, 11, 1, 23, 58);
  await enqueueRun(h.storage, run([noop("sweep")], "2026-12-01"), h.clock.t);
  await drain(h);
  assert.ok(h.clock.t >= Date.UTC(2026, 11, 2), "the retry ran on the next UTC day");
  assert.deepEqual(dates, ["sweep 2026-12-01", "sweep 2026-12-01"]);
});

test("a read the ceiling stopped without throwing still defers the job", async () => {
  // A paging loop returns a partial read cleanly instead of throwing; the trip
  // counter is what tells the queue the job came up short.
  let calls = 0;
  const h = harness(async (job) => {
    if (job.key !== "a" || calls++ > 0) return;
    await withSubrequestLimit(0, async () => {
      subrequestBudgetSpent();
    });
  });
  await enqueueRun(h.storage, run([noop("a"), noop("b")]), h.clock.t);
  await drain(h);
  assert.deepEqual(h.ran, ["a", "a", "b"]);
});

test("an assemble job waits for the jobs it depends on", async () => {
  const h = harness();
  // Queued FIRST, so position alone would run it first.
  await enqueueRun(
    h.storage,
    run([noop("assemble", ["x", "y"]), noop("x"), noop("y"), noop("z")]),
    h.clock.t,
  );
  assert.equal(await drain(h), 4);
  assert.deepEqual(h.ran, ["x", "y", "assemble", "z"]);
});

test("an assemble job still waits while a dependency is deferred", async () => {
  let deferrals = 0;
  const h = harness(async (job) => {
    if (job.key === "x" && deferrals++ < 2) throw new SubrequestBudgetError(38);
  });
  await enqueueRun(h.storage, run([noop("x"), noop("assemble", ["x"])]), h.clock.t);
  await drain(h);
  assert.deepEqual(h.ran, ["x", "x", "x", "assemble"]);
});

test("a job that fails is dropped, and the run moves on", async () => {
  const h = harness(async (job) => {
    if (job.key === "a") throw new Error("upstream 500");
  });
  await enqueueRun(h.storage, run([noop("a"), noop("b")]), h.clock.t);
  assert.equal(await drain(h), 2);
  assert.deepEqual(h.ran, ["a", "b"]);
});

test("a job the budget keeps stopping is given up on, not retried forever", async () => {
  const h = harness(async (job) => {
    if (job.key === "a") throw new SubrequestBudgetError(38);
  });
  await enqueueRun(h.storage, run([noop("a"), noop("b")]), h.clock.t);
  const firings = await drain(h);
  assert.ok(firings < 10, `${firings} firings`);
  assert.equal(h.ran.at(-1), "b");
});

test("thread jobs keep their behaviour: one per alarm, a deferred one kept", async () => {
  let deferOnce = true;
  const h = harness();
  h.deps.runThreadJob = async (job) => {
    h.threadRan.push(job.kind);
    if (job.kind === "reaction" && deferOnce) {
      deferOnce = false;
      return "deferred";
    }
    return "handled";
  };
  const cutOff: RunnerJobPayload = { kind: "cut-off", proposalTs: "1.2" };
  const reaction = { kind: "reaction", event: {} } as unknown as RunnerJobPayload;
  await enqueueThreadJob(h.storage, { job: reaction, enqueuedAt: 1 }, h.clock.t);
  await enqueueThreadJob(h.storage, { job: cutOff, enqueuedAt: 2 }, h.clock.t);
  assert.equal(await drain(h), 3);
  assert.deepEqual(h.threadRan, ["reaction", "reaction", "cut-off"]);
});

// ── once per key (#895) ──────────────────────────────────────────────────────

const figmaJob = (eventId: string): RunnerJobPayload => ({
  kind: "figma-event",
  event: { eventId, type: "FILE_COMMENT", webhookId: "w1", fileKey: "FILE", commentId: eventId.split(":")[1]! },
});

test("a once-key queues one job, and a repeat of it queues nothing", async () => {
  const h = harness();
  assert.equal(await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 1 }, "comment:1", h.clock.t), true);
  assert.equal(await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 2 }, "comment:1", h.clock.t), false);
  assert.equal(await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:2"), enqueuedAt: 3 }, "comment:2", h.clock.t), true);
  assert.equal(await drain(h), 2, "one alarm per queued job");
  assert.deepEqual(h.threadRan, ["figma-event", "figma-event"]);
});

test("a repeat after its job has run still queues nothing, for as long as the key is kept", async () => {
  const h = harness();
  await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 1 }, "comment:1", h.clock.t);
  await drain(h);
  // Figma's last retry lands 3 h 35 min after the first failure.
  h.clock.t += 4 * 60 * 60 * 1000;
  assert.equal(await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 2 }, "comment:1", h.clock.t), false);
  assert.equal(await drain(h), 0);
});

test("a once-key past its window is forgotten, and old marks are dropped as new keys arrive", async () => {
  const h = harness();
  await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 1 }, "comment:1", h.clock.t);
  h.clock.t += SEEN_KEEP_MS + 1;
  await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:2"), enqueuedAt: 2 }, "comment:2", h.clock.t);
  assert.deepEqual([...(await h.storage.list({ prefix: "seen:" })).keys()], ["seen:comment:2"]);
  assert.equal(await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 3 }, "comment:1", h.clock.t), true);
});

test("a once-key job waits its turn among the thread's jobs, and sets the alarm", async () => {
  const h = harness();
  await enqueueThreadJob(h.storage, { job: { kind: "cut-off", proposalTs: "1.2" }, enqueuedAt: 1 }, h.clock.t);
  await enqueueThreadJobOnce(h.storage, { job: figmaJob("comment:1"), enqueuedAt: 2 }, "comment:1", h.clock.t);
  assert.notEqual(await h.storage.getAlarm(), null);
  await drain(h);
  assert.deepEqual(h.threadRan, ["cut-off", "figma-event"]);
});
