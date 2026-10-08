// The presentation step — what rides beneath an answer, chosen by the model and
// filled by code (CONTEXT.md § result table).
//
// ONE STEP BETWEEN A TURN'S LOOKUPS AND ITS POST. Every lookup's result passes
// through the presenter as it comes back, so it holds what the turn actually
// fetched. The model asks for a shape with `present` — naming the lookup, the
// fields, its takeaway — and the presenter answers that call itself, from those
// recorded results: a request that names a lookup the turn never made, or a
// field its rows do not carry, is refused in the call's own result, and the
// model writes the plain list instead. Nothing the model types becomes a cell.
//
// THE PRESENTATION is the data the turn hands Delivery beside the prose: the
// result table and the answer cards. Each shape is one field on it, built
// here from the same recorded lookups and spelled for Slack on the posting
// side, so a new shape never needs a new argument on the Delivery seam.
//
// WHAT THE MODEL IS TOLD. A Roadmap lookup that asked for a table gains
// `table_attached`, and `row_count` and a rewritten `note` when it is true.
// `present` answers `table_attached` with the caption and row count, or the
// refusal. Either way the model writes its prose knowing what the reader will
// see beneath it — a summary when a table is there, the plain list when not.
//
// ONE TABLE AND ONE SET OF CARDS PER ANSWER: of each, the last request that
// produced one wins.
//
// PURE: no Env, no Slack shape.

import {
  roadmapCards,
  roadmapTable,
  resultList,
  tableOf,
  withResultList,
  withoutRepeatedRows,
  MAX_COLUMNS,
  type CardTable,
  type ResultTable,
  type RoadmapResult,
  type RowsRemoved,
} from "./result-table";
import { cardList, cardsOf, type AnswerCards } from "./answer-cards";

/** What rides beneath an answer. */
export interface Presentation {
  /** The result table, when the turn's lookups left one. */
  table?: ResultTable;
  /** The answer cards, when the model asked for its linkable items as cards. */
  cards?: AnswerCards;
}

/** The tool the model asks for a shape with. */
export const PRESENT_TOOL = "present";

/** Holds a turn's lookups and answers its `present` calls. */
export interface Presenter {
  /**
   * A lookup's result, before the model reads it: recorded, and returned as
   * the text the model reads — rewritten when it carries a table's news.
   */
  revise(name: string, args: Record<string, unknown>, text: string): string;
  /** What the turn's lookups left to post beneath the answer, if anything. */
  presentation(): Presentation | undefined;
}

interface Recorded {
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

const parse = (text: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

/**
 * The lookup's note, rewritten for a turn whose Roadmap table is attached.
 *
 * The lookup's own note is written for a model that lists the cards itself —
 * "safe to enumerate", "say the list is the first 30" — and a model told that
 * types the rows out above a table that already shows them. This one says the
 * rows are the table's and keeps the partial facts, worded as what the table
 * shows rather than as a list to give.
 */
function cardTableNote(table: CardTable): string {
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

/** What `present` answers when a table is attached. */
function attachedNote(table: ResultTable): string {
  return (
    `A table is posted beneath your answer, captioned "${table.caption}". ` +
    "Its rows belong to the table, so do not type them out: lead with your takeaway in one sentence, " +
    "then what stands out and any actions, naming at most 3 rows." +
    (table.partial ? " The list is partial; say so." : "")
  );
}

const NO_TABLE_NOTE = "No table is attached. If the rows answer the question, list them in your answer yourself.";

/** What `present` answers when cards are attached. */
function cardsNote(cards: AnswerCards): string {
  const n = cards.cards.length;
  const shows = cards.total > n ? `the first ${n} of ${cards.total} linked items; say so and give the total` : `all ${n} linked items`;
  return (
    `${n === 1 ? "A card is" : "A carousel of cards is"} posted beneath your answer. It shows ${shows}, ` +
    "each with its link buttons. Do not list them again: lead with your takeaway in one sentence, then what stands out, naming at most 3."
  );
}

const NO_CARDS_NOTE = "No cards are attached. Name the items in your answer yourself, linked.";

/** A fresh presenter, for one turn. */
export function presenter(): Presenter {
  const lookups = new Map<string, Recorded>();
  let table: ResultTable | undefined;
  let cards: AnswerCards | undefined;

  const answer = (body: Record<string, unknown>): string => JSON.stringify(body);
  const refuse = (error: string): string => answer({ ok: false, table_attached: false, error, note: NO_TABLE_NOTE });

  /** The model's `present` call, answered from the recorded lookups. */
  const refuseCards = (error: string): string =>
    answer({ ok: false, cards_attached: false, error, note: NO_CARDS_NOTE });

  /** A `present` call for cards, answered from the recorded lookup. */
  const presentCards = (lookup: string, recorded: Recorded, args: Record<string, unknown>): string => {
    const columns = Array.isArray(args.columns) ? args.columns.filter((c): c is string => typeof c === "string") : [];
    const reading = cardsOf(lookup, recorded.result, {
      ...(typeof args.list === "string" && args.list ? { list: args.list } : {}),
      columns,
    });
    if ("refusal" in reading) return refuseCards(reading.refusal);
    cards = reading.cards;
    return answer({ ok: true, cards_attached: true, card_count: cards.cards.length, note: cardsNote(cards) });
  };

  const present = (args: Record<string, unknown>): string => {
    const shape = args.shape ?? "table";
    if (shape !== "table" && shape !== "cards") {
      return refuse(`'${String(shape)}' is not a shape you can ask for; ask for a table or cards.`);
    }
    const lookup = typeof args.lookup === "string" ? args.lookup.trim() : "";
    const recorded = lookups.get(lookup);
    if (!recorded) {
      const made = [...lookups.keys()];
      const why =
        `No ${lookup || "named"} lookup ran this turn, so there are no rows to ${shape === "cards" ? "make cards of" : "table"}.` +
        (made.length ? ` Lookups that did: ${made.join(", ")}.` : "");
      return shape === "cards" ? refuseCards(why) : refuse(why);
    }
    if (shape === "cards") return presentCards(lookup, recorded, args);
    if (lookup === "roadmap_query") {
      const cards = roadmapCards(recorded.result as RoadmapResult);
      if (!cards) return refuse("That Roadmap lookup has fewer than two definite cards; name them in prose.");
      table = roadmapTable(cards);
    } else {
      const columns = Array.isArray(args.columns) ? args.columns.filter((c): c is string => typeof c === "string") : [];
      if (columns.length > MAX_COLUMNS) return refuse(`At most ${MAX_COLUMNS} columns; you named ${columns.length}.`);
      const reading = tableOf(lookup, recorded.args, recorded.result, {
        ...(typeof args.list === "string" && args.list ? { list: args.list } : {}),
        columns,
        ...(typeof args.takeaway === "string" ? { takeaway: args.takeaway } : {}),
      });
      if ("refusal" in reading) return refuse(reading.refusal);
      table = reading.table;
    }
    return answer({
      ok: true,
      table_attached: true,
      row_count: table.rows.length,
      caption: table.caption,
      note: attachedNote(table),
    });
  };

  return {
    revise(name, args, text) {
      if (name === PRESENT_TOOL) return present(args);
      const parsed = parse(text);
      if (!parsed || parsed.ok !== true) return text;
      lookups.set(name, { args, result: parsed });
      // The Roadmap preset's own door: the lookup asked for its table itself.
      if (name !== "roadmap_query") return text;
      const cards = args.as_table === true ? roadmapCards(parsed as RoadmapResult) : undefined;
      if (cards) table = roadmapTable(cards);
      return JSON.stringify({
        ...parsed,
        table_attached: cards !== undefined,
        ...(cards ? { row_count: cards.rows.length, note: cardTableNote(cards) } : {}),
      });
    },
    presentation() {
      return table || cards ? { ...(table ? { table } : {}), ...(cards ? { cards } : {}) } : undefined;
    },
  };
}

/**
 * The prose as it posts beneath a presentation: every line that types out a
 * row of the table taken out, since the table already shows them. A turn with
 * no table posts its prose as written; one whose prose came back empty posts
 * the takeaway the model asked for the table with.
 *
 * @param prose - The answer as the model wrote it
 * @param presentation - What rides beneath it
 */
export function presentedProse(prose: string, presentation: Presentation | undefined): RowsRemoved {
  const table = presentation?.table;
  if (!table) return { text: prose, removed: 0 };
  const stripped = withoutRepeatedRows(prose, table);
  if (!stripped.text.trim() && table.takeaway) return { text: table.takeaway, removed: stripped.removed };
  return stripped;
}

/**
 * The message's text copy: the prose, then a table's plain list. What a
 * notification shows, a screen reader reads and the thread remembers.
 *
 * @param prose - The answer as it posts
 * @param presentation - What rides beneath it
 */
export function textCopy(prose: string, presentation: Presentation | undefined): string {
  const tabled = presentation?.table ? withResultList(prose, presentation.table) : prose;
  return presentation?.cards ? [tabled, "", cardList(presentation.cards)].join("\n") : tabled;
}

/**
 * What the draft judge is shown of the presentation: the table's plain list
 * and the cards', or undefined when there is neither.
 *
 * @param presentation - What rides beneath the draft
 */
export function judgedList(presentation: Presentation | undefined): string | undefined {
  const lists = [
    presentation?.table ? resultList(presentation.table) : null,
    presentation?.cards ? cardList(presentation.cards) : null,
  ].filter((l): l is string => l !== null);
  return lists.length ? lists.join("\n") : undefined;
}
