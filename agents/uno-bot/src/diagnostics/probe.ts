// The one signature a probe body implements.
//
// Split from `router.ts` because this is the half that names `Env` — and `Env`
// carries Workers types, which is what keeps the router and the route table
// readable by the Node test suite.
import type { Env } from "../types";
import type { ProbeReport } from "./router";

/**
 * A probe body: the environment, the parsed URL (its query string is the
 * probe's parameters) and the request itself, in — one report out.
 */
export type ProbeRun = (env: Env, url: URL, request: Request) => Promise<ProbeReport>;

export type { ProbeReport };
