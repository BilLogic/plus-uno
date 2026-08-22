// Model tiers + request routing, shared by both provider lanes.
//
// (Was anthropic-client.ts — the direct-Anthropic SDK client was removed when
// the Claude lane moved to Vertex; only the provider-neutral routing survives.)

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
// Defined in tiers.ts (import-free) so pure modules can name a tier without
// pulling in the Workers type graph. Re-exported here: routing is where callers
// expect to find it.
export type { ModelTier } from "./tiers";
import type { ModelTier } from "./tiers";

export const MODELS: Record<ModelTier, string> = {
  chill: "claude-haiku-4-5@20251001",
  default: "claude-sonnet-5",
  grind: "claude-opus-4-8",
};

export interface RouteDecision {
  tier: ModelTier;
  reason: string;
}

/**
 * A short message against a pending proposal is almost always the answer to
 * it, and reading "sure go ahead" does not need the big model.
 *
 * This is a COST heuristic only. It used to be a phrase list
 * (`looksLikeResolution`, retired 2026-08-22) — a list here is harmless but
 * pointless, because the worst a wrong guess can do is spend a slightly more
 * expensive model. Length is the honest signal: a decision is short, an
 * amendment is a sentence.
 */
const SHORT_REPLY_TOKENS = 6;

export function routeRequest(opts: {
  userText: string;
  hasPending: boolean;
  /** Set by /grind, /chill and the "think harder" shortcut. */
  override?: ModelTier;
}): RouteDecision {
  const text = opts.userText.toLowerCase();

  // PRECEDENCE: an explicit request beats every heuristic. Someone who asked for
  // cheap on a hard question has told us what they want, and overriding it makes
  // the command untrustworthy.
  if (opts.override) return { tier: opts.override, reason: "explicit-command" };

  if (opts.hasPending && text.split(/\s+/).filter(Boolean).length <= SHORT_REPLY_TOKENS) {
    return { tier: "chill", reason: "short-reply-to-proposal" };
  }
  // "harder" and "more" included deliberately: the natural phrasing is "think
  // harder", and `\bthink hard\b` does NOT match it — the word boundary fails on
  // the trailing "er". The grind SHORTCUT asked exactly that and silently ran the
  // default tier, promising deep thinking and delivering none.
  if (/\bthink (hard(er)?|deeply|more)\b/.test(text)) {
    return { tier: "grind", reason: "escalation-phrase" };
  }
  return { tier: "default", reason: "default-lane" };
}
