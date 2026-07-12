import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";
import { looksLikeResolution } from "./loop-shared";

// Model tiers (D2 — skill + model routing). The bot picks a tier from the
// intent of the incoming message so cheap turns stay cheap (haiku) and heavy
// reasoning gets the capable model (opus), with sonnet as the safe default.
export type ModelTier = "haiku" | "sonnet" | "opus";

export const MODELS: Record<ModelTier, string> = {
  haiku: "claude-haiku-4-5-20251001",
  // Sonnet 5 (user decision 2026-07-10): near-Opus quality on exactly our
  // workload (agentic grounding + synthesis), adaptive thinking on by default,
  // intro pricing through 2026-08-31. Notes: new tokenizer (~30% more tokens
  // for the same text — cache/telemetry baselines shift), and thinking shares
  // the max_tokens budget (see MAX_TOKENS headroom in run-agent).
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-4-8",
};

// ─── Native router (Phase 3 final, 2026-07-10 — user decision) ───────────────
// No classifier model at all. Anthropic's own primitives carry the dynamic
// part: ONE capable model (sonnet) runs every real request with ADAPTIVE
// THINKING (the model itself decides when/how much to reason — the native
// "match compute to task difficulty") plus the ADVISOR tool (sonnet consults
// opus mid-request for strategy on the hardest moments — native escalation,
// no rerun). One model also means ONE always-warm prompt cache; tier-hopping
// paid a cold 90k-token cache read on every switch. Haiku keeps exactly two
// jobs: the proposal confirm/cancel fast-path, and `delegate` subagent
// lookups. Explicit "think hard" still forces opus outright.
export interface RouteDecision {
  tier: ModelTier;
  model: string;
  reason: string;
}

export function routeRequest(opts: { userText: string; hasPending: boolean }): RouteDecision {
  const text = opts.userText.toLowerCase();
  if (opts.hasPending && looksLikeResolution(text)) {
    return { tier: "haiku", model: MODELS.haiku, reason: "proposal-resolution" };
  }
  if (/\bthink (hard|deeply)\b/.test(text)) {
    return { tier: "opus", model: MODELS.opus, reason: "explicit-escalation" };
  }
  return { tier: "sonnet", model: MODELS.sonnet, reason: "default-lane" };
}

export function makeAnthropicClient(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}
