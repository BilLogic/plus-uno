// A card table, as Slack's `data_table` block.
//
// The turn hands over the table as DATA (`turn/card-table.ts`) and this is
// where it becomes Slack's: the header row, a linked title, the number cells,
// the caption's words. Verified live in Bill's DM on 2026-10-07 — a
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

import type { CardTable, CardTableRow } from "../turn/card-table";

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
 * What the table holds, in a line: the count and the filter —
 * "13 cards · Design Status WIP" — and, when the lookup listed only the first
 * of its matches, "first 30 of 41 · Design Status WIP". A partial read with no
 * larger count to give says so plainly, so a cut list never reads as the whole
 * board.
 */
export function cardTableCaption(table: CardTable): string {
  const n = table.rows.length;
  const count = !table.partial
    ? `${n} card${n === 1 ? "" : "s"}`
    : table.total > n
      ? `first ${n} of ${table.total}`
      : `at least ${n} cards`;
  const filters = [
    table.filter.designStatus ? `Design Status ${table.filter.designStatus}` : null,
    table.filter.person ? `with ${table.filter.person}` : null,
    table.filter.title ? `title contains "${table.filter.title}"` : null,
  ];
  return [count, ...filters].filter(Boolean).join(" · ");
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
