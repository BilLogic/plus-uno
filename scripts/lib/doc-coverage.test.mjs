import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { coverage, describeGap, gapKeys } from './doc-coverage.mjs';
import { openRatchet } from './ratchet.mjs';

const FILE = 'scripts/baselines/component-docs.json';

const gaps = {
  Button: { rows: 3, summary: false, props: ['onClick'] },
  Tag: { rows: 2, summary: true, props: [] },
};

/** A scratch tree holding a component-docs record with these keys. */
function recorded(keys) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-coverage-'));
  fs.mkdirSync(path.join(root, 'scripts/baselines'), { recursive: true });
  const entries = Object.fromEntries(keys.map((key) => [key, { count: 1 }]));
  fs.writeFileSync(path.join(root, FILE), `${JSON.stringify({ why: 'test', sets: { main: { entries } } }, null, 2)}\n`);
  return { ratchet: openRatchet({ file: FILE, repoRoot: root }), root };
}

test('coverage counts described prop rows across every component', () => {
  assert.deepEqual(coverage(gaps), { rows: 5, described: 4, percent: 80, summaries: 1 });
});

test('every gap is one key: the component and the prop, or the component and (summary)', () => {
  assert.deepEqual(gapKeys(gaps), ['Button onClick', 'Tag (summary)']);
  assert.match(describeGap('Tag (summary)'), /Tag has no summary/);
  assert.match(describeGap('Button onClick'), /Button prop `onClick` has no description/);
});

test('A NEW UNDESCRIBED PROP FAILS, even when another prop got described in the same change', () => {
  const { ratchet } = recorded(['Button size', 'Tag (summary)']);
  const failures = ratchet.failures(gapKeys(gaps));
  assert.deepEqual(failures.map((f) => [f.kind, f.key]), [['new', 'Button onClick']]);
  assert.deepEqual(ratchet.stale(gapKeys(gaps)).map((s) => s.key), ['Button size']);
});

test('a new component ships described', () => {
  const failures = recorded(['Button onClick']).ratchet.failures(gapKeys(gaps));
  assert.deepEqual(failures.map((f) => f.key), ['Tag (summary)']);
});

test('a filled gap leaves the record on --update, and nothing else moves', () => {
  const { ratchet, root } = recorded(['Button onClick', 'Button size', 'Tag (summary)']);
  assert.deepEqual(ratchet.failures(gapKeys(gaps)), []);
  ratchet.update(gapKeys(gaps));
  const written = JSON.parse(fs.readFileSync(path.join(root, FILE), 'utf8'));
  assert.deepEqual(written, {
    why: 'test',
    sets: { main: { entries: { 'Button onClick': { count: 1 }, 'Tag (summary)': { count: 1 } } } },
  });
});
