/**
 * The bare heading elements take the Heading size paired with their level:
 * h1 xxlarge (32), h2 xlarge (28), h3 large (24), h4 medium (20), h5 small (16),
 * h6 xsmall (14). Every level is Noto Sans at 600.
 *
 * `_fonts.scss` gives each bare `h1`-`h6` a heading text style. This compiles
 * it and reads what each element's `font` resolves to, so a heading that drifts
 * off the type set fails here instead of in a screenshot.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

const LEVEL_SIZES = { h1: 'xxl', h2: 'xl', h3: 'lg', h4: 'md', h5: 'sm', h6: 'xs' };

for (const [level, size] of Object.entries(LEVEL_SIZES)) {
  test(`${level} takes the ${size} heading style`, () => {
    assert.equal(font(level), resolve(`var(--heading-${size})`));
  });
}

for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
  test(`${level} is Noto Sans at 600`, () => {
    assert.match(font(level), /^600 \S+ \/ \S+ "Noto Sans"/);
  });
}


const docsCss = fs.readFileSync(path.join(ROOT, '.storybook/storybook-overrides.css'), 'utf8');
const docsRoot = require('postcss').parse(docsCss);
for (const [level, size] of Object.entries(LEVEL_SIZES)) {
  test(`docs ${level} shares the product heading style`, () => {
    const selector = `.sbdocs ${level}:not([style]):not(:where(.docs-story *, .sb-ds-dodont-card *, aside *))`;
    const rule = docsRoot.nodes.find((node) => node.type === 'rule' && node.selectors.includes(selector));
    assert.ok(rule, selector);
    const fontDecl = rule.nodes.find((node) => node.prop === 'font');
    assert.equal(resolve(fontDecl.value), font(level));
    const tracking = rule.nodes.find((node) => node.prop === 'letter-spacing');
    if (tokens.has(`--heading-${size}-tracking`)) {
      assert.equal(tracking?.value, `var(--heading-${size}-tracking)`);
    }
  });
}

test('docs preserve explicit heading size classes', () => {
  docsRoot.walkRules((rule) => {
    if (!/\.heading-(xxl|xl|lg|md|sm|xs|xxs)\b/.test(rule.selector)) return;
    for (const decl of rule.nodes.filter((node) => node.type === 'decl')) {
      assert.ok(!['font', 'font-size', 'line-height', 'letter-spacing'].includes(decl.prop), rule.selector);
    }
  });
});


for (const size of ['heading-xs', 'heading-xxs', 'body-lg', 'body-sm', 'metric-lg', 'metric-md', 'metric-sm']) {
  test(`generated .${size} uses the matching text style`, () => {
    assert.ok(tokens.has(`--${size}`));
    assert.equal(font(`.${size}`), resolve(`var(--${size})`));
  });
}
