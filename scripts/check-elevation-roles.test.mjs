/**
 * The surface ROLES and the elevation mapping table must name the same level.
 *
 * WHY THIS EXISTS. `design-system/guidelines/figma/token-mapping.md` has carried
 * a five-row table — Light/1 subtle, Light/2 clickable cards on hover or drag,
 * Light/3 every floating layer without a scrim, Light/4 modals, Light/5
 * dialogs — and the components follow it through the surface roles.
 *
 * The role layer added for #268 then shipped `--surface-raised-shadow:
 * var(--elevation-light-1)`. A token whose entire purpose is to answer "which
 * shadow does a card get?" answered it differently from the document that had
 * already answered it, in the same repository, and nothing noticed — because
 * the two live in different file types and no check read both.
 *
 * WHAT IS ASSERTED. The level in the table row for a role is the level the role
 * token points at. Both sides are parsed from source, so this fails whichever
 * side moves: re-pointing the token fails it, and so does editing the table.
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

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ELEVATION = path.join(REPO_ROOT, `${TOKEN_DIR}/_elevation.scss`);
const MAPPING = path.join(REPO_ROOT, 'design-system/guidelines/figma/token-mapping.md');

/**
 * Which table row each shadow role answers.
 *
 * The role is matched to a row by the row's own words rather than by position,
 * so re-ordering the table is not a failure and re-labeling it is.
 */
const ROLES = [
  { token: '--surface-raised-shadow', rowMatches: /cards/i },
  { token: '--surface-overlay-shadow', rowMatches: /floating layers/i },
];

/** `Elevation Light/4 (modals) | var(--elevation-light-4)` → level per row. */
export function mappingLevels(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    const match = /^\|\s*Elevation Light\/(\d)\s*\(([^)]*)\)\s*\|\s*`var\(--elevation-light-(\d)\)`/.exec(line.trim());
    if (!match) continue;
    // The row states the level twice — once as the Figma style, once as the
    // CSS token. They disagreeing would be its own bug, so it is asserted here
    // rather than silently preferring one.
    assert.equal(match[1], match[3], `token-mapping.md row "${line.trim()}" names two different levels`);
    rows.push({ level: Number(match[1]), uses: match[2] });
  }
  return rows;
}

/** `--surface-raised-shadow: var(--elevation-light-2);` → 2 */
export function roleLevel(scss, token) {
  const match = new RegExp(`^\\s*${token}:\\s*var\\(--elevation-light-(\\d)\\);`, 'm').exec(scss);
  return match ? Number(match[1]) : null;
}

const scss = fs.readFileSync(ELEVATION, 'utf8');
const rows = mappingLevels(fs.readFileSync(MAPPING, 'utf8'));

test('the mapping table is still parseable', () => {
  // A table that stopped matching would make every assertion below vacuous —
  // the shape of green that means nothing was checked at all.
  assert.equal(rows.length, 5, `expected 5 elevation rows in token-mapping.md, parsed ${rows.length}`);
});

for (const role of ROLES) {
  test(`${role.token} points at the level the mapping table assigns`, () => {
    const row = rows.find((r) => role.rowMatches.test(r.uses));
    assert.ok(row, `no row in token-mapping.md matches ${role.rowMatches} — the table was relabeled`);

    const actual = roleLevel(scss, role.token);
    assert.ok(actual !== null, `${role.token} is not a var(--elevation-light-N) in _elevation.scss`);
    assert.equal(
      actual,
      row.level,
      `${role.token} points at --elevation-light-${actual}, but token-mapping.md assigns ` +
        `Light/${row.level} to "${row.uses}". One of the two moved; both are source, so pick which.`,
    );
  });
}

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
 * Tooltip, Toast, the Frame's floating sidebar) and modals take the overlay
 * pair, `--ds-surface-overlay` with `--ds-shadow-overlay`; a layer still on
 * legacy tokens takes Light/3 through the overlay role. A card is on the
 * raised pair or lifts while a clickable card is hovered or dragged. Each row
 * is one surface and the shadow its rule must name; a rule that names another
 * level, or a literal shadow, fails.
 */
const SURFACES = [
  { file: 'design-system/src/patterns/PatternCard/PatternCard.scss', rule: '.plus-pattern-card--dragging,', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/styles/main.scss', rule: '.plus-card--dragging {', shadow: '--surface-raised-shadow' },
  { file: 'design-system/src/components/overlays-and-layering/Popover/Popover.scss', rule: '.plus-popover {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/overlays-and-layering/Tooltip/Tooltip.scss', rule: '.tooltip-inner {', shadow: '--ds-shadow-overlay' },
  { file: 'design-system/src/components/messaging/Toast/Toast.scss', rule: '.plus-toast', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/patterns/Frame/Frame.scss', rule: '.plus-frame__sidebar--floating {', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/components/messaging/Modal/Modal.scss', rule: '.plus-modal', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/patterns/PatternModal/PatternModal.scss', rule: '.plus-pattern-modal {', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/components/forms-and-inputs/_internal/Listbox.scss', rule: '', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
  { file: 'design-system/src/components/forms-and-inputs/Dropdown/Dropdown.scss', rule: '.dropdown-menu', shadow: '--ds-shadow-overlay', fill: '--ds-surface-overlay' },
];

/**
 * A CARD AT REST IS FLAT: a 1px outline-variant border and no shadow. The lift
 * belongs to a clickable card while it is hovered or dragged, so a page of
 * cards reads as one plane until the pointer picks one up.
 */
const FLAT_CARDS = [
  { file: 'design-system/src/styles/main.scss', selector: '.plus-card', fill: '--surface-raised' },
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
  const levelOf = (words) => {
    const row = hierarchy.split('\n').find((line) => line.startsWith('|') && words.test(line));
    assert.ok(row, `elevation.md's hierarchy table has no row matching ${words}`);
    return Number(/--elevation-light-(\d)/.exec(row)[1]);
  };
  const rowOf = (words) => hierarchy.split('\n').find((line) => line.startsWith('|') && words.test(line));
  for (const layer of [/modals/i, /menus/i, /dropdowns/i, /listboxes/i, /popovers/i, /tooltips/i, /toasts/i, /floating sidebar/i]) {
    const row = rowOf(layer);
    assert.ok(row, `elevation.md's hierarchy table has no row matching ${layer}`);
    assert.match(row, /--ds-surface-overlay/, `elevation.md does not put ${layer} on the overlay surface`);
    assert.match(row, /--ds-shadow-overlay/, `elevation.md does not put ${layer} on the overlay shadow`);
  }
  assert.equal(levelOf(/still on legacy tokens/i), 3, 'elevation.md puts the legacy floating layers somewhere other than Light/3');
  assert.equal(levelOf(/clickable cards on hover or drag/i), 2);
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

for (const card of FLAT_CARDS) {
  test(`${path.basename(card.file)} draws a resting card flat, on its outline`, () => {
    const rest = compiledDecls(card.file, card.selector);
    assert.equal(rest['box-shadow'], 'none', `${card.file}: a resting card carries no shadow`);
    assert.equal(rest['background-color'], `var(${card.fill})`);
    assert.match(rest['border-color'] ?? rest.border ?? '', /var\(--color-outline-variant\)/, `${card.file}: the resting card's outline role`);
  });

  test(`${path.basename(card.file)} lifts only a clickable card on hover, or any card while dragged`, () => {
    for (const lifted of [`${card.selector}--clickable:hover`, `${card.selector}--dragging`]) {
      assert.equal(compiledDecls(card.file, lifted)['box-shadow'], 'var(--surface-raised-shadow)', `${card.file}: "${lifted}" does not lift`);
    }
    compiledRules(card.file).walkRules((rule) => {
      for (const selector of rule.selectors) {
        assert.ok(
          !(selector.includes(`${card.selector}:hover`) && rule.nodes.some((n) => n.prop === 'box-shadow' && n.value !== 'none')),
          `${card.file}: "${selector}" lifts every card on hover, not only a clickable one`,
        );
      }
    });
  });
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
