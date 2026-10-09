// Any lookup's rows reach the person as a result table: the model asks with
// `present`, naming the lookup, up to 4 of its fields and a takeaway, and code
// fills every cell from what that lookup returned this turn.
//
// Driven across `runTurn` on the Turn harness, then the table Delivery was
// handed is posted on the recording posting client, which holds it to the
// block rules Slack holds it to. Asserted: what Delivery was handed, what the
// model was told, what Slack receives and what the thread remembers.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall, type ResultTable } from "../src/turn/index";
import { postTextVerified } from "../src/slack/delivery";
import { harness, request } from "./helpers/turn-harness";
import { recordingPosting } from "./helpers/recording-slack";
import { LOOKUP_CEILING } from "../src/agent/loop-policy";

/** One blueprint finding as `search_blueprint` reports it. */
function finding(n: number, over: Record<string, unknown> = {}) {
  return {
    title: `Pain point ${n}`,
    scenario: n % 2 ? "Employment & Access" : "Onboarding Modules",
    lane: "Regular Tutor",
    count: n,
    url: `https://blueprint.example/cell-${n}`,
    description: "A long description of what goes wrong, which runs on well past what a table cell can show. ".repeat(2),
    links: ["https://notion.example/page"],
    ...over,
  };
}

/** A blueprint search that found `n` findings, of `total` that matched. */
function blueprintResult(n: number, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    ok: true,
    query: "onboarding pain points",
    count: n,
    rows: Array.from({ length: n }, (_, i) => finding(i + 1)),
    notes: ["Cite the rows."],
    ...extra,
  });
}

const SEARCH = { name: "search_blueprint", args: { query: "onboarding pain points", filter_phase: "Onboarding" } };

const present = (args: Record<string, unknown>) => ({
  name: "present",
  args: { shape: "table", lookup: "search_blueprint", takeaway: "Clearance is the biggest snag.", ...args },
});

const COLUMNS = { columns: ["title", "scenario", "count"] };

/** Run one turn: the search, the model's `present`, then its prose. */
async function turn(presentArgs: Record<string, unknown>, opts: { result?: string; prose?: string; lookups?: unknown[] } = {}) {
  const h = harness({
    replies: [
      ...((opts.lookups ?? [SEARCH]) as Array<{ name: string; args: Record<string, unknown> }>).map((c) => ({ toolCalls: [c] })),
      { toolCalls: [present(presentArgs)] },
      { text: opts.prose ?? "**Clearance is the biggest snag.** Three of the pain points sit in Employment & Access." },
    ],
    toolResultFor: (name) => (name === "search_blueprint" ? (opts.result ?? blueprintResult(3)) : "{}"),
  });
  const outcome = await runTurn(request({ text: "where do tutors hit problems in onboarding?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  const told = h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .filter((r) => r.name === "present")
    .map((r) => JSON.parse(r.text) as Record<string, unknown>);
  return { h, outcome, answer, table: answer.presentation?.table, told: told.at(-1)! };
}

type Cell = { type: string; text?: string; value?: number; elements?: unknown[] };
type Block = { type: string; caption?: string; page_size?: number; rows?: Cell[][] };

/** Post the prose and its table, as the Slack path does, and hand back the data_table. */
async function posted(prose: string, table: ResultTable) {
  const slack = recordingPosting();
  const result = await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", prose, { userId: "U1", team: "T1" }, undefined, {
    presentation: { table },
  });
  const [message] = slack.of("message");
  const blocks = (message?.blockList ?? []) as Block[];
  return { result, message: message!, blocks, dataTable: blocks.find((b) => b.type === "data_table")! };
}

test("a blueprint lookup's rows post as a result table beneath the prose, captioned by code", async () => {
  const { table, told, answer } = await turn(COLUMNS);

  assert.ok(table, "a table rides with the answer");
  assert.deepEqual(table.columns.map((c) => c.label), ["Title", "Scenario", "Count"]);
  assert.deepEqual(table.rows.map((r) => r.cells), [
    ["Pain point 1", "Employment & Access", 1],
    ["Pain point 2", "Onboarding Modules", 2],
    ["Pain point 3", "Employment & Access", 3],
  ]);
  assert.equal(table.caption, '3 rows · "onboarding pain points" · phase Onboarding');
  assert.equal(told.table_attached, true);
  assert.equal(told.row_count, 3);

  const { blocks, dataTable, message } = await posted(answer.text, table);
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "data_table", "context"]);
  assert.equal(dataTable.caption, '3 rows · "onboarding pain points" · phase Onboarding');
  assert.deepEqual(dataTable.rows![1]![0], {
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "link", url: "https://blueprint.example/cell-1", text: "Pain point 1" }] }],
  });
  assert.match(message.text, /^Pain point 2 — Onboarding Modules — 2$/m, "the text copy lists the rows");
});

test("the caption says when the list is partial: the first 30 of all that matched", async () => {
  const { table, told } = await turn(COLUMNS, { result: blueprintResult(41, { matched: 57, truncated: true }) });

  assert.equal(table!.rows.length, 30, "at most 30 rows");
  assert.equal(table!.caption, 'first 30 of 57 · "onboarding pain points" · phase Onboarding');
  assert.match(String(told.note), /partial/);
});

test("a number column is numbers throughout, header included in the column", async () => {
  const { table, answer } = await turn({ columns: ["scenario", "count"] });

  assert.deepEqual(table!.columns.map((c) => c.numeric), [false, true]);
  const { dataTable } = await posted(answer.text, table!);
  assert.deepEqual(dataTable.rows![0], [
    { type: "raw_text", text: "Scenario" },
    { type: "raw_text", text: "Count" },
  ]);
  assert.deepEqual(
    dataTable.rows!.slice(1).map((r) => r[1]),
    [1, 2, 3].map((n) => ({ type: "raw_number", value: n, text: String(n) })),
  );
});

test("columns come only from fields the rows have, and never long text, lists or more than 4", async () => {
  for (const [columns, why] of [
    [["title", "owner"], /'owner' is not a field these rows carry/],
    [["title", "description"], /long text/],
    [["title", "links"], /lists or records/],
    [["title", "scenario", "lane", "count", "url"], /At most 4 columns/],
  ] as const) {
    const { table, told } = await turn({ columns });

    assert.equal(table, undefined, `${columns.join(",")}: no table`);
    assert.equal(told.table_attached, false);
    assert.match(String(told.error), why);
    assert.match(String(told.note), /list them in your answer/);
  }
});

test("a request naming a lookup the turn never made is refused, and the answer posts as plain prose", async () => {
  const prose = "Three pain points:\n- Pain point 1 — Employment & Access\n- Pain point 2 — Onboarding Modules";
  const { table, told, answer, outcome } = await turn({ ...COLUMNS, lookup: "notion_search" }, { prose });

  assert.equal(table, undefined);
  assert.equal(told.table_attached, false);
  assert.match(String(told.error), /No notion_search lookup ran this turn/);
  assert.match(String(told.error), /search_blueprint/, "it names the lookups that did run");
  assert.equal(answer.text, prose, "the model's own list stands");
  assert.equal(outcome.wrote.turns.find((t) => t.role === "assistant")?.content, prose);
});

test("rows the prose types out again are taken out, whatever the lookup", async () => {
  const prose = [
    "**Clearance is the biggest snag.**",
    "",
    "- Pain point 1 — Employment & Access — 1",
    "- [Pain point 2](https://blueprint.example/cell-2) · Onboarding Modules",
    "Pain point 3 (scenario: Employment & Access, count 3)",
    "",
    "Pain point 3 is the one that blocks a first session.",
  ].join("\n");
  const { answer } = await turn(COLUMNS, { prose });

  assert.equal(
    answer.text,
    ["**Clearance is the biggest snag.**", "", "Pain point 3 is the one that blocks a first session."].join("\n"),
  );
});

test("one table per answer: of two requests, the last that produced one is the table", async () => {
  const h = harness({
    replies: [
      { toolCalls: [SEARCH] },
      { toolCalls: [present({ columns: ["title"] })] },
      { toolCalls: [present({ columns: ["title", "count"] })] },
      { toolCalls: [present({ columns: ["nope"] })] },
      { text: "Three pain points." },
    ],
    toolResultFor: (name) => (name === "search_blueprint" ? blueprintResult(3) : "{}"),
  });
  await runTurn(request({ text: "pain points?" }), h.deps);

  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.deepEqual(answer?.presentation?.table?.columns.map((c) => c.label), ["Title", "Count"]);
});

test("present on the Roadmap lookup posts its preset, exactly as the lookup's own as_table does", async () => {
  const cards = Array.from({ length: 3 }, (_, i) => ({
    title: `Card ${i + 1}`,
    url: `https://www.notion.so/card-${i + 1}`,
    card_number: 401 + i,
    design_status: "WIP",
    dev_status: null,
  }));
  const result = JSON.stringify({ ok: true, filters: { design_status: "WIP" }, count: 3, cards });
  const run = async (calls: Array<{ name: string; args: Record<string, unknown> }>) => {
    const h = harness({
      replies: [...calls.map((c) => ({ toolCalls: [c] })), { text: "Three cards." }],
      toolResultFor: () => result,
    });
    await runTurn(request({ text: "WIP?" }), h.deps);
    return h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer")?.presentation;
  };

  const viaPresent = await run([
    { name: "roadmap_query", args: { design_status: "WIP" } },
    { name: "present", args: { shape: "table", lookup: "roadmap_query", columns: ["title"], takeaway: "Three." } },
  ]);
  const viaFlag = await run([{ name: "roadmap_query", args: { design_status: "WIP", as_table: true } }]);
  assert.ok(viaFlag?.table);
  assert.deepEqual(viaPresent, viaFlag);
});

// ── Reach: the result offers its rows as a table ────────────────────────────
//
// Live on r515, and again on r518, a blueprint pain-points question and an
// issue list both came back as prose. Nothing the model read when it chose a
// shape said these rows could be a table, which fields would make columns, or
// that a turn's several searches could be one table; and once the turn's
// lookups were spent `present` was refused with them. Roadmap was the only
// preset in use because its lookup is the only one whose result said so.

/** The results of `name` the model read, parsed, in call order. */
function readOf(h: ReturnType<typeof harness>, name: string): Array<Record<string, unknown>> {
  return h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .filter((r) => r.name === name)
    .map((r) => JSON.parse(r.text) as Record<string, unknown>);
}

/** The answer Delivery was handed. */
const answerOf = (h: ReturnType<typeof harness>) =>
  h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");

/** One turn: the lookups, each in its own round-trip, then `present` when
 *  asked for, then prose. */
async function reach(
  lookups: Array<{ name: string; args: Record<string, unknown> }>,
  resultFor: (name: string, args: Record<string, unknown>) => string,
  presentArgs?: Record<string, unknown>,
) {
  const h = harness({
    replies: [
      ...lookups.map((c) => ({ toolCalls: [c] })),
      ...(presentArgs ? [{ toolCalls: [{ name: "present", args: presentArgs }] }] : []),
      { text: "**Clearance is the biggest snag.**" },
    ],
    toolResultFor: resultFor,
  });
  await runTurn(request({ text: "pain points?" }), h.deps);
  return h;
}

test("a result with 3 or more rows of one shape offers its main list as a table, naming the fields a column can be", async () => {
  const h = await reach([SEARCH], () => blueprintResult(3, { findings: [1, 2, 3].map((n) => ({ severity: "high", summary: `Gap ${n}` })) }));

  const [read] = readOf(h, "search_blueprint");
  assert.deepEqual(read!.table_ready, { list: "rows", count: 3, columns: ["title", "scenario", "lane", "count"] }, "the main list only");
  const note = String(read!.table_note);
  assert.match(note, /present/);
  assert.match(note, /list "rows"/, "the note names the list parameter");
  assert.match(note, /yes\/no/, "and says when a table is wrong");
  assert.deepEqual(read!.rows, JSON.parse(blueprintResult(3)).rows, "the rows themselves are untouched");
});

test("the fields a reader never reads as a column are not offered", async () => {
  const rows = [1, 2, 3].map((n) => ({
    kind: "cell",
    id: `cell-${n}`,
    title: `Cell ${n}`,
    lane: "Regular Tutor",
    score: 0.6,
    matchedBy: "vector",
    updatedAt: "2026-10-01",
    service_id: "svc",
    url: `https://blueprint.example/cell-${n}`,
  }));
  const h = await reach([SEARCH], () => JSON.stringify({ ok: true, query: "x", count: 3, rows }));
  const [read] = readOf(h, "search_blueprint");
  assert.deepEqual((read!.table_ready as { columns: string[] }).columns, ["title", "lane"]);
});

test("two rows, a failed lookup, or a tool that opts out offers no table", async () => {
  const matches = [930, 874, 816].map((n) => ({ number: n, title: `Issue ${n}`, url: `https://example.com/issues/${n}` }));
  const cases: Array<[{ name: string; args: Record<string, unknown> }, string]> = [
    [SEARCH, blueprintResult(2)],
    [SEARCH, JSON.stringify({ ok: false, error: "down" })],
    [{ name: "github_intake_search", args: { keywords: "uno-bot" } }, JSON.stringify({ ok: true, count: 3, matches })],
  ];
  for (const [call, result] of cases) {
    const h = await reach([call], () => result);
    const [read] = readOf(h, call.name);
    assert.equal(read!.table_ready, undefined, `${call.name}: ${result.slice(0, 40)}`);
    assert.equal(read!.table_note, undefined);
  }
});

test("a later call of the lookup carries the offer without the note again", async () => {
  const h = await reach(
    [SEARCH, { name: "search_blueprint", args: { query: "onboarding pain points", filter_phase: "Pre-session" } }],
    () => blueprintResult(3),
  );
  const [first, second] = readOf(h, "search_blueprint");
  assert.ok(first!.table_note);
  assert.ok(second!.table_ready);
  assert.equal(second!.table_note, undefined);
});

/** A blueprint search by phase: rows `ns`, of `matched` that matched. */
const byPhase = (phase: string, ns: number[], matched = ns.length) =>
  JSON.stringify({
    ok: true,
    query: "pain points",
    count: ns.length,
    matched,
    rows: ns.map((n) => finding(n, { scenario: `${phase} scenario` })),
  });
const phaseSearch = (phase: string) => ({ name: "search_blueprint", args: { query: "pain points", filter_phase: phase } });

test("a turn that searched one lookup once per phase tables every row it returned, each once, and names the filter that varied", async () => {
  const h = await reach(
    [phaseSearch("Onboarding"), phaseSearch("Pre-session")],
    (_n, args) => (args.filter_phase === "Onboarding" ? byPhase("Onboarding", [1, 2]) : byPhase("Pre-session", [2, 3, 4])),
    { shape: "table", lookup: "search_blueprint", columns: ["title", "scenario"] },
  );

  const table = answerOf(h)!.presentation!.table!;
  assert.deepEqual(table.rows.map((r) => r.cells), [
    ["Pain point 1", "Onboarding scenario"],
    ["Pain point 2", "Onboarding scenario"],
    ["Pain point 3", "Pre-session scenario"],
    ["Pain point 4", "Pre-session scenario"],
  ]);
  assert.equal(table.caption, '4 rows · "pain points" · phase Onboarding / Pre-session');
  assert.equal(table.partial, false);
  const reads = readOf(h, "search_blueprint");
  assert.equal((reads[1]!.table_ready as { count: number }).count, 4, "the offer counts the rows the table would show");
});

test("merged calls stay partial when any call matched more than it returned", async () => {
  const h = await reach(
    [phaseSearch("Onboarding"), phaseSearch("Pre-session")],
    (_n, args) => (args.filter_phase === "Onboarding" ? byPhase("Onboarding", [1, 2], 40) : byPhase("Pre-session", [3, 4])),
    { shape: "table", lookup: "search_blueprint", columns: ["title", "scenario"] },
  );
  const table = answerOf(h)!.presentation!.table!;
  assert.equal(table.partial, true);
  assert.equal(table.caption, 'at least 4 rows · "pain points" · phase Onboarding / Pre-session');
});

test("an orientation search of another shape is not merged into the table", async () => {
  const paths = [1, 2, 3].map((n) => ({ kind: "path", title: `Path ${n}`, phase: "Onboarding", url: `https://blueprint.example/path-${n}` }));
  const h = await reach(
    [{ name: "search_blueprint", args: { granularity: "path", filter_path_kind: "exception" } }, phaseSearch("Onboarding"), phaseSearch("Pre-session")],
    (_n, args) =>
      args.granularity
        ? JSON.stringify({ ok: true, query: "", count: 3, rows: paths })
        : args.filter_phase === "Onboarding"
          ? byPhase("Onboarding", [1, 2])
          : byPhase("Pre-session", [3]),
    { shape: "table", lookup: "search_blueprint", columns: ["title", "scenario"] },
  );
  const table = answerOf(h)!.presentation!.table!;
  assert.deepEqual(table.rows.map((r) => r.cells[0]), ["Pain point 1", "Pain point 2", "Pain point 3"]);
});

test("rows with an empty id are told apart by their address", async () => {
  const rows = (ns: number[]) => ns.map((n) => ({ id: "", title: `Row ${n}`, lane: "Tutor", url: `https://blueprint.example/r-${n}` }));
  const h = await reach(
    [phaseSearch("Onboarding"), phaseSearch("Pre-session")],
    (_n, args) => JSON.stringify({ ok: true, query: "pain points", rows: args.filter_phase === "Onboarding" ? rows([1, 2]) : rows([2, 3]) }),
    { shape: "table", lookup: "search_blueprint", columns: ["title"] },
  );
  assert.deepEqual(answerOf(h)!.presentation!.table!.rows.map((r) => r.cells[0]), ["Row 1", "Row 2", "Row 3"]);
});

test("the Roadmap lookup's table, chart and cards read its last call alone", async () => {
  const cards = (status: string, ns: number[]) =>
    JSON.stringify({
      ok: true,
      filters: { design_status: status },
      count: ns.length,
      cards: ns.map((n) => ({ title: `Card ${n}`, url: `https://www.notion.so/card-${n}`, card_number: n, design_status: status, dev_status: `Dev ${n}` })),
    });
  const calls = [
    { name: "roadmap_query", args: { design_status: "WIP" } },
    { name: "roadmap_query", args: { design_status: "Shipped" } },
  ];
  const resultFor = (_n: string, args: Record<string, unknown>) => (args.design_status === "WIP" ? cards("WIP", [1, 2, 3]) : cards("Shipped", [4, 5, 6]));

  const tabled = await reach(calls, resultFor, { shape: "table", lookup: "roadmap_query", columns: ["title"] });
  assert.deepEqual(answerOf(tabled)!.presentation!.table!.rows.map((r) => r.cells[0]), ["Card 4", "Card 5", "Card 6"]);

  const charted = await reach(calls, resultFor, { shape: "chart", lookup: "roadmap_query", group_by: "dev_status" });
  const [told] = readOf(charted, "present");
  assert.equal(told!.total, 3, "the chart counts the last call's cards");

  const carded = await reach(calls, resultFor, { shape: "cards", lookup: "roadmap_query", columns: ["title"] });
  assert.deepEqual(answerOf(carded)!.presentation!.cards!.cards.map((c) => c.title), ["Card 4", "Card 5", "Card 6"]);
});

test("a row's property bag reaches the table: each short field in it is a column, headed by its own name", async () => {
  const results = [2019, 2021, 2023].map((year, i) => ({
    title: `Paper ${i + 1}`,
    url: `https://www.notion.so/paper-${i + 1}`,
    meta: { Year: String(year), "Est. Hours": "3", Abstract: "A long abstract. ".repeat(10) },
  }));
  const h = await reach(
    [{ name: "notion_search", args: { query: "tutor feedback", scope: "research_papers" } }],
    () => JSON.stringify({ ok: true, scope: "research_papers", count: 3, results }),
    { shape: "table", lookup: "notion_search", columns: ["title", "meta.Year", "meta.Est. Hours"] },
  );

  const [read] = readOf(h, "notion_search");
  assert.deepEqual((read!.table_ready as { columns: string[] }).columns, ["title", "meta.Year", "meta.Est. Hours"]);
  const table = answerOf(h)!.presentation!.table!;
  assert.deepEqual(table.columns.map((c) => c.label), ["Title", "Year", "Est. Hours"]);
  assert.deepEqual(table.rows.map((r) => r.cells), [
    ["Paper 1", "2019", "3"],
    ["Paper 2", "2021", "3"],
    ["Paper 3", "2023", "3"],
  ]);
  assert.equal(table.rows[0]!.url, "https://www.notion.so/paper-1");
});

test("present still answers once the turn's lookups are counted out, and the refusal says so", async () => {
  const searches = Array.from({ length: 13 }, (_, i) => ({ name: "search_blueprint", args: { query: `pain points ${i}` } }));
  const h = await reach(searches, () => blueprintResult(3), present(COLUMNS).args);

  const reads = readOf(h, "search_blueprint");
  assert.equal(reads.at(-1)!.ok, false, "the thirteenth search was refused");
  assert.match(String(reads.at(-1)!.note), /present/, "and the refusal says present still works");
  const [told] = readOf(h, "present");
  assert.equal(told!.table_attached, true);
  assert.ok(answerOf(h)!.presentation?.table);
});

test("a lookup refused at the subrequest ceiling promises no present: the turn is answering now", async () => {
  let spent = 0;
  const budget = {
    used: () => spent,
    trips: () => 0,
    withLookupLimit: async <T>(_limit: number, fn: () => Promise<T>) => {
      const out = await fn();
      spent = LOOKUP_CEILING;
      return out;
    },
    isBudgetError: () => false,
    breakdown: () => "test",
  };
  const h = harness({
    replies: [{ toolCalls: [SEARCH, { name: "search_blueprint", args: { query: "more" } }] }, { text: "**Clearance.**" }],
    toolResultFor: () => blueprintResult(3),
    budget,
  });
  await runTurn(request({ text: "pain points?" }), h.deps);

  const reads = readOf(h, "search_blueprint");
  assert.equal(reads[1]!.ok, false, "the second search was refused at the ceiling");
  assert.doesNotMatch(String(reads[1]!.note), /present/);
});

