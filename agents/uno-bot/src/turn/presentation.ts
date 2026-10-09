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
// result table, up to 2 charts, the answer cards and the ⚠️ lines
// (`turn/warning-line.ts`, which every lookup result and the model's
// `conflict` shape also pass through). Each shape is one field on it, built
// here from the same recorded lookups and spelled for Slack on the posting
// side, so a new shape never needs a new argument on the Delivery seam.
//
// WHAT THE MODEL IS TOLD. A Roadmap lookup that asked for a table gains
// `table_attached`, and `row_count` and a rewritten `note` when it is true.
// Any other lookup whose main list holds 3 or more records gains
// `table_ready` — the list, its count and the fields a column can show — and,
// on its first call of the turn, a `table_note` saying how to ask and when not
// to. The offer rides on the result because that is what the model is reading
// when it chooses a shape: with the request left to the persona and
// `present`'s own description, a blueprint pain-points answer and an issue
// list went out as prose (live on r515, and again on r518). A tool whose rows
// are never a table to scan says so in its row (`offersTable: false`).
// `present` answers `table_attached` with the caption and row count, or the
// refusal. Either way the model writes its prose knowing what the reader will
// see beneath it — a summary when a table is there, the plain list when not.
//
// A LOOKUP CALLED SEVERAL TIMES IS ONE SET OF ROWS. A turn that searched the
// blueprint once per phase shows every row those searches returned, each once,
// where the searches return rows of one shape (`mergedLookup`). The Roadmap
// lookup is read at its last call for every shape, since its preset's caption
// names that call's filters.
//
// ONE TABLE AND ONE SET OF CARDS PER ANSWER: of each, the last request that
// produced one wins. AT MOST 2 CHARTS, Slack's cap per message: a third is
// refused.
//
// A CHART THAT CANNOT BE GROUNDED (`turn/chart.ts` says why) degrades to the
// lookup's rows as a result table, and the reason rides as the ⚠️ log's
// `degraded` line, under the same two-line cap as every other trigger.
//
// THE SOURCES are every link the turn's lookups read, as their task cards
// carry them: each once, in the order read. Which of them the answer used,
// which a thread may see, and whether to fold them into a box, is the posting
// side's call, made against the prose
// (`slack/card-sources.ts`, `slack/sources-box.ts`).
//
// PURE: no Env, no Slack shape.

import type { TaskCardSource } from "../agent/task-card-readout";
import {
  chartAcross,
  chartLine,
  chartOf,
  uncountedOf,
  CHART_KINDS,
  type Chart,
  type ChartKind,
  type LookupCall,
  type LowerBound,
} from "./chart";
import {
  mergedLookup,
  roadmapCards,
  roadmapTable,
  resultList,
  tableOf,
  tableOffer,
  withResultList,
  withoutRepeatedRows,
  namedRows,
  MAX_COLUMNS,
  MAX_NAMED_ROWS,
  type CardTable,
  type ResultTable,
  type RoadmapResult,
  type RowsRemoved,
} from "./result-table";
import { cardList, cardsOf, type AnswerCards } from "./answer-cards";
import { signed, warningLog } from "./warning-line";
import { rowFor } from "../agent/tool-table";
import type { AbsenceContext } from "../agent/absence";
import { splitCutShort } from "../agent/loop-policy";
import { hasWovenConfidence } from "../agent/confidence";
import { measureProse, overBudget, withinListBudget, MAX_LIST_ITEMS, MAX_PROSE_CHARS } from "./prose-budget";

/** What rides beneath an answer. */
export interface Presentation {
  /** The result table, when the turn's lookups left one. */
  table?: ResultTable;
  /** Up to 2 charts, in the order they were asked for. */
  charts?: Chart[];
  /** The ⚠️ lines (`turn/warning-line.ts`): at most two sentences, each
   *  without its sign, which the posting side places. A chart that fell back
   *  to a table says why here: "Not charted: only 2 groups to compare." */
  warnings?: readonly string[];
  /** The links the turn's lookups read, each once, in the order read. */
  sources?: readonly TaskCardSource[];
  /** The answer cards, when the model asked for its linkable items as cards. */
  cards?: AnswerCards;
}

/** Charts per message: Slack refuses a third. */
export const MAX_CHARTS = 2;

/** The tool the model asks for a shape with. */
export const PRESENT_TOOL = "present";

/** Holds a turn's lookups and answers its `present` calls. */
export interface Presenter {
  /**
   * A lookup's result, before the model reads it: recorded, and returned as
   * the text the model reads — rewritten when it carries a table's news.
   */
  revise(name: string, args: Record<string, unknown>, text: string): string;
  /** A lookup refused before it ran, with the refusal's error. */
  refused(name: string, error: string): void;
  /** The loop ran out of round-trips and answered from what it had. */
  budgetSpent(): void;
  /** The absence pre-check fired on the draft. */
  absenceFired(ctx: AbsenceContext): void;
  /** The links a finished lookup read, as its task card carries them. */
  sourcesRead(sources: readonly TaskCardSource[]): void;
  /** The lookup and field of each chart drawn across lookups — whose options
   *  the turn reads, so the chart can say which values it left out. */
  chartedAcross(): ReadonlyArray<{ lookup: string; field: string }>;
  /** Every value the source offers for a field a chart across lookups
   *  counted: any no lookup counted are named in a ⚠️ line. */
  optionsOffered(lookup: string, field: string, options: readonly string[]): void;
  /** What the turn's lookups left to post beneath the answer, if anything. */
  presentation(): Presentation | undefined;
}

type Recorded = LookupCall;

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
    `and name at most ${MAX_NAMED_ROWS} cards, linked.` +
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
    `then what stands out and any actions, naming at most ${MAX_NAMED_ROWS} rows.` +
    (table.partial ? " The list is partial; say so." : "")
  );
}

const NO_TABLE_NOTE = "No table is attached. If the rows answer the question, list them in your answer yourself.";

/** What a lookup's offer of a table tells the model to do with it, on the
 *  lookup's first call of the turn. */
function offerNote(lookup: string, list: string): string {
  return (
    "table_ready names this result's main list, its row count and the fields a column can show. " +
    `When 3 or more of those rows are the answer, a list to scan or compare, call present with shape "table", lookup "${lookup}", ` +
    `list "${list}" and up to 4 of those columns, and write the takeaway rather than the rows; later calls of this lookup add their rows to it. ` +
    "For a yes/no question, a single answer or a conversational reply, answer in prose without a table."
  );
}

/** What `present` answers when cards are attached. */
function cardsNote(cards: AnswerCards): string {
  const n = cards.cards.length;
  const shows = cards.total > n ? `the first ${n} of ${cards.total} linked items; say so and give the total` : `all ${n} linked items`;
  return (
    `${n === 1 ? "A card is" : "A carousel of cards is"} posted beneath your answer. It shows ${shows}, ` +
    `each with its link buttons. Do not list them again: lead with your takeaway in one sentence, then what stands out, naming at most ${MAX_NAMED_ROWS}.`
  );
}

const NO_CARDS_NOTE = "No cards are attached. Name the items in your answer yourself, linked.";

/** What `present` answers when a chart is attached: code's values, which are
 *  the only numbers about it the answer may give. */
function chartNote(chart: Chart): string {
  return (
    `A ${chart.kind} chart titled "${chart.title}" is posted beneath your answer, its values counted by code from the lookup. ` +
    "Lead with your takeaway in one sentence; any number you give about it must be one of `values` or `total`, " +
    "and do not list the values out, since the chart and its text copy show them."
  );
}

/** What `present` adds when bars of a chart across lookups are lower bounds:
 *  their lookups read only part of the board. */
function lowerBoundNote(bounds: readonly LowerBound[]): string {
  const named = bounds.map((b) => `${b.name} (${b.value})`).join(", ");
  return (
    `The read stopped short for ${named}, so each is a lower bound, as is \`total\`: say "at least" for them and for any total, ` +
    "since the chart is not exact for those bars either."
  );
}

/** What `present` answers when a chart across lookups is refused: the counts
 *  could not be grounded together, so the model is not handed them to type. */
const NO_ACROSS_NOTE =
  "No chart is attached, and a line beneath your answer tells the reader why, so do not repeat it. " +
  "Those counts could not be grounded together; answer from what each lookup's own note says it holds.";

/** The fields a fallback table shows when the model named none: the row's
 *  name, the field it grouped by, and the field it summed. */
function fallbackColumns(result: Record<string, unknown>, groupBy: string, measure: string | undefined): string[] {
  const rows = Object.values(result).find((v): v is Record<string, unknown>[] => Array.isArray(v)) ?? [];
  const name = ["title", "name"].find((f) => rows.some((r) => typeof r?.[f] === "string"));
  return [...new Set([name, groupBy, measure].filter((f): f is string => !!f))];
}

/**
 * A fresh presenter, for one turn.
 *
 * @param opts.now - The turn's clock, read for the ⚠️ line's freshness cutoff
 */
export function presenter(opts: { now?: () => number } = {}): Presenter {
  /** Every call of each lookup, in the order made: a table, cards or a
   *  grouped chart read `rowsOf`, a chart across lookups reads them all. */
  const calls = new Map<string, Recorded[]>();
  const latest = (lookup: string): Recorded | undefined => calls.get(lookup)?.at(-1);
  /** The rows a table, cards or a grouped chart of `lookup` read: the
   *  Roadmap lookup's last call, or every call of one shape merged. */
  const rowsOf = (lookup: string): Recorded | undefined => {
    const made = calls.get(lookup);
    if (!made) return undefined;
    return lookup === "roadmap_query" ? made.at(-1) : mergedLookup(made);
  };
  const warnings = warningLog(opts.now);
  let table: ResultTable | undefined;
  /** The call whose own `as_table` attached the table, while it stands. */
  let tableCall: Recorded | undefined;
  /** Each chart across lookups: the field, and the values it counted in full. */
  const drawnAcross: Array<{ lookup: string; field: string; counted: readonly string[] }> = [];
  const charts: Chart[] = [];
  const sources = new Map<string, TaskCardSource>();
  let cards: AnswerCards | undefined;

  const answer = (body: Record<string, unknown>): string => JSON.stringify(body);
  const refuse = (error: string): string => answer({ ok: false, table_attached: false, error, note: NO_TABLE_NOTE });

  /** A result table of one recorded lookup, or the refusal worded for the
   *  model. */
  const tableFrom = (lookup: string, recorded: Recorded, args: Record<string, unknown>, columns: string[]): ResultTable | string => {
    if (lookup === "roadmap_query") {
      const cards = roadmapCards(latest(lookup)!.result as RoadmapResult);
      return cards ? roadmapTable(cards) : "That Roadmap lookup has fewer than two definite cards; name them in prose.";
    }
    if (columns.length > MAX_COLUMNS) return `At most ${MAX_COLUMNS} columns; you named ${columns.length}.`;
    const reading = tableOf(lookup, recorded.args, recorded.result, {
      ...(typeof args.list === "string" && args.list ? { list: args.list } : {}),
      columns,
      ...(typeof args.takeaway === "string" ? { takeaway: args.takeaway } : {}),
    });
    return "refusal" in reading ? reading.refusal : reading.table;
  };

  const columnsOf = (args: Record<string, unknown>): string[] =>
    Array.isArray(args.columns) ? args.columns.filter((c): c is string => typeof c === "string") : [];

  const refuseChart = (error: string): string =>
    answer({ ok: false, chart_attached: false, table_attached: false, error, note: NO_TABLE_NOTE });

  const attachChart = (chart: Chart, extra: Record<string, unknown> = {}, note = chartNote(chart)): string => {
    charts.push(chart);
    return answer({
      ok: true,
      chart_attached: true,
      title: chart.title,
      values: Object.fromEntries(chart.points.map((p) => [p.label, p.value])),
      total: chart.total,
      ...extra,
      note,
    });
  };

  /** A chart with one point per call of the lookup, each that call's whole
   *  count. A card table one of those calls attached with `as_table` gives
   *  way to it: the chart counts those cards. Refused with the reason as a ⚠️
   *  line and no fallback table, since the counts come from several lookups
   *  and there is no one list of rows to show instead. */
  const presentAcross = (lookup: string, kind: ChartKind, across: string, args: Record<string, unknown>): string => {
    const reading = chartAcross(lookup, calls.get(lookup) ?? [], {
      kind,
      across,
      ...(typeof args.list === "string" && args.list ? { list: args.list } : {}),
      ...(typeof args.takeaway === "string" ? { takeaway: args.takeaway } : {}),
    });
    if ("refusal" in reading) {
      warnings.degraded(`Not charted: ${reading.refusal}`);
      return answer({ ok: false, chart_attached: false, table_attached: false, error: `No chart: ${reading.refusal}`, note: NO_ACROSS_NOTE });
    }
    drawnAcross.push({ lookup, field: across, counted: reading.counted });
    const replaced = tableCall !== undefined && reading.calls.includes(tableCall);
    if (replaced) {
      table = undefined;
      tableCall = undefined;
    }
    warnings.atLeast(lookup, reading.atLeast);
    const note =
      chartNote(reading.chart) +
      (reading.atLeast.length ? ` ${lowerBoundNote(reading.atLeast)}` : "") +
      (replaced ? " It replaces the card table an earlier lookup attached; that table no longer posts." : "");
    return attachChart(
      reading.chart,
      {
        table_attached: table !== undefined,
        ...(reading.atLeast.length ? { at_least: Object.fromEntries(reading.atLeast.map((b) => [b.name, b.value])) } : {}),
      },
      note,
    );
  };

  /** A `present` call asking for a chart: drawn from the recorded lookup's
   *  rows grouped by a field (`group_by`), or from every call of it, one point
   *  each (`across`). A grouped chart that cannot be grounded degrades to the
   *  rows it would have counted, as a table with the reason beside it. */
  const presentChart = (lookup: string, recorded: Recorded, args: Record<string, unknown>): string => {
    if (charts.length >= MAX_CHARTS) {
      return refuseChart(`At most ${MAX_CHARTS} charts per answer, and ${MAX_CHARTS} are already attached.`);
    }
    const kind = String(args.chart ?? "bar") as ChartKind;
    if (!CHART_KINDS.includes(kind)) return refuseChart(`'${kind}' is not a chart; ask for one of ${CHART_KINDS.join(", ")}.`);
    const across = typeof args.across === "string" ? args.across.trim() : "";
    const groupBy = typeof args.group_by === "string" ? args.group_by.trim() : "";
    if (across && groupBy) {
      return refuseChart(
        "Ask with group_by or across, not both: group_by groups one lookup's rows, across makes each call of the lookup one point.",
      );
    }
    if (across) return presentAcross(lookup, kind, across, args);
    if (!groupBy) return refuseChart("Name the field to group the rows by in group_by.");
    const measured = typeof args.measure === "string" ? args.measure.trim() : "";
    const measure = measured && measured !== "count" ? measured : undefined;
    const reading = chartOf(lookup, recorded.result, {
      kind,
      groupBy,
      ...(measure ? { measure } : {}),
      ...(typeof args.list === "string" && args.list ? { list: args.list } : {}),
      ...(typeof args.takeaway === "string" ? { takeaway: args.takeaway } : {}),
    });
    if ("chart" in reading) return attachChart(reading.chart);
    const named = columnsOf(args);
    const fallback = tableFrom(lookup, recorded, args, named.length ? named : fallbackColumns(recorded.result, groupBy, measure));
    if (typeof fallback === "string") return refuseChart(`No chart: ${reading.refusal}`);
    table = fallback;
    tableCall = undefined;
    warnings.degraded(`Not charted: ${reading.refusal}`);
    return answer({
      ok: false,
      chart_attached: false,
      table_attached: true,
      error: `No chart: ${reading.refusal}`,
      row_count: fallback.rows.length,
      caption: fallback.caption,
      note: `${attachedNote(fallback)} A line beneath it tells the reader why there is no chart, so do not repeat it.`,
    });
  };

  const refuseCards = (error: string): string =>
    answer({ ok: false, cards_attached: false, error, note: NO_CARDS_NOTE });

  /** A `present` call for cards, answered from the recorded lookup. */
  const presentCards = (lookup: string, recorded: Recorded, args: Record<string, unknown>): string => {
    const reading = cardsOf(lookup, recorded.result, {
      ...(typeof args.list === "string" && args.list ? { list: args.list } : {}),
      columns: columnsOf(args),
    });
    if ("refusal" in reading) return refuseCards(reading.refusal);
    cards = reading.cards;
    return answer({ ok: true, cards_attached: true, card_count: cards.cards.length, note: cardsNote(cards) });
  };

  /** The model's conflict line: placed under the answer by code, or refused. */
  const conflict = (args: Record<string, unknown>): string => {
    const taken = warnings.conflict(args.line);
    return taken.ok
      ? answer({
          ok: true,
          warning_attached: true,
          note: "The line is posted beneath your answer with its ⚠️. Do not repeat the conflict in your prose or type ⚠️ yourself.",
        })
      : answer({
          ok: false,
          warning_attached: false,
          error: taken.refusal,
          note: "No ⚠️ line was added. If the conflict still matters, say it plainly in one sentence of your prose, without ⚠️.",
        });
  };

  /** The model's `present` call, answered from the recorded lookups. */
  const present = (args: Record<string, unknown>): string => {
    const shape = args.shape ?? "table";
    if (shape === "conflict") return conflict(args);
    if (shape !== "table" && shape !== "cards" && shape !== "chart") {
      return refuse(`'${String(shape)}' is not a shape you can ask for; ask for a table, cards, a chart or a conflict.`);
    }
    const lookup = typeof args.lookup === "string" ? args.lookup.trim() : "";
    const recorded = rowsOf(lookup);
    if (!recorded) {
      const made = [...calls.keys()];
      const why =
        `No ${lookup || "named"} lookup ran this turn, so there are no rows to ${shape === "cards" ? "make cards of" : shape === "chart" ? "chart" : "table"}.` +
        (made.length ? ` Lookups that did: ${made.join(", ")}.` : "");
      return shape === "cards" ? refuseCards(why) : shape === "chart" ? refuseChart(why) : refuse(why);
    }
    if (shape === "cards") return presentCards(lookup, recorded, args);
    if (shape === "chart") return presentChart(lookup, recorded, args);
    const made = tableFrom(lookup, recorded, args, columnsOf(args));
    if (typeof made === "string") return refuse(made);
    // A table asked for in its own right replaces a fallback, and its reason.
    table = made;
    tableCall = undefined;
    warnings.degraded(undefined);
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
      warnings.lookup(name, text);
      // A read the turn's budget cut short carries the loop's stamp after its
      // JSON: still the lookup's result, and partial whatever its flags say.
      const { body, stamp } = splitCutShort(text);
      const parsed = parse(body);
      if (!parsed || parsed.ok !== true) return text;
      const first = !calls.has(name);
      const call: Recorded = { args, result: stamp ? { ...parsed, truncated: true } : parsed };
      calls.set(name, [...(calls.get(name) ?? []), call]);
      if (name !== "roadmap_query") {
        const offer = rowFor(name)?.offersTable === false ? undefined : tableOffer(rowsOf(name)!.result);
        if (!offer) return text;
        return (
          JSON.stringify({ ...parsed, table_ready: offer, ...(first ? { table_note: offerNote(name, offer.list) } : {}) }) +
          stamp
        );
      }
      // The Roadmap preset's own door: the lookup asked for its table itself.
      const cards = args.as_table === true ? roadmapCards(call.result as RoadmapResult) : undefined;
      if (cards) {
        table = roadmapTable(cards);
        tableCall = call;
        warnings.degraded(undefined);
      }
      return (
        JSON.stringify({
          ...parsed,
          table_attached: cards !== undefined,
          ...(cards ? { row_count: cards.rows.length, note: cardTableNote(cards) } : {}),
        }) + stamp
      );
    },
    refused(name, error) {
      warnings.refused(name, error);
    },
    budgetSpent() {
      warnings.budgetSpent();
    },
    absenceFired(ctx) {
      warnings.absenceFired(ctx);
    },
    sourcesRead(read) {
      for (const source of read) {
        const was = sources.get(source.url);
        // A page a search found and a later lookup read whole was queried.
        if (!was) sources.set(source.url, source);
        else if (source.queried && was.queried !== "collection") sources.set(source.url, { ...was, queried: source.queried });
      }
    },
    chartedAcross() {
      return drawnAcross.map(({ lookup, field }) => ({ lookup, field }));
    },
    optionsOffered(lookup, field, options) {
      for (const drawn of drawnAcross) {
        if (drawn.lookup === lookup && drawn.field === field) warnings.uncounted(uncountedOf(drawn.counted, options));
      }
    },
    presentation() {
      const lines = warnings.lines();
      if (!table && charts.length === 0 && !sources.size && !cards && !lines.length) return undefined;
      return {
        ...(table ? { table } : {}),
        ...(charts.length ? { charts: [...charts] } : {}),
        ...(sources.size ? { sources: [...sources.values()] } : {}),
        ...(cards ? { cards } : {}),
        ...(lines.length ? { warnings: lines } : {}),
      };
    },
  };
}

/**
 * What the judge is asked to SHORTEN when the draft is over its prose budget
 * (`turn/prose-budget.ts`): beside a table, cards or a table it typed itself,
 * more than 3 list items, more than 1,000 characters or more than 3 of the
 * table's rows named. Folded into the one judge call the turn already makes;
 * undefined when the draft is within it, or has no rows beneath it.
 *
 * @param draft - The answer as the model wrote it
 * @param presentation - What rides beneath it
 */
export function proseBudgetRepair(draft: string, presentation: Presentation | undefined): string | undefined {
  const table = presentation?.table;
  const named = table ? namedRows(draft, table).length : 0;
  const measure = measureProse(draft);
  if (!overBudget(measure, !!(table || presentation?.cards), named, MAX_NAMED_ROWS)) return undefined;
  const what = table ? "table" : presentation?.cards ? "set of cards" : "table in the draft";
  const over = [
    measure.items > MAX_LIST_ITEMS ? `${measure.items} list items` : null,
    measure.chars > MAX_PROSE_CHARS ? `${measure.chars} characters` : null,
    named > MAX_NAMED_ROWS ? `names ${named} rows of the table` : null,
  ].filter(Boolean);
  return (
    `TABLE WALK. The ${what} shows every row, yet the prose around it runs long: ${over.join("; ")}. ` +
    "Rewrite it to a **bold** one-sentence takeaway, then what stands out and what to act on, " +
    `in at most ${MAX_LIST_ITEMS} list items and ${MAX_PROSE_CHARS} characters, naming at most ${MAX_NAMED_ROWS} rows, linked; ` +
    `leave the rest to the ${what}. Keep the confidence clause and any caveat as they are` +
    `${measure.typedTable ? ", and keep the table as it is" : ""}.`
  );
}

/** A line the backstop never takes out: the confidence clause, which says
 *  what was checked or how sure. A bare "currently" in a row's sentence is
 *  not one. */
const carriesConfidence = (line: string): boolean => hasWovenConfidence(line);

/**
 * The prose as it posts beneath a presentation: every line that types out a
 * row of the table taken out, since the table already shows them, and — when
 * the prose is still over its budget, the judge's shortening having missed —
 * the list items past the first 3. One whose prose came back empty posts the
 * takeaway the model asked for the table or chart with.
 *
 * @param prose - The answer as the model wrote it
 * @param presentation - What rides beneath it
 */
export function presentedProse(prose: string, presentation: Presentation | undefined): RowsRemoved {
  const table = presentation?.table;
  let out: RowsRemoved = { text: prose, removed: 0 };
  let named = 0;
  if (table) {
    // Counted before the strip, so a row it takes out as typed-out still counts.
    named = namedRows(prose, table).length;
    out = withoutRepeatedRows(prose, table);
    if (!out.text.trim() && table.takeaway) return { text: table.takeaway, removed: out.removed };
  } else {
    const takeaway = presentation?.charts?.find((c) => c.takeaway)?.takeaway;
    if (!prose.trim() && takeaway) return { text: takeaway, removed: 0 };
  }
  const measure = measureProse(out.text);
  if (!overBudget(measure, !!(table || presentation?.cards), named, MAX_NAMED_ROWS)) return out;
  // Beside a table the whole walk goes, since the table carries the rows;
  // beside cards alone, the first 3 items stay.
  const trimmed = withinListBudget(out.text, carriesConfidence, table || measure.typedTable ? 0 : MAX_LIST_ITEMS);
  return { ...out, text: trimmed.text, ...(trimmed.removed ? { trimmed: trimmed.removed } : {}) };
}

/**
 * The message's text copy: the prose, then each chart's top values, a table's
 * plain list, the cards' list and the ⚠️ lines, in the order they post. What a
 * notification shows, a screen reader reads and the thread remembers.
 *
 * @param prose - The answer as it posts
 * @param presentation - What rides beneath it
 */
export function textCopy(prose: string, presentation: Presentation | undefined): string {
  if (!presentation) return prose;
  const charts = (presentation.charts ?? []).map(chartLine);
  let copy = charts.length ? [prose, "", ...charts].join("\n") : prose;
  if (presentation.table) copy = withResultList(copy, presentation.table);
  if (presentation.cards) copy = [copy, "", cardList(presentation.cards)].join("\n");
  const lines = presentation.warnings ?? [];
  return lines.length ? `${copy}\n\n${lines.map(signed).join("\n")}` : copy;
}

/**
 * What the draft judge is shown of the presentation: each chart's values, the
 * table's plain list and the cards', or undefined when there is none.
 *
 * @param presentation - What rides beneath the draft
 */
export function judgedList(presentation: Presentation | undefined): string | undefined {
  const lines = [
    ...(presentation?.charts ?? []).map(chartLine),
    ...(presentation?.table ? [resultList(presentation.table)] : []),
    ...(presentation?.cards ? [cardList(presentation.cards)] : []),
  ];
  return lines.length ? lines.join("\n") : undefined;
}
