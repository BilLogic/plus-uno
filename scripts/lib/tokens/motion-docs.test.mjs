import test from 'node:test';
import assert from 'node:assert/strict';

import { motionEventsOf, motionLineOf, motionRowOf, motionSectionOf, motionVarOf } from './motion-docs.mjs';

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
