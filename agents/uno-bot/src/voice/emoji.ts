// The emoji budget, as code can count it.
//
// The budget itself is prose and lives in one place, `AGENT.md` § Emoji
// budget. This module is the part of it a machine can check: which characters
// in a text are emoji, and whether a reply keeps to the reply rule. The draft
// judge reads it, and so may any test that holds copy to the budget.
//
// What counts: any grapheme carrying an Extended_Pictographic code point (so a
// ZWJ family, a flag-free keycap or a skin tone is ONE emoji), and a Slack
// shortcode such as `:rocket:`, which Slack renders as the glyph. A shortcode
// starts with a letter, so a clock time like `10:30:00` is not one.

const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const SHORTCODE = /:[a-z][a-z0-9_+-]*:/g;

/** The one emoji a reply may carry, and only to open its first line. */
export const SHIP_EMOJI = "🎉";

/** Every emoji in `text`, in order — glyphs and shortcodes alike. */
export function emojiIn(text: string): string[] {
  const found: Array<{ at: number; emoji: string }> = [];
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  for (const { segment, index } of segmenter.segment(text)) {
    if (PICTOGRAPHIC.test(segment)) found.push({ at: index, emoji: segment });
  }
  for (const m of text.matchAll(SHORTCODE)) found.push({ at: m.index ?? 0, emoji: m[0] });
  return found.sort((a, b) => a.at - b.at).map((f) => f.emoji);
}

/**
 * Why a reply breaks the budget by count or by place, or null when it does not.
 *
 * Code decides only what code can see: more than one emoji, or one that is not
 * a 🎉 opening the first line. Whether a lone opening 🎉 sits on a shipped,
 * merged or published outcome is a reading of the content, and stays with the
 * judge.
 */
export function replyEmojiBreach(text: string): string | null {
  const found = emojiIn(text);
  if (found.length === 0) return null;
  if (found.length > 1) return `carries ${found.length} emoji (${found.join(" ")})`;
  const opensWithShip = text.trimStart().startsWith(SHIP_EMOJI) || /^\s*:tada:/.test(text);
  return opensWithShip ? null : `carries ${found[0]} where only a 🎉 opening the first line may sit`;
}
