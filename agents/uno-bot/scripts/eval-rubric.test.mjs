// The judge grades against the rubric document, and against all of it (#511).
//
// THE PROPERTY THIS FILE HOLDS: every dimension docs/evals/rubrics/bot-answer.md
// declares reaches the judge's system prompt, verbatim. The prompt used to
// carry a hand-written paraphrase of five of the nine, so a dimension added or
// sharpened in the document changed nothing about what was measured — and
// nothing said so. This test is what makes that silence impossible.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  RUBRIC_PATH,
  describeRubric,
  dimensionIds,
  extractBlock,
  judgeSystem,
  loadRubric,
} from "./eval-rubric.mjs";

test("the canonical rubric loads, and carries the nine dimensions it is named for", () => {
  const rubric = loadRubric();
  assert.deepEqual(rubric.ids, ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]);
  assert.equal(describeRubric(rubric), "9 dimensions (D1–D9)");
});

test("every D-id in the document reaches the judge prompt, with its definition", () => {
  const doc = readFileSync(RUBRIC_PATH, "utf8");
  const ids = dimensionIds(extractBlock(doc, "dimensions"));
  assert.ok(ids.length >= 9, `the document declares ${ids.length} dimensions`);
  const prompt = judgeSystem(loadRubric());
  for (const id of ids) {
    assert.ok(prompt.includes(`id: ${id}`), `${id} is in the rubric but not in the judge prompt`);
  }
  // Verbatim, not summarised: the definitions travel as written. D9's clause
  // about the retired confidence affix is the one the old paraphrase had to
  // restate by hand.
  assert.ok(
    prompt.includes("the retired trailing high/medium/low affix must NOT appear"),
    "the dimension definitions must reach the prompt as written, not as a précis",
  );
  assert.ok(prompt.includes("docs/evals/rubrics/bot-answer.md"), "the prompt cites where the rubric came from");
  assert.ok(prompt.includes('{"verdict":"pass"}'), "the prompt still asks for the strict-JSON verdict");
});

test("a rubric edit reaches the prompt without touching the prompt", () => {
  // A tenth dimension, invented here: the loader reads the document, so the
  // prompt grows a D10 nobody wrote into the prompt.
  const doc = readFileSync(RUBRIC_PATH, "utf8").replace(
    "hard_gates:",
    '  - id: D10\n    definition: "a dimension added today"\nhard_gates:',
  );
  const block = extractBlock(doc, "dimensions");
  const ids = dimensionIds(block);
  assert.equal(ids[ids.length - 1], "D10");
  const prompt = judgeSystem({ block, ids });
  assert.ok(prompt.includes("a dimension added today"));
});

test("the block stops at the next top-level key, and keeps its own indentation", () => {
  const doc = ["---", "scale: 1-5", "dimensions:", "  - id: D1", '    definition: "x"', "hard_gates:", "  - never", "---", "", "# body"].join("\n");
  assert.equal(extractBlock(doc, "dimensions"), 'dimensions:\n  - id: D1\n    definition: "x"');
  assert.equal(extractBlock(doc, "hard_gates"), "hard_gates:\n  - never");
  assert.equal(extractBlock(doc, "absent"), "");
  assert.equal(extractBlock("# no frontmatter\n", "dimensions"), "");
});

test("a document with no dimensions is an error, not a judge with no rubric", () => {
  assert.throws(() => loadRubric(new URL("./eval-rubric.mjs", import.meta.url)), /no dimensions block/);
});
