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
// asked for it and returned two or more definite cards. A single card is an
// answer in prose. If several lookups in a turn qualify, the last one is the
// table — one per answer.
//
// WHAT THE MODEL IS TOLD. The lookup's result gains `table_attached`, and
// `row_count` when it is true, so the model writes its prose knowing what the
// reader will see beneath it — a summary when a table is there, the plain list
// when one is not.
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
  filter: { designStatus?: string; person?: string };
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
}

interface LookupResult {
  ok?: unknown;
  filters?: { design_status?: unknown; person?: unknown; title?: unknown; card_number?: unknown };
  cards?: unknown;
  matched?: unknown;
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
 * Definite cards are an enumeration's: a design status and/or a person. A
 * lookup that searched by title or card number attaches nothing yet, because
 * its candidates include cards that only resemble what was asked for.
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
    ...(table ? { row_count: table.rows.length } : {}),
  });
  return table ? { result, table } : { result };
}

function tableOf(parsed: LookupResult): CardTable | undefined {
  const filters = parsed.filters ?? {};
  if (filters.title !== undefined || filters.card_number !== undefined) return undefined;
  const designStatus = text(filters.design_status);
  const person = text(filters.person);
  if (!designStatus && !person) return undefined;

  const cards = Array.isArray(parsed.cards) ? (parsed.cards as LookupCard[]) : [];
  const rows = cards.map(rowOf).filter((r): r is CardTableRow => r !== null);
  if (rows.length < MIN_ROWS) return undefined;

  const matched = typeof parsed.matched === "number" ? Math.max(parsed.matched, rows.length) : rows.length;
  return {
    rows,
    filter: { ...(designStatus ? { designStatus } : {}), ...(person ? { person } : {}) },
    total: matched,
    partial: matched > rows.length || parsed.truncated === true,
  };
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
