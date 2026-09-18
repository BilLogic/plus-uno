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
export function workerTransport(workerUrl, token, { fetchImpl = fetch, timeoutMs = TURN_TIMEOUT_MS } = {}) {
  const origin = String(workerUrl).replace(/\/+$/, "");
  return {
    name: `worker ${origin}`,
    async runTurn({ prompt, history, pending, surface = {} }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
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
        return await res.json();
      } finally {
        clearTimeout(timer);
      }
    },
    fetchSubject: (need) => fetchSubject(need, { workerUrl: origin, token, fetchImpl }),
  };
}
