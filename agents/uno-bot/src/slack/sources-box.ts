// The Sources box: the links an answer read, folded into a closed `container`
// titled "Sources (n)" beneath it.
//
// The turn hands over every link its lookups read (`turn/presentation.ts`);
// this keeps the ones a thread may see (`card-sources.ts`) and, when there are
// at least three, spells them as Slack's. Fewer go without a box: one or two
// links sit on the names in the prose.
//
// A container takes no `markdown` child, so the links are one `rich_text`
// bullet list. Its title is the count alone, never a freshness note: when the
// data was read is the footer's and the ⚠️ line's to say.
//
// THE LINE is the same links as one line of Markdown, for the text copy and
// for the plain rung a refused box steps down to, so the reader keeps them.
//
// Pure: no Env, no client. The rules the block is held to in the suite are in
// `tests/helpers/slack-block-rules.ts`.

import type { TaskCardSource } from "../agent/task-card-readout";
import { threadVisibleSources, type CardSource } from "./card-sources";

/** Below this many links an answer carries no box. */
export const MIN_SOURCES = 3;

/** The most links one box lists — a reading list past this is noise. */
export const MAX_BOX_SOURCES = 10;

/** A Sources box and the same links as a line of Markdown. */
export interface SourcesBox {
  block: Record<string, unknown>;
  line: string;
}

/** A link's name as Markdown link text: one line, no brackets to break it. */
const label = (text: string): string => text.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();

/**
 * The box for an answer's links, or null when fewer than three are ones the
 * thread may see.
 *
 * @param sources - Every link the turn's lookups read, in the order read
 */
export function sourcesBox(sources: readonly TaskCardSource[] | undefined): SourcesBox | null {
  const shown: CardSource[] = threadVisibleSources(sources ?? []).slice(0, MAX_BOX_SOURCES);
  if (shown.length < MIN_SOURCES) return null;
  return {
    block: {
      type: "container",
      title: { type: "plain_text", text: `Sources (${shown.length})` },
      is_collapsible: true,
      default_collapsed: true,
      child_blocks: [
        {
          type: "rich_text",
          elements: [
            {
              type: "rich_text_list",
              style: "bullet",
              elements: shown.map(({ text, url }) => ({
                type: "rich_text_section",
                elements: [{ type: "link", url, text: label(text) || url }],
              })),
            },
          ],
        },
      ],
    },
    line: `Sources: ${shown.map(({ text, url }) => `[${label(text) || url}](${url})`).join(" · ")}`,
  };
}
