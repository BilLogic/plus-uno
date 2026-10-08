// A result table, as Slack's `data_table` block.
//
// The turn hands over the table as DATA (`turn/result-table.ts`) and this is
// where it becomes Slack's: the header row, a linked first column, the number
// cells. Verified live in Bill's DM on 2026-10-07 — a `data_table` posts
// between the answer's `markdown` block and the footer's `context` block, in
// one chat.postMessage.
//
// Three things learned from the live API. A `raw_number` cell is refused
// without `text` beside its `value`, though the schema calls `text` optional.
// A header cell takes no `rich_text`, so the header is plain `raw_text`
// throughout and only the data rows carry links. And a `data_table` takes no
// `column_settings` — the `table` block's alignment field was refused on
// 2026-10-08 ("invalid additional property") — so a number column is one of
// `raw_number` cells throughout, which Slack sorts as numbers, and its
// alignment is Slack's to draw.
//
// Pure: no Env, no client. The rules the block is held to in the suite are in
// `tests/helpers/slack-block-rules.ts`.

import type { ResultCell, ResultRow, ResultTable } from "../turn/result-table";

/** Shown in a cell the row has no value for — Slack refuses an empty one. */
const NO_VALUE = "—";

const raw = (text: string | null) => ({ type: "raw_text", text: text || NO_VALUE });

function linkCell(url: string, title: string) {
  return {
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "link", url, text: title }] }],
  };
}

/** Where a cell links: the row's own list when it has one, else its address
 *  on the first column. */
function linkOf(row: ResultRow, column: number): string | undefined {
  return row.links ? row.links[column] : column === 0 ? row.url : undefined;
}

function cellOf(value: ResultCell, numeric: boolean) {
  if (value === null) return raw(null);
  if (numeric && typeof value === "number") return { type: "raw_number", value, text: String(value) };
  return raw(String(value));
}

/**
 * The `data_table` block for a result table: every row on one page, so a list
 * of up to 30 never pages five at a time. The first column links to the row's
 * address when it has one and a value to link — or each column to its own,
 * for a row that lists them (`ResultRow.links`).
 */
export function resultTableBlock(table: ResultTable): Record<string, unknown> {
  return {
    type: "data_table",
    caption: table.caption,
    page_size: table.rows.length,
    rows: [
      table.columns.map((c) => raw(c.label)),
      ...table.rows.map((row) =>
        row.cells.map((value, i) => {
          const url = linkOf(row, i);
          return url && typeof value === "string" && value ? linkCell(url, value) : cellOf(value, table.columns[i]!.numeric);
        }),
      ),
    ],
  };
}
