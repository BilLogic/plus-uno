// The glossary-only check, mutation-tested: each rule proven by a glossary that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { measure, REPO_ROOT, SUBJECT } from './check-glossary.mjs';

const glossary = (extra = '') => `---\nsummary: g\n---\n\n# Terms\n\nUse these.\n\n## Product terms\n\n| Term | Meaning |\n|---|---|\n| **Session** | a slot |\n${extra}`;

test('a glossary of term tables passes with its prose counted', () => {
  const { failures, prose } = measure(glossary());
  assert.deepEqual(failures, []);
  assert.equal(prose, 1, 'the one intro sentence is prose');
});

test('fenced code fails', () => {
  const { failures } = measure(glossary('\n```js\nconst x = 1\n```\n'));
  assert.equal(failures.length, 1);
  assert.match(failures[0], /fenced code/);
});

test('a third-level heading fails', () => {
  const { failures } = measure(glossary('\n### Five words for arrival\n'));
  assert.match(failures[0], /third-level heading/);
});

test('a section with no term rows fails as prose wearing a heading', () => {
  const { failures } = measure(glossary('\n## The rename map\n\nOld became new.\n'));
  assert.match(failures[0], /rename map.*no term rows/);
});

test('prose lines are counted, table rows and comments are not', () => {
  const { prose } = measure(glossary('\n<!-- note -->\n- a bullet\nA sentence.\n| **X** | y |\n'));
  assert.equal(prose, 3);
});

test('the committed glossary is a glossary and within its baseline', () => {
  const text = readFileSync(path.join(REPO_ROOT, SUBJECT), 'utf8');
  const { failures, prose } = measure(text);
  assert.deepEqual(failures, []);
  const baseline = JSON.parse(readFileSync(path.join(REPO_ROOT, 'docs/evals/glossary-baseline.json'), 'utf8'));
  assert.ok(prose <= baseline.proseLines, `${prose} prose lines against a baseline of ${baseline.proseLines}`);
});
