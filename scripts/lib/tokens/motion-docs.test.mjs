import test from 'node:test';
import assert from 'node:assert/strict';

import { motionEventsOf, motionLibraryOf, motionLibraryTableOf, motionLineOf, motionRowOf, motionSectionOf, motionVarOf, soundTextOf } from './motion-docs.mjs';

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
  assert.deepEqual(rows.map((r) => r.name), ['Layout', 'Gizmo', 'Widget']);
  const widget = rows.find((r) => r.name === 'Widget');
  assert.equal(widget.tier, 'component');
  assert.deepEqual(widget.events.map((e) => e.event), ['enter', 'change']);
  assert.deepEqual(widget.events[0].tokens, ['spatial.fast', 'appearance.fast']);
});

test('the Library table renders one line per event under the row name', () => {
  const table = motionLibraryTableOf(registry);
  assert.match(table, /^\| Name \| Tier \| Event \| Transition \| Tokens \| Sound \|/);
  assert.match(table, /\| Widget \| component \| enter \| Open \| `--ds-motion-spatial-fast` · `--ds-motion-appearance-fast` \|/);
  assert.match(table, /\| Gizmo \| component \| exit \|  \| `--ds-motion-appearance-fast` \|/);
});

test('the Library refuses a row naming a token that does not exist', () => {
  const bad = [{ name: 'Bad', tier: 'component', events: { enter: { spatial: 'spatial.nope' } } }];
  assert.throws(() => motionLibraryOf(bad), /Bad.*spatial\.nope/);
});

test('the Library groups rows by tier (templates, patterns, components), each group by name', () => {
  const mixed = [
    { name: 'Zed', tier: 'component', events: { change: { appearance: 'appearance.fast' } } },
    { name: 'Flow', tier: 'pattern', events: { change: { appearance: 'appearance.fast' } } },
    { name: 'Shell', tier: 'template', events: { change: { appearance: 'appearance.fast' } } },
    { name: 'Alpha', tier: 'component', events: { change: { appearance: 'appearance.fast' } } },
    { name: 'Cell', tier: 'template', events: { change: { appearance: 'appearance.fast' } } },
  ];
  assert.deepEqual(motionLibraryOf(mixed).map((r) => `${r.tier}:${r.name}`), [
    'template:Cell', 'template:Shell', 'pattern:Flow', 'component:Alpha', 'component:Zed',
  ]);
  const lines = motionLibraryTableOf(mixed).split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Name') && !l.startsWith('| ---'));
  assert.deepEqual(lines.map((l) => l.split(' | ')[1]), ['template', 'template', 'pattern', 'component', 'component']);
});

test('the Library refuses a tier the registry does not know', () => {
  assert.throws(() => motionLibraryOf([{ name: 'X', tier: 'organism', events: { change: { appearance: 'appearance.fast' } } }]), /X.*organism/);
});

test('rowOf takes a tier, so a template and a component can share a name', () => {
  const pair = [
    { name: 'Dialog', tier: 'component', events: { enter: { spatial: 'spatial.fast' } } },
    { name: 'Dialog', tier: 'template', events: { enter: { spatial: 'spatial.default' } } },
  ];
  assert.equal(motionRowOf('Dialog', pair, 'template').tier, 'template');
  assert.equal(motionRowOf('Dialog', pair, 'component').tier, 'component');
  assert.equal(motionRowOf('Dialog', pair).tier, 'component');
  assert.equal(motionRowOf('Dialog', [pair[1]]).tier, 'template');
});

test('every MotionSection in a docs page names a row of the real registry, in its tier', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { MOTION_REGISTRY } = await import('./motion-registry.mjs');
  const root = path.resolve(import.meta.dirname, '../../../design-system/src');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.mdx') ? [path.join(d, e.name)] : []));
  let templates = 0;
  for (const file of walk(root)) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/<MotionSection\b([^>]*)\/>/g)) {
      const name = m[1].match(/component="([^"]+)"/)[1];
      const tier = m[1].match(/tier="([^"]+)"/)?.[1] ?? null;
      assert.ok(motionRowOf(name, MOTION_REGISTRY, tier), `${path.relative(root, file)}: no ${tier ?? ''} row named ${name}`);
      if (tier === 'template') templates += 1;
    }
  }
  assert.ok(templates >= 11, `expected the template pages to carry a MotionSection, found ${templates}`);
});

const loud = {
  name: 'Beeper',
  tier: 'component',
  events: {
    enter: { transition: 'Open', spatial: 'spatial.fast', note: 'Grows.', sound: { token: 'notify', when: 'outside a session' } },
    exit: { appearance: 'appearance.fast', sound: { token: 'done.sent', at: 'start' } },
    change: { appearance: 'appearance.fast' },
  },
};

test('an event carries its sound cell, at land by default, and null when silent', () => {
  assert.deepEqual(motionEventsOf(loud).map((e) => e.sound), [
    { token: 'notify', at: 'land', when: 'outside a session' },
    { token: 'done.sent', at: 'start', when: '' },
    null,
  ]);
});

test('a sound reads as its token, its moment and its condition', () => {
  assert.equal(soundTextOf({ token: 'notify', at: 'land', when: 'outside a session' }), '`sound.notify` on land: outside a session');
  assert.equal(soundTextOf({ token: 'done.sent', at: 'start', when: '' }), '`sound.done.sent` on start');
  assert.equal(soundTextOf(null), '');
});

test('the Motion section gains a Sound column only when the row plays', () => {
  const section = motionSectionOf(loud);
  assert.match(section, /\| Event \| Transition \| Tokens \| What it does \| Sound \|/);
  assert.match(section, /\| enter \| Open \| `--ds-motion-spatial-fast` \| Grows\. \| `sound\.notify` on land: outside a session \|/);
  assert.match(section, /\| change \|  \| `--ds-motion-appearance-fast` \|  \|  \|/);
  assert.doesNotMatch(motionSectionOf(row), /Sound/);
});

test('the motion line names a sound beside its event', () => {
  assert.match(motionLineOf(loud), /enter `spatial.fast`, sound `sound.notify` · exit `appearance.fast`, sound `sound.done.sent` · change `appearance.fast`\./);
});

test('the Library has a Sound column on every line', () => {
  const table = motionLibraryTableOf([loud, row]);
  assert.match(table, /^\| Name \| Tier \| Event \| Transition \| Tokens \| Sound \|/);
  assert.match(table, /\| Beeper \| component \| enter \| Open \| `--ds-motion-spatial-fast` \| `sound\.notify` on land: outside a session \|/);
  assert.match(table, /\| Widget \| component \| change \|  \| `--ds-motion-appearance-default` \|  \|/);
});
