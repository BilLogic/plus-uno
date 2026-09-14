// One HEADLESS turn for evals + reasoning investigation, through the SAME
// Turn module a Slack message takes (#499): the eval case becomes a
// `TurnRequest`, `Env` becomes the turn's deps, and the only two that differ
// from production record instead of acting — Delivery posts nothing, and a
// resolution is captured rather than executed. So preflight, the confidence
// pre-check, the absence check and the draft judge all run here exactly as
// they run for a designer, which the 127-line driver this route used to carry
// could not do. Multi-turn flows are driven by the CALLER passing
// history/pending back in (no Durable Object is touched — the store is
// in-memory, seeded from that history). Token-gated: every call is a live
// billable model run. Driven by scripts/run-evals.mjs; scenarios in
// docs/evals/.
//
// VERBATIM, alone among the probes: the adapter's response already carries the
// envelope's own fields — `build`, `ms`, and the meter — and the eval runner
// reads that shape field by field, so the router passes it through untouched
// rather than merging a second reading over it.
import { handleEvalTurn } from "../../eval/turn-adapter";
import type { ProbeRun } from "../probe";

export const turnEvalProbe: ProbeRun = async (env, _url, request) => ({
  verbatim: await handleEvalTurn(request, env),
});
