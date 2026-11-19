/**
 * The scripts that matched a token name with a pattern of their own now compose
 * the grammar module's. These pin the names each one still finds, so a change
 * to the naming scheme reaches all of them and a refactor of the pattern
 * cannot quietly change what they read.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { oldTokenReads } from './check-docs-token-literals.mjs';
import { isLiteral } from './check-font-size-literals.mjs';
import { resolveCssExpression } from './export-kit-art.mjs';
import { contextOf } from './check-ds-usage.mjs';
import { escapesIn } from './lib/ds-usage.mjs';
import { dropRetired } from './lib/tokens/retire.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';

const names = (re, text) => [...text.matchAll(new RegExp(re.source, re.flags))].map((m) => m[1]);

test('the retired-vocabulary reader finds the old names through var() and no others', () => {
  const css = 'a { color: var(--color-text); gap: var( --size-100 ); font: var(--font-size-body1) var(--font-family-code); b: var(--ds-text) c: var(--font-size-custom); d: var(--layout-page-pad-x) }';
  assert.deepEqual(names(oldTokenReads(), css), ['--color-text', '--size-100', '--font-size-body1', '--font-family-code', '--layout-page-pad-x']);
});

test('a font-size value made only of tokens is not a literal, and a literal beside one is', () => {
  assert.equal(isLiteral('var(--body-default)'), false);
  assert.equal(isLiteral('var( --icon-md )'), false);
  assert.equal(isLiteral('calc(var(--icon-md) * 2)'), false);
  assert.equal(isLiteral('var(--icon-md, 14px)'), true);
  assert.equal(isLiteral('calc(var(--icon-md) + 2px)'), true);
  assert.equal(isLiteral('var(--type-size-100) 12px'), true);
});

test('the kit export resolves a token through its aliases and a fallback', () => {
  const tokens = new Map([['--a', 'var(--b)'], ['--b', '#ABCDEF'], ['--w', '2px']]);
  assert.equal(resolveCssExpression('var(--a)', tokens), resolveCssExpression('#ABCDEF', tokens));
  assert.equal(resolveCssExpression('var(--w, 9px)', tokens), '2px');
  assert.throws(() => resolveCssExpression('var(--missing)', tokens), /Undefined token --missing/);
});

test('ds-usage reads a custom property as a declaration, a raw literal in it as an escape', () => {
  const ctx = contextOf(REPO_ROOT);
  const raw = escapesIn({ path: 'prototypes/a/src/App.css', text: '.example { --example-pad: 12px; }' }, ctx);
  assert.deepEqual(raw.map((f) => f.rule), ['ds/no-raw-literal']);
  assert.match(raw[0].message, /--example-pad: 12px/);
});

test('the retire helper drops a retired declaration by its token name and keeps the rest', () => {
  const out = dropRetired(':root {\n  --old-a: 1px;\n  --live: 2px;\n  --old-b2: 3px;\n}\n', new Set(['--old-a', '--old-b2']));
  assert.equal(out, ':root {\n  --live: 2px;\n}\n');
});
