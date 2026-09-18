// The generated prose is the committed prose.
//
// This is the assertion the three documents never had. A count in a README and
// a scenario in `docs/evals/scenarios/uno-bot.md` are derived from the fixture;
// nothing compared them, and both drifted — the count once, the scenarios
// document into listing four cases that never existed while omitting twelve
// that did.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { censusOf, loadCases } from "./eval-case.mjs";
import {
  EVALS_README_PATH,
  RECORDINGS_README_PATH,
  SCENARIOS_PATH,
  renderAll,
  renderCensusBlock,
  renderScenarios,
  replaceBlock,
  staleDocs,
} from "./eval-docs.mjs";

test("every generated document matches the fixture", () => {
  const stale = staleDocs();
  assert.deepEqual(
    stale,
    [],
    `stale — run \`node agents/uno-bot/scripts/eval-docs.mjs --write\`:\n  ${stale.join("\n  ")}`,
  );
});

test("the scenarios document names every case, and only cases", () => {
  const { cases, proposed } = loadCases();
  const doc = readFileSync(SCENARIOS_PATH, "utf8");
  const headed = [...doc.matchAll(/^## ([A-Z]+\d+[a-z]?) — /gm)].map((m) => m[1]);
  assert.deepEqual(headed, cases.map((c) => c.id), "the document's cases are not the fixture's");
  // A scenario written down but not in the fixture is still readable — under a
  // heading that cannot be mistaken for one that scores.
  for (const p of proposed) {
    assert.match(doc, new RegExp(`### ${p.id} — `), `${p.id} lost its section`);
    assert.equal(headed.includes(p.id), false, `${p.id} reads as a case that runs`);
  }
  assert.match(doc, /Written down, and not in the fixture/);
});

test("no count in the generated prose is typed", () => {
  // The two READMEs state their counts inside a fenced block, and the block is
  // rendered from the census. A number typed OUTSIDE one is what drifted.
  const census = censusOf(loadCases().cases, { recorded: [] });
  for (const path of [EVALS_README_PATH, RECORDINGS_README_PATH]) {
    const before = readFileSync(path, "utf8");
    const name = path === EVALS_README_PATH ? "uno-bot-cases" : "recorded";
    assert.notEqual(before.indexOf(`<!-- census:${name}`), -1, `${path} lost its census block`);
    assert.notEqual(before, replaceBlock(before, name, "changed"), "the block is not replaceable");
  }
  assert.match(renderCensusBlock(census), new RegExp(`\\*\\*${census.total}\\*\\*`));
});

test("a census block with no markers fails loudly", () => {
  assert.throws(() => replaceBlock("# nothing here", "uno-bot-cases", "x"), /census block/);
});

test("an unreachable case is named in every document that counts cases", () => {
  const { cases, proposed } = loadCases();
  const census = censusOf(cases, { recorded: cases.slice(1).map((c) => c.id) });
  const id = cases[0].id;
  const block = renderCensusBlock(census);
  assert.match(block, new RegExp(`unreachable[^|]*\\|[^|]*${id}`));
  const doc = renderScenarios({ cases, proposed, census });
  assert.match(doc, /> \*\*Unreachable\.\*\*/);
  assert.match(doc, /\*\*UNREACHABLE — no recording\*\*/);
});

test("the renderer writes nothing", () => {
  const before = [EVALS_README_PATH, RECORDINGS_README_PATH, SCENARIOS_PATH].map((p) =>
    readFileSync(p, "utf8"),
  );
  renderAll();
  const after = [EVALS_README_PATH, RECORDINGS_README_PATH, SCENARIOS_PATH].map((p) =>
    readFileSync(p, "utf8"),
  );
  assert.deepEqual(after, before);
});
