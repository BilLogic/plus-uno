// The state-mixin ratchet, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, measure, run } from './check-state-mixin.mjs';

const src = (file, text) => ({ path: file, text });
const A = 'design-system/src/components/labels/A/A.scss';

/** A scratch repo root holding a baseline record of `counts`, one entry per key. */
function scratch(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'state-mixin-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', sets: { main: { entries: Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, { count: n }])) } } }, null, 2));
  return root;
}

test('outline: none, the legacy ring token and a hand-written Highlight ring are counted', () => {
  const css = '.a:focus { outline: none; }\n.b { outline: 0; }\n.c { box-shadow: 0 0 0 2px var(--color-focus-ring); }\n.d:focus-visible { outline-color: Highlight; }\n';
  const found = measure([src(A, css)]);
  assert.equal(found.get(`outline-none ${A}`).count, 2);
  assert.equal(found.get(`legacy-ring-token ${A}`).count, 1);
  assert.equal(found.get(`highlight-ring ${A}`).count, 1);
});

test('a hand-rolled :hover or :active selector is counted', () => {
  const css = '.a:hover { background: red; }\n.b:active { background: blue; }\n';
  const found = measure([src(A, css)]);
  assert.equal(found.get(`hand-hover ${A}`).count, 1);
  assert.equal(found.get(`hand-pressed ${A}`).count, 1);
});

test('a $hovered-selector / $pressed-selector override argument is the sanctioned mixin call, not a hand-rolled rule', () => {
  const scss =
    "@include plus-state(\n" +
    "    $states: (hovered: (background: red)),\n" +
    "    $hovered-selector: '&:hover:not(:disabled)'\n" +
    ");\n" +
    "@include plus-state(\n" +
    "    $states: (pressed: (background: blue)),\n" +
    "    $pressed-selector: '&:active:not(:disabled)'\n" +
    ");\n";
  assert.equal(measure([src(A, scss)]).size, 0);
});

test("the mixin's own file is excluded", () => {
  assert.equal(measure([src('design-system/src/styles/_state.scss', '.a:hover { color: red; }')]).size, 0);
});

test('test files are skipped: they plant fixture names', () => {
  assert.equal(measure([src('design-system/src/components/x/x.test.jsx', '.a:hover { color: red; }')]).size, 0);
});

test('a count that rises fails', () => {
  const key = `hand-hover ${A}`;
  const root = scratch({ [key]: 1 });
  const rose = run({ repoRoot: root, sources: [src(A, '.a:hover{} .b:hover{}')] });
  assert.equal(rose.length, 1);
  assert.match(rose[0].message, /rose against a baseline of 1/);
});

test('the live tree holds its own baseline', () => {
  assert.deepEqual(run(), []);
});
