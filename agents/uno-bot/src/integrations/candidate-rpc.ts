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

/**
 * Which embedding model `/debug/blueprint-search?embed_model=` may use.
 *
 * WHY THIS PARAMETER EXISTS, and why `?rpc=` alone is not enough: a candidate
 * function reads a candidate COLUMN, and a column is only as good as the model
 * that filled it. Pointing the route at `search_blueprint_cand001` while the
 * Worker keeps embedding the question with the live model produces a call the
 * function refuses outright (`embedding model mismatch`) — so a candidate
 * INDEX, as opposed to a candidate ranking, could not be scored at all. This
 * is the missing half of the same idea: score a candidate model against a
 * candidate index, with the live pair untouched.
 *
 * ALLOWLISTED BY VALUE, not by shape. A model name is not interpolated into a
 * URL path the way an RPC name is, so the argument here is different and
 * narrower: this is a debug route that tells the DATABASE which vector space a
 * query belongs to, and a name the index has never heard of gets scored as
 * noise rather than refused. Two entries, because two models are in play — the
 * one the index holds today and the one being measured. A third goes here when
 * there is a third, deliberately.
 */
export const SCOREABLE_EMBED_MODELS = ["text-embedding-005", "gemini-embedding-001"] as const;

export type ScoreableEmbedModel = (typeof SCOREABLE_EMBED_MODELS)[number];

/** True when `model` may be sent as the query's embedding model. */
export function isScoreableEmbedModel(model: string): model is ScoreableEmbedModel {
  return (SCOREABLE_EMBED_MODELS as readonly string[]).includes(model);
}
