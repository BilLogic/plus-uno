// The result table — the sortable table of a lookup's rows beneath an answer
// (CONTEXT.md § result table).
//
// BUILT FROM THE LOOKUP, NEVER FROM THE MODEL. The model chooses the lookup and
// up to 4 of its fields; every cell is the value a row of that lookup really
// carried, so every title, number and status in the table is real and every
// link works. A list the model typed out itself could be wrong, short or
// unlinked, and nothing would say so.
//
// TWO WAYS IN, ONE TABLE OUT.
//   • The Roadmap preset: `roadmap_query`'s `as_table`, or `present` naming
//     `roadmap_query`. Its columns are fixed — Card, #, Design Status, Dev
//     Status — and its rows are the lookup's DEFINITE cards: an enumeration's
//     (a design status and/or a person), or on a title search the cards whose
//     titles really contain the phrase. The "similar" did-you-mean guesses stay
//     in the prose, so a guess never sits in a grid that reads as fact.
//   • Any other lookup, through `present`: the rows are the first list of
//     records in its result (or the one it names), the columns the fields the
//     model chose, each one held to what the rows carry.
// Either way it is a `ResultTable`: the cells, the caption, the plain list and
// what the duplicate-row strip looks for, all computed here.
//
// THE PLAIN LIST is the answer of record: notifications, screen readers, the
// thread's stored history and every later turn read the message's text copy,
// not the table. `withResultList` writes it, here, so the Slack posting path
// and the recording Delivery spell it the same way.
//
// ROWS TYPED TWICE. A model told the rows are the table's still types them out
// at times, so `withoutRepeatedRows` takes them out of the prose before it
// posts.
//
// PURE: no Env, no Slack shape. What the table LOOKS like in Slack — the block
// — is `slack/result-table-block.ts`'s. Which table a turn posts, and what the
// model is told, is `turn/presentation.ts`'s.

/** One column: its header, and whether every value in it is a number. */
export interface ResultColumn {
  label: string;
  /** Every value is a number: the cells are numeric, so Slack sorts them as
   *  numbers. */
  numeric: boolean;
}

/** A cell's value. Null is a row with nothing in that field. */
export type ResultCell = string | number | null;

/** One row of the table, and what the text copy and the strip know it by. */
export interface ResultRow {
  /** One per column, in column order. */
  cells: ResultCell[];
  /** Where the first column links, when the row carries an address. */
  url?: string;
  /** Where each column links, in column order, for a row with more than one
   *  address or one that is not in the first column. Overrides `url`. */
  links?: Array<string | undefined>;
  /** The row as one line of the plain list. */
  line: string;
  /** What a line of prose must name, all of it, to be this row typed out. An
   *  empty list: no line ever is. */
  names: string[];
  /** What else such a line may carry and still be only the row: its other
   *  values. */
  mentions: string[];
}

/** A result table, as data. */
export interface ResultTable {
  /** The lookup its rows came from. */
  lookup: string;
  columns: ResultColumn[];
  rows: ResultRow[];
  /** What the table holds, in a line: the count, the filter, and whether the
   *  list is partial. */
  caption: string;
  /** How many rows matched. More than `rows.length` when the lookup listed
   *  only the first of them. */
  total: number;
  /** True when the list is not the whole set. */
  partial: boolean;
  /** The words a typed-out row may carry beside its values: the column
   *  headers'. */
  labels: string[];
  /** The model's one-line takeaway, when it asked for the table by `present`. */
  takeaway?: string;
}

/** At most this many rows: one page, never paged five at a time. */
export const MAX_ROWS = 30;

/** At most this many columns. */
export const MAX_COLUMNS = 4;

/** Fewer rows than this are an answer in prose. */
const MIN_ROWS = 2;

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

// ── The Roadmap preset ──────────────────────────────────────────────────────

/** One card, as the Roadmap lookup reported it. */
export interface CardTableRow {
  title: string;
  url: string;
  cardNumber: number | null;
  designStatus: string | null;
  devStatus: string | null;
}

/** The Roadmap lookup's definite cards, before they become a table. */
export interface CardTable {
  rows: CardTableRow[];
  /** The filters the lookup ran under, for the caption. */
  filter: { designStatus?: string; person?: string; title?: string };
  /** How many cards matched. */
  total: number;
  /** True when more matched than are listed, or the board was too large to
   *  read in full. */
  partial: boolean;
}

interface LookupCard {
  title?: unknown;
  url?: unknown;
  card_number?: unknown;
  design_status?: unknown;
  dev_status?: unknown;
  title_match?: unknown;
}

/** The fields of a `roadmap_query` result this module reads. */
export interface RoadmapResult {
  ok?: unknown;
  filters?: { design_status?: unknown; person?: unknown; title?: unknown; card_number?: unknown };
  cards?: unknown;
  matched?: unknown;
  contains_count?: unknown;
  truncated?: unknown;
}

function cardOf(card: LookupCard): CardTableRow | null {
  const title = text(card.title);
  const url = text(card.url);
  if (!title || !url) return null;
  return {
    title,
    url,
    cardNumber: typeof card.card_number === "number" ? card.card_number : null,
    designStatus: text(card.design_status),
    devStatus: text(card.dev_status),
  };
}

/**
 * The definite cards of one `roadmap_query` result that answered `ok`, or
 * undefined when it has fewer than two. A lookup by card number alone asks
 * after one card, so it has none.
 */
export function roadmapCards(parsed: RoadmapResult): CardTable | undefined {
  const filters = parsed.filters ?? {};
  const designStatus = text(filters.design_status);
  const person = text(filters.person);
  const title = text(filters.title);
  if (!title && (filters.card_number !== undefined || (!designStatus && !person))) return undefined;

  const all = Array.isArray(parsed.cards) ? (parsed.cards as LookupCard[]) : [];
  // A title search lists its hits first and its guesses after. Only the hits
  // are definite, and `contains_count` is the whole count of them.
  const cards = title ? all.filter((c) => c.title_match === "contains") : all;
  const rows = cards.map(cardOf).filter((r): r is CardTableRow => r !== null);
  if (rows.length < MIN_ROWS) return undefined;

  const whole = title ? parsed.contains_count : parsed.matched;
  const matched = typeof whole === "number" ? Math.max(whole, rows.length) : rows.length;
  return {
    rows,
    filter: {
      ...(designStatus ? { designStatus } : {}),
      ...(person ? { person } : {}),
      ...(title ? { title } : {}),
    },
    total: matched,
    partial: matched > rows.length || parsed.truncated === true,
  };
}

/**
 * What the Roadmap table holds, in a line: "13 cards · Design Status WIP" and,
 * when the lookup listed only the first of its matches, "first 30 of 41 ·
 * Design Status WIP". A partial read with no larger count to give says so
 * plainly, so a cut list never reads as the whole board.
 */
function cardCaption(table: CardTable): string {
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
 * One card as a line of the plain list: `title — #412 — WIP`. One status, the
 * one the lookup filtered on; both when it filtered on neither, Design Status
 * first.
 */
function cardLine(row: CardTableRow, table: CardTable): string {
  const statuses = table.filter.designStatus
    ? [row.designStatus]
    : [row.designStatus, row.devStatus ? `Dev ${row.devStatus}` : null];
  const status = statuses.filter(Boolean).join(" · ");
  return [row.title, row.cardNumber === null ? null : `#${row.cardNumber}`, status || null]
    .filter(Boolean)
    .join(" — ");
}

/**
 * The Roadmap preset: a card list as a result table. A card is typed out
 * again only when a line names its number AND its title; a card with no
 * number is never stripped, since a title alone is how prose names a card.
 *
 * @param table - The lookup's definite cards
 */
export function roadmapTable(table: CardTable): ResultTable {
  return {
    lookup: "roadmap_query",
    columns: [
      { label: "Card", numeric: false },
      { label: "#", numeric: true },
      { label: "Design Status", numeric: false },
      { label: "Dev Status", numeric: false },
    ],
    rows: table.rows.map((row) => ({
      cells: [row.title, row.cardNumber, row.designStatus, row.devStatus],
      url: row.url,
      line: cardLine(row, table),
      names: row.cardNumber === null ? [] : [row.title, `#${row.cardNumber}`],
      mentions: [row.designStatus, row.devStatus].filter((s): s is string => s !== null),
    })),
    caption: cardCaption(table),
    total: table.total,
    partial: table.partial,
    labels: ["design", "dev", "status"],
  };
}

// ── Any lookup's rows ───────────────────────────────────────────────────────

/** What the model asked for: the fields to show, and its takeaway. */
export interface TableRequest {
  /** The key of the list in the lookup's result; the first list of records
   *  when absent. */
  list?: string;
  columns: string[];
  takeaway?: string;
}

/** A table, or why there is none — worded for the model, which writes the
 *  plain list itself when there is none. */
export type TableReading = { table: ResultTable } | { refusal: string };

/** A field longer than this, or with a line break in it, is prose: a table
 *  cell cannot show it, and the prose should summarise it instead. */
const LONG_TEXT = 120;

type Record_ = Record<string, unknown>;

const isRecord = (v: unknown): v is Record_ => typeof v === "object" && v !== null && !Array.isArray(v);
const isAddress = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//.test(v);

/** A field name as a header: `design_status` → "Design Status". */
export function labelOf(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

/** A value as a cell: text, a number, or nothing. */
function cellOf(value: unknown): ResultCell {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? "yes" : "no";
  return text(value);
}

/** Why `field` cannot be a column of `rows`, or null when it can. */
function columnRefusal(field: string, rows: Record_[], usable: string[]): string | null {
  const values = rows.map((r) => r[field]).filter((v) => v !== undefined && v !== null && v !== "");
  if (values.length === 0) return `'${field}' is not a field these rows carry. They carry: ${usable.join(", ")}.`;
  if (values.some((v) => typeof v === "object")) return `'${field}' holds lists or records, which a table cell cannot show.`;
  if (values.some(isAddress)) return `'${field}' is a link; the first column links to each row's url by itself.`;
  if (values.some((v) => typeof v === "string" && (v.length > LONG_TEXT || v.includes("\n"))))
    return `'${field}' is long text, which a table cell cannot show; summarise it in your prose instead.`;
  return null;
}

/** The fields a column could be drawn from. */
function usableFields(rows: Record_[]): string[] {
  const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return fields.filter((f) => columnRefusal(f, rows, []) === null);
}

/** Every list of records a result holds, by key, in the result's order. */
function listsOf(result: Record_): Array<[string, Record_[]]> {
  return Object.entries(result).filter(
    ([, v]) => Array.isArray(v) && v.length > 0 && v.every(isRecord),
  ) as Array<[string, Record_[]]>;
}

/** The list of records a result holds under `key`, or its first one. */
export function listOf(result: Record_, key: string | undefined): { key: string; rows: Record_[] } | null {
  const lists = listsOf(result);
  const found = key ? lists.find(([k]) => k === key) : lists[0];
  return found ? { key: found[0], rows: found[1] } : null;
}

/** The fields a whole count behind the list under `key` may be reported in. */
const countFields = (key: string): string[] => [`${key}Total`, `${key.replace(/s$/, "")}Total`, "matched", "total"];

/** The whole count behind a list, when the result reports one. */
export function wholeCount(result: Record_, key: string): number | undefined {
  for (const field of countFields(key)) {
    if (typeof result[field] === "number") return result[field];
  }
  return undefined;
}

/**
 * What a result offers as a table: each list of 2 or more records that has a
 * field a column can show, with those fields in the order the rows carry them.
 * The lookup's result carries it, so the model reads which rows can post as a
 * table, and under which columns, at the point it chooses how to answer.
 *
 * @param result - A lookup's result, parsed
 */
export function tableOffer(result: Record_): Record<string, { count: number; columns: string[] }> {
  const offer: Record<string, { count: number; columns: string[] }> = {};
  for (const [key, rows] of listsOf(result)) {
    const columns = rows.length >= MIN_ROWS ? usableFields(rows) : [];
    if (columns.length) offer[key] = { count: rows.length, columns };
  }
  return offer;
}

/** What a row is known by when two calls return it: its address, its id, or
 *  all of it. */
const rowKey = (row: Record_): string =>
  isAddress(row.url) ? row.url : typeof row.id === "string" || typeof row.id === "number" ? `id:${row.id}` : JSON.stringify(row);

/**
 * Several calls of one lookup, as one result: what a turn that searched a
 * source several times — once per phase, once per scenario — shows as one
 * table, chart or set of cards.
 *
 * Each list of records is every call's rows in call order, a row two calls
 * returned kept once. Everything else is the last call's, except what would
 * misstate the merged lists: a whole count belongs to one call's query, so it
 * is dropped and the rows shown are the count; the list is partial when any
 * call's was; and the arguments are those every call shared, which is the
 * filter the caption can honestly name.
 *
 * @param calls - The lookup's calls this turn, in order, at least one
 */
export function mergedLookup(calls: ReadonlyArray<{ args: Record_; result: Record_ }>): { args: Record_; result: Record_ } {
  const last = calls[calls.length - 1]!;
  if (calls.length === 1) return last;
  const result: Record_ = { ...last.result };
  const keys = new Set(calls.flatMap((c) => listsOf(c.result).map(([k]) => k)));
  for (const key of keys) {
    const seen = new Map<string, Record_>();
    for (const call of calls) {
      for (const row of listOf(call.result, key)?.rows ?? []) if (!seen.has(rowKey(row))) seen.set(rowKey(row), row);
    }
    result[key] = [...seen.values()];
    for (const field of countFields(key)) delete result[field];
  }
  if (calls.some((c) => c.result.truncated === true)) result.truncated = true;
  const args = Object.fromEntries(
    Object.entries(last.args).filter(([k, v]) => calls.every((c) => JSON.stringify(c.args[k]) === JSON.stringify(v))),
  );
  return { args, result };
}

/** The lookup's arguments as the caption's filter: `"onboarding" · phase
 *  Onboarding`. Free text is quoted; a filter is named by its field. */
function filterOf(args: Record_): string[] {
  const FREE_TEXT = new Set(["query", "keywords", "title", "q"]);
  return Object.entries(args)
    .filter(([, v]) => (typeof v === "string" && v.trim()) || typeof v === "number")
    .map(([k, v]) =>
      FREE_TEXT.has(k) ? `"${String(v)}"` : `${k.replace(/^filter_/, "").replace(/_/g, " ")} ${String(v)}`,
    );
}

/** What a list holds, by its key: "findings", or "finding" for one. */
export function nounOf(key: string, n: number): string {
  const plural = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return n === 1 ? plural.replace(/s$/, "") : plural;
}

/**
 * A result table of any lookup's rows, or the reason there is none.
 *
 * The rows are the lookup's own, up to 30; the columns are the fields the
 * model named, each one a field the rows carry that a cell can show — not long
 * text, not a list, not a bare link. The first column links to a row's `url`
 * when it has one. The caption is code's: the count, the lookup's filters, and
 * whether the list is partial.
 *
 * @param lookup - The tool that ran
 * @param args - The arguments it ran with
 * @param result - What it answered, parsed
 * @param request - The model's choice of list, columns and takeaway
 */
export function tableOf(lookup: string, args: Record_, result: Record_, request: TableRequest): TableReading {
  const list = listOf(result, request.list);
  if (!list) {
    return {
      refusal: request.list
        ? `${lookup}'s result has no list of records called '${request.list}'.`
        : `${lookup}'s result holds no list of records to table.`,
    };
  }
  if (list.rows.length < MIN_ROWS) return { refusal: "One row is an answer in prose, not a table." };

  const fields = [...new Set(request.columns.map((c) => c.trim()).filter(Boolean))];
  if (fields.length === 0) return { refusal: "Name at least one column." };
  if (fields.length > MAX_COLUMNS) return { refusal: `At most ${MAX_COLUMNS} columns; you named ${fields.length}.` };
  const usable = usableFields(list.rows);
  for (const field of fields) {
    const refusal = columnRefusal(field, list.rows, usable);
    if (refusal) return { refusal };
  }

  const shown = list.rows.slice(0, MAX_ROWS);
  const columns = fields.map((field) => ({
    label: labelOf(field),
    numeric: shown.every((r) => cellOf(r[field]) === null || typeof cellOf(r[field]) === "number"),
  }));
  const rows: ResultRow[] = shown.map((record) => {
    const cells = fields.map((f) => cellOf(record[f]));
    const [first, ...rest] = cells.map((c) => (c === null ? null : String(c)));
    const url = isAddress(record.url) ? record.url : undefined;
    // A row is typed out again when a line names its first column — the field
    // the reader knows it by — and nothing else but its other values. A short
    // or numeric first column is too common a string to strip lines on.
    const nameable = typeof cells[0] === "string" && cells[0].length >= 4;
    return {
      cells,
      ...(url ? { url } : {}),
      line: cells.filter((c) => c !== null).map(String).join(" — "),
      names: nameable && first ? [first] : [],
      mentions: rest.filter((v): v is string => v !== null),
    };
  });

  const whole = wholeCount(result, list.key);
  const total = Math.max(whole ?? 0, list.rows.length);
  const partial = total > rows.length || result.truncated === true;
  const n = rows.length;
  const count = !partial
    ? `${n} ${nounOf(list.key, n)}`
    : total > n
      ? `first ${n} of ${total}`
      : `at least ${n} ${nounOf(list.key, n)}`;
  const takeaway = request.takeaway?.trim();
  return {
    table: {
      lookup,
      columns,
      rows,
      caption: [count, ...filterOf(args)].join(" · "),
      total,
      partial,
      labels: [...new Set(fields.flatMap((f) => labelOf(f).toLowerCase().split(" ")))],
      ...(takeaway ? { takeaway } : {}),
    },
  };
}

// ── The plain list, and rows typed twice ────────────────────────────────────

/**
 * The plain list of the table's rows, one line each and no more lines than
 * the table has rows. The draft judge reads it as it stands; the text copy
 * reads it beneath the prose.
 *
 * @param table - The table it lists
 */
export function resultList(table: ResultTable): string {
  return table.rows.map((row) => row.line).join("\n");
}

/**
 * The message's text copy: the prose, then the plain list.
 *
 * @param prose - The answer as the model wrote it
 * @param table - The table beneath it
 */
export function withResultList(prose: string, table: ResultTable): string {
  return [prose, "", resultList(table)].join("\n");
}

/** What `withoutRepeatedRows` left of the prose, and how many lines it took. */
export interface RowsRemoved {
  text: string;
  removed: number;
}

const fold = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();
const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A name as a pattern: a card number `#401` never matches inside `#4012`. */
const namePattern = (name: string): RegExp =>
  /^#\d+$/.test(name) ? new RegExp(`${escape(name)}(?!\\d)`) : new RegExp(escape(fold(name)));

/**
 * Whether one line of prose is a row of the table typed out again: it names
 * everything the row is known by, and once those, the row's other values, the
 * column headers' words, a bullet, link wrapping and separators are taken away,
 * nothing is left. A sentence that names a row says something more, so it
 * stays.
 */
function repeatsRow(line: string, table: ResultTable, labels: RegExp | null): boolean {
  // Link wrapping goes first: Slack's `<url|title>` and markdown's
  // `[title](url)` keep the title and lose the address.
  const plain = fold(line.replace(/<[^|>\s]+\|([^>]*)>/g, "$1").replace(/\[([^\]]*)\]\([^)\s]*\)/g, "$1"));
  return table.rows.some((row) => {
    if (row.names.length === 0) return false;
    const names = row.names.map(namePattern);
    if (!names.every((p) => p.test(plain))) return false;
    let rest = plain;
    for (const p of names) rest = rest.replace(p, " ");
    for (const value of row.mentions) rest = rest.split(fold(value)).join(" ");
    if (labels) rest = rest.replace(labels, " ");
    return !/[\p{L}\p{N}]/u.test(rest);
  });
}

/**
 * The prose with every line that repeats a row of the table taken out.
 *
 * The table already shows the rows and the text copy lists them beneath the
 * prose, so a row the model typed as well prints every row twice. Whole lines
 * only: a sentence that names a row is the model's to write. The blank lines a
 * removed list leaves behind close up into one.
 *
 * @param prose - The answer as the model wrote it
 * @param table - The table beneath it
 */
export function withoutRepeatedRows(prose: string, table: ResultTable): RowsRemoved {
  const labels = table.labels.length
    ? new RegExp(`\\b(?:${table.labels.map(escape).join("|")})\\b`, "g")
    : null;
  const kept: string[] = [];
  let removed = 0;
  let gap = false;
  for (const line of prose.split("\n")) {
    if (repeatsRow(line, table, labels)) {
      removed++;
      gap = true;
      continue;
    }
    const blank = !line.trim();
    // A blank line after a removal, beside another blank or at the start, is
    // the gap the removed list left.
    if (blank && gap && (kept.length === 0 || !kept[kept.length - 1]!.trim())) continue;
    if (!blank) gap = false;
    kept.push(line);
  }
  if (!removed) return { text: prose, removed: 0 };
  while (kept.length && !kept[kept.length - 1]!.trim()) kept.pop();
  return { text: kept.join("\n"), removed };
}
