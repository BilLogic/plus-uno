// The Sources box: the links an answer used, folded into a closed `container`
// titled "Sources (n)" beneath it.
//
// The turn hands over every link its lookups read (`turn/presentation.ts`).
// What the answer USED is fewer: the board or page each lookup queried, once,
// and the rows the prose names — by link or by name. A lookup's other rows are
// what it read on the way, and listing them is how a Roadmap status answer
// came to cite ten cards it never mentioned (r515). Of those, this keeps the
// ones a thread may see (`card-sources.ts`) and spells them as Slack's.
//
// One or two links the prose already carries go without a box: they sit on
// the names in the prose. A queried board the prose never links gets one
// even alone, since nothing else says where the answer came from.
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
import { linkLabel } from "../turn/link-label";

/** Below this many links an answer carries no box — unless one of them is
 *  not already a link in the prose. */
export const MIN_SOURCES = 3;

/** The most links one box lists — a reading list past this is noise. */
export const MAX_BOX_SOURCES = 10;

/** A Sources box and the same links as a line of Markdown. */
export interface SourcesBox {
  block: Record<string, unknown>;
  line: string;
}

/**
 * A closed `container` under a plain title, opened with a click — the Sources
 * box's, and the sweep card's for its page and thread words.
 *
 * @param title - Its title, plain text
 * @param children - 1 to 10 blocks; no `markdown`, chart or alert among them
 */
export function foldedBox(title: string, children: unknown[]): Record<string, unknown> {
  return {
    type: "container",
    title: { type: "plain_text", text: title },
    is_collapsible: true,
    default_collapsed: true,
    child_blocks: children,
  };
}

const escaped = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Does the prose name this row: its link, or its name as a whole phrase in
 *  any case? A name of one or two characters says too little to count. */
function named(source: TaskCardSource, prose: string): boolean {
  if (prose.includes(source.url)) return true;
  const name = linkLabel(source.text);
  if (name.length < 3 || name === source.url) return false;
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped(name)}(?![\\p{L}\\p{N}])`, "iu").test(prose);
}

/**
 * The box for the links an answer used, or null when it used none the thread
 * may see, or only one or two the prose already links.
 *
 * @param sources - Every link the turn's lookups read, in the order read
 * @param prose - The answer as the model wrote it
 */
export function sourcesBox(sources: readonly TaskCardSource[] | undefined, prose: string): SourcesBox | null {
  const used = (sources ?? []).filter((s) => s.queried || named(s, prose));
  const shown: CardSource[] = threadVisibleSources(used).slice(0, MAX_BOX_SOURCES);
  if (!shown.length) return null;
  if (shown.length < MIN_SOURCES && shown.every(({ url }) => prose.includes(url))) return null;
  return {
    block: foldedBox(`Sources (${shown.length})`, [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_list",
            style: "bullet",
            elements: shown.map(({ text, url }) => ({
              type: "rich_text_section",
              elements: [{ type: "link", url, text: linkLabel(text) || url }],
            })),
          },
        ],
      },
    ]),
    line: `Sources: ${shown.map(({ text, url }) => `[${linkLabel(text) || url}](${url})`).join(" · ")}`,
  };
}
