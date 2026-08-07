// The `react` tier: answer with an emoji and no model call at all.
//
// WHY
// ---
// "thanks", "perfect", "got it" are the most common messages in a working DM
// and the least informative. Each one currently costs a full turn: a model
// round-trip, a draft-judge call, a delivery post. The reply is always some
// variant of "no problem" — a sentence nobody needed, in a thread they had
// finished reading. The user's own framing (2026-08-07): *"if helpful to
// minimize the cost, just let the agent respond with slack reaction"*.
//
// So: a closed vocabulary, matched EXACTLY on the whole message, gets a 👍 on
// their message and nothing else.
//
// WHY A CLOSED SET AND NOT A CLASSIFIER
// -------------------------------------
// The cost of a false positive is high and silent. Reacting to a real question
// with 👍 is the 👀-then-silence failure wearing a different emoji — the person
// waits, nothing comes, and no log line says anything went wrong. A model or a
// fuzzy score would trade a rare miss for that. An exact match on a fixed list
// cannot: everything outside the list takes the ordinary path and gets a real
// answer, which is the correct default for anything ambiguous.
//
// Pure and import-free so the vocabulary is unit-testable.

/** Emoji sent for each phrase family. Distinct on purpose — a 🙌 for "nice
 *  work" and a 👍 for "ok" read as a response rather than as an autoreply. */
const THANKS = "pray";
const AGREE = "+1";
const PRAISE = "raised_hands";

// Exact, lowercase, trailing punctuation already stripped by the caller.
//
// Deliberately NOT here: anything that could be a question, an instruction, or
// a proposal decision. "sure", "yes", "do it", "go ahead" are CONFIRM_PHRASES
// in loop-shared and never appear below at any cost.
//
// "ok" and "okay" ARE below, and they are the one genuine hazard: they read as
// acknowledgement after a statement and as assent after an offer. The caller
// resolves that with the piece of context this function does not have — it
// skips the react tier entirely when the bot's own last message ended in a
// question ("want me to check Y next?"), which is the only situation in which
// "ok" means go.
const CLOSED_SET: ReadonlyMap<string, string> = new Map([
  ["thanks", THANKS],
  ["thank you", THANKS],
  ["thanks!", THANKS],
  ["ty", THANKS],
  ["thx", THANKS],
  ["thanks a lot", THANKS],
  ["thank you so much", THANKS],
  ["cheers", THANKS],
  ["appreciate it", THANKS],
  ["ok", AGREE],
  ["okay", AGREE],
  ["k", AGREE],
  ["got it", AGREE],
  ["gotcha", AGREE],
  ["understood", AGREE],
  ["makes sense", AGREE],
  ["noted", AGREE],
  ["sounds good", AGREE],
  ["will do", AGREE],
  ["nice", PRAISE],
  ["nice one", PRAISE],
  ["perfect", PRAISE],
  ["great", PRAISE],
  ["awesome", PRAISE],
  ["amazing", PRAISE],
  ["love it", PRAISE],
  ["beautiful", PRAISE],
  ["good stuff", PRAISE],
  ["nice work", PRAISE],
  ["good work", PRAISE],
]);

// A message of nothing but emoji is the same act ("👍", "🙏", "🎉"). Matched
// structurally rather than listed, because the emoji set is open and the
// STRUCTURE is what makes it an acknowledgement. Slack delivers these as
// `:thumbsup:` shortcodes, and unicode when typed on a phone.
const ONLY_SHORTCODES = /^(?::[a-z0-9_+-]+:\s*){1,3}$/;
const ONLY_UNICODE_EMOJI = /^(?:[\p{Extended_Pictographic}️‍\s]){1,8}$/u;

/**
 * The emoji to react with, or null to take the ordinary path.
 *
 * Caller owns every CONTEXT condition (DM only, no pending proposal, the bot
 * has already answered at least once, no attachments) — this function only
 * answers "is this text, on its own, purely an acknowledgement?".
 */
export function reactOnlyEmoji(text: string): string | null {
  // A trailing "?" is NOT stripped, unlike "." and "!". "thanks?" is a
  // question — surprise, or asking whether that is really all — and answering
  // it with 🙏 is the false positive this whole module is built to avoid.
  const bare = text.trim().toLowerCase().replace(/[.!…\s]+$/g, "");
  if (!bare) return null;
  // Length guard before anything else: the map lookup cannot false-positive,
  // but the emoji regexes are the sort of thing that surprises you on a long
  // input, and nothing this long is an acknowledgement anyway.
  if (bare.length > 24) return null;

  const listed = CLOSED_SET.get(bare);
  if (listed) return listed;

  const original = text.trim();
  if (ONLY_SHORTCODES.test(original) || ONLY_UNICODE_EMOJI.test(original)) return THANKS;

  return null;
}
