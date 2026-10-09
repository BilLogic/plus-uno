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
//
// The nightly backstop (`./backstop.ts`) takes the same notes and the same
// claim-and-queue, so a change it finds is queued exactly as a notification's
// would be, plus the Figma client's folder listings, `FIGMA_TEAM_IDS`, and its
// progress in one HARNESS_KV key.

import type { Env } from "../types";
import { budgetHeadroom, charge } from "../net";
import type { RunnerJobPayload } from "../slack/types";
import { figmaClientFor } from "../figma/production";
import type { ScheduledJob } from "../scheduled/runs";
import { BACKSTOP_STATE_KEY, runBackstop, type BackstopReport, type BackstopState } from "./backstop";
import { CHANGED_TTL_S, type FigmaEventJob } from "./event";
import { handleFigmaEvents, type FigmaEventsDeps, type FigmaNotes } from "./route";
import { figmaTeamsFrom } from "./teams";

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
      // The time rides as metadata too, so the comment read lists a day's notes
      // with their times in one call rather than a get each (#900).
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttlS, metadata: value });
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

/**
 * One `figma-backstop-N` job on `Env` (#896): the nightly folder listing,
 * resumed where the last job left it.
 *
 * @param env - Worker bindings
 * @param job - The job
 * @param opts - `dryRun` lists and reads the notes, and queues and writes nothing
 */
export async function runBackstopOnEnv(env: Env, job: ScheduledJob, opts: { dryRun: boolean }): Promise<BackstopReport | { summary: string }> {
  const kv = env.HARNESS_KV;
  if (!kv) return { summary: "HARNESS_KV not bound — no notes to compare, so no backstop" };
  const figma = figmaClientFor(env);
  if (!figma) return { summary: "FIGMA_ACCESS_TOKEN not set — no backstop" };
  let teams;
  try {
    teams = figmaTeamsFrom(env.FIGMA_TEAM_IDS);
  } catch (err) {
    return { summary: `no backstop: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!teams.length) return { summary: "FIGMA_TEAM_IDS is empty — no backstop" };
  const route = figmaEventsDepsFor(env);
  return runBackstop(job, {
    figma: { teamFolders: (id, o) => figma.teamFolders(id, o), folderFiles: (id, o) => figma.folderFiles(id, o) },
    teams,
    state: {
      async get() {
        charge(1, "kv");
        return kv.get<BackstopState>(BACKSTOP_STATE_KEY, "json");
      },
      async put(state) {
        charge(1, "kv");
        // As long as a note lasts: a backstop idle that long starts afresh.
        await kv.put(BACKSTOP_STATE_KEY, JSON.stringify(state), { expirationTtl: CHANGED_TTL_S });
      },
    },
    notes: route.notes,
    enqueueOnce: route.enqueueOnce,
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  });
}
