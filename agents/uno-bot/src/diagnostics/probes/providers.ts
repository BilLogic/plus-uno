// Model-provider probes: is the credential live, is the model reachable, is the
// system prompt actually cached?
import { geminiConfigured, geminiGenerate } from "../../gemini/client";
import { claudeVertexConfigured, claudeVertexGenerate } from "../../vertex/claude";
import { MODELS } from "../../agent/routing";
import { buildSystemBlocks } from "../../agent/skills";
import { ensureHarnessCache } from "../../gemini/cache";
import { BUILD } from "../../version";
import type { ProbeRun } from "../probe";

// Gemini credential + reachability smoke test (dual-provider phase 1).
// Returns model, latency, auth mode, and a one-line sample — never secrets.
// Token-gated: it triggers a live (billable) model call, so it is not public.
export const geminiProbe: ProbeRun = async (env, url) => {
  const mode = geminiConfigured(env);
  if (!mode) {
    return {
      body: {
        ok: false,
        error: "no Gemini credential configured (GEMINI_API_KEY or GEMINI_SA_EMAIL + GEMINI_SA_PRIVATE_KEY)",
      },
    };
  }
  // ?model= probes a SPECIFIC model — the only way to answer "is this model
  // available to this project?" before wiring a tier to it. A preview model
  // can be listed in the docs and absent from a given Vertex project, and the
  // failure would otherwise surface as a 400 on someone's first /grind.
  const probeModel = url.searchParams.get("model") ?? undefined;
  const result = await geminiGenerate(env, {
    prompt: "Reply with exactly: uno-bot gemini link ok",
    maxTokens: 100,
    // ?level= too: gemini-3.1-pro rejects MINIMAL outright, so a probe with a
    // hardcoded level cannot tell "model absent" from "level unsupported".
    thinkingLevel: (url.searchParams.get("level") ?? "minimal") as
      | "minimal" | "low" | "medium" | "high",
    ...(probeModel ? { model: probeModel } : {}),
  });
  return { body: { auth: mode, ...result, text: result.text?.slice(0, 100) } };
};

// Claude-on-Vertex credential + reachability smoke test. Confirms the
// service-account token reaches the Anthropic partner models before flipping
// MODEL_PROVIDER="vertex-claude". Token-gated: it triggers a live (billable)
// model call, so it is not public.
export const vertexClaudeProbe: ProbeRun = async (env) => {
  if (!claudeVertexConfigured(env)) {
    return {
      body: {
        ok: false,
        error: "no Vertex-Claude credential (need GEMINI_SA_EMAIL + GEMINI_SA_PRIVATE_KEY + GEMINI_PROJECT_ID)",
      },
    };
  }
  const model = env.CLAUDE_MODEL ?? MODELS.default;
  const result = await claudeVertexGenerate(env, {
    model,
    prompt: "Reply with exactly: uno-bot vertex-claude link ok",
    maxTokens: 100,
  });
  return { body: { ...result, text: result.text?.slice(0, 100) } };
};

// Is the Gemini adapter's system prompt actually being cached? Reports the
// cachedContents resource (or the exact reason there isn't one) plus the size
// of the harness it would hold. Cheap: no model call, and the create is
// memoised for the hour either way. Token-gated like every /debug route.
export const geminiCacheProbe: ProbeRun = async (env) => {
  const model = env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const blocks = await buildSystemBlocks(env, null, null);
  const stable = (blocks as Array<{ text?: string }>)[0]?.text ?? "";
  const result = await ensureHarnessCache(env, model, stable);
  return {
    body: {
      ok: true,
      build: BUILD,
      model,
      region: env.GEMINI_REGION ?? "global",
      harness_chars: stable.length,
      cached: result.name !== null,
      cache_name: result.name,
      cache_tokens: result.tokens,
      reason: result.reason,
    },
  };
};
