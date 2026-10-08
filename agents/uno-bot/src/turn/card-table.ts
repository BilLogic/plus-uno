// The card table — the sortable table of Roadmap cards beneath an answer
// (CONTEXT.md § card table).
//
// BUILT FROM THE LOOKUP, NEVER FROM THE MODEL. The model asks for one with
// `roadmap_query`'s `as_table` argument, and that is all it does: the rows are
// the cards the lookup actually returned, so every title, number and status in
// the table is a real card's and every link works. A list the model typed out
// itself could be wrong, short or unlinked, and nothing would say so.
//
// WHEN ONE IS ATTACHED is a rule here, not a line in the persona: the lookup
// asked for it and returned two or more definite cards. Definite means an
// enumeration's cards (a design status and/or a person), or, on a title
// search, the cards whose titles really contain the phrase: the "similar"
// did-you-mean guesses stay in the prose, so a guess never sits in a grid that
// reads as fact. A single card is an answer in prose. If several lookups in a turn qualify, the last one is the
// table — one per answer.
//
// WHAT THE MODEL IS TOLD. The lookup's result gains `table_attached`, and
// `row_count` when it is true, so the model writes its prose knowing what the
// reader will see beneath it — a summary when a table is there, the plain list
// when one is not. With a table, the lookup's `note` is replaced too: its own
// is written for a model that lists the cards itself.
//
// ROWS TYPED TWICE. A model told all that still types the rows out at times,
// so `withoutRepeatedRows` takes them out of the prose before it posts.
//
// THE PLAIN LIST is the answer of record: notifications, screen readers, the
// thread's stored history and every later turn read the message's text copy,
// not the table. `withCardList` writes it, here, so the Slack posting path and
// the recording Delivery spell it the same way.
//
// PURE: no Env, no Slack shape. What the table LOOKS like in Slack — the block,
// the caption's wording — is `slack/card-table-block.ts`'s.

/** One row: one card, as the lookup reported it. */
export interface CardTableRow {
  title: string;
  url: string;
  cardNumber: number | null;
  designStatus: string | null;
  devStatus: string | null;
}

/** A card table, as data: the rows, and what they are a list of. */
export interface CardTable {
  rows: CardTableRow[];
  /** The filters the lookup ran under, for the caption. */
  filter: { designStatus?: string; person?: string; title?: string };
  /** How many cards matched. More than `rows.length` when the lookup listed
   *  only the first of them. */
  total: number;
  /** True when the list is not the whole set: more matched than are listed,
   *  or the board was too large to read in full. */
  partial: boolean;
}

/** What a lookup's result becomes once the turn has read it. */
export interface CardTableReading {
  /** The result the model reads. */
  result: string;
  /** The table it qualified for, if it did. */
  table?: CardTable;
}

/** Fewer definite cards than this stay in the prose. */
const MIN_ROWS = 2;

interface LookupCard {
  title?: unknown;
  url?: unknown;
  card_number?: unknown;
  design_status?: unknown;
  dev_status?: unknown;
  title_match?: unknown;
}

interface LookupResult {
  ok?: unknown;
  filters?: { design_status?: unknown; person?: unknown; title?: unknown; card_number?: unknown };
  cards?: unknown;
  matched?: unknown;
  contains_count?: unknown;
  truncated?: unknown;
}

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

function rowOf(card: LookupCard): CardTableRow | null {
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
 * Read one lookup's result for a card table.
 *
 * Only a `roadmap_query` that answered `ok` is touched; anything else — another
 * tool, a failed lookup, a payload that is not JSON — comes back as it was.
 *
 * Definite cards are an enumeration's (a design status and/or a person), or a
 * title search's hits, the cards marked `title_match: "contains"`. A lookup by
 * card number alone asks after one card, so it attaches nothing.
 *
 * @param name - The tool that ran
 * @param args - The arguments the model sent it
 * @param resultText - What the tool answered
 */
export function readCardTable(name: string, args: Record<string, unknown>, resultText: string): CardTableReading {
  if (name !== "roadmap_query") return { result: resultText };
  let parsed: LookupResult;
  try {
    parsed = JSON.parse(resultText) as LookupResult;
  } catch {
    return { result: resultText };
  }
  if (!parsed || parsed.ok !== true) return { result: resultText };

  const table = args.as_table === true ? tableOf(parsed) : undefined;
  const result = JSON.stringify({
    ...parsed,
    table_attached: table !== undefined,
    ...(table ? { row_count: table.rows.length, note: tableNote(table) } : {}),
  });
  return table ? { result, table } : { result };
}

function tableOf(parsed: LookupResult): CardTable | undefined {
  const filters = parsed.filters ?? {};
  const designStatus = text(filters.design_status);
  const person = text(filters.person);
  const title = text(filters.title);
  if (!title && (filters.card_number !== undefined || (!designStatus && !person))) return undefined;

  const all = Array.isArray(parsed.cards) ? (parsed.cards as LookupCard[]) : [];
  // A title search lists its hits first and its guesses after. Only the hits
  // are definite, and `contains_count` is the whole count of them.
  const cards = title ? all.filter((c) => c.title_match === "contains") : all;
  const rows = cards.map(rowOf).filter((r): r is CardTableRow => r !== null);
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
 * The lookup's note, rewritten for a turn whose table is attached.
 *
 * The lookup's own note is written for a model that lists the cards itself —
 * "safe to enumerate", "say the list is the first 30" — and a model told that
 * types the rows out above a table that already shows them. This one says the
 * rows are the table's and keeps the partial facts, worded as what the table
 * shows rather than as a list to give.
 */
function tableNote(table: CardTable): string {
  const n = table.rows.length;
  const which = [
    table.filter.designStatus ? `in Design Status ${table.filter.designStatus}` : null,
    table.filter.person ? `with ${table.filter.person}` : null,
    table.filter.title ? `with "${table.filter.title}" in the title` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const shows = !table.partial
    ? `all ${n} cards ${which} (the complete set)`
    : table.total > n
      ? `the first ${n} of ${table.total} cards ${which}; say the table holds the first ${n} and give the total`
      : `${n} cards ${which}, from a partial read of the board; say there may be more`;
  return (
    `A card table is posted beneath your answer. It shows ${shows}. ` +
    "The rows belong to the table, so do not type them out: give the count, what stands out and any actions, " +
    "and name at most 3 cards, linked." +
    (table.filter.title
      ? ' Cards with title_match "similar" are not in the table; offer those as \'did you mean\' only if they help.'
      : "")
  );
}

/**
 * One card as a line of the plain list: `title — #412 — WIP`.
 *
 * One status, the one the lookup filtered on; both when it filtered on
 * neither, Design Status first.
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
 * The plain list of the table's cards, one line each and no more lines than
 * the table has rows. The draft judge reads it as it stands; the text copy
 * reads it beneath the prose.
 *
 * @param table - The table it lists
 */
export function cardList(table: CardTable): string {
  return table.rows.map((row) => cardLine(row, table)).join("\n");
}

/**
 * The message's text copy: the prose, then the plain list.
 *
 * @param prose - The answer as the model wrote it
 * @param table - The table beneath it
 */
export function withCardList(prose: string, table: CardTable): string {
  return [prose, "", cardList(table)].join("\n");
}

/** What `withoutRepeatedRows` left of the prose, and how many lines it took. */
export interface RowsRemoved {
  text: string;
  removed: number;
}

const fold = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Words a typed row may carry beside its title, number and statuses. */
const ROW_LABELS = /\b(?:design|dev|status)\b/g;

/**
 * Whether one line of prose is a row of the table typed out again: it names a
 * card's number AND its title, and once those, the card's statuses, a bullet,
 * link wrapping and separators are taken away, nothing is left. A sentence
 * that names a card says something more, so it stays.
 */
function repeatsRow(line: string, rows: CardTableRow[]): boolean {
  if (!/#\d/.test(line)) return false;
  // Link wrapping goes first: Slack's `<url|title>` and markdown's
  // `[title](url)` keep the title and lose the address.
  const plain = fold(line.replace(/<[^|>\s]+\|([^>]*)>/g, "$1").replace(/\[([^\]]*)\]\([^)\s]*\)/g, "$1"));
  return rows.some((row) => {
    if (row.cardNumber === null) return false;
    const number = new RegExp(`#${row.cardNumber}(?!\\d)`);
    const title = fold(row.title);
    if (!number.test(plain) || !plain.includes(title)) return false;
    let rest = plain.replace(title, " ").replace(number, " ");
    for (const status of [row.designStatus, row.devStatus]) {
      if (status) rest = rest.split(fold(status)).join(" ");
    }
    return !/[\p{L}\p{N}]/u.test(rest.replace(ROW_LABELS, " "));
  });
}

/**
 * The prose with every line that repeats a row of the table taken out.
 *
 * The table already shows the rows and the text copy lists them beneath the
 * prose, so a row the model typed as well prints every card twice. Whole lines
 * only, and only a line with a card number in it: a sentence that names a card
 * is the model's to write. The blank lines a removed list leaves behind close
 * up into one.
 *
 * @param prose - The answer as the model wrote it
 * @param table - The table beneath it
 */
export function withoutRepeatedRows(prose: string, table: CardTable): RowsRemoved {
  const kept: string[] = [];
  let removed = 0;
  let gap = false;
  for (const line of prose.split("\n")) {
    if (repeatsRow(line, table.rows)) {
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
