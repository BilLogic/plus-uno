/**
 * The elevation mapping table, the elevation guideline and the stylesheets
 * must name the same shadow.
 *
 * WHY THIS EXISTS. `design-system/guidelines/figma/token-mapping.md` and
 * the Elevation page (its tables are data in `design-system/src/storybook-docs/elevation-demos.jsx`) say which surface and shadow each layer takes, and
 * the stylesheets draw it. The two live in different file types, and a role
 * once answered "which shadow does a card get?" differently from the table
 * with nothing noticing, because no check read both.
 *
 * WHAT IS ASSERTED. The mapping's overlay rows name the overlay pair for every
 * floating layer and its blocking row the Modal, the Elevation page's level
 * and behavior rows agree, and each surface below draws the shadow its row names.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. WHETHER THE TABLE IS RIGHT. If the raised shadow is wrong for a card,
 *     this passes happily. It checks agreement, not judgment.
 *  2. COMPONENTS THAT USE A LEVEL DIRECTLY. The layers moved to the new color
 *     tokens name `--ds-shadow-overlay` with `--ds-surface-overlay` themselves;
 *     a modal takes that overlay pair too, since the blanket under it is what
 *     sets it apart from a menu. The surfaces listed below are pinned one by
 *     one; auditing every `box-shadow` against the table is a different check
 *     with a much larger corpus.
 *  3. ROLES WITH NO ROW. `--ds-surface-sunken` carries no shadow and appears in
 *     no elevation row; it is simply not covered here.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as sass from 'sass';
import postcss from 'postcss';


const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAPPING = path.join(REPO_ROOT, 'design-system/guidelines/figma/token-mapping.md');
const ELEVATION_DEMOS = 'design-system/src/storybook-docs/elevation-demos.jsx';

test('every floating layer takes the overlay pair, and only the Modal blocks', () => {
  // Elevation 2.0: a layer that floats with the page usable is on the overlay
  // pair; the Modal on its Backdrop is the one surface on the blocking shadow,
  // over the same overlay surface.
  const mapping = fs.readFileSync(MAPPING, 'utf8');
  const rowOf = (name) => mapping.split('\n').find((line) => new RegExp(`^\\|\\s*${name}\\s*\\(`).test(line.trim()));
  for (const [half, token] of [['Overlay surface', '--ds-surface-overlay'], ['Overlay shadow', '--ds-shadow-overlay']]) {
    const row = rowOf(half);
    assert.ok(row, `token-mapping.md has no ${half} row`);
    for (const words of [/menus/i, /popups/i, /flags/i, /floating Sidebar/i]) {
      assert.match(row, words, `the ${half} row no longer names ${words}`);
    }
    assert.ok(row.includes(`var(${token})`), `the ${half} row does not name var(${token})`);
  }
  const blocking = rowOf('Blocking shadow');
  assert.ok(blocking, 'token-mapping.md has no Blocking shadow row');
  assert.match(blocking, /Modal/);
  assert.ok(blocking.includes('var(--ds-shadow-blocking)'), 'the Blocking shadow row does not name var(--ds-shadow-blocking)');
  const file = 'design-system/src/patterns/PatternModal/PatternModal.scss';
  assert.match(fs.readFileSync(path.join(REPO_ROOT, file), 'utf8'), /--ds-shadow-overlay/, `${file} does not take the overlay shadow`);
});

/**
 * THE STEP EACH SURFACE TAKES, read from the stylesheets that draw them.
 *
 * The Elevation page assigns the levels by pattern. The floating
 * layers on the new color tokens (menus and dropdowns, Listbox, Popover,
 * Toast) and modals take the overlay pair, `--ds-surface-overlay`
 * with `--ds-shadow-overlay`; the Frame's floating sidebar floats too, so it
 * takes the overlay pair. A card is on the
 * raised pair or lifts while a clickable card is hovered or dragged. Each row
 * is one surface and the shadow its rule must name; a rule that names another
 * level, or a literal shadow, fails.
 */
const SURFACES = [
  { file: 'design-system/src/patterns/PatternCard/PatternCard.scss', rule: '.plus-pattern-card--dragging {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/overlays-and-layering/Popup/Popup.scss', rule: '.plus-popup {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/messaging/Flag/Flag.scss', rule: '.plus-flag', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  // The floating Sidebar floats, so it takes the overlay pair; the docked one stays on the sunken fill.
  { file: 'design-system/src/patterns/Frame/Frame.scss', rule: '.plus-frame__sidebar--raised {', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/components/messaging/Modal/Modal.scss', rule: '.plus-modal', shadow: '--ds-shadow-blocking', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/patterns/PatternModal/PatternModal.scss', rule: '.plus-pattern-modal {', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/components/forms-and-inputs/_internal/Listbox.scss', rule: '', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/components/forms-and-inputs/DropdownMenu/DropdownMenu.scss', rule: '.plus-dropdown-menu {', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
];

/**
 * THE CARD PATTERN IS ON ATLASSIAN'S RAISED PAIR (color proposal, decision
 * 18): the raised surface under the raised shadow, whose ring is the edge, so
 * no border. A clickable card lifts while hovered (the raised surface's hovered
 * step under the overlay shadow) and settles while pressed; a dragged card is
 * on the overlay pair. The card paints the current surface and sets it, so a
 * sticky table cell inside matches the card.
 */
const PATTERN_CARD = {
  file: 'design-system/src/patterns/PatternCard/PatternCard.scss',
  states: [
    ['.plus-pattern-card', '--ds-surface-raised', '--ds-shadow-raised'],
    ['.plus-pattern-card--clickable:hover', '--ds-surface-raised-hovered', '--ds-shadow-overlay'],
    ['.plus-pattern-card--clickable:active', '--ds-surface-raised-pressed', '--ds-shadow-raised'],
    ['.plus-pattern-card--dragging', '--ds-surface-overlay', '--ds-shadow-overlay'],
  ],
};

/** The first value of `property` after the rule opens. */
function firstAfter(source, rule, property) {
  const from = rule ? source.indexOf(rule) : 0;
  assert.ok(from >= 0, `rule "${rule}" is gone`);
  const match = new RegExp(`(?:^|[\\s;{])${property}:\\s*([^;]+);`).exec(source.slice(from));
  return match ? match[1].trim() : null;
}

for (const surface of SURFACES) {
  test(`${path.basename(surface.file)} lifts its surface with ${surface.shadow}`, () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, surface.file), 'utf8');
    const shadow = firstAfter(source, surface.rule, 'box-shadow');
    assert.ok(shadow, `no box-shadow after "${surface.rule}" in ${surface.file}`);
    assert.match(
      shadow,
      new RegExp(`^var\\(${surface.shadow}\\)( !important)?$`),
      `${surface.file} lifts its surface with "${shadow}"; the Elevation page and the role layer say var(${surface.shadow}).`,
    );
    if (surface.fill) {
      assert.equal(firstAfter(source, surface.rule, 'background-color'), `var(${surface.fill})`);
    }
  });
}

test('Tooltip.scss draws a flat label: neutral bold fill, no box-shadow', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'design-system/src/components/overlays-and-layering/Tooltip/Tooltip.scss'), 'utf8');
  const start = source.indexOf('.plus-tooltip {');
  assert.ok(start >= 0, 'rule ".plus-tooltip {" is gone');
  const block = source.slice(start, source.indexOf('}', start));
  assert.doesNotMatch(block, /box-shadow/, 'Tooltip takes no shadow');
  assert.match(block, /background-color:\s*var\(--ds-background-neutral-bold\)/);
});

test("the Elevation page's levels and behavior rows say the same steps", () => {
  // The page's level and behavior tables are data in its demos module, so the
  // rows are read from that source.
  const source = fs.readFileSync(path.join(REPO_ROOT, ELEVATION_DEMOS), 'utf8');
  const lineOf = (re) => source.split('\n').find((line) => re.test(line)) ?? '';
  const level = (id) => lineOf(new RegExp(`\\{ id: '${id}', name:`));
  assert.match(level('raised'), /surface: '--ds-surface-raised', shadow: '--ds-shadow-raised'/, 'raised is not the raised pair');
  assert.match(level('overlay'), /surface: '--ds-surface-overlay', shadow: '--ds-shadow-overlay'/, 'overlay is not the overlay pair');
  assert.match(level('blocking'), /surface: '--ds-surface-overlay', shadow: '--ds-shadow-blocking'/, 'blocking is not the overlay surface under the blocking shadow');
  const behavior = (id) => lineOf(new RegExp(`\\{ id: '${id}', behavior:`));
  assert.match(behavior('floats'), /level: 'overlay'/);
  for (const layer of [/floating Sidebar/i, /floating Panel/i, /Popup/, /Flag/, /dragged Card/]) {
    assert.match(behavior('floats'), layer, `the floats row does not name ${layer}`);
  }
  assert.match(behavior('blocks'), /level: 'blocking'.*Modal only/, 'the blocks row is not the Modal alone');
  assert.match(behavior('marks'), /level: 'raised'.*Card/, 'a Card does not mark one object on the raised level');
  assert.match(behavior('labels'), /level: null.*Tooltip/, 'the Tooltip row carries a level');
});

/**
 * The card rules are read from the COMPILED stylesheet, so a nested `&:hover`
 * or a border shorthand is seen the way the browser sees it.
 */
const compiled = new Map();
function compiledRules(file) {
  if (!compiled.has(file)) {
    const src = path.join(REPO_ROOT, 'design-system/src');
    const { css } = sass.compile(path.join(REPO_ROOT, file), {
      loadPaths: [path.join(src, 'components'), src],
      logger: sass.Logger.silent,
    });
    compiled.set(file, postcss.parse(css));
  }
  return compiled.get(file);
}

/** The declarations every compiled rule listing exactly `selector` sets, in source order. */
function compiledDecls(file, selector) {
  const merged = {};
  compiledRules(file).walkRules((rule) => {
    if (!rule.selectors.map((s) => s.trim()).includes(selector)) return;
    for (const node of rule.nodes) if (node.type === 'decl') merged[node.prop] = node.value;
  });
  return merged;
}

test('PatternCard pairs each surface with its shadow, at rest, lifted, pressed and dragged', () => {
  const { file, states } = PATTERN_CARD;
  const rest = compiledDecls(file, '.plus-pattern-card');
  assert.equal(rest['background-color'], 'var(--ds-utility-elevation-surface-current)', `${file}: the card paints the current surface`);
  assert.equal(rest.border ?? rest['border-width'], undefined, `${file}: the shadow's ring is the edge, not a border`);
  for (const [selector, surface, shadow] of states) {
    const decls = compiledDecls(file, selector);
    assert.equal(decls['--ds-utility-elevation-surface-current'], `var(${surface})`, `${file}: "${selector}" surface`);
    assert.equal(decls['box-shadow'], `var(${shadow})`, `${file}: "${selector}" shadow`);
  }
  compiledRules(file).walkRules((rule) => {
    for (const selector of rule.selectors) {
      assert.ok(
        !(selector.trim() === '.plus-pattern-card:hover' && rule.nodes.some((n) => n.prop === 'box-shadow')),
        `${file}: "${selector}" lifts every card on hover, not only a clickable one`,
      );
    }
  });
});

test('no pattern or Popover-family stylesheet writes a literal shadow', () => {
  // The Elevation page: a shadow is always a token, never a literal value.
  for (const { file } of SURFACES) {
    const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    for (const match of source.matchAll(/box-shadow:\s*([^;]+);/g)) {
      assert.doesNotMatch(match[1], /rgba?\(|#[0-9a-f]{3,8}\b/i, `${file}: literal shadow "${match[1]}"`);
    }
  }
});
