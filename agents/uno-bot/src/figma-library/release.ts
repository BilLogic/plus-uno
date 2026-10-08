// The library publish card's release card and its table of changed
// components — the blocks above the decision on the #plus-universal post.
//
// The release card says who published which version, with the version's own
// description and a button to it, under Figma's logo. The table beneath is a
// result table (CONTEXT.md § result table) of every changed component: its
// name linked to its Figma node, what happened to it, and the code it maps
// to. Both are built from the change set and its drafted intake, so every
// name and link is one the poll found.
//
// The card's text copy (`draft.ts` `publishCard`) is unchanged and stays the
// answer of record: notifications read it, a decided card is re-rendered
// from it, and it is the whole post when Slack refuses these blocks.
//
// Pure: no Env, no client.

import type { ResultTable } from "../turn/result-table";
import { resultTableBlock } from "../slack/result-table-block";
import { LOGOS } from "../slack/answer-cards-block";
import { NO_CODE_YET, countLine, firstLine, versionUrl, type LibraryChangeSet, type PublishIntake } from "./draft";

/** A card's title and subtitle hold 150 characters, its body 200. */
const TITLE_CHARS = 150;
const BODY_CHARS = 200;

/** The most rows a data table holds, and the most cell characters. */
const TABLE_ROWS = 200;
const TABLE_CHARS = 20_000;

/** Rows shown per page: the size every other table of ours pages at. */
const PAGE_ROWS = 30;

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const plain = (text: string) => ({ type: "plain_text", text });

/**
 * The release card, or null for a change set with no published version.
 *
 * @param changeSet - What the poll found
 */
export function releaseCardBlock(changeSet: LibraryChangeSet): Record<string, unknown> | null {
  const newest = changeSet.versions[0];
  if (!newest) return null;
  const label = newest.label || firstLine(newest.description) || "untitled";
  const description = newest.description.trim();
  return {
    type: "card",
    icon: { type: "image", image_url: LOGOS.figma.url, alt_text: LOGOS.figma.name },
    title: plain(cut(`Library published: "${label}"`, TITLE_CHARS)),
    subtitle: plain(cut(`by ${newest.user}`, TITLE_CHARS)),
    ...(description ? { body: plain(cut(description, BODY_CHARS)) } : {}),
    actions: [{ type: "button", text: plain("View version"), url: versionUrl(changeSet.fileKey, newest.id) }],
  };
}

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
 * The blocks above the decision: the release card, then the table. Empty when
 * there is neither.
 *
 * @param changeSet - What the poll found
 * @param intake - Its drafted intake
 */
export function releaseBlocks(changeSet: LibraryChangeSet, intake: PublishIntake): Array<Record<string, unknown>> {
  const card = releaseCardBlock(changeSet);
  const table = changedComponentsTable(intake);
  return [
    ...(card ? [card] : []),
    ...(table ? [{ ...resultTableBlock(table), page_size: Math.min(table.rows.length, PAGE_ROWS) }] : []),
  ];
}
