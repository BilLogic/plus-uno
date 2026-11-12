import test from 'node:test';
import assert from 'node:assert/strict';

import { motionEventsOf, motionLibraryOf, motionLibraryTableOf, motionLineOf, motionRowOf, motionSectionOf, motionVarOf } from './motion-docs.mjs';

const row = {
  name: 'Widget',
  tier: 'component',
  events: {
    enter: { transition: 'Open', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Grows.' },
    change: { appearance: 'appearance.default' },
  },
};

test('a token reads through its --ds-motion custom property', () => {
  assert.equal(motionVarOf('spatial.fast'), '--ds-motion-spatial-fast');
});

test('events keep the row order and drop absent tokens', () => {
  assert.deepEqual(motionEventsOf(row).map((e) => [e.event, e.tokens]), [
    ['enter', ['spatial.fast', 'appearance.fast']],
    ['change', ['appearance.default']],
  ]);
});

test('the section and the line render any row, naming no other component', () => {
  const section = motionSectionOf(row);
  assert.match(section, /^## Motion\n/);
  assert.match(section, /Widget reads these motion tokens/);
  assert.match(section, /\| enter \| Open \| `--ds-motion-spatial-fast` · `--ds-motion-appearance-fast` \| Grows\. \|/);
  assert.match(motionLineOf(row), /^\*\*Motion:\*\* enter `spatial.fast` \+ `appearance.fast` · change `appearance.default`\./);
});

test('rowOf finds a row by name and is null for a component without one', () => {
  assert.equal(motionRowOf('Widget', [row]), row);
  assert.equal(motionRowOf('Nope', [row]), null);
});

const registry = [
  row,
  { name: 'Gizmo', tier: 'component', events: { enter: { transition: 'Open', spatial: 'spatial.fast' }, exit: { appearance: 'appearance.fast' } } },
  { name: 'Layout', tier: 'template', events: { change: { transition: 'Step', spatial: 'spatial.default' } } },
];

test('the Library has one row per registry row, with every event and token', () => {
  const rows = motionLibraryOf(registry);
  assert.deepEqual(rows.map((r) => r.name), ['Gizmo', 'Layout', 'Widget']);
  const widget = rows.find((r) => r.name === 'Widget');
  assert.equal(widget.tier, 'component');
  assert.deepEqual(widget.events.map((e) => e.event), ['enter', 'change']);
  assert.deepEqual(widget.events[0].tokens, ['spatial.fast', 'appearance.fast']);
});

test('the Library table renders one line per event under the row name', () => {
  const table = motionLibraryTableOf(registry);
  assert.match(table, /^\| Name \| Tier \| Event \| Transition \| Tokens \|/);
  assert.match(table, /\| Widget \| component \| enter \| Open \| `--ds-motion-spatial-fast` · `--ds-motion-appearance-fast` \|/);
  assert.match(table, /\| Gizmo \| component \| exit \|  \| `--ds-motion-appearance-fast` \|/);
});

test('the Library refuses a row naming a token that does not exist', () => {
  const bad = [{ name: 'Bad', tier: 'component', events: { enter: { spatial: 'spatial.nope' } } }];
  assert.throws(() => motionLibraryOf(bad), /Bad.*spatial\.nope/);
});
