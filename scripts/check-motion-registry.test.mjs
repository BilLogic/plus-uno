// check:motion-registry, mutation-tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, interactiveComponents, motionSectionPages, patternPages, run, validTokens } from './check-motion-registry.mjs';

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
    enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', sound: { token: 'prompt', at: 'land' } },
    exit: { transition: 'Open and close an overlay', spatial: 'spatial.exit' },
    change: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'cross-fade' },
  },
  ...extra,
});
const withEvent = (name, event, tier = 'component') => ({ name, tier, events: { enter: { transition: 'Open and close an overlay', ...event } } });

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
  const f = run({ repoRoot: root, index: INDEX, registry: [{ name: 'Popup', tier: 'component', events: { success: { transition: 'Update a value or state', appearance: 'appearance.nope' } } }] });
  assert.match(f[0].message, /appearance\.nope/);
  assert.match(f[0].message, /success/);
});

test('an event naming a transition outside the 14 locked transitions fails with row, tier, event and bad value', () => {
  const root = scratch(['Button']);
  const bad = [
    { name: 'Popup', tier: 'component', events: { enter: { transition: 'Open', spatial: 'spatial.fast' } } },
    { name: 'Card', tier: 'template', events: { milestone: { transition: 'Opening a page', spatial: 'spatial.default' } } },
    { name: 'Filtering', tier: 'pattern', events: { change: { appearance: 'appearance.fast' } } },
  ];
  const f = run({ repoRoot: root, index: INDEX, registry: bad, patterns: ['Filtering'], motionSections: new Set(['Filtering']) });
  assert.equal(f.length, 3, JSON.stringify(f));
  assert.match(f[0].message, /Popup/);
  assert.match(f[0].message, /component/);
  assert.match(f[0].message, /enter/);
  assert.match(f[0].message, /Open/);
  assert.match(f[1].message, /Card/);
  assert.match(f[1].message, /template/);
  assert.match(f[1].message, /milestone/);
  assert.match(f[1].message, /Opening a page/);
  assert.match(f[2].message, /Filtering/);
  assert.match(f[2].message, /pattern/);
  assert.match(f[2].message, /change/);
});

test('a component row with a sound field passes; sound is ignored', () => {
  const root = scratch(['Button']);
  const r = withEvent('Popup', { transition: 'Open and close an overlay', spatial: 'spatial.fast', sound: { token: 'not-checked-here' } });
  assert.deepEqual(run({ repoRoot: root, index: INDEX, registry: [r] }), []);
});

test('a pattern row passes without being in the component index', () => {
  const root = scratch(['Button', 'Popup']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Wizard', { spatial: 'spatial.fast' }, 'pattern'), withEvent('Home', { appearance: 'linear' }, 'template')], motionSections: new Set(['Wizard']) });
  assert.ok(!f.some((x) => /Wizard|Home/.test(x.message)), JSON.stringify(f));
});

test('an unknown tier fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Popup', { spatial: 'spatial.fast' }, 'molecule')] });
  assert.match(f[0].message, /molecule/);
});

test('an event with neither spatial nor appearance fails', () => {
  const root = scratch(['Button']);
  const f = run({ repoRoot: root, index: INDEX, registry: [withEvent('Popup', { note: 'x' })] });
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

const patternRow = (name) => ({ name, tier: 'pattern', events: { change: { transition: 'Swap content in place', appearance: 'appearance.fast' } } });

test('a Patterns page with no pattern row fails', () => {
  const root = scratch(['Button', 'Popup']);
  const f = run({ repoRoot: root, index: INDEX, registry: [], patterns: ['Filtering'] });
  assert.ok(f.some((x) => /Patterns page "Filtering" has no tier: 'pattern' row/.test(x.message)));
});

test('a Patterns page with a pattern row passes', () => {
  const root = scratch(['Button', 'Popup']);
  assert.deepEqual(run({ repoRoot: root, index: INDEX, registry: [patternRow('Filtering')], patterns: ['Filtering'], motionSections: new Set(['Filtering']) }), []);
});

test('a pattern row whose page renders no MotionSection fails', () => {
  const root = scratch(['Button', 'Popup']);
  const f = run({ repoRoot: root, index: INDEX, registry: [patternRow('Filtering')], patterns: ['Filtering'], motionSections: new Set() });
  assert.ok(f.some((x) => /Patterns page "Filtering" has motion registry rows but no <MotionSection/.test(x.message)));
});

test('motionSectionPages reads each pattern MotionSection by component name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-sections-'));
  const dir = path.join(root, 'design-system/src/storybook-docs/patterns/CommonActions');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CommonActions.mdx'), '<Meta title="Patterns/Common actions" />\n<MotionSection component="Common actions" tier="pattern" />');
  assert.deepEqual([...motionSectionPages(root)], ['Common actions']);
});

test('a MotionSection on another page does not count for the page it names', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-sections-'));
  const dir = path.join(root, 'design-system/src/storybook-docs/patterns/Errors');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'Errors.mdx'), '<Meta title="Patterns/States/Errors" />\n<MotionSection component="Errors" tier="pattern" />\n<MotionSection component="Empty" tier="pattern" />');
  assert.deepEqual([...motionSectionPages(root)], ['Errors']);
});

test('a template row of the same name does not satisfy a Patterns page', () => {
  const root = scratch(['Button', 'Popup']);
  const f = run({ repoRoot: root, index: INDEX, registry: [{ ...patternRow('Filtering'), tier: 'template' }], patterns: ['Filtering'] });
  assert.match(f[0].message, /Filtering/);
});

test('patternPages reads titles under Patterns/ and skips the Overview', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pattern-pages-'));
  const dir = path.join(root, 'design-system/src/storybook-docs/patterns');
  fs.mkdirSync(path.join(dir, 'Filtering'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Overview.mdx'), '<Meta title="Patterns/Overview" />');
  fs.writeFileSync(path.join(dir, 'Filtering/Filtering.mdx'), '<Meta title="Patterns/Filtering" />');
  fs.writeFileSync(path.join(dir, 'Filtering/Filtering.stories.jsx'), "export default { title: 'Patterns/Filtering/Examples' };");
  assert.deepEqual(patternPages(root), ['Filtering']);
});

test('the live tree holds its own record', () => {
  assert.deepEqual(run(), []);
});

/** Findings are the same on a plain tree, a tracked one, and a tracked one beside a second copy of itself under `.claude/worktrees`. */
function sameAcrossCopies(root, read) {
  const key = (found) => JSON.stringify(found, null, 1).split('\n').sort().join('\n');
  const plain = key(read());
  execFileSync('git', ['-C', root, 'init', '-q']);
  execFileSync('git', ['-C', root, 'add', '-A']);
  assert.equal(key(read()), plain, 'tracked');
  fs.cpSync(path.join(root, 'design-system'), path.join(root, '.claude/worktrees/other/design-system'), { recursive: true });
  assert.equal(key(read()), plain, 'beside a worktree copy');
  return plain;
}

test('patternPages reads the same tracked, untracked-copy and plain', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pattern-pages-copy-'));
  const dir = path.join(root, 'design-system/src/storybook-docs/patterns/Filtering');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'Filtering.mdx'), '<Meta title="Patterns/Filtering" />');
  assert.match(sameAcrossCopies(root, () => patternPages(root)), /Filtering/);
});
