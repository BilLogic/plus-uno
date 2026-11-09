/**
 * Each interaction state takes the state step the Color page
 * (`design-system/src/styles/Colors.mdx` § States) assigns it: hover 08, pressed 12, selected or dragged 16, and focus no fill
 * at all, because the focus ring carries it.
 *
 * WHY THIS EXISTS. The steps were written down as an example that mapped focus
 * to 16, and the components drifted apart: SidebarTab drew hover and focus at
 * 12, NavTabs pressed at 16 and focus at 12, a tonal Dropdown hovered at 12,
 * and a checked Checkbox or Radio swapped its fill for a 12 wash on hover, so
 * the check vanished. Each row below is one rule and the step it must name.
 *
 * HOW IT READS. Each stylesheet is compiled with `sass`, so a nested `&:hover`
 * is matched as the selector the browser sees. A row names one selector from
 * a rule's selector list exactly; the declarations of every rule that lists it
 * are merged in source order, as the cascade would for equal specificity.
 *
 * WHAT IT CANNOT SEE. Specificity across files, and whether the state looks
 * right. The Storybook play tests and the screenshots carry that.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as sass from 'sass';
import postcss from 'postcss';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(REPO_ROOT, 'design-system/src');

const compiled = new Map();

/** The stylesheet at `file` (under design-system/src), compiled and parsed. */
function sheet(file) {
  if (!compiled.has(file)) {
    const { css } = sass.compile(path.join(SRC, file), {
      loadPaths: [path.join(SRC, 'components'), SRC],
      logger: sass.Logger.silent,
    });
    compiled.set(file, postcss.parse(css));
  }
  return compiled.get(file);
}

const normalize = (selector) => selector.replace(/\s+/g, ' ').trim();

/**
 * `var(--token, fallback)` reads as `var(--token)`: the fallback is what a page
 * without the token sheet draws, and the step is named by the token.
 */
const dropFallbacks = (value) => value.replace(/var\((--[\w-]+),(?:[^()]|\([^()]*\))*\)/g, 'var($1)');

/** Every declaration the rules listing `selector` set, merged in source order. */
export function declarations(root, selector) {
  const wanted = normalize(selector);
  const merged = {};
  let found = false;
  root.walkRules((rule) => {
    if (!rule.selectors.map(normalize).includes(wanted)) return;
    found = true;
    for (const node of rule.nodes) {
      if (node.type === 'decl') merged[node.prop] = dropFallbacks(node.value.replace(/\s*!important$/, ''));
    }
  });
  return found ? merged : null;
}

/** Asserts `selector` in `file` sets each property in `expected` to its value. */
function expectRule(file, selector, expected) {
  const decls = declarations(sheet(file), selector);
  assert.ok(decls, `${file}: no rule lists "${selector}"`);
  for (const [prop, value] of Object.entries(expected)) {
    assert.equal(decls[prop], value, `${file}: "${selector}" sets ${prop} to ${decls[prop]}, want ${value}`);
  }
}

/** A focus rule sets no fill at all: the ring is the whole indicator. */
function expectNoFill(file, selector) {
  const decls = declarations(sheet(file), selector);
  assert.ok(decls, `${file}: no rule lists "${selector}"`);
  for (const prop of ['background-color', 'background', 'background-image']) {
    assert.ok(
      !(prop in decls) || decls[prop] === 'transparent',
      `${file}: "${selector}" fills focus with ${prop}: ${decls[prop]}; focus is shown by the ring`,
    );
  }
}

const RING_OUTSIDE = {
  outline: 'var(--focus-ring-width) solid var(--ds-border-focused)',
  'outline-offset': 'var(--focus-ring-width)',
};

const RING_INSIDE = {
  outline: 'var(--focus-ring-width) solid var(--ds-border-focused)',
  'outline-offset': 'calc(-1 * var(--focus-ring-width))',
};

/** The rings on the new color tokens: `color.border.focused`, outside or inside the box. */
const DS_RING = 'var(--focus-ring-width) solid var(--ds-border-focused)';
const DS_RING_OUTSIDE = { ...RING_OUTSIDE, outline: DS_RING };
const DS_RING_INSIDE = { ...RING_INSIDE, outline: DS_RING };

const layer = (token) => `var(${token})`;

/* ─── SidebarTab and the Sidebar's open tabs ─────────────────────────────── */

const TAB = 'patterns/Sidebar/SidebarTab.scss';

/**
 * The frame chain's navigation is on the new color tokens: hover and press move
 * up the neutral subtle steps, selection is the neutral selected fill (its
 * hovered and pressed steps above it) with a medium-weight label and no
 * leading bar, and focus is the
 * focused ring 2px inside the row (DS_RING_INSIDE, above), with no fill.
 */
test('SidebarTab: neutral hover and press, neutral selection with its own steps, focus a ring inside with no fill', () => {
  expectRule(TAB, '.plus-sidebar-tab:hover:not(.plus-sidebar-tab--disabled):not(.plus-sidebar-tab--selected)', {
    'background-color': layer('--ds-background-neutral-subtle-hovered'),
  });
  expectRule(TAB, '.plus-sidebar-tab:active:not(.plus-sidebar-tab--disabled):not(.plus-sidebar-tab--selected)', {
    'background-color': layer('--ds-background-neutral-subtle-pressed'),
  });
  expectRule(TAB, '.plus-sidebar-tab--hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(TAB, '.plus-sidebar-tab--selected', {
    'background-color': layer('--ds-background-selected'),
    color: layer('--ds-text-selected'),
  });
  assert.ok(
    !('box-shadow' in declarations(sheet(TAB), '.plus-sidebar-tab--selected')),
    `${TAB}: ".plus-sidebar-tab--selected" draws a box-shadow; selection is shown by fill, text, icon and weight, with no leading bar`,
  );
  expectRule(TAB, '.plus-sidebar-tab--selected .plus-sidebar-tab__label', { 'font-weight': layer('--type-weight-medium') });
  expectRule(TAB, '.plus-sidebar-tab--selected:hover:not(.plus-sidebar-tab--disabled)', {
    'background-color': layer('--ds-background-selected-hovered'),
  });
  expectRule(TAB, '.plus-sidebar-tab--selected:active:not(.plus-sidebar-tab--disabled)', {
    'background-color': layer('--ds-background-selected-pressed'),
  });
  expectNoFill(TAB, '.plus-sidebar-tab--focus');
  expectRule(TAB, '.plus-sidebar-tab--focus', DS_RING_INSIDE);
  expectRule(TAB, '.plus-sidebar-tab:focus-visible:not(.plus-sidebar-tab--disabled)', DS_RING_INSIDE);
  expectNoFill(TAB, '.plus-sidebar-tab:focus-visible:not(.plus-sidebar-tab--disabled)');
});

test('Sidebar: rows, titles and the account row hover on the neutral subtle hovered step; a selected row climbs the selected steps', () => {
  const decls = [];
  sheet('patterns/Sidebar/Sidebar.scss').walkRules((rule) => {
    if (/:hover/.test(rule.selector)) {
      const selected = /--selected/.test(rule.selector) && !/:not\(\.plus-pattern-sidebar__row--selected\)/.test(rule.selector);
      for (const node of rule.nodes) if (node.prop === 'background-color') decls.push([selected, node.value]);
    }
  });
  assert.ok(decls.length > 0, 'Sidebar.scss has no hover fill');
  for (const [selected, value] of decls) {
    assert.equal(value, layer(selected ? '--ds-background-selected-hovered' : '--ds-background-neutral-subtle-hovered'));
  }
});

/* ─── Button ─────────────────────────────────────────────────────────────── */

const BUTTON = 'components/forms-and-inputs/Button/Button.scss';
const BOLD = {
  primary: 'brand-bold',
  warning: 'warning-bold',
  danger: 'danger-bold',
  discovery: 'discovery-bold',
};

test('Button: each bold appearance takes its own hovered and pressed steps', () => {
  for (const [appearance, role] of Object.entries(BOLD)) {
    const base = `.plus-btn.plus-btn--${appearance}`;
    expectRule(BUTTON, `${base}:hover`, { 'background-color': layer(`--ds-background-${role}-hovered`) });
    expectRule(BUTTON, `${base}:active`, { 'background-color': layer(`--ds-background-${role}-pressed`) });
  }
});

test('Button: default and subtle take the neutral subtle steps on hover and when pressed', () => {
  for (const appearance of ['default', 'subtle']) {
    const base = `.plus-btn.plus-btn--${appearance}`;
    expectRule(BUTTON, `${base}:hover`, { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
    expectRule(BUTTON, `${base}:active`, { 'background-color': layer('--ds-background-neutral-subtle-pressed') });
  }
});

test('Button: selected takes the selected role with its own steps', () => {
  for (const appearance of ['default', 'subtle']) {
    const base = `.plus-btn.plus-btn--selected.plus-btn--${appearance}`;
    expectRule(BUTTON, base, { 'background-color': layer('--ds-background-selected') });
    expectRule(BUTTON, `${base}:hover`, { 'background-color': layer('--ds-background-selected-hovered') });
    expectRule(BUTTON, `${base}:active`, { 'background-color': layer('--ds-background-selected-pressed') });
  }
});

test('Button: keyboard focus is a 2px focus ring 2px off the edge, with no fill', () => {
  expectRule(BUTTON, '.plus-btn:focus-visible', {
    outline: 'var(--focus-ring-width) solid var(--ds-border-focused)',
    'outline-offset': 'var(--focus-ring-width)',
  });
  expectNoFill(BUTTON, '.plus-btn:focus-visible');
});

/* ─── MenuGroup: DropdownMenu's rows ─────────────────────────────────────── */

// DropdownMenu has no toggle theme of its own (its trigger is a caller's own
// Button or IconButton, which carries Button's steps); its rows are
// MenuGroup's `plus-menu-item`, shared with every other menu in the system.
const MENU_GROUP = 'components/navigation/MenuGroup/MenuGroup.scss';

test('Menu item: neutral hovered and pressed, selected neutral ink, focus ring only', () => {
  expectRule(MENU_GROUP, '.plus-menu-item:hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(MENU_GROUP, '.plus-menu-item:active', { 'background-color': layer('--ds-background-neutral-subtle-pressed') });
  expectRule(MENU_GROUP, '.plus-menu-item[aria-current=true]', { 'background-color': layer('--ds-background-selected') });
  expectRule(MENU_GROUP, '.plus-menu-item:focus-visible', DS_RING_OUTSIDE);
  expectNoFill(MENU_GROUP, '.plus-menu-item:focus-visible');
});

/* ─── Tabs ───────────────────────────────────────────────────────────────── */

const TABS = 'components/navigation/Tabs/Tabs.scss';
const DEFAULT_TAB = '.plus-tabs--appearance-default .plus-tab';

test('Tabs: neutral subtle hovered and pressed on every tab, focus a ring with no fill', () => {
  const hovered = layer('--ds-background-neutral-subtle-hovered');
  const pressed = layer('--ds-background-neutral-subtle-pressed');
  expectRule(TABS, `${DEFAULT_TAB}:hover`, { 'background-color': hovered });
  expectRule(TABS, `${DEFAULT_TAB}:active`, { 'background-color': pressed });
  expectNoFill(TABS, '.plus-tab:focus-visible');
  expectRule(TABS, '.plus-tab:focus-visible', { outline: DS_RING });

  // Selection rests on the bar and the ink, so a selected tab takes the same steps.
  expectRule(TABS, `${DEFAULT_TAB}[data-active]:hover`, { 'background-color': hovered });
  expectRule(TABS, `${DEFAULT_TAB}[data-active]:active`, { 'background-color': pressed });

  // The docs canvas's forced states draw the same steps.
  expectRule(TABS, '.plus-tab.pseudo-pressed:not([data-disabled]):not([data-active])', { 'background-color': pressed });
  expectNoFill(TABS, '.plus-tab.pseudo-focus:not([data-disabled])');
});

/* ─── Checkbox, Radio, Toggle ────────────────────────────────────────────── */

/*
 * Checkbox and Radio are on the new tokens: an unchecked control hovers to the
 * input's hovered fill, and a checked one steps its Lagoon fill to the opaque
 * named hovered step, keeping its mark, rather than laying a layer over it.
 */
test('Checkbox: unchecked hover is the input hovered fill; a checked box steps to selected.bold.hovered', () => {
  const file = 'components/forms-and-inputs/Checkbox/Checkbox.scss';
  const control = '.plus-form-checkbox';
  expectRule(file, `${control}:hover:not([data-disabled]):not([data-checked]):not([data-indeterminate])`, {
    'background-color': layer('--ds-background-input-hovered'),
  });
  for (const checked of ['[data-checked]:hover:not([data-disabled])', '[data-indeterminate]:hover:not([data-disabled])']) {
    const decls = declarations(sheet(file), `${control}${checked}`);
    assert.equal(decls['background-color'], layer('--ds-background-selected-bold-hovered'), `${checked} does not take the hovered step`);
    assert.equal(decls['box-shadow'], undefined, `${checked} still lays a layer over the fill`);
  }
});

test('Radio: unchecked hover is the input hovered fill; a checked radio steps to selected.bold.hovered', () => {
  const file = 'components/forms-and-inputs/Radio/Radio.scss';
  const control = '.plus-form-radio';
  expectRule(file, `${control}:hover:not([data-disabled]):not([data-checked])`, {
    'background-color': layer('--ds-background-input-hovered'),
  });
  const checked = declarations(sheet(file), `${control}[data-checked]:hover:not([data-disabled])`);
  assert.equal(checked['background-color'], layer('--ds-background-selected-bold-hovered'), 'a checked radio does not take the hovered step');
  assert.equal(checked['background-image'], undefined, 'a checked radio draws its dot with a separate indicator span, not background-image');
});

test('Toggle: hover steps the track, neutral bold off and selected bold on', () => {
  const file = 'components/forms-and-inputs/Toggle/Toggle.scss';
  const track = '.plus-toggle';
  expectRule(file, `${track}:hover:not([data-disabled]):not([data-checked])`, {
    'background-color': layer('--ds-background-neutral-bold-hovered'),
  });
  expectRule(file, `${track}[data-checked]:hover:not([data-disabled])`, {
    'background-color': layer('--ds-background-selected-bold-hovered'),
  });
});

/*
 * THE FOCUS GAP. Button, Checkbox, Radio and Toggle draw the same keyboard ring: 2px
 * of the focus-ring role, 2px off the control's edge. The Radio's ring was an
 * inverse-primary halo touching its border, and on a checked radio the two
 * merged into one thick primary edge that did not read as focus. The ring is
 * DS_RING_OUTSIDE, defined with the shared rings above.
 */
for (const [name, file, selector, ring] of [
  ['Checkbox', 'components/forms-and-inputs/Checkbox/Checkbox.scss', '.plus-form-checkbox:focus-visible', DS_RING_OUTSIDE],
  ['Radio', 'components/forms-and-inputs/Radio/Radio.scss', '.plus-form-radio:focus-visible', DS_RING_OUTSIDE],
  ['Toggle', 'components/forms-and-inputs/Toggle/Toggle.scss', '.plus-toggle:focus-visible', DS_RING_OUTSIDE],
]) {
  test(`${name}: keyboard focus is a 2px focus ring with a 2px gap`, () => {
    expectRule(file, selector, ring);
    expectNoFill(file, selector);
    const { 'box-shadow': shadow } = declarations(sheet(file), selector);
    assert.ok(shadow === undefined || shadow === 'none', `${name}: focus also draws a box-shadow ring: ${shadow}`);
  });
}

/* ─── PatternModal close ─────────────────────────────────────────────────── */

test('PatternModal: the close button takes the neutral hovered and pressed steps', () => {
  const file = 'patterns/PatternModal/PatternModal.scss';
  expectRule(file, '.plus-pattern-modal-close:hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, '.plus-pattern-modal-close:active', { 'background-color': layer('--ds-background-neutral-subtle-pressed') });
});

/* ─── Field ──────────────────────────────────────────────────────────────── */

test('FieldBox: hover turns the border border.focused, subtle hover the neutral subtle step, focus a ring 2px off the box', () => {
  const file = 'components/forms-and-inputs/_internal/FieldBox.scss';
  expectRule(file, '.plus-field--hover', { 'border-color': layer('--ds-border-focused') });
  expectRule(file, '.plus-field--subtle.plus-field--hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, '.plus-field--focus', DS_RING_OUTSIDE);
  expectNoFill(file, '.plus-field--focus');
});

/*
 * THE SWEEP. The components below drifted the same way: pressed at 16, focus
 * as a 12 fill, a selected state at 12, or no pressed step at all. Each block
 * pins the steps the Color page's States section names.
 */

/* ─── CloseButton ────────────────────────────────────────────────────────── */

test('CloseButton: an Icon button, subtle — inverse repaints the named hovered, pressed and focus-ring steps', () => {
  const file = 'components/forms-and-inputs/CloseButton/CloseButton.scss';
  const base = '.plus-close-btn.plus-close-btn--inverse';
  expectRule(file, `${base}:hover`, { 'background-color': layer('--ds-interaction-inverse-hovered') });
  expectRule(file, `${base}:active`, { 'background-color': layer('--ds-interaction-inverse-pressed') });
  for (const focus of [`${base}:focus`, `${base}:focus-visible`]) {
    const decls = declarations(sheet(file), focus);
    assert.ok(!decls || !('background-color' in decls), `${focus} fills focus with ${decls?.['background-color']}`);
  }
  // The default tone's hovered, pressed and ring are Icon button's own subtle
  // appearance and keyboard focus ring (Button: default and subtle take the
  // neutral subtle steps; Button: keyboard focus is a 2px focus ring), so this
  // file only overrides what inverse repaints.
  expectRule(file, `${base}:focus-visible`, { 'outline-color': layer('--ds-border-focused-inverse') });
});

/* ─── Pagination ─────────────────────────────────────────────────────────── */

test('Pagination: hovered, pressed, current page selected, focus a ring with no fill', () => {
  const file = 'components/navigation/Pagination/Pagination.scss';
  const link = '.plus-pagination__page';
  expectRule(file, `${link}:hover`, { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, `${link}:active`, { 'background-color': layer('--ds-background-neutral-subtle-pressed') });
  expectRule(file, `${link}:focus-visible`, RING_INSIDE);
  expectNoFill(file, `${link}:focus-visible`);
  expectNoFill(file, `${link}:focus`);
  const nav = '.plus-pagination__navigator';
  expectRule(file, `${nav}:hover`, { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, `${nav}[aria-disabled=true]`, { 'background-color': layer('--ds-background-disabled') });
  expectRule(file, '.plus-pagination__page[aria-current=page]', {
    'background-color': layer('--ds-background-selected'),
  });
});

/* ─── Tag ────────────────────────────────────────────────────────────────── */

test("Tag: the accent's hovered, pressed and selected steps; the × on the neutral steps, focus a ring", () => {
  const file = 'components/labels/Tag/Tag.scss';
  expectRule(file, '.plus-tag--selectable:hover', { 'background-color': layer('--plus-tag-hovered') });
  expectRule(file, '.plus-tag--selectable:active', { 'background-color': layer('--plus-tag-pressed') });
  for (const selected of ['.plus-tag--selected', '.plus-tag--selected:hover', '.plus-tag--selected:active']) {
    expectRule(file, selected, { 'background-color': layer('--plus-tag-selected') });
  }
  expectRule(file, '.plus-tag:focus-visible', DS_RING_OUTSIDE);
  expectNoFill(file, '.plus-tag:focus-visible');

  expectRule(file, '.plus-tag__remove:hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, '.plus-tag__remove:active', { 'background-color': layer('--ds-background-neutral-subtle-pressed') });
  for (const remove of ['.plus-tag__remove:focus-visible', '.plus-tag--elevated .plus-tag__remove:focus-visible']) {
    expectRule(file, remove, DS_RING_OUTSIDE);
    expectNoFill(file, remove);
  }
});

/* ─── RichTextEditor toolbar ─────────────────────────────────────────────── */

test('RichTextEditor: the toolbar draws no button state of its own — its subtle Icon buttons and Button keep theirs', () => {
  const root = sheet('components/forms-and-inputs/RichTextEditor/RichTextEditor.scss');
  const overrides = [];
  root.walkRules((rule) => {
    if (/\.plus-btn|block-toggle/.test(rule.selector) && /:hover|:active|:focus-visible|\.active/.test(rule.selector)) {
      overrides.push(rule.selector);
    }
  });
  assert.deepEqual(overrides, [], 'hover, press, focus and selected come from Button, not from the editor');
});

/* ─── PatternTable rows ──────────────────────────────────────────────────── */

test('PatternTable: row states are layered over the cell fill — neutral subtle hover and press, the selected ladder with no leading bar', () => {
  const file = 'patterns/PatternTable/PatternTable.scss';
  const table = '.plus-pattern-table-table';
  const row = `${table} tbody tr`;
  const state = '--plus-pattern-table-row-state';
  const over = (token) => `linear-gradient(${layer(token)}, ${layer(token)})`;
  // Every cell draws the row's state as an image over its fill, never as the fill.
  expectRule(file, `${table} th`, { 'background-image': over(state) });
  expectRule(file, `${table} td`, { 'background-image': over(state) });
  expectRule(file, `${row}:hover`, { [state]: layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, `${row}:active`, { [state]: layer('--ds-background-neutral-subtle-pressed') });
  expectRule(file, `${row}[aria-selected=true]`, { [state]: layer('--ds-background-selected') });
  expectRule(file, `${row}[aria-selected=true]:hover`, { [state]: layer('--ds-background-selected-hovered') });
  expectRule(file, `${row}[aria-selected=true]:active`, { [state]: layer('--ds-background-selected-pressed') });
  // State is the whole row, never a stripe on one edge: no cell of a selected
  // row draws a layer of its own over the row's state.
  sheet(file).walkRules((rule) => {
    if (!rule.selector.includes('aria-selected')) return;
    rule.walkDecls((decl) => {
      assert.ok(!decl.value.includes('--ds-border-selected'), `${file}: "${rule.selector}" draws a selected edge`);
    });
  });
  const leading = declarations(sheet(file), `${row}[aria-selected=true] > :first-child`) ?? {};
  assert.ok(!('background-image' in leading) && !('box-shadow' in leading), `${file}: a selected row's leading cell draws an edge`);
  for (const selector of [`${row}:hover`, `${row}:active`, `${row}[aria-selected=true]`]) {
    assert.ok(!('background-color' in declarations(sheet(file), selector)), `${file}: "${selector}" swaps the fill`);
  }
});

/* ─── Suggestion ─────────────────────────────────────────────────────────── */

test('Suggestion: discovery on hover, its hovered step pressed, focus the ring alone', () => {
  const file = 'components/labels/Suggestion/Suggestion.scss';
  expectRule(file, '.plus-suggestion:hover', { 'background-color': layer('--ds-background-discovery') });
  expectRule(file, '.plus-suggestion:active', { 'background-color': layer('--ds-background-discovery-hovered') });
  expectRule(file, '.plus-suggestion:focus-visible', DS_RING_OUTSIDE);
  expectNoFill(file, '.plus-suggestion:focus-visible');
});
