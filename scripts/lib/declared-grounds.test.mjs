/**
 * Tests for the `@grounds` / `@contrast` block annotations the contrast checks
 * read. Each case is a way a rule could escape measurement, closed.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { INVERSE_GROUNDS } from '../../design-system/src/components/actions/CloseButton/inverseGrounds.js';
import { annotationErrors, annotationsAt, fileAnnotations } from './declared-grounds.mjs';

const VALUES = new Map([
  ['--color-primary', '#0472a8'],
  ['--color-success', '#3e691a'],
  ['--color-danger', '#ba1a1a'],
]);

const at = (source, needle) => annotationsAt(source, source.indexOf(needle));
const errors = (source) => annotationErrors('a.scss', source, VALUES, { contrast: true });

test('a multi-line block comment keeps every token, not just the first line', () => {
  const source = [
    '.x {',
    '  /* @grounds: --color-primary',
    '   *   --color-success',
    '   *   --color-danger */',
    '  color: red;',
    '}',
  ].join('\n');
  assert.deepEqual(at(source, 'color: red').grounds.tokens, ['--color-primary', '--color-success', '--color-danger']);
  assert.deepEqual(errors(source), []);
});

test('a line comment is read per line', () => {
  const source = '.x {\n  // @grounds: --color-primary --color-success\n  // not part of it: --color-danger\n  color: red;\n}\n';
  assert.deepEqual(at(source, 'color: red').grounds.tokens, ['--color-primary', '--color-success']);
});

test('a second @grounds in one block is an error, and the first one stands', () => {
  const source = '.x {\n  // @grounds: --color-primary\n  // @grounds: --color-success\n  color: red;\n}\n';
  assert.match(errors(source).join('\n'), /a\.scss:3 — a second @grounds in one block/);
  assert.deepEqual(at(source, 'color: red').grounds.tokens, ['--color-primary']);
});

test('a declaration above a nested rule does not open its block: an error, and it leaks nowhere', () => {
  // Written as a note about `.b`, it would have covered `.a` and `.c` too.
  const source = [
    '.parent {',
    '  .a { color: red; }',
    '  // @grounds: --color-primary',
    '  .b { color: green; }',
    '  .c { color: blue; }',
    '}',
  ].join('\n');
  assert.match(errors(source).join('\n'), /a\.scss:3 — @grounds must open its block/);
  for (const needle of ['color: red', 'color: green', 'color: blue']) {
    assert.equal(at(source, needle).grounds, null, needle);
  }
});

test('a declaration after a property in its block is an error too', () => {
  const source = '.x {\n  color: red;\n  // @grounds: --color-primary\n}\n';
  assert.match(errors(source).join('\n'), /@grounds must open its block/);
});

test('a declaration that opens its block covers the block and its children', () => {
  const source = '.x {\n  // @grounds: --color-primary\n  color: red;\n  &:hover { .y { color: green; } }\n}\n.z { color: blue; }\n';
  assert.deepEqual(at(source, 'color: red').grounds.tokens, ['--color-primary']);
  assert.deepEqual(at(source, 'color: green').grounds.tokens, ['--color-primary']);
  assert.equal(at(source, 'color: blue').grounds, null);
  assert.deepEqual(errors(source), []);
});

test('the innermost declaration of a kind wins', () => {
  const source = [
    '.x {',
    '  // @grounds: --color-primary',
    '  color: red;',
    '  .y {',
    '    // @grounds: --color-success',
    '    color: green;',
    '  }',
    '}',
  ].join('\n');
  assert.deepEqual(at(source, 'color: red').grounds.tokens, ['--color-primary']);
  assert.deepEqual(at(source, 'color: green').grounds.tokens, ['--color-success']);
});

test('@contrast: only `non-text`, and only on an icon selector', () => {
  const on = (selector, value = 'non-text') => `${selector} {\n  // @contrast: ${value}\n  color: red;\n}\n`;
  for (const selector of ['.x__icon', '.x .fa-solid', 'i.fa-xmark', '.x svg']) {
    assert.deepEqual(errors(on(selector)), [], selector);
  }
  assert.match(errors(on('.x__label')).join('\n'), /non-text on a text selector/);
  assert.match(errors(on('.x__icon', 'large')).join('\n'), /not a known value/);
});

test('the placement sweep covers every block, including ones no check measures', () => {
  const { errors: found } = fileAnnotations('.x {\n  .y { }\n  /* @contrast: non-text */\n}\n');
  assert.equal(found.length, 1);
});

/*
 * CloseButton's inverse grounds have two readers besides the checks — the
 * InverseGrounds story and this list — and they must name the same grounds as
 * the SCSS the checks measure.
 */
test("CloseButton's exported inverse grounds match the @grounds line in its SCSS", () => {
  const scss = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../design-system/src/components/actions/CloseButton/CloseButton.scss',
  );
  const source = fs.readFileSync(scss, 'utf8');
  const declared = annotationsAt(source, source.indexOf('var(--color-focus-ring-inverse)')).grounds;
  assert.deepEqual(declared.tokens, INVERSE_GROUNDS);
  assert.ok(INVERSE_GROUNDS.includes('--color-warning'));
});
