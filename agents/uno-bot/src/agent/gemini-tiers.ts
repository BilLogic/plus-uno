// The Gemini lane's tiers: one named configuration each, model PLUS thinking
// level, moving together (ADR-028, #421).
//
// Import-free apart from the tier union, for the same reason tiers.ts is: the
// unit suite compiles only what it imports, and this resolution is exactly what
// the tier tests need to assert — the LEVEL a turn is sent with, not just which
// model answered. gemini-agent.ts is the only production caller.
//
// Levels, verified 2026-09-04 at ai.google.dev/gemini-api/docs/thinking:
//   gemini-3.5-flash-lite   accepts minimal|low|medium|high, defaults to minimal
//   gemini-3.8-flash        accepts         low|medium|high, defaults to medium
//   gemini-3.1-pro-preview  accepts         low|medium|high, defaults to high
//
// chill runs ONE RUNG ABOVE flash-lite's own default. A chill turn is the one
// that resolves a gated proposal ("yes please" against a staged notion_create),
// and misreading that costs more than a rung of thinking. `minimal` is also a
// level flash and pro reject, and a fallback carries the tier's level onto the
// backup model — so no tier may sit there.
//
// Until 2026-09-04 the level was pinned at medium on every tier, so "think
// harder" ran the pro model BELOW its own default and a six-word reply ran the
// lite model above its own (docs/plans/2026-08-07-006). The attribution rule
// that pinning bought — a regression is the model or the level, never both —
// is replaced by a rule about process: change one tier at a time.
import type { ModelTier } from "./tiers";

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

export interface GeminiTierConfig {
  /** Default model for the tier; env-overridable per tier (resolveGeminiModel). */
  model: string;
  /** The tier's thinking level. Fixed in code: a tier is model plus level, and
   *  letting config move one without the other would put the two-variable
   *  attribution problem back. */
  level: ThinkingLevel;
}

export const GEMINI_TIERS: Record<ModelTier, GeminiTierConfig> = {
  chill: { model: "gemini-3.5-flash-lite", level: "low" },
  default: { model: "gemini-3.8-flash", level: "medium" },
  grind: { model: "gemini-3.1-pro-preview", level: "high" },
};

/** The subset of Env the tier resolution reads. Each model is overridable so
 *  it can be swapped without a deploy; GEMINI_GRIND_MODEL is deliberately NOT
 *  GEMINI_FALLBACK_MODEL, which means "what we use when the primary fails" —
 *  conflating the good model with the failure model makes an outage silently
 *  expensive. */
export interface GeminiTierEnv {
  GEMINI_CHILL_MODEL?: string;
  GEMINI_MODEL?: string;
  GEMINI_GRIND_MODEL?: string;
}

export function resolveGeminiModel(tier: ModelTier, env: GeminiTierEnv): string {
  const override = {
    chill: env.GEMINI_CHILL_MODEL,
    default: env.GEMINI_MODEL,
    grind: env.GEMINI_GRIND_MODEL,
  }[tier];
  return override ?? GEMINI_TIERS[tier].model;
}

export interface GeminiDials {
  model: string;
  /** The level this call is sent with — the tier's, when the model takes the
   *  dial; null when it does not, and then no thinkingConfig goes on the wire.
   *  thinking_level is a Gemini 3.x dial: 2.5-generation models 400 on it
   *  ("not supported by this model", probed live 2026-07-16 on the
   *  gemini-2.5-pro quota bridge). */
  thinkingLevel: ThinkingLevel | null;
  /** Built-in googleSearch + urlContext, which run on Google's infra at zero
   *  Worker subrequests. Gemini 2.x REJECTS mixing local function declarations
   *  with built-in search tools ("Multiple tools are supported only when they
   *  are all search tools", 400, probed live 2026-07-16). The bot's LOCAL tools
   *  are load-bearing (all grounding runs through them); the built-ins are a
   *  nice-to-have, so on 2.x they are dropped and the function tools kept. */
  builtinSearchTools: Array<Record<string, unknown>>;
}

/**
 * Every model-generation dial for one call, derived together so a mid-turn
 * model fallback recomputes them consistently: the tier stays, the model
 * changes underneath it, and the level is re-derived against the new model.
 */
export function geminiDials(tier: ModelTier, model: string): GeminiDials {
  const isGemini3 = /^gemini-3/.test(model);
  return {
    model,
    thinkingLevel: isGemini3 ? GEMINI_TIERS[tier].level : null,
    builtinSearchTools: isGemini3 ? [{ googleSearch: {} }, { urlContext: {} }] : [],
  };
}
