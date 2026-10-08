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
// WHEN THERE IS NO CHART. A chart that cannot be drawn honestly is refused with
// one sentence for the reader: the list was partial (counting the first 30 of
// 41 would understate every bar), fewer than 3 points, a group field the rows
// do not carry, a measure that is not a number on every row, more groups than
// Slack draws, or labels that collide once cut to Slack's 20 characters. The
// presenter turns that into the lookup's rows as a result table and the
// sentence as a ⚠️ line.
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
  if (sums.size < MIN_POINTS) return { refusal: `only ${sums.size} group${sums.size === 1 ? "" : "s"} to compare.` };
  if (sums.size > MAX_POINTS[request.kind]) {
    return { refusal: `${sums.size} groups are more than a ${request.kind} chart shows (${MAX_POINTS[request.kind]}).` };
  }

  const trend = request.kind === "line" || request.kind === "area";
  const ordered = [...sums].sort(([a, x], [b, y]) =>
    trend ? a.localeCompare(b, undefined, { numeric: true }) : y - x || a.localeCompare(b),
  );
  const points = ordered.map(([label, value]) => ({ label: clip(label, LABEL_CHARS), value }));
  if (new Set(points.map((p) => p.label)).size !== points.length) {
    return { refusal: `two ${groupBy} values read the same in their first ${LABEL_CHARS} characters.` };
  }
  if (request.kind === "pie" && points.some((p) => p.value <= 0)) return { refusal: "a pie needs every value above zero." };

  const groupLabel = labelOf(groupBy);
  const valueLabel = measure ? labelOf(measure) : labelOf(noun);
  const takeaway = request.takeaway?.trim();
  return {
    chart: {
      kind: request.kind,
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
