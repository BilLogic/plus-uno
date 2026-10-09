// A reply over a result table, or over cards, stays short: the takeaway, what
// stands out and what to act on, at most 3 rows. The table shows the rest.
//
// Live on r521, and again on r524 after the first fix, a pain-points answer by
// scenario posted its table and walked every phase and scenario above it in
// nested bullets. On r524 the cells it linked were not the table's rows (other
// calls, other rows), so a rule that counted only the table's rows never
// fired. The measure is the prose's own shape: more than 3 list items, more
// characters than the judge's floor, or more than 3 of the table's rows named.
// Two seams answer it, both driven across `runTurn` here:
//   • the redraft — a draft over the budget asks the one judge call the turn
//     already makes to rewrite it to the takeaway;
//   • the backstop — when the prose that ships is still over (the judge erred,
//     or the draft was past its rewrite window), list items past the first 3
//     come out, and nothing else does.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall } from "../src/turn/index";
import { harness, request, type JudgeCall } from "./helpers/turn-harness";

const cell = (n: number) => `https://blueprint.example/cell-${n}`;

/** A blueprint search that found `n` pain points, one per row. */
function blueprintResult(n: number, scenario = (i: number) => `Scenario ${i}`): string {
  return JSON.stringify({
    ok: true,
    query: "pain points",
    count: n,
    rows: Array.from({ length: n }, (_, i) => ({
      title: `Pain point ${i + 1}`,
      scenario: scenario(i + 1),
      lane: "Regular Tutor",
      url: cell(i + 1),
    })),
  });
}

const SEARCH = { name: "search_blueprint", args: { query: "pain points" } };

const TABLE = {
  shape: "table",
  lookup: "search_blueprint",
  columns: ["title", "scenario"],
  takeaway: "Clearance is the biggest snag.",
};

/** One turn: the search, a `present` call, then `prose`. */
async function turn(
  prose: string,
  opts: {
    lookup?: { name: string; args: Record<string, unknown> };
    result?: string;
    present?: Record<string, unknown> | null;
    judge?: (call: JudgeCall) => { text: string; verdict: string };
  } = {},
) {
  const present = opts.present === null ? [] : [{ toolCalls: [{ name: "present", args: opts.present ?? TABLE }] }];
  const h = harness({
    replies: [{ toolCalls: [opts.lookup ?? SEARCH] }, ...present, { text: prose }],
    toolResultFor: () => opts.result ?? blueprintResult(5),
    ...(opts.judge ? { judge: opts.judge } : {}),
  });
  await runTurn(request({ text: "What are the main tutor pain points in the blueprint, by scenario?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  assert.ok(answer.presentation?.table || answer.presentation?.cards, "a table or cards ride with the answer");
  const instruction = h.judged[0]?.extraInstruction ?? "";
  return { text: answer.text, judged: h.judged, instruction };
}

/** A bullet that links `url` in a sentence that says more. */
const item = (n: number, url = cell(n), indent = "") =>
  `${indent}- [Pain point ${n}](${url}) holds tutors up for reasons of its own.`;

/** A cell the table does not hold: another call's row. */
const other = (n: number) => `https://blueprint.example/other-${n}`;

const CLAUSE = "I searched the blueprint just now, so these are current.";

// ── The redraft ─────────────────────────────────────────────────────────────

test("a draft walking more than 3 list items asks the one judge call to redraft it, and the redraft ships", async () => {
  const redraft = `**Clearance is the biggest snag.** [Pain point 1](${cell(1)}) stands out; fix it first. ${CLAUSE}`;
  const { text, judged, instruction } = await turn(
    ["**Clearance is the biggest snag.**", item(1), item(2), item(3), item(4), CLAUSE].join("\n"),
    { judge: (call) => ({ text: call.extraInstruction ? redraft : call.draft, verdict: "fail" }) },
  );

  assert.equal(judged.length, 1, "no extra model call");
  assert.equal(judged[0]!.forceReason, "table-walk");
  assert.match(instruction, /TABLE WALK/);
  assert.match(instruction, /4 list items/);
  assert.match(instruction, /at most 3/);
  assert.match(instruction, /confidence clause/);
  assert.equal(text, redraft);
});

test("the live r524 shape: cells the table does not hold, walked in nested bullets, still ask for the redraft", async () => {
  const prose = [
    "**Clearance is the biggest snag.**",
    "",
    `- **Scenario A**`,
    item(101, other(101), "  "),
    item(102, other(102), "  "),
    `- **Scenario B**`,
    item(103, other(103), "  "),
    CLAUSE,
  ].join("\n");
  const { instruction } = await turn(prose);
  assert.match(instruction, /TABLE WALK/);
  assert.match(instruction, /5 list items/);
  assert.doesNotMatch(instruction, /rows of the table/, "none of the cells it links are the table's rows");
});

test("rows of the table named in sentences count, typed-out rows the strip takes out included", async () => {
  const { instruction } = await turn(
    [
      `**Clearance is the biggest snag.** [Pain point 3](${cell(3)}) and [Pain point 4](${cell(4)}) stand out.`,
      "- Pain point 1 — Scenario 1",
      "- Pain point 2 — Scenario 2",
      CLAUSE,
    ].join("\n"),
  );
  assert.match(instruction, /names 4 rows of the table/);
});

test("a draft past the judge's floor in characters asks for the redraft, though it has no list", async () => {
  const long = "Tutors wait on clearance, on modules and on supervisors, and each wait costs them a shift. ".repeat(12);
  const { instruction } = await turn(`**Clearance is the biggest snag.** ${long}${CLAUSE}`);
  assert.match(instruction, /TABLE WALK/);
  assert.match(instruction, /characters/);
});

test("a short draft with up to 3 list items asks the judge nothing extra and stands", async () => {
  const prose = ["**Clearance is the biggest snag.**", item(1), item(2), item(3), CLAUSE].join("\n");
  const { text, instruction } = await turn(prose);
  assert.doesNotMatch(instruction, /TABLE WALK/);
  assert.equal(text, prose);
});

test("a first column every row shares names no row", async () => {
  const result = blueprintResult(5, (n) => (n % 2 ? "Employment & Access" : "Onboarding Modules"));
  const prose =
    "**Clearance is the biggest snag.** Employment & Access is where most tutors wait, Onboarding Modules lock scheduling, " +
    `Employment & Access again for the second district, and Onboarding Modules save no progress. ${CLAUSE}`;
  const { text, instruction } = await turn(prose, {
    result,
    present: { shape: "table", lookup: "search_blueprint", columns: ["scenario", "title"] },
  });
  assert.doesNotMatch(instruction, /TABLE WALK/);
  assert.equal(text, prose);
});

test("cards beneath the answer hold it to the same budget", async () => {
  const { instruction } = await turn(
    ["**Clearance is the biggest snag.**", item(1), item(2), item(3), item(4), CLAUSE].join("\n"),
    { present: { shape: "cards", lookup: "search_blueprint", columns: ["title"] } },
  );
  assert.match(instruction, /TABLE WALK/);
});

// ── The backstop ────────────────────────────────────────────────────────────
//
// The harness judge hands the draft back unchanged, as a judge that erred or
// gave a verdict only does.

test("the live r524 shape: list items past the first 3 come out with their headings and rules; the lead, the clause and a middle paragraph stay", async () => {
  const prose = [
    "**Clearance is the biggest snag.**",
    "",
    CLAUSE,
    "",
    "---",
    "",
    "### 1. Phase: Pre-session",
    "",
    "* **Scenario: Call-off Request**",
    `  * **Volume:** call-offs run high: [Initial need](${other(1)}).`,
    `  * **No swaps:** tutors vacate outright: [Swaps](${other(2)}).`,
    `  * **Chasing:** supervisors chase coverage: [Coverage](${other(3)}).`,
    "",
    "Most of this sits before a first session.",
    "",
    "---",
    "",
    "### 2. Phase: Onboarding",
    "",
    "* **Scenario: Session Sign Up**",
    `  * **Gating:** scheduling is currently locked: [Review scheduling](${other(4)}).`,
    "",
    "---",
    "",
    "### 3. Phase: Post-session",
    "",
    "* **Scenario: Reporting Hours**",
    `  * **Timesheets:** hours do not reach Workday: [Miss deadline](${other(5)}).`,
  ].join("\n");
  const { text } = await turn(prose);

  assert.equal(
    text,
    [
      "**Clearance is the biggest snag.**",
      "",
      CLAUSE,
      "",
      "---",
      "",
      "### 1. Phase: Pre-session",
      "",
      "* **Scenario: Call-off Request**",
      `  * **Volume:** call-offs run high: [Initial need](${other(1)}).`,
      `  * **No swaps:** tutors vacate outright: [Swaps](${other(2)}).`,
      "",
      "Most of this sits before a first session.",
    ].join("\n"),
  );
});

test("prose with no blank lines keeps its bold lead and its closing clause", async () => {
  const prose = ["**Clearance is the biggest snag.**", item(1), item(2), item(3), item(4), item(5), CLAUSE].join("\n");
  const { text } = await turn(prose);
  assert.equal(text, ["**Clearance is the biggest snag.**", item(1), item(2), item(3), CLAUSE].join("\n"));
});

test("a list item carrying the confidence clause stays, wherever it falls", async () => {
  const last = `- [Pain point 5](${cell(5)}) is the newest; ${CLAUSE}`;
  const prose = ["**Clearance is the biggest snag.**", item(1), item(2), item(3), item(4), last].join("\n");
  const { text } = await turn(prose);
  assert.equal(text, ["**Clearance is the biggest snag.**", item(1), item(2), item(3), last].join("\n"));
});

test("a heading or an intro over a list the backstop emptied goes with it; one over a list that survives stays", async () => {
  const prose = [
    "**Clearance is the biggest snag.**",
    "",
    "### By scenario",
    item(1),
    item(2),
    item(3),
    "",
    "**Also:**",
    item(4),
    "",
    "### Later",
    item(5),
    "",
    CLAUSE,
  ].join("\n");
  const { text } = await turn(prose);
  assert.equal(
    text,
    ["**Clearance is the biggest snag.**", "", "### By scenario", item(1), item(2), item(3), "", CLAUSE].join("\n"),
  );
});

test("the Roadmap preset, which carries no takeaway, is held to 3 items the same way", async () => {
  const cards = Array.from({ length: 5 }, (_, i) => ({
    title: `Card ${i + 1}`,
    url: `https://www.notion.so/card-${i + 1}`,
    card_number: 401 + i,
    design_status: "WIP",
    dev_status: null,
  }));
  const card = (n: number) => `- [Card ${n}](https://www.notion.so/card-${n}) is waiting on research.`;
  const prose = ["**Five cards are in WIP.**", card(1), card(2), card(3), card(4), card(5)].join("\n");
  const { text } = await turn(prose, {
    lookup: { name: "roadmap_query", args: { design_status: "WIP", as_table: true } },
    result: JSON.stringify({ ok: true, filters: { design_status: "WIP" }, count: 5, matched: 5, cards }),
    present: null,
  });
  assert.equal(text, ["**Five cards are in WIP.**", card(1), card(2), card(3)].join("\n"));
});

test("with no list item to take out, the prose stands as written", async () => {
  const prose = [
    `**Clearance is the biggest snag.** [Pain point 1](${cell(1)}) and [Pain point 2](${cell(2)}) lead it.`,
    `[Pain point 3](${cell(3)}), [Pain point 4](${cell(4)}) and [Pain point 5](${cell(5)}) follow.`,
  ].join("\n");
  const { text } = await turn(prose);
  assert.equal(text, prose);
});
