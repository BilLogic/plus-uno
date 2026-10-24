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

/** Every declaration the rules listing `selector` set, merged in source order. */
export function declarations(root, selector) {
  const wanted = normalize(selector);
  const merged = {};
  let found = false;
  root.walkRules((rule) => {
    if (!rule.selectors.map(normalize).includes(wanted)) return;
    found = true;
    for (const node of rule.nodes) {
      if (node.type === 'decl') merged[node.prop] = node.value.replace(/\s*!important$/, '');
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

const RING_INSIDE = {
  outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)',
  'outline-offset': 'calc(-1 * var(--size-element-stroke-lg))',
};

const layer = (token) => `var(${token})`;

/* ─── SidebarTab and the Sidebar's open tabs ─────────────────────────────── */

const TAB = 'components/navigation/SidebarTab/SidebarTab.scss';

test('SidebarTab: hover 08, selected 16, focus a ring with no fill', () => {
  expectRule(TAB, '.plus-sidebar-tab:hover:not(.plus-sidebar-tab--disabled):not(.plus-sidebar-tab--selected)', {
    'background-color': layer('--color-on-surface-state-08'),
  });
  expectRule(TAB, '.plus-sidebar-tab--hover', { 'background-color': layer('--color-primary-state-08') });
  expectRule(TAB, '.plus-sidebar-tab--selected', { 'background-color': layer('--color-primary-state-16') });
  expectNoFill(TAB, '.plus-sidebar-tab--focus');
  expectRule(TAB, '.plus-sidebar-tab--focus', RING_INSIDE);
  expectRule(TAB, '.plus-sidebar-tab:focus-visible:not(.plus-sidebar-tab--disabled)', RING_INSIDE);
  expectNoFill(TAB, '.plus-sidebar-tab:focus-visible:not(.plus-sidebar-tab--disabled)');
});

test('Sidebar: an open-tab parent hovers at 08', () => {
  const decls = [];
  sheet('patterns/Sidebar/Sidebar.scss').walkRules((rule) => {
    if (/:hover/.test(rule.selector)) {
      for (const node of rule.nodes) if (node.prop === 'background-color') decls.push(node.value);
    }
  });
  assert.ok(decls.length > 0, 'Sidebar.scss has no hover fill');
  for (const value of decls) assert.equal(value, layer('--color-on-surface-state-08'));
});

/* ─── Button ─────────────────────────────────────────────────────────────── */

const BUTTON = 'components/actions/Button/Button.scss';
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

test('Dropdown items: hover 08, pressed 12, selected primary 08 (dense list), focus ring only', () => {
  expectRule(DROPDOWN, '.pdropdown .dropdown-item:hover', { 'background-color': layer('--color-on-surface-state-08') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item:active', { 'background-color': layer('--color-on-surface-state-12') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item.selected', { 'background-color': layer('--color-primary-state-08') });
  expectRule(DROPDOWN, '.pdropdown .dropdown-item:focus-visible', RING_INSIDE);
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

test('NavTabs: hover 08, pressed 12, focus a ring with no fill', () => {
  expectRule(NAV, `${LINK}:hover${NOT}`, { 'background-color': layer('--color-on-surface-state-08') });
  expectRule(NAV, `${LINK}:active${NOT}`, { 'background-color': layer('--color-on-surface-state-12') });
  expectNoFill(NAV, `${LINK}:focus-visible${NOT}`);
  expectRule(NAV, `${LINK}:focus-visible${NOT}`, { outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)' });

  expectRule(NAV, `${LINK}.active:hover`, { 'background-color': layer('--color-primary-state-08') });
  expectRule(NAV, `${LINK}.active:active`, { 'background-color': layer('--color-primary-state-12') });
  expectNoFill(NAV, `${LINK}.active:focus-visible`);
  expectRule(NAV, `${LINK}.active:focus-visible`, { outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)' });

  // The docs canvas's forced states draw the same steps.
  const item = '.plus-nav-tabs .nav-item';
  expectRule(NAV, `${item}.pseudo-pressed > .nav-link${NOT}`, { 'background-color': layer('--color-on-surface-state-12') });
  expectNoFill(NAV, `${item}.pseudo-focus > .nav-link${NOT}`);
  expectRule(NAV, `${item}.pseudo-pressed > .nav-link.active`, { 'background-color': layer('--color-primary-state-12') });
  expectNoFill(NAV, `${item}.pseudo-focus > .nav-link.active`);

  expectRule(NAV, '.plus-nav-tabs .dropdown .dropdown-toggle:active', {
    'background-color': layer('--color-on-surface-state-12'),
  });
});

/* ─── Checkbox, Radio, Switch ────────────────────────────────────────────── */

const SHADOW_08 = 'linear-gradient(var(--color-shadow-state-08), var(--color-shadow-state-08))';

test('Checkbox: unchecked hover 08; a checked box keeps its fill under the shadow 08', () => {
  const file = 'components/forms-and-inputs/Checkbox.scss';
  const input = '.plus-form-checkbox .form-check-input';
  expectRule(file, `${input}:hover:not(:disabled):not(:indeterminate)`, {
    'background-color': layer('--color-primary-state-08'),
  });
  for (const checked of [':checked:hover:not(:disabled):not(:indeterminate)', ':indeterminate:hover:not(:disabled)']) {
    const decls = declarations(sheet(file), `${input}${checked}`);
    assert.equal(decls['background-color'], layer('--color-primary'), `${checked} swaps the fill for a wash`);
    assert.equal(
      decls['box-shadow'],
      'inset 0 0 0 var(--layout-control-checkbox) var(--color-shadow-state-08)',
      `${checked} lays no shadow 08 over the fill`,
    );
  }
});

test('Radio: unchecked hover 08; a checked radio keeps its fill under the shadow 08', () => {
  const file = 'components/forms-and-inputs/Radio.scss';
  const input = '.plus-form-radio .form-check-input';
  expectRule(file, `${input}:hover:not(:disabled):not(:checked)`, {
    'background-color': layer('--color-primary-state-08'),
  });
  const checked = declarations(sheet(file), `${input}:hover:not(:disabled):checked`);
  assert.equal(checked['background-color'], layer('--color-primary'), 'a checked radio swaps its fill for a wash');
  assert.ok(checked['background-image'].endsWith(SHADOW_08), 'a checked radio lays no shadow 08 over its fill');
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
 * THE FOCUS GAP. Button, Checkbox and Radio draw the same keyboard ring: 2px
 * of the focus-ring role, 2px off the control's edge. The Radio's ring was an
 * inverse-primary halo touching its border, and on a checked radio the two
 * merged into one thick primary edge that did not read as focus.
 */
for (const [name, file, selector] of [
  ['Checkbox', 'components/forms-and-inputs/Checkbox.scss', '.plus-form-checkbox .form-check-input:focus-visible'],
  ['Radio', 'components/forms-and-inputs/Radio.scss', '.plus-form-radio .form-check-input:focus-visible'],
]) {
  test(`${name}: keyboard focus is a 2px focus ring with a 2px gap`, () => {
    expectRule(file, selector, {
      outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)',
      'outline-offset': 'var(--size-element-stroke-lg)',
    });
    expectNoFill(file, selector);
  });
}

/* ─── PatternModal close ─────────────────────────────────────────────────── */

test('PatternModal: the close button hovers at 08 and presses at 12', () => {
  const file = 'patterns/PatternModal/PatternModal.scss';
  expectRule(file, '.plus-pattern-modal-close:hover', { 'background-color': layer('--color-on-surface-state-08') });
  expectRule(file, '.plus-pattern-modal-close:active', { 'background-color': layer('--color-on-surface-state-12') });
});

/* ─── Field ──────────────────────────────────────────────────────────────── */

test('Field: subtle hover 08, focus a ring, hover border inverse-primary (documented exception)', () => {
  const file = 'components/forms-and-inputs/_internal/Field.scss';
  expectRule(file, '.plus-field--hover', { 'border-color': layer('--color-inverse-primary') });
  expectRule(file, '.plus-field--subtle.plus-field--hover', { 'background-color': layer('--color-on-surface-state-08') });
  expectRule(file, '.plus-field--focus', { outline: 'var(--size-element-stroke-lg) solid var(--color-focus-ring)' });
  expectNoFill(file, '.plus-field--focus');
});
