// WHICH embedding model a request uses — separated from the call that makes it.
//
// It lives in its own file for one reason: `embed.ts` DOES the call — fetch and
// the SA token exchange — so nothing there can be exercised without standing up
// a transport. The CHOICE of model is pure, and it is the part with a bug
// available: the query must be declared to the database as the same model it
// was embedded with, or the vector is scored against a space it does not belong
// to. So it is driven on its own. (Compiling `embed.ts` was never the problem;
// `tsconfig.test.json` globs `src/**` and types the Workers globals — #595.)

/**
 * Only the credential fields the choice depends on, rather than the Worker's
 * whole `Env` — which would drag the runtime types back in and defeat the
 * point of the split. The Worker's `Env` is assignable to this.
 */
export type EmbedCredentials = {
  GEMINI_SA_EMAIL?: string;
  GEMINI_SA_PRIVATE_KEY?: string;
  GEMINI_PROJECT_ID?: string;
  GEMINI_API_KEY?: string;
};

/** The Vertex service-account path's model. */
export const VERTEX_MODEL = "text-embedding-005";

/**
 * The Gemini API key path's model, and the one the live index holds.
 *
 * It used to be `text-embedding-004`, which Google deprecated on 2026-01-14,
 * and 004 and 005 are both 768-dim, so a vector from a model the index did not
 * hold type-checked perfectly and scored as noise. `gemini-embedding-001` is
 * reachable through BOTH transports and is what the index is built with, so
 * the key path, which now wins whenever the key is set, speaks it.
 */
export const AISTUDIO_MODEL = "gemini-embedding-001";

/**
 * Which model `embedText` WOULD use, given this env and an optional override.
 *
 * The hybrid RPC takes this answer and rejects a caller whose model does not
 * match the one the index was built with. That check cannot be done by
 * dimension — every model in play here is 768-dim — so naming the model is the
 * only way to catch a mismatch, and it then fails loudly on the first search
 * instead of degrading forever.
 *
 * ONE function answers both questions, which model to call and which model to
 * declare, precisely so the two cannot disagree.
 */
export function embedModelName(env: EmbedCredentials, override?: string): string {
  if (override) return override;
  // Same order as `geminiConfigured` (ADR-053): the key wins, so a deployment
  // holding both credentials embeds with the model the live index holds.
  if (env.GEMINI_API_KEY) return AISTUDIO_MODEL;
  return env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID
    ? VERTEX_MODEL
    : AISTUDIO_MODEL;
}
