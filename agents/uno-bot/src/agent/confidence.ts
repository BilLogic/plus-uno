// Does this reply say what it rests on?
//
// AGENT.md § Grounding requires exactly one woven confidence clause per factual
// reply, and forbids a trailing "Confidence: high" label. The only thing that
// checked that rule was rubric dimension D9 inside the draft judge — which
// skips any draft under MIN_DRAFT_CHARS (1500). Almost every blueprint answer
// in Slack is a few hundred characters, so the rule went unenforced on the
// common case, and the one deterministic guard that did fire
// (stripTrailingConfidence) DELETES a malformed label without putting anything
// back, turning "wrong shape" into "no signal at all".
//
// This module is the cheap deterministic half: decide whether a reply needs a
// clause, and whether it has one. It never rewrites prose — a templated
// sentence is exactly the "house sentence to adapt" the rule bans, and it
// would fabricate a claim the renderer cannot substantiate. What it produces
// is a verdict the caller can act on by escalating to the judge.
//
// Bias: false NEGATIVES are cheap (one extra judge call), false POSITIVES are
// not (a non-compliant reply ships believing itself checked). Every pattern
// below is therefore narrow on purpose.

/**
 * The tools that FETCH FROM A SOURCE. This is the READ-ONLY half of
 * tool-definitions.json minus `slack_react`, which is read-only in the "no
 * confirmation gate" sense but retrieves nothing — it posts a reaction. The
 * side-effect tools (notion_create/update/archive, component_implement,
 * prototype_scaffold, shareout_post, email_send, proposal_resolve) are absent
 * for the same reason: none of them is a source the answer can rest on.
 *
 * Kept here rather than imported from loop-shared.ts so this module stays pure
 * — it is compiled and tested outside the Worker runtime.
 */
export const RETRIEVAL_TOOLS: ReadonlySet<string> = new Set([
  "roadmap_query",
  "notion_search",
  "source_read",
  "search_blueprint",
  "github_read",
  "slack_user_profile",
  "slack_channel_members",
  "slack_thread_read",
  "slack_search",
]);

/** True when any tool that reaches a source ran this turn. */
export function retrievalRanIn(toolsUsed: readonly string[]): boolean {
  return toolsUsed.some((tool) => RETRIEVAL_TOOLS.has(tool));
}

/** What the turn did, as far as the confidence rule cares. */
export type ConfidenceContext = {
  /** Did a tool that fetches from a source run this turn? */
  retrievalRan: boolean;
  /**
   * Did that retrieval actually reach a source, or was it served from cache?
   * A cached hit is NOT "a fetch performed this turn" — which is precisely
   * what a freshness claim asserts.
   */
  servedFromCache?: boolean;
};

export type ConfidenceVerdict =
  /** Nothing to check — no retrieval, or nothing factual said. */
  | { kind: "exempt" }
  /** Carries a woven clause. Ship it. */
  | { kind: "ok" }
  /** Says "just now" over data that was not fetched now. The worst case: not a
   *  missing claim but a false one. */
  | { kind: "false-freshness" }
  /** The model reached for the retired trailing label instead of weaving. */
  | { kind: "trailing-label" }
  /** Factual, grounded, and says nothing about what it rests on. */
  | { kind: "absent" }
  /** Factual, nothing fetched this turn, and it never says so. D9 requires a
   *  from-memory answer to admit it; this branch used to be `exempt`. */
  | { kind: "unsourced" };

/**
 * Sureness the model EARNED by looking: first-person verification, or a named
 * source it consulted. Anchored on the person doing the checking so that
 * incidental uses ("check the box in settings") do not read as a clause.
 */
const VERIFIED = [
  /\bI(?:'ve| have)?\s+(?:just\s+)?(?:checked|read|pulled|looked|searched|confirmed|verified|found|fetched)\b/i,
  /\bchecked\s+the\s+\w+/i,
  /\b(?:just\s+)?(?:re-?)?read\s+(?:the|this|it)\b/i,
  /\bwhat\s+I\s+(?:can\s+see|found|read)\b/i,
];

/**
 * Sureness the model is DISCLAIMING. Equally valid as the clause — the rule
 * asks for "what was checked or how sure", and "I'm going from memory" answers
 * the second half honestly.
 */
const HEDGED = [
  /\bfrom\s+memory\b/i,
  /\bnot\s+(?:entirely\s+|totally\s+|fully\s+)?(?:sure|certain)\b/i,
  /\b(?:can(?:no|')t|could(?:n'| no)?t)\s+(?:verify|confirm|check|find)\b/i,
  /\bas\s+far\s+as\s+I\s+can\s+tell\b/i,
  /\bI\s+(?:think|believe|suspect)\b/i,
  /\bworth\s+(?:double-?checking|verifying)\b/i,
  /\bmay\s+be\s+(?:out\s+of\s+date|stale)\b/i,
];

/**
 * Claims that the data is current AS OF NOW. Only true of a live fetch made
 * this turn — a cache hit, a re-read, or a prior turn earns "I read this
 * earlier" at best.
 */
const FRESHNESS = [
  /\bjust\s+now\b/i,
  /\bright\s+now\b/i,
  /\bas\s+of\s+(?:today|now|this\s+(?:morning|afternoon))\b/i,
  /\bcurrently\b/i,
  /\bat\s+the\s+moment\b/i,
  /\btoday'?s\b/i,
];

/**
 * The retired shape. Deliberately WIDER than delivery.ts's
 * TRAILING_CONFIDENCE, which only strips a HIGH rating (a trailing "low — from
 * memory" is often the reply's only calibration signal, so deleting it would
 * make the answer read more certain than the model was). Here we are not
 * deleting anything — only noticing that the model reached for a label instead
 * of weaving — so every rating counts.
 *
 * Written with horizontal-whitespace classes and no nested quantifiers over
 * `\s`, because the narrow version of this regex once backtracked badly enough
 * on trailing blank lines to blow the 10 ms Worker CPU limit and post nothing
 * at all (delivery.ts:107-117). Model output is shaped by fetched content, so
 * that input is reachable from a read.
 */
const TRAILING_LABEL =
  /\n[^\S\n]*(?:[-•*][^\S\n]+)?[_*]{0,2}[^\S\n]*confidence[^\S\n]*[_*]{0,2}[^\S\n]*[:—–-][^\n]*$/i;

const matchesAny = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

/** True when the reply says what it checked, or how sure it is. */
export function hasWovenConfidence(text: string): boolean {
  return matchesAny(text, VERIFIED) || matchesAny(text, HEDGED);
}

/** True when the reply asserts its data is current as of now. */
export function claimsFreshness(text: string): boolean {
  return matchesAny(text, FRESHNESS);
}

/** True when the reply ends in the retired "Confidence: …" label. */
export function hasTrailingLabel(text: string): boolean {
  return TRAILING_LABEL.test(text.trimEnd());
}

/**
 * Openers that are the whole reply when someone is just being acknowledged.
 * Kept short and literal: this is not a general classifier, it is a list of
 * things that are not claims.
 */
const ACKNOWLEDGEMENT =
  /^(?:ok(?:ay)?|got\s+it|sure|done|on\s+it|will\s+do|no\s+problem|cancell?ed|thanks?|you'?re\s+welcome|yep|yes|no)\b[\s\S]{0,40}$/i;

/**
 * Does this reply assert anything?
 *
 * NOT `footerKindFor(...) === "none"`, which was the first design and is wrong.
 * That classifier asks "is this short, unlinked and listless" — so
 * *"Yep — and that card moved to In Review yesterday"* (48 characters, no link,
 * no list) reads as an acknowledgement and would be exempted, while carrying a
 * factual claim about the board. An acknowledgement is a reply that says
 * nothing beyond the acknowledgement itself.
 */
export function assertsSomething(text: string): boolean {
  const body = text.trim();
  if (!body) return false;
  if (ACKNOWLEDGEMENT.test(body)) return false;

  // A reply that is only questions is asking, not telling.
  const sentences = body
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.some((s) => !s.endsWith("?") && s.split(/\s+/).length >= 4);
}

/**
 * Is this reply offered as the bot's own thinking rather than as fact?
 *
 * Only consulted on the NOTHING-WAS-FETCHED path, and only to decide whether a
 * from-memory disclosure is owed. "Here's how I'd approach the redesign,
 * roughly" sources nothing because there is nothing to source — it is a
 * proposal, and asking the model to add "this is from memory" to its own
 * suggestion produces filler, which is the thing D9 exists to prevent.
 *
 * A factual claim about the estate ("the card moved to In Review") carries none
 * of these and still owes the disclosure.
 */
const OFFERED_AS_OPINION =
  /\b(?:i'?d\b|i would|i'?d suggest|my take|i think|i suspect|roughly|off the top|a rough|one approach|here'?s how i|if it were me|my instinct)\b/i;

/**
 * The verdict for one delivered reply.
 *
 * Call this on the body that will actually be SENT — after the trailing-label
 * strip and after capText. The judge sees the draft, and capText truncates at
 * MAX_POST_CHARS afterwards, so a clause in a closing paragraph can be
 * amputated from a message the telemetry has already recorded as `verdict=pass`.
 */
export function judgeConfidence(
  deliveredText: string,
  ctx: ConfidenceContext,
): ConfidenceVerdict {
  if (!ctx.retrievalRan) {
    // Nothing was fetched. Two different failures live here, and until
    // 2026-08-23 only the first was caught.
    if (!assertsSomething(deliveredText)) return { kind: "exempt" };
    // Opinion offered as opinion sources nothing, because there is nothing to
    // source. Checked BEFORE the disclosure branch and after the freshness one:
    // a hedge does not excuse "I just checked" when nothing was checked.
    // (1) Claiming freshness over data nobody fetched — a false claim.
    if (claimsFreshness(deliveredText)) return { kind: "false-freshness" };
    // (2) Asserting something factual and never saying it came from memory.
    //
    // This returned `exempt`, on the reading that "no retrieval means no
    // freshness to claim". True as far as it goes, but D9 asks for more than
    // the absence of a false claim: a from-memory answer must SAY it is from
    // memory. R1 is exactly this shape — "What's the difference between Card
    // and Surface?" answered off loaded docs with no tool call — and it failed
    // 2 of 3 samples once the suite started sampling it, because whether a
    // clause appeared was left entirely to the draw.
    if (OFFERED_AS_OPINION.test(deliveredText)) return { kind: "exempt" };
    if (hasTrailingLabel(deliveredText)) return { kind: "trailing-label" };
    return hasWovenConfidence(deliveredText) ? { kind: "ok" } : { kind: "unsourced" };
  }

  if (!assertsSomething(deliveredText)) return { kind: "exempt" };

  // A cache hit is not a fetch performed this turn. This is the 2026-08-17
  // shape: the tool ran, the data did not come from the source.
  if (ctx.servedFromCache && claimsFreshness(deliveredText)) {
    return { kind: "false-freshness" };
  }

  if (hasTrailingLabel(deliveredText)) return { kind: "trailing-label" };
  if (hasWovenConfidence(deliveredText)) return { kind: "ok" };
  return { kind: "absent" };
}

/** Verdicts that should be repaired rather than delivered as-is. */
export function needsRepair(verdict: ConfidenceVerdict): boolean {
  return verdict.kind !== "ok" && verdict.kind !== "exempt";
}

/**
 * What to tell the judge when a verdict needs repair. One sentence, specific to
 * what went wrong — a generic "fix the confidence" instruction produces a
 * generic clause, which is the filler the rule exists to prevent.
 */
export function repairInstruction(verdict: ConfidenceVerdict): string | null {
  switch (verdict.kind) {
    case "unsourced":
      return (
        "CONFIDENCE (from memory). This turn fetched nothing, and the draft states things as fact " +
        "without saying where they come from. Weave in — in your own words, wherever it reads " +
        "naturally — that this is from what you already know rather than something you looked up " +
        "just now, and say how sure you are. Do NOT invent a source, do NOT claim to have checked " +
        "anything, and do NOT append a trailing label. Change nothing else."
      );
    case "false-freshness":
      return (
        "This reply claims its information is current, but nothing was fetched " +
        "from the source this turn (or it came from cache). Rewrite the " +
        "confidence clause to say what the answer actually rests on — a " +
        "re-read or an earlier look earns 'I read this earlier', not 'just now'."
      );
    case "trailing-label":
      return (
        "This reply ends with a standalone confidence label, which is retired. " +
        "Weave the same information into a clause where it lands naturally, in " +
        "words that fit this answer, and remove the trailing line."
      );
    case "absent":
      return (
        "This reply states facts drawn from a source but never says what was " +
        "checked or how sure it is. Add exactly one woven clause — not a " +
        "trailing label, and not a second one if you find you already had it."
      );
    default:
      return null;
  }
}
