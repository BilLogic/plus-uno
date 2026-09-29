// Request-scoped subrequest meter.
//
// Cloudflare's free plan caps ONE Worker invocation at 50 EXTERNAL subrequests.
// Call 51 doesn't fail gracefully: the invocation dies, so the reply is never
// posted — the 👀-then-silence mode (live 2026-07-10, 2026-07-13). The budget
// gate can only avoid that if it knows the real number, so every outbound call
// goes through countedFetch here. Why measure instead of estimate: ADR-022.
//
// Calls to Cloudflare services (Durable Objects, KV) are a SEPARATE bucket with
// a 1,000 cap — see charge() below. They are tracked, not counted against the
// 50, because mixing the two made the gate refuse lookups the turn could afford.
//
// D1 has a cap of its own ON TOP of that: 50 queries per invocation on the Free
// plan (Cloudflare changelog 2026-02-11), separate from both buckets. A D1 query
// is charged to the internal bucket like any Cloudflare-service call AND counted
// against `D1_QUERY_CAP` — see chargeD1Query() below.
//
// The counter lives in AsyncLocalStorage, so it is per-invocation without every
// integration having to thread a context object through its signature. Metered
// entry points are the Worker fetch handler (index.ts, which covers the Slack
// webhook and its ctx.waitUntil work), the AgentRunner DO alarm that runs the
// agent turn, and the cron. Outside one — a direct integration call from a test
// — countedFetch is a plain fetch and the counters stay at zero.
import { AsyncLocalStorage } from "node:async_hooks";

interface Meter {
  /** EXTERNAL subrequests — the ones capped at 50. */
  count: number;
  /** Per-host tallies for the `[budget]` telemetry line. */
  byHost: Record<string, number>;
  /**
   * INTERNAL subrequests — Durable Object hops, KV, and any other
   * Cloudflare-service call. A separate bucket with a separate (1,000) cap, so
   * these must NOT be added to `count`: doing so makes the lookup gate refuse
   * work it could afford. Tracked anyway because unbounded internal fan-out is
   * still a way to die, just a further-off one.
   */
  internal: number;
  internalByLabel: Record<string, number>;
  /** D1 queries — also in `internal`, and capped on their own at D1_QUERY_CAP. */
  d1: number;
  /** When set, countedFetch refuses the call that would cross it. */
  limit?: number;
  /**
   * How many times the limit has stopped a read this invocation — thrown OR
   * checked by a paging loop. Monotonic, never reset: callers compare a before
   * and after reading, so nested regions can't clobber each other.
   */
  trips: number;
}

const meterStore = new AsyncLocalStorage<Meter>();

/**
 * Thrown by countedFetch when the next call would cross the active limit.
 *
 * This is what lets the budget be ENFORCED rather than forecast. The gate used
 * to need a per-tool worst-case estimate because it decided before the call and
 * a tool's cost isn't knowable until it runs; enforcing at the boundary makes
 * the ceiling unbreachable no matter what a tool costs, so the estimate — and
 * the drift it could hide — goes away entirely.
 *
 * Handlers must distinguish it from a normal failure: swallowing it turns "I ran
 * out of budget" into "there is nothing there", which is the false-absence bug
 * this codebase keeps having to fix.
 */
export class SubrequestBudgetError extends Error {
  constructor(limit: number) {
    super(`subrequest budget exhausted (limit ${limit})`);
    this.name = "SubrequestBudgetError";
  }
}

/**
 * True when the active limit is already reached, so the NEXT countedFetch would
 * throw. Lets a paging loop stop cleanly and report a partial read instead of
 * unwinding through an exception it would only have to convert back.
 */
export function subrequestBudgetSpent(): boolean {
  const m = meterStore.getStore();
  if (m?.limit == null || m.count < m.limit) return false;
  // Records a trip: the caller is about to return LESS than it was asked for.
  // A partial read reported as if it were whole is the same lie as a swallowed
  // throw, so the boundary has to hear about both.
  m.trips += 1;
  return true;
}

/**
 * Budget stops so far this invocation. Read once before a lookup and again
 * after: a rise means the result is short whatever the lookup itself reported.
 *
 * This is what makes the false-absence guarantee an INVARIANT rather than a
 * convention. `rethrowIfBudget` at every best-effort catch is a rule a future
 * `catch {}` can quietly break; a counter the boundary reads can't be broken by
 * code that never mentions it.
 */
export function subrequestBudgetTrips(): number {
  return meterStore.getStore()?.trips ?? 0;
}

/** True when `err` is the budget stop rather than an upstream failure. */
export function isSubrequestBudgetError(err: unknown): boolean {
  return err instanceof SubrequestBudgetError;
}

/**
 * Re-throw a budget stop, swallow anything else. For the best-effort catch sites
 * (optional enrichment, per-item fan-out) where an empty result is a fine answer
 * to a failure but a LIE about a budget stop.
 */
export function rethrowIfBudget(err: unknown): void {
  if (isSubrequestBudgetError(err)) throw err;
}

/**
 * Run `fn` with outbound calls capped at `limit` total subrequests for this
 * invocation. Wrap the phases that must not eat the delivery reserve — i.e.
 * grounding lookups. Delivery itself runs unlimited, against the real 50.
 *
 * @param limit - Total invocation subrequests allowed while `fn` runs
 */
export async function withSubrequestLimit<T>(limit: number, fn: () => Promise<T>): Promise<T> {
  const m = meterStore.getStore();
  if (!m) return fn();
  const previous = m.limit;
  m.limit = limit;
  try {
    return await fn();
  } finally {
    m.limit = previous;
  }
}


/**
 * Run `fn` with a fresh subrequest counter. Wrap whatever the 50-subrequest cap
 * applies to — one Worker invocation / one DO alarm firing.
 *
 * @param fn - The invocation body
 */
export function runMetered<T>(fn: () => Promise<T>): Promise<T> {
  return meterStore.run(
    { count: 0, byHost: {}, internal: 0, internalByLabel: {}, d1: 0, trips: 0 },
    fn,
  );
}

/** Subrequests spent so far in this invocation (0 outside a metered context). */
export function subrequestsUsed(): number {
  return meterStore.getStore()?.count ?? 0;
}

/**
 * Record an INTERNAL subrequest — a Durable Object hop, a KV read, anything to
 * a Cloudflare service. These don't go through fetch(), so the meter can't see
 * them, and they belong to a different budget than the outbound calls.
 *
 * Cloudflare's free plan allows "50 external subrequests and 1,000 subrequests
 * to Cloudflare services per invocation" (developers.cloudflare.com/workers/
 * platform/limits/#subrequests, verified 2026-07-30). Two buckets, not one.
 * These used to be added to the external count, which was safe but wrong: every
 * DO hop silently cost the turn a lookup it could have afforded.
 *
 * @param n - How many
 * @param label - Label for the telemetry breakdown
 */
export function charge(n: number, label: string): void {
  const m = meterStore.getStore();
  if (!m) return;
  m.internal += n;
  m.internalByLabel[label] = (m.internalByLabel[label] ?? 0) + n;
}

/**
 * D1 queries allowed per invocation — below the Free plan's 50, so the query
 * the meter refuses is ours to handle rather than the runtime's to kill.
 *
 * The headroom is for what the meter cannot see: a query issued outside a
 * metered context still spends the runtime's 50.
 */
export const D1_QUERY_CAP = 40;

/**
 * Thrown by chargeD1Query when the next query would cross `D1_QUERY_CAP`.
 *
 * A SUBCLASS of the subrequest stop, on purpose: every handler that already
 * tells a budget stop from an upstream failure (`isSubrequestBudgetError`,
 * `rethrowIfBudget`) treats a D1 refusal the same way, so running out of queries
 * can never be read as "there is nothing there".
 */
export class D1QueryBudgetError extends SubrequestBudgetError {
  constructor(cap: number) {
    super(cap);
    this.message = `D1 query budget exhausted (cap ${cap})`;
    this.name = "D1QueryBudgetError";
  }
}

/**
 * Charge one D1 query, or refuse it. Call it BEFORE the query, once per
 * statement sent — a `batch()` counts as one call here until measured
 * otherwise.
 *
 * Counts toward the internal bucket under the `d1` label, so the scheduled
 * run's dry run and the `[budget]` line both see it, and toward the D1 cap.
 *
 * @throws D1QueryBudgetError when this invocation has already spent the cap
 */
export function chargeD1Query(): void {
  const m = meterStore.getStore();
  if (!m) return;
  if (m.d1 >= D1_QUERY_CAP) {
    m.trips += 1;
    throw new D1QueryBudgetError(D1_QUERY_CAP);
  }
  m.d1 += 1;
  charge(1, "d1");
}

/** D1 queries spent so far this invocation (0 outside a metered context). */
export function d1QueriesUsed(): number {
  return meterStore.getStore()?.d1 ?? 0;
}

/** Internal (Cloudflare-service) subrequests spent so far this invocation. */
export function internalSubrequestsUsed(): number {
  return meterStore.getStore()?.internal ?? 0;
}

/**
 * Internal subrequests spent so far this invocation under one `charge` label.
 * 0 when nothing carried the label, including outside a meter.
 *
 * D1 queries are Cloudflare-service calls like any other, and `/debug/sweep`
 * reports a job's D1 count as its `"d1"` charges — so a D1 call site charges
 * `charge(1, "d1")` per query, or the sweep reads 0 for it.
 *
 * @param label - The label `charge` was given
 */
export function internalSubrequestsFor(label: string): number {
  return meterStore.getStore()?.internalByLabel[label] ?? 0;
}

/** Compact breakdown, e.g. `api.notion.com:7 slack.com:4 | internal do:2 kv:1`. */
export function meterBreakdown(): string {
  const m = meterStore.getStore();
  if (!m) return "unmetered";
  const fmt = (t: Record<string, number>): string =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([label, n]) => `${label}:${n}`)
      .join(" ");
  const external = fmt(m.byHost);
  const internal = fmt(m.internalByLabel);
  return internal ? `${external} | internal ${internal}` : external;
}

/**
 * Charge one subrequest for `url`, or refuse it. The single place the count and
 * the limit are applied — shared by countedFetch and the patched global below.
 *
 * Counts BEFORE the call and keeps the count if it throws: Cloudflare charges
 * the attempt, and over-counting costs a lookup while under-counting costs the
 * whole reply.
 *
 * @throws SubrequestBudgetError when a limit is active and already reached
 */
function meterCall(url: string): void {
  const m = meterStore.getStore();
  if (!m) return;
  if (m.limit != null && m.count >= m.limit) {
    m.trips += 1;
    throw new SubrequestBudgetError(m.limit);
  }
  m.count += 1;
  let host = "unknown";
  try {
    host = new URL(url).host;
  } catch {
    // Non-absolute URL — keep the count, skip the label.
  }
  m.byHost[host] = (m.byHost[host] ?? 0) + 1;
}

// The real fetch, captured before the patch below so countedFetch doesn't
// double-count by going through it.
const nativeFetch = globalThis.fetch.bind(globalThis);

// Meter the GLOBAL too, not just this module's export. check-fetch.mjs is a
// regex and cannot see `const f = fetch; f(url)`, so a build guard alone leaves
// the counter a convention; patching the global makes an aliased or dynamically
// resolved call cost exactly what countedFetch costs. (globalThis.fetch is
// writable in workerd — verified, not assumed.) The guard still runs: it catches
// the one case this can't, an alias captured at module scope in a file that
// evaluates before net.ts.
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  meterCall(url);
  return nativeFetch(input, init);
}) as typeof fetch;

/**
 * The ONE outbound fetch for this Worker: counts the call, and applies a timeout
 * when the caller asks for one (Workers have no per-fetch timeout, so without it
 * a slow upstream pins the invocation).
 *
 * `timeoutMs` is deliberately OPTIONAL and has no default. Counting applies to
 * every call; a timeout is a per-call-site policy. The model calls
 * (vertex/claude.ts, gemini/client.ts) are non-streaming generations that can
 * legitimately run for minutes, and a default would have silently capped them.
 *
 * Every network call in src/ goes through here; `scripts/check-fetch.mjs` fails
 * the build on a bare `fetch(` anywhere else, because an uncounted call site is
 * exactly the drift this module exists to end. A call that slips the guard is
 * still counted — the global is metered too (above) — it just loses the timeout.
 *
 * @param input - URL
 * @param init - Standard fetch init; a caller-supplied `signal` still applies
 * @param timeoutMs - Abort after this long; omit for no timeout
 * @throws SubrequestBudgetError when a limit is active and already reached
 */
export async function countedFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs?: number,
): Promise<Response> {
  meterCall(input);
  const deadline = timeoutMs == null ? undefined : AbortSignal.timeout(timeoutMs);
  // A caller that already has its own signal (a shared per-operation abort)
  // keeps it: abort either way, rather than the old code's silent clobber.
  const signal = deadline && init.signal
    ? AbortSignal.any([init.signal, deadline])
    : (deadline ?? init.signal);
  return nativeFetch(input, { ...init, ...(signal ? { signal } : {}) });
}
