// The Diagnostics router: one auth check, one envelope, one error shape.
//
// Every probe used to be an `if (pathname === …)` block in the Worker entry
// that repeated the auth line, decided for itself whether to report a build or
// a duration, and reported a failure in whatever shape the author reached for
// that day. Three of the eleven measured subrequests; the rest were silent
// about the number that kills an invocation (ADR-022). So the three things
// every probe shares live here, and a probe body is only its own question.
//
// WHAT A PROBE KEEPS. Its existing payload is returned as it was, field for
// field — `/health/blueprint`'s booleans, `/debug/blueprint-search`'s rows,
// `/debug/gemini`'s sample line — because scripts, CI and the eval runners read
// those fields by name. The envelope is ADDITIVE and merged UNDER the payload,
// so a probe that already reports `build`, `ms` or `subrequests` from its own
// inner meter keeps its own value.
//
// Generic over the environment, and typed against the token alone, so this
// file names no Workers type and the Node test suite drives it with fake
// probes.
import { debugAuthorized, type DebugTokenEnv } from "./auth";
import type { ProbeRoute } from "./routes";

/** The subrequest accounting every probe report carries (ADR-022). */
export interface MeterReading {
  /** External subrequests spent — the ones capped at 50. */
  subrequests: number;
  /** Per-host breakdown, e.g. `slack.com:4 | internal do:2`. */
  subrequest_hosts: string;
  /** Cloudflare-service hops — a separate bucket, separate cap. */
  internal_subrequests: number;
  /** How many reads the budget stopped: a rise means a partial answer. */
  budget_trips: number;
}

/** The shared envelope, merged under every probe payload. */
export interface ProbeEnvelope extends MeterReading {
  build: string;
  ms: number;
}

/** A probe's own payload. */
export type ProbeBody = Record<string, unknown>;

/**
 * What a probe hands back.
 *
 * `body` is the common case: JSON, wrapped in the envelope. `verbatim` is for a
 * probe that already reports the envelope itself — `/debug/eval`, whose
 * adapter's response shape is read field-by-field by the eval runner.
 */
export type ProbeReport =
  | { readonly body: ProbeBody; readonly status?: number }
  | { readonly verbatim: Response };

/** One diagnostic question, at one address. */
export interface Probe<E extends DebugTokenEnv> extends ProbeRoute {
  readonly name: string;
  run(env: E, url: URL, request: Request): Promise<ProbeReport>;
}

/** What the router needs to stamp an envelope. */
export interface RouterContext {
  readonly build: string;
  meter(): MeterReading;
  /** Clock seam for the tests. */
  now?: () => number;
}

/**
 * The shared error shape.
 *
 * A probe reports a failure AS a failure. Read as "nothing there", a broken
 * read sends someone tuning the thing that works — the false-absence bug this
 * codebase keeps having to fix.
 *
 * @param err - Whatever was thrown
 */
export function probeFailure(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

/** A probe payload, wrapped. */
export function probeBody(body: ProbeBody, status?: number): ProbeReport {
  return status === undefined ? { body } : { body, status };
}

/**
 * Answer a diagnostic request: find the probe, gate it once, run it, envelope
 * the result.
 *
 * An unmatched path — and a matched path asked with the wrong method — gets the
 * same `404 not found` an unauthorized probe gets, which is the same answer the
 * entry's fall-through gave before.
 *
 * @param probes - The registered table
 * @param request - The inbound request
 * @param url - Its parsed URL
 * @param env - The Worker environment, passed to the probe
 * @param ctx - Build id, meter and clock
 */
export async function routeProbes<E extends DebugTokenEnv>(
  probes: readonly Probe<E>[],
  request: Request,
  url: URL,
  env: E,
  ctx: RouterContext,
): Promise<Response> {
  const probe = probes.find((p) => p.path === url.pathname && p.method === request.method);
  if (!probe) return notFound();
  if (probe.auth === "debug-token" && !debugAuthorized(request, env)) return notFound();

  const now = ctx.now ?? (() => Date.now());
  const startedAt = now();
  const envelope = (): ProbeEnvelope => ({
    build: ctx.build,
    ms: now() - startedAt,
    ...ctx.meter(),
  });

  try {
    const report = await probe.run(env, url, request);
    if ("verbatim" in report) return report.verbatim;
    return Response.json({ ...envelope(), ...report.body }, { status: report.status ?? 200 });
  } catch (err) {
    // A probe that throws still answers in the shared shape: the envelope says
    // what the attempt cost, the error shape says what broke.
    return Response.json({ ...envelope(), ...probeFailure(err) }, { status: 500 });
  }
}

/** The one 404 — an unknown probe and a closed one are indistinguishable. */
function notFound(): Response {
  return new Response("not found", { status: 404 });
}
