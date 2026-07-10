import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

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

// Heuristic router: map the user's message (and any pending proposal) to a tier.
// Deliberately keyword-based — no extra LLM call — to preserve turn/token
// economy (D7). Bias to sonnet whenever intent is unclear.
export function pickModel(opts: { userText: string; hasPending: boolean }): {
  tier: ModelTier;
  model: string;
} {
  const text = opts.userText.toLowerCase();

  // Confirming/cancelling a pending proposal is a tiny classification turn.
  if (opts.hasPending && /\b(go ahead|yes|confirm|do it|cancel|no|stop|nope|abort)\b/.test(text)) {
    return { tier: "haiku", model: MODELS.haiku };
  }

  // Heavy multi-step reasoning: synthesis, PRD drafting, review/critique, harness maintenance/planning.
  const heavy =
    /\b(synthesi|summari[sz]e|draft (a )?prd|write (a )?prd|user flow|screen list|maintain|persona|refactor|plan|scope|architect|review|critique|what's wrong|audit)\b/.test(
      text,
    );
  if (heavy) return { tier: "opus", model: MODELS.opus };

  // Simple lookups / short Q&A: marketplace search, expert lookup, status pings.
  // (No bare "what's" here — it swallowed review asks like "what's wrong with
  // this design?" into haiku; "what's wrong" now routes heavy above.)
  const light =
    /\b(who (should|can) i (talk|reach)|find (an )?expert|search|show me|list|what is|status|which prototype)\b/.test(
      text,
    );
  if (light) return { tier: "haiku", model: MODELS.haiku };

  // Build/change actions and everything else: capable default.
  return { tier: "sonnet", model: MODELS.sonnet };
}

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
  if (opts.hasPending && /\b(go ahead|yes|confirm|do it|cancel|no|stop|nope|abort)\b/.test(text)) {
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
