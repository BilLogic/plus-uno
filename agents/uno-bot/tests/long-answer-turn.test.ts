// An answer stays short, with or without `present`.
//
// Live on r525 the pain-points answer never called `present`: the model typed
// its own Markdown table after a 10,198-character walk of every phase and
// scenario. The prose budget armed only on a table `present` attached, so it
// never fired, and the draft was past the judge's rewrite window, so the judge
// could only grade it. Now a typed table counts as rows beneath the prose, any
// answer far past the short size is over budget, and the judge is asked to
// shorten it whatever its length. Driven across `runTurn`.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall } from "../src/turn/index";
import { harness, request, type JudgeCall } from "./helpers/turn-harness";

const cell = (n: number) => `https://blueprint.example/cell-${n}`;

const RESULT = JSON.stringify({
  ok: true,
  query: "pain points",
  count: 2,
  rows: [1, 2].map((n) => ({ title: `Pain point ${n}`, url: cell(n) })),
});

/** One turn: a search, then `prose`, and no `present`. */
async function turn(prose: string, judge?: (call: JudgeCall) => { text: string; verdict: string }) {
  const h = harness({
    replies: [{ toolCalls: [{ name: "search_blueprint", args: { query: "pain points" } }] }, { text: prose }],
    toolResultFor: () => RESULT,
    ...(judge ? { judge } : {}),
  });
  await runTurn(request({ text: "What are the main tutor pain points in the blueprint, by scenario?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  assert.equal(answer.presentation?.table, undefined, "present was never called");
  return { text: answer.text, judged: h.judged[0]! };
}

const LEAD = "**Most tutor friction sits where a rule holds a tutor and only a supervisor can release it.**";
const CLAUSE = "I searched the blueprint just now, so these are current.";

/** A nested walk of `phases` phases, each with 2 scenarios of 2 findings. */
function walk(phases: number, sentence = "and the reason runs on, because the blueprint records it at length. ".repeat(3)) {
  const out: string[] = [];
  let n = 0;
  for (let p = 1; p <= phases; p++) {
    out.push(`### Phase ${p}`, "");
    for (let s = 1; s <= 2; s++) {
      out.push(`* **Scenario ${p}.${s}**`);
      for (let f = 1; f <= 2; f++) out.push(`  * **Finding ${++n}:** [cell ${n}](${cell(100 + n)}) ${sentence}`);
    }
    out.push("");
  }
  return out;
}

const TABLE = [
  "Tutor Pain Points Summary Table",
  "",
  "| Phase | Scenario | Pain point |",
  "| --- | --- | --- |",
  "| Pre-session | Call-off Request | Late call-offs strip the roster |",
  "| In-session | Help Request | No ticketing tool |",
  "| Post-session | Reporting Hours | Hours do not reach Workday |",
];

// ── The redraft ─────────────────────────────────────────────────────────────

test("the live r525 shape: a long walk and a typed table, no present, asks the judge to shorten it", async () => {
  const prose = [LEAD, "", ...walk(9), ...TABLE, "", CLAUSE].join("\n");
  assert.ok(prose.length > 8_000, "past the judge's normal rewrite window");
  const { judged } = await turn(prose);

  assert.equal(judged.shorten, true);
  assert.equal(judged.forceReason, "table-walk");
  assert.match(judged.extraInstruction ?? "", /TABLE WALK/);
  assert.match(judged.extraInstruction ?? "", /keep the table as it is/);
});

test("any answer far past the short size is shortened, table or not", async () => {
  const prose = [LEAD, "", ...walk(3), CLAUSE].join("\n");
  const { judged } = await turn(prose);
  assert.equal(judged.shorten, true);
  assert.equal(judged.forceReason, "long-answer");
  assert.match(judged.extraInstruction ?? "", /LONG ANSWER/);
});

test("the shortened answer ships", async () => {
  const short = `${LEAD} Late call-offs, help routed through Slack and hours that miss Workday stand out. ${CLAUSE}`;
  const { text } = await turn([LEAD, "", ...walk(4), ...TABLE, "", CLAUSE].join("\n"), (call) => ({
    text: call.shorten ? short : call.draft,
    verdict: "fail",
  }));
  assert.equal(text, short);
});

test("an answer of ordinary length with no table is not asked to shorten", async () => {
  const prose = [LEAD, "", ...walk(1, "and why."), CLAUSE].join("\n");
  assert.ok(prose.length < 3_000);
  const { text, judged } = await turn(prose);
  assert.notEqual(judged.shorten, true);
  assert.equal(text, prose);
});

test("a typed table and a code block are not prose: neither counts toward the length", async () => {
  const rows = Array.from({ length: 60 }, (_, i) => `| Phase ${i} | Scenario ${i} | A pain point recorded at some length ${i} |`);
  const code = ["```", ...Array.from({ length: 60 }, (_, i) => `const step${i} = "a line of a setup script ${i}";`), "```"];
  const prose = [LEAD, "", "| Phase | Scenario | Pain point |", "| --- | --- | --- |", ...rows, "", ...code, "", CLAUSE].join("\n");
  assert.ok(prose.length > 6_000);
  const { text, judged } = await turn(prose);
  assert.notEqual(judged.shorten, true);
  assert.equal(text, prose);
});

// ── The backstop ────────────────────────────────────────────────────────────

test("the backstop: list items past the first 3 come out; the lead, the typed table and the clause stay", async () => {
  const prose = [LEAD, "", ...walk(4), ...TABLE, "", CLAUSE].join("\n");
  const { text } = await turn(prose);

  const [first] = walk(4, "and the reason runs on, because the blueprint records it at length. ".repeat(3)).slice(2, 3);
  assert.ok(text.startsWith(`${LEAD}\n\n### Phase 1\n\n${first}`));
  assert.equal((text.match(/^\s*\* /gm) ?? []).length, 3, "three list items");
  for (const line of TABLE) if (line) assert.ok(text.includes(line), `the typed table stays: ${line}`);
  assert.ok(text.endsWith(CLAUSE));
  assert.doesNotMatch(text, /### Phase 2/, "a heading over an emptied list goes");
});
