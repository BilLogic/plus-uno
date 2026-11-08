// The inline-JSX-token ratchet, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, isLiteralValue, literalStyleProps, measure, run } from './check-inline-jsx-tokens.mjs';

const src = (file, text) => ({ path: file, text });
const A = 'design-system/src/components/A/A.jsx';

/** A scratch repo root holding a baseline record of `counts`, one entry per key. */
function scratch(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inline-jsx-tokens-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', sets: { main: { entries: Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, { count: n }])) } } }, null, 2));
  return root;
}

test('a quoted-string or bare-number value is a literal', () => {
  assert.equal(isLiteralValue("'8px'"), true);
  assert.equal(isLiteralValue('"red"'), true);
  assert.equal(isLiteralValue('8'), true);
  assert.equal(isLiteralValue('-1'), true);
});

test('a pure var() read, an identifier and a spread are not literals', () => {
  assert.equal(isLiteralValue("'var(--size-100)'"), false);
  assert.equal(isLiteralValue('size'), false);
  assert.equal(isLiteralValue('...style'), false);
});

test('literal properties inside style={{...}} are found, with their line', () => {
  const jsx = "<div style={{ color: '#3f484a', gap: 8, width: 'var(--size-100)' }} />\n";
  const found = literalStyleProps(jsx);
  assert.deepEqual(found.map((f) => f.key), ['color', 'gap']);
  assert.equal(found[0].line, 1);
});

test('a spread property is skipped, not mistaken for a literal', () => {
  const jsx = '<div style={{ ...style, gap: 8 }} />\n';
  assert.equal(literalStyleProps(jsx).map((f) => f.key).join(','), 'gap');
});

test('nested braces inside the style object do not break the balance', () => {
  const jsx = "<div style={{ '--x': `${n}px`, gap: 8 }} />\n";
  const found = literalStyleProps(jsx);
  assert.ok(found.some((f) => f.key === 'gap'));
});

test('stories and tests are excluded', () => {
  assert.equal(measure([src('design-system/src/components/A/A.stories.jsx', "style={{ gap: 8 }}")]).size, 0);
  assert.equal(measure([src('design-system/src/components/A/A.test.jsx', "style={{ gap: 8 }}")]).size, 0);
});

test('a count that rises fails, and one that falls passes', () => {
  const key = `inline-style-literal ${A}`;
  const root = scratch({ [key]: 2 });
  const two = "<div style={{ gap: 8, width: 2 }} />\n";
  const three = "<div style={{ gap: 8, width: 2, height: 3 }} />\n";
  assert.deepEqual(run({ repoRoot: root, sources: [src(A, two)] }), []);
  const rose = run({ repoRoot: root, sources: [src(A, three)] });
  assert.equal(rose.length, 1);
  assert.match(rose[0].message, /rose against a baseline of 2/);
});

test('the live tree holds its own baseline', () => {
  assert.deepEqual(run(), []);
});
