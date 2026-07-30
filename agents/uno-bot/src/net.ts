// Request-scoped subrequest meter.
//
// Cloudflare's free plan caps ONE Worker invocation at 50 outbound subrequests.
// Call 51 doesn't fail gracefully: the invocation dies, so the reply is never
// posted — the 👀-then-silence mode (live 2026-07-10, 2026-07-13). The budget
// gate can only avoid that if it knows the real number, so every outbound call
// goes through countedFetch here. Why measure instead of estimate: ADR-022.
//
// The counter lives in AsyncLocalStorage, so it is per-invocation without every
// integration having to thread a context object through its signature. Metered
// entry points are the Worker fetch handler (index.ts, which covers the Slack
// webhook and its ctx.waitUntil work), the AgentRunner DO alarm that runs the
// agent turn, and the cron. Outside one — a direct integration call from a test
// — countedFetch is a plain fetch and the counters stay at zero.
import { AsyncLocalStorage } from "node:async_hooks";

interface Meter {
  count: number;
  /** Per-host tallies for the `[budget]` telemetry line. */
  byHost: Record<string, number>;
}

const meterStore = new AsyncLocalStorage<Meter>();

/**
 * Run `fn` with a fresh subrequest counter. Wrap whatever the 50-subrequest cap
 * applies to — one Worker invocation / one DO alarm firing.
 *
 * @param fn - The invocation body
 */
export function runMetered<T>(fn: () => Promise<T>): Promise<T> {
  return meterStore.run({ count: 0, byHost: {} }, fn);
}

/** Subrequests spent so far in this invocation (0 outside a metered context). */
export function subrequestsUsed(): number {
  return meterStore.getStore()?.count ?? 0;
}

/**
 * Record subrequests this module can't see. Durable Object stub calls are real
 * subrequests but don't go through fetch(); charge them explicitly.
 *
 * @param n - How many
 * @param host - Label for the telemetry breakdown
 */
export function charge(n: number, host: string): void {
  const m = meterStore.getStore();
  if (!m) return;
  m.count += n;
  m.byHost[host] = (m.byHost[host] ?? 0) + n;
}

/** Compact per-host breakdown, e.g. `api.notion.com:7 slack.com:4`. */
export function meterBreakdown(): string {
  const m = meterStore.getStore();
  if (!m) return "unmetered";
  return Object.entries(m.byHost)
    .sort((a, b) => b[1] - a[1])
    .map(([host, n]) => `${host}:${n}`)
    .join(" ");
}

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
 * exactly the drift this module exists to end.
 *
 * @param input - URL
 * @param init - Standard fetch init; a caller-supplied `signal` still applies
 * @param timeoutMs - Abort after this long; omit for no timeout
 */
export function countedFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs?: number,
): Promise<Response> {
  const m = meterStore.getStore();
  if (m) {
    m.count += 1;
    let host = "unknown";
    try {
      host = new URL(input).host;
    } catch {
      // Non-absolute URL — keep the count, skip the label.
    }
    m.byHost[host] = (m.byHost[host] ?? 0) + 1;
  }
  // Count BEFORE the call and keep the count if it throws: Cloudflare charges
  // the attempt, and over-counting costs a lookup while under-counting costs
  // the whole reply.
  const deadline = timeoutMs == null ? undefined : AbortSignal.timeout(timeoutMs);
  // A caller that already has its own signal (a shared per-operation abort)
  // keeps it: abort either way, rather than the old code's silent clobber.
  const signal = deadline && init.signal
    ? AbortSignal.any([init.signal, deadline])
    : (deadline ?? init.signal);
  return fetch(input, { ...init, ...(signal ? { signal } : {}) });
}
