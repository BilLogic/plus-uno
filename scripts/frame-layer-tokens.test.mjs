/**
 * The frame and layer token collections from the Layout Grid Lab, as code
 * reads them after generation: spacing / layout (modes Medium (768px) ·
 * Large (1024px) · X-Large (1440px)), spacing / patterns and color / patterns.
 *
 * Every new token is pinned by name and resolved value, per mode where the
 * collection has modes. The old tokens these sit beside are pinned too, since
 * nothing moves to the new names until the migration tickets land.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TOKEN_DIR, tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { LAYOUT_MODES, deriveLayout } from './layout-derived.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(REPO_ROOT, TOKEN_DIR, 'source');
const STYLESHEET = path.join(REPO_ROOT, TOKEN_DIR, '_frame_layers.scss');
const corpus = tokenCorpus({ root: REPO_ROOT });
const stylesheet = fs.readFileSync(STYLESHEET, 'utf8');

/** A token's resolved value at a mode: `:root` for Medium, the breakpoint block above it otherwise. */
function atMode(name, mode) {
  const base = corpus.get(name);
  assert.ok(base, `${name} is not declared`);
  let value = base.value;
  for (const [key, width] of Object.entries(LAYOUT_MODES)) {
    if (width <= LAYOUT_MODES['Medium (768px)']) continue;
    if (width > LAYOUT_MODES[mode]) break;
    const block = stylesheet.match(new RegExp(`@media \\(min-width: ${width}px\\) \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
    for (const [, declared, raw] of block.matchAll(tokenDeclarationPattern('--'))) {
      if (declared !== name) continue;
      const alias = raw.trim().match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
      value = alias ? corpus.get(alias)?.value : raw.trim();
      assert.ok(value, `${name} at ${key} points at an undeclared token`);
    }
  }
  return value;
}

/** A token's declared text at a mode, before any alias is followed. */
function rawAtMode(name, mode) {
  let raw = corpus.get(name)?.raw;
  for (const width of Object.values(LAYOUT_MODES)) {
    if (width <= LAYOUT_MODES['Medium (768px)'] || width > LAYOUT_MODES[mode]) continue;
    const block = stylesheet.match(new RegExp(`@media \\(min-width: ${width}px\\) \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
    for (const [, declared, value] of block.matchAll(tokenDeclarationPattern('--'))) if (declared === name) raw = value.trim();
  }
  return raw;
}

const px = (n) => `${+n.toFixed(2)}px`;

/* Layout: one value per mode, Medium · Large · X-Large. */
const LAYOUT = {
  '--layout-height-topbar': ['32px', '32px', '32px'],
  '--layout-width-sidebar': ['240px', '240px', '240px'],
  '--layout-pad-left-container': ['8px', '0px', '0px'],
  '--layout-gutter': ['16px', '16px', '16px'],
  '--layout-width-column': ['45.33px', '47.33px', '80.67px'],
  '--layout-width-column-screen': ['45.33px', '66.67px', '88px'],
  '--layout-max-width-content': ['1232px', '1232px', '1232px'],
  '--layout-max-width-reading': ['864px', '864px', '864px'],
  '--layout-min-width-content': ['720px', '720px', '720px'],
  '--layout-width-content': ['720px', '744px', '1144px'],
  '--layout-width-modal-sm': ['384px', '512px', '640px'],
  '--layout-width-modal-md': ['507px', '677px', '848px'],
  '--layout-width-modal-lg': ['629px', '843px', '1056px'],
  '--layout-width-screen': ['768px', '1024px', '1440px'],
  '--layout-min-width-screen': ['768px', '1024px', '1440px'],
  '--layout-max-width-screen': ['1023px', '1439px', 'none'],
  '--layout-pad-x-screen': ['24px', '24px', '32px'],
  '--layout-columns': ['12', '12', '12'],
};

/* Surface has modes for its pad only. */
const SURFACE_PAD = ['16px', '16px', '24px'];

/* One-mode collections. */
const FIXED = {
  '--surface-container-pad': '8px',
  '--surface-container-stack': '8px',
  '--surface-stack-sm': '16px',
  '--surface-stack-md': '24px',
  '--surface-stack-lg': '40px',
  '--surface-radius': '16px',
  '--section-stack-sm': '8px',
  '--section-stack-md': '16px',
  '--section-stack-lg': '24px',
  '--section-min-width-main': '480px',
  '--section-min-width-side': '224px',
  '--card-pad-sm': '16px',
  '--card-pad-md': '20px',
  '--card-pad-lg': '24px',
  '--card-stack-sm': '4px',
  '--card-stack-md': '8px',
  '--card-stack-lg': '12px',
  '--card-inline-sm': '4px',
  '--card-inline-md': '8px',
  '--card-inline-lg': '12px',
  '--card-min-width-sm': '224px',
  '--card-min-width-md': '304px',
  '--card-min-width-lg': '480px',
  '--card-radius': '16px',
  '--card-radius-sm': '12px',
  '--card-max-height-sm': '304px',
  '--card-max-height-md': '400px',
  '--card-max-height-lg': '640px',
  '--table-pad-x-cell': '8px',
  '--table-pad-y-cell': '4px',
  '--table-indent': '24px',
  '--table-radius': '8px',
  '--table-stack': '8px',
  '--overlay-pad-x': '16px',
  '--overlay-pad-y': '64px',
  '--modal-pad': '16px',
  '--modal-stack-sm': '8px',
  '--modal-stack-md': '16px',
  '--modal-stack-lg': '24px',
  '--modal-inline-sm': '8px',
  '--modal-inline-md': '16px',
  '--modal-inline-lg': '24px',
  '--modal-radius': '12px',
  '--focused-page-pad-x': '8px',
  '--focused-page-pad-y': '8px',
  '--focused-page-stack-sm': '8px',
  '--focused-page-stack-md': '16px',
  '--focused-page-stack-lg': '24px',
  '--focused-page-inline-sm': '8px',
  '--focused-page-inline-md': '12px',
  '--popover-pad': '16px',
  '--popover-width-sm': '320px',
  '--popover-width-md': '400px',
  '--popover-width-lg': '480px',
  '--popover-width-flag': '400px',
  '--popover-stack-flag': '16px',
  '--popover-radius': '12px',
  '--popover-pad-menu': '4px',
  '--popover-min-width-menu': '160px',
  '--popover-max-width-menu': '320px',
  '--popover-max-height-menu': '320px',
  '--popover-radius-menu-sm': '10px',
  '--popover-radius-menu-md': '12px',
  '--popover-pad-y-tooltip': '4px',
  '--popover-max-width-tooltip': '240px',
  '--popover-radius-tooltip': '6px',
  '--popover-gap-screen': '8px',
  '--popover-offset': '4px',
};

test('every Layout token resolves to its value at Medium, Large and X-Large', () => {
  for (const [name, values] of Object.entries(LAYOUT)) {
    const actual = Object.keys(LAYOUT_MODES).map((mode) => atMode(name, mode));
    assert.deepEqual(actual, values, name);
  }
});

test('the derived Layout rows are the frame rules worked at each mode width', () => {
  for (const [mode, width] of Object.entries(LAYOUT_MODES)) {
    for (const [leaf, value] of Object.entries(deriveLayout(width))) {
      assert.equal(atMode(`--layout-${leaf}`, mode), px(value), `${leaf} at ${mode}`);
    }
  }
});

test('the screen and container pads alias the space scale per mode', () => {
  const RAW = {
    '--layout-pad-left-container': ['var(--space-050)', 'var(--space-0)', 'var(--space-0)'],
    '--layout-pad-x-screen': ['var(--space-150)', 'var(--space-150)', 'var(--space-200)'],
  };
  for (const [name, raws] of Object.entries(RAW)) {
    const actual = Object.keys(LAYOUT_MODES).map((mode) => rawAtMode(name, mode));
    assert.deepEqual(actual, raws, name);
  }
});

test('a drawer takes the Modal width steps: each Drawer width aliases its Modal width at every mode', () => {
  for (const size of ['sm', 'md', 'lg']) {
    for (const mode of Object.keys(LAYOUT_MODES)) {
      assert.equal(rawAtMode(`--layout-width-drawer-${size}`, mode), `var(--layout-width-modal-${size})`, `${size} at ${mode}`);
    }
  }
});

test('the Drawer pattern tokens alias the same space steps as Modal, and there is no Drawer radius', () => {
  for (const leaf of ['pad', 'stack-sm', 'stack-md', 'stack-lg', 'inline-sm', 'inline-md', 'inline-lg']) {
    assert.equal(corpus.get(`--drawer-${leaf}`)?.raw, corpus.get(`--modal-${leaf}`)?.raw, leaf);
  }
  assert.equal(corpus.get('--drawer-radius'), undefined);
});

test('no modal width is fractional at any mode', () => {
  for (const size of ['sm', 'md', 'lg']) {
    for (const mode of Object.keys(LAYOUT_MODES)) {
      assert.match(atMode(`--layout-width-modal-${size}`, mode), /^\d+px$/, `${size} at ${mode}`);
    }
  }
});

test('each mode\'s screen range starts at its default width and ends a pixel before the next mode; X-Large has no end', () => {
  const widths = Object.values(LAYOUT_MODES);
  Object.keys(LAYOUT_MODES).forEach((mode, i) => {
    assert.equal(atMode('--layout-min-width-screen', mode), atMode('--layout-width-screen', mode), mode);
    const next = widths[i + 1];
    assert.equal(atMode('--layout-max-width-screen', mode), next ? `${next - 1}px` : 'none', mode);
  });
});

test('Figma holds the X-Large maximum as a 10000 stand-in, which code reads as no limit', () => {
  const layout = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'spacing _ layout.json'), 'utf8'));
  const max = layout.variables.find((v) => v.name === 'Screen/max-width-screen');
  assert.deepEqual(Object.values(max.valuesByMode), [1023, 1439, 10000]);
  assert.match(rawAtMode('--layout-max-width-screen', 'X-Large (1440px)'), /^none\b/);
});

test('the column count is a plain number, so a grid can repeat it', () => {
  assert.equal(corpus.get('--layout-columns')?.raw, '12');
});

test('Surface/pad is 16 below 1440 and 24 from 1440', () => {
  const actual = Object.keys(LAYOUT_MODES).map((mode) => atMode('--surface-pad', mode));
  assert.deepEqual(actual, SURFACE_PAD);
});

test('every one-mode frame and layer token resolves to its value', () => {
  for (const [name, value] of Object.entries(FIXED)) {
    assert.equal(corpus.get(name)?.value, value, name);
  }
});

test('the scrim is black at 38%', () => {
  assert.equal(corpus.get('--overlay-scrim')?.value, 'rgba(0, 0, 0, 0.38)');
});

test('a modal is never taller than the screen less the overlay pad above and below', () => {
  assert.equal(corpus.get('--layout-max-height-modal')?.raw, 'calc(100dvh - 2 * var(--overlay-pad-y))');
});

test('no new token name uses a banned word', () => {
  const names = [...Object.keys(LAYOUT), ...Object.keys(FIXED), '--surface-pad', '--overlay-scrim'];
  for (const name of names) {
    assert.doesNotMatch(name, /margin|shell|slot|viewport|top-bar/, name);
  }
});

test('Layout/sidebar-docked is false at Medium and true from Large, in the Figma export', () => {
  const layout = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'spacing _ layout.json'), 'utf8'));
  const docked = layout.variables.find((v) => v.name === 'Sidebar/sidebar-docked');
  assert.ok(docked, 'Layout has no Sidebar/sidebar-docked');
  assert.equal(docked.resolvedType, 'BOOLEAN');
  assert.deepEqual(Object.values(docked.resolvedValuesByMode), [false, true, true]);
  assert.deepEqual(Object.values(layout.modes), ['Medium (768px)', 'Large (1024px)', 'X-Large (1440px)']);
});

test('every exported variable offers itself only where it belongs: explicit scopes, never ALL_SCOPES', () => {
  // Figma has no scope for a layout grid's count, so the column count takes GAP, the scope its gutter and offset take.
  const EXPECTED = { GAP: /pad|stack|inline|gutter|indent|gap-screen|^columns$/, CORNER_RADIUS: /radius/, WIDTH_HEIGHT: /height|width/ };
  for (const file of ['spacing _ layout', 'spacing _ patterns', 'color _ patterns']) {
    const { variables } = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, `${file}.json`), 'utf8'));
    for (const v of variables) {
      const label = `${file} > ${v.name}`;
      // Figma takes no scopes on a boolean; it is the template switch, never a picker value.
      if (v.resolvedType === 'BOOLEAN') continue;
      if (v.resolvedType === 'COLOR') {
        assert.deepEqual(v.scopes, ['FRAME_FILL', 'SHAPE_FILL'], label);
        continue;
      }
      assert.equal(v.scopes?.length, 1, `${label} has scopes ${JSON.stringify(v.scopes)}`);
      const leaf = v.name.split('/').pop();
      assert.match(leaf, EXPECTED[v.scopes[0]] ?? /^$/, `${label} is scoped ${v.scopes[0]}`);
    }
  }
});

test('the new names take no family prefix, and never land on an old --size-* name', () => {
  for (const name of [...Object.keys(LAYOUT), ...Object.keys(FIXED), '--surface-pad', '--overlay-scrim']) {
    assert.doesNotMatch(name, /^--(size|color)-/, name);
  }
  // Specs reference these ahead of time with fallbacks; they stay undefined until the Modal migration.
  assert.equal(corpus.get('--size-modal-pad'), undefined);
  assert.equal(corpus.get('--size-modal-radius'), undefined);
});

test('every alias lands on the scales, never on an old --size-* primitive', () => {
  const ALIASES = {
    '--layout-height-topbar': 'var(--height-200)',
    '--layout-width-sidebar': 'var(--width-1500)',
    '--layout-gutter': 'var(--space-100)',
    '--layout-max-width-content': 'var(--size-7700)',
    '--surface-pad': 'var(--space-100)',
    '--card-pad-md': 'var(--space-125)',
    '--card-min-width-md': 'var(--width-1900)',
    '--card-max-height-sm': 'var(--size-1900)',
    '--card-max-height-md': 'var(--size-2500)',
    '--card-max-height-lg': 'var(--size-4000)',
    '--table-stack': 'var(--space-050)',
    '--layout-pad-left-container': 'var(--space-050)',
    '--layout-pad-x-screen': 'var(--space-150)',
    '--section-min-width-main': 'var(--width-3000)',
    '--modal-radius': 'var(--radius-075)',
    '--popover-radius-menu-sm': 'var(--radius-0625)',
    '--popover-max-height-menu': 'var(--height-2000)',
    '--popover-offset': 'var(--space-025)',
  };
  for (const [name, raw] of Object.entries(ALIASES)) assert.equal(corpus.get(name)?.raw, raw, name);
  for (const name of [...Object.keys(LAYOUT), ...Object.keys(FIXED), '--surface-pad']) {
    assert.doesNotMatch(corpus.get(name)?.raw ?? '', /--size-(spacing|border)-/, name);
  }
});

test('the old tokens the new ones sit beside still resolve, unchanged', () => {
  const OLD = {
    '--layout-sidebar-width': '164px',
    '--layout-grid-gap': '8px',
    '--col-1': '48.67px',
    '--color-scrim': 'rgba(0, 0, 0, 0.32)',
    '--size-modal-pad-x-sm': '10px',
    '--size-card-pad-x-sm': '16px',
    '--size-section-gap-md': '16px',
    '--size-surface-pad-x': '32px',
    '--size-surface-container-pad-x': '16px',
    '--size-table-radius-md': '8px',
    '--layout-max-width-listbox': '320px',
    '--size-card-radius-sm': '12px',
    '--size-surface-radius': '16px',
  };
  for (const [name, value] of Object.entries(OLD)) {
    assert.equal(corpus.get(name)?.value, value, name);
  }
});

/*
 * Modal.scss works the modal width out from the screen width with one
 * continuous formula, which is right between breakpoints too. At the three
 * mode widths it has to land on what Figma draws: 6 · 8 · 10 screen columns,
 * the gutters between them, and the modal pad on each side.
 */
const MODAL_SCSS = fs.readFileSync(path.join(REPO_ROOT, 'design-system/src/components/messaging/Modal/Modal.scss'), 'utf8');

/** The width Modal.scss computes for a span on a screen `width` wide, its tokens read at `mode`. */
function modalWidth(span, width, mode) {
  const block = MODAL_SCSS.match(/\n\.plus-modal \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(block, 'Modal.scss has no .plus-modal block');
  const local = Object.fromEntries([...block.matchAll(tokenDeclarationPattern('--plus-modal-'))].map(([, n, v]) => [n, v.trim()]));
  local['--plus-modal-span'] = String(span);
  const formula = block.match(/\n\s*width:\s*([^;]+);/)?.[1];
  assert.ok(formula, '.plus-modal declares no width');
  const resolve = (expr, depth = 0) => {
    assert.ok(depth < 10, `${expr} does not resolve`);
    return expr
      .replace(/var\(--plus-modal-screen,\s*100vw\)/g, String(width))
      .replace(/var\((--[a-z0-9-]+)\)/g, (_, name) => {
        if (name in local) return `(${resolve(local[name], depth + 1)})`;
        return String(parseFloat(atMode(name, mode)));
      });
  };
  const clamp = (lo, value, hi) => Math.max(lo, Math.min(value, hi));
  const calc = (n) => n;
  return new Function('clamp', 'calc', `return ${resolve(formula)};`)(clamp, calc);
}

test('Modal.scss widths at 768, 1024 and 1440 are 6 · 8 · 10 screen columns, their gutters and the modal pad', () => {
  assert.match(MODAL_SCSS, /\.plus-modal-width-md \{\s*--plus-modal-span: 8;/);
  assert.match(MODAL_SCSS, /\.plus-modal-width-lg \{\s*--plus-modal-span: 10;/);
  const num = (name, mode) => parseFloat(atMode(name, mode));
  for (const [mode, width] of Object.entries(LAYOUT_MODES)) {
    for (const span of [6, 8, 10]) {
      const expected = span * num('--layout-width-column-screen', mode)
        + (span - 1) * num('--layout-gutter', mode)
        + 2 * num('--modal-pad', mode);
      // The token holds the column to two decimals, so ten columns drift by under a tenth of a pixel.
      const actual = modalWidth(span, width, mode);
      assert.ok(Math.abs(actual - expected) < 0.1, `${span} columns at ${mode}: Modal.scss ${actual}, Figma ${expected}`);
    }
  }
});

/*
 * The patterns' screen grid (`styles/_screen-grid.scss`) is the same rule for
 * any layer placed in an Overlay — PatternModal now, a drawer later. At the
 * three mode widths it has to land on Figma's Modal/width-modal-* too.
 */
const SCREEN_GRID_SCSS = fs.readFileSync(path.join(REPO_ROOT, 'design-system/src/styles/_screen-grid.scss'), 'utf8');

/** The width the screen-grid mixin computes for a span on a screen `width` wide, with the modal pad. */
function screenGridWidth(span, width, mode) {
  const block = SCREEN_GRID_SCSS.match(/@mixin screen-grid-width\(.*\) \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(block, '_screen-grid.scss has no screen-grid-width mixin');
  const local = Object.fromEntries([...block.matchAll(tokenDeclarationPattern('--plus-overlay-'))].map(([, n, v]) => [n, v.trim()]));
  local['--plus-overlay-span'] = String(span);
  const formula = block.match(/\n\s*width:\s*([^;]+);/)?.[1]?.replace('#{$pad}', 'var(--modal-pad)');
  assert.ok(formula, 'the screen-grid-width mixin declares no width');
  const resolve = (expr, depth = 0) => {
    assert.ok(depth < 10, `${expr} does not resolve`);
    return expr
      .replace(/var\(--plus-overlay-screen,\s*100vw\)/g, String(width))
      .replace(/var\((--[a-z0-9-]+)\)/g, (_, name) => {
        if (name in local) return `(${resolve(local[name], depth + 1)})`;
        return String(parseFloat(atMode(name, mode)));
      });
  };
  const clamp = (lo, value, hi) => Math.max(lo, Math.min(value, hi));
  const calc = (n) => n;
  return new Function('clamp', 'calc', `return ${resolve(formula)};`)(clamp, calc);
}

test('the Overlay screen grid lands on Modal/width-modal-* at 768, 1024 and 1440', () => {
  assert.match(SCREEN_GRID_SCSS, /&-width-sm \{ --plus-overlay-span: 6; \}/);
  assert.match(SCREEN_GRID_SCSS, /&-width-md \{ --plus-overlay-span: 8; \}/);
  assert.match(SCREEN_GRID_SCSS, /&-width-lg \{ --plus-overlay-span: 10; \}/);
  const spans = { sm: 6, md: 8, lg: 10 };
  for (const [mode, width] of Object.entries(LAYOUT_MODES)) {
    for (const [size, span] of Object.entries(spans)) {
      const expected = parseFloat(atMode(`--layout-width-modal-${size}`, mode));
      const actual = screenGridWidth(span, width, mode);
      // The column is held to two decimals, so ten columns land within half a pixel of the whole-pixel token.
      assert.ok(Math.abs(actual - expected) < 0.5, `${size} at ${mode}: _screen-grid.scss ${actual}, Figma ${expected}`);
    }
  }
});
