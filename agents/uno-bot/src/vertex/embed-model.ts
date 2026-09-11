// WHICH embedding model a request uses — separated from the call that makes it.
//
// It lives in its own file for one reason: `embed.ts` reaches the Workers
// runtime (fetch, the SA token exchange), so it cannot be compiled by the plain
// Node test build. The CHOICE of model is pure, and it is the part with a bug
// available: the query must be declared to the database as the same model it
// was embedded with, or the vector is scored against a space it does not belong
// to. So it is testable on its own.

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

/** The Vertex service-account path's model, and the one the live index holds. */
export const VERTEX_MODEL = "text-embedding-005";

/**
 * The AI Studio path's model, and why it is no longer a DIFFERENT model.
 *
 * It used to be `text-embedding-004`, which Google deprecated on 2026-01-14 —
 * so the "fallback" was a dead endpoint, and had been for months. Worse than
 * dead: 004 and 005 are both 768-dim, so a deployment missing the service
 * account produced vectors that type-checked perfectly and scored against an
 * 005 index as noise. `gemini-embedding-001` is reachable through BOTH
 * transports, which is the property that lets one index serve the bot's
 * service account and a person's own browser key, so local dev now speaks the
 * model the index is moving to rather than a third one.
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
  return env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID
    ? VERTEX_MODEL
    : AISTUDIO_MODEL;
}
