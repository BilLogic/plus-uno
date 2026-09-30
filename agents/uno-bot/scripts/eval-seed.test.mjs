// A duplicate case's seed issue, checked before a live run (eval-seed.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { loadCases, problemsWithCase } from "./eval-case.mjs";
import { problemsWithSeed, seedWarnings } from "./eval-seed.mjs";

const SEED = { repo: "BilLogic/plus-uno", issue: 816, label: "harness-intake" };
const CASE = { id: "G3", seed: SEED };

test("an open, labelled seed says nothing", async () => {
  const warnings = await seedWarnings([CASE, { id: "B1" }], async () => ({ state: "open", labels: ["harness-intake", "needs-triage"] }));
  assert.deepEqual(warnings, []);
});

test("a closed, unlabelled or unreadable seed is named loudly, with the case and the issue", async () => {
  for (const [read, why] of [
    [{ state: "closed", labels: ["harness-intake"] }, /is closed/],
    [{ state: "open", labels: ["needs-triage"] }, /no longer carries 'harness-intake'/],
    [null, /could not be read/],
  ]) {
    const [warning] = await seedWarnings([CASE], async () => read);
    assert.match(warning, /^SEED MISSING — G3 assumes BilLogic\/plus-uno#816/);
    assert.match(warning, why);
  }
  const [thrown] = await seedWarnings([CASE], async () => {
    throw new Error("offline");
  });
  assert.match(thrown, /could not be read/);
});

test("a malformed seed is a fixture problem", () => {
  assert.deepEqual(problemsWithSeed(SEED, "G3"), []);
  assert.equal(problemsWithSeed({ repo: "plus-uno", issue: 0 }, "G3").length, 3);
  assert.ok(problemsWithCase({ id: "X", name: "x", judgeNote: "x", turns: [{ prompt: "p" }], seed: "816" }).length > 0);
});

test("the duplicate cases declare their seed", () => {
  const cases = loadCases().cases;
  for (const id of ["G3", "I3"]) {
    assert.deepEqual(cases.find((c) => c.id === id)?.seed, SEED, id);
  }
});
