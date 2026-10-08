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
// one result table, up to 2 charts, and the sentence saying why a chart became
// a table. Each new shape is one more field on it, built here from the same
// recorded lookups and spelled for Slack on the posting side, so a new shape
// never needs a new argument on the Delivery seam.
//
// WHAT THE MODEL IS TOLD. A Roadmap lookup that asked for a table gains
// `table_attached`, and `row_count` and a rewritten `note` when it is true.
// `present` answers `table_attached` with the caption and row count, or the
// refusal. Either way the model writes its prose knowing what the reader will
// see beneath it — a summary when a table is there, the plain list when not.
//
// ONE TABLE PER ANSWER: the last request that produced one wins. AT MOST 2
// CHARTS, Slack's cap per message: a third is refused.
//
// A CHART THAT CANNOT BE GROUNDED (`turn/chart.ts` says why) degrades to the
// lookup's rows as a result table, and the reason rides as `degraded`, which
// the posting side shows as a ⚠️ line and the text copy repeats.
//
// THE SOURCES are every link the turn's lookups read, as their task cards
// carry them: each once, in the order read. Which of them a thread may see,
// and whether there are enough to fold into a box, is the posting side's call
// (`slack/card-sources.ts`, `slack/sources-box.ts`).
//
// PURE: no Env, no Slack shape.

import type { TaskCardSource } from "../agent/task-card-readout";
import { chartLine, chartOf, CHART_KINDS, type Chart, type ChartKind } from "./chart";
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

/** What rides beneath an answer. */
export interface Presentation {
  /** The result table, when the turn's lookups left one. */
  table?: ResultTable;
  /** Up to 2 charts, in the order they were asked for. */
  charts?: Chart[];
  /** Why a chart the model asked for is the table instead, as one sentence
   *  for the reader: "Not charted: only 2 groups to compare." */
  degraded?: string;
  /** The links the turn's lookups read, each once, in the order read. */
  sources?: readonly TaskCardSource[];
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
  /** The links a finished lookup read, as its task card carries them. */
  sourcesRead(sources: readonly TaskCardSource[]): void;
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

/** What `present` answers when a chart is attached: code's values, which are
 *  the only numbers about it the answer may give. */
function chartNote(chart: Chart): string {
  return (
    `A ${chart.kind} chart titled "${chart.title}" is posted beneath your answer, its values counted by code from the lookup. ` +
    "Lead with your takeaway in one sentence; any number you give about it must be one of `values` or `total`, " +
    "and do not list the values out, since the chart and its text copy show them."
  );
}

/** The fields a fallback table shows when the model named none: the row's
 *  name, the field it grouped by, and the field it summed. */
function fallbackColumns(result: Record<string, unknown>, groupBy: string, measure: string | undefined): string[] {
  const rows = Object.values(result).find((v): v is Record<string, unknown>[] => Array.isArray(v)) ?? [];
  const name = ["title", "name"].find((f) => rows.some((r) => typeof r?.[f] === "string"));
  return [...new Set([name, groupBy, measure].filter((f): f is string => !!f))];
}

/** A fresh presenter, for one turn. */
export function presenter(): Presenter {
  const lookups = new Map<string, Recorded>();
  let table: ResultTable | undefined;
  const charts: Chart[] = [];
  let degraded: string | undefined;
  const sources = new Map<string, TaskCardSource>();

  const answer = (body: Record<string, unknown>): string => JSON.stringify(body);
  const refuse = (error: string): string => answer({ ok: false, table_attached: false, error, note: NO_TABLE_NOTE });

  /** A result table of one recorded lookup, or the refusal worded for the
   *  model. */
  const tableFrom = (lookup: string, recorded: Recorded, args: Record<string, unknown>, columns: string[]): ResultTable | string => {
    if (lookup === "roadmap_query") {
      const cards = roadmapCards(recorded.result as RoadmapResult);
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

  /** A `present` call asking for a chart: drawn from the recorded lookup, or
   *  degraded to the rows it would have counted, as a table with the reason
   *  beside it. */
  const presentChart = (lookup: string, recorded: Recorded, args: Record<string, unknown>): string => {
    if (charts.length >= MAX_CHARTS) return refuseChart(`At most ${MAX_CHARTS} charts per answer, and ${MAX_CHARTS} are already attached.`);
    const kind = String(args.chart ?? "bar") as ChartKind;
    if (!CHART_KINDS.includes(kind)) return refuseChart(`'${kind}' is not a chart; ask for one of ${CHART_KINDS.join(", ")}.`);
    const groupBy = typeof args.group_by === "string" ? args.group_by.trim() : "";
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
    if ("chart" in reading) {
      const chart = reading.chart;
      charts.push(chart);
      return answer({
        ok: true,
        chart_attached: true,
        title: chart.title,
        values: Object.fromEntries(chart.points.map((p) => [p.label, p.value])),
        total: chart.total,
        note: chartNote(chart),
      });
    }
    const named = columnsOf(args);
    const fallback = tableFrom(lookup, recorded, args, named.length ? named : fallbackColumns(recorded.result, groupBy, measure));
    if (typeof fallback === "string") return refuseChart(`No chart: ${reading.refusal}`);
    table = fallback;
    degraded = `Not charted: ${reading.refusal}`;
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

  /** The model's `present` call, answered from the recorded lookups. */
  const present = (args: Record<string, unknown>): string => {
    const shape = args.shape ?? "table";
    if (shape !== "table" && shape !== "chart") {
      return refuse(`'${String(shape)}' is not a shape you can ask for; ask for a table or a chart.`);
    }
    const lookup = typeof args.lookup === "string" ? args.lookup.trim() : "";
    const recorded = lookups.get(lookup);
    if (!recorded) {
      const made = [...lookups.keys()];
      const error =
        `No ${lookup || "named"} lookup ran this turn, so there are no rows to ${shape === "chart" ? "chart" : "table"}.` +
        (made.length ? ` Lookups that did: ${made.join(", ")}.` : "");
      return shape === "chart" ? refuseChart(error) : refuse(error);
    }
    if (shape === "chart") return presentChart(lookup, recorded, args);
    const made = tableFrom(lookup, recorded, args, columnsOf(args));
    if (typeof made === "string") return refuse(made);
    // A table asked for in its own right replaces a fallback, and its reason.
    table = made;
    degraded = undefined;
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
      if (cards) {
        table = roadmapTable(cards);
        degraded = undefined;
      }
      return JSON.stringify({
        ...parsed,
        table_attached: cards !== undefined,
        ...(cards ? { row_count: cards.rows.length, note: cardTableNote(cards) } : {}),
      });
    },
    sourcesRead(read) {
      for (const source of read) if (!sources.has(source.url)) sources.set(source.url, source);
    },
    presentation() {
      if (!table && charts.length === 0 && !sources.size) return undefined;
      return {
        ...(table ? { table } : {}),
        ...(charts.length ? { charts: [...charts] } : {}),
        ...(table && degraded ? { degraded } : {}),
        ...(sources.size ? { sources: [...sources.values()] } : {}),
      };
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
  if (!table) {
    const takeaway = presentation?.charts?.find((c) => c.takeaway)?.takeaway;
    return { text: !prose.trim() && takeaway ? takeaway : prose, removed: 0 };
  }
  const stripped = withoutRepeatedRows(prose, table);
  if (!stripped.text.trim() && table.takeaway) return { text: table.takeaway, removed: stripped.removed };
  return stripped;
}

/**
 * The message's text copy: the prose, then each chart's top values, a table's
 * plain list and the ⚠️ line, in the order they post. What a notification
 * shows, a screen reader reads and the thread remembers.
 *
 * @param prose - The answer as it posts
 * @param presentation - What rides beneath it
 */
export function textCopy(prose: string, presentation: Presentation | undefined): string {
  if (!presentation) return prose;
  const charts = (presentation.charts ?? []).map(chartLine);
  let copy = charts.length ? [prose, "", ...charts].join("\n") : prose;
  if (presentation.table) copy = withResultList(copy, presentation.table);
  return presentation.degraded ? [copy, "", warningLine(presentation.degraded)].join("\n") : copy;
}

/** The ⚠️ line a degraded chart leaves, as it posts and as the text copy
 *  carries it. */
export function warningLine(sentence: string): string {
  return `⚠️ ${sentence}`;
}

/**
 * What the draft judge is shown of the presentation: each chart's values and
 * the table's plain list, or undefined when there is neither.
 *
 * @param presentation - What rides beneath the draft
 */
export function judgedList(presentation: Presentation | undefined): string | undefined {
  const lines = [
    ...(presentation?.charts ?? []).map(chartLine),
    ...(presentation?.table ? [resultList(presentation.table)] : []),
  ];
  return lines.length ? lines.join("\n") : undefined;
}
