// When a typed message may resolve a staged proposal with no model call.
//
// The old rule was whole-message equality against a phrase list, so
// "sure go ahead" — the most natural thing a person types — missed the
// deterministic path entirely, because only "sure" and "go ahead" were listed,
// separately. This module widens that to natural compound affirmations while
// staying strictly conservative about everything else.
//
// The safety property, stated once: a message resolves ONLY when the whole of
// it is affirmation. Any token carrying content, any hint of the opposite
// polarity, and anything longer than a short phrase falls through to the model.
// The tests that matter here are the refusals.

/** Tokens that mean yes on their own. */
const AFFIRM_STRONG = new Set([
  "yes", "yeah", "yep", "yup", "aye",
  "sure", "ok", "okay", "okey",
  "confirm", "confirmed", "confirming",
  "approve", "approved",
  "ahead", "proceed", "ship", "lgtm",
  "good", "great", "perfect",
]);

/**
 * Tokens that carry no polarity of their own. They may pad an affirmation
 * ("yes please", "go ahead", "sounds good") but can never constitute one — a
 * message of nothing but these falls through. That is why "go" and "it" live
 * here rather than above: a bare "go" or "it" is not a confirmation anyone
 * should be executing an irreversible write on.
 */
const NEUTRAL = new Set([
  "go", "do", "it", "that", "this", "then", "and", "just", "please",
  "sounds", "looks", "seems", "all", "thanks", "thank", "you", "lets",
  // "never mind" is one phrase in two tokens: "never" carries the polarity,
  // "mind" is only the rest of it.
  "mind",
]);

/**
 * Tokens that mean no on their own.
 *
 * NOT "wait" or "hold". Those mean PAUSE, and cancelling on them is the
 * ungraceful reading: someone who types "wait" wants a moment, and destroying
 * their staged proposal makes them ask for the whole thing again. They fall
 * through to the model, which can hold the card and answer. Same for anything
 * else that is hesitation rather than refusal — when the two readings differ,
 * the model gets it, because only the model can ask.
 */
const NEGATE_STRONG = new Set([
  "no", "nope", "nah", "cancel", "cancelled", "stop", "abort",
  "nevermind", "never", "dont", "scrap", "drop",
]);

/**
 * At most this many tokens. A confirmation is short; anything longer is a
 * sentence, and a sentence usually carries an instruction with it — the
 * amendment case ("go ahead but tag it Universal") must never resolve, because
 * resolution executes the staged input verbatim and the amendment would be
 * silently dropped.
 */
const MAX_TOKENS = 4;

export type Resolution = "confirm" | "cancel";

/** Lowercase, strip punctuation, collapse whitespace, split. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/'/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * A resolution when the entire message is one, otherwise null.
 *
 * Returning null is not a failure — it means "let the model read this", which
 * is the correct handling for everything that is not unambiguously a bare yes
 * or no.
 */
export function bareResolution(text: string): Resolution | null {
  const tokens = tokenize(text);
  if (tokens.length === 0 || tokens.length > MAX_TOKENS) return null;

  let affirm = 0;
  let negate = 0;

  for (const token of tokens) {
    const isAffirm = AFFIRM_STRONG.has(token);
    const isNegate = NEGATE_STRONG.has(token);
    if (isAffirm) affirm++;
    else if (isNegate) negate++;
    else if (!NEUTRAL.has(token)) return null; // carries content — not a bare resolution
  }

  // Mixed polarity is ambiguous by construction: "no, go ahead", "ok cancel".
  // Never guess which half was meant on an irreversible action.
  if (affirm > 0 && negate > 0) return null;
  if (affirm > 0) return "confirm";
  if (negate > 0) return "cancel";
  return null; // neutral tokens only — "just that", "please"
}

/**
 * There is deliberately NO consequence tier here.
 *
 * `email_send` and `notion_archive` briefly required a reaction, on the
 * reasoning that a typed word was too light for an action that cannot be
 * recalled. That was wrong, and worth recording why: the gate is the gate.
 * A staged proposal has already been reviewed, and the person answering it is
 * the person who asked for it. Refusing their "go ahead" and demanding the
 * same decision in a different medium adds friction without adding a check —
 * it does not ask anyone to think harder, it just makes them click elsewhere.
 *
 * If some action ever genuinely needs a second pair of eyes, the answer is a
 * second REVIEWER, not a second gesture from the same one.
 */

/**
 * Whether the deterministic fast path may run at all this turn.
 *
 * Suppressed when the bot's previous message asked more than one question.
 * "go ahead" against two open questions resolves the staged proposal and
 * answers neither — and a staged proposal has every required parameter
 * filled, with the model's guesses. Executing it verbatim silently adopts
 * them. Let the model read the reply instead; it can see what it asked.
 *
 * KNOWN GAP, stated rather than papered over: this counts question marks, so
 * a compound question punctuated once — *"shall I tag it Universal, and
 * assign it to Max?"* — reads as a single question and the fast path stays
 * open. Catching that needs to parse interrogative clauses, and a fuzzy
 * safety heuristic is worse than a sharp one with a documented edge: the
 * common two-question shape really is "X? Y?". The model still handles
 * anything that carries content, which is most compound asks.
 */
export function fastPathAllowed(previousBotMessage: string | undefined): boolean {
  if (!previousBotMessage) return true;
  const questions = (previousBotMessage.match(/\?/g) ?? []).length;
  return questions <= 1;
}

/**
 * A typed emoji is the same intent as the reaction, and takes the same path.
 * A person should not have to know which one they are performing.
 */
const AFFIRM_EMOJI = ["👍", "👌", "✅", "✔️", "🆗"];
const CANCEL_EMOJI = ["❌", "🚫", "✋"];

export function emojiResolution(text: string): Resolution | null {
  const bare = text.trim();
  if (!bare) return null;
  // Emoji-only: the whole message is one of these, possibly repeated.
  for (const emoji of AFFIRM_EMOJI) {
    if (bare === emoji || bare === emoji.repeat(2) || bare === emoji.repeat(3)) {
      return "confirm";
    }
  }
  for (const emoji of CANCEL_EMOJI) {
    if (bare === emoji || bare === emoji.repeat(2) || bare === emoji.repeat(3)) {
      return "cancel";
    }
  }
  return null;
}

/** Either path — words or a typed emoji. */
export function typedResolution(text: string): Resolution | null {
  return bareResolution(text) ?? emojiResolution(text);
}
