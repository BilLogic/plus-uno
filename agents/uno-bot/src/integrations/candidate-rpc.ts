// Which function `/debug/blueprint-search?rpc=` is allowed to call.
//
// WHY THE PARAMETER EXISTS: a retrieval change could only be measured by
// editing the function the whole product calls, because nothing could point
// anywhere else. So the loop was "apply to production, run the eval, revert if
// worse" — which is how an OR-ranked keyword arm reached production, fixed one
// blocker case, broke three others and was rolled back
// (plus-uno-blueprint#154). A candidate created alongside `search_blueprint`
// can now be scored while the live function stays where it is.
//
// WHY AN ALLOWLIST AND NOT JUST THE AUTH GATE: the value is interpolated into a
// PostgREST `/rpc/<name>` path. The route already requires the debug token, but
// an arbitrary name would turn "look at search results" into "invoke any
// function the bot's key can reach", which is a different permission wearing
// the same one's clothes. Defence in depth, on a route whose whole job is to be
// pointed somewhere unusual.
//
// Its own module because the test build compiles only pure modules — importing
// this from `src/index.ts` would drag the Workers runtime types into `npm test`.

/**
 * The live name, or a `search_blueprint_<suffix>` candidate.
 *
 * Anchored at both ends and limited to lowercase, digits and single
 * underscores, so the value cannot carry a path segment, a query string, a
 * newline or anything else that would address a different endpoint than it
 * appears to.
 */
export const CANDIDATE_RPC = /^search_blueprint(_[a-z0-9]+)*$/;

/** True when `name` may be passed through to PostgREST as an RPC path. */
export function isCallableCandidate(name: string): boolean {
  return CANDIDATE_RPC.test(name);
}
