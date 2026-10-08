// A chart, as Slack's `data_visualization` block.
//
// The turn hands over the chart as DATA (`turn/chart.ts`), its labels and title
// already within Slack's limits (20 and 50 characters), and this is where it
// becomes Slack's: a pie is segments; a bar, line or area is one series over
// categories in display order, with every category given a point, as the block
// reference requires. Slack draws at most 2 per message, which the presenter
// holds to.
//
// @slack/types has no type for this block, so it is spelled here. Pure: no
// Env, no client. The rules the block is held to in the suite are in
// `tests/helpers/slack-block-rules.ts`.

import type { Chart } from "../turn/chart";

/** A pie slice. */
interface Segment {
  label: string;
  value: number;
}

/** One series of a bar, line or area chart. */
interface DataSeries {
  name: string;
  data: Segment[];
}

/** Slack's `data_visualization` block, as far as the Worker sends it. */
export interface DataVisualizationBlock {
  type: "data_visualization";
  title: string;
  chart:
    | { type: "pie"; segments: Segment[] }
    | {
        type: "bar" | "line" | "area";
        series: DataSeries[];
        axis_config: { categories: string[]; x_label?: string; y_label?: string };
      };
}

/**
 * The `data_visualization` block for a chart.
 *
 * @param chart - The chart, as the presenter built it
 */
export function chartBlock(chart: Chart): DataVisualizationBlock {
  const data = chart.points.map(({ label, value }) => ({ label, value }));
  if (chart.kind === "pie") return { type: "data_visualization", title: chart.title, chart: { type: "pie", segments: data } };
  return {
    type: "data_visualization",
    title: chart.title,
    chart: {
      type: chart.kind,
      series: [{ name: chart.valueLabel, data }],
      axis_config: { categories: data.map((p) => p.label), x_label: chart.groupLabel, y_label: chart.valueLabel },
    },
  };
}
