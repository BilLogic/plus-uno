// WHICH Gemini credential a request uses, in one place (ADR-053).
//
// Pure, with no logging, so the generation call, the embedding call and the
// model name an embedding is declared with all read the same answer and cannot
// drift apart. It takes only the credential fields rather than the Worker's
// whole `Env`, which the Worker's `Env` is assignable to.

export type GeminiCredentials = {
  GEMINI_API_KEY?: string;
  GEMINI_SA_EMAIL?: string;
  GEMINI_SA_PRIVATE_KEY?: string;
  GEMINI_PROJECT_ID?: string;
};

/** The Vertex service account is usable only as a whole: email, key and project. */
export function hasServiceAccount(env: GeminiCredentials): boolean {
  return Boolean(env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID);
}

/**
 * The key wins whenever it is set, so which auth and billing boundary served a
 * request never depends on which other secrets happen to exist. The service
 * account is the fallback.
 */
export function geminiCredentialPath(env: GeminiCredentials): "api-key" | "service-account" | null {
  if (env.GEMINI_API_KEY) return "api-key";
  return hasServiceAccount(env) ? "service-account" : null;
}
