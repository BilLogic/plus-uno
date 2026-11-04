import { addons } from 'storybook/manager-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { create } from 'storybook/theming/create';
import React from 'react';
import brandImage from './brand-image.js';
import { COLLAPSED_ROOTS, badgeRules, lifecycleOfEntry } from './sidebar-lifecycle.js';

// Storybook manager configuration (runs in the "manager" UI, not inside the preview iframe)

const SUPPRESSED_CONSOLE_SUBSTRINGS = [
  'The `active` prop on `Button` is deprecated and will be removed in Storybook 11.',
];

const shouldSuppressConsoleMessage = (args) => {
  const text = args
    .map((a) => (typeof a === 'string' ? a : ''))
    .join(' ');
  return SUPPRESSED_CONSOLE_SUBSTRINGS.some((s) => text.includes(s));
};

if (!globalThis.__PLUS_STORYBOOK_MANAGER_CONSOLE_PATCHED__) {
  globalThis.__PLUS_STORYBOOK_MANAGER_CONSOLE_PATCHED__ = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.warn = (...args) => {
    if (shouldSuppressConsoleMessage(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSuppressConsoleMessage(args)) return;
    originalError(...args);
  };
}

// ---- Theme: tokens, per Color mode and Contrast ------------------------------
// The color tokens are resolved at build time into window.__PLUS_MANAGER_THEMES__
// (main.js `managerHead`, scripts/lib/manager-theme.mjs), one set per mode. The
// sidebar and toolbar follow the same two toolbar globals the docs do; `auto`
// reads the OS the way applyColorModes does for the preview.

const THEMES = globalThis.__PLUS_MANAGER_THEMES__ ?? {};
if (!Object.keys(THEMES).length) console.error('[plus] manager themes missing: main.js managerHead did not inline them');
const prefers = (query) => Boolean(globalThis.matchMedia?.(query).matches);

/** `<color>-<contrast>` key of the set to show, for the toolbar's two globals. */
const modeKey = (globals = {}) => {
  const color = globals.plusColorMode || 'light';
  const contrast = globals.plusContrastMode || 'no-preference';
  const dark = color === 'auto' ? prefers('(prefers-color-scheme: dark)') : color === 'dark';
  const more = contrast === 'auto' ? prefers('(prefers-contrast: more)') : contrast === 'more';
  return `${dark ? 'dark' : 'light'}-${more ? 'more' : 'no-preference'}`;
};

// The artwork stays; only its wordmark ink (#18181b in the SVG) follows the mode, since
// near-black on a dark sidebar disappears. One source: the same data URI, re-inked.
const BRAND_INK = '#18181b';
const brandFor = (key) => {
  const ink = THEMES[key]?.theme.textColor;
  const [head, payload] = brandImage.split(',');
  if (!key.startsWith('dark') || !ink) return brandImage;
  return `${head},${btoa(atob(payload).replaceAll(BRAND_INK, ink))}`;
};

const buildTheme = (key) =>
  create({
    base: key.startsWith('dark') ? 'dark' : 'light',
    brandTitle: 'PLUS Storybook',
    // Inlined data URI (see ./brand-image.js). An absolute /assets path broke on the
    // Netlify /storybook/ subpath deploy — it resolved to the site root, missed, and the
    // SPA catch-all returned index.html instead of the SVG, so the logo intermittently
    // failed to render. A data URI has no path dependency and always loads.
    brandImage: brandFor(key),
    brandUrl: './',
    ...THEMES[key]?.theme,
    // Colors only. Type and radius stay literal until the Inter / Noto Sans call is made.
    fontBase:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    appBorderRadius: 8,
    inputBorderRadius: 8,
  });

// The selected row's brand pair is written as a rule, not custom properties: the
// manager has no stylesheet that could define them (see manager-head.html for the rest).
const paintSelected = (key) => {
  const { vars = {} } = THEMES[key] ?? {};
  const bg = vars['--plus-manager-selected-bg'];
  const fg = vars['--plus-manager-selected-fg'];
  let style = document.getElementById('plus-manager-selected');
  if (!style) {
    style = document.createElement('style');
    style.id = 'plus-manager-selected';
    document.head.appendChild(style);
  }
  document.documentElement.dataset.plusManagerMode = key;
  style.textContent =
    `.sidebar-container [data-selected='true'] { background-color: ${bg} !important; color: ${fg} !important; }\n` +
    `.sidebar-container [data-selected='true'] svg { color: ${fg} !important; opacity: 0.95; }\n` +
    badgeRules(vars);
};

addons.register('plus/manager-theme', (api) => {
  let shown = null;
  let globals = api.getGlobals();
  // The event payload, not api.getGlobals(): the manager's store has not caught up yet when these fire.
  const apply = (payload) => {
    if (payload?.globals) globals = payload.globals;
    const key = modeKey(globals);
    if (key === shown) return;
    shown = key;
    paintSelected(key);
    api.setOptions({ theme: buildTheme(key) });
  };
  api.on(SET_GLOBALS, apply);
  api.on(GLOBALS_UPDATED, apply);
  // `auto` tracks the OS while the manager is open.
  for (const query of ['(prefers-color-scheme: dark)', '(prefers-contrast: more)']) {
    globalThis.matchMedia?.(query).addEventListener('change', () => apply());
  }
  apply();
});

// A lifecycle tag on a component draws as a Tag-like badge after its name.
const renderLabel = (item, api) => {
  const lifecycle = lifecycleOfEntry(item, (id) => api?.getData?.(id));
  if (!lifecycle) return item.name;
  return React.createElement(
    React.Fragment,
    null,
    item.name,
    React.createElement('span', { className: 'plus-lifecycle-badge', 'data-lifecycle': lifecycle }, lifecycle),
  );
};

addons.setConfig({
  sidebar: { showRoots: true, collapsedRoots: COLLAPSED_ROOTS, renderLabel },
  // No `previewTabs`. The four tabs moved INTO the docs page (ADR-025), and
  // `previewTabs` was only ever here to rename Storybook's built-in canvas tab to
  // "Examples" so it would sit beside the three registered ones. With those gone,
  // Storybook draws no tab strip at all for a single view — measured: both a docs
  // entry and a story entry report `tabStrip: false, tabs: []` — so the toolbar is
  // left holding only its tools, which is the point.
  theme: (paintSelected('light-no-preference'), buildTheme('light-no-preference')),
});
