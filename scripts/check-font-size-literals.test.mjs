/**
 * Tests for `check:font-size-literals`: a component's text size comes from a
 * token, never from a number written in the component.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isLiteral, literalSizes, run } from './check-font-size-literals.mjs';

const at = (text, file = 'design-system/src/components/x/X.scss') => literalSizes([{ path: file, text }]);

test('a token or an inherited size is not a literal', () => {
  assert.deepEqual(at('.a { font: var(--body-default); }'), []);
  assert.deepEqual(at('.a { font-size: var(--icon-md); line-height: 1; }'), []);
  assert.deepEqual(at('.a { font-size: inherit; font: inherit; }'), []);
  assert.deepEqual(at('.a { font-family: var(--type-family-body); font-weight: var(--type-weight-medium); }'), []);
});

test('a length, a bare number or a size keyword is a literal', () => {
  const found = at('.a { font-size: 7px; }\n.b { font-size: 1.5em; }\n.c { font-size: small; }');
  assert.deepEqual(found.map((f) => [f.line, f.value]), [[1, '7px'], [2, '1.5em'], [3, 'small']]);
});

test('a calc() that scales a token is derived, not a literal', () => {
  assert.deepEqual(at('.a { font-size: calc(var(--icon-md) * 7 / 16); }'), []);
  assert.equal(at('.a { font-size: calc(var(--icon-md, 16px) / 2); }').length, 1);
  assert.equal(at('.a { font-size: calc(1rem + 2px); }').length, 1);
});

test('a literal fallback is a literal: it is the size the text draws when the token is missing', () => {
  const [finding] = at('.a { font-size: var(--font-size-fa-body2, 12px); }');
  assert.equal(finding.value, 'var(--font-size-fa-body2, 12px)');
});

test('a font shorthand with a number in it is a literal', () => {
  assert.equal(at('.a { font: 600 14px/20px Lato, sans-serif; }').length, 1);
});

test('JSX style objects are read the same way, and an identifier is not judged', () => {
  const file = 'design-system/src/components/x/X.jsx';
  assert.deepEqual(at(`<i style={{ fontSize: 'var(--icon-md)' }} />`, file), []);
  assert.deepEqual(at(`<i style={{ fontSize: size }} />`, file), []);
  assert.equal(at(`<i style={{ fontSize: 12 }} />`, file).length, 1);
  assert.equal(at(`<i style={{ fontSize: '0.75rem', color: 'red' }} />`, file).length, 1);
});

test('comments are not declarations', () => {
  assert.deepEqual(at('/* font-size: 16px; */\n.a { font: var(--body-small); } // font-size: 12px'), []);
});

test('the components and patterns hold no literal font size', () => {
  const findings = run();
  assert.deepEqual(findings.map((f) => f.message), []);
});

test('a calc() that adds a length to a token still writes a size', () => {
  assert.equal(isLiteral('calc(var(--icon-md) + 2px)'), true);
  assert.equal(isLiteral('calc(var(--icon-md) * 0 + 12px)'), true);
  assert.equal(isLiteral('calc(var(--icon-md) * 7 / 16)'), false);
});
