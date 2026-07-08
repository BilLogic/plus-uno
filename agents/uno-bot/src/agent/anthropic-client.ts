import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

// Model tiers (D2 — skill + model routing). The bot picks a tier from the
// intent of the incoming message so cheap turns stay cheap (haiku) and heavy
// reasoning gets the capable model (opus), with sonnet as the safe default.
export type ModelTier = "haiku" | "sonnet" | "opus";

export const MODELS: Record<ModelTier, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
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

  // Heavy multi-step reasoning: synthesis, PRD drafting, harness maintenance/planning.
  const heavy =
    /\b(synthesi|summari[sz]e|draft (a )?prd|write (a )?prd|user flow|screen list|maintain|persona|refactor|plan|scope|architect)\b/.test(
      text,
    );
  if (heavy) return { tier: "opus", model: MODELS.opus };

  // Simple lookups / short Q&A: marketplace search, expert lookup, status pings.
  const light =
    /\b(who (should|can) i (talk|reach)|find (an )?expert|search|show me|list|what is|what's|status|which prototype)\b/.test(
      text,
    );
  if (light) return { tier: "haiku", model: MODELS.haiku };

  // Build/change actions and everything else: capable default.
  return { tier: "sonnet", model: MODELS.sonnet };
}

export function makeAnthropicClient(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}
