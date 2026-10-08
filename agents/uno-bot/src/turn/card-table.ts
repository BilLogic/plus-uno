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
// asked for it and returned three or more definite cards, the persona's floor,
// so two cards stay in the prose. Definite means an enumeration's cards (a
// design status and/or a person), or, on a title search, the cards whose
// titles really contain the phrase: the "similar" did-you-mean guesses stay in
// the prose, so a guess never sits in a grid that reads as fact.
//
// ONE PER ANSWER, AND THE FIRST WINS. Once a lookup has attached a table, a
// later one that would qualify is told it was not attached, and why, and the
// model writes those cards as prose or the plain list. The first is the one
// the model has already written its prose around; letting a later lookup
// replace it would leave that prose pointing at a table that is not there. A
// later lookup that does not qualify — a narrowing to one card — never clears
// the table either.
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
// PURE: no Env, no Slack shape. The caption's words are here, because the
// model is told them when a second table is refused; what the table LOOKS like
// in Slack — the block, its cells — is `slack/card-table-block.ts`'s.

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
  /** True when the LOOKUP says the list is not the whole set: more matched
   *  than it listed, or the board was too large to read in full. */
  partial: boolean;
  /** True when `total` is itself a floor — the board read stopped short, so
   *  more cards may match than were counted. Absent means it is exact. */
  totalIsFloor?: boolean;
}

/** What a lookup's result becomes once the turn has read it. */
export interface CardTableReading {
  /** The result the model reads. */
  result: string;
  /** The table it qualified for, if it did. */
  table?: CardTable;
}

/** Fewer definite cards than this stay in the prose — the persona's floor. */
const MIN_ROWS = 3;

/** The most rows the lookup lists (`roadmap_query`'s enumeration cap). */
const LOOKUP_ROW_CAP = 30;

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

const isCard = (value: unknown): value is LookupCard => typeof value === "object" && value !== null;

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
 * A lookup the turn's budget cut short reaches here with the loop's notice
 * appended after the JSON (`markPartialLookup`). The JSON is read through it,
 * the notice is kept for the model, and the table it qualifies for is partial:
 * a cut read cannot say how many cards there are.
 *
 * @param name - The tool that ran
 * @param args - The arguments the model sent it
 * @param resultText - What the tool answered
 * @param attached - The table an earlier lookup this turn already attached;
 *   a later one that qualifies is refused, since the first wins
 */
export function readCardTable(
  name: string,
  args: Record<string, unknown>,
  resultText: string,
  attached?: CardTable,
): CardTableReading {
  if (name !== "roadmap_query") return { result: resultText };
  // The tool answers one line of JSON; anything after the first line break is
  // a notice the loop appended to it.
  const cut = resultText.indexOf("\n");
  const json = cut < 0 ? resultText : resultText.slice(0, cut);
  const notice = cut < 0 ? "" : resultText.slice(cut);
  let parsed: LookupResult;
  try {
    parsed = JSON.parse(json) as LookupResult;
  } catch {
    return { result: resultText };
  }
  if (!parsed || parsed.ok !== true) return { result: resultText };

  const qualifying = args.as_table === true ? tableOf(parsed, notice.trim() !== "") : undefined;
  const table = attached ? undefined : qualifying;
  const result = JSON.stringify({
    ...parsed,
    table_attached: table !== undefined,
    ...(table ? { row_count: table.rows.length } : {}),
    ...(qualifying && attached
      ? { table_reason: `one card table per answer; already attached: ${cardTableCaption(attached)}` }
      : {}),
  });
  return table ? { result: result + notice, table } : { result: result + notice };
}

function tableOf(parsed: LookupResult, cutShort: boolean): CardTable | undefined {
  const filters = parsed.filters ?? {};
  const designStatus = text(filters.design_status);
  const person = text(filters.person);
  const title = text(filters.title);
  if (!title && (filters.card_number !== undefined || (!designStatus && !person))) return undefined;

  const all = Array.isArray(parsed.cards) ? parsed.cards.filter(isCard) : [];
  // A title search lists its hits first and its guesses after. Only the hits
  // are definite, and `contains_count` is the whole count of them.
  const cards = title ? all.filter((c) => c.title_match === "contains") : all;
  const rows = cards.map(rowOf).filter((r): r is CardTableRow => r !== null);
  if (rows.length < MIN_ROWS) return undefined;

  // Partial is the LOOKUP's word, never inferred from the rows: a card dropped
  // here for a missing title or link must not turn a complete list of 13 into
  // "first 12 of 13". Such a card is simply not a row.
  const whole = title ? parsed.contains_count : parsed.matched;
  const matched = typeof whole === "number" ? whole : cards.length;
  const boardCut = parsed.truncated === true || cutShort;
  const partial = boardCut || matched > LOOKUP_ROW_CAP;
  return {
    rows,
    filter: {
      ...(designStatus ? { designStatus } : {}),
      ...(person ? { person } : {}),
      ...(title ? { title } : {}),
    },
    total: partial ? Math.max(matched, rows.length) : rows.length,
    partial,
    ...(boardCut ? { totalIsFloor: true } : {}),
  };
}

/**
 * What the table holds, in a line: the count and the filter —
 * "13 cards · Design Status WIP" — and, when the lookup listed only the first
 * of its matches, "first 30 of 41 · Design Status WIP". When the board read
 * itself stopped short the whole count is only a floor — "first 30 of at least
 * 41" — and with no larger count to give it reads "at least 12 cards", so a cut
 * list never reads as the whole board.
 *
 * @param table - The table it captions
 */
export function cardTableCaption(table: CardTable): string {
  const n = table.rows.length;
  const floor = table.totalIsFloor ? "at least " : "";
  const count = !table.partial
    ? `${n} card${n === 1 ? "" : "s"}`
    : table.total > n
      ? `first ${n} of ${floor}${table.total}`
      : `at least ${n} cards`;
  const filters = [
    table.filter.designStatus ? `Design Status ${table.filter.designStatus}` : null,
    table.filter.person ? `with ${table.filter.person}` : null,
    table.filter.title ? `title contains "${table.filter.title}"` : null,
  ];
  return [count, ...filters].filter(Boolean).join(" · ");
}

/**
 * One card as a line of the plain list: `title — #412 — WIP`.
 *
 * One status, the one the lookup filtered on; both when it filtered on
 * neither, Design Status first.
 */
function cardLine(row: CardTableRow, table: CardTable): string {
  return [row.title, ...cardFacts(row, table)].join(" — ");
}

/**
 * What follows a card's title on its line: its number and its status, each
 * left out when the card has none.
 *
 * @param row - The card
 * @param table - The table it is a row of, whose filter picks the status
 */
export function cardFacts(row: CardTableRow, table: CardTable): string[] {
  const statuses = table.filter.designStatus
    ? [row.designStatus]
    : [row.designStatus, row.devStatus ? `Dev ${row.devStatus}` : null];
  const status = statuses.filter(Boolean).join(" · ");
  return [row.cardNumber === null ? null : `#${row.cardNumber}`, status || null].filter((f): f is string => !!f);
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
