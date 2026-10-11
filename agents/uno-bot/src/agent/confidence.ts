// Does this reply say what it rests on?
//
// AGENT.md § Grounding asks for sureness in prose only when it is lower than a
// live read earns — every read this turn failed, or none ran and the answer is
// an inference — and forbids a trailing "Confidence: high" label. A live or
// cached read this turn says nothing in prose: the Sources box shows what was
// read, and marks a cached source from the data (`slack/sources-box.ts`). One
// failed read among others is the ⚠️ line's to say (`turn/warning-line.ts`). The only thing that
// checked that rule was rubric dimension D9 inside the draft judge — which
// skips any draft under MIN_DRAFT_CHARS (1000, and 1500 when this was written). Almost every blueprint answer
// in Slack is a few hundred characters, so the rule went unenforced on the
// common case, and the one deterministic guard that did fire
// (stripTrailingConfidence) DELETES a malformed label without putting anything
// back, turning "wrong shape" into "no signal at all".
//
// This module is the cheap deterministic half: decide whether a reply owes a
// clause, and whether it has one. It never rewrites prose — a templated
// sentence is exactly the "house sentence to adapt" the rule bans, and it
// would fabricate a claim the renderer cannot substantiate. What it produces
// is a verdict the caller can act on by escalating to the judge.
//
// Bias: false NEGATIVES are cheap (one extra judge call), false POSITIVES are
// not (a non-compliant reply ships believing itself checked). Every pattern
// below is therefore narrow on purpose.
//
// The one import is the tool table, which imports nothing: whether a tool
// fetched from a source is the table's `retrieval` column, and the regexes
// below are all that is left of this module's own judgement.
import { rowFor } from "./tool-table";

/**
 * True when any tool that reaches a source ran this turn.
 *
 * Which tools those are is the tool table's `retrieval` column
 * (`agent/tool-table.ts`), not a set restated here: the set this module kept
 * had to be remembered alongside every new tool, and a tool missing from it
 * read as "nothing was fetched", which is the branch that lets a grounded
 * answer ship with no clause at all. The table is import-free, so reading it
 * costs this module nothing — it still compiles and runs under plain Node.
 *
 * A name nobody registered counts as no retrieval. Tool names here come from
 * the turn's own telemetry, so that case means a tool was renamed and the
 * telemetry lagged: one extra judge call, which is the cheap direction.
 */
export function retrievalRanIn(toolsUsed: readonly string[]): boolean {
  return toolsUsed.some((tool) => rowFor(tool)?.retrieval === true);
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
  /**
   * Did every lookup that ran fail to reach its source? Then nothing live
   * stands behind the answer, and the prose owes a hedge. A failure a later
   * call of the same lookup recovered from does not count.
   */
  readFailed?: boolean;
};

/** Why a freshness claim is false: the rows came from cache, every lookup
 *  failed, or no lookup ran at all. */
export type FreshnessCause = "cached" | "failed" | "unfetched";

export type ConfidenceVerdict =
  /** Nothing to check — no retrieval, or nothing factual said. */
  | { kind: "exempt" }
  /** Owes nothing more: a live or cached read, or the hedge or basis clause
   *  its sureness asks for is there. Ship it. */
  | { kind: "ok" }
  /** Says "just now" over data that was not fetched now. The worst case: not a
   *  missing claim but a false one. `cause` is why it was not fetched now, so
   *  the repair can say so. */
  | { kind: "false-freshness"; cause: FreshnessCause }
  /** The model reached for the retired trailing label instead of weaving. */
  | { kind: "trailing-label" }
  /** Factual, every read this turn failed, and it never says how sure it is. */
  | { kind: "unhedged" }
  /** Factual, nothing fetched this turn, and it never says so. D9 requires a
   *  from-memory answer to admit it; this branch used to be `exempt`. */
  | { kind: "unsourced" }
  /** Nothing fetched this turn, yet it speaks of the blueprint as read: it
   *  claims to be grounded in it, or names blueprint places without saying
   *  they come from an earlier answer. History is where those came from. */
  | { kind: "carried" };

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
  /\b(?:can(?:no|')t|could(?:n'| no)?t)\s+(?:verify|confirm|check|find|open|read|reach)\b/i,
  /\bunconfirmed\b/i,
  /\bfrom\s+what\s+I\s+(?:know|recall|remember)\b/i,
  /\bnot\s+a\s+fresh\s+(?:read|look)\b/i,
  /\bas\s+far\s+as\s+I\s+can\s+tell\b/i,
  /\bI\s+(?:think|believe|suspect)\b/i,
  /\bworth\s+(?:double-?checking|verifying)\b/i,
  /\bmay\s+be\s+(?:out\s+of\s+date|stale)\b/i,
  /\b(?:my|the|an?|that)\s+(?:earlier|previous|last)\s+(?:answer|reply|look|lookup|search|read)\b/i,
];

/**
 * A claim that the answer stands on the blueprint. Only a lookup of this turn
 * earns it: an answer carried from an earlier turn of the conversation rests
 * on that turn's lookups, which are not this one's sources.
 */
const GROUNDED_IN_BLUEPRINT = [
  /\b(?:grounded|based|drawn|built|pulled|taken)\s+(?:directly\s+|straight\s+)?(?:in|on|from)\s+(?:our|the)\s+(?:current\s+|live\s+)?blueprint\b/i,
  /\baccording\s+to\s+(?:our|the)\s+(?:current\s+|live\s+)?blueprint\b/i,
];

/** A blueprint place: the reader's breadcrumb (`Phase › Scenario …`) or the
 *  index's labelled form (`Phase: … · Scenario: …`). */
const BLUEPRINT_PLACE = [
  /\S[^\S\n]+›[^\S\n]+\S/,
  /\b(?:Phase|Scenario):[^\n]*?[·›][^\S\n]*(?:Scenario|Path|Step|Layer|Lane):/,
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

/** True when the reply says how sure it is — a hedge, not a claim of having
 *  looked, which is what a failed read owes. */
export function hasHedge(text: string): boolean {
  return matchesAny(text, HEDGED);
}

/**
 * A look that did NOT happen, through to the freshness word that dates it:
 * "I couldn't reach the board just now". That is the honest hedge a failed
 * read owes, not a claim that the data is current, so it is taken out before
 * the freshness patterns run. Bounded to one sentence.
 */
const FAILED_LOOK =
  /\b(?:can(?:no|')t|could(?:n'| no)?t(?:\s+be)?|was(?:n'|\s+no)t\s+able\s+to|unable\s+to|failed\s+to)\b[^.!?\n]*?\b(?:just\s+now|right\s+now|at\s+the\s+moment|currently)\b/gi;

/** True when the reply asserts its data is current as of now. A failed look
 *  dated "just now" is a hedge, and does not count. */
export function claimsFreshness(text: string): boolean {
  return matchesAny(text.replace(FAILED_LOOK, ""), FRESHNESS);
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
 * strip. The judge otherwise sees a draft the delivered body has diverged
 * from, which is how a clause in a closing paragraph came to be amputated (by
 * the cap that used to live there) from a message the telemetry had already
 * recorded as `verdict=pass`.
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
    if (claimsFreshness(deliveredText)) return { kind: "false-freshness", cause: "unfetched" };
    // (1b) Speaking of the blueprint as read. A claim of grounding is false
    // whatever else the prose says; a place named is a current-state claim,
    // and owes a word on where it came from even inside a suggestion.
    if (matchesAny(deliveredText, GROUNDED_IN_BLUEPRINT)) return { kind: "carried" };
    if (matchesAny(deliveredText, BLUEPRINT_PLACE) && !hasHedge(deliveredText)) return { kind: "carried" };
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

  // A cache hit, or a read that failed, is not a fetch performed this turn.
  // The cache case is the 2026-08-17 shape: the tool ran, the data did not
  // come from the source.
  if ((ctx.servedFromCache || ctx.readFailed) && claimsFreshness(deliveredText)) {
    return { kind: "false-freshness", cause: ctx.readFailed ? "failed" : "cached" };
  }

  if (hasTrailingLabel(deliveredText)) return { kind: "trailing-label" };
  // Every read failed: the answer rests on something other than this turn's
  // look, and the prose says how sure that makes it.
  if (ctx.readFailed) return hasHedge(deliveredText) ? { kind: "ok" } : { kind: "unhedged" };
  // A live read, or a cached one, owes no clause: the Sources box shows what
  // was read and marks a cached source from the data.
  return { kind: "ok" };
}

/** The false-freshness repair, by why the claim is false. */
const FALSE_FRESHNESS: Readonly<Record<FreshnessCause, string>> = {
  cached:
    "This reply claims its information is current, but the lookup served its rows from a " +
    "short-lived cache, not a read made this turn. Take out the freshness claim ('just now', " +
    "'current') and add nothing in its place: the Sources box beneath marks the cached source.",
  failed:
    "This reply claims its information is current, but every lookup this turn failed to reach " +
    "its source. Replace the freshness claim with one woven clause saying the read failed and " +
    "how sure that leaves the answer — for example 'I could not open the board, so treat this " +
    "as unconfirmed'.",
  unfetched:
    "This reply claims its information is current, but no lookup ran this turn. Replace the " +
    "freshness claim with one woven clause saying what the answer rests on — what you already " +
    "know, not a fresh read — and how sure that makes it.",
};

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
      return FALSE_FRESHNESS[verdict.cause];
    case "carried":
      return (
        "CARRIED ANSWER. This turn ran no lookup, yet the draft speaks of the blueprint as if it " +
        "had read it. Take out any claim of being grounded in the blueprint, and weave in one " +
        "clause saying this goes from the earlier answer in this conversation (or from what you " +
        "already know), not a fresh look. Name each blueprint place as phase › scenario › path › " +
        "step (lane). Do NOT invent a source or append a label. Change nothing else."
      );
    case "trailing-label":
      return (
        "This reply ends with a standalone confidence label, which is retired. " +
        "Weave the same information into a clause where it lands naturally, in " +
        "words that fit this answer, and remove the trailing line."
      );
    case "unhedged":
      return (
        "Every lookup this turn failed to reach its source, and the reply states " +
        "facts without saying so. Add one woven clause saying what the answer " +
        "rests on instead and how sure that makes it — for example 'I could not " +
        "open the board, so treat this as unconfirmed'. Not a trailing label, " +
        "and no claim of having checked anything."
      );
    default:
      return null;
  }
}
