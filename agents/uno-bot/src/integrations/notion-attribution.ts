// The line that opens body content uno-bot writes into Notion: a page it
// creates, and each run of blocks it appends. A reader of the page can tell
// the words are the bot's, and knows whom to ask about them — the Notion
// counterpart of the "on behalf of" footer a GitHub intake carries
// (`tools/github-issue-render.ts`).
//
// Only body content the bot adds gets the line. A property change writes no
// body, and an in-place replace or insert edits a human's text where it
// stands, so neither carries it (`docs/connectors/notion.md` § Attribution).

/**
 * The attribution sentence, as a Notion reader sees it.
 * @param name - The requester's display name, as Slack gives it
 */
export function notionAttribution(name: string): string {
  return `Written by le goat on behalf of ${name}`;
}

/** The sentence as the block that opens the written content: a quiet grey
 *  italic paragraph, the same register as the PRD's placeholder notes. */
export function attributionBlock(name: string): Record<string, unknown> {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: { content: notionAttribution(name) },
          annotations: { italic: true, color: "gray" },
        },
      ],
    },
  };
}
