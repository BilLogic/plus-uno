/**
 * The legacy heading paths follow the type mapping: levels 32 to 20 are Noto
 * Serif at 500, levels 16 to 12 are Noto Sans at 600.
 *
 * The `--heading-*` text styles already say this. What carried the old
 * sans-700 voice was everything older: `--font-family-headline`,
 * `--font-weight-headline`, `.display1-3-txt`, the bare `h1`-`h6` elements and
 * their `.h1`-`.h6` classes, and the `--type-h*` composites built from them.
 * This compiles `_fonts.scss` and reads what each one resolves to, so a
 * heading that drifts back to sans 700 fails here instead of in a screenshot.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sass = require('sass');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = sass.compile(path.join(ROOT, 'design-system/src/tokens/_fonts.scss')).css;

/** Every rule as `{ selectors, decls }`, in source order. Nested at-rules are skipped. */
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@charset[^;]*;/, '').matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: m[1].split(',').map((s) => s.trim()),
  decls: [...m[2].matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map((d) => [d[1], d[2].trim()]),
}));

const tokens = new Map();
for (const rule of rules.filter((r) => r.selectors.includes(':root'))) {
  for (const [name, value] of rule.decls) if (name.startsWith('--')) tokens.set(name, value);
}

/** Follow `var(--x)` (and `var(--x, fallback)`) to a literal. */
function resolve(value) {
  let out = value;
  for (let i = 0; i < 12 && /var\(/.test(out); i += 1) {
    out = out.replace(/var\((--[\w-]+)(?:\s*,\s*[^()]*)?\)/g, (_, name) => tokens.get(name) ?? '');
  }
  return out.trim();
}

/** What a selector's own `font-*` declarations resolve to, last rule wins. */
function computed(selector) {
  const got = {};
  for (const rule of rules) {
    if (!rule.selectors.includes(selector)) continue;
    for (const [name, value] of rule.decls) if (/^font-(family|weight)$/.test(name)) got[name] = resolve(value);
  }
  return got;
}

const SERIF = /^"Noto Serif"/;
const SANS = /^"Noto Sans"/;

for (const level of ['h1', 'h2', 'h3', 'h4', 'h5']) {
  for (const selector of [level, `.${level}`]) {
    test(`${selector} is Noto Serif at 500`, () => {
      const { 'font-family': family, 'font-weight': weight } = computed(selector);
      assert.match(family, SERIF);
      assert.equal(weight, '500');
    });
  }
}

for (const selector of ['h6', '.h6']) {
  test(`${selector} is Noto Sans at 600`, () => {
    const { 'font-family': family, 'font-weight': weight } = computed(selector);
    assert.match(family, SANS);
    assert.equal(weight, '600');
  });
}

for (const n of [1, 2, 3]) {
  test(`.display${n}-txt is Noto Serif at 500`, () => {
    const { 'font-family': family, 'font-weight': weight } = computed(`.display${n}-txt`);
    assert.match(family, SERIF);
    assert.equal(weight, '500');
  });
}

test('the older headline and title tokens carry the serif voice', () => {
  assert.match(resolve('var(--font-family-headline)'), SERIF);
  assert.equal(resolve('var(--font-weight-headline)'), '500');
  assert.match(resolve('var(--font-family-title)'), SERIF);
  assert.equal(resolve('var(--font-weight-title)'), '500');
});

test('each --type-h* composite resolves to the same family and weight as its class', () => {
  for (let n = 1; n <= 6; n += 1) {
    const { 'font-family': family, 'font-weight': weight } = computed(`.h${n}`);
    const composite = resolve(`var(--type-h${n})`);
    assert.ok(composite.startsWith(weight), `--type-h${n} weight: ${composite}`);
    assert.ok(composite.endsWith(family), `--type-h${n} family: ${composite}`);
  }
});
