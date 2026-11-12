// check:motion-registry, mutation-tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, interactiveComponents, run, validTokens } from './check-motion-registry.mjs';

const INDEX = '## UI components (3)\n\n- [Button](../x/Button/index.md)\n- [Popup](../x/Popup/index.md)\n- [Heading](../x/Heading/index.md)\n- Logo — exported here\n\n## Before you finish\n- [Nope](../n.md)\n';

function scratch(names) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-registry-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  const entries = Object.fromEntries(names.map((n) => [n, { count: 1 }]));
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', sets: { main: { entries } } }, null, 2));
  return root;
}

const row = (name, extra = {}) => ({
  name,
  tier: 'component',
  events: {
    enter: { transition: 'Open', spatial: 'spatial.fast', appearance: 'appearance.fast', sound: { token: 'prompt', at: 'land' } },
    exit: { transition: 'Close', spatial: 'spatial.exit' },
    change: { transition: 'Swap', appearance: 'appearance.fast', note: 'cross-fade' },
  },
  ...extra,
});
const withEvent = (name, event, tier = 'component') => ({ name, tier, events: { enter: event } });

test('interactive components are the index list minus the static ones', () => {
  assert.deepEqual(interactiveComponents(INDEX), ['Button', 'Popup']);
});

test('valid tokens are the plan semantics plus linear', () => {
  const t = validTokens();
  assert.ok(t.has('spatial.fast') && t.has('loop') && t.has('linear'));
  assert.ok(!t.has('spatial.huge'));
});

test('every component on the allow-list or in the registry passes', () => {
  const root = scratch(['Button']);
  assert.deepEqual(run({ repoRoot: root, index: INDEX, registry: [row('Popup')] }), []);
});

test('a component in neither fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [] });
  assert.match(f[0].message, /Popup/);
  assert.match(f[0].message, /not in the registry/);
});

test('a row naming a missing token fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Popup', { spatial: 'spatial.huge' })] });
  assert.match(f[0].message, /spatial\.huge/);
});

test('a bad token inside a named event fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [{ name: 'Popup', tier: 'component', events: { success: { transition: 'Done', appearance: 'appearance.nope' } } }] });
  assert.match(f[0].message, /appearance\.nope/);
  assert.match(f[0].message, /success/);
});

test('a component row with a sound field passes; sound is ignored', () => {
  const root = scratch(['Button']);
  const r = withEvent('Popup', { transition: 'Open', spatial: 'spatial.fast', sound: { token: 'not-checked-here' } });
  assert.deepEqual(run({ repoRoot: root, index: INDEX, registry: [r] }), []);
});

test('a pattern row passes without being in the component index', () => {
  const root = scratch(['Button', 'Popup']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Wizard', { spatial: 'spatial.fast' }, 'pattern'), withEvent('Home', { appearance: 'linear' }, 'template')] });
  assert.ok(!f.some((x) => /Wizard|Home/.test(x.message)), JSON.stringify(f));
});

test('an unknown tier fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Popup', { spatial: 'spatial.fast' }, 'molecule')] });
  assert.match(f[0].message, /molecule/);
});

test('an event with neither spatial nor appearance fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Popup', { transition: 'Open', note: 'x' })] });
  assert.match(f[0].message, /neither spatial nor appearance/);
});

test('a row for a component the index lacks fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [row('Popup'), row('Ghost')] });
  assert.match(f[0].message, /Ghost/);
});

test('a component both registered and still on the allow-list is stale', () => {
  const root = scratch(['Button', 'Popup']);
  const f = run({ repoRoot: root, index: INDEX, registry: [row('Popup')] });
  assert.match(f[0].message, /Popup/);
});

test('the allow-list cannot grow: a new component not in the record fails', () => {
  const root = scratch([]);
  const f = run({ repoRoot: root, index: INDEX, registry: [row('Button')] });
  assert.match(f[0].message, /Popup/);
});

test('the live tree holds its own record', () => {
  assert.deepEqual(run(), []);
});
