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

const row = (component, extra = {}) => ({ component, enter: 'spatial.fast', exit: 'spatial.exit', change: 'appearance.fast', ...extra });

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
  const f = run({ repoRoot: root, index: INDEX, registry: [row('Popup', { enter: 'spatial.huge' })] });
  assert.match(f[0].message, /spatial\.huge/);
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
