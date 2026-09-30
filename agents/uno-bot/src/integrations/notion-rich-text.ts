// What an in-place text replace can faithfully rewrite in a Notion block.
//
// A replace writes the block's `rich_text` from plain text (markdown), so it
// keeps the block's type and per-type state (a to-do's tick, a heading's
// level) but not what the old rich text carried beyond its words: a link, a
// mention, an equation, bold, code, a colour. A block that has any of those is
// refused rather than flattened (`notion.ts` `replaceBlock`), and the sweep
// offers only blocks a replace can write (`sweep/detector.ts`).
//
// PURE: no `Env`, no fetch.

/** Block types whose payload is their `rich_text` plus per-type state. */
export const RICH_TEXT_TYPES: ReadonlySet<string> = new Set([
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
  "quote",
  "callout",
  "toggle",
]);

/** One rich text run, as Notion returns it — only the fields read here. */
export interface RichTextRun {
  type?: string;
  href?: string | null;
  text?: { link?: { url?: string } | null };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

/**
 * Whether a block's rich text is words only — no link, mention or equation,
 * and no annotation off its default — so a plain text replace loses nothing.
 *
 * @param runs - The block's `rich_text`
 */
export function isPlainRichText(runs: readonly RichTextRun[] | undefined): boolean {
  return (runs ?? []).every((run) => {
    if (run.type && run.type !== "text") return false;
    if (run.href || run.text?.link) return false;
    const a = run.annotations;
    if (!a) return true;
    return !a.bold && !a.italic && !a.strikethrough && !a.underline && !a.code && (!a.color || a.color === "default");
  });
}
