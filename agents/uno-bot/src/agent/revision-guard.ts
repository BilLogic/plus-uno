// Is a judge revision safe to send, or should the original draft go instead?
//
// draft-judge accepts a revision on ONE test: it must be at least
// MIN_REVISION_RATIO of the original's length. Length is not quality. A
// degenerate revision is usually LONGER than the draft, so it sails through —
// live on r46 (2026-08-06) a user received:
//
//   "Hey! System's up and running smoothly. What are we testing or where we
//    testing or work or test or task are we tackling next taking or testing
//    are we diving into today?"
//
// The judge exists to raise quality and instead lowered it, because nothing
// looked at what came back.
//
// WHAT DOESN'T WORK, measured rather than assumed: n-gram repetition and
// word-frequency scoring do not separate that garble (word-run 0.091) from a
// healthy answer (0.059), and a legitimate list of component links scores
// HIGHER than both (0.150). Any threshold catching the garble would reject the
// bot's most common output shape. That approach was tried and dropped.
//
// WHAT DOES WORK is the judge's own contract. Its prompt asks for "the FULL
// corrected draft — same content and voice, minimal edits". A minimal edit
// keeps most of the draft's vocabulary. A revision that shares little with the
// draft is not a minimal edit, whatever it looks like in isolation — and that
// holds regardless of HOW it went wrong, which a stutter-detector cannot claim.
//
// Fails one way only: rejecting a revision sends the ORIGINAL draft, which was
// good enough to send before the judge ran.

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

/**
 * Share of the DRAFT's vocabulary the revision kept, 0..1.
 *
 * Deliberately asymmetric — not Jaccard. A revision may legitimately ADD words
 * (a citation, a clarifying clause) without becoming suspect; what matters is
 * how much of the original it threw away.
 */
export function retainedVocabulary(draft: string, revision: string): number {
  const d = wordSet(draft);
  if (d.size === 0) return 1;
  const r = wordSet(revision);
  let kept = 0;
  for (const w of d) if (r.has(w)) kept++;
  return kept / d.size;
}

// A minimal edit keeps most of the draft's words. Set with headroom: real
// revisions in this codebase rewrite formatting and phrasing, not substance.
const MIN_RETAINED_VOCABULARY = 0.5;
// A "minimal edit" that doubles the length is not one.
const MAX_LENGTH_GROWTH = 2.0;

/**
 * True when the revision should be discarded in favour of the original draft.
 *
 * Short drafts (a one-line greeting) are exempt from the vocabulary test: with
 * a dozen words, dropping three crosses any ratio, so the test is noise there.
 * They keep the growth check, which is what the live failure actually violated.
 */
export function shouldRejectRevision(draft: string, revision: string): boolean {
  const draftWords = wordSet(draft).size;
  const grewTooMuch = revision.length > draft.length * MAX_LENGTH_GROWTH;
  if (grewTooMuch) return true;
  if (draftWords < 15) return false;
  return retainedVocabulary(draft, revision) < MIN_RETAINED_VOCABULARY;
}
