// The Sources box: the links an answer used, folded into a closed `container`
// titled "Sources (n)" beneath it.
//
// The turn hands over every link its lookups read (`turn/presentation.ts`).
// What the answer USED is fewer: the collection each lookup queried (the
// Roadmap board, a Notion database, the blueprint) or the page it read whole,
// once, and the rows the prose names. A lookup's other rows are what it read
// on the way, and listing them is how a Roadmap status answer came to cite
// ten cards it never mentioned (r515). Of those, this keeps the ones a thread
// may see (`card-sources.ts`) and spells them as Slack's.
//
// A ROW IS NAMED by its link, written whole; by a Roadmap card's number
// ("#412", "card 412"); or by its title, matched whole in any case, when the
// title is more than one word and no other row read carries it. One word
// ("Session"), or a title two rows share, says too little to pin a row on.
//
// A BOX at three or more used links. Below three, only a queried collection
// the prose leaves unlinked makes one, since nothing else says where the
// answer came from; that box lists the used links the prose leaves unlinked.
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

/** Below this many used links an answer carries no box — unless a queried
 *  collection among them is not already a link in the prose. */
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

/** A character that carries a name on: a letter, a digit, `_` or `-`. */
const NAME_CHAR = "[\\p{L}\\p{N}_-]";

/** What may follow a link in prose: the end, Markdown's `)`, Slack's `|` or
 *  `>`, whitespace, a closing mark, or sentence punctuation that ends there. */
const URL_END = `(?=$|[\\s)|>\\]"'*<]|[.,;:!?](?:$|[\\s)|>\\]"'*]))`;

/** Is this link written in the prose, whole? `/issues/100` is not `/issues/1009`. */
function linked(url: string, prose: string): boolean {
  return new RegExp(`${escaped(url)}${URL_END}`, "u").test(prose);
}

const titleOf = (source: TaskCardSource): string => source.text.replace(/\s+/g, " ").trim();

/** Does the prose name this row (the module's header says how)?
 *
 * @param shared - Titles, lowercased, that more than one row read carries */
function named(source: TaskCardSource, prose: string, shared: ReadonlySet<string>): boolean {
  if (linked(source.url, prose)) return true;
  if (source.number !== undefined && new RegExp(`(?:#|\\bcard\\s+)${source.number}(?!\\p{N})`, "iu").test(prose)) return true;
  const title = titleOf(source);
  if (!title.includes(" ") || title === source.url || shared.has(title.toLowerCase())) return false;
  const phrase = escaped(title).split(" ").join("\\s+");
  return new RegExp(`(?<!${NAME_CHAR})${phrase}(?!${NAME_CHAR})`, "iu").test(prose);
}

/** The titles more than one row carries, lowercased. */
function sharedTitles(sources: readonly TaskCardSource[]): Set<string> {
  const seen = new Set<string>();
  const shared = new Set<string>();
  for (const source of sources) {
    const title = titleOf(source).toLowerCase();
    if (seen.has(title)) shared.add(title);
    seen.add(title);
  }
  return shared;
}

/**
 * The box for the links an answer used, or null when it used none the thread
 * may see, or fewer than three with no unlinked queried collection among them.
 *
 * @param sources - Every link the turn's lookups read, in the order read
 * @param prose - The answer as the model wrote it
 */
export function sourcesBox(sources: readonly TaskCardSource[] | undefined, prose: string): SourcesBox | null {
  const read = sources ?? [];
  const shared = sharedTitles(read);
  const used = read.filter((s) => s.queried || named(s, prose, shared));
  const visible = new Set(threadVisibleSources(used).map(({ url }) => url));
  let kept = used.filter(({ url }) => visible.has(url));
  if (kept.length < MIN_SOURCES) {
    if (!kept.some((s) => s.queried && !linked(s.url, prose))) return null;
    kept = kept.filter(({ url }) => !linked(url, prose));
  }
  const shown: CardSource[] = kept.slice(0, MAX_BOX_SOURCES).map(({ text, url }) => ({ text, url }));
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
