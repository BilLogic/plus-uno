// What a case IS, loaded once and counted once.
//
// The failures this file holds shut, each of which has happened: a case count
// typed into prose and never compared; a scenarios document listing cases the
// fixture does not hold; a case with no recording skipped so quietly that the
// pull-request gate reported nothing about it; and five hand-rolled readers of
// one JSON file, each with its own idea of what a case must carry.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CASE_KEYS,
  TURN_KEYS,
  censusOf,
  hasOwnSpec,
  loadCases,
  problemsWithCase,
} from "./eval-case.mjs";
import { renderScenarios } from "./eval-docs.mjs";

const { cases } = loadCases();

test("the loader reads the repository's fixture with no path given", () => {
  assert.ok(cases.length > 0);
  assert.ok(cases.every((c) => typeof c.id === "string" && c.turns.length > 0));
});

test("the loader refuses a case shape nothing can run", () => {
  assert.match(
    problemsWithCase({ name: "no id", turns: [{ prompt: "hi" }], judgeNote: "x" })[0],
    /id/,
  );
  assert.match(problemsWithCase({ id: "X1", name: "n", judgeNote: "x" })[0], /turns/);
  assert.match(problemsWithCase({ id: "X1", name: "n", turns: [{}], judgeNote: "x" })[0], /prompt/);
});

test("the loader refuses a key the runner would silently ignore", () => {
  const typo = {
    id: "X1",
    name: "n",
    judgeNote: "x",
    turns: [{ prompt: "hi" }],
    expectKnid: ["text"],
  };
  assert.match(problemsWithCase(typo)[0], /expectKnid/);
  const turnTypo = { id: "X1", name: "n", judgeNote: "x", turns: [{ prompt: "hi", expctTool: "a" }] };
  assert.match(problemsWithCase(turnTypo)[0], /expctTool/);
});

test("the declared shape is the shape the fixture uses", () => {
  for (const c of cases) {
    assert.deepEqual(problemsWithCase(c), [], `${c.id}: ${problemsWithCase(c).join("; ")}`);
    for (const k of Object.keys(c)) assert.ok(CASE_KEYS.includes(k), `${c.id} carries ${k}`);
    for (const t of c.turns) {
      for (const k of Object.keys(t)) assert.ok(TURN_KEYS.includes(k), `${c.id} turn carries ${k}`);
    }
  }
});

test("a turn carrying its own assertion is told apart from one that does not", () => {
  assert.equal(hasOwnSpec({ prompt: "hi" }), false);
  assert.equal(hasOwnSpec({ prompt: "hi", usePendingFromPreviousTurn: true }), false);
  assert.equal(hasOwnSpec({ prompt: "hi", expectKind: ["text"] }), true);
});

test("the census counts the fixture, and nothing counts it twice", () => {
  const census = censusOf(cases);
  assert.equal(census.total, cases.length);
  assert.equal(census.blockers, cases.filter((c) => c.blocker).length);
  assert.equal(
    census.turns,
    cases.reduce((n, c) => n + c.turns.length, 0),
  );
  assert.equal(
    census.samples,
    cases.reduce((n, c) => n + (Number.isInteger(c.samples) && c.samples > 1 ? c.samples : 1), 0),
  );
  assert.deepEqual(
    census.families.map((f) => f.prefix),
    [...new Set(cases.map((c) => /^[A-Z]+/.exec(c.id)[0]))].sort(),
  );
});

test("a case with no recording is UNGATED — named, not silently absent", () => {
  const recorded = cases.slice(1).map((c) => c.id);
  const census = censusOf(cases, { recorded });
  assert.deepEqual(census.ungated, [cases[0].id]);
  assert.equal(census.gated, cases.length - 1);
  // No recordings known at all is a different fact from none recorded AND a
  // different fact from all of them gated: the worker transport has no
  // recordings to report, so the census answers neither question with a number.
  assert.deepEqual(censusOf(cases).ungated, []);
  assert.equal(censusOf(cases).recorded, null);
  assert.equal(censusOf(cases).gated, null);
});

test("adding a case is ONE edit — every derived count follows from the fixture", () => {
  // The whole point of the module. A new case is appended to the fixture and
  // nothing else is registered anywhere: the loader takes it, the census counts
  // it, it is reported ungated until a recording exists, and the generated
  // scenarios document names it. If this test ever needs a second edit to pass,
  // adding a case needs a second edit too.
  const added = {
    id: "Z9",
    name: "a case added by one edit",
    blocker: true,
    samples: 3,
    turns: [{ prompt: "does one edit carry?" }],
    expectKind: ["text"],
    judgeNote: "it does.",
  };
  const grown = [...cases, added];
  assert.deepEqual(problemsWithCase(added), []);
  const census = censusOf(grown, { recorded: cases.map((c) => c.id) });
  assert.equal(census.total, cases.length + 1);
  assert.equal(census.blockers, cases.filter((c) => c.blocker).length + 1);
  assert.deepEqual(census.ungated, ["Z9"]);
  const doc = renderScenarios({ cases: grown, proposed: [], census });
  assert.match(doc, /## Z9 — a case added by one edit/);
  assert.match(doc, /does one edit carry\?/);
});
