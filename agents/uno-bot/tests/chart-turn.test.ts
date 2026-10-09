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
import type { LoopBudget } from "../src/agent/loop";
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
  return JSON.stringify({ ok: true, board: { title: "Roadmap", url: "https://www.notion.so/roadmapdb" }, filters: { person: "Bill" }, count: cards.length, matched: cards.length, truncated: false, cards, ...extra });
}

const ROADMAP: Call = { name: "roadmap_query", args: { person: "Bill" } };

const chartOf = (args: Record<string, unknown> = {}): Call => ({
  name: "present",
  args: { shape: "chart", lookup: "roadmap_query", chart: "bar", group_by: "design_status", takeaway: "Half of Bill's cards are WIP.", ...args },
});

/** Run one turn: the lookups, the model's `present` calls, then its prose. */
async function turn(
  presents: Call[],
  opts: {
    result?: string;
    lookups?: Call[];
    prose?: string;
    resultFor?: (name: string, args: Record<string, unknown>) => string;
    options?: readonly string[];
  } = {},
) {
  const h = harness({
    replies: [
      ...(opts.lookups ?? [ROADMAP]).map((c) => ({ toolCalls: [c] })),
      ...presents.map((c) => ({ toolCalls: [c] })),
      { text: opts.prose ?? "**Half of Bill's cards are WIP.** The rest are mostly under review." },
    ],
    toolResultFor: opts.resultFor ?? ((name) => (name === "roadmap_query" ? (opts.result ?? roadmapResult()) : "{}")),
    ...(opts.options
      ? {
          lookupOptions: async (lookup: string, field: string) =>
            lookup === "roadmap_query" && field === "design_status" ? opts.options! : null,
        }
      : {}),
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


// ── A count across lookups: one roadmap_query per Design Status ─────────────

/** The board's Design Statuses, in its own spelling, and how many cards each
 *  holds. */
const BOARD: Array<[string, number]> = [
  ["Need PRD / Under Playground", 41],
  ["Ready for Design", 12],
  ["WIP", 33],
  ["Under Review", 7],
  ["Under Dev", 4],
  ["Shipped", 58],
  ["Archived", 0],
];
const OPTIONS = BOARD.map(([status]) => status);

/** `roadmap_query` as it answers an enumeration: its first 30 cards listed,
 *  the whole count in `matched`, its filters echoed. The cards carry the
 *  board's spelling of the status, whatever the call asked with. */
function statusResult(args: Record<string, unknown>, extra: Record<string, unknown> = {}): string {
  const asked = String(args.design_status ?? "");
  const row = BOARD.find(([s]) => s.toLowerCase() === asked.toLowerCase());
  const matched = row?.[1] ?? 0;
  const cards = Array.from({ length: Math.min(matched, 30) }, (_, i) => card(i + 1, row?.[0] ?? asked));
  const filters = { ...(asked ? { design_status: asked } : {}), ...(args.person ? { person: args.person } : {}) };
  return JSON.stringify({ ok: true, filters, count: cards.length, matched, truncated: false, cards, ...extra });
}

const statusCall = (design_status: string, more: Record<string, unknown> = {}): Call => ({
  name: "roadmap_query",
  args: { design_status, ...more },
});

/** One turn's lookups, each answered by `statusResult` unless `override`
 *  answers it first. */
const across = (lookups: Call[], override?: (args: Record<string, unknown>) => string | undefined) => ({
  lookups,
  resultFor: (name: string, args: Record<string, unknown>) =>
    name === "roadmap_query" ? (override?.(args) ?? statusResult(args)) : "{}",
});

const acrossStatuses = (args: Record<string, unknown> = {}): Call => ({
  name: "present",
  args: {
    shape: "chart",
    lookup: "roadmap_query",
    chart: "bar",
    across: "design_status",
    takeaway: "Shipped and Need PRD hold most of the board.",
    ...args,
  },
});

const everyStatus = BOARD.map(([status]) => statusCall(status));

test("one lookup per Design Status charts one bar per status; lists cut to 30 chart their whole count", async () => {
  const { presentation, told, answer } = await turn([acrossStatuses()], { ...across(everyStatus), options: OPTIONS });

  const chart = presentation?.charts?.[0];
  assert.ok(chart, "a chart rides with the answer");
  assert.equal(chart.kind, "bar");
  assert.equal(chart.title, "Cards by Design Status");
  assert.deepEqual(chart.points, [
    { label: "Shipped", value: 58 },
    { label: "Need PRD / Under Pl…", value: 41 },
    { label: "WIP", value: 33 },
    { label: "Ready for Design", value: 12 },
    { label: "Under Review", value: 7 },
    { label: "Under Dev", value: 4 },
    { label: "Archived", value: 0 },
  ]);
  assert.equal(presentation?.table, undefined, "no table beside a grounded chart");
  assert.equal(presentation?.warnings, undefined, "every status was counted, each whole");
  assert.equal(told[0]!.chart_attached, true);
  assert.equal(told[0]!.total, 155, "the model is handed code's total");

  const { blocks, text } = await posted(answer.text, presentation);
  assert.ok(blocks.some((b) => b.type === "data_visualization"), "Slack draws the chart");
  assert.match(
    text,
    /^Cards by Design Status: Shipped 58 · Need PRD \/ Under Pl… 41 · WIP 33 · Ready for Design 12 · Under Review 7 · 2 more$/m,
  );
});

test("a bar is named by its cards' own status; the same status asked twice is one bar", async () => {
  const lookups = [statusCall("wip"), statusCall("Under Review"), statusCall("WIP"), statusCall("Archived"), statusCall("Shipped")];
  const { presentation } = await turn([acrossStatuses()], across(lookups));

  assert.deepEqual(presentation?.charts?.[0]?.points, [
    { label: "Shipped", value: 58 },
    { label: "WIP", value: 33 },
    { label: "Under Review", value: 7 },
    { label: "Archived", value: 0 },
  ]);
});

test("a status the board offers and no lookup counted is named in a ⚠️ line under the chart", async () => {
  const lookups = [statusCall("WIP"), statusCall("Under Review"), statusCall("Shipped")];
  const { presentation, answer } = await turn([acrossStatuses()], { ...across(lookups), options: OPTIONS });

  assert.equal(presentation?.charts?.length, 1, "the chart still posts");
  const lines = (presentation?.warnings ?? []).join("\n");
  assert.match(lines, /Need PRD \/ Under Playground, Ready for Design, Under Dev and Archived/);
  assert.match(lines, /not counted/i);

  const { text } = await posted(answer.text, presentation);
  assert.match(text, /^⚠️ .*Under Dev and Archived/m, "the reader sees which statuses are missing");
});

test("calls are one chart only when their other filters match: a person-only call is passed over, a mix is refused", async () => {
  const passedOver = await turn(
    [acrossStatuses()],
    across([statusCall("WIP"), ROADMAP, statusCall("Under Review"), statusCall("Shipped")]),
  );
  assert.deepEqual(
    passedOver.presentation?.charts?.[0]?.points.map((p) => p.label),
    ["Shipped", "WIP", "Under Review"],
    "the call with no status is no bar",
  );

  const sameStatusTwice = await turn(
    [acrossStatuses()],
    across([statusCall("WIP"), statusCall("WIP", { person: "Bill" }), statusCall("Under Review"), statusCall("Shipped")]),
  );
  const mixed = await turn(
    [acrossStatuses()],
    across([statusCall("WIP", { person: "Bill" }), statusCall("Under Review", { person: "Bill" }), statusCall("Shipped")]),
  );
  for (const refused of [sameStatusTwice, mixed]) {
    assert.equal(refused.presentation?.charts, undefined);
    assert.equal(refused.presentation?.table, undefined, "no one list of rows to fall back to");
    assert.equal(refused.told[0]!.chart_attached, false);
    assert.match(String(refused.told[0]!.error), /person/, "the refusal names the filter that differs");
    assert.match((refused.presentation?.warnings ?? []).join("\n"), /^Not charted: .*person/m);
  }
});

test("a lookup with no whole count refuses the chart, and the model is not asked to type the counts", async () => {
  const withoutMatched = (a: Record<string, unknown>): string | undefined => {
    if (a.design_status !== "Under Review") return undefined;
    const { matched: _drop, ...rest } = JSON.parse(statusResult(a)) as Record<string, unknown>;
    return JSON.stringify(rest);
  };
  const { presentation, told } = await turn([acrossStatuses()], across(everyStatus, withoutMatched));

  assert.equal(presentation?.charts, undefined);
  assert.match(String(told[0]!.error), /Under Review.*no whole count/);
  assert.match((presentation?.warnings ?? []).join("\n"), /Not charted:/);
  assert.doesNotMatch(String(told[0]!.note), /give the counts|list them|type/i, "no counts to type");
});

/** Need PRD as a read cut short returns it: the first 30 of the 500 cards it
 *  managed to read, `truncated` because the board holds more. */
const needPrdCut = (a: Record<string, unknown>): string | undefined =>
  a.design_status === "Need PRD / Under Playground" ? statusResult(a, { matched: 500, truncated: true }) : undefined;

test("a status read cut short still charts: its bar is the count read, and a ⚠️ line says it is at least that", async () => {
  const { presentation, told, answer } = await turn([acrossStatuses()], { ...across(everyStatus, needPrdCut), options: OPTIONS });

  const chart = presentation?.charts?.[0];
  assert.ok(chart, "the chart draws");
  assert.deepEqual(chart.points[0], { label: "Need PRD / Under Pl…", value: 500 });
  const lines = presentation?.warnings ?? [];
  assert.deepEqual(lines, ["Need PRD / Under Playground shows at least 500; the board has more than could be read."]);

  assert.equal(told[0]!.chart_attached, true);
  assert.deepEqual(told[0]!.at_least, { "Need PRD / Under Playground": 500 });
  assert.match(String(told[0]!.note), /at least/);

  const { text } = await posted(answer.text, presentation);
  assert.match(text, /^⚠️ Need PRD \/ Under Playground shows at least 500; the board has more than could be read\.$/m);
});

test("two statuses cut short share one ⚠️ line; has_more marks a lower bound too", async () => {
  const both = (a: Record<string, unknown>): string | undefined =>
    needPrdCut(a) ?? (a.design_status === "Shipped" ? statusResult(a, { has_more: true }) : undefined);
  const { presentation, told } = await turn([acrossStatuses()], across(everyStatus, both));

  assert.equal(presentation?.charts?.length, 1);
  assert.deepEqual(presentation?.warnings, [
    "Need PRD / Under Playground shows at least 500 and Shipped at least 58; the board has more than could be read.",
  ]);
  assert.deepEqual(told[0]!.at_least, { "Need PRD / Under Playground": 500, Shipped: 58 });
});

test("a status read the turn's budget cut short is still a bar, at least what it read", async () => {
  let trips = 0;
  const budget: LoopBudget = {
    used: () => 0,
    trips: () => trips,
    withLookupLimit: (_limit, fn) => fn(),
    isBudgetError: () => false,
    breakdown: () => "test",
  };
  const h = harness({
    replies: [
      ...everyStatus.map((c) => ({ toolCalls: [c] })),
      { toolCalls: [acrossStatuses()] },
      { text: "**Need PRD holds the most cards.**" },
    ],
    toolResultFor: (_name, args) => {
      const cut = needPrdCut(args);
      if (cut) trips += 1;
      return cut ?? statusResult(args);
    },
    budget,
  });
  await runTurn(request({ text: "How many Roadmap cards are in each Design Status?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");

  assert.deepEqual(answer?.presentation?.charts?.[0]?.points[0], { label: "Need PRD / Under Pl…", value: 500 });
  assert.match((answer?.presentation?.warnings ?? []).join("\n"), /Need PRD \/ Under Playground shows at least 500/);
  const read = h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .find((r) => r.name === "roadmap_query" && r.text.includes("Need PRD"));
  assert.match(String(read?.text), /cut short/, "the model still reads the stamp on the short read");
});

test("a card table one status lookup asked for does not post beside the chart that counts it", async () => {
  const lookups = [statusCall("WIP", { as_table: true }), statusCall("Under Review"), statusCall("Shipped")];
  const { presentation, told } = await turn([acrossStatuses()], across(lookups));

  assert.equal(presentation?.charts?.length, 1);
  assert.equal(presentation?.table, undefined, "the chart replaces the table");
  assert.equal(told[0]!.table_attached, false);
});

test("a chart asked to group by a field and across lookups at once is refused, naming both", async () => {
  const { presentation, told } = await turn([acrossStatuses({ group_by: "design_status" })], across(everyStatus));

  assert.equal(presentation?.charts, undefined);
  assert.match(String(told[0]!.error), /group_by.*across|across.*group_by/);
});

test("fewer than 3 statuses, or a field the calls were not made with, is no chart", async () => {
  const two = await turn([acrossStatuses()], across([statusCall("WIP"), statusCall("Shipped")]));
  assert.equal(two.presentation?.charts, undefined);
  assert.match(String(two.told[0]!.error), /only 2/);

  const unnamed = await turn([acrossStatuses({ across: "pillar" })], across(everyStatus));
  assert.equal(unnamed.presentation?.charts, undefined);
  assert.match(String(unnamed.told[0]!.error), /pillar/);
});
