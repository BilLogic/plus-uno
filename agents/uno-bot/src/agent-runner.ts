// Durable Object: escape hatch from the waitUntil() 30-second guillotine.
//
// The /slack/events handler must ack Slack within 3 seconds, so agent runs used
// to live in ctx.waitUntil() — and Cloudflare CANCELS waitUntil work ~30s after
// the response is sent. Any run longer than that (sonnet/opus tiers, several MCP
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
// alarm() catches per job and never rethrows: a thrown alarm is auto-retried,
// which would re-run a possibly half-delivered agent turn. The pipeline's own
// visible-failure posts remain the user-facing error path.

import type { Env } from "./types";
import {
  onRunnerJob,
  type RunnerJobPayload,
} from "./slack/events";

interface RunnerJob {
  job: RunnerJobPayload;
  enqueuedAt: number;
}

const JOB_PREFIX = "job:";

export class AgentRunner {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/enqueue") {
      const job = (await request.json()) as RunnerJob;
      // Monotonic-enough key: jobs drain in enqueue order within the thread.
      const key = `${JOB_PREFIX}${String(job.enqueuedAt).padStart(15, "0")}:${crypto.randomUUID()}`;
      await this.state.storage.put(key, job);
      if ((await this.state.storage.getAlarm()) === null) {
        await this.state.storage.setAlarm(Date.now());
      }
      return new Response(JSON.stringify({ ok: true }), { status: 202 });
    }
    return new Response("not found", { status: 404 });
  }

  async alarm(): Promise<void> {
    // ONE job per alarm invocation — free-tier Workers cap subrequests at 50
    // per invocation, and a single agent turn spends most of that budget
    // (22 harness fetches + Slack + DO + Anthropic). Processing a second job
    // in the same invocation blew the cap live (2026-07-10: "Too many
    // subrequests"), killing the first job's reply delivery. Each alarm
    // firing gets a FRESH budget, so drain the queue one job per firing.
    const jobs = await this.state.storage.list<RunnerJob>({ prefix: JOB_PREFIX, limit: 1 });
    for (const [key, job] of jobs) {
      try {
        await onRunnerJob(this.env, job.job);
      } catch (err) {
        // Never rethrow: alarm retries would re-run the agent turn.
        console.error(`[runner] job failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await this.state.storage.delete(key);
      }
    }
    // More queued (the drained job's sibling duplicate, or new arrivals):
    // process them in a fresh invocation with a fresh subrequest budget.
    const remaining = await this.state.storage.list({ prefix: JOB_PREFIX, limit: 1 });
    if (remaining.size > 0) {
      await this.state.storage.setAlarm(Date.now());
    }
  }
}
