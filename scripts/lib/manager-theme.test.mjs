import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { tokenCorpus } from '../../design-system/src/lib/tokens-node.mjs';
import { MANAGER_MODES, MANAGER_TOKENS, resolveManagerThemes } from './manager-theme.mjs';

const names = [...Object.values(MANAGER_TOKENS.theme), ...Object.values(MANAGER_TOKENS.vars)];

/** A token tree small enough to read: every mode block sets one token to a different literal. */
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-theme-'));
  const dir = path.join(root, 'design-system/src/tokens/color');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, '_palette.scss'),
    ':root {\n  --p-a: #111111;\n  --p-b: #222222;\n  --p-c: #333333;\n  --p-d: #444444;\n  --p-alpha: rgb(1 2 3 / 0.5);\n}\n',
  );
  const decls = (token, value) => names.map((n) => `  ${n}: ${n === token ? value : 'var(--p-a)'};`).join('\n');
  fs.writeFileSync(
    path.join(dir, '_semantic.scss'),
    [
      `:root,\n[data-color-mode="light"] {\n${decls('--ds-text', 'var(--p-b)')}\n}`,
      `[data-color-mode="dark"] {\n${decls('--ds-text', 'var(--p-c)')}\n}`,
      `:is([data-color-mode="light"], :not([data-color-mode]))[data-contrast-mode="more"] {\n  --ds-text: var(--p-d);\n}`,
      `[data-color-mode="dark"][data-contrast-mode="more"] {\n  --ds-text: var(--p-alpha);\n}`,
    ].join('\n\n') + '\n',
  );
  return root;
}

test('each mode reads its own block, and contrast overlays its color mode', () => {
  const themes = resolveManagerThemes({ root: fixture() });
  assert.deepEqual(Object.keys(themes).sort(), Object.keys(MANAGER_MODES).sort());
  assert.equal(themes['light-no-preference'].theme.textColor, '#222222');
  assert.equal(themes['dark-no-preference'].theme.textColor, '#333333');
  assert.equal(themes['light-more'].theme.textColor, '#444444');
  assert.equal(themes['dark-more'].theme.textColor, 'rgba(1, 2, 3, 0.5)');
  assert.equal(themes['light-more'].theme.appBg, '#111111', 'tokens the overlay leaves alone keep the base value');
});

test('a mapped token missing from the stylesheet throws, not blank', () => {
  const root = fixture();
  const file = path.join(root, 'design-system/src/tokens/color/_semantic.scss');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('--ds-link', '--ds-linkx'));
  assert.throws(() => resolveManagerThemes({ root }), /--ds-link does not resolve/);
});

test('the live theme equals the token values: light from the corpus, every mode distinct and literal', () => {
  const themes = resolveManagerThemes();
  const corpus = tokenCorpus({ prefix: '--ds-', precedence: 'first' });
  for (const [key, token] of Object.entries(MANAGER_TOKENS.theme)) {
    const entry = corpus.get(token);
    assert.ok(entry?.resolved, `${token} resolves in the token corpus`);
    // Alpha tokens are written `rgb(r g b / a)` in the stylesheet and `rgba(r, g, b, a)` for the theme API.
    if (!/^rgba?\(/.test(entry.value)) {
      assert.equal(themes['light-no-preference'].theme[key], entry.value.toLowerCase(), `${key} (${token}) in light`);
    }
  }
  for (const [mode, { theme, vars }] of Object.entries(themes)) {
    for (const [key, value] of [...Object.entries(theme), ...Object.entries(vars)]) {
      assert.match(value, /^(#[0-9a-f]{6}|rgba?\([\d., ]+\))$/, `${mode} ${key} is a literal color, got ${value}`);
    }
  }
  assert.notEqual(themes['dark-no-preference'].theme.appContentBg, themes['light-no-preference'].theme.appContentBg);
  assert.notEqual(themes['dark-more'].theme.appBorderColor, themes['dark-no-preference'].theme.appBorderColor);
});
