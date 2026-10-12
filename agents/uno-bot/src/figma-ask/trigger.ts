// Whether a Figma comment asks uno-bot something, and whether uno-bot wrote it
// (#903).
//
// THE TRIGGERS, from #891 § F: @uno, @unobot, @uno-bot, @uno bot, @goat,
// @le goat, @le-goat, @legoat and @the goat, in any case. The `@` is required:
// a comment saying "the goat answered" is about uno-bot, not to it. A handle
// that only starts like one (`@unofficial`, `@goats`) is someone else, and an
// address (`pm@uno.example`) is not a mention.
//
// THE LOOP GUARD. uno-bot posts as Bill — his token is the only one — so a
// reply's author says nothing about who wrote it. Its label does: everything
// uno-bot writes into Figma leads with `FIGMA_LABEL` on a line of its own, and a
// comment that does is never read as an ask, whatever it quotes.
//
// PURE.

/** What everything uno-bot writes into Figma leads with, on a line of its own (docs/connectors/slack.md § Figma messages, rule 7). */
export const FIGMA_LABEL = "🐐";

/** The label replies carried before it was the emoji alone, still on comments already posted. */
const OLD_LABEL_HEAD = "🐐 le goat";

/**
 * One trigger. Not after a word character, `.` or `@` (an address, `@@`); not
 * before one, a `-` or a `.` that carries on into a word (a longer handle, a
 * domain).
 */
const TRIGGER = /(?<![\w.@])@(?:uno(?:-?bot| bot)?|(?:le[- ]?|the )?goat)(?![\w-]|\.\w)/i;
const TRIGGERS = new RegExp(TRIGGER.source, "gi");

/** Whether a comment is one uno-bot wrote: its first line is the label, or it opens with the old one. */
export function isOwnComment(message: string): boolean {
  const text = message.trimStart();
  return text.split("\n", 1)[0]!.trim() === FIGMA_LABEL || text.startsWith(OLD_LABEL_HEAD);
}

/** Whether a comment asks uno-bot something: a trigger, in a comment uno-bot did not write. */
export function asksUno(message: string): boolean {
  return !isOwnComment(message) && TRIGGER.test(message);
}

/** The ask with its triggers taken out, as the question the turn reads. */
export function askText(message: string): string {
  return message
    .replace(TRIGGERS, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/^[\s,:;-]+/, "")
    .trim();
}
