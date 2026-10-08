// A card table, as Slack's `data_table` block.
//
// The turn hands over the table as DATA (`turn/card-table.ts`) and this is
// where it becomes Slack's: the header row, a linked title, the number cells.
// The caption's words are the turn's, since the model is told them too.
// Verified live in Bill's DM on 2026-10-07 — a
// `data_table` posts between the answer's `markdown` block and the footer's
// `context` block, in one chat.postMessage.
//
// One thing Slack's reference gets wrong, learned from the live API: a
// `raw_number` cell is refused without `text` beside its `value`, though the
// schema calls `text` optional. And one it does say: a header cell takes no
// `rich_text`, so the header is plain `raw_text` throughout and only the data
// rows carry links.
//
// Pure: no Env, no client. The rules the block is held to in the suite are in
// `tests/helpers/slack-block-rules.ts`.

import { cardFacts, cardTableCaption, type CardTable, type CardTableRow } from "../turn/card-table";

export { cardTableCaption };

/** Shown in a cell the card has no value for — Slack refuses an empty one. */
const NO_VALUE = "—";

const raw = (text: string | null) => ({ type: "raw_text", text: text || NO_VALUE });

const HEADER = [raw("Card"), raw("#"), raw("Design Status"), raw("Dev Status")];

function titleCell(row: CardTableRow) {
  return {
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "link", url: row.url, text: row.title }] }],
  };
}

function numberCell(n: number | null) {
  return n === null ? raw(null) : { type: "raw_number", value: n, text: String(n) };
}

/**
 * The `data_table` block for a card table: every row on one page, so a list
 * the lookup capped at 30 never pages five at a time.
 */
export function cardTableBlock(table: CardTable): Record<string, unknown> {
  return {
    type: "data_table",
    caption: cardTableCaption(table),
    page_size: table.rows.length,
    rows: [
      HEADER,
      ...table.rows.map((row) => [titleCell(row), numberCell(row.cardNumber), raw(row.designStatus), raw(row.devStatus)]),
    ],
  };
}

/** A title as Markdown link text that reads as written: the characters that
 *  would style, link or list it are escaped, and so is a leading `1. `. */
function escapeTitle(title: string): string {
  return title.replace(/[\\`*_~[\]<>]/g, "\\$&").replace(/^(\d+)([.)]) /, "$1\\$2 ");
}

/**
 * The cards as a Markdown bullet list, each title linked to its card — what
 * the answer's Markdown carries when Slack refuses the table, so the reader
 * keeps the list and its links. Its lines match the plain list's.
 *
 * @param table - The table it stands in for
 */
export function markdownCardList(table: CardTable): string {
  return table.rows
    .map((row) => {
      const url = row.url.replace(/\(/g, "%28").replace(/\)/g, "%29");
      return `- ${[`[${escapeTitle(row.title)}](${url})`, ...cardFacts(row, table)].join(" — ")}`;
    })
    .join("\n");
}
