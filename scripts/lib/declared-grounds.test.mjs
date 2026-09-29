/**
 * Tests for the structural annotation reader the contrast checks share. Each
 * case is a way a rule could escape measurement, closed — or an intended
 * behavior, pinned.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { INVERSE_GROUNDS } from '../../design-system/src/components/actions/CloseButton/inverseGrounds.js';
import {
  GLYPH_PARTIAL,
  GLYPH_SELECTORS,
  analyzeSheet,
  annotationErrors,
  glyphSelectors,
  groundAt,
  groundsOfSelector,
  hasIconSubject,
  isNonText,
  resolvedSelectors,
} from './declared-grounds.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const VALUES = new Map([
  ['--color-primary', '#0472a8'],
  ['--color-success', '#3e691a'],
  ['--color-danger', '#ba1a1a'],
]);

const ground = (source, needle) => groundAt(analyzeSheet(source), source.indexOf(needle));
const nonText = (source, needle) => isNonText(analyzeSheet(source), source.indexOf(needle));
const errors = (source) => annotationErrors('a.scss', source, VALUES, { contrast: true });

/* ------------------------------------------------------------- placement */

test('a multi-line block comment keeps every token', () => {
  const source = '.x {\n  /* @grounds: --color-primary\n   *   --color-success\n   *   --color-danger */\n  color: red;\n}\n';
  assert.deepEqual(ground(source, 'color: red').tokens, ['--color-primary', '--color-success', '--color-danger']);
  assert.deepEqual(errors(source), []);
});

test('a line comment is one line; the next comment is not part of it', () => {
  const source = '.x {\n  // @grounds: --color-primary --color-success\n  // not part of it: --color-danger\n  color: red;\n}\n';
  assert.deepEqual(ground(source, 'color: red').tokens, ['--color-primary', '--color-success']);
});

test('a second @grounds in one rule is an error, and the first one stands', () => {
  const source = '.x {\n  // @grounds: --color-primary\n  // @grounds: --color-success\n  color: red;\n}\n';
  assert.match(errors(source).join('\n'), /a\.scss:3 — a second @grounds in one block/);
  assert.deepEqual(ground(source, 'color: red').tokens, ['--color-primary']);
});

test('an annotation after a declaration or a nested rule does not open its block', () => {
  for (const source of [
    '.x {\n  color: red;\n  // @grounds: --color-primary\n}\n',
    '.x {\n  .a { color: red; }\n  // @grounds: --color-primary\n  .b { color: green; }\n}\n',
  ]) {
    assert.match(errors(source).join('\n'), /@grounds must open its block/);
    assert.deepEqual(ground(source, 'color: red'), { kind: 'page' });
  }
});

test('an annotation at the top level or inside an at-rule belongs to no rule: an error', () => {
  assert.match(errors('// @grounds: --color-primary\n.x { color: red; }\n').join('\n'), /must open its block/);
  assert.match(errors('@media (min-width: 1px) {\n  // @grounds: --color-primary\n  .x { color: red; }\n}\n').join('\n'), /must open its block/);
});

/* ------------------------------------------------------- ground resolution */

test('a nearer background beats a farther @grounds', () => {
  const source = '.x {\n  // @grounds: --color-primary\n  .y {\n    background-color: var(--color-success);\n    .z { color: red; }\n  }\n}\n';
  assert.deepEqual(ground(source, 'color: red'), { kind: 'background', token: '--color-success', line: 3, own: false });
});

test('a nearer @grounds beats a farther background', () => {
  const source = '.x {\n  background-color: var(--color-success);\n  .y {\n    // @grounds: --color-primary\n    color: red;\n  }\n}\n';
  assert.deepEqual(ground(source, 'color: red').tokens, ['--color-primary']);
});

test('a rule that paints the page token itself keeps it over an ancestor @grounds', () => {
  const source = '.x {\n  // @grounds: --color-primary\n  .y {\n    background-color: var(--color-surface);\n    color: red;\n  }\n}\n';
  assert.equal(ground(source, 'color: red').token, '--color-surface');
});

test('one-line and multi-line blocks resolve the same', () => {
  const oneLine = '.x { // @grounds: --color-primary\n .y { color: red; } }\n';
  const multi = '.x {\n  // @grounds: --color-primary\n  .y {\n    color: red;\n  }\n}\n';
  assert.deepEqual(ground(oneLine, 'color: red').tokens, ground(multi, 'color: red').tokens);
  const bgOne = '.x { background-color: var(--color-success); .y { color: red; } }\n';
  const bgMulti = '.x {\n  background-color: var(--color-success);\n  .y {\n    color: red;\n  }\n}\n';
  assert.equal(ground(bgOne, 'color: red').token, ground(bgMulti, 'color: red').token);
});

test('@grounds covers every rule nested in the one it opens — siblings included, by design', () => {
  // Children of a block on primary are on primary. This is attached to `.zz`
  // structurally, so it is scope, not a leak.
  const source = '.zz {\n  // @grounds: --color-primary\n  .a { color: red; }\n  .b { color: green; }\n}\n.other { color: blue; }\n';
  assert.deepEqual(ground(source, 'color: red').tokens, ['--color-primary']);
  assert.deepEqual(ground(source, 'color: green').tokens, ['--color-primary']);
  assert.deepEqual(ground(source, 'color: blue'), { kind: 'page' });
});

test('the innermost @grounds wins', () => {
  const source = '.x {\n  // @grounds: --color-primary\n  color: red;\n  .y {\n    // @grounds: --color-success\n    color: green;\n  }\n}\n';
  assert.deepEqual(ground(source, 'color: red').tokens, ['--color-primary']);
  assert.deepEqual(ground(source, 'color: green').tokens, ['--color-success']);
});

/* ----------------------------------------------------- @contrast: non-text */

const icon = (selector, body = 'color: red;') => `${selector} {\n  // @contrast: non-text\n  ${body}\n}\n`;

test('@contrast: non-text is valid only when every selector has an icon subject', () => {
  for (const selector of ['.a .fa-solid', 'i.fa-brands.fa-github', '.x svg', '.fa', '.x > .fas', '.x .fa-light']) {
    assert.deepEqual(errors(icon(selector)), [], selector);
  }
});

test('reviewer escapes: each is an error, and the text bar stays', () => {
  for (const selector of ['.label .fa-solid, .label', '.label:not(.fa-solid)', '.zz svg + .label', '.zz__icon-label']) {
    const source = icon(selector);
    assert.match(errors(source).join('\n'), /non-text on a text selector/, selector);
    assert.equal(nonText(source, 'color: red'), false, selector);
  }
});

test('@contrast resolves SCSS nesting and `&` before judging the subject', () => {
  assert.deepEqual(errors('.x {\n  &.fa-solid {\n    // @contrast: non-text\n    color: red;\n  }\n}\n'), []);
  assert.deepEqual(errors('.x {\n  .fa-solid {\n    // @contrast: non-text\n    color: red;\n  }\n}\n'), []);
  assert.match(errors('.fa-solid {\n  & + .label {\n    // @contrast: non-text\n    color: red;\n  }\n}\n').join('\n'), /text selector/);
});

/** The resolved selectors of the rule whose own selector is `own`. */
const resolved = (source, own) => {
  let found = null;
  analyzeSheet(source).root.walkRules((rule) => { if (rule.selector === own) found = rule; });
  return resolvedSelectors(found);
};

test('`&` expands to the parent literally, even when the parent holds a replacement pattern', () => {
  // `String.replace` reads `$&`, `$'` and `` $` `` in a replacement STRING as
  // patterns; the parent selector is text and must arrive as written.
  assert.deepEqual(resolved('.a[data-x="$&"] {\n  &:hover { color: red; }\n}\n', '&:hover'), ['.a[data-x="$&"]:hover']);
  assert.deepEqual(resolved(".a[data-x=\"$'\"] {\n  &:hover { color: red; }\n}\n", '&:hover'), [".a[data-x=\"$'\"]:hover"]);
});

test('a backslash-escaped `&` is text, not the parent', () => {
  // `.b\&` is a class named `b&`: no parent reference, so it nests as a descendant.
  assert.deepEqual(resolved('.a {\n  .b\\& { color: red; }\n}\n', '.b\\&'), ['.a .b\\&']);
  assert.deepEqual(resolved('.a {\n  &.b\\& { color: red; }\n}\n', '&.b\\&'), ['.a.b\\&']);
  // An escaped backslash does not escape the `&` after it.
  assert.deepEqual(resolved('.a {\n  .b\\\\ & { color: red; }\n}\n', '.b\\\\ &'), ['.b\\\\ .a']);
});

test('an `&` inside a quoted attribute value is text, not the parent', () => {
  assert.deepEqual(resolved('.p {\n  &[data-label="a & b"] { color: red; }\n}\n', '&[data-label="a & b"]'), ['.p[data-label="a & b"]']);
  // No `&` outside the quotes, so the rule nests as a descendant.
  assert.deepEqual(resolved(".p {\n  [data-label='a & b'] { color: red; }\n}\n", "[data-label='a & b']"), [".p [data-label='a & b']"]);
});

test('@contrast never reaches a nested rule: nested text keeps the text bar', () => {
  const source = '.zz .fa-solid {\n  // @contrast: non-text\n  color: red;\n  .label { color: green; }\n}\n';
  assert.deepEqual(errors(source), []);
  assert.equal(nonText(source, 'color: red'), true);
  assert.equal(nonText(source, 'color: green'), false);
});

test('@contrast values other than non-text are errors', () => {
  assert.deepEqual(errors(icon('.x .fa-solid')), []);
  assert.match(errors('.x .fa-solid {\n  // @contrast: large\n  color: red;\n}\n').join('\n'), /not a known value/);
});

test('icon subjects, directly', () => {
  assert.equal(hasIconSubject('.a .fa-solid'), true);
  assert.equal(hasIconSubject('.fa-solid .label'), false);
  assert.equal(hasIconSubject('.label:not(.fa-solid)'), false);
  assert.equal(hasIconSubject('.zz__icon-label'), false);
});

test('an icon is a glyph class or svg, not any `fa-*` name and not an `__icon` slot', () => {
  // An icon name alone does not render; the layers classes hold text; an
  // `__icon` element names a slot, which can hold text.
  for (const selector of ['.a .fa-check', '.a .fa-layers-text', '.a .fa-layers-counter', '.a .fa-stack', '.x__icon']) {
    assert.equal(hasIconSubject(selector), false, selector);
  }
});

/* --------------------------------------------------- one definition of icon */

const partial = (body) => `@mixin icon-glyph {\n${body}\n}\n`;

test('the checker reads its glyph list from the icon-glyph mixin, and accepts exactly it', () => {
  const source = fs.readFileSync(path.join(REPO, GLYPH_PARTIAL), 'utf8');
  assert.deepEqual(GLYPH_SELECTORS, glyphSelectors(source));
  for (const selector of GLYPH_SELECTORS) assert.equal(hasIconSubject(`.x ${selector}`), true, selector);
  // Every Font Awesome style takes the same rule as solid and regular.
  for (const style of ['.fab', '.fa-brands', '.fa-light', '.fa-thin', '.fa-duotone', '.fa-sharp', '.fal', '.fat', '.fad']) {
    assert.ok(GLYPH_SELECTORS.includes(style), style);
  }
});

test('a glyph mixin the checker cannot read is an error, not an empty list', () => {
  assert.throws(() => glyphSelectors('.x { color: red; }\n'), /no @mixin icon-glyph/);
  assert.throws(() => glyphSelectors(partial('  .fa { color: red; }')), /one rule holding @content/);
  assert.throws(() => glyphSelectors(partial('  .fa .x { @content; }')), /a single class or type/);
});

test('an `@include icon-glyph` block is measured as the rule it compiles to', () => {
  const source = '.p {\n  .x__icon {\n    @include icon-glyph {\n      // @contrast: non-text\n      color: red;\n    }\n  }\n}\n';
  assert.deepEqual(errors(source), []);
  assert.equal(nonText(source, 'color: red'), true);
  const sheet = analyzeSheet(source);
  const [rule] = sheet.glyphRules;
  assert.deepEqual(resolvedSelectors(rule), GLYPH_SELECTORS.map((g) => `.p .x__icon ${g}`));
  // A namespaced include is the same mixin.
  assert.deepEqual(errors(source.replace('icon-glyph', 'icons.icon-glyph')), []);
});

test('an `@include` of any other mixin is an at-rule: an annotation in it opens nothing', () => {
  const source = '.x {\n  @include other {\n    // @contrast: non-text\n    color: red;\n  }\n}\n';
  assert.match(errors(source).join('\n'), /@contrast must open its block/);
  assert.equal(nonText(source, 'color: red'), false);
});

/* ------------------------------------------------------------- drift guard */

test('OverviewCard names no glyph by hand: each non-text color opens an icon-glyph include', () => {
  const file = path.join(REPO, 'design-system/src/specs/Universal/Cards/OverviewCard/OverviewCard.scss');
  const sheet = analyzeSheet(fs.readFileSync(file, 'utf8'));
  const annotated = [...sheet.annotations].filter(([, own]) => own.contrast).map(([rule]) => rule);
  assert.equal(annotated.length, 5, 'one per SMART type');
  for (const rule of annotated) assert.ok(sheet.glyphRules.has(rule), `line ${rule.source.start.line}`);
  sheet.root.walkRules((rule) => {
    if (sheet.glyphRules.has(rule)) return;
    for (const selector of rule.selectors) {
      assert.equal(hasIconSubject(selector), false, `line ${rule.source.start.line}: \`${selector}\` lists a glyph by hand`);
    }
  });
});

test("CloseButton's exported inverse grounds match the @grounds on its inverse tone", () => {
  const scss = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../design-system/src/components/actions/CloseButton/CloseButton.scss',
  );
  const tokens = groundsOfSelector(fs.readFileSync(scss, 'utf8'), '.plus-close-btn--inverse');
  assert.deepEqual(tokens, INVERSE_GROUNDS);
  assert.ok(INVERSE_GROUNDS.includes('--color-warning'));
});
