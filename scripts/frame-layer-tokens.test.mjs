/**
 * The frame and layer token collections from the Layout Grid Lab, as code
 * reads them after generation: spacing / layout (modes Medium (768px) ·
 * Large (1024px) · X-Large (1440px)), spacing / patterns and color / patterns.
 *
 * Every token is pinned by name and resolved value, per mode where the
 * collection has modes. The retired names these replaced are gone; the
 * ladder files under tokens/ladder/ carry the values now.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TOKEN_DIR, tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { LAYOUT_MODES, deriveLayout } from './layout-derived.mjs';
import { retiredRenames } from './lib/tokens/plan.mjs';
import { exportedValue } from './lib/docs-page.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(REPO_ROOT, TOKEN_DIR, 'source');
const STYLESHEETS = ['_frame_layers.scss', ...['semantics', 'patterns', 'components', 'layers'].map((t) => `ladder/_${t}.scss`)].map((f) => path.join(REPO_ROOT, TOKEN_DIR, f));
const corpus = tokenCorpus({ root: REPO_ROOT });
const stylesheet = STYLESHEETS.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

/** Every `@media (min-width: Npx)` block's body across the token stylesheets, joined. */
const blocksAt = (width) =>
  [...stylesheet.matchAll(new RegExp(`@media \\(min-width: ${width}px\\) \\{([\\s\\S]*?)\\n\\}`, 'g'))].map((m) => m[1]).join('\n');

/** A token's resolved value at a mode: `:root` for Medium, the breakpoint block above it otherwise. */
function atMode(name, mode) {
  const base = corpus.get(name);
  assert.ok(base, `${name} is not declared`);
  let value = base.value;
  for (const [key, width] of Object.entries(LAYOUT_MODES)) {
    if (width <= LAYOUT_MODES['Medium (768px)']) continue;
    if (width > LAYOUT_MODES[mode]) break;
    const block = blocksAt(width);
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
    const block = blocksAt(width);
    for (const [, declared, value] of block.matchAll(tokenDeclarationPattern('--'))) if (declared === name) raw = value.trim();
  }
  return raw;
}

/** A retired `--layout-*` name's replacement on the token ladder. */
const renamed = (old) => retiredRenames().get(old) ?? assert.fail(`${old} has no replacement`);

const px = (n) => `${+n.toFixed(2)}px`;

/* Layout: one value per mode, Medium · Large · X-Large. */
const LAYOUT = {
  '--frame-topbar-height': ['32px', '32px', '32px'],
  '--frame-sidebar-width': ['240px', '240px', '240px'],
  '--grid-gutter': ['16px', '16px', '16px'],
  '--grid-width-column': ['45.33px', '46.67px', '81.33px'],
  '--grid-width-column-screen': ['45.33px', '66.67px', '88px'],
  '--content-max-width': ['1232px', '1232px', '1232px'],
  '--content-max-width-reading': ['864px', '864px', '864px'],
  '--content-min-width': ['720px', '720px', '720px'],
  '--content-width': ['720px', '736px', '1152px'],
  '--modal-width-sm': ['384px', '512px', '640px'],
  '--modal-width-md': ['507px', '677px', '848px'],
  '--modal-width-lg': ['629px', '843px', '1056px'],
  '--screen-width': ['768px', '1024px', '1440px'],
  '--screen-min-width': ['768px', '1024px', '1440px'],
  '--screen-max-width': ['1023px', '1439px', 'none'],
  '--screen-pad-x': ['24px', '24px', '32px'],
  '--grid-columns': ['12', '12', '12'],
};

/* The Page pad has one value; it is still a mode-aware variable in Figma. */
const PAGE_PAD = ['24px', '24px', '24px'];

/* One-mode collections. */
const FIXED = {
  '--page-stack-sm': '16px',
  '--page-stack-md': '24px',
  '--page-stack-lg': '40px',
  '--page-radius': '8px',
  '--panel-min-width': '320px',
  '--panel-width-default': '400px',
  '--panel-max-width': '640px',
  '--section-stack-sm': '8px',
  '--section-stack-md': '16px',
  '--section-stack-lg': '24px',
  '--section-min-width-main': '480px',
  '--section-min-width-side': '224px',
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
  '--blanket-pad-x': '16px',
  '--blanket-pad-y': '64px',
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
      assert.equal(atMode(renamed(`--layout-${leaf}`), mode), px(value), `${leaf} at ${mode}`);
    }
  }
});

test('the screen pad aliases the space scale per mode, its own rule apart from the Page pad', () => {
  const RAW = {
      '--screen-pad-x': ['var(--space-150)', 'var(--space-150)', 'var(--space-200)'],
  };
  for (const [name, raws] of Object.entries(RAW)) {
    const actual = Object.keys(LAYOUT_MODES).map((mode) => rawAtMode(name, mode));
    assert.deepEqual(actual, raws, name);
  }
});

test('a drawer takes the Modal width steps: each Drawer width aliases its Modal width at every mode', () => {
  for (const size of ['sm', 'md', 'lg']) {
    for (const mode of Object.keys(LAYOUT_MODES)) {
      assert.equal(rawAtMode(`--drawer-width-${size}`, mode), `var(--modal-width-${size})`, `${size} at ${mode}`);
    }
  }
});

test('the Drawer pattern tokens alias the same space steps as Modal, and there is no Drawer radius', () => {
  for (const leaf of ['stack-sm', 'stack-md', 'stack-lg', 'inline-sm', 'inline-md', 'inline-lg']) {
    assert.equal(corpus.get(`--drawer-${leaf}`)?.raw, corpus.get(`--modal-${leaf}`)?.raw, leaf);
  }
  // Modal's own pad moved to the role token `--modal-pad-x-default` (ADR-038,
  // declared in tokens/ladder, outside this file's corpus); Drawer still aliases the same step.
  assert.equal(corpus.get('--drawer-pad')?.raw, 'var(--space-100)', 'pad');
  assert.equal(corpus.get('--drawer-radius'), undefined);
});

test('no modal width is fractional at any mode', () => {
  for (const size of ['sm', 'md', 'lg']) {
    for (const mode of Object.keys(LAYOUT_MODES)) {
      assert.match(atMode(`--modal-width-${size}`, mode), /^\d+px$/, `${size} at ${mode}`);
    }
  }
});

test('Modal\'s MODAL_WIDTH_PX, which its docs page shows, equals the --modal-width-* tokens at each mode', () => {
  const px = exportedValue(REPO_ROOT, 'design-system/src/components/messaging/Modal/Modal.jsx', 'MODAL_WIDTH_PX');
  const steps = { sm: '6-col', md: '8-col', lg: '10-col' };
  for (const [size, step] of Object.entries(steps)) {
    // The last mode's screen is past the grid's cap, so its width is the one MODAL_WIDTH_SCREENS reads at 1280.
    assert.deepEqual(px[step], Object.keys(LAYOUT_MODES).map((mode) => parseInt(atMode(`--modal-width-${size}`, mode), 10)), step);
  }
});

test('each mode\'s screen range starts at its default width and ends a pixel before the next mode; X-Large has no end', () => {
  const widths = Object.values(LAYOUT_MODES);
  Object.keys(LAYOUT_MODES).forEach((mode, i) => {
    assert.equal(atMode('--screen-min-width', mode), atMode('--screen-width', mode), mode);
    const next = widths[i + 1];
    assert.equal(atMode('--screen-max-width', mode), next ? `${next - 1}px` : 'none', mode);
  });
});

test('Figma holds the X-Large maximum as a 10000 stand-in, which code reads as no limit', () => {
  const layout = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'spacing _ layout.json'), 'utf8'));
  const max = layout.variables.find((v) => v.name === 'Screen/max-width-screen');
  assert.deepEqual(Object.values(max.valuesByMode), [1023, 1439, 10000]);
  assert.match(rawAtMode('--screen-max-width', 'X-Large (1440px)'), /^none\b/);
});

test('the column count is a plain number, so a grid can repeat it', () => {
  assert.equal(corpus.get('--grid-columns')?.raw, '12');
});

test('Page/pad is 24 at every width', () => {
  const actual = Object.keys(LAYOUT_MODES).map((mode) => atMode('--page-pad', mode));
  assert.deepEqual(actual, PAGE_PAD);
});

test('the Frame has no seams: no Frame pad, Frame stack or container-left pad is declared', () => {
  for (const name of ['--frame-pad', '--frame-stack', '--grid-pad-left-container']) {
    assert.equal(corpus.get(name), undefined, `${name} is retired`);
  }
});

test('the Panel widths run 320 · 400 · 640 and sit in patterns, in step', () => {
  const [min, def, max] = ['--panel-min-width', '--panel-width-default', '--panel-max-width'].map((n) => parseFloat(corpus.get(n)?.value));
  assert.ok(min < def && def < max, `${min} < ${def} < ${max}`);
});

test('every one-mode frame and layer token resolves to its value', () => {
  for (const [name, value] of Object.entries(FIXED)) {
    assert.equal(corpus.get(name)?.value, value, name);
  }
});

test('the scrim is black at 38%', () => {
  assert.equal(corpus.get('--blanket-fill')?.value, 'rgba(0, 0, 0, 0.38)');
});

test('a modal is never taller than the screen less the overlay pad above and below', () => {
  assert.equal(corpus.get('--blanket-max-height-modal')?.raw, 'calc(100dvh - 2 * var(--blanket-pad-y))');
});

test('no new token name uses a banned word', () => {
  const names = [...Object.keys(LAYOUT), ...Object.keys(FIXED), '--page-pad', '--blanket-fill'];
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
  for (const name of [...Object.keys(LAYOUT), ...Object.keys(FIXED), '--page-pad', '--blanket-fill']) {
    assert.doesNotMatch(name, /^--(size|color)-/, name);
  }
  // Specs reference these ahead of time with fallbacks; they stay undefined until the Modal migration.
  assert.equal(corpus.get('--size-modal-pad'), undefined);
  assert.equal(corpus.get('--size-modal-radius'), undefined);
});

test('every alias lands on the scales, never on an old --size-* primitive', () => {
  const ALIASES = {
    '--frame-topbar-height': 'var(--height-200)',
    '--frame-sidebar-width': 'var(--width-1500)',
    '--grid-gutter': 'var(--space-100)',
    '--content-max-width': 'var(--size-7700)',
    '--page-pad': 'var(--space-150)',
    '--card-min-width-md': 'var(--width-1900)',
    '--card-max-height-sm': 'var(--size-1900)',
    '--card-max-height-md': 'var(--size-2500)',
    '--card-max-height-lg': 'var(--size-4000)',
    '--table-stack': 'var(--space-050)',
    '--screen-pad-x': 'var(--space-150)',
    '--section-min-width-main': 'var(--width-3000)',
    '--modal-radius': 'var(--radius-075)',
    '--popover-radius-menu-sm': 'var(--radius-0625)',
    '--popover-max-height-menu': 'var(--height-2000)',
    '--popover-offset': 'var(--space-025)',
  };
  for (const [name, raw] of Object.entries(ALIASES)) assert.equal(corpus.get(name)?.raw, raw, name);
  for (const name of [...Object.keys(LAYOUT), ...Object.keys(FIXED), '--page-pad']) {
    assert.doesNotMatch(corpus.get(name)?.raw ?? '', /--size-(spacing|border)-/, name);
  }
});

test('the old tokens the new ones sit beside still resolve, unchanged', () => {
  const OLD = {
    '--frame-sidebar-width-nav': '164px',
    '--layout-grid-gap': '8px',
    '--col-1': '48.67px',
    '--size-modal-pad-x-sm': '10px',
    '--size-card-pad-x-sm': '16px',
    '--size-section-gap-md': '16px',
    '--size-surface-pad-x': '32px',
    '--size-surface-container-pad-x': '16px',
    '--size-table-radius-md': '8px',
    '--listbox-max-width': '320px',
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

// `--modal-pad-x-default` (ADR-038, tokens/ladder, outside this file's corpus) is
// non-responsive, same 16px the old `--modal-pad` held at every mode.
const MODAL_PAD_PX = 16;

/** The width Modal.scss computes for a span on a screen `width` wide, its tokens read at `mode`. */
function modalWidth(span, width, mode) {
  const block = MODAL_SCSS.match(/\n\.plus-modal \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(block, 'Modal.scss has no .plus-modal block');
  const local = Object.fromEntries([...block.matchAll(tokenDeclarationPattern('--plus-modal-'))].map(([, n, v]) => [n, v.trim()]));
  local['--plus-modal-span'] = String(span);
  // ADR-038, tokens/ladder, outside this file's corpus: inject it like a local.
  local['--modal-pad-x-default'] = String(MODAL_PAD_PX);
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
  assert.match(MODAL_SCSS, /\.plus-modal-width-8-col \{\s*--plus-modal-span: 8;/);
  assert.match(MODAL_SCSS, /\.plus-modal-width-10-col \{\s*--plus-modal-span: 10;/);
  const num = (name, mode) => parseFloat(atMode(name, mode));
  for (const [mode, width] of Object.entries(LAYOUT_MODES)) {
    for (const span of [6, 8, 10]) {
      const expected = span * num('--grid-width-column-screen', mode)
        + (span - 1) * num('--grid-gutter', mode)
        + 2 * MODAL_PAD_PX;
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
  const formula = block.match(/\n\s*width:\s*([^;]+);/)?.[1]?.replace('#{$pad}', String(MODAL_PAD_PX));
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
      const expected = parseFloat(atMode(`--modal-width-${size}`, mode));
      const actual = screenGridWidth(span, width, mode);
      // The column is held to two decimals, so ten columns land within half a pixel of the whole-pixel token.
      assert.ok(Math.abs(actual - expected) < 0.5, `${size} at ${mode}: _screen-grid.scss ${actual}, Figma ${expected}`);
    }
  }
});

const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

test('the Frame stacks its layers by name: no arithmetic on --layer-navigation and no bare z-index in Frame.scss', () => {
  const scss = read('design-system/src/patterns/Frame/Frame.scss');
  assert.doesNotMatch(scss, /calc\(var\(--layer-navigation\)/);
  assert.doesNotMatch(scss, /z-index:\s*-?\d/);
});

test('the Frame layer steps are named and ordered edge < Sidebar < Topbar start < Blanket < Panel peek', () => {
  const order = ['edge', 'sidebar', 'topbar-start', 'blanket', 'panel-peek'].map((n) => `--frame-layer-${n}`);
  const values = order.map((n) => {
    const token = corpus.get(n);
    assert.ok(token, `${n} is not declared`);
    return token.raw;
  });
  assert.equal(values[1], 'var(--layer-navigation)');
  const nav = parseFloat(corpus.get('--layer-navigation').value);
  const resolved = values.map((v) => {
    const step = v.match(/^calc\(var\(--layer-navigation\) ([+-]) (\d+)\)$/);
    return step ? nav + (step[1] === '-' ? -1 : 1) * Number(step[2]) : nav;
  });
  assert.deepEqual(resolved, [...resolved].sort((a, b) => a - b));
  assert.equal(new Set(resolved).size, resolved.length);
  assert.ok(corpus.get('--frame-layer-splitter'), 'the splitter layer is named');
});

test('one hairline token across the Frame: the semantic border width, never the primitive', () => {
  assert.doesNotMatch(read('design-system/src/patterns/Frame/Frame.scss'), /--stroke-1/);
});

test('a Section takes its radius from a Section token, not the Card', () => {
  assert.equal(corpus.get('--section-radius')?.value, corpus.get('--card-radius')?.value);
  assert.doesNotMatch(read('design-system/src/patterns/PatternSection/PatternSection.scss'), /--card-radius/);
});

test('the Frame names its server-render width instead of writing 1440 bare', () => {
  assert.doesNotMatch(read('design-system/src/patterns/Frame/useOwnWidth.js'), /fallback = 1440/);
});
