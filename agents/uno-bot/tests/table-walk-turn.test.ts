// A reply over a result table names at most 3 of its rows: the table shows
// them all.
//
// Live on r521, a pain-points answer by scenario posted its table and then
// walked every row above it, each in a sentence that said more than the row,
// so no line read as a row typed out and the strip of typed-out rows left all
// of them. Two seams answer it, both driven across `runTurn` here:
//   • the redraft — a draft that names more than 3 rows asks the one judge
//     call the turn already makes to rewrite it to the takeaway;
//   • the backstop — when the prose that ships still names more (the judge
//     erred, or the draft was past its rewrite window), list items naming rows
//     past the first 3 come out, and nothing else does.
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

/** One turn: the search, a `present` table, then `prose`. */
async function turn(
  prose: string,
  opts: {
    lookup?: { name: string; args: Record<string, unknown> };
    result?: string;
    present?: Record<string, unknown> | null;
    judge?: (call: JudgeCall) => { text: string; verdict: string };
  } = {},
) {
  const present =
    opts.present === null
      ? []
      : [
          {
            toolCalls: [
              {
                name: "present",
                args: opts.present ?? {
                  shape: "table",
                  lookup: "search_blueprint",
                  columns: ["title", "scenario"],
                  takeaway: "Clearance is the biggest snag.",
                },
              },
            ],
          },
        ];
  const h = harness({
    replies: [{ toolCalls: [opts.lookup ?? SEARCH] }, ...present, { text: prose }],
    toolResultFor: () => opts.result ?? blueprintResult(5),
    ...(opts.judge ? { judge: opts.judge } : {}),
  });
  await runTurn(request({ text: "What are the main tutor pain points in the blueprint, by scenario?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  assert.ok(answer.presentation?.table, "a table rides with the answer");
  return { text: answer.text, judged: h.judged };
}

/** A bullet that names pain point `n` in a sentence that says more. */
const walked = (n: number, indent = "") => `${indent}- [Pain point ${n}](${cell(n)}) holds tutors up for reasons of its own.`;

const CLAUSE = "I searched the blueprint just now, so these are current.";

// ── The redraft ─────────────────────────────────────────────────────────────

test("a draft naming more than 3 rows asks the one judge call to redraft it to the takeaway", async () => {
  const redraft = `**Clearance is the biggest snag.** [Pain point 1](${cell(1)}) stands out; fix it first. ${CLAUSE}`;
  const { text, judged } = await turn(["**Clearance is the biggest snag.**", walked(1), walked(2), walked(3), walked(4), CLAUSE].join("\n"), {
    judge: (call) => ({ text: call.extraInstruction ? redraft : call.draft, verdict: "fail" }),
  });

  assert.equal(judged.length, 1, "no extra model call");
  assert.equal(judged[0]!.forceReason, "table-walk");
  assert.match(judged[0]!.extraInstruction ?? "", /names 4 rows/);
  assert.match(judged[0]!.extraInstruction ?? "", /at most 3/);
  assert.match(judged[0]!.extraInstruction ?? "", /confidence clause/);
  assert.equal(text, redraft, "the redraft ships");
});

test("rows the strip takes out as typed-out still count toward the redraft", async () => {
  const { judged } = await turn(
    ["**Clearance is the biggest snag.**", "- Pain point 1 — Scenario 1", "- Pain point 2 — Scenario 2", walked(3), walked(4)].join("\n"),
  );
  assert.match(judged[0]!.extraInstruction ?? "", /names 4 rows/);
});

test("a draft naming up to 3 rows asks the judge nothing extra and stands", async () => {
  const prose = ["**Clearance is the biggest snag.**", walked(1), walked(2), walked(3), CLAUSE].join("\n");
  const { text, judged } = await turn(prose);
  assert.doesNotMatch(judged[0]!.extraInstruction ?? "", /TABLE WALK/);
  assert.equal(text, prose);
});

test("a first column every row shares names no row: a walk by scenario is not counted", async () => {
  const result = blueprintResult(5, (n) => (n % 2 ? "Employment & Access" : "Onboarding Modules"));
  const prose = [
    "**Clearance is the biggest snag.**",
    "- Employment & Access is where most tutors wait.",
    "- Onboarding Modules lock scheduling.",
    "- Employment & Access again, for the second district.",
    "- Onboarding Modules have no saved progress.",
    CLAUSE,
  ].join("\n");
  const { text, judged } = await turn(prose, {
    result,
    present: { shape: "table", lookup: "search_blueprint", columns: ["scenario", "title"] },
  });
  assert.doesNotMatch(judged[0]!.extraInstruction ?? "", /TABLE WALK/);
  assert.equal(text, prose);
});

// ── The backstop ────────────────────────────────────────────────────────────
//
// The harness judge hands the draft back unchanged, as a judge that erred or
// gave a verdict only does.

test("the live shape: list items past the first 3 rows come out, the lead, a middle paragraph and the confidence clause stay", async () => {
  const prose = [
    "**Clearance is the biggest snag.**",
    "",
    "Here is the scenario-by-scenario breakdown:",
    "",
    "Phase: Onboarding",
    "• *Scenario 1*",
    `    ◦ In <${cell(1)}|Pain point 1>, tutors wait weeks for clearance.`,
    `    ◦ In [Pain point 2](${cell(2)}), the quiz locks scheduling.`,
    "",
    "Most of this sits before a first session.",
    "",
    "Phase: Pre-session",
    "• *Scenario 3*",
    `    ◦ In [Pain point 3](${cell(3)}), call-offs strip the roster.`,
    `    ◦ In [Pain point 4](${cell(4)}), coverage runs through Slack.`,
    "",
    "Phase: Post-session",
    "• *Scenario 5*",
    `    ◦ In [Pain point 5](${cell(5)}), hours do not reach Workday.`,
    "",
    CLAUSE,
  ].join("\n");
  const { text } = await turn(prose);

  assert.equal(
    text,
    [
      "**Clearance is the biggest snag.**",
      "",
      "Here is the scenario-by-scenario breakdown:",
      "",
      "Phase: Onboarding",
      "• *Scenario 1*",
      `    ◦ In <${cell(1)}|Pain point 1>, tutors wait weeks for clearance.`,
      `    ◦ In [Pain point 2](${cell(2)}), the quiz locks scheduling.`,
      "",
      "Most of this sits before a first session.",
      "",
      "Phase: Pre-session",
      "• *Scenario 3*",
      `    ◦ In [Pain point 3](${cell(3)}), call-offs strip the roster.`,
      "",
      CLAUSE,
    ].join("\n"),
  );
});

test("prose with no blank lines keeps its bold lead and its closing clause", async () => {
  const prose = ["**Clearance is the biggest snag.**", walked(1), walked(2), walked(3), walked(4), walked(5), CLAUSE].join("\n");
  const { text } = await turn(prose);
  assert.equal(text, ["**Clearance is the biggest snag.**", walked(1), walked(2), walked(3), CLAUSE].join("\n"));
});

test("a list item carrying the confidence clause stays, whatever row it names", async () => {
  const last = `- [Pain point 5](${cell(5)}) is the newest; ${CLAUSE}`;
  const prose = ["**Clearance is the biggest snag.**", walked(1), walked(2), walked(3), walked(4), last].join("\n");
  const { text } = await turn(prose);
  assert.equal(text, ["**Clearance is the biggest snag.**", walked(1), walked(2), walked(3), last].join("\n"));
});

test("an intro or heading over a list the backstop emptied goes with it", async () => {
  const prose = [
    `**Clearance is the biggest snag.** [Pain point 1](${cell(1)}), [Pain point 2](${cell(2)}) and [Pain point 3](${cell(3)}) stand out.`,
    "",
    "**By scenario:**",
    walked(4),
    "",
    "### Also",
    walked(5),
    "",
    CLAUSE,
  ].join("\n");
  const { text } = await turn(prose);
  assert.equal(
    text,
    [
      `**Clearance is the biggest snag.** [Pain point 1](${cell(1)}), [Pain point 2](${cell(2)}) and [Pain point 3](${cell(3)}) stand out.`,
      "",
      CLAUSE,
    ].join("\n"),
  );
});

test("the Roadmap preset, which carries no takeaway, is held to 3 rows the same way", async () => {
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
