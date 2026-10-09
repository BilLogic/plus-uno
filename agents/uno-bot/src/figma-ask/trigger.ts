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
// uno-bot writes into Figma leads with `FIGMA_LABEL`, and a comment that leads
// with it is never read as an ask, whatever it quotes.
//
// PURE.

/** What everything uno-bot writes into Figma leads with (docs/connectors/slack.md § Figma messages, rule 7). */
export const FIGMA_LABEL = "🐐 le goat (uno-bot) · AI-generated";

/** The label's head: a comment opening with it is uno-bot's own. */
const LABEL_HEAD = "🐐 le goat";

/**
 * One trigger. Not after a word character, `.` or `@` (an address, `@@`); not
 * before one, a `-` or a `.` that carries on into a word (a longer handle, a
 * domain).
 */
const TRIGGER = /(?<![\w.@])@(?:uno(?:-?bot| bot)?|(?:le[- ]?|the )?goat)(?![\w-]|\.\w)/i;
const TRIGGERS = new RegExp(TRIGGER.source, "gi");

/** Whether a comment is one uno-bot wrote: it leads with the label. */
export function isOwnComment(message: string): boolean {
  return message.trimStart().startsWith(LABEL_HEAD);
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
