// The one retirement list: a name is retired or it is not, what replaces it,
// and whether a file may still say it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { glossaryAvoid, loadRetirement, notHereTable, retirementProblems } from './retirement.mjs';
import { retiredRenames } from './tokens/plan.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const retirement = loadRetirement(REPO_ROOT);

test('a retired component answers with its replacement', () => {
  const hit = retirement.retired('Toast');
  assert.equal(hit.kind, 'component');
  assert.deepEqual(hit.use, ['Flag']);
  assert.equal(hit.severity, 'error');
});

test('a retired prop answers with its replacement', () => {
  const hit = retirement.retired('Button variant');
  assert.equal(hit.kind, 'prop');
  assert.deepEqual(hit.use, ['Button.appearance']);
});

test('a retired token answers from the table rows and from the token plan', () => {
  assert.equal(retirement.retired('--space-025').kind, 'token');
  const planned = retirement.rows.find((r) => r.fromPlan && r.use.length);
  const hit = retirement.retired(planned.not);
  assert.equal(hit.kind, 'token');
  assert.equal(hit.use[0], retiredRenames().get(planned.not));
  assert.equal(retirement.retired('--stack-md'), null);
});

test('a retired word answers, whatever its case', () => {
  const hit = retirement.retired('Scrim');
  assert.equal(hit.kind, 'word');
  assert.deepEqual(hit.use, ['Blanket']);
});

test('a retired spelling answers by its shape', () => {
  assert.equal(retirement.retired('Tier 1 fix').kind, 'spelling');
  assert.equal(retirement.retired('Tier 2 — loaded on demand'), null);
});

test('an outside name answers as an error', () => {
  const hit = retirement.retired('Lozenge');
  assert.equal(hit.kind, 'outside');
  assert.equal(hit.severity, 'error');
});

test('a glossary avoid-word warns instead of failing', () => {
  const avoid = glossaryAvoid('### Sidebar\n_Avoid_: "left nav", "side nav"\n');
  assert.deepEqual(avoid, ['left nav', 'side nav']);
  const hit = retirement.retired('left nav');
  assert.equal(hit.kind, 'avoid');
  assert.equal(hit.severity, 'warn');
});

test('a current name is not retired', () => {
  for (const name of ['Flag', 'SectionMessage', 'Button.appearance', '--ds-surface-raised']) assert.equal(retirement.retired(name), null, name);
});

test('the shared allowed places cover history and Figma-side names, and nothing in the library', () => {
  for (const file of ['docs/adr/037-x.md', 'docs/knowledge/archive/old.md', 'docs/knowledge/changelog.md', 'docs/evals/ds-usage-ledger.jsonl', 'design-system/figma/component-registry.json']) {
    assert.equal(retirement.allowed(file), true, file);
  }
  for (const file of ['design-system/src/components/Button/Button.jsx', 'docs/engineering/coding.md', 'docs/adr-notes.md']) {
    assert.equal(retirement.allowed(file), false, file);
  }
});

test('the committed list is well-formed and the Not-here table renders from it', () => {
  assert.deepEqual(retirementProblems(retirement), []);
  assert.match(notHereTable(retirement), /\| `Toast` \| `Flag` \(renamed\) \|/);
});

test('retirementProblems names a row with no replacement or a malformed place', () => {
  const bad = { rows: [{ kind: 'word', not: 'x', use: [] }], places: [{ path: '', why: 'y' }, { path: 'docs/' }] };
  assert.deepEqual(retirementProblems(bad), ['word x: no replacement', 'allowed place "": no path', 'allowed place "docs/": no reason']);
});
