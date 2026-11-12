// check:motion-literals, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, excluded, literalsIn, measure, run } from './check-motion-literals.mjs';

const src = (file, text) => ({ path: file, text });
const S = 'design-system/src/components/A/A.scss';
const J = 'design-system/src/components/A/A.jsx';
const M = 'design-system/src/docs/A.mdx';

function scratch(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-literals-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  const entries = Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, { count: n }]));
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', sets: { main: { entries } } }, null, 2));
  return root;
}

test('token reads pass', () => {
  assert.equal(literalsIn(S, '.a { transition: opacity var(--ds-motion-appearance-fast-duration) var(--ds-motion-appearance-fast); }').length, 0);
  assert.equal(literalsIn(S, '.a { animation: spin var(--ds-motion-loop-duration) var(--ds-motion-loop) infinite; }').length, 0);
  assert.equal(literalsIn(S, '.a { width: 100ms; }').length, 0, 'a time unit outside a motion declaration is not motion');
});

test('a raw ms or s duration in a transition or animation fails', () => {
  assert.equal(literalsIn(S, '.a { transition: opacity 200ms ease; }').length, 1);
  assert.equal(literalsIn(S, '.a { animation: spin 0.6s linear infinite; }').length, 1);
  assert.equal(literalsIn(S, '.a { transition-duration: 150ms; }').length, 1);
  assert.equal(literalsIn(S, '.a { animation-delay: .2s; }').length, 1);
});

test('a cubic-bezier fails wherever it is', () => {
  assert.equal(literalsIn(S, '.a { foo: cubic-bezier(0.2, 0, 0, 1); }').length, 1);
});

test('a multi-line transition list counts every literal', () => {
  const css = '.a {\n  transition:\n    opacity 100ms var(--x),\n    transform 200ms var(--x);\n}\n';
  assert.deepEqual(literalsIn(S, css).map((f) => f.line), [3, 4]);
});

test('JSX style transition strings and duration props are read', () => {
  assert.equal(literalsIn(J, "<i style={{ transition: 'opacity 200ms ease' }} />").length, 1);
  assert.equal(literalsIn(J, "<i style={{ animationDelay: '120ms' }} />").length, 1);
  assert.equal(literalsIn(J, "<i style={{ transition: 'opacity var(--ds-motion-appearance-fast-duration)' }} />").length, 0);
});

test('MDX prose is not read, MDX code is', () => {
  assert.equal(literalsIn(M, 'The transition settles in 250 ms.\n').length, 0);
  assert.equal(literalsIn(M, '```css\n.a { transition: opacity 200ms; }\n```\n').length, 1);
  assert.equal(literalsIn(M, '<div style={{ transition: "all 1s" }} />\n').length, 1);
});

test('comments are not declarations', () => {
  assert.equal(literalsIn(S, '/* transition: opacity 200ms; */\n.a { color: red; }').length, 0);
});

test('generated token output, tests and the generator are excluded', () => {
  assert.equal(excluded('design-system/src/tokens/ladder/_motion.scss'), true);
  assert.equal(excluded('design-system/src/tokens/ladder/springs.generated.js'), true);
  assert.equal(excluded('design-system/src/components/A/A.test.jsx'), true);
  assert.equal(excluded('design-system/src/tokens/ladder/Motion.stories.jsx'), false);
  assert.equal(excluded(S), false);
});

test('a count that rises fails, a new file fails, a fall passes', () => {
  const root = scratch({ [`motion-literal ${S}`]: 2 });
  const two = '.a { transition: a 1s; animation: b 2s; }';
  const three = '.a { transition: a 1s; animation: b 2s; transition-delay: 3s; }';
  assert.deepEqual(run({ repoRoot: root, sources: [src(S, two)] }), []);
  assert.deepEqual(run({ repoRoot: root, sources: [src(S, '.a { transition: a 1s; }')] }), []);
  const rose = run({ repoRoot: root, sources: [src(S, three)] });
  assert.match(rose[0].message, /rose against a baseline of 2/);
  const fresh = run({ repoRoot: root, sources: [src(S, two), src('design-system/src/components/B/B.scss', '.b { transition: a 1s; }')] });
  assert.match(fresh[0].message, /new code starts at zero/);
});

test('measure keys by file', () => {
  assert.deepEqual([...measure([src(S, '.a { transition: a 1s; }')]).keys()], [`motion-literal ${S}`]);
});

test('the live tree holds its own baseline', () => {
  assert.deepEqual(run(), []);
});
