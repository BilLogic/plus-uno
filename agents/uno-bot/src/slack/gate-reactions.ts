// Which emoji resolve a staged proposal — as a reaction on the card, or typed
// alone as a message.
//
// Split out of gate.ts so it can be tested: gate.ts reaches for Env, the DO
// client and the Slack API, none of which exist under `npm test`. This module
// is pure on purpose — the question "does 👍 authorize an irreversible write"
// deserves an assertion, not a code review.
//
// THIS IS THE WHOLE DETERMINISTIC VOCABULARY. Until 2026-08-22 there were
// four more lists beside it — confirm/cancel phrases for routing, an
// all-tokens-affirmative matcher for a no-model fast path, a question-mark
// counter to suppress that path, and a closed set of pleasantries for a
// no-model react tier. "ok" was in three of them. Every incident in this area
// came from the lists disagreeing with each other or with the person typing,
// never from the model. They are gone: a TYPED message goes to the model,
// full stop (user decision, 2026-08-22). What stays is the one thing that is
// not language — an emoji has exactly one meaning on a card, whether it is
// reacted or typed.

export type Decision = "confirm" | "cancel";

/**
 * ✅ confirms. The card says so, and the button says so.
 *
 * ✔️ and 👍 are accepted too, because people reach for whichever is closer.
 * 👍 was removed on 2026-08-21 and restored the same day: it was never the
 * gesture that was wrong, it was the gesture MEANING TWO THINGS — the answer
 * footer put a 👍 button under every reply. The footer buttons are gone and a
 * reaction only resolves the card it is placed ON, so 👍 has one meaning
 * again. The rule this leaves behind: a confirmation gesture must have
 * exactly one meaning in the product. If 👍 is ever given a second job, it
 * comes out of this set the same day.
 */
export const CONFIRM_REACTIONS: ReadonlySet<string> = new Set([
  "white_check_mark",
  "heavy_check_mark",
  "+1",
  "thumbsup",
]);

/**
 * ⛔ cancels. The card says so, and the button says so (user decision,
 * 2026-08-22: "the circular red one with a horizontal bar" — `no_entry`).
 *
 * ❌, ❎ and 🚫 are accepted too, for the same reach-for-the-nearest reason.
 * 👎 is NOT here and must never be: it was 👍's twin in the retired feedback
 * footer, and "that was unhelpful" is not "do not do this".
 */
export const CANCEL_REACTIONS: ReadonlySet<string> = new Set([
  "no_entry",
  "x",
  "negative_squared_cross_mark",
  "no_entry_sign",
]);

/** The decision an emoji NAME carries (reaction events send names), or null. */
export function mapReaction(name: string): Decision | null {
  if (CONFIRM_REACTIONS.has(name)) return "confirm";
  if (CANCEL_REACTIONS.has(name)) return "cancel";
  return null;
}

/** Every name the gate reads as a decision — what the bot's own `slack_react`
 *  must refuse, so it can never resolve its own card. */
export const GATE_RESERVED: ReadonlySet<string> = new Set([
  ...CONFIRM_REACTIONS,
  ...CANCEL_REACTIONS,
]);

// The same emoji, typed. Slack sends a typed emoji either as the Unicode glyph
// or as its `:name:` shortcode depending on the client, so both are listed.
const TYPED_CONFIRM = ["✅", "✔", "👍", ":white_check_mark:", ":heavy_check_mark:", ":+1:", ":thumbsup:"];
const TYPED_CANCEL = ["⛔", "❌", "❎", "🚫", ":no_entry:", ":x:", ":negative_squared_cross_mark:", ":no_entry_sign:"];

/**
 * The decision a TYPED message carries when the whole message is one gate
 * emoji (optionally repeated; variation selectors and skin tones tolerated),
 * or null.
 *
 * A typed 👍 and a 👍 reaction are the same intent; a person should not have
 * to know which one they are performing. Anything with a word in it — "👍 but
 * rename it" — is language, and language goes to the model.
 */
export function typedEmojiDecision(text: string): Decision | null {
  const bare = text.replace(/[\u{FE0F}\u{1F3FB}-\u{1F3FF}]/gu, "").replace(/\s+/g, "");
  if (!bare) return null;
  const only = (glyphs: string[]) =>
    glyphs.some((g) => bare === g || bare === g.repeat(2) || bare === g.repeat(3));
  if (only(TYPED_CONFIRM)) return "confirm";
  if (only(TYPED_CANCEL)) return "cancel";
  return null;
}
