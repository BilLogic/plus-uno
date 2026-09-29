// Durable Object: escape hatch from the waitUntil() 30-second guillotine.
//
// The /slack/events handler must ack Slack within 3 seconds, so agent runs used
// to live in ctx.waitUntil() — and Cloudflare CANCELS waitUntil work ~30s after
// the response is sent. Any run longer than that (default/grind tiers, several MCP
// round-trips, vision) died mid-flight with no exception and no error post:
// the "👀 then silence" failure (live incident 2026-07-09, two kills at exactly
// +30s in the logs). DO alarm handlers have NO such wall-clock cutoff — they run
// to completion — so the Worker now enqueues the Slack event here and returns,
// and the alarm executes the full message pipeline.
//
// One AgentRunner instance per Slack thread (idFromName `${channel}:${thread}`):
// runs within a thread are serialized (no interleaved replies), while separate
// threads run in parallel on separate instances. This DO deliberately does NOT
// share a class with ThreadState — the pipeline stub-calls ThreadState mid-run,
// and a DO fetch-ing itself deadlocks behind its own input gate.
//
// A scheduled run queues on an instance of its own (`runnerNameForRun`), never
// on a thread's, so a person's turn never waits behind a run's jobs.
//
// The scheduling itself — one job per alarm, the deferred retry, a run's
// ordering and idempotency — lives in src/runner/queue.ts over a storage port,
// and this class hands it `state.storage` and the job bodies. alarm() never
// rethrows: a thrown alarm is auto-retried, which would re-run a possibly
// half-delivered agent turn.

import type { Env } from "./types";
import { runMetered } from "./net";
import { onRunnerJob } from "./slack/events";
import { enqueueRun, enqueueThreadJob, runOneJob, type RunnerDeps, type RunnerJob } from "./runner/queue";
import { runScheduledJob } from "./scheduled/jobs";
import type { ScheduledRun } from "./scheduled/runs";

export class AgentRunner {
  private state: DurableObjectState;
  private deps: RunnerDeps;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.deps = {
      now: () => Date.now(),
      runThreadJob: (job) => onRunnerJob(env, job),
      runScheduledJob: (job) => runScheduledJob(env, job, { dryRun: false }),
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/enqueue") {
      const job = (await request.json()) as RunnerJob;
      await enqueueThreadJob(this.state.storage, job, Date.now());
      return new Response(JSON.stringify({ ok: true }), { status: 202 });
    }
    if (request.method === "POST" && url.pathname === "/enqueue-run") {
      const run = (await request.json()) as ScheduledRun;
      const queued = await enqueueRun(this.state.storage, run, Date.now());
      return new Response(JSON.stringify({ ok: true, queued }), { status: 202 });
    }
    return new Response("not found", { status: 404 });
  }

  alarm(): Promise<void> {
    // The job runs here, so THIS is the invocation the 50-subrequest cap
    // applies to — open the meter around the whole firing. The budget gate in
    // the agent loop, and a scheduled job's ceiling, read the counter this
    // establishes.
    return runMetered(() => runOneJob(this.state.storage, this.deps));
  }
}
