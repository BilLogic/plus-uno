// Did the reply say anything about the proposal that is still sitting there?
//
// Proposal B, plan 2026-08-21-003. When a proposal is pending and the model's
// turn ends as an ordinary reply — neither resolving it nor mentioning it —
// the approval has evaporated silently. That is the 2026-07-10 failure, and it
// is currently invisible: the model answers something adjacent, the person
// assumes the thing they approved is happening, and nothing anywhere records
// that it is not.
//
// **This is deliberately log-only.** The obvious next step is to post "I still
// have X staged — did you mean to go ahead?", but that belongs on a MEASURED
// rate, not a guess: a bounce notice that fires on every legitimate "answer my
// unrelated question while the card waits" would be worse than the silence.
// So the Worker learns how often this happens first.
//
// Pure, and its one import is the tool table, which imports nothing — so the
// judgement is still testable under plain Node.

import { gateWordsFor } from "./tool-table";

/**
 * Words that mean the reply is TALKING ABOUT the staged action, whichever tool
 * it is — the gate's own vocabulary, as a person would use it.
 */
const GATE_WORDS = [
  "staged", "staging", "pending", "waiting on you", "still have",
  "approve", "approval", "confirm", "confirmation", "cancel",
  "go ahead", "the card above", "that card", "hold off",
];

/**
 * True when `reply` plausibly refers to the pending `toolName` proposal.
 *
 * Beyond the gate's vocabulary, a reply that mentions the *thing* ("the card",
 * "the email") is addressing the proposal — which is how people actually
 * write. Those nouns are the gated row's own (`agent/tool-table.ts`
 * § `GateWords`), not a second list keyed by tool name here: this module kept
 * one, and a gated tool absent from it had only the gate words to match on,
 * which would have counted every on-topic reply as a bounce and inflated the
 * one rate this exists to measure. A name with no gated row — an ungated tool,
 * or a tool that no longer exists — contributes no nouns and is judged on the
 * gate words alone.
 *
 * Leans towards saying YES — a false "addressed" only loses one log line,
 * while a false "unaddressed" would inflate that rate and make the number
 * useless.
 */
export function proposalWasAddressed(reply: string, toolName: string): boolean {
  const text = (reply ?? "").toLowerCase();
  if (!text.trim()) return false;
  const terms = [...GATE_WORDS, ...(gateWordsFor(toolName)?.nouns ?? [])];
  return terms.some((t) => wordRe(t).test(text));
}

/**
 * Whole-word match, never a substring.
 *
 * A plain `includes("confirm")` matches **"reconfirmation"** — and the
 * reconfirmation flow is the single most-discussed subject in this workspace,
 * so substring matching would mark almost every blueprint answer as
 * "addressed" and quietly zero out the bounce rate this exists to measure.
 * Caught by the test fixture on the first run.
 */
const RE_CACHE = new Map<string, RegExp>();
function wordRe(term: string): RegExp {
  let re = RE_CACHE.get(term);
  if (!re) {
    re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    RE_CACHE.set(term, re);
  }
  return re;
}

/** One-line telemetry for a bounce, so the rate is greppable in `wrangler tail`. */
export function bounceLogLine(
  toolName: string,
  userText: string,
  reply: string,
): string {
  const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);
  return (
    `[gate] pending ${toolName} UNADDRESSED after a text turn — ` +
    `user="${clip(userText, 120)}" reply="${clip(reply, 160)}"`
  );
}
