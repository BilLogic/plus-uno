// Text embeddings for the Worker — turns a query into a 768-dim vector for the
// semantic_search retrieval path (tools/blueprint-search via integrations/
// blueprint). Returns null on any misconfig/failure so callers fall back to
// keyword search — embeddings are an enhancement, never a hard dependency.
//
// Two credential paths, in the order the backfill and `geminiConfigured` use
// (ADR-053): GEMINI_API_KEY (Gemini API) first, the Vertex service account
// (getGoogleAccessToken) as the fallback. Embeddings are REGIONAL on
// Vertex — the "global" endpoint used for generation does NOT serve them — so
// this pins us-central1 regardless of GEMINI_REGION.

import type { Env } from "../types";
import { getGoogleAccessToken } from "../gemini/auth";
import { countedFetch } from "../net";
import { geminiCredentialPath, hasServiceAccount } from "../gemini/credential";
import { VERTEX_MODEL, embedModelName } from "./embed-model";

export { embedModelName } from "./embed-model";
export type { EmbedCredentials } from "./embed-model";

const EMBED_DIM = 768;
const EMBED_REGION = "us-central1";
const TIMEOUT_MS = 8000;

export type EmbedTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

export function embeddingsConfigured(env: Env): boolean {
  return geminiCredentialPath(env) !== null;
}

/** Embed one string. Returns the vector, or null on any error (caller falls back). */
export async function embedText(
  env: Env,
  text: string,
  taskType: EmbedTaskType = "RETRIEVAL_QUERY",
  /**
   * Embed with a model OTHER than the one this env would choose.
   *
   * One caller: the debug retrieval route, scoring a candidate index. It has
   * to be a parameter rather than an env var because the whole point is to
   * send one model on one request while the deployed Worker goes on answering
   * real questions with the model the live index holds. The route allow-lists
   * the value; nothing else passes it.
   */
  modelOverride?: string,
): Promise<number[] | null> {
  const t = text.trim();
  if (!t) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const model = embedModelName(env, modelOverride);
  try {
    // The transport follows the credential predicate, so it agrees with the
    // model `embedModelName` declares. One exception: the Vertex-only model is
    // served by Vertex alone, so a request that names it goes to the service
    // account even when a key is set, and has nowhere to go without one.
    const path =
      model === VERTEX_MODEL
        ? hasServiceAccount(env) ? "service-account" : null
        : geminiCredentialPath(env);
    if (path === "api-key") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;
      const res = await countedFetch(url, {
        method: "POST",
        // The key rides in a HEADER, not `?key=`: a query string is kept in
        // proxy logs and error reports, and this path is the one a local dev
        // run uses with a personal key.
        headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text: t }] },
          taskType,
          outputDimensionality: EMBED_DIM,
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { embedding?: { values?: number[] } };
      return data.embedding?.values ?? null;
    }
    if (path === "service-account") {
      const token = await getGoogleAccessToken(env);
      const url =
        `https://${EMBED_REGION}-aiplatform.googleapis.com/v1/projects/${env.GEMINI_PROJECT_ID}` +
        `/locations/${EMBED_REGION}/publishers/google/models/${model}:predict`;
      const res = await countedFetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          instances: [{ content: t, task_type: taskType }],
          parameters: { outputDimensionality: EMBED_DIM },
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        predictions?: Array<{ embeddings?: { values?: number[] } }>;
      };
      return data.predictions?.[0]?.embeddings?.values ?? null;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
