// "I found nothing" is not "there is nothing".
//
// Eval S1, failing intermittently since before 2026-08-22: a Slack search comes
// back empty and the reply says *"no one in Slack has mentioned a hard
// deadline"* instead of *"nothing in the public channels I can see"*. The first
// is a claim about the world; only the second is a claim the bot can make.
//
// It matters more than it reads. Someone asks whether a deadline was ever
// agreed, the bot says nobody mentioned one, and they stop looking — while the
// decision sits in a private channel the search never touched. A confident
// absence is the most expensive wrong answer, because it ends the search.
//
// WHY A DETERMINISTIC CHECK AND NOT MORE PROMPTING
// ------------------------------------------------
// The instruction already ships in the best place available: inside the empty
// search result itself (`absence_scope` in tools/slack-search-response.ts), not
// in a distant prompt rule. It spells out the wording and even names the
// failing phrase. It still slips roughly one time in four, because "there were
// no results" compresses into "there is nothing" in fluent English.
//
// And the file records what happened last time someone leaned harder on the
// wording: it fixed S1 and broke S3 in the same run — the model scoped the
// absence and dropped the connect-link offer. Two obligations, one instruction,
// and it did one. So this does not touch the instruction. It checks the
// DELIVERED text and forces a repair, the same shape as the confidence
// pre-check (agent/confidence.ts → forceReason → reviewDraft).
//
// THE SCOPE IS NOT ALWAYS "PUBLIC CHANNELS"
// -----------------------------------------
// There are three visibility modes (tools/slack-search.ts). Under
// `requester-own` the search really does cover the requester's DMs and private
// channels, so "nothing in the public channels I can see" would be FALSE — it
// understates what was searched. The repair text is therefore derived from the
// visibility string the search actually reported, never hardcoded.
//
// Even at `requester-own`, "no one has mentioned it" stays an overclaim: that
// token spans what THAT person can see, and a colleague's private channel they
// are not in remains invisible. The honest form widens; it does not vanish.
//
// Pure and import-free so every branch is testable.

export interface AbsenceContext {
  /** The `visibility` string the search reported, verbatim. */
  visibility: string;
  /** The `searched_surfaces` string the search reported, verbatim. */
  searchedSurfaces: string;
}

/**
 * Claims about the WORLD rather than about the search. Matched as whole
 * phrases — this only runs on a turn where a search already came back empty,
 * so the surrounding context is narrow by construction.
 */
const ABSOLUTE = [
  "no one", "no-one", "nobody", "never been", "never mentioned",
  "there is no", "there's no", "there are no", "there aren't any",
  "doesn't exist", "does not exist", "no such", "nothing exists",
  "no mention of", "no discussion", "hasn't been discussed",
  "has not been discussed", "was never", "has never",
];

/**
 * Any clause that names the boundary of what was actually looked at. Broad on
 * purpose: the check exists to catch a bare absolute, not to police phrasing,
 * and a false "scoped" costs nothing while a false "unscoped" spends a model
 * round-trip rewriting a reply that was already honest.
 */
const SCOPED = [
  "i can see", "you can see", "i searched", "searched", "i looked",
  "public channel", "private channel", "dms", "direct message",
  "not covered", "didn't cover", "did not cover", "outside",
  "withheld", "connect", "access to", "visible to", "my view",
  "in what i", "anywhere i", "from what i",
  // "Nobody mentioned it publicly, though there were also matches in private
  // spaces I can't surface" is the withheld-matches report S1's own judgeNote
  // calls a PASS — honest, and scoped by the adverb rather than by a noun
  // phrase. The first draft of this list flagged it, which would have forced a
  // pointless rewrite of an already-correct reply.
  "publicly", "private space", "can't surface", "cannot surface",
];

export type AbsenceVerdict = "ok" | "unscoped";

/**
 * Does the delivered reply claim an absence it is not entitled to?
 *
 * Call only when a search ran this turn AND returned nothing — outside that,
 * an absolute is often perfectly true and none of this applies.
 */
export function judgeAbsence(text: string): AbsenceVerdict {
  const t = (text ?? "").toLowerCase();
  if (!t.trim()) return "ok";
  const claimsAbsolute = ABSOLUTE.some((p) => t.includes(p));
  if (!claimsAbsolute) return "ok";
  const namesScope = SCOPED.some((p) => t.includes(p));
  return namesScope ? "ok" : "unscoped";
}

/** The three modes, reduced to the one fact the repair needs. */
function modeOf(visibility: string): "own" | "workspace" | "public" {
  const v = (visibility ?? "").toLowerCase();
  if (v.startsWith("requester-own")) return "own";
  if (v.startsWith("workspace-filtered")) return "workspace";
  return "public";
}

/**
 * What to tell the judge to fix, in the wording the mode that actually ran
 * makes true.
 *
 * The last clause is load-bearing and is there because of S3: the previous
 * attempt at this fixed the absence and dropped the connect-link offer. The
 * repair is explicitly additive — rewrite the claim, keep everything else.
 */
export function absenceRepairInstruction(ctx: AbsenceContext): string {
  const shape =
    modeOf(ctx.visibility) === "own"
      ? 'scope it to what the REQUESTER can see — e.g. "nothing anywhere you can see, including your DMs and private channels" — since their own credential was used'
      : modeOf(ctx.visibility) === "workspace"
        ? 'scope it to the public and team-allowlisted channels that were searched — e.g. "nothing in the channels I can search"'
        : 'scope it to public channels — e.g. "nothing in the public channels I can see" — and say plainly that DMs and private channels were NOT covered';

  return (
    `ABSENCE SCOPE. The draft asserts something does not exist, when all that is known is that a ` +
    `search returned nothing. The search ran with visibility "${ctx.visibility}" over: ${ctx.searchedSurfaces}. ` +
    `Rewrite ONLY the absence claim so it describes the SEARCH, not the world: ${shape}. ` +
    `Change nothing else — in particular, keep any connect-link offer, any withheld-matches note, ` +
    `and the rest of the answer exactly as they are.`
  );
}
