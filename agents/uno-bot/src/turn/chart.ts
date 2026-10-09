// The chart — a bar, line, area or pie chart of a lookup's rows, grouped and
// counted by code, beneath an answer (CONTEXT.md § result table).
//
// THE NUMBERS ARE CODE'S. The model names the lookup, the field to group its
// rows by and, optionally, a numeric field to sum; every point is a count or a
// sum this module computed from the rows that lookup really returned. So a
// derived number — "3 cards are WIP" — is grounded the way a fetched one is:
// the presenter hands the same values back to the model in the call's result,
// the text copy repeats them, and the draft judge reads them.
//
// A COUNT ACROSS LOOKUPS. Some counts take one lookup per group — cards per
// Design Status is one `roadmap_query` per status, most of which list only
// their first 30 cards. Grouping one lookup's rows cannot draw that, so the
// model may name the field the calls were made with instead (`across`), and
// each call becomes one point: named by the value its own rows carry (the
// filter it was asked with only when it returned none), valued at the WHOLE
// count it reported (`matched`, never the rows it listed). Calls whose other
// filters differ count different things, so they are no chart; a call made
// without the field is passed over. Which of the field's values no call
// counted is the presenter's to say, from the source's own options.
//
// A CALL THAT READ ONLY PART OF ITS SOURCE is still a point: its count is what
// it read, a true lower bound, and the reading names it (`atLeast`) so the
// reader and the model are told "at least". The board's largest status holds
// more than one read can page through, so refusing would leave the question
// with no chart at all.
//
// WHEN THERE IS NO CHART. A chart that cannot be drawn honestly is refused with
// one sentence for the reader. Grouped by a field: the list was partial
// (counting the first 30 of 41 would understate every bar), a group field the
// rows do not carry, or a measure that is not a number on every row. Across
// lookups: a call that reported no whole count, or calls made with different
// other filters. Either way: fewer than 3
// points, more than Slack draws, or labels that collide once cut to Slack's 20
// characters. The presenter posts the sentence as a ⚠️ line, beneath the
// lookup's rows as a result table when one lookup's rows were being grouped.
//
// PURE: no Env, no Slack shape. What the chart looks like in Slack is
// `slack/chart-block.ts`'s; which charts a turn posts is
// `turn/presentation.ts`'s.

import { labelOf, listOf, nounOf, wholeCount } from "./result-table";

/** The chart kinds Slack's `data_visualization` block draws. */
export const CHART_KINDS = ["bar", "line", "area", "pie"] as const;
export type ChartKind = (typeof CHART_KINDS)[number];

/** One point: a group and its count or sum. */
export interface ChartPoint {
  label: string;
  value: number;
}

/** A chart, as data. */
export interface Chart {
  kind: ChartKind;
  /** Code's: "Cards by Design Status", at most 50 characters. */
  title: string;
  /** The lookup its rows came from. */
  lookup: string;
  /** The field the rows were grouped by. */
  groupBy: string;
  /** The field summed per group; null when the rows were counted. */
  measure: string | null;
  /** In display order: largest first for a bar or pie, label order for a
   *  line or area, which trend. */
  points: ChartPoint[];
  /** What a point measures, for the series name and the y axis. */
  valueLabel: string;
  /** What the groups are, for the x axis. */
  groupLabel: string;
  /** The total across every point. */
  total: number;
  /** The model's one-line takeaway. */
  takeaway?: string;
}

/** What the model asked for. */
export interface ChartRequest {
  kind: ChartKind;
  groupBy: string;
  /** A numeric field to sum; absent counts the rows. */
  measure?: string;
  /** The key of the list in the lookup's result; its first list when absent. */
  list?: string;
  takeaway?: string;
}

/** A chart, or the one sentence that says why there is none — worded for the
 *  reader, since it becomes the ⚠️ line under the fallback table. */
export type ChartReading = { chart: Chart } | { refusal: string };

/** Fewer points than this compare nothing. */
const MIN_POINTS = 3;
/** Points Slack draws: 20 categories on a bar, line or area, 12 pie segments. */
const MAX_POINTS: Record<ChartKind, number> = { bar: 20, line: 20, area: 20, pie: 12 };
/** Slack's limits on a label, a series name and the title. */
export const LABEL_CHARS = 20;
export const TITLE_CHARS = 50;

/** The label a row with no value in the group field is counted under. */
const NO_VALUE = "None";

const clip = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

type Record_ = Record<string, unknown>;

/** The rows a chart may count, and how many matched in all. A Roadmap title
 *  search counts only the cards that contain the phrase, as its table shows. */
function rowsOf(lookup: string, result: Record_, key: string | undefined): { rows: Record_[]; total: number; noun: string } | null {
  if (lookup === "roadmap_query") {
    const all = Array.isArray(result.cards) ? (result.cards as Record_[]) : [];
    const filters = (result.filters ?? {}) as Record_;
    const titled = typeof filters.title === "string" && filters.title;
    const rows = titled ? all.filter((c) => c.title_match === "contains") : all;
    const whole = titled ? result.contains_count : result.matched;
    return { rows, total: typeof whole === "number" ? Math.max(whole, rows.length) : rows.length, noun: "cards" };
  }
  const list = listOf(result, key);
  if (!list) return null;
  return { rows: list.rows, total: Math.max(wholeCount(result, list.key) ?? 0, list.rows.length), noun: nounOf(list.key, 2) };
}

const groupKey = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return NO_VALUE;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "yes" : "no";
  return null;
};

/**
 * A chart of one lookup's rows, or the sentence saying why there is none.
 *
 * @param lookup - The tool that ran
 * @param result - What it answered, parsed
 * @param request - The model's choice of kind, group field and measure
 */
export function chartOf(lookup: string, result: Record_, request: ChartRequest): ChartReading {
  const found = rowsOf(lookup, result, request.list);
  if (!found || found.rows.length === 0) return { refusal: `the ${lookup} result holds no rows to count.` };
  const { rows, total, noun } = found;
  if (total > rows.length || result.truncated === true) {
    return {
      refusal:
        total > rows.length
          ? `the lookup returned only the first ${rows.length} of ${total} ${noun}, so every count would be short.`
          : `the lookup read only part of the source, so every count could be short.`,
    };
  }

  const groupBy = request.groupBy.trim();
  if (!rows.some((r) => r[groupBy] !== undefined)) return { refusal: `the ${noun} carry no ${groupBy} field to group by.` };
  const measure = request.measure?.trim() || null;
  if (measure && !rows.every((r) => typeof r[measure] === "number" && Number.isFinite(r[measure]))) {
    return { refusal: `${measure} is not a number on every one of the ${noun}, so it cannot be summed.` };
  }

  const sums = new Map<string, number>();
  for (const row of rows) {
    const key = groupKey(row[groupBy]);
    if (key === null) return { refusal: `${groupBy} holds lists or records, which cannot be grouped.` };
    sums.set(key, (sums.get(key) ?? 0) + (measure ? (row[measure] as number) : 1));
  }
  return drawn(lookup, request.kind, sums, { groupBy, measure, noun, ...(request.takeaway ? { takeaway: request.takeaway } : {}) });
}

/** A chart of grouped values, or why there is none: the checks every chart
 *  answers to, whichever way its values were counted. */
function drawn(
  lookup: string,
  kind: ChartKind,
  sums: Map<string, number>,
  of: { groupBy: string; measure: string | null; noun: string; takeaway?: string },
): ChartReading {
  const { groupBy, measure, noun } = of;
  if (sums.size < MIN_POINTS) return { refusal: `only ${sums.size} group${sums.size === 1 ? "" : "s"} to compare.` };
  if (sums.size > MAX_POINTS[kind]) {
    return { refusal: `${sums.size} groups are more than a ${kind} chart shows (${MAX_POINTS[kind]}).` };
  }

  const trend = kind === "line" || kind === "area";
  const ordered = [...sums].sort(([a, x], [b, y]) =>
    trend ? a.localeCompare(b, undefined, { numeric: true }) : y - x || a.localeCompare(b),
  );
  const points = ordered.map(([label, value]) => ({ label: clip(label, LABEL_CHARS), value }));
  if (new Set(points.map((p) => p.label)).size !== points.length) {
    return { refusal: `two ${groupBy} values read the same in their first ${LABEL_CHARS} characters.` };
  }
  if (kind === "pie" && points.some((p) => p.value <= 0)) return { refusal: "a pie needs every value above zero." };

  const groupLabel = labelOf(groupBy);
  const valueLabel = measure ? labelOf(measure) : labelOf(noun);
  const takeaway = of.takeaway?.trim();
  return {
    chart: {
      kind,
      title: clip(`${valueLabel} by ${groupLabel}`, TITLE_CHARS),
      lookup,
      groupBy,
      measure,
      points,
      valueLabel: clip(valueLabel, LABEL_CHARS),
      groupLabel: clip(groupLabel, TITLE_CHARS),
      total: points.reduce((n, p) => n + p.value, 0),
      ...(takeaway ? { takeaway } : {}),
    },
  };
}

/** One call of a lookup, as the presenter recorded it. */
export interface LookupCall {
  args: Record_;
  result: Record_;
}

/** What the model asked for when each call of a lookup is one point. */
export interface AcrossRequest {
  kind: ChartKind;
  /** The field each call was made with, which names its point. */
  across: string;
  list?: string;
  takeaway?: string;
}

/** A value a call read only part of, and the count it read: at least that. */
export interface LowerBound {
  name: string;
  value: number;
}

/** A chart across lookups, with the full name of every value it counted (its
 *  points' labels are cut to Slack's 20 characters) and those whose count is
 *  only a lower bound. */
export type AcrossReading =
  | { chart: Chart; counted: string[]; atLeast: LowerBound[]; calls: LookupCall[] }
  | { refusal: string };

/** Flags a lookup sets when what it counted is not the whole match. */
const PARTIAL_FLAGS = ["truncated", "partial", "has_more", "hasMore", "more"] as const;

/** A call's filters: the ones its result echoes, else the ones it was asked
 *  with. */
function filtersOf(call: LookupCall): Record_ {
  const echoed = call.result.filters;
  return typeof echoed === "object" && echoed !== null && !Array.isArray(echoed) ? (echoed as Record_) : call.args;
}

/** A filter value as a name, or null when the call was not made with one. */
function nameOf(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/** Every filter but `across`, as one comparable string, and as words for a
 *  refusal: `person "Bill"`, or `no other filter`. */
function otherFilters(call: LookupCall, across: string): { key: string; words: string } {
  const others = Object.entries(filtersOf(call))
    .filter(([field, value]) => field !== across && field !== "as_table" && nameOf(value) !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  return {
    key: JSON.stringify(others),
    words: others.length ? others.map(([field, value]) => `${field} "${nameOf(value)}"`).join(", ") : "no other filter",
  };
}

/** The whole count a call reported — never the rows it listed, which stop at
 *  the first 30. Roadmap enumerations report it as `matched`. */
function wholeOf(lookup: string, result: Record_, key: string | undefined): number | undefined {
  if (lookup === "roadmap_query") return typeof result.matched === "number" ? result.matched : undefined;
  return wholeCount(result, listOf(result, key)?.key ?? key ?? "");
}

/** What a call's rows are, for the axis: "cards" for the Roadmap. */
function nounFor(lookup: string, result: Record_, key: string | undefined): string {
  if (lookup === "roadmap_query") return "cards";
  const list = listOf(result, key);
  return list ? nounOf(list.key, 2) : "rows";
}

/** The value a call counted, as its own rows spell it; the filter it was asked
 *  with only when it returned no rows to read. */
function countedName(call: LookupCall, across: string, list: string | undefined): string | null {
  const rows = Array.isArray(call.result.cards) ? (call.result.cards as Record_[]) : (listOf(call.result, list)?.rows ?? []);
  for (const row of rows) {
    const own = nameOf(row?.[across]);
    if (own) return own;
  }
  return nameOf(filtersOf(call)[across]) ?? nameOf(call.args[across]);
}

/**
 * A chart with one point per call of a lookup, each valued at the whole count
 * that call reported, or the sentence saying why there is none.
 *
 * Only calls made with `across` are points; a call made without it (a lookup by
 * person alone) is passed over. The points must answer one question, so every
 * call's other filters must match — a WIP count for Bill beside a Shipped count
 * for the whole board compares nothing — and the chart is refused when they do
 * not. Two calls that counted the same value, in any case, are one point: the
 * later is a retry. A call that read only part of its source is a point at the
 * count it read, named in `atLeast`.
 *
 * @param lookup - The tool that ran, once per group
 * @param calls - Every call of it this turn, in the order made
 * @param request - The model's choice of kind and the field the calls differ by
 */
export function chartAcross(lookup: string, calls: readonly LookupCall[], request: AcrossRequest): AcrossReading {
  const across = request.across.trim();
  const made = calls.filter((call) => nameOf(filtersOf(call)[across]) ?? nameOf(call.args[across]));
  if (!made.length) return { refusal: `no ${lookup} lookup this turn was made with a ${across} to count by.` };

  const filterSets = new Map(made.map((call) => [otherFilters(call, across).key, otherFilters(call, across).words]));
  if (filterSets.size > 1) {
    return {
      refusal: `the ${lookup} lookups were made with different filters besides ${across} (${[...filterSets.values()].join("; ")}), so their counts do not compare.`,
    };
  }

  const byValue = new Map<string, { name: string; call: LookupCall }>();
  for (const call of made) {
    const name = countedName(call, across, request.list)!;
    byValue.set(name.toLowerCase(), { name, call });
  }

  const sums = new Map<string, number>();
  const atLeast: LowerBound[] = [];
  for (const { name, call } of byValue.values()) {
    const whole = wholeOf(lookup, call.result, request.list);
    if (whole === undefined) return { refusal: `the ${name} lookup reported no whole count, only the rows it listed.` };
    sums.set(name, whole);
    if (PARTIAL_FLAGS.some((flag) => call.result[flag] === true)) atLeast.push({ name, value: whole });
  }

  const first = made[0]!.result;
  const reading = drawn(lookup, request.kind, sums, {
    groupBy: across,
    measure: null,
    noun: nounFor(lookup, first, request.list),
    ...(request.takeaway ? { takeaway: request.takeaway } : {}),
  });
  if ("refusal" in reading) return reading;
  const counted = [...byValue.values()];
  return { chart: reading.chart, counted: counted.map((c) => c.name), atLeast, calls: counted.map((c) => c.call) };
}

/**
 * The values a chart across lookups left out: those the source offers that no
 * lookup counted, in the source's order, matched ignoring case.
 *
 * @param counted - The values the chart counted, in full
 * @param options - Every value the source offers for the field
 */
export function uncountedOf(counted: readonly string[], options: readonly string[]): string[] {
  const seen = new Set(counted.map((c) => c.toLowerCase()));
  return options.filter((o) => !seen.has(o.toLowerCase()));
}

/** How many of a chart's points its text line names. */
const TOP_VALUES = 5;

/**
 * A chart as one line of the text copy: its title and its top values,
 * "Cards by Design Status: WIP 3 · Under Review 2 · Shipped 1". What a
 * notification shows, and what a reader whose client draws no chart reads.
 *
 * @param chart - The chart it describes
 */
export function chartLine(chart: Chart): string {
  const top = [...chart.points].sort((a, b) => b.value - a.value).slice(0, TOP_VALUES);
  const more = chart.points.length - top.length;
  return `${chart.title}: ${top.map((p) => `${p.label} ${p.value}`).join(" · ")}${more > 0 ? ` · ${more} more` : ""}`;
}
