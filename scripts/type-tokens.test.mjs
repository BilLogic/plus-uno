/**
 * The type token set, as code reads it after generation from the BS4
 * Foundation library's `typography` collection.
 *
 * The library side is `design-system/src/tokens/source/typography.json`,
 * exported from Figma: the hidden `Font size/*` and `Line height/*` variables
 * named by rem × 100, the `Family/*` and `Weight/*` variables, and the text styles with every property bound to one
 * of them. The code side is the token corpus. Each test reads both, so a style
 * that drifts in either place fails here.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenCorpus, tokenSources } from '../design-system/src/lib/tokens-node.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'design-system/src/tokens/source/typography.json'), 'utf8'),
);
const corpus = tokenCorpus({ root: REPO_ROOT });

/** A token's literal value, with every `var()` inside it resolved. */
function resolved(name, seen = new Set()) {
  const entry = corpus.get(name);
  assert.ok(entry, `${name} is not declared`);
  assert.ok(!seen.has(name), `${name} aliases itself`);
  return entry.raw.replace(/var\((--[\w-]+)\)/g, (_, inner) => resolved(inner, new Set([...seen, name])));
}

const FONT_SIZES = { '075': 12, '0875': 14, 100: 16, 125: 20, 150: 24, 175: 28, 200: 32 };
const LINE_HEIGHTS = { 100: 16, 125: 20, 150: 24, 175: 28, 200: 32, 225: 36 };
const rem = (px) => `${px / 16}rem`;

/** Name, family, size px, line height px, weight, letter spacing %: the Atlassian scale in the lab. */
const STYLES = [
  ['Heading/xxlarge', 'heading', 32, 36, 400, -2],
  ['Heading/xlarge', 'heading', 28, 32, 400, -2],
  ['Heading/large', 'heading', 24, 28, 400, -1.5],
  ['Heading/medium', 'heading', 20, 24, 500, -0.5],
  ['Heading/small', 'heading', 16, 20, 500, 0],
  ['Heading/xsmall', 'heading', 14, 20, 500, 0],
  ['Heading/xxsmall', 'heading', 12, 16, 500, 1],
  ['Body/large', 'body', 16, 24, 400, 0],
  ['Body/default', 'body', 14, 20, 400, 0.5],
  ['Body/small', 'body', 12, 16, 400, 1],
  ['Metric/large', 'heading', 28, 32, 500, -1],
  ['Metric/medium', 'heading', 24, 28, 500, -1],
  ['Metric/small', 'heading', 16, 20, 500, 0],
];
const STACKS = {
  heading: '"Google Sans Flex", "Google Sans Flex Fallback", sans-serif',
  brand: '"Google Sans Flex", "Google Sans Flex Fallback", sans-serif',
  body: '"Google Sans Flex", "Google Sans Flex Fallback", sans-serif',
  code: '"Google Sans Code", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};
const cssName = (style) => `--${style.toLowerCase().replace('/', '-').replace(/^(heading|body|metric)-(xxlarge|xlarge|large|medium|small|xsmall|xxsmall)$/, (_, family, size) => `${family}-${({ xxlarge: 'xxl', xlarge: 'xl', large: 'lg', medium: 'md', small: 'sm', xsmall: 'xs', xxsmall: 'xxs' })[size]}`)}`;

test('the font primitives are named by rem × 100 and resolve to their rem value', () => {
  for (const [step, px] of Object.entries(FONT_SIZES)) {
    assert.equal(corpus.get(`--type-size-${step}`)?.value, rem(px), `--type-size-${step}`);
  }
  for (const [step, px] of Object.entries(LINE_HEIGHTS)) {
    assert.equal(corpus.get(`--type-line-height-${step}`)?.value, rem(px), `--type-line-height-${step}`);
  }
});

test('the family and weight variables resolve to Google Sans Flex, Google Sans Code and 400 · 500 · 600', () => {
  assert.equal(corpus.get('--type-family-heading')?.value, STACKS.heading);
  assert.equal(corpus.get('--type-family-body')?.value, STACKS.body);
  assert.equal(corpus.get('--type-family-heading-serif'), undefined, 'the serif heading family is retired');
  assert.equal(corpus.get('--type-family-code')?.value, STACKS.code);
  assert.equal(corpus.get('--type-family-brand-heading')?.value, STACKS.brand);
  assert.equal(corpus.get('--type-family-brand-body')?.value, STACKS.body);
  assert.equal(corpus.get('--type-weight-regular')?.value, '400');
  assert.equal(corpus.get('--type-weight-medium')?.value, '500');
  assert.equal(corpus.get('--type-weight-semibold')?.value, '600');
});

test('every text style resolves to its size, line height, weight and family', () => {
  for (const [style, family, size, lineHeight, weight] of STYLES) {
    assert.equal(
      resolved(cssName(style)),
      `${weight} ${rem(size)} / ${rem(lineHeight)} ${STACKS[family]}`,
      cssName(style),
    );
  }
});

test('every text style has a tracking companion in em, and the tracking variables hold its percent', () => {
  for (const [style, , , , , percent] of STYLES) {
    assert.equal(resolved(`${cssName(style)}-tracking`), `${percent / 100}em`, `${cssName(style)}-tracking`);
  }
  assert.equal(corpus.get('--heading-xl-tracking')?.raw, 'var(--type-tracking-tighter)');
});

test('only weights 400 and 500 are in a text style', () => {
  for (const [style, , , , weight] of STYLES) assert.ok([400, 500].includes(weight), style);
});

test('code is 0.875em of the text around it, in the code stack', () => {
  assert.equal(resolved('--code-default'), `400 0.875em / 1 ${STACKS.code}`);
});

test('every library text style binds all four properties to a type variable', () => {
  const variables = new Map(EXPORT.variables.map((v) => [v.id, v]));
  assert.deepEqual(
    EXPORT.textStyles.map((s) => s.name).sort(),
    STYLES.map(([name]) => name).sort(),
    'the library carries exactly these styles: no Button style, no Code style',
  );
  for (const style of EXPORT.textStyles) {
    for (const field of ['fontFamily', 'fontSize', 'lineHeight', 'fontWeight']) {
      assert.ok(variables.has(style.boundVariables[field]), `${style.name} ${field} holds a raw value`);
    }
  }
});

test('the font primitives are hidden in the library and every type variable is scoped', () => {
  const scope = { 'Font size/': 'FONT_SIZE', 'Line height/': 'LINE_HEIGHT', 'Family/': 'FONT_FAMILY', 'Weight/': 'FONT_WEIGHT', 'Letter spacing/': 'LETTER_SPACING' };
  for (const v of EXPORT.variables) {
    const [start, expected] = Object.entries(scope).find(([s]) => v.name.startsWith(s)) ?? [];
    assert.ok(start, `${v.name} is none of ${Object.keys(scope).join(', ')}`);
    assert.deepEqual(v.scopes, [expected], `${v.name} scopes`);
    assert.equal(v.hiddenFromPublishing, start === 'Font size/' || start === 'Line height/', `${v.name} hidden`);
  }
});

test('each code style is built from the variables its library style binds', () => {
  const syntax = new Map(EXPORT.variables.map((v) => [v.id, v.codeSyntax.WEB]));
  for (const style of EXPORT.textStyles) {
    const { fontWeight, fontSize, lineHeight, fontFamily } = style.boundVariables;
    assert.equal(
      corpus.get(cssName(style.name))?.raw,
      `${syntax.get(fontWeight)} ${syntax.get(fontSize)} / ${syntax.get(lineHeight)} ${syntax.get(fontFamily)}`,
      style.name,
    );
  }
});

test('a family is set in one place: the family token, never in a style', () => {
  const declarations = tokenSources({ root: REPO_ROOT }).flatMap(({ text }) =>
    [...text.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)].map(([, name, value]) => ({ name, value })),
  );
  for (const [face, tokens] of [
    ['Google Sans Flex', ['--type-family-heading', '--type-family-body', '--type-family-brand-heading', '--type-family-brand-body']],
    ['Google Sans Code', ['--type-family-code']],
  ]) {
    const setters = declarations.filter((d) => d.value.startsWith(`"${face}",`)).map((d) => d.name);
    assert.deepEqual(setters, tokens, `"${face}" is written outside ${tokens.join(', ')}`);
  }
  for (const [style, family] of STYLES) {
    assert.match(corpus.get(cssName(style)).raw, new RegExp(`var\\(--type-family-${family}\\)$`), style);
  }
});

test('metric classes and .num set tabular figures; running text does not', () => {
  const css = fs.readFileSync(path.join(REPO_ROOT, 'design-system/src/tokens/_type.scss'), 'utf8');
  for (const size of ['lg', 'md', 'sm']) {
    assert.match(css, new RegExp(`\\.metric-${size} \{[^}]*font-variant-numeric: tabular-nums`), `.metric-${size}`);
  }
  assert.match(css, /\.num \{ font-variant-numeric: tabular-nums; \}/);
  assert.doesNotMatch(css, /\.body-\w+ \{[^}]*tabular-nums/);
});

test('rounded ends and optical sizing are set once at the root', () => {
  const fonts = fs.readFileSync(path.join(REPO_ROOT, 'design-system/src/tokens/_fonts.scss'), 'utf8');
  assert.match(fonts, /:root\s*\{[^}]*font-variation-settings:\s*"ROND" 100;[^}]*font-optical-sizing:\s*auto;/);
});
