/**
 * Each interaction state takes the state-layer step `foundations/color.md`
 * assigns it: hover 08, pressed 12, selected or dragged 16, and focus no fill
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
  outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)',
  'outline-offset': 'var(--size-element-stroke-lg)',
};

const RING_INSIDE = {
  outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)',
  'outline-offset': 'calc(-1 * var(--size-element-stroke-lg))',
};

/** The rings on the new color tokens: `color.border.focused`, outside or inside the box. */
const DS_RING = 'var(--size-element-stroke-lg) solid var(--ds-border-focused)';
const DS_RING_OUTSIDE = { ...RING_OUTSIDE, outline: DS_RING };
const DS_RING_INSIDE = { ...RING_INSIDE, outline: DS_RING };

const layer = (token) => `var(${token})`;

/* ─── SidebarTab and the Sidebar's open tabs ─────────────────────────────── */

const TAB = 'components/navigation/SidebarTab/SidebarTab.scss';

/**
 * The frame chain's navigation is on the new color tokens: hover and press move
 * up the neutral subtle steps, selection is the neutral selected fill (its
 * hovered and pressed steps above it) with a leading bar, and focus is the
 * focused ring 2px outside the row (DS_RING_OUTSIDE, above), with no fill.
 */
test('SidebarTab: neutral hover and press, neutral selection with its own steps, focus a ring outside with no fill', () => {
  expectRule(TAB, '.plus-sidebar-tab:hover:not(.plus-sidebar-tab--disabled):not(.plus-sidebar-tab--selected)', {
    'background-color': layer('--ds-background-neutral-subtle-hovered'),
  });
  expectRule(TAB, '.plus-sidebar-tab:active:not(.plus-sidebar-tab--disabled):not(.plus-sidebar-tab--selected)', {
    'background-color': layer('--ds-background-neutral-subtle-pressed'),
  });
  expectRule(TAB, '.plus-sidebar-tab--hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(TAB, '.plus-sidebar-tab--selected', {
    'background-color': layer('--ds-background-selected'),
    'box-shadow': `inset var(--size-element-stroke-lg) 0 0 ${layer('--ds-border-selected')}`,
    color: layer('--ds-text-selected'),
  });
  expectRule(TAB, '.plus-sidebar-tab--selected:hover:not(.plus-sidebar-tab--disabled)', {
    'background-color': layer('--ds-background-selected-hovered'),
  });
  expectRule(TAB, '.plus-sidebar-tab--selected:active:not(.plus-sidebar-tab--disabled)', {
    'background-color': layer('--ds-background-selected-pressed'),
  });
  expectNoFill(TAB, '.plus-sidebar-tab--focus');
  expectRule(TAB, '.plus-sidebar-tab--focus', DS_RING_OUTSIDE);
  expectRule(TAB, '.plus-sidebar-tab:focus-visible:not(.plus-sidebar-tab--disabled)', DS_RING_OUTSIDE);
  expectNoFill(TAB, '.plus-sidebar-tab:focus-visible:not(.plus-sidebar-tab--disabled)');
});

test('Sidebar: an open-tab parent hovers on the neutral subtle hovered step', () => {
  const decls = [];
  sheet('patterns/Sidebar/Sidebar.scss').walkRules((rule) => {
    if (/:hover/.test(rule.selector)) {
      for (const node of rule.nodes) if (node.prop === 'background-color') decls.push(node.value);
    }
  });
  assert.ok(decls.length > 0, 'Sidebar.scss has no hover fill');
  for (const value of decls) assert.equal(value, layer('--ds-background-neutral-subtle-hovered'));
});

/* ─── Button ─────────────────────────────────────────────────────────────── */

const BUTTON = 'components/forms-and-inputs/Button/Button.scss';
const INTENTS = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info'];

test('Button: filled and tonal lay the shadow 08 on hover and 12 when pressed', () => {
  for (const intent of INTENTS) {
    for (const fill of ['filled', 'tonal']) {
      const base = `.plus-btn--${intent}.plus-btn--${fill}`;
      expectRule(BUTTON, `${base}:hover`, { '--plus-btn-state-layer': layer('--color-shadow-state-08') });
      for (const pressed of [':active', '.active']) {
        expectRule(BUTTON, `${base}${pressed}`, { '--plus-btn-state-layer': layer('--color-shadow-state-12') });
      }
    }
  }
});

test("Button: outline and ghost take the intent's 08 on hover and 12 when pressed", () => {
  for (const intent of INTENTS) {
    for (const fill of ['outline', 'ghost', 'text']) {
      const base = `.plus-btn--${intent}.plus-btn--${fill}`;
      expectRule(BUTTON, `${base}:hover`, { 'background-color': layer(`--color-${intent}-state-08`) });
      for (const pressed of [':active', '.active']) {
        expectRule(BUTTON, `${base}${pressed}`, { 'background-color': layer(`--color-${intent}-state-12`) });
      }
    }
  }
});

test('Button: keyboard focus is a 2px focus ring 2px off the edge, with no fill', () => {
  expectRule(BUTTON, '.plus-btn.btn:focus-visible', {
    outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)',
    'outline-offset': 'var(--size-element-stroke-lg)',
  });
  expectNoFill(BUTTON, '.plus-btn.btn:focus-visible');
});

/* ─── Dropdown: menu items and toggles ───────────────────────────────────── */

const DROPDOWN = 'components/forms-and-inputs/Dropdown/Dropdown.scss';

test('Dropdown items: neutral hovered and pressed, selected neutral ink with its own steps, focus ring only', () => {
  expectRule(DROPDOWN, '.pdropdown .dropdown-item:hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item:active', { 'background-color': layer('--ds-background-neutral-subtle-pressed') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item.selected', { 'background-color': layer('--ds-background-selected') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item.selected:hover', { 'background-color': layer('--ds-background-selected-hovered') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item.selected:active', { 'background-color': layer('--ds-background-selected-pressed') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item:focus-visible', DS_RING_INSIDE);
  expectNoFill(DROPDOWN, '.pdropdown .dropdown-item:focus-visible');
});

test('Dropdown toggles: the same steps as Button', () => {
  for (const intent of ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info']) {
    const at = (fill) => `.pdropdown.pdropdown-${intent}${fill ? `.pdropdown-${fill}` : ''} .pdropdown-toggle`;
    expectRule(DROPDOWN, `${at('')}:hover`, { '--plus-dropdown-state-layer': layer('--color-shadow-state-08') });
    expectRule(DROPDOWN, `${at('')}:active`, { '--plus-dropdown-state-layer': layer('--color-shadow-state-12') });
    expectRule(DROPDOWN, `${at('tonal')}:hover`, { '--plus-dropdown-state-layer': layer('--color-shadow-state-08') });
    expectRule(DROPDOWN, `${at('tonal')}:active`, { '--plus-dropdown-state-layer': layer('--color-shadow-state-12') });
    for (const fill of ['outline', 'ghost']) {
      expectRule(DROPDOWN, `${at(fill)}:hover`, { 'background-color': layer(`--color-${intent}-state-08`) });
      expectRule(DROPDOWN, `${at(fill)}:active`, {
        'background-color': layer(`--color-${intent}-state-12`),
        '--plus-dropdown-state-layer': 'transparent',
      });
    }
  }
});

/* ─── NavTabs ────────────────────────────────────────────────────────────── */

const NAV = 'components/navigation/NavTabs/NavTabs.scss';
const LINK = '.plus-nav-tabs .nav-link';
const NOT = ':not(.disabled):not(:disabled):not(.active)';

test('NavTabs: neutral subtle hovered and pressed on every tab, focus a ring with no fill', () => {
  const hovered = layer('--ds-background-neutral-subtle-hovered');
  const pressed = layer('--ds-background-neutral-subtle-pressed');
  expectRule(NAV, `${LINK}:hover${NOT}`, { 'background-color': hovered });
  expectRule(NAV, `${LINK}:active${NOT}`, { 'background-color': pressed });
  expectNoFill(NAV, `${LINK}:focus-visible${NOT}`);
  expectRule(NAV, `${LINK}:focus-visible${NOT}`, { outline: DS_RING });

  // Selection rests on the bar and the ink, so a selected tab takes the same steps.
  expectRule(NAV, `${LINK}.active:hover`, { 'background-color': hovered });
  expectRule(NAV, `${LINK}.active:active`, { 'background-color': pressed });
  expectNoFill(NAV, `${LINK}.active:focus-visible`);
  expectRule(NAV, `${LINK}.active:focus-visible`, { outline: DS_RING });

  // The docs canvas's forced states draw the same steps.
  const item = '.plus-nav-tabs .nav-item';
  expectRule(NAV, `${item}.pseudo-pressed > .nav-link${NOT}`, { 'background-color': pressed });
  expectNoFill(NAV, `${item}.pseudo-focus > .nav-link${NOT}`);
  expectRule(NAV, `${item}.pseudo-pressed > .nav-link.active`, { 'background-color': pressed });
  expectNoFill(NAV, `${item}.pseudo-focus > .nav-link.active`);

  expectRule(NAV, '.plus-nav-tabs .dropdown .dropdown-toggle:active', { 'background-color': pressed });
});

/* ─── Checkbox, Radio, Switch ────────────────────────────────────────────── */

const SHADOW_08 = 'linear-gradient(var(--color-shadow-state-08), var(--color-shadow-state-08))';

/*
 * Checkbox and Radio are on the new tokens: an unchecked control hovers to the
 * input's hovered fill, and a checked one steps its Lagoon fill to the opaque
 * named hovered step, keeping its mark, rather than laying a layer over it.
 */
test('Checkbox: unchecked hover is the input hovered fill; a checked box steps to selected.bold.hovered', () => {
  const file = 'components/forms-and-inputs/Checkbox.scss';
  const input = '.plus-form-checkbox .form-check-input';
  expectRule(file, `${input}:hover:not(:disabled):not(:indeterminate)`, {
    'background-color': layer('--ds-background-input-hovered'),
  });
  for (const checked of [':checked:hover:not(:disabled):not(:indeterminate)', ':indeterminate:hover:not(:disabled)']) {
    const decls = declarations(sheet(file), `${input}${checked}`);
    assert.equal(decls['background-color'], layer('--ds-background-selected-bold-hovered'), `${checked} does not take the hovered step`);
    assert.equal(decls['box-shadow'], undefined, `${checked} still lays a layer over the fill`);
  }
});

test('Radio: unchecked hover is the input hovered fill; a checked radio steps to selected.bold.hovered', () => {
  const file = 'components/forms-and-inputs/Radio.scss';
  const input = '.plus-form-radio .form-check-input';
  expectRule(file, `${input}:hover:not(:disabled):not(:checked)`, {
    'background-color': layer('--ds-background-input-hovered'),
  });
  const checked = declarations(sheet(file), `${input}:hover:not(:disabled):checked`);
  assert.equal(checked['background-color'], layer('--ds-background-selected-bold-hovered'), 'a checked radio does not take the hovered step');
  assert.equal(checked['background-image'], undefined, 'a checked radio redraws its dot on hover; the checked rule draws it');
});

test('Switch: hover lays the 08 over the track, on or off', () => {
  const file = 'components/forms-and-inputs/Switch.scss';
  const input = '.plus-form-switch .form-check-input[type=checkbox]';
  expectRule(file, `${input}:hover:not(:disabled):not(:checked)`, {
    'background-color': layer('--color-surface'),
    'background-image': 'linear-gradient(var(--color-primary-state-08), var(--color-primary-state-08))',
  });
  expectRule(file, `${input}:checked:hover:not(:disabled)`, {
    'background-color': layer('--color-primary'),
    'background-image': SHADOW_08,
  });
});

/*
 * THE FOCUS GAP. Button, Checkbox, Radio and Switch draw the same keyboard ring: 2px
 * of the focus-ring role, 2px off the control's edge. The Radio's ring was an
 * inverse-primary halo touching its border, and on a checked radio the two
 * merged into one thick primary edge that did not read as focus. The ring is
 * DS_RING_OUTSIDE, defined with the shared rings above.
 */
for (const [name, file, selector, ring] of [
  ['Checkbox', 'components/forms-and-inputs/Checkbox.scss', '.plus-form-checkbox .form-check-input:focus-visible', DS_RING_OUTSIDE],
  ['Radio', 'components/forms-and-inputs/Radio.scss', '.plus-form-radio .form-check-input:focus-visible', DS_RING_OUTSIDE],
  ['Switch', 'components/forms-and-inputs/Switch.scss', '.plus-form-switch .form-check-input[type=checkbox]:focus-visible', RING_OUTSIDE],
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

test('Field: hover turns the border border.focused, subtle hover the neutral subtle step, focus a ring 2px off the box', () => {
  const file = 'components/forms-and-inputs/_internal/Field.scss';
  expectRule(file, '.plus-field--hover', { 'border-color': layer('--ds-border-focused') });
  expectRule(file, '.plus-field--subtle.plus-field--hover', { 'background-color': layer('--ds-background-neutral-subtle-hovered') });
  expectRule(file, '.plus-field--focus', DS_RING_OUTSIDE);
  expectNoFill(file, '.plus-field--focus');
});

/*
 * THE SWEEP. The components below drifted the same way: pressed at 16, focus
 * as a 12 fill, a selected state at 12, or no pressed step at all. Each block
 * pins the steps the table in color.md names.
 */

/* ─── NavPills ───────────────────────────────────────────────────────────── */

test('NavPills: hover 08, pressed 12, focus a ring with no fill, selected or not', () => {
  const file = 'components/navigation/NavPills/NavPills.scss';
  for (const pill of ['.plus-nav-pills .nav-link', '.nav-pills .plus-nav-item-pill']) {
    expectRule(file, `${pill}:hover${NOT}`, { 'background-color': layer('--color-on-surface-state-08') });
    expectRule(file, `${pill}:active${NOT}`, { 'background-color': layer('--color-on-surface-state-12') });
    expectRule(file, `${pill}:focus-visible${NOT}`, RING_OUTSIDE);
    expectNoFill(file, `${pill}:focus-visible${NOT}`);

    // The primary border carries selection, by class or by attribute; the
    // steps lay over it.
    for (const selected of ['.active', '[aria-selected=true]', '[aria-current=page]', '[aria-current=true]']) {
      expectRule(file, `${pill}${selected}:hover`, { 'background-color': layer('--color-primary-state-08') });
      expectRule(file, `${pill}${selected}:active`, { 'background-color': layer('--color-primary-state-12') });
      expectRule(file, `${pill}${selected}:focus-visible`, RING_OUTSIDE);
      expectNoFill(file, `${pill}${selected}:focus-visible`);
    }
  }

  const item = '.plus-nav-pills .nav-item';
  expectRule(file, `${item}.pseudo-pressed > .nav-link${NOT}`, { 'background-color': layer('--color-on-surface-state-12') });
  expectNoFill(file, `${item}.pseudo-focus > .nav-link${NOT}`);
  expectRule(file, `${item}.pseudo-focus > .nav-link${NOT}`, RING_OUTSIDE);
  expectRule(file, `${item}.pseudo-pressed > .nav-link.active`, { 'background-color': layer('--color-primary-state-12') });
  expectNoFill(file, `${item}.pseudo-focus > .nav-link.active`);
  expectRule(file, `${item}.pseudo-focus > .nav-link.active`, RING_OUTSIDE);

  expectRule(file, '.plus-nav-pills .dropdown .dropdown-toggle:active', {
    'background-color': layer('--color-on-surface-state-12'),
  });
});

/* ─── CloseButton ────────────────────────────────────────────────────────── */

test('CloseButton: hover 08, pressed 12, focus the ring alone, on both tones', () => {
  const file = 'components/forms-and-inputs/CloseButton/CloseButton.scss';
  for (const [btn, role] of [
    ['.plus-close-btn', '--color-on-surface-variant'],
    ['.plus-close-btn--inverse', '--color-surface'],
  ]) {
    expectRule(file, `${btn}:hover`, { 'background-color': layer(`${role}-state-08`) });
    expectRule(file, `${btn}:active`, { 'background-color': layer(`${role}-state-12`) });
    for (const focus of [`${btn}:focus`, `${btn}:focus-visible`]) {
      const decls = declarations(sheet(file), focus);
      assert.ok(!decls || !('background-color' in decls), `${focus} fills focus with ${decls?.['background-color']}`);
    }
  }
  // The ring itself is drawn on ::after, 2px outside the box.
  expectRule(file, '.plus-close-btn:focus-visible::after', {
    border: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)',
  });
  expectRule(file, '.plus-close-btn--inverse:focus-visible::after', {
    'border-color': layer('--color-focus-ring-inverse'),
  });
});

/* ─── Pagination ─────────────────────────────────────────────────────────── */

test('Pagination: hover 08, pressed 12, current page 16, focus a ring with no fill', () => {
  const file = 'components/navigation/Pagination/Pagination.scss';
  const link = '.plus-pagination .page-item:not(.disabled):not(.active) .page-link';
  expectRule(file, `${link}:hover`, { 'background-color': layer('--color-secondary-state-08') });
  expectRule(file, `${link}:active`, { 'background-color': layer('--color-secondary-state-12') });
  expectRule(file, `${link}:focus-visible`, RING_INSIDE);
  expectNoFill(file, `${link}:focus-visible`);
  assert.equal(declarations(sheet(file), `${link}:focus`), null, 'a pointer focus draws a state of its own');
  expectRule(file, '.plus-pagination .page-item.active .page-link', {
    'background-color': layer('--color-secondary-state-16'),
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

test('RichTextEditor: toolbar buttons hover 08, press 12, select 16; the block menu selects at 08', () => {
  const file = 'components/forms-and-inputs/RichTextEditor/RichTextEditor.scss';
  const btn = '.plus-rich-text-editor:not(.plus-rich-text-editor--full) .plus-rich-text-editor-toolbar .plus-btn.btn';
  expectRule(file, `${btn}:hover:not(:disabled):not(.active)`, { 'background-color': layer('--color-secondary-state-08') });
  expectRule(file, `${btn}:active:not(:disabled):not(.active)`, { 'background-color': layer('--color-secondary-state-12') });
  expectRule(file, `${btn}.active`, { 'background-color': layer('--color-primary-state-16') });
  expectRule(file, `${btn}:focus-visible`, RING_OUTSIDE);
  expectNoFill(file, `${btn}:focus-visible`);

  const toggle = '.plus-rich-text-editor-block-toggle';
  expectRule(file, `${toggle}:hover:not(:disabled)`, { 'background-color': layer('--color-on-surface-state-08') });
  expectRule(file, `${toggle}:active:not(:disabled)`, { 'background-color': layer('--color-on-surface-state-12') });
  expectRule(file, `${toggle}:focus-visible`, RING_OUTSIDE);
  expectNoFill(file, `${toggle}:focus-visible`);

  // The block menu is a dense list, so it selects at primary 08 (color.md).
  const item = '.plus-rich-text-editor-block-menu .dropdown-item';
  expectRule(file, `${item}:hover`, { 'background-color': layer('--color-on-surface-state-08') });
  expectRule(file, `${item}:active`, { 'background-color': layer('--color-on-surface-state-12') });
  expectRule(file, `${item}.active`, { 'background-color': layer('--color-primary-state-08') });
  expectRule(file, `${item}:focus-visible`, RING_INSIDE);
  expectNoFill(file, `${item}:focus-visible`);
  expectNoFill(file, `${item}:focus`);
  // Bootstrap's own `.dropdown-item:focus` fills the item, so a rule here
  // must clear it.
  expectRule(file, `${item}:focus:not(:hover):not(:active):not(.active)`, { 'background-color': 'transparent' });
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
