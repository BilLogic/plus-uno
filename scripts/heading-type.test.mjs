/**
 * The bare heading elements follow the type mapping: levels 32 to 20 are Noto
 * Serif at 500, level 16 is Noto Sans at 600.
 *
 * `_fonts.scss` gives each bare `h1`-`h6` a heading text style. This compiles
 * it and reads what each element's `font` resolves to, so a heading that drifts
 * off the type set fails here instead of in a screenshot.
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

/** What a selector's own `font` shorthand resolves to, last rule wins. */
function font(selector) {
  let got = '';
  for (const rule of rules) {
    if (!rule.selectors.includes(selector)) continue;
    for (const [name, value] of rule.decls) if (name === 'font') got = resolve(value);
  }
  return got;
}

for (const level of ['h1', 'h2', 'h3', 'h4', 'h5']) {
  test(`${level} is Noto Serif at 500`, () => {
    assert.match(font(level), /^500 \S+ \/ \S+ "Noto Serif"/);
  });
}

test('h6 is Noto Sans at 600', () => {
  assert.match(font('h6'), /^600 \S+ \/ \S+ "Noto Sans"/);
});
