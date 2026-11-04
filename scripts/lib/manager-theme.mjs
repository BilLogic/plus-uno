/**
 * The Storybook manager's colors, resolved from the color tokens, one set per
 * mode.
 *
 * Storybook's theme API (`create()`) takes literal colors, not `var()`, and the
 * manager runs outside the preview iframe, so it cannot read the page's custom
 * properties. This module reads the generated color stylesheets at build time
 * and hands `.storybook/main.js` the literals; `.storybook/manager.js` picks the
 * set that matches the Color mode and Contrast toolbar globals.
 *
 * Four modes: light and dark, each at standard and more contrast. `auto` is
 * resolved in the browser from the OS before it reaches this table.
 */

import { COLOR_PALETTE_FILE, COLOR_SEMANTIC_FILE, COLOR_TOKEN_DIR } from '../../design-system/src/lib/tokens-node.mjs';
import { REPO_ROOT, text } from './corpus.mjs';

/**
 * What each theme key and each manager CSS variable reads. A name here must
 * exist in every mode block of the semantic stylesheet.
 */
export const MANAGER_TOKENS = {
  theme: {
    colorPrimary: '--ds-background-brand-bold',
    colorSecondary: '--ds-link',
    appBg: '--ds-surface-sunken',
    appContentBg: '--ds-surface',
    appPreviewBg: '--ds-surface-sunken',
    appBorderColor: '--ds-border',
    appHoverBg: '--ds-surface-hovered',
    barBg: '--ds-surface',
    barTextColor: '--ds-text-subtle',
    barHoverColor: '--ds-text',
    barSelectedColor: '--ds-text',
    textColor: '--ds-text',
    textInverseColor: '--ds-text-inverse',
    textMutedColor: '--ds-text-subtle',
    inputBg: '--ds-background-input',
    inputBorder: '--ds-border-input',
    inputTextColor: '--ds-text',
    buttonBg: '--ds-surface-hovered',
    buttonBorder: '--ds-border',
    booleanBg: '--ds-background-neutral',
    booleanSelectedBg: '--ds-background-brand-bold',
  },
  // The selected sidebar row's pair; manager.js writes it as a rule.
  vars: {
    '--plus-manager-selected-bg': '--ds-background-brand-bold',
    '--plus-manager-selected-fg': '--ds-text-inverse',
  },
};

/** The four modes, keyed `<color>-<contrast>`, and the selector of the block that sets each. */
export const MANAGER_MODES = {
  'light-no-preference': { base: ':root,\n[data-color-mode="light"]', over: null },
  'dark-no-preference': { base: '[data-color-mode="dark"]', over: null },
  'light-more': {
    base: ':root,\n[data-color-mode="light"]',
    over: ':is([data-color-mode="light"], :not([data-color-mode]))[data-contrast-mode="more"]',
  },
  'dark-more': {
    base: '[data-color-mode="dark"]',
    over: '[data-color-mode="dark"][data-contrast-mode="more"]',
  },
};

/** Declarations of the top-level block whose selector is exactly `selector`. */
function blockDeclarations(css, selector) {
  const open = `${selector} {\n`;
  const start = css.indexOf(`\n${open}`) === -1 ? (css.startsWith(open) ? 0 : -1) : css.indexOf(`\n${open}`) + 1;
  if (start === -1) throw new Error(`manager-theme: no top-level block "${selector}" in the semantic tokens`);
  const bodyStart = start + open.length;
  const end = css.indexOf('\n}\n', bodyStart);
  const body = css.slice(bodyStart, end === -1 ? undefined : end);
  const out = new Map();
  for (const [, name, value] of body.matchAll(/^ {2}(--[\w-]+):\s*([^;]+);/gm)) out.set(name, value.trim());
  return out;
}

/** `rgb(29 27 22 / 0.078)` to `rgba(29, 27, 22, 0.078)`: the theme API's color parser reads the comma form. */
function toThemeColor(value) {
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/.exec(value);
  if (!m) return value;
  const [, r, g, b, a] = m;
  if (a === undefined) return `rgb(${r}, ${g}, ${b})`;
  const alpha = a.endsWith('%') ? Number(a.slice(0, -1)) / 100 : Number(a);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolve(name, table, seen = new Set()) {
  let value = table.get(name);
  if (value === undefined || seen.has(name)) throw new Error(`manager-theme: ${name} does not resolve`);
  seen.add(name);
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolve(alias[1], table, seen) : value;
}

/**
 * The manager's literal colors per mode.
 * @param {{root?: string}} [options]
 * @returns {Record<string, {theme: Record<string, string>, vars: Record<string, string>}>}
 */
export function resolveManagerThemes({ root = REPO_ROOT } = {}) {
  const palette = text(`${COLOR_TOKEN_DIR}/${COLOR_PALETTE_FILE}`, { root });
  const semantic = text(`${COLOR_TOKEN_DIR}/${COLOR_SEMANTIC_FILE}`, { root });
  const primitives = new Map();
  for (const [, name, value] of palette.matchAll(/^ {2}(--[\w-]+):\s*([^;]+);/gm)) primitives.set(name, value.trim());

  const themes = {};
  for (const [mode, { base, over }] of Object.entries(MANAGER_MODES)) {
    const table = new Map([...primitives, ...blockDeclarations(semantic, base), ...(over ? blockDeclarations(semantic, over) : [])]);
    const pick = (map) => Object.fromEntries(Object.entries(map).map(([key, token]) => [key, toThemeColor(resolve(token, table))]));
    themes[mode] = { theme: pick(MANAGER_TOKENS.theme), vars: pick(MANAGER_TOKENS.vars) };
  }
  return themes;
}
