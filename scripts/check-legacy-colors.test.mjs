// The legacy-color ratchet, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, REPO_ROOT, measure, run } from './check-legacy-colors.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const src = (file, text) => ({ path: file, text });
const A = 'design-system/src/components/labels/A/A.scss';

/** A scratch repo root holding a baseline record of `counts`, one entry per key. */
function scratch(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-colors-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', sets: { main: { entries: Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, { count: n }])) } } }, null, 2));
  return root;
}

test('var(--color-*) uses are counted, with or without a fallback; --ds-* is not', () => {
  const css = '.a { color: var(--color-success); background: var(--color-danger, #ba1a1a); }\n.b { color: var(--ds-text); }\n';
  assert.equal(measure([src(A, css)]).get(`color-var ${A}`).count, 2);
  assert.equal(measure([src(A, '.a { color: var(--ds-text-subtle, red); }')]).size, 0);
});

test('a hex fallback inside var() is counted, whatever the token', () => {
  const css = '.a { x: var(--size-element-gap, #fff); y: var(--ds-text, #123abc); z: var(--ds-text, red); w: var(--ds-text); }\n';
  const found = measure([src(A, css)]);
  assert.equal(found.get(`hex-fallback ${A}`).count, 2);
  assert.equal(found.get(`hex-fallback ${A}`).line, 1);
});

test('a hex literal outside var() is not a fallback', () => {
  assert.equal(measure([src(A, '.a { color: #fff; } /* #269 */')]).size, 0);
});

test('test files are skipped: they plant fixture names', () => {
  assert.equal(measure([src('design-system/src/components/x/x.test.jsx', 'var(--color-success)')]).size, 0);
});

test('a file the baseline does not hold fails: new code starts at zero', () => {
  const findings = run({ repoRoot: scratch({}), sources: [src(A, '.a { color: var(--color-success); }')] });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, A);
  assert.equal(findings[0].line, 1);
  assert.match(findings[0].message, /baseline does not hold/);
});

test('a count that rises fails, and one that falls passes', () => {
  const key = `color-var ${A}`;
  const two = '.a { c: var(--color-a); }\n.b { c: var(--color-b); }\n';
  const root = scratch({ [key]: 2 });
  assert.deepEqual(run({ repoRoot: root, sources: [src(A, two)] }), []);
  assert.deepEqual(run({ repoRoot: root, sources: [src(A, '.a { c: var(--color-a); }')] }), [], 'lowering a count passes');
  const rose = run({ repoRoot: root, sources: [src(A, `${two}.c { c: var(--color-c); }`)] });
  assert.equal(rose.length, 1);
  assert.match(rose[0].message, /rose: 3 x var\(--color-\*\) use against a baseline of 2/);
});

test('a pair that reaches zero is stale until the baseline is regenerated', () => {
  const findings = run({ repoRoot: scratch({ [`hex-fallback ${A}`]: 1 }), sources: [src(A, '.a { c: var(--ds-text); }')] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /--update/);
});

test('a missing baseline fails loudly rather than passing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-colors-'));
  const findings = run({ repoRoot: root, sources: [] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /no baseline is recorded/);
});

test('the labels group holds no legacy color, and the live tree holds its own baseline', () => {
  assert.deepEqual(run(), []);
  const record = Object.fromEntries([...openRatchet({ file: BASELINE }).entries].map(([k, e]) => [k, e.count]));
  assert.deepEqual(Object.keys(record).filter((k) => k.includes('/components/labels/')), []);
});
