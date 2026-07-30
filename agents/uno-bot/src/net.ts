// Request-scoped subrequest meter.
//
// Cloudflare's free plan caps ONE Worker invocation at 50 outbound subrequests.
// Call 51 doesn't fail gracefully: the invocation dies, so the reply is never
// posted — the 👀-then-silence mode (live 2026-07-10, 2026-07-13).
//
// The budget gate used to run on a GUESS: a hand-typed per-tool cost table plus
// a flat PRE_GROUNDING_OVERHEAD, none of it ever compared against reality. The
// guesses drifted (notion_search was priced 4 while scope 'apps' really spent 6)
// and nothing could notice, because nothing counted. This module counts.
//
// The counter lives in AsyncLocalStorage, so it is per-invocation without every
// integration having to thread a context object through its signature. Outside a
// metered context (cron, OAuth callbacks, health checks) countedFetch is a plain
// fetch and the counters stay at zero — those paths have no budget to protect.
import { AsyncLocalStorage } from "node:async_hooks";

interface Meter {
  count: number;
  /** Per-host tallies for the `[budget]` telemetry line. */
  byHost: Record<string, number>;
  /** Marks set by markToolStart, used to attribute spend to a tool call. */
  mark: number;
}

const meterStore = new AsyncLocalStorage<Meter>();

/**
 * Run `fn` with a fresh subrequest counter. Wrap whatever the 50-subrequest cap
 * applies to — one Worker invocation / one DO alarm firing.
 *
 * @param fn - The invocation body
 */
export function runMetered<T>(fn: () => Promise<T>): Promise<T> {
  return meterStore.run({ count: 0, byHost: {}, mark: 0 }, fn);
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
export function charge(n: number, host = "durable-object"): void {
  const m = meterStore.getStore();
  if (!m) return;
  m.count += n;
  m.byHost[host] = (m.byHost[host] ?? 0) + n;
}

/** Snapshot the counter so the next markToolEnd can attribute a tool's spend. */
export function markToolStart(): void {
  const m = meterStore.getStore();
  if (m) m.mark = m.count;
}

/** Subrequests spent since the last markToolStart. */
export function spentSinceMark(): number {
  const m = meterStore.getStore();
  return m ? m.count - m.mark : 0;
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
 * The ONE outbound fetch for this Worker. Counts the call, then applies the
 * timeout guard (Workers have no per-fetch timeout — without it a slow upstream
 * pins the invocation).
 *
 * Every network call in src/ goes through here; `scripts/check-fetch.mjs`
 * fails the build on a bare `fetch(` anywhere else, because an uncounted call
 * site is exactly the drift this module exists to end.
 *
 * @param input - URL
 * @param init - Standard fetch init; a caller-supplied `signal` still applies
 * @param timeoutMs - Abort after this long
 */
export async function countedFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<Response> {
  const m = meterStore.getStore();
  if (m) {
    m.count += 1;
    let host = "unknown";
    try {
      host = new URL(input).host;
    } catch {
      // Non-absolute URL (DO stub targets) — keep the count, skip the label.
    }
    m.byHost[host] = (m.byHost[host] ?? 0) + 1;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // A caller that already has its own signal (a shared per-operation abort)
  // keeps it: abort either way. Workers support AbortSignal.any.
  const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
  try {
    return await fetch(input, { ...init, signal });
  } finally {
    clearTimeout(timer);
  }
}
