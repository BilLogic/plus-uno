// A list of Roadmap cards reaches the person as a card table, built from the
// cards the lookup returned — never from what the model typed.
//
// Driven across `runTurn` on the Turn harness: the model asks `roadmap_query`
// for a table, the faked lookup answers with real-shaped cards, and the case
// asserts the three things a person and a later turn depend on — what Delivery
// was handed beside the answer, what the model was told about the table, and
// what the thread now remembers having shown.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type CardTable, type DeliveryCall } from "../src/turn/index";
import { harness, request } from "./helpers/turn-harness";

/** One card as `roadmap_query` reports it. */
function card(n: number, over: Record<string, unknown> = {}) {
  return {
    title: `Card ${n}`,
    url: `https://www.notion.so/card-${n}`,
    card_number: 400 + n,
    design_status: "WIP",
    dev_status: "Not started",
    pillars: [],
    people: {},
    ...over,
  };
}

/** The lookup's result for an enumeration of `n` cards in WIP. */
function wipResult(n: number): string {
  const cards = Array.from({ length: n }, (_, i) => card(i + 1));
  return JSON.stringify({
    ok: true,
    filters: { design_status: "WIP" },
    count: cards.length,
    cards,
    note: "Complete result set from the live Roadmap board — safe to enumerate as the full answer.",
  });
}

const ASK = { name: "roadmap_query", args: { design_status: "WIP", as_table: true } };

/** The roadmap results the model read, parsed, in call order. */
function resultsTheModelRead(h: ReturnType<typeof harness>): Array<Record<string, unknown>> {
  return h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .filter((r) => r.name === "roadmap_query")
    .map((r) => JSON.parse(r.text) as Record<string, unknown>);
}

/** The answer Delivery was handed. */
function answerCall(calls: DeliveryCall[]): Extract<DeliveryCall, { kind: "answer" }> {
  const answer = calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  return answer;
}

test("a flagged enumeration of 13 cards hands Delivery the answer and a 13-row card table", async () => {
  const h = harness({
    replies: [{ toolCalls: [ASK] }, { text: "Thirteen cards are in WIP; the table has them." }],
    toolResult: wipResult(13),
  });
  const outcome = await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  assert.equal(outcome.disposition, "answered");
  const answer = answerCall(h.delivery.calls);
  assert.equal(answer.text, "Thirteen cards are in WIP; the table has them.");
  const table = answer.cardTable as CardTable;
  assert.equal(table.rows.length, 13);
  assert.deepEqual(table.rows[0], {
    title: "Card 1",
    url: "https://www.notion.so/card-1",
    cardNumber: 401,
    designStatus: "WIP",
    devStatus: "Not started",
  });
  assert.deepEqual(table.filter, { designStatus: "WIP" });
});

test("the model is told the table was attached, and how many rows it holds", async () => {
  const h = harness({
    replies: [{ toolCalls: [ASK] }, { text: "Thirteen cards." }],
    toolResult: wipResult(13),
  });
  await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  const [result] = resultsTheModelRead(h);
  assert.equal(result?.table_attached, true);
  assert.equal(result?.row_count, 13);
  assert.equal((result?.cards as unknown[]).length, 13, "the cards themselves still reach the model");
});

test("the thread remembers the plain list of what the table showed", async () => {
  const h = harness({
    replies: [{ toolCalls: [ASK] }, { text: "Three cards are in WIP." }],
    toolResult: wipResult(3),
  });
  const outcome = await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  const stored = outcome.wrote.turns.find((t) => t.role === "assistant");
  assert.equal(
    stored?.content,
    ["Three cards are in WIP.", "", "Card 1 — #401 — WIP", "Card 2 — #402 — WIP", "Card 3 — #403 — WIP"].join("\n"),
  );
});

test("a list the lookup cut short is a partial table, with the whole count beside it", async () => {
  const cut = JSON.parse(wipResult(30)) as Record<string, unknown>;
  const h = harness({
    replies: [{ toolCalls: [ASK] }, { text: "The first 30 of 41." }],
    toolResult: JSON.stringify({ ...cut, matched: 41, truncated: false }),
  });
  await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  const table = answerCall(h.delivery.calls).cardTable as CardTable;
  assert.equal(table.rows.length, 30);
  assert.equal(table.total, 41);
  assert.equal(table.partial, true);
  assert.equal(resultsTheModelRead(h)[0]?.row_count, 30);
});

test("a lookup that did not ask for a table attaches none, and says so", async () => {
  const h = harness({
    replies: [{ toolCalls: [{ name: "roadmap_query", args: { design_status: "WIP" } }] }, { text: "Thirteen." }],
    toolResult: wipResult(13),
  });
  await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  assert.equal(answerCall(h.delivery.calls).cardTable, undefined);
  assert.equal(resultsTheModelRead(h)[0]?.table_attached, false);
});

test("one card or none is never a table, though the lookup asked for one", async () => {
  for (const n of [1, 0]) {
    const h = harness({ replies: [{ toolCalls: [ASK] }, { text: "Here." }], toolResult: wipResult(n) });
    const outcome = await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

    assert.equal(answerCall(h.delivery.calls).cardTable, undefined, `${n} cards`);
    const [result] = resultsTheModelRead(h);
    assert.equal(result?.table_attached, false, `${n} cards`);
    assert.equal("row_count" in (result ?? {}), false, `${n} cards`);
    assert.equal(outcome.wrote.turns.find((t) => t.role === "assistant")?.content, "Here.");
  }
});

test("two flagged lookups in one turn: the last that qualifies is the table", async () => {
  const bryan = JSON.stringify({
    ok: true,
    filters: { person: "Bryan" },
    count: 2,
    cards: [card(7, { design_status: "Under Review" }), card(8, { design_status: "Shipped" })],
    note: "Complete result set from the live Roadmap board — safe to enumerate as the full answer.",
  });
  const results = [wipResult(5), bryan, wipResult(1)];
  const h = harness({
    replies: [
      { toolCalls: [ASK] },
      { toolCalls: [{ name: "roadmap_query", args: { person: "Bryan", as_table: true } }] },
      { toolCalls: [ASK] },
      { text: "Done." },
    ],
    toolResultFor: () => results.shift() ?? "{}",
  });
  await runTurn(request({ text: "WIP, then Bryan's" }), h.deps);

  const table = answerCall(h.delivery.calls).cardTable as CardTable;
  assert.deepEqual(table.rows.map((r) => r.title), ["Card 7", "Card 8"]);
  assert.deepEqual(table.filter, { person: "Bryan" });
  assert.deepEqual(resultsTheModelRead(h).map((r) => r.table_attached), [true, true, false]);
});

/** The lookup's result for a title search: `hits` cards with the phrase in
 *  their titles, then `similar` that only resemble it. */
function titleResult(hits: number, similar: number, over: Record<string, unknown> = {}): string {
  const cards = [
    ...Array.from({ length: hits }, (_, i) => card(i + 1, { title: `Onboarding ${i + 1}`, title_match: "contains" })),
    ...Array.from({ length: similar }, (_, i) => card(50 + i, { title: `Boarding pass ${i}`, title_match: "similar" })),
  ];
  return JSON.stringify({
    ok: true,
    filters: { title: "onboarding" },
    count: cards.length,
    contains_count: hits,
    truncated: false,
    cards,
    note: "Every card with \"onboarding\" in its title is listed first.",
    ...over,
  });
}

const TITLE_ASK = { name: "roadmap_query", args: { title: "onboarding", as_table: true } };

test("a flagged title search tables only the cards whose titles contain the phrase", async () => {
  const h = harness({
    replies: [{ toolCalls: [TITLE_ASK] }, { text: "Three cards mention onboarding." }],
    toolResult: titleResult(3, 2),
  });
  const outcome = await runTurn(request({ text: "which cards mention onboarding?" }), h.deps);

  const table = answerCall(h.delivery.calls).cardTable as CardTable;
  assert.deepEqual(table.rows.map((r) => r.title), ["Onboarding 1", "Onboarding 2", "Onboarding 3"]);
  assert.deepEqual(table.filter, { title: "onboarding" });
  assert.equal(table.partial, false);
  const [result] = resultsTheModelRead(h);
  assert.equal(result?.table_attached, true);
  assert.equal(result?.row_count, 3);
  assert.equal((result?.cards as unknown[]).length, 5, "the did-you-mean guesses still reach the model");
  const stored = outcome.wrote.turns.find((t) => t.role === "assistant")?.content ?? "";
  assert.equal(stored.includes("Boarding pass"), false, "no guess is remembered as shown");
});

test("a title search with one hit, or only similar guesses, attaches nothing", async () => {
  for (const [hits, similar] of [[1, 4], [0, 5]] as const) {
    const h = harness({ replies: [{ toolCalls: [TITLE_ASK] }, { text: "Did you mean…" }], toolResult: titleResult(hits, similar) });
    await runTurn(request({ text: "the onboarding card?" }), h.deps);

    assert.equal(answerCall(h.delivery.calls).cardTable, undefined, `${hits} hits`);
    const [result] = resultsTheModelRead(h);
    assert.equal(result?.table_attached, false, `${hits} hits`);
    assert.equal("row_count" in (result ?? {}), false, `${hits} hits`);
  }
});

test("a title search that listed only the first of its hits is a partial table", async () => {
  const h = harness({
    replies: [{ toolCalls: [TITLE_ASK] }, { text: "The first 30 of 41." }],
    toolResult: titleResult(30, 0, { contains_count: 41 }),
  });
  await runTurn(request({ text: "which cards mention onboarding?" }), h.deps);

  const table = answerCall(h.delivery.calls).cardTable as CardTable;
  assert.equal(table.rows.length, 30);
  assert.equal(table.total, 41);
  assert.equal(table.partial, true);
});

test("an enumeration then a flagged title search: the title search's hits are the table", async () => {
  const results = [wipResult(5), titleResult(2, 3)];
  const h = harness({
    replies: [{ toolCalls: [ASK] }, { toolCalls: [TITLE_ASK] }, { text: "Done." }],
    toolResultFor: () => results.shift() ?? "{}",
  });
  await runTurn(request({ text: "WIP, then onboarding" }), h.deps);

  const table = answerCall(h.delivery.calls).cardTable as CardTable;
  assert.deepEqual(table.rows.map((r) => r.title), ["Onboarding 1", "Onboarding 2"]);
  assert.deepEqual(resultsTheModelRead(h).map((r) => r.table_attached), [true, true]);
});

test("a failed lookup is handed back to the model untouched", async () => {
  const failed = JSON.stringify({ ok: false, error: "Notion is down" });
  const h = harness({ replies: [{ toolCalls: [ASK] }, { text: "Could not read it." }], toolResult: failed });
  await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  assert.deepEqual(resultsTheModelRead(h)[0], { ok: false, error: "Notion is down" });
  assert.equal(answerCall(h.delivery.calls).cardTable, undefined);
});

test("the judge is told a table was attached, and reads the plain list the reader gets", async () => {
  const h = harness({
    replies: [{ toolCalls: [ASK] }, { text: "Three cards are in WIP; the table has them." }],
    toolResult: wipResult(3),
  });
  await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  assert.equal(h.judged.length, 1);
  const [judged] = h.judged;
  assert.equal(judged?.draft, "Three cards are in WIP; the table has them.", "the draft is the prose alone");
  assert.equal(
    judged?.cardTableList,
    ["Card 1 — #401 — WIP", "Card 2 — #402 — WIP", "Card 3 — #403 — WIP"].join("\n"),
  );
});

test("with no table attached, the judge is asked exactly as before", async () => {
  const h = harness({
    replies: [{ toolCalls: [{ name: "roadmap_query", args: { design_status: "WIP" } }] }, { text: "Three cards." }],
    toolResult: wipResult(3),
  });
  await runTurn(request({ text: "which cards are in WIP?" }), h.deps);

  assert.equal(h.judged.length, 1);
  assert.equal("cardTableList" in h.judged[0]!, false);
});
