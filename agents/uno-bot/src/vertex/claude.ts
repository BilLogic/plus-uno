// Claude on Google Vertex AI — raw client for Cloudflare Workers.
//
// Billing + auth live entirely in Google Cloud: this reuses the SAME
// service-account OAuth token as the Vertex-Gemini path (../gemini/auth.ts,
// cloud-platform scope), so Claude usage bills to the GCP project in
// GEMINI_PROJECT_ID. No Anthropic account or ANTHROPIC_API_KEY is involved.
//
// The request is the standard Anthropic Messages API with two Vertex quirks:
//   • the model is in the URL, NOT the body, and
//   • anthropic_version: "vertex-2023-10-16" goes IN the body.
// (Confirmed against platform.claude.com/docs .../claude-on-vertex-ai.)
//
// rawPredict is non-streaming — fine here because this lane attaches NO
// server-side MCP (every tool round is its own short HTTP call in the client
// loop, agent/claude-agent.ts), so the long-single-request 524 that forced
// streaming on the old direct-Anthropic path can't occur.

import type { Env } from "../types";
import { getGoogleAccessToken } from "../gemini/auth";

export const ANTHROPIC_VERTEX_VERSION = "vertex-2023-10-16";

/** True when the Vertex service-account credentials + project are present.
 *  Claude-on-Vertex requires the SA path (an AI-Studio GEMINI_API_KEY cannot
 *  reach Claude — only Vertex hosts the Anthropic partner models). */
export function claudeVertexConfigured(env: Env): boolean {
  return Boolean(env.GEMINI_SA_EMAIL && env.GEMINI_SA_PRIVATE_KEY && env.GEMINI_PROJECT_ID);
}

/** Resolve the Vertex rawPredict endpoint for a Claude model. The global
 *  endpoint (region "global") has no pricing premium and covers the newest
 *  models; regional hosts get a `${region}-` prefix. */
function endpoint(env: Env, model: string): string {
  const project = env.GEMINI_PROJECT_ID ?? "";
  const region = env.GEMINI_REGION ?? "global";
  const host = region === "global" ? "aiplatform.googleapis.com" : `${region}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${project}/locations/${region}/publishers/anthropic/models/${model}:rawPredict`;
}

/**
 * Low-level rawPredict: caller owns the full Anthropic Messages body (system,
 * messages, tools, max_tokens, thinking, …) EXCEPT `model` (URL) and
 * `anthropic_version` (added here). Returns the raw status + parsed JSON.
 */
export async function claudeVertexRaw(
  env: Env,
  model: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: unknown }> {
  const token = await getGoogleAccessToken(env);
  const res = await fetch(endpoint(env, model), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ anthropic_version: ANTHROPIC_VERTEX_VERSION, ...body }),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  return { status: res.status, data };
}

/**
 * One-shot text generation (no tools) — used by the /debug/vertex-claude smoke
 * test and the pre-send draft judge. Returns the joined text of the response.
 */
export async function claudeVertexGenerate(
  env: Env,
  opts: { model: string; system?: string; prompt: string; maxTokens?: number },
): Promise<{ ok: boolean; model: string; text?: string; error?: string }> {
  const body: Record<string, unknown> = {
    max_tokens: opts.maxTokens ?? 1024,
    messages: [{ role: "user", content: opts.prompt }],
    ...(opts.system ? { system: opts.system } : {}),
  };
  const { status, data } = await claudeVertexRaw(env, opts.model, body);
  const d = data as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };
  if (status !== 200) {
    return {
      ok: false,
      model: opts.model,
      error: `HTTP ${status}: ${d?.error?.message ?? JSON.stringify(data).slice(0, 200)}`,
    };
  }
  const text = (d.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  return { ok: true, model: opts.model, text };
}
