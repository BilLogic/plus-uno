/**
 * Tests for `check:radius-literals`: a component's corners come from a radius
 * token, never from a number or a primitive step.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { literalRadii, run } from './check-radius-literals.mjs';

const at = (text, file = 'design-system/src/components/x/X.scss') => literalRadii([{ path: file, text }]);

test('semantic, Control, pattern and component tokens are allowed', () => {
  assert.deepEqual(at('.a { border-radius: var(--radius-md); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--radius-control-lg); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--card-radius); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--button-radius-default); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--tab-radius) var(--tab-radius) 0 0; }'), []);
});

test('full, 0, inherit and a calc() that scales a token are allowed', () => {
  assert.deepEqual(at('.a { border-radius: var(--radius-full); }'), []);
  assert.deepEqual(at('.a { border-radius: 0; border-top-left-radius: 0 !important; }'), []);
  assert.deepEqual(at('.a { border-radius: inherit; }'), []);
  assert.deepEqual(at('.a { border-radius: min(calc(var(--s) / 4), var(--radius-xxl)); }'), []);
});

test('a px length is a literal', () => {
  const [f] = at('.a {\n  border-radius: 4px;\n}');
  assert.deepEqual([f.line, f.value], [2, '4px']);
  assert.equal(at('.a { border-start-end-radius: 0.5rem; }').length, 1);
});

test('a percentage is a literal', () => {
  assert.equal(at('.a { border-radius: 50%; }').length, 1);
});

test('a primitive radius step is a literal', () => {
  assert.equal(at('.a { border-radius: var(--radius-0625); }').length, 1);
  assert.equal(at('.a { border-radius: var(--radius-025); }').length, 1);
});

test('a literal fallback is a literal', () => {
  assert.equal(at('.a { border-radius: var(--radius-full, 9999px); }').length, 1);
});

test('a component radius property holds the same rule', () => {
  assert.equal(at('.a { --tile-radius: 6px; }').length, 1);
  assert.deepEqual(at('.a { --tile-radius: var(--radius-md); }'), []);
});

test('JSX style objects are read the same way, and an identifier is not judged', () => {
  const file = 'design-system/src/patterns/x/X.jsx';
  assert.deepEqual(at(`<i style={{ borderRadius: 'var(--radius-full)' }} />`, file), []);
  assert.deepEqual(at(`<i style={{ borderRadius: r }} />`, file), []);
  assert.equal(at(`<i style={{ borderRadius: '4px' }} />`, file).length, 1);
  assert.equal(at(`<i style={{ borderRadius: '50%' }} />`, file).length, 1);
  assert.equal(at(`<i style={{ borderRadius: 'var(--radius-050)' }} />`, file).length, 1);
});

test('comments are not declarations', () => {
  assert.deepEqual(at('/* border-radius: 4px; */\n.a { border-radius: 0; } // border-radius: 50%'), []);
});

test('the components and patterns hold no literal radius', () => {
  assert.deepEqual(run().map((f) => f.message), []);
});
