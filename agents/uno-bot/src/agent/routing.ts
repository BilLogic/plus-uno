// Model tiers + request routing, shared by both provider lanes.
//
// (Was anthropic-client.ts — the direct-Anthropic SDK client was removed when
// the Claude lane moved to Vertex; only the provider-neutral routing survives.)

import { looksLikeResolution } from "./loop-shared";

// The bot picks a tier from the intent of the incoming message so cheap turns
// stay cheap (haiku) and heavy reasoning gets the capable model (opus), with
// sonnet as the safe default. On the Gemini lane the tier maps to a
// thinkingLevel on one model; on the Vertex-Claude lane it maps to these model
// IDs (Vertex/Anthropic partner-model ids — @-versioned where required).
export type ModelTier = "haiku" | "sonnet" | "opus";

export const MODELS: Record<ModelTier, string> = {
  haiku: "claude-haiku-4-5@20251001",
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-4-8",
};

export interface RouteDecision {
  tier: ModelTier;
  reason: string;
}

export function routeRequest(opts: { userText: string; hasPending: boolean }): RouteDecision {
  const text = opts.userText.toLowerCase();
  if (opts.hasPending && looksLikeResolution(text)) {
    return { tier: "haiku", reason: "proposal-resolution" };
  }
  if (/\bthink (hard|deeply)\b/.test(text)) {
    return { tier: "opus", reason: "explicit-escalation" };
  }
  return { tier: "sonnet", reason: "default-lane" };
}
