// Is the person telling us the last reply was wrong?
//
// This vocabulary drives control flow, so it lives on its own, import-free: the
// module that acts on it is Turn (`turn/turn.ts`), which `tsconfig.test.json`
// compiles, and it used to sit inside the agent's Env-facing entry
// (`agent/run-agent.ts`), which reaches every tool body and drags the whole
// Workers type graph behind it. That entry re-exports both functions, so no
// existing caller changed.

// ── Why this is not a prompt rule ───────────────────────────────────────────
//
// WHY THIS IS NOT A PROMPT RULE. On turn 2 the bot's own turn-1 claim sits in
// history as authoritative prose with no counter-evidence (tool results are
// never persisted). A prompt rule has to beat that, and it fires exactly when
// instruction-following is weakest. So the Worker classifies instead, the same
// way the proposal gate already drives control flow in the Worker.
//
// Deliberately CONSERVATIVE-LEANING-BROAD: a false positive costs one extra
// blueprint search (cheap, and the freshest possible answer); a false negative
// costs a repeat of the 2026-08-17 incident, where the bot restated a wrong
// denial at greater length while claiming it had just re-checked.
const CORRECTION_PATTERNS: RegExp[] = [
  // "no, I meant …" / "no — I'm asking about …"
  /\bno[,.! ]+\s*(i|im|i'm|i am)\b/i,
  /\b(i|we)\s+(meant|mean)\b/i,
  // "I'm talking about …" / "I was asking about …"
  /\b(i'm|im|i am|i was|we're|we are)\s+(talking|asking|referring)\s+about\b/i,
  // "that's not …" / "that isn't …" / "this isn't what I asked"
  /\bthat('s| is| was)?\s*n[o']t\b/i,
  /\bthis\s+is\s*n[o']t\b/i,
  /\bnot\s+what\s+(i|we)\s+(asked|meant|wanted)\b/i,
  // "that's wrong" / "you're wrong" / "this is incorrect" — but NOT a bare
  // "wrong" anywhere in the message. The blueprint is full of ordinary
  // questions about wrong things ("what happens if a tutor logs the wrong
  // hours?"), and every one of them was being read as a correction of the
  // previous reply.
  /\b(that|this|you|you're|youre|it)('s| is| are| was| were)?\s*(is\s+)?(wrong|incorrect|mistaken)\b/i,
  // "actually, …" as a lead-in (not mid-sentence hedging)
  /^\s*(actually|no|nope|nah)\b[,\s—-]/i,
  // Direct pushback on a denial — the exact shape of the failing thread
  // ("it IS in there", "there is one"). Anchored on a contradiction verb next
  // to the existence word: the earlier form let any clause containing "there"
  // downstream of "it is" match, which caught plain descriptive sentences.
  /\b(it|there)\s+(is|does|are)\b[^.?!]{0,40}\b(exist|in there|in the blueprint)\b/i,
  /\b(check|look)\s+again\b/i,
  /\b(re-?check|re-?read|re-?search)\b/i,
];

/**
 * True when this message reads as the user CORRECTING the bot's previous reply.
 *
 * On a hit the turn must (a) force `fresh: true` on search_blueprint so the 60s
 * result cache cannot serve the same rows back under a "I just re-checked"
 * claim, and (b) carry a one-turn directive naming the prior query so it is not
 * reissued verbatim. Both are wired in `turn/turn.ts`.
 */
export function looksLikeCorrection(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // A long message is usually a new question that happens to contain "not",
  // not a correction of the last reply. The real ones are short.
  if (t.length > 400) return false;
  return CORRECTION_PATTERNS.some((re) => re.test(t));
}

/**
 * The one-turn system directive injected on a correction. Names the PRIOR query
 * so the model cannot reissue it verbatim and call that a re-check.
 *
 * @param priorQuery - The blueprint query the previous turn ran, if it is known
 */
export function correctionDirective(priorQuery?: string): string {
  const prior = priorQuery
    ? ` Your previous turn searched the blueprint for "${priorQuery}" — do NOT reissue that query verbatim; search with DIFFERENT words (the scenario name, the path name, the layer) before answering.`
    : " Search the source again with DIFFERENT words from last turn before answering.";
  return (
    "(system: the user is CORRECTING your previous reply. Treat your own earlier claim as UNVERIFIED, not as established fact." +
    prior +
    " Your reply must either cite something you fetched THIS turn, or plainly concede you got it wrong. Restating the previous answer at greater length is a failure, and so is claiming you re-checked without a new lookup.)"
  );
}
