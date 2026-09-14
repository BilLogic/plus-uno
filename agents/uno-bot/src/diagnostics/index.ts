// Diagnostics — the probes, assembled.
//
// The module's face is one function: `handle(request, env, url)`. The Worker
// entry verifies, routes and exports Durable Objects; every question about a
// credential, a Slack surface, the blueprint schema or a headless turn is
// answered from here.
//
// The table is built by PAIRING the route datum with a body, as a
// `Record<ProbeName, ProbeRun>` — so a route with no body, or a body with no
// route, fails the typecheck rather than going quietly missing from the
// registry.
import { BUILD } from "../version";
import {
  internalSubrequestsUsed,
  meterBreakdown,
  subrequestBudgetTrips,
  subrequestsUsed,
} from "../net";
import type { Env } from "../types";
import { DIAGNOSTIC_ROUTES, type ProbeName } from "./routes";
import { routeProbes, type MeterReading, type Probe } from "./router";
import type { ProbeRun } from "./probe";
import { blueprintHealthProbe } from "./probes/blueprint-health";
import { geminiCacheProbe, geminiProbe, vertexClaudeProbe } from "./probes/providers";
import { blueprintProbe, blueprintSearchProbe, blueprintSubjectProbe } from "./probes/blueprint";
import { homeProbe, slackSearchProbe, slackStreamProbe } from "./probes/slack";
import { figmaPollProbe } from "./probes/figma";
import { turnEvalProbe } from "./probes/turn";

const PROBE_BODIES: Record<ProbeName, ProbeRun> = {
  "blueprint-health": blueprintHealthProbe,
  gemini: geminiProbe,
  "vertex-claude": vertexClaudeProbe,
  "gemini-cache": geminiCacheProbe,
  "turn-eval": turnEvalProbe,
  "slack-search": slackSearchProbe,
  "slack-stream": slackStreamProbe,
  home: homeProbe,
  blueprint: blueprintProbe,
  "blueprint-search": blueprintSearchProbe,
  "blueprint-subject": blueprintSubjectProbe,
  "figma-poll": figmaPollProbe,
};

/** Every probe this Worker serves. */
export const PROBES: readonly Probe<Env>[] = (Object.keys(PROBE_BODIES) as ProbeName[]).map(
  (name) => ({ name, ...DIAGNOSTIC_ROUTES[name], run: PROBE_BODIES[name] }),
);

/** The live subrequest accounting, read once per probe (ADR-022). */
function meter(): MeterReading {
  return {
    subrequests: subrequestsUsed(),
    subrequest_hosts: meterBreakdown(),
    internal_subrequests: internalSubrequestsUsed(),
    budget_trips: subrequestBudgetTrips(),
  };
}

/**
 * Answer everything under `/health/blueprint` and `/debug/*`.
 *
 * @param request - The inbound request
 * @param env - The Worker environment
 * @param url - The parsed request URL
 */
export function handle(request: Request, env: Env, url: URL): Promise<Response> {
  return routeProbes(PROBES, request, url, env, { build: BUILD, meter });
}

export { DIAGNOSTIC_ROUTES, duplicateRoutes, PROBE_NAMES } from "./routes";
export type { ProbeName, ProbeRoute } from "./routes";
export type { Probe, ProbeEnvelope, ProbeReport } from "./router";
