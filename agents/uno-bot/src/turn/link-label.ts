// A name as Markdown link text, for every plain list of links an answer
// carries: the cards' list (`turn/answer-cards.ts`) and the Sources line
// (`slack/sources-box.ts`). A `[` or `]` in a title would end the link early.

/** A name as Markdown link text: one line, no brackets to break the link. */
export function linkLabel(text: string): string {
  return text.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
}
