// Figma notifications on `Env` — the only file in the folder that names it.
//
// What each dependency of the route becomes:
//   • the passcode: `FIGMA_WEBHOOK_PASSCODE`, a Worker secret. Its twin is the
//     GitHub secret `figma-subscriptions.yml` creates subscriptions with; the
//     value lives in those two places and nowhere else.
//   • `enqueueOnce`: one hop to the AgentRunner named `figma/events`, whose
//     `/enqueue-once` claims the event's id and queues its job in one step —
//     one runner for every Figma event, so their jobs run in order, each on its
//     own alarm. Charged as a Durable Object hop, the way `enqueueAgentJob` is.
//   • the notes: HARNESS_KV, each read and write charged as KV. A Worker
//     without the binding queues the job and writes no note.

import type { Env } from "../types";
import { charge } from "../net";
import type { RunnerJobPayload } from "../slack/types";
import type { FigmaEventJob } from "./event";
import { handleFigmaEvents, type FigmaEventsDeps, type FigmaNotes } from "./route";

/** The AgentRunner instance every Figma event queues on. */
export const FIGMA_EVENTS_RUNNER = "figma/events";

function notesOn(env: Env): FigmaNotes {
  const kv = env.HARNESS_KV;
  if (!kv) {
    return {
      get: async () => null,
      put: async (key) => console.warn(`[figma-notify] no HARNESS_KV binding — note ${key} not written`),
    };
  }
  return {
    async get(key) {
      charge(1, "kv");
      return kv.get<{ at: string }>(key, "json");
    },
    async put(key, value, ttlS) {
      charge(1, "kv");
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttlS });
    },
  };
}

/**
 * The route's dependencies, bound to `Env`.
 *
 * @param env - Worker bindings
 */
export function figmaEventsDepsFor(env: Env): FigmaEventsDeps {
  return {
    passcode: env.FIGMA_WEBHOOK_PASSCODE,
    async enqueueOnce(eventId: string, event: FigmaEventJob) {
      const stub = env.AGENT_RUNNER.get(env.AGENT_RUNNER.idFromName(FIGMA_EVENTS_RUNNER));
      charge(1, "agent-runner"); // DO stub call — a subrequest the meter can't see.
      const job: RunnerJobPayload = { kind: "figma-event", event };
      const res = await stub.fetch("https://do/enqueue-once", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ job, enqueuedAt: Date.now(), onceKey: eventId }),
      });
      if (!res.ok) throw new Error(`the runner refused the enqueue: ${res.status}`);
      const { queued } = (await res.json()) as { queued: boolean };
      return queued ? "queued" : "seen";
    },
    notes: notesOn(env),
    now: () => Date.now(),
  };
}

/**
 * `POST /figma/events`, on the Worker's bindings.
 *
 * @param request - The inbound request
 * @param env - Worker bindings
 */
export function handleFigmaEventsOnEnv(request: Request, env: Env): Promise<Response> {
  return handleFigmaEvents(request, figmaEventsDepsFor(env));
}
