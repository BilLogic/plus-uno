// Numbers that compare or trend reach the person as a chart: the model asks
// with `present`, naming the lookup, the field to group by and what to measure,
// and code counts or sums the groups from what that lookup returned this turn.
// A chart that cannot be grounded posts the lookup's rows as a result table,
// with a ⚠️ line saying why.
//
// Driven across `runTurn` on the Turn harness, then what Delivery was handed is
// posted on the recording posting client, which holds it to the block rules
// Slack holds it to. Asserted: what Delivery was handed, what the model was
// told, what Slack receives and what the message's text says.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall, type Presentation } from "../src/turn/index";
import { postTextVerified } from "../src/slack/delivery";
import { harness, request } from "./helpers/turn-harness";
import { expectRefusals, recordingPosting } from "./helpers/recording-slack";

type Call = { name: string; args: Record<string, unknown> };

/** One Roadmap card as `roadmap_query` reports it. */
const card = (n: number, status: string) => ({
  title: `Card ${n}`,
  url: `https://www.notion.so/card-${n}`,
  card_number: 400 + n,
  design_status: status,
  dev_status: null,
  people: { Contributor: ["Bill Guo"] },
});

/** Bill's cards: 3 WIP, 2 Under Review, 1 Shipped — unless the statuses say otherwise. */
function roadmapResult(statuses = ["WIP", "Under Review", "WIP", "Shipped", "WIP", "Under Review"], extra: Record<string, unknown> = {}): string {
  const cards = statuses.map((s, i) => card(i + 1, s));
  return JSON.stringify({ ok: true, filters: { person: "Bill" }, count: cards.length, matched: cards.length, truncated: false, cards, ...extra });
}

const ROADMAP: Call = { name: "roadmap_query", args: { person: "Bill" } };

const chartOf = (args: Record<string, unknown> = {}): Call => ({
  name: "present",
  args: { shape: "chart", lookup: "roadmap_query", chart: "bar", group_by: "design_status", takeaway: "Half of Bill's cards are WIP.", ...args },
});

/** Run one turn: the lookups, the model's `present` calls, then its prose. */
async function turn(presents: Call[], opts: { result?: string; lookups?: Call[]; prose?: string; resultFor?: (name: string) => string } = {}) {
  const h = harness({
    replies: [
      ...(opts.lookups ?? [ROADMAP]).map((c) => ({ toolCalls: [c] })),
      ...presents.map((c) => ({ toolCalls: [c] })),
      { text: opts.prose ?? "**Half of Bill's cards are WIP.** The rest are mostly under review." },
    ],
    toolResultFor: opts.resultFor ?? ((name) => (name === "roadmap_query" ? (opts.result ?? roadmapResult()) : "{}")),
  });
  await runTurn(request({ text: "how are Bill's cards spread across Design Status?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  const told = h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .filter((r) => r.name === "present")
    .map((r) => JSON.parse(r.text) as Record<string, unknown>);
  return { answer, presentation: answer.presentation, told };
}

type Block = Record<string, unknown> & { type: string };

/** Post the prose and its presentation, as the Slack path does. */
async function posted(prose: string, presentation: Presentation | undefined, opts: Parameters<typeof recordingPosting>[0] = {}) {
  const slack = recordingPosting(opts);
  const result = await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", prose, { userId: "U1", team: "T1" }, undefined, {
    ...(presentation ? { presentation } : {}),
  });
  const messages = slack.of("message");
  const last = messages.at(-1)!;
  return { slack, result, messages, text: last.text, blocks: (last.blockList ?? []) as Block[] };
}

const contextText = (block: Block): string =>
  ((block.elements as Array<{ text?: string }> | undefined) ?? []).map((e) => e.text ?? "").join(" ");

test("a Roadmap status count posts as a bar chart whose values are the lookup's own counts", async () => {
  const { presentation, told, answer } = await turn([chartOf()]);

  const chart = presentation?.charts?.[0];
  assert.ok(chart, "a chart rides with the answer");
  assert.equal(chart.kind, "bar");
  assert.deepEqual(chart.points, [
    { label: "WIP", value: 3 },
    { label: "Under Review", value: 2 },
    { label: "Shipped", value: 1 },
  ]);
  assert.equal(presentation?.table, undefined, "no table beside a grounded chart");
  assert.equal(told[0]!.chart_attached, true);
  assert.deepEqual(told[0]!.values, { WIP: 3, "Under Review": 2, Shipped: 1 }, "the model is handed code's counts");
  assert.equal(told[0]!.total, 6);

  const { blocks, text } = await posted(answer.text, presentation);
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "data_visualization", "container", "context"], "the chart, then the Sources box and the footer");
  assert.deepEqual(blocks[1], {
    type: "data_visualization",
    title: "Cards by Design Status",
    chart: {
      type: "bar",
      series: [
        {
          name: "Cards",
          data: [
            { label: "WIP", value: 3 },
            { label: "Under Review", value: 2 },
            { label: "Shipped", value: 1 },
          ],
        },
      ],
      axis_config: { categories: ["WIP", "Under Review", "Shipped"], x_label: "Design Status", y_label: "Cards" },
    },
  });
  assert.match(text, /^Cards by Design Status: WIP 3 · Under Review 2 · Shipped 1$/m, "the top values are in the text copy");
});

test("a pie chart is segments; a line chart runs in label order and sums the measure it was asked for", async () => {
  const rows = [
    { week: "2026-09-14", sessions: 40, title: "Week 1" },
    { week: "2026-09-07", sessions: 31, title: "Week 0" },
    { week: "2026-09-21", sessions: 12, title: "Week 2a" },
    { week: "2026-09-21", sessions: 30, title: "Week 2b" },
  ];
  const result = JSON.stringify({ ok: true, rows });
  const lookup: Call = { name: "search_blueprint", args: {} };
  const resultFor = (name: string) => (name === "search_blueprint" ? result : "{}");

  const line = await turn([chartOf({ lookup: "search_blueprint", chart: "line", group_by: "week", measure: "sessions" })], {
    lookups: [lookup],
    resultFor,
  });
  assert.deepEqual(line.presentation?.charts?.[0]?.points, [
    { label: "2026-09-07", value: 31 },
    { label: "2026-09-14", value: 40 },
    { label: "2026-09-21", value: 42 },
  ]);
  const { blocks } = await posted(line.answer.text, line.presentation);
  const viz = blocks.find((b) => b.type === "data_visualization") as unknown as { title: string; chart: { type: string } };
  assert.equal(viz.title, "Sessions by Week");
  assert.equal(viz.chart.type, "line");

  const pie = await turn([chartOf({ chart: "pie" })]);
  const { blocks: pieBlocks } = await posted(pie.answer.text, pie.presentation);
  assert.deepEqual((pieBlocks[1] as unknown as { chart: unknown }).chart, {
    type: "pie",
    segments: [
      { label: "WIP", value: 3 },
      { label: "Under Review", value: 2 },
      { label: "Shipped", value: 1 },
    ],
  });
});

test("fewer than 3 points falls back to the result table, with a ⚠️ line in the blocks and the text", async () => {
  const { presentation, told, answer } = await turn([chartOf()], { result: roadmapResult(["WIP", "WIP", "Shipped"]) });

  assert.equal(presentation?.charts, undefined, "no chart");
  assert.ok(presentation?.table, "the rows post as a table");
  assert.equal(presentation.table.lookup, "roadmap_query");
  assert.match((presentation.warnings ?? []).join("\n"), /only 2 groups/);
  assert.equal(told[0]!.chart_attached, false);
  assert.equal(told[0]!.table_attached, true);
  assert.match(String(told[0]!.error), /only 2 groups/);

  const { blocks, text } = await posted(answer.text, presentation);
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "data_table", "context", "container", "context"], "the table, its ⚠️ line, the Sources box, the footer");
  assert.match(contextText(blocks[2]!), /^⚠️ Not charted: only 2 groups/);
  assert.match(text, /⚠️ Not charted: only 2 groups/, "the sentence is in the message text");
});

test("values that cannot be grounded fall back too: a partial list, or a measure that is not a number", async () => {
  const partial = await turn([chartOf()], { result: roadmapResult(undefined, { matched: 41 }) });
  assert.equal(partial.presentation?.charts, undefined);
  assert.ok(partial.presentation?.table);
  assert.match((partial.presentation?.warnings ?? []).join("\n"), /first 6 of 41/);

  const words = await turn([chartOf({ measure: "dev_status" })]);
  assert.equal(words.presentation?.charts, undefined);
  assert.match((words.presentation?.warnings ?? []).join("\n"), /dev_status/);

  const missing = await turn([chartOf({ group_by: "pillar" })]);
  assert.equal(missing.presentation?.charts, undefined);
  assert.match(String(missing.told[0]!.error), /pillar/);
});

test("a chart request naming a lookup the turn never made is refused, and no chart or table posts", async () => {
  const { presentation, told } = await turn([chartOf({ lookup: "search_blueprint" })]);

  assert.equal(presentation?.charts, undefined);
  assert.equal(presentation?.table, undefined);
  assert.equal(told[0]!.chart_attached, false);
  assert.match(String(told[0]!.error), /No search_blueprint lookup ran this turn/);
});

test("at most 2 charts per message; labels and the title are held to Slack's limits", async () => {
  const long = ["A status name well past twenty characters", "Another status much longer than twenty", "WIP"];
  const { presentation, told, answer } = await turn([chartOf(), chartOf({ chart: "pie" }), chartOf({ chart: "line" })], {
    result: roadmapResult(long),
  });

  assert.equal(presentation?.charts?.length, 2);
  assert.equal(told[2]!.chart_attached, false);
  assert.match(String(told[2]!.error), /2 charts/);
  for (const point of presentation!.charts![0]!.points) assert.ok(point.label.length <= 20, point.label);

  const { blocks } = await posted(answer.text, presentation);
  assert.equal(blocks.filter((b) => b.type === "data_visualization").length, 2);
});

test("a chart Slack refuses steps down to the prose with the values as text, never losing the answer", async () => {
  const { presentation, answer } = await turn([chartOf()]);

  const { slack, messages, blocks, text, result } = await posted(answer.text, presentation, { refusesBlockTypes: ["data_visualization"] });
  expectRefusals(slack.refused);
  assert.equal(result.ok, true);
  assert.equal(messages.length, 2);
  // Only the chart steps down; the Sources box stays aboard.
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "container", "context"]);
  assert.match(String(blocks[0]!.text), /Cards by Design Status: WIP 3 · Under Review 2 · Shipped 1/);
  assert.match(text, /WIP 3/);
});
