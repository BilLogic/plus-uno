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
// uno-bot writes into Figma opens `🐐: ` with its first line beside it, and a
// comment that does is never read as an ask, whatever it quotes. Comments
// posted earlier carry `🐐` on a line of its own, or `🐐 le goat`, and still
// count. Figma keeps a comment's emoji as shortcodes, so the label it hands
// back is `:goat::` (`asPosted` turns it back); every matcher of uno-bot's own
// comments reads through that.
//
// PURE.

/** The emoji the label is, and the whole of the label comments carried before it took the colon. */
const GOAT = "🐐";

/** What everything uno-bot writes into Figma opens with, its first line beside it (docs/connectors/slack/shapes.md § Figma messages, rule 7). */
export const FIGMA_LABEL = `${GOAT}:`;

/** The label replies carried before it was the emoji alone, still on comments already posted. */
const OLD_LABEL_HEAD = `${GOAT} le goat`;

/**
 * A comment as uno-bot writes it into Figma: the label, then the first line
 * beside it, and the rest each on its own line.
 *
 * @param lines - What the comment says, at least one line
 */
export function labeled(lines: readonly string[]): string {
  const [first = "", ...rest] = lines;
  return [`${FIGMA_LABEL} ${first}`, ...rest].join("\n");
}

/**
 * One trigger. Not after a word character, `.` or `@` (an address, `@@`); not
 * before one, a `-` or a `.` that carries on into a word (a longer handle, a
 * domain).
 */
const TRIGGER = /(?<![\w.@])@(?:uno(?:-?bot| bot)?|(?:le[- ]?|the )?goat)(?![\w-]|\.\w)/i;
const TRIGGERS = new RegExp(TRIGGER.source, "gi");

/** The label as Figma reads a comment back: the emoji's shortcode (seen live, 2026-10-12). */
const LABEL_READ_BACK = ":goat:";

/**
 * The reaction on an ask uno-bot picked up, as Figma's reactions call takes
 * it: the shortcode. The emoji character is refused with a 400, and the
 * reaction reads back as `:goat:` (probed live, 2026-10-14).
 */
export const GOAT_REACTION = LABEL_READ_BACK;

/**
 * A comment as uno-bot posted it: the label Figma hands back as its shortcode
 * becomes the emoji again. Anything after the label is left as Figma has it.
 *
 * @param message - A comment's message, as a Figma read returns it
 */
export function asPosted(message: string): string {
  const text = message.trimStart();
  return text.startsWith(LABEL_READ_BACK) ? GOAT + text.slice(LABEL_READ_BACK.length) : text;
}

/** Whether a comment is one uno-bot wrote: it opens with the label, or with one it has had (`🐐` alone on the first line, `🐐 le goat`) — either as posted or as Figma reads it back. */
export function isOwnComment(message: string): boolean {
  const text = asPosted(message);
  return text.startsWith(`${FIGMA_LABEL} `) || text.split("\n", 1)[0]!.trim() === GOAT || text.startsWith(OLD_LABEL_HEAD);
}

/**
 * What one of uno-bot's comments says under its label, in either form it has
 * posted (`🐐: ` beside the first line, or `🐐` on a line of its own); any
 * other comment comes back as Figma has it.
 *
 * @param message - A comment's message, as a Figma read returns it
 */
export function withoutLabel(message: string): string {
  const text = asPosted(message);
  if (text.startsWith(`${FIGMA_LABEL} `)) return text.slice(FIGMA_LABEL.length + 1);
  return text.split("\n", 1)[0]!.trim() === GOAT ? text.slice(text.indexOf("\n") + 1) : text;
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
