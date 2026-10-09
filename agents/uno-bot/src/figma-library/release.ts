// The library publish report's table of changed components — the block under
// its decision card on the #plus-universal post.
//
// A result table (CONTEXT.md § result table) of every changed component: its
// name linked to its Figma node, what happened to it, and the code it maps
// to, built from the drafted intake, so every name and link is one the poll
// found. The report keeps it on its record (`DecisionReportRecord.after`), so
// a decision redraws the card above it and the table stays.
//
// Pure: no Env, no client.

import type { ResultTable } from "../turn/result-table";
import { resultTableBlock } from "../slack/result-table-block";
import { NO_CODE_YET, countLine, type PublishIntake } from "./draft";

/** The most rows a data table holds, and the most cell characters. */
const TABLE_ROWS = 200;
const TABLE_CHARS = 20_000;

/** Rows shown per page: the size every other table of ours pages at. */
const PAGE_ROWS = 30;

/**
 * Every changed component as a result table, or null when there is none or
 * the list is longer than one table holds.
 *
 * @param intake - The drafted intake, whose rows the card counts
 */
export function changedComponentsTable(intake: PublishIntake): ResultTable | null {
  if (!intake.rows.length || intake.rows.length > TABLE_ROWS) return null;
  const table: ResultTable = {
    lookup: "figma_library",
    columns: [
      { label: "Component", numeric: false },
      { label: "Change", numeric: false },
      { label: "Code", numeric: false },
    ],
    rows: intake.rows.map((r) => {
      const code = r.code?.name ?? NO_CODE_YET;
      return {
        cells: [r.figmaName, r.change, code],
        url: r.figmaUrl,
        line: `${r.figmaName} · ${r.change} · ${code}`,
        names: [],
        mentions: [],
      };
    }),
    caption: countLine(intake.rows),
    total: intake.rows.length,
    partial: false,
    labels: [],
  };
  const chars = table.rows.reduce((n, row) => n + (row.url?.length ?? 0) + row.cells.join("").length, 0);
  return chars <= TABLE_CHARS ? table : null;
}

/**
 * The table block under the card, or null when there is no table to show.
 *
 * @param intake - The drafted intake
 */
export function componentTableBlock(intake: PublishIntake): Record<string, unknown> | null {
  const table = changedComponentsTable(intake);
  return table ? { ...resultTableBlock(table), page_size: Math.min(table.rows.length, PAGE_ROWS) } : null;
}
