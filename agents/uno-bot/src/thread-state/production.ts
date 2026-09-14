// The one place production's ThreadState is constructed.
//
// Every caller in the Worker reaches thread memory through `threadStateFor(env)`
// and nothing else touches `env.THREAD_STATE`. That is what makes the keying
// seam real: the Durable Object id is computed inside the adapter (one global
// instance today), so no Slack handler, no agent loop and no scheduler has ever
// to know a Durable Object exists — and when the per-thread AgentRunner keying
// joins the module, it changes one function in `durable-object.ts` rather than
// a dozen call sites.
//
// WHY THIS IS A SEPARATE FILE and not `index.ts`. `index.ts` is compiled by
// `tsconfig.test.json`, which types only Node. This file names `Env` and so,
// transitively, every Workers type in `src/types.ts` — and the adapter it
// builds names `DurableObjectNamespace` outright. Re-exporting either from the
// module's front door would drag Workers globals into every module test and
// break the compile that keeps the rest of the module runtime-free. The Worker
// has the Workers types and pays the import path instead; read the note at the
// top of `index.ts` for the same reasoning from the other side.
//
// This is also the ONLY module file that takes `Env` — the interface itself
// takes named dependencies (`ThreadStateDeps`), which is what lets a test build
// a clock and nothing else. `Env` stops here, at the boundary.

import type { Env } from "../types";
import { createDurableObjectThreadState } from "./durable-object";
import type { ThreadState } from "./store";

/**
 * Production's store: the Durable Object adapter over the `THREAD_STATE`
 * binding, with the clock left at its default (`Date.now`).
 *
 * Cheap to call — it closes over the namespace and returns; the subrequest
 * charge (ADR-022) is spent per METHOD call, inside the adapter's `hop()`, not
 * here. So a handler may build one store and hold it for the turn, or call this
 * where it needs it, and the meter reads the same either way.
 */
export function threadStateFor(env: Env): ThreadState {
  return createDurableObjectThreadState({ namespace: env.THREAD_STATE });
}
