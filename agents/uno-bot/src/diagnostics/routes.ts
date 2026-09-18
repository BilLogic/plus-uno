// The diagnostic route table — one datum every other part of Diagnostics reads.
//
// Paths here are a CONTRACT, not an implementation detail: `/health/blueprint`
// is polled by the product repository's CI, `/debug/eval` drives the eval suite
// and the GitHub Action behind it, `/debug/blueprint-search` and
// `/debug/blueprint-subject` are read by the retrieval evals, and monitoring
// watches `/health` (which stays in the Worker entry as the uptime route). So
// the table is declared apart from the probe bodies: a module that imports
// nothing, which the Node suite reads as the one place a path, a method or an
// auth posture is written down. The probe bodies take an `Env` and make real
// calls through it, so they are the half a test cannot drive — not the half a
// test cannot compile (`tsconfig.test.json` globs `src/**`, #595).
//
// `auth` is a posture, not a flag. Everything under `/debug/*` triggers a live
// billable call, a write, or carries response samples, so it answers only to
// the `DEBUG_TOKEN` header. `/health/blueprint` is `public` BY DESIGN: it
// returns booleans and no row data, because the product repository's CI needs
// to fail loudly on a schema change while holding no secret.

/** How the router gates a probe. */
export type ProbeAuth = "debug-token" | "public";

/** A probe's address: what answers where, and who may ask. */
export interface ProbeRoute {
  readonly method: "GET" | "POST";
  readonly path: string;
  readonly auth: ProbeAuth;
}

export const DIAGNOSTIC_ROUTES = {
  "blueprint-health": { method: "GET", path: "/health/blueprint", auth: "public" },
  gemini: { method: "GET", path: "/debug/gemini", auth: "debug-token" },
  "vertex-claude": { method: "GET", path: "/debug/vertex-claude", auth: "debug-token" },
  "gemini-cache": { method: "GET", path: "/debug/gemini-cache", auth: "debug-token" },
  "turn-eval": { method: "POST", path: "/debug/eval", auth: "debug-token" },
  "slack-search": { method: "GET", path: "/debug/slack-search", auth: "debug-token" },
  "slack-stream": { method: "GET", path: "/debug/slack-stream", auth: "debug-token" },
  home: { method: "GET", path: "/debug/home", auth: "debug-token" },
  blueprint: { method: "GET", path: "/debug/blueprint", auth: "debug-token" },
  "blueprint-search": { method: "GET", path: "/debug/blueprint-search", auth: "debug-token" },
  "blueprint-subject": { method: "GET", path: "/debug/blueprint-subject", auth: "debug-token" },
  "figma-poll": { method: "GET", path: "/debug/figma-poll", auth: "debug-token" },
} as const satisfies Record<string, ProbeRoute>;

/** Every probe the module serves, by name. */
export type ProbeName = keyof typeof DIAGNOSTIC_ROUTES;

/** The registered names, in declaration order. */
export const PROBE_NAMES = Object.keys(DIAGNOSTIC_ROUTES) as ProbeName[];

/**
 * `METHOD path` pairs claimed by more than one probe.
 *
 * Two probes on one address is a silent defect: the router answers with
 * whichever was declared first, so the second one's payload simply stops
 * existing while its name still reads as registered. Empty is the invariant.
 *
 * @param routes - The table to check
 */
export function duplicateRoutes(routes: Record<string, ProbeRoute>): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const route of Object.values(routes)) {
    const key = `${route.method} ${route.path}`;
    if (seen.has(key)) dupes.add(key);
    seen.add(key);
  }
  return [...dupes].sort();
}
