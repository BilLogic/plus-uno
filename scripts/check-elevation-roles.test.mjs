/**
 * The elevation mapping table, the retired-name record and the stylesheets
 * must name the same shadow.
 *
 * WHY THIS EXISTS. `design-system/guidelines/figma/token-mapping.md` carries a
 * five-row table — Light/1 subtle, Light/2 clickable cards on hover or drag,
 * Light/3 floating layers, Light/4 legacy, Light/5 dialogs. The role layer
 * added for #268 once shipped `--surface-raised-shadow: var(--elevation-light-1)`,
 * answering "which shadow does a card get?" differently from that table, and
 * nothing noticed, because the two live in different file types and no check
 * read both.
 *
 * Levels 1-3 are now retired: every use moved to the generated shadow the
 * migration map gives them (`RETIRED_LEGACY` in `scripts/lib/color/legacy-map.mjs`).
 *
 * WHAT IS ASSERTED. A retired level's row names the shadow the record moved it
 * to, and a level still in code names itself. Both sides are parsed from
 * source, so this fails whichever side moves.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. WHETHER THE TABLE IS RIGHT. If Light/2 is the wrong shadow for a card,
 *     this passes happily. It checks agreement, not judgment.
 *  2. COMPONENTS THAT USE A LEVEL DIRECTLY. The layers moved to the new color
 *     tokens name `--ds-shadow-overlay` with `--ds-surface-overlay` themselves;
 *     a modal takes that overlay pair too, since the blanket under it is what
 *     sets it apart from a menu. The surfaces listed below are pinned one by
 *     one; auditing every `box-shadow` against the table is a different check
 *     with a much larger corpus.
 *  3. ROLES WITH NO ROW. `--surface-container` carries no shadow and appears in
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

import { dsName } from './lib/color/emit.mjs';
import { RETIRED_LEGACY } from './lib/color/legacy-map.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAPPING = path.join(REPO_ROOT, 'design-system/guidelines/figma/token-mapping.md');

/** `Elevation Light/4 (legacy) | var(--elevation-light-4)` → `{ level, uses, token }` per row. */
export function mappingLevels(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    const match = /^\|\s*Elevation Light\/(\d)\s*\(([^)]*)\)\s*\|\s*`var\((--[a-z0-9-]+)\)`/.exec(line.trim());
    if (match) rows.push({ level: Number(match[1]), uses: match[2], token: match[3] });
  }
  return rows;
}

const rows = mappingLevels(fs.readFileSync(MAPPING, 'utf8'));

test('the mapping table is still parseable', () => {
  // A table that stopped matching would make every assertion below vacuous —
  // the shape of green that means nothing was checked at all.
  assert.equal(rows.length, 5, `expected 5 elevation rows in token-mapping.md, parsed ${rows.length}`);
});

test('a retired level maps to the shadow its uses moved to; a live level maps to itself', () => {
  for (const row of rows) {
    const legacy = `--elevation-light-${row.level}`;
    const moved = RETIRED_LEGACY[legacy];
    const expected = moved ? dsName(moved) : legacy;
    assert.equal(row.token, expected, `token-mapping.md maps Light/${row.level} ("${row.uses}") to ${row.token}, not ${expected}`);
  }
  assert.equal(rows.find((r) => /cards/i.test(r.uses))?.token, '--ds-shadow-raised', 'the cards row');
  assert.equal(rows.find((r) => /floating layers/i.test(r.uses))?.token, '--ds-shadow-overlay', 'the floating-layers row');
});

test('modals and the migrated layers take the overlay pair, not a Light level', () => {
  // Decision 3 of the color proposal: a modal sits at the overlay level, as
  // every floating layer does, and the blanket under it is what sets it apart
  // from a menu. So no Light row may claim a modal or a migrated layer, and
  // the mapping names the overlay pair for them instead. A Light/4 modal
  // coming back is a reversal of that decision, not an edit to slip through.
  const layers = /modals|menus|listboxes|popovers|tooltips|toasts/i;
  for (const row of rows) {
    assert.doesNotMatch(row.uses, layers, `token-mapping.md gives Light/${row.level} to "${row.uses}"; those layers take the overlay pair`);
  }
  const mapping = fs.readFileSync(MAPPING, 'utf8');
  for (const [half, token] of [['surface', '--ds-surface-overlay'], ['shadow', '--ds-shadow-overlay']]) {
    const row = mapping.split('\n').find((line) => new RegExp(`^\\|\\s*Overlay ${half}\\s*\\(`).test(line.trim()));
    assert.ok(row, `token-mapping.md has no Overlay ${half} row`);
    for (const words of [/modals/i, /menus/i, /popovers/i, /tooltips/i, /toasts/i]) {
      assert.match(row, words, `the Overlay ${half} row no longer names ${words}`);
    }
    assert.ok(row.includes(`var(${token})`), `the Overlay ${half} row does not name var(${token})`);
  }
  for (const file of ['design-system/src/components/messaging/Modal/Modal.scss', 'design-system/src/patterns/PatternModal/PatternModal.scss']) {
    const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    assert.doesNotMatch(source, /--elevation-light-[45]/, `${file} names a modal Light level; modals take the overlay pair`);
  }
});

/**
 * THE STEP EACH SURFACE TAKES, read from the stylesheets that draw them.
 *
 * `foundations/elevation.md` assigns the levels by component. The floating
 * layers on the new color tokens (menus and dropdowns, Listbox, Popover,
 * Tooltip, Toast) and modals take the overlay pair, `--ds-surface-overlay`
 * with `--ds-shadow-overlay`; the Frame's floating sidebar takes the overlay
 * shadow on the nav's sunken fill. A card is on the
 * raised pair or lifts while a clickable card is hovered or dragged. Each row
 * is one surface and the shadow its rule must name; a rule that names another
 * level, or a literal shadow, fails.
 */
const SURFACES = [
  { file: 'design-system/src/patterns/PatternCard/PatternCard.scss', rule: '.plus-pattern-card--dragging {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/overlays-and-layering/Popup/Popup.scss', rule: '.plus-popup {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/overlays-and-layering/Tooltip/Tooltip.scss', rule: '.plus-tooltip {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/messaging/Flag/Flag.scss', rule: '.plus-flag', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  // The floating Sidebar keeps the nav's sunken fill under the overlay shadow, so docked and floating read differently.
  { file: 'design-system/src/patterns/Frame/Frame.scss', rule: '.plus-frame__sidebar--raised {', shadow: '--ds-shadow-overlay', fill: '--ds-surface-sunken' },
  { file: 'design-system/src/components/messaging/Modal/Modal.scss', rule: '.plus-modal', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
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
      `${surface.file} lifts its surface with "${shadow}"; elevation.md and the role layer say var(${surface.shadow}).`,
    );
    if (surface.fill) {
      assert.equal(firstAfter(source, surface.rule, 'background-color'), `var(${surface.fill})`);
    }
  });
}

test("elevation.md's hierarchy table says the same steps", () => {
  const doc = fs.readFileSync(path.join(REPO_ROOT, 'design-system/guidelines/foundations/elevation.md'), 'utf8');
  const hierarchy = doc.slice(doc.indexOf('## Elevation Hierarchy'));
  const rowOf = (words) => hierarchy.split('\n').find((line) => line.startsWith('|') && words.test(line));
  for (const layer of [/modals/i, /menus/i, /dropdowns/i, /listboxes/i, /popups/i, /tooltips/i, /flags/i, /floating sidebar/i]) {
    const row = rowOf(layer);
    assert.ok(row, `elevation.md's hierarchy table has no row matching ${layer}`);
    assert.match(row, /--ds-surface-overlay/, `elevation.md does not put ${layer} on the overlay surface`);
    assert.match(row, /--ds-shadow-overlay/, `elevation.md does not put ${layer} on the overlay shadow`);
  }
  assert.match(rowOf(/clickable cards on hover or drag/i) ?? '', /--ds-shadow-raised/, 'elevation.md does not lift a clickable card with the raised shadow');
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
  // elevation.md rule 3: never hardcode shadows.
  for (const { file } of SURFACES) {
    const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    for (const match of source.matchAll(/box-shadow:\s*([^;]+);/g)) {
      assert.doesNotMatch(match[1], /rgba?\(|#[0-9a-f]{3,8}\b/i, `${file}: literal shadow "${match[1]}"`);
    }
  }
});
