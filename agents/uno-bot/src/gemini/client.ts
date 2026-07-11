// Minimal Gemini client for the provider adapter (phase 1, 2026-07-10).
//
// Supports BOTH access paths, auto-selected by which credential is present:
//   • GEMINI_API_KEY            → Gemini Developer API (generativelanguage.
//                                 googleapis.com) — plain key header. The path
//                                 Google recommends; simplest on Workers.
//   • GEMINI_SA_* service acct  → Vertex AI (aiplatform.googleapis.com) with
//                                 an OAuth token minted in ./auth.ts.
//
// Phase 1 scope: non-streaming generateContent with a system prompt and plain
// text — enough for the /debug/gemini smoke test and the delegate-subagent
// lane. The full run-agent rewire (tool loop, streaming, thought signatures)
// is the phase-2 adapter PR, gated on PR #47 verification.

import type { Env } from "../types";
import { getGoogleAccessToken } from "./auth";

export interface GeminiResult {
  ok: boolean;
  model: string;
  text?: string;
  usage?: { input: number; output: number; thinking: number };
  error?: string;
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

export function geminiConfigured(env: Env): "api-key" | "service-account" | null {
  if (env.GEMINI_API_KEY) return "api-key";
  if (env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY) return "service-account";
  return null;
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
 * response back. The agent loop in agent/gemini-agent.ts builds on this.
 */
export async function geminiGenerateRaw(
  env: Env,
  model: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: unknown }> {
  const { url, headers } = await geminiEndpoint(env, model);
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as unknown;
  return { status: res.status, data };
}

export async function geminiGenerate(
  env: Env,
  opts: {
    model?: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
    thinkingLevel?: "minimal" | "low" | "medium" | "high";
  },
): Promise<GeminiResult> {
  const started = Date.now();
  const model = opts.model ?? env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const mode = geminiConfigured(env);
  if (!mode) {
    return { ok: false, model, error: "no Gemini credential configured", ms: 0 };
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 2048,
      // thinking_level nests under thinkingConfig on the REST generateContent
      // surface (live 400 confirmed it's not a direct generationConfig field).
      ...(opts.thinkingLevel ? { thinkingConfig: { thinkingLevel: opts.thinkingLevel } } : {}),
    },
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
  };

  let url: string;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (mode === "api-key") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    headers["x-goog-api-key"] = env.GEMINI_API_KEY!;
  } else {
    const project = env.GEMINI_PROJECT_ID ?? "";
    const region = env.GEMINI_REGION ?? "global";
    const host = region === "global" ? "aiplatform.googleapis.com" : `${region}-aiplatform.googleapis.com`;
    url = `https://${host}/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:generateContent`;
    try {
      headers.authorization = `Bearer ${await getGoogleAccessToken(env)}`;
    } catch (err) {
      return {
        ok: false,
        model,
        error: `auth: ${err instanceof Error ? err.message : String(err)}`,
        ms: Date.now() - started,
      };
    }
  }

  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = (await res.json()) as GenerateContentResponse;
    if (!res.ok) {
      return {
        ok: false,
        model,
        error: `HTTP ${res.status}: ${data.error?.message ?? "unknown"}`.slice(0, 300),
        ms: Date.now() - started,
      };
    }
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
    return {
      ok: true,
      model,
      text,
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
