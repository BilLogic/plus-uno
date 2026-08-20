// Text embeddings for the Worker — turns a query into a 768-dim vector for the
// semantic_search retrieval path (tools/blueprint-search via integrations/
// blueprint). Returns null on any misconfig/failure so callers fall back to
// keyword search — embeddings are an enhancement, never a hard dependency.
//
// Two credential paths, mirroring the backfill: GEMINI_API_KEY (AI Studio) or
// the Vertex service account (getGoogleAccessToken). Embeddings are REGIONAL on
// Vertex — the "global" endpoint used for generation does NOT serve them — so
// this pins us-central1 regardless of GEMINI_REGION.

import type { Env } from "../types";
import { getGoogleAccessToken } from "../gemini/auth";
import { countedFetch } from "../net";

const EMBED_DIM = 768;
const EMBED_REGION = "us-central1";
const VERTEX_MODEL = "text-embedding-005";
const AISTUDIO_MODEL = "text-embedding-004";
const TIMEOUT_MS = 8000;

export type EmbedTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

export function embeddingsConfigured(env: Env): boolean {
  return Boolean(
    env.GEMINI_API_KEY ||
      (env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID),
  );
}

/** Which model embedText WOULD use, given this env.
 *
 *  The hybrid RPC takes this and rejects a caller whose model does not match
 *  the one the index was built with. That check cannot be done by dimension:
 *  the Vertex SA path (005) and the AI Studio path (004) are BOTH 768-dim, so
 *  a deployment missing the SA produces vectors that type-check perfectly and
 *  score against the index as noise. Naming the model is the only way to catch
 *  it, and it fails loudly on the first search instead of degrading forever.
 */
export function embedModelName(env: Env): string {
  return env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID
    ? VERTEX_MODEL
    : AISTUDIO_MODEL;
}

/** Embed one string. Returns the vector, or null on any error (caller falls back). */
export async function embedText(
  env: Env,
  text: string,
  taskType: EmbedTaskType = "RETRIEVAL_QUERY",
): Promise<number[] | null> {
  const t = text.trim();
  if (!t) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // ORDER MATTERS: prefer the Vertex SA path (text-embedding-005) — the
    // semantic_search index is built with 005, and vectors from different
    // models are NOT comparable. The AI-Studio key (004) is a fallback for
    // deployments without an SA; mixing it against an 005 index would silently
    // degrade every similarity score below the floor.
    if (env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID) {
      const token = await getGoogleAccessToken(env);
      const url =
        `https://${EMBED_REGION}-aiplatform.googleapis.com/v1/projects/${env.GEMINI_PROJECT_ID}` +
        `/locations/${EMBED_REGION}/publishers/google/models/${VERTEX_MODEL}:predict`;
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
    if (env.GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${AISTUDIO_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`;
      const res = await countedFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: `models/${AISTUDIO_MODEL}`,
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
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
