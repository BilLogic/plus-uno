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
