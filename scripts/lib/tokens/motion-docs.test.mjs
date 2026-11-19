import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MOTION_FAMILIES,
  MOTION_TRANSITIONS,
  filterMotionLibrary,
  motionEventsOf,
  motionFamilyOf,
  motionLibraryOf,
  motionLibraryTableOf,
  motionLineOf,
  motionRowOf,
  motionSectionOf,
  motionVarOf,
  soundTextOf,
} from './motion-docs.mjs';

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
  const expectedTemplates = MOTION_REGISTRY.filter((r) => r.tier === 'template').length;
  assert.equal(templates, expectedTemplates, `expected all ${expectedTemplates} template rows to carry a MotionSection, found ${templates}`);
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

test('MOTION_TRANSITIONS exports the 14 locked transition names in order', () => {
  assert.deepEqual(MOTION_TRANSITIONS, [
    'Go to another area',
    'Drill into and climb back out',
    'Switch views',
    'Step to the next or previous',
    'Scroll to a spot on the page',
    'Swap content in place',
    'Add or remove an item',
    'Reorder items',
    'Expand and collapse',
    'Load content',
    'Open and close an overlay',
    'Dock and undock a panel',
    'Update a value or state',
    'Call attention',
  ]);
});

test('motionFamilyOf maps token names to spatial, appearance or linear, including spatial.exit', () => {
  assert.deepEqual(MOTION_FAMILIES, ['spatial', 'appearance', 'linear']);
  assert.equal(motionFamilyOf('spatial.fast'), 'spatial');
  assert.equal(motionFamilyOf('spatial.exit'), 'spatial');
  assert.equal(motionFamilyOf('appearance.default'), 'appearance');
  assert.equal(motionFamilyOf('linear'), 'linear');
  assert.equal(motionFamilyOf('loop'), null);
});

test('each Library row exposes href (null when unlinked) and tier-aware links for shared names', () => {
  const shared = [
    { name: 'Popup', tier: 'template', events: { enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast' } } },
    { name: 'Popup', tier: 'component', events: { enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast' } } },
    { name: 'Orphan', tier: 'pattern', events: { change: { transition: 'Swap content in place', appearance: 'appearance.fast' } } },
  ];
  const links = {
    'template:Popup': '?path=/docs/templates-popup--docs#motion',
    'component:Popup': '?path=/docs/components-overlays-and-layering-popup--docs#motion',
  };
  const rows = motionLibraryOf(shared, links);
  assert.deepEqual(
    rows.map((r) => ({ tier: r.tier, name: r.name, href: r.href })),
    [
      { tier: 'template', name: 'Popup', href: '?path=/docs/templates-popup--docs#motion' },
      { tier: 'pattern', name: 'Orphan', href: null },
      { tier: 'component', name: 'Popup', href: '?path=/docs/components-overlays-and-layering-popup--docs#motion' },
    ],
  );
});

test('the live Library links shared template/component names to their own pages and sets null where absent', () => {
  const live = motionLibraryOf();
  const find = (tier, name) => live.find((r) => r.tier === tier && r.name === name);
  assert.equal(find('template', 'Panel').href, '?path=/docs/templates-panel--docs#motion');
  assert.equal(find('component', 'Panel'), undefined);
  assert.equal(find('template', 'Popup').href, '?path=/docs/templates-popup--docs#motion');
  assert.equal(find('component', 'Popup').href, '?path=/docs/components-overlays-and-layering-popup--docs#motion');
  assert.equal(find('template', 'Blanket').href, '?path=/docs/templates-modal--docs#blanket-motion');
  assert.equal(find('component', 'Sidebar').href, null);
  assert.equal(find('pattern', 'Errors').href, null);
});

test('each Library row exposes unique transitions, families and sounds in event order', () => {
  const custom = [
    {
      name: 'OverlayBox',
      tier: 'component',
      events: {
        enter: {
          transition: 'Open and close an overlay',
          spatial: 'spatial.fast',
          appearance: 'appearance.fast',
          sound: { token: 'notify' },
        },
        exit: {
          transition: 'Open and close an overlay',
          spatial: 'spatial.exit',
          sound: { token: 'notify' },
        },
        milestone: {
          transition: 'Load content',
          appearance: 'linear',
          sound: { token: 'done.step' },
        },
        pulse: {
          transition: 'Load content',
          appearance: 'loop',
        },
      },
    },
    {
      name: 'QuietFade',
      tier: 'pattern',
      events: {
        change: { transition: 'Swap content in place', appearance: 'appearance.default' },
      },
    },
  ];
  const [quiet, overlay] = motionLibraryOf(custom, {});
  assert.equal(overlay.tier, 'component');
  assert.deepEqual(overlay.transitions, ['Open and close an overlay', 'Load content']);
  assert.deepEqual(overlay.families, ['spatial', 'appearance', 'linear']);
  assert.deepEqual(overlay.sounds, ['notify', 'done.step']);

  assert.equal(quiet.tier, 'pattern');
  assert.deepEqual(quiet.transitions, ['Swap content in place']);
  assert.deepEqual(quiet.families, ['appearance']);
  assert.deepEqual(quiet.sounds, []);
});

test('filterMotionLibrary combines query and facets with AND across facets and OR within each facet', () => {
  const sample = motionLibraryOf(
    [
      {
        name: 'Popup',
        tier: 'template',
        events: { enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast' } },
      },
      {
        name: 'Popup',
        tier: 'component',
        events: {
          enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast' },
          exit: { transition: 'Open and close an overlay', spatial: 'spatial.exit' },
        },
      },
      {
        name: 'Flag',
        tier: 'component',
        events: {
          enter: { transition: 'Open and close an overlay', spatial: 'spatial.default', sound: { token: 'notify' } },
          failed: { transition: 'Open and close an overlay', appearance: 'appearance.default', sound: { token: 'error' } },
        },
      },
      {
        name: 'Skeleton',
        tier: 'component',
        events: { change: { transition: 'Load content', appearance: 'linear' } },
      },
      {
        name: 'Filtering',
        tier: 'pattern',
        events: { change: { transition: 'Swap content in place', appearance: 'appearance.fast' } },
      },
    ],
    {},
  );

  // Empty constraints return all rows in order.
  assert.equal(filterMotionLibrary(sample).length, 5);
  assert.equal(filterMotionLibrary(sample, { query: '   ', tiers: [], transitions: [], families: [], sounds: [] }).length, 5);

  // Case-insensitive name substring.
  assert.deepEqual(
    filterMotionLibrary(sample, { query: 'POP' }).map((r) => `${r.tier}:${r.name}`),
    ['template:Popup', 'component:Popup'],
  );

  // OR within a facet.
  assert.deepEqual(
    filterMotionLibrary(sample, { tiers: ['template', 'pattern'] }).map((r) => `${r.tier}:${r.name}`),
    ['template:Popup', 'pattern:Filtering'],
  );
  assert.deepEqual(
    filterMotionLibrary(sample, { transitions: ['Load content', 'Swap content in place'] }).map((r) => r.name),
    ['Filtering', 'Skeleton'],
  );
  assert.deepEqual(
    filterMotionLibrary(sample, { families: ['linear'] }).map((r) => r.name),
    ['Skeleton'],
  );
  assert.deepEqual(
    filterMotionLibrary(sample, { sounds: ['error'] }).map((r) => r.name),
    ['Flag'],
  );

  // AND across facets + query.
  assert.deepEqual(
    filterMotionLibrary(sample, {
      query: 'pop',
      tiers: ['component'],
      transitions: ['Open and close an overlay'],
      families: ['appearance'],
    }).map((r) => `${r.tier}:${r.name}`),
    ['component:Popup'],
  );
  assert.deepEqual(
    filterMotionLibrary(sample, {
      query: 'pop',
      sounds: ['notify'],
    }),
    [],
  );
});
