// Model tiers + request routing, shared by both provider lanes.
//
// (Was anthropic-client.ts — the direct-Anthropic SDK client was removed when
// the Claude lane moved to Vertex; only the provider-neutral routing survives.)

import { looksLikeResolution } from "./loop-shared";

// A tier is HOW HARD TO THINK, named for effort — never for a model.
//
// These were "haiku" | "sonnet" | "opus" until 2026-08-07: Claude model names,
// on a deployment that has run Gemini in production for months. Naming a tier
// after a model means every model swap turns the name into a lie, and this one
// already had. Renamed with no behaviour change; the model wiring is separate.
//
// On the Vertex-Claude lane a tier maps to the model IDs below. On the Gemini
// lane it maps to a model too (see gemini-agent.ts) — the thinking dial is held
// constant at medium so a tier change stays a single-variable change.
export type ModelTier = "chill" | "default" | "grind";

export const MODELS: Record<ModelTier, string> = {
  chill: "claude-haiku-4-5@20251001",
  default: "claude-sonnet-5",
  grind: "claude-opus-4-8",
};

export interface RouteDecision {
  tier: ModelTier;
  reason: string;
}

export function routeRequest(opts: { userText: string; hasPending: boolean }): RouteDecision {
  const text = opts.userText.toLowerCase();
  if (opts.hasPending && looksLikeResolution(text)) {
    return { tier: "chill", reason: "proposal-resolution" };
  }
  if (/\bthink (hard|deeply)\b/.test(text)) {
    return { tier: "grind", reason: "explicit-escalation" };
  }
  return { tier: "default", reason: "default-lane" };
}
