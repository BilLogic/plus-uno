// Minimal Gemini client for the provider adapter (phase 1, 2026-07-10).
//
// Supports BOTH access paths, picked by which credential is present, in a
// fixed order (docs/adr/053):
//   • GEMINI_API_KEY            → Gemini Developer API (generativelanguage.
//                                 googleapis.com) — plain key header. THE
//                                 CANONICAL PATH — always wins when set.
//   • GEMINI_SA_* service acct  → Vertex AI (aiplatform.googleapis.com) with
//                                 an OAuth token minted in ./auth.ts. The
//                                 fallback, and loud when traffic lands on it.
//
// Phase 1 scope: non-streaming generateContent with a system prompt and plain
// text — enough for the /debug/gemini smoke test and the delegate-subagent
// path. The full run-agent rewire (tool loop, streaming, thought signatures)
// is the phase-2 adapter PR, gated on PR #47 verification.

import type { Env } from "../types";
import { getGoogleAccessToken } from "./auth";
import { geminiCredentialPath } from "./credential";
import { countedFetch } from "../net";
import { takesThinkingLevel } from "../agent/gemini-tiers";

export interface GeminiResult {
  ok: boolean;
  model: string;
  text?: string;
  usage?: { input: number; output: number; thinking: number };
  error?: string;
  /** The HTTP status of a refused call; absent when the call never went out. */
  status?: number;
  /** The candidate's finishReason, e.g. `STOP` or `MAX_TOKENS`. */
  finishReason?: string;
  ms: number;
}

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { code?: number; message?: string };
}

// The fallback warning fires once per isolate: this runs on every call, and a
// line per call would bury the one signal it exists to give.
let warnedFallback = false;

export function geminiConfigured(env: Env): "api-key" | "service-account" | null {
  // Key first (ADR-053, which reverses ADR-018); the order lives in
  // ./credential.ts. With the region at "global" the Vertex-only cachedContents
  // path was already inlining, so choosing the key gives up no caching.
  const path = geminiCredentialPath(env);
  if (path === "service-account" && !warnedFallback) {
    warnedFallback = true;
    // Loud on purpose: the key going missing (rotation, rename, typo) silently
    // shifting traffic to a different auth/billing boundary is the failure mode
    // a single deterministic path exists to catch.
    console.warn("[gemini] GEMINI_API_KEY is not set — falling back to the Vertex service account");
  }
  return path;
}

/**
 * Vertex project/region/host + auth headers, or null when this deployment is on
 * the API-key path (which has no cachedContents surface).
 *
 * Shared with ./cache.ts so the cache and the generateContent call can never
 * drift onto different projects or regions — a cachedContents resource is
 * scoped to both, and a mismatch is a 400 at request time, not a warning.
 */
export async function vertexBase(env: Env): Promise<{
  host: string;
  project: string;
  region: string;
  headers: Record<string, string>;
} | null> {
  if (geminiConfigured(env) !== "service-account") return null;
  const project = env.GEMINI_PROJECT_ID ?? "";
  const region = env.GEMINI_REGION ?? "global";
  const host = region === "global" ? "aiplatform.googleapis.com" : `${region}-aiplatform.googleapis.com`;
  return {
    host,
    project,
    region,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${await getGoogleAccessToken(env)}`,
    },
  };
}

// Resolve endpoint + auth headers for a generateContent call on either access
// path (Developer API key, or Vertex with a service-account OAuth token).
async function geminiEndpoint(
  env: Env,
  model: string,
): Promise<{ url: string; headers: Record<string, string> }> {
  const mode = geminiConfigured(env);
  if (!mode) throw new Error("no Gemini credential configured");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (mode === "api-key") {
    headers["x-goog-api-key"] = env.GEMINI_API_KEY!;
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      headers,
    };
  }
  const project = env.GEMINI_PROJECT_ID ?? "";
  const region = env.GEMINI_REGION ?? "global";
  const host = region === "global" ? "aiplatform.googleapis.com" : `${region}-aiplatform.googleapis.com`;
  headers.authorization = `Bearer ${await getGoogleAccessToken(env)}`;
  return {
    url: `https://${host}/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:generateContent`,
    headers,
  };
}

/**
 * Low-level generateContent: caller owns the full request body (contents,
 * systemInstruction, tools, generationConfig, …) and gets the raw parsed
 * response back, with the length of the body it sent. The Gemini adapter
 * (agent/providers/gemini.ts) builds on this.
 */
export async function geminiGenerateRaw(
  env: Env,
  model: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: unknown; bodyChars: number }> {
  const { url, headers } = await geminiEndpoint(env, model);
  const sent = JSON.stringify(body);
  const res = await countedFetch(url, { method: "POST", headers, body: sent });
  const data = (await res.json().catch(() => ({}))) as unknown;
  return { status: res.status, data, bodyChars: sent.length };
}

export async function geminiGenerate(
  env: Env,
  opts: {
    model?: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
    thinkingLevel?: "minimal" | "low" | "medium" | "high";
    /** Abort the request in flight; an abort comes back as a failure. */
    signal?: AbortSignal;
  },
): Promise<GeminiResult> {
  const started = Date.now();
  const model = opts.model ?? env.GEMINI_MODEL ?? "gemini-3.8-flash";
  if (!geminiConfigured(env)) {
    return { ok: false, model, error: "no Gemini credential configured", ms: 0 };
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 2048,
      // thinking_level nests under thinkingConfig on the REST generateContent
      // surface (live 400 confirmed it's not a direct generationConfig field).
      // Gemini 3 and later only — 2.5-gen models reject it ("not supported by
      // this model", probed 2026-07-16), so it's gated on the model generation.
      ...(opts.thinkingLevel && takesThinkingLevel(model)
        ? { thinkingConfig: { thinkingLevel: opts.thinkingLevel } }
        : {}),
    },
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
  };

  let url: string;
  let headers: Record<string, string>;
  try {
    ({ url, headers } = await geminiEndpoint(env, model)); // shared endpoint/auth resolution
  } catch (err) {
    return {
      ok: false,
      model,
      error: `auth: ${err instanceof Error ? err.message : String(err)}`,
      ms: Date.now() - started,
    };
  }

  try {
    const res = await countedFetch(url, { method: "POST", headers, body: JSON.stringify(body), ...(opts.signal ? { signal: opts.signal } : {}) });
    // A proxy's own failure (Cloudflare's 524 page) is HTML: keep the status.
    const data = (await res.json().catch(() => ({}))) as GenerateContentResponse;
    if (!res.ok) {
      return {
        ok: false,
        model,
        error: `HTTP ${res.status}: ${data.error?.message ?? "unknown"}`.slice(0, 300),
        status: res.status,
        ms: Date.now() - started,
      };
    }
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
    const finishReason = data.candidates?.[0]?.finishReason;
    return {
      ok: true,
      model,
      text,
      ...(finishReason ? { finishReason } : {}),
      usage: {
        input: data.usageMetadata?.promptTokenCount ?? 0,
        output: data.usageMetadata?.candidatesTokenCount ?? 0,
        thinking: data.usageMetadata?.thoughtsTokenCount ?? 0,
      },
      ms: Date.now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      model,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    };
  }
}
