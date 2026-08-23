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
// Pure and import-free so the judgement is testable.

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
 * The noun each tool's proposal is about. A reply that mentions the *thing*
 * ("the card", "the email") is addressing the proposal even without gate
 * vocabulary — which is how people actually write.
 */
const TOOL_NOUNS: Record<string, string[]> = {
  notion_create: ["card", "prd", "intake", "ticket", "notion", "decision"],
  notion_update: ["card", "update", "notion", "property"],
  notion_archive: ["archive", "card", "notion"],
  component_implement: ["component", "implement", "build", "pr"],
  prototype_scaffold: ["prototype", "scaffold", "build", "pr"],
  shareout_post: ["share", "share-out", "shareout", "feedback", "post"],
  email_send: ["email", "mail", "send"],
};

/**
 * True when `reply` plausibly refers to the pending `toolName` proposal.
 *
 * Leans towards saying YES — a false "addressed" only loses one log line,
 * while a false "unaddressed" would inflate the very rate this exists to
 * measure and make the number useless.
 */
export function proposalWasAddressed(reply: string, toolName: string): boolean {
  const text = (reply ?? "").toLowerCase();
  if (!text.trim()) return false;
  const terms = [...GATE_WORDS, ...(TOOL_NOUNS[toolName] ?? [])];
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
