// The eval runner's TURN TRANSPORT — how one headless agent turn is actually
// run (#511).
//
// The runner used to POST to the deployed Worker's /debug/eval route inline,
// which made a deployment a precondition for running ANY of it: the fixture
// walk, the subject substitution, the deterministic checks, the history
// threading and the sampling arithmetic all sat behind a live URL and a debug
// token. The composition of four tested helpers was itself untestable.
//
// So the turn is a dependency now. A transport is an object:
//
//   {
//     name,                                  // for the log and the results file
//     runTurn({ prompt, history, pending, surface }) -> Promise<response>,
//     fetchSubject?(need, case) -> Promise<{ subject | null, reason?, error?, build? }>,
//   }
//
// `response` is the /debug/eval response shape the scoring reads. Its field
// names are not listed here: they have one definition, `EVAL_RESPONSE_FIELDS`
// in src/eval/turn-case.ts, which is the module that builds the envelope and
// the one the parity test reads it off.
//
// A transport that cannot answer a run-time subject omits `fetchSubject`, and the
// runner fails the cases that declare one by name rather than pretending the
// board answered. The case travels beside the condition for a transport that
// answers per case — this one asks the live board, so the row it gets back is
// about the condition and the case adds nothing.
//
// `workerTransport` below is the adapter for the deployed Worker — the POST
// that used to be inline, unchanged in what it sends. The in-process adapter
// that calls the Turn module directly is #512.

import { fetchSubject } from "./eval-subjects.mjs";

/** Agent turns can legally run for minutes; this is the ceiling, not a target. */
export const TURN_TIMEOUT_MS = 8 * 60_000;

/**
 * The deployed Worker as a turn transport: POST /debug/eval, token-gated.
 *
 * @param {string} workerUrl - the Worker origin
 * @param {string} token - the Worker's /debug/* gate token
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [opts]
 */
export function workerTransport(workerUrl, token, { fetchImpl = fetch, timeoutMs = TURN_TIMEOUT_MS, now = Date.now } = {}) {
  const origin = String(workerUrl).replace(/\/+$/, "");
  return {
    name: `worker ${origin}`,
    async runTurn({ prompt, history, pending, surface = {} }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = now();
      try {
        const res = await fetchImpl(`${origin}/debug/eval`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-debug-token": token },
          // channel/requestedBy default to the synthetic C_EVAL/U_EVAL server-side.
          // A case sets them when the SURFACE is the thing under test — own-DM
          // visibility (ADR-020) is unreachable from a channel that never starts
          // with "D", so an assertion about it would otherwise pass for the wrong
          // reason.
          body: JSON.stringify({ prompt, history, pending, ...surface }),
          signal: controller.signal,
        });
        return readEnvelope(res, await res.text(), now() - startedAt);
      } finally {
        clearTimeout(timer);
      }
    },
    fetchSubject: (need) => fetchSubject(need, { workerUrl: origin, token, fetchImpl }),
  };
}

/** How much of a page that is not the envelope the error line quotes. */
const PAGE_EXCERPT_CHARS = 120;

/**
 * The route's reply as the runner reads it: the envelope, or a failed turn that
 * says what came back instead.
 *
 * The Worker answers its own failures in JSON — a dep that threw, a model 502 —
 * so a reply that is not JSON is the platform's: Cloudflare's HTML error page
 * (1101 an uncaught exception, 1102 a resource limit) or an edge 5xx. Live run
 * 36694075577 recorded six of them as `Unexpected token '<'` and nothing else,
 * which cannot tell a resource limit from a rate limit. So the status, the
 * page's error code and title, the ray id and the time to the reply travel in
 * `http`, and the error line leads with the status and the code.
 *
 * `http` is the RUNNER's reading of the reply, beside the Worker's fields; the
 * top-level `ms` stays the Worker's own turn time, which a page that ran no
 * turn has none of.
 *
 * @param {{status: number, headers?: {get(name: string): string | null}}} res
 * @param {string} body
 * @param {number} ms - request to reply, as the runner timed it
 */
export function readEnvelope(res, body, ms) {
  const { status } = res;
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = undefined;
  }
  if (parsed && typeof parsed === "object") {
    return status >= 500 ? { ...parsed, http: { status } } : parsed;
  }
  const text = String(body ?? "");
  const contentType = res.headers?.get("content-type") ?? undefined;
  const ray = res.headers?.get("cf-ray") ?? undefined;
  const cfError =
    text.match(/cf-error-code[^>]*>\s*(\d{3,4})/)?.[1] ?? text.match(/\bError(?: code)?:?\s+(1\d{3}|5\d\d)\b/)?.[1];
  const title = text.match(/<title>\s*([^<]*?)\s*<\/title>/i)?.[1] || undefined;
  const what = cfError
    ? ` — Cloudflare error ${cfError}${title ? ` (${title.split(" | ")[0]})` : ""}`
    : `: ${text.replace(/\s+/g, " ").trim().slice(0, PAGE_EXCERPT_CHARS)}`;
  return {
    ok: false,
    error: `HTTP ${status}, not JSON${what}`,
    http: {
      status,
      nonJson: true,
      ...(contentType ? { contentType } : {}),
      ...(cfError ? { cfError } : {}),
      ...(title ? { title } : {}),
      ...(ray ? { ray } : {}),
      ms,
    },
  };
}
