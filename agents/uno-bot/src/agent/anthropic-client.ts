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

// ─── Grounding-aware router (Phase 3, 2026-07-10) ────────────────────────────
// pickModel() greps for verbs, which misjudges effort: "what's on the roadmap?"
// — short, no fancy verbs — landed on haiku for a task needing multi-step MCP
// grounding across Notion. classifyRoute() replaces it in the agent path: one
// tiny tool-less haiku call (~1s, fraction of a cent) classifies the request on
// the two axes that actually predict cost — reasoning depth and how much
// grounding the ANSWER needs — then maps to a tier. Keyword fast-paths keep
// confirm/cancel and explicit escalations free, and any failure falls back to
// pickModel(), so routing can never take the bot down. events.ts still uses
// pickModel() for the instant ⏳ preview (no latency before the receipt).
interface RouteDecision {
  tier: ModelTier;
  model: string;
  reason: string;
}

const ROUTER_SYSTEM = `You route requests for a design-team assistant. Classify the request on two axes and answer ONLY with JSON, no prose:
{"depth":"quick|standard|deep","grounding":"none|single|multi"}

depth — reasoning needed: quick = lookup/ack/one-liner; standard = normal question or small task; deep = synthesis, drafting a document (PRD/spec), multi-part analysis, review/critique, planning.
grounding — sources the ANSWER must consult: none = answerable from the conversation; single = one lookup (one page, one thread, one search); multi = several sources or several lookups (board + cards, search + fetch chains, cross-referencing people/projects/status).`;

export async function classifyRoute(
  client: Anthropic,
  opts: { userText: string; hasPending: boolean },
): Promise<RouteDecision> {
  const text = opts.userText.toLowerCase();

  // Fast paths — no classifier call needed.
  if (opts.hasPending && /\b(go ahead|yes|confirm|do it|cancel|no|stop|nope|abort)\b/.test(text)) {
    return { tier: "haiku", model: MODELS.haiku, reason: "proposal-resolution" };
  }
  if (/\bthink (hard|deeply)\b/.test(text)) {
    return { tier: "opus", model: MODELS.opus, reason: "explicit-escalation" };
  }

  try {
    const res = await client.messages.create({
      model: MODELS.haiku,
      max_tokens: 60,
      system: ROUTER_SYSTEM,
      messages: [{ role: "user", content: opts.userText.slice(0, 1500) }],
    });
    const raw = res.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as {
      depth?: string;
      grounding?: string;
    };
    const depth = parsed.depth ?? "standard";
    const grounding = parsed.grounding ?? "single";
    // SONNET FLOOR for every real ask (user decision 2026-07-10: "the original
    // way is terrible" — under-powering real requests is the failure class).
    // The smart model orchestrates and DELEGATES mechanical lookups to haiku
    // subagents via the `delegate` tool; haiku never owns a whole user request
    // except the proposal-resolution fast-path above. deep → opus.
    if (depth === "deep") return { tier: "opus", model: MODELS.opus, reason: `classified:${depth}/${grounding}` };
    return { tier: "sonnet", model: MODELS.sonnet, reason: `classified:${depth}/${grounding}` };
  } catch (err) {
    const fallback = pickModel(opts);
    console.warn(
      `[route] classifier failed (${err instanceof Error ? err.message : String(err)}) — keyword fallback → ${fallback.tier}`,
    );
    return { ...fallback, reason: "keyword-fallback" };
  }
}

export function makeAnthropicClient(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}
