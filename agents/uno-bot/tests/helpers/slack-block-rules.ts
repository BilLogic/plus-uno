// What Slack refuses in a message's blocks — the one place both recording
// clients (`recording-slack.ts`) read it, so a green suite means the shapes are
// right and not merely that a fake was lenient.
//
// The rules come from Slack's block reference pages, and each one was put to
// Slack's tokenless `blocks.validate` method while it was written; the verdict
// sits beside the rule. Where the validator and the live API disagree, the live
// API wins, because it is what refuses a post. Tests never call the validator:
// these rules are the copy of its answers that a suite can run offline.

/** The block types the Worker sends: answers (`section`, `markdown`, the
 *  footer's `context`, the result table's `data_table`, a chart's
 *  `data_visualization`), the checklist (`plan`),
 *  proposal cards (`actions`, `image`) and the rest of its layouts. Slack knows
 *  many more — `carousel`, `card` — but one the Worker never sends is a typo or
 *  a new shape nobody proved, and either should fail a test before it reaches
 *  Slack. An unknown `type` was refused by blocks.validate on 2026-10-07
 *  (`invalid_blocks`, "must be a valid enum value"). */
const WORKER_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "section",
  "markdown",
  "context",
  "data_table",
  "data_visualization",
  "plan",
  "actions",
  "image",
  "divider",
  "header",
]);

/** A `data_table`'s rows, header included, and its columns, per Slack's block
 *  reference (read 2026-10-07): 1 to 200 data rows under the header, 1 to 20
 *  columns. */
const DATA_TABLE_ROWS = { min: 2, max: 201 };
const DATA_TABLE_COLUMNS = 20;

/** The fields a `data_table` takes, per the block reference. */
const DATA_TABLE_FIELDS: ReadonlySet<string> = new Set(["type", "block_id", "caption", "rows", "page_size", "row_header_column_index"]);

/** Characters across every cell of a `data_table` — and across every table in
 *  one message, which the reference caps at the same 20,000. */
const DATA_TABLE_CHARS = 20_000;

/** Blocks in one message. blocks.validate on 2026-10-07: 50 ok, 51 refused
 *  ("no more than 50 items allowed"), as blocks and as a message. */
const MAX_BLOCKS = 50;

/** A `section`'s text. blocks.validate on 2026-10-07: 3,000 ok, 3,001 refused
 *  (`max_length`, expected 3000). */
const SECTION_TEXT_CHARS = 3000;

/** Markdown across every `markdown` block in one message, per Slack's block
 *  reference. blocks.validate on 2026-10-07 took 12,000 in one block and
 *  answered `internal_error` to 12,001 and to 13,000 — a refusal either way.
 *  It took two blocks of 6,001 each, so the across-a-message half rests on the
 *  reference page alone: the validator checks blocks, not the message total. */
const MARKDOWN_MESSAGE_CHARS = 12_000;

/** A `context` block's elements. blocks.validate on 2026-10-07: none refused
 *  (`min_items` 1), eleven refused (`max_items` 10). */
const CONTEXT_ELEMENTS = { min: 1, max: 10 };

/** The task statuses Slack accepts, on a stream chunk and a `task_card` alike.
 *  blocks.validate on 2026-10-07 took `pending` on a card (its enum lists it)
 *  and refused `done`; the live stream API answered `pending` with
 *  `invalid_arguments`, and the live API is what refuses a post. */
export const SLACK_TASK_STATUSES: ReadonlySet<string> = new Set(["in_progress", "complete", "error"]);

/** The names Slack's icon object takes — the enum blocks.validate reported for
 *  `/tasks/0/icon/name` on 2026-10-07, which refused `zzz_nope` and
 *  `notebook`. The eight seen to render on a live card that day — globe, book,
 *  map, code, comment, folder, cube, image — are all here. call, email, file,
 *  link and user are not: the reported enum omits them, though the validator
 *  answered `ok` to a bare one, and Slack's live check refused them. */
export const SLACK_ICON_NAMES: ReadonlySet<string> = new Set([
  "archive", "book", "bookmark", "bot", "bug", "calendar", "caret-left", "caret-right", "check",
  "clipboard", "code", "comment", "compass", "copy", "cube", "download", "edit", "eye-closed",
  "eye-open", "flag", "folder", "gear", "globe", "heart", "help", "image", "info", "key",
  "lightbulb", "map", "mobile", "new-window", "pin", "plus", "refine", "refresh", "rocket", "save",
  "screen", "share", "sparkle", "star", "star-filled", "tag", "thumbs-down", "thumbs-up", "trash",
  "upload", "warning",
]);

type Shape = Record<string, unknown>;
const isShape = (value: unknown): value is Shape => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): boolean => typeof value === "string" && value.length > 0;

/**
 * Why Slack would refuse an icon, or null if it would take it.
 *
 * Exactly `{type: "icon", name}`. blocks.validate on 2026-10-07 refused a
 * `url` in place of `name` and beside it ("invalid additional property: url"),
 * an `image` element (missing `name`), an `emoji` type (enum `icon`) and a bare
 * string ("must provide an object").
 */
export function iconRefusal(icon: unknown): string | null {
  if (!isShape(icon)) return "an icon that is not an object";
  if (icon.type !== "icon") return `an icon of type ${String(icon.type)}`;
  const extra = Object.keys(icon).filter((key) => key !== "type" && key !== "name");
  if (extra.length) return `an icon with ${extra.join(", ")}`;
  if (typeof icon.name !== "string" || !SLACK_ICON_NAMES.has(icon.name)) return `an icon named ${String(icon.name)}`;
  return null;
}

/** Why Slack would refuse a `task_card`. task_id and title are required —
 *  blocks.validate on 2026-10-07 refused each one missing ("missing required
 *  field"). */
function taskCardRefusal(card: unknown): string | null {
  if (!isShape(card) || card.type !== "task_card") return "a plan task that is not a task_card";
  if (!nonEmpty(card.task_id)) return "a task_card without a task_id";
  if (!nonEmpty(card.title)) return "a task_card without a title";
  if (!SLACK_TASK_STATUSES.has(String(card.status))) return `a task_card as ${String(card.status)}`;
  if ("icon" in card) {
    const why = iconRefusal(card.icon);
    if (why) return `a task_card with ${why}`;
  }
  return null;
}

/** The characters a cell shows: its text, or the text of every rich-text
 *  element in it (a link with no text shows its url). */
function cellChars(cell: unknown): number {
  if (!isShape(cell)) return 0;
  if (typeof cell.text === "string") return cell.text.length;
  if (typeof cell.url === "string") return cell.url.length;
  return Array.isArray(cell.elements) ? cell.elements.reduce((n: number, e) => n + cellChars(e), 0) : 0;
}

/** The characters across a `data_table`'s cells. */
function dataTableChars(block: Shape): number {
  const rows = Array.isArray(block.rows) ? block.rows : [];
  return rows.reduce((n: number, row) => n + (Array.isArray(row) ? row.reduce((m: number, c) => m + cellChars(c), 0) : 0), 0);
}

/**
 * Why Slack would refuse a `data_table`, or null.
 *
 * From the block reference (read 2026-10-07): a caption is required; 2 to 201
 * rows, the first of them the header; header cells take no `rich_text`; every
 * row has the same number of cells; at most 20 columns; 20,000 characters
 * across the cells. And one the reference gets wrong: a `raw_number` cell
 * without `text` was refused by the live API in Bill's DM on 2026-10-07,
 * though the schema leaves `text` optional. The live API also refuses any
 * field the reference does not list: the `table` block's `column_settings`
 * was answered "invalid additional property" on 2026-10-08.
 */
function dataTableRefusal(block: Shape): string | null {
  const extra = Object.keys(block).find((k) => !DATA_TABLE_FIELDS.has(k));
  if (extra) return `a data_table with ${extra}`;
  if (!nonEmpty(block.caption)) return "a data_table without a caption";
  const rows = Array.isArray(block.rows) ? block.rows : [];
  if (rows.length < DATA_TABLE_ROWS.min || rows.length > DATA_TABLE_ROWS.max) return `a data_table of ${rows.length} rows`;
  if (!rows.every(Array.isArray)) return "a data_table row that is not a list of cells";
  const width = (rows[0] as unknown[]).length;
  if (width < 1 || width > DATA_TABLE_COLUMNS) return `a data_table of ${width} columns`;
  if ((rows as unknown[][]).some((row) => row.length !== width)) return "a data_table with rows of different lengths";
  if ((rows[0] as unknown[]).some((cell) => isShape(cell) && cell.type === "rich_text")) return "a data_table header cell in rich_text";
  for (const row of rows as unknown[][]) {
    for (const cell of row) {
      if (isShape(cell) && cell.type === "raw_number" && (typeof cell.value !== "number" || !nonEmpty(cell.text))) {
        return "a raw_number cell without its text";
      }
    }
  }
  const chars = dataTableChars(block);
  if (chars > DATA_TABLE_CHARS) return `a data_table of ${chars} chars`;
  return null;
}

/** A `data_visualization`'s limits, per Slack's block reference (read
 *  2026-10-08): a title of 50 characters; 1–12 pie segments or series; 1–20
 *  points per series; labels, series names and categories of 20 characters;
 *  axis titles of 50. Two per message, which the live API enforced in Bill's
 *  DM on 2026-10-07. */
const VIZ = { title: 50, label: 20, axis: 50, series: 12, points: 20, perMessage: 2 };

/** Why Slack would refuse a `data_visualization`, or null. */
function dataVisualizationRefusal(block: Shape): string | null {
  if (!nonEmpty(block.title) || String(block.title).length > VIZ.title) return "a data_visualization title missing or over 50 chars";
  const chart = isShape(block.chart) ? block.chart : null;
  if (!chart) return "a data_visualization without a chart";
  const labelOk = (l: unknown) => nonEmpty(l) && String(l).length <= VIZ.label;
  if (chart.type === "pie") {
    const segments = Array.isArray(chart.segments) ? chart.segments : [];
    if (segments.length < 1 || segments.length > VIZ.series) return `a pie of ${segments.length} segments`;
    for (const s of segments) {
      if (!isShape(s) || !labelOk(s.label)) return "a pie segment label missing or over 20 chars";
      if (typeof s.value !== "number" || s.value <= 0) return "a pie segment of no positive value";
    }
    return null;
  }
  if (!["bar", "line", "area"].includes(String(chart.type))) return `a ${String(chart.type)} chart`;
  const axis = isShape(chart.axis_config) ? chart.axis_config : null;
  const categories = axis && Array.isArray(axis.categories) ? axis.categories : null;
  if (!categories || categories.length === 0) return "a chart without axis categories";
  if (!categories.every(labelOk)) return "a chart category over 20 chars";
  for (const key of ["x_label", "y_label"] as const) {
    if (axis && key in axis && String(axis[key]).length > VIZ.axis) return `a chart ${key} over 50 chars`;
  }
  const series = Array.isArray(chart.series) ? chart.series : [];
  if (series.length < 1 || series.length > VIZ.series) return `a chart of ${series.length} series`;
  const names = new Set<string>();
  for (const s of series) {
    if (!isShape(s) || !labelOk(s.name)) return "a series name missing or over 20 chars";
    if (names.has(String(s.name))) return "two series of one name";
    names.add(String(s.name));
    const data = Array.isArray(s.data) ? s.data : [];
    if (data.length < 1 || data.length > VIZ.points) return `a series of ${data.length} points`;
    const labels = data.map((d) => (isShape(d) ? d.label : undefined));
    if (labels.length !== categories.length || !categories.every((c) => labels.includes(c))) {
      return "a series without exactly one point per category";
    }
    if (!data.every((d) => isShape(d) && typeof d.value === "number")) return "a data point of no number";
  }
  return null;
}

/** Why Slack would refuse one block, or null. */
function blockRefusal(block: unknown): string | null {
  if (!isShape(block)) return "a block that is not an object";
  const type = String(block.type);
  if (!WORKER_BLOCK_TYPES.has(type)) return `a ${type} block`;
  if (type === "section") {
    const text = isShape(block.text) ? block.text.text : undefined;
    if (typeof text === "string" && text.length > SECTION_TEXT_CHARS) return `a section of ${text.length} chars`;
  }
  if (type === "markdown" && typeof block.text !== "string") return "a markdown block without text";
  if (type === "context") {
    const n = Array.isArray(block.elements) ? block.elements.length : 0;
    if (n < CONTEXT_ELEMENTS.min || n > CONTEXT_ELEMENTS.max) return `a context of ${n} elements`;
  }
  if (type === "data_table") {
    const why = dataTableRefusal(block);
    if (why) return why;
  }
  if (type === "data_visualization") {
    const why = dataVisualizationRefusal(block);
    if (why) return why;
  }
  if (type === "plan") {
    // A plan's title is required: blocks.validate on 2026-10-07 refused one
    // without ("missing required field: title").
    if (!nonEmpty(block.title)) return "a plan without a title";
    for (const card of Array.isArray(block.tasks) ? block.tasks : []) {
      const why = taskCardRefusal(card);
      if (why) return why;
    }
  }
  return null;
}

/**
 * Why Slack would refuse a message's blocks, or null if it would take them.
 *
 * @param blocks - The `blocks` a post, an update or a stream's stop carries
 */
export function messageBlocksRefusal(blocks: readonly unknown[]): string | null {
  if (blocks.length > MAX_BLOCKS) return `${blocks.length} blocks in one message`;
  let markdownChars = 0;
  let tableChars = 0;
  for (const block of blocks) {
    const why = blockRefusal(block);
    if (why) return why;
    if (isShape(block) && block.type === "markdown") markdownChars += String(block.text).length;
    if (isShape(block) && block.type === "data_table") tableChars += dataTableChars(block);
  }
  if (markdownChars > MARKDOWN_MESSAGE_CHARS) return `${markdownChars} chars of markdown in one message`;
  if (tableChars > DATA_TABLE_CHARS) return `${tableChars} chars of table cells in one message`;
  const charts = blocks.filter((b) => isShape(b) && b.type === "data_visualization").length;
  if (charts > VIZ.perMessage) return `${charts} data_visualization blocks in one message`;
  return null;
}

/** A modal's title, close and submit labels: 24 characters each, per Slack's
 *  view reference (read 2026-10-08). */
const VIEW_LABEL_CHARS = 24;

/** Blocks in one view, per the view reference: 100, against a message's 50. */
const MAX_VIEW_BLOCKS = 100;

/** A view's `private_metadata`, per the view reference: 3,000 characters. */
const VIEW_METADATA_CHARS = 3000;

/**
 * Why Slack would refuse a modal view (`views.open`, `views.update`), or null.
 *
 * The block rules are a message's, one by one; only the count differs. A
 * view's labels are plain_text and capped, and so is its `private_metadata`.
 *
 * @param view - The `view` a views call carries
 */
export function viewRefusal(view: unknown): string | null {
  if (!isShape(view) || view.type !== "modal") return "a view that is not a modal";
  for (const key of ["title", "close", "submit"] as const) {
    const label = view[key];
    if (label === undefined && key !== "title") continue;
    if (!isShape(label) || label.type !== "plain_text" || !nonEmpty(label.text)) return `a view ${key} that is not plain_text`;
    if (String(label.text).length > VIEW_LABEL_CHARS) return `a view ${key} of ${String(label.text).length} chars`;
  }
  if (typeof view.private_metadata === "string" && view.private_metadata.length > VIEW_METADATA_CHARS) {
    return `private_metadata of ${view.private_metadata.length} chars`;
  }
  const blocks = Array.isArray(view.blocks) ? view.blocks : [];
  if (blocks.length > MAX_VIEW_BLOCKS) return `${blocks.length} blocks in one view`;
  for (const block of blocks) {
    const why = blockRefusal(block);
    if (why) return why;
  }
  return null;
}
