// Every check passes on the real plans and fails on the mutation it exists to catch.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlan } from './build.mjs';
import { colorChecks, composite, planParity } from './checks.mjs';

const fresh = (key = 'A') => structuredClone(buildPlan(key).semantics);
const set = (sem, name, mode, value) => {
  const r = sem.rows.find((row) => row.name === name);
  r[mode] = value;
  return sem;
};
const failing = (sem) => Object.entries(colorChecks(sem)).filter(([, f]) => f.length).map(([name]) => name);

test('both plans pass every check', () => {
  for (const key of ['A', 'B']) assert.deepEqual(failing(fresh(key)), [], `Plan ${key}`);
});

test('compositing an alpha over its ground rounds half to even', () => {
  assert.equal(composite('#00000080', '#ffffff'), '#7f7f7f');
  assert.equal(composite('#123456', '#ffffff'), '#123456');
});

test('contrast pairs: pale body text fails', () => {
  assert.ok(failing(set(fresh(), 'color.text', 'light', '#bbbbbb')).includes('contrast pairs'));
});

test('accent pairings: tag text on its own fill fails', () => {
  const sem = fresh();
  const fill = sem.rows.find((r) => r.name === 'color.background.accent.lime.subtler').light;
  assert.ok(failing(set(sem, 'color.text.accent.lime', 'light', fill)).includes('accent pairings'));
});

test('row-state grounds: a near-black selection swallows meta text', () => {
  assert.ok(failing(set(fresh(), 'color.background.selected', 'light', '#1d1b16cc')).includes('row-state grounds'));
});

test('collapsed states: pressed equal to hovered fails', () => {
  const sem = fresh();
  const hovered = sem.rows.find((r) => r.name === 'color.background.neutral.hovered').dark;
  assert.ok(failing(set(sem, 'color.background.neutral.pressed', 'dark', hovered)).includes('collapsed states'));
});

test('tint vs frame: a danger tint equal to the page fails', () => {
  const sem = fresh();
  const page = sem.rows.find((r) => r.name === 'elevation.surface').light;
  assert.ok(failing(set(sem, 'color.background.danger', 'light', page)).includes('tint vs frame'));
});

test('chart color vision: two series a protan reads as one fail', () => {
  const sem = fresh();
  const one = sem.rows.find((r) => r.name === 'color.chart.categorical.1').light;
  assert.ok(failing(set(sem, 'color.chart.categorical.2', 'light', one)).includes('chart color vision'));
});

test('teal vs Lagoon: an accent teal on the brand ramp fails', () => {
  const sem = fresh();
  sem.palette.teal = structuredClone(sem.palette.lagoon);
  assert.ok(failing(sem).includes('teal vs Lagoon'));
});

test('plan parity: identical mappings pass, one changed reference fails', () => {
  assert.deepEqual(planParity({ A: fresh('A'), B: fresh('B') }), []);
  const b = set(fresh('B'), 'color.link', 'light_ref', 'lagoon.700');
  assert.deepEqual(planParity({ A: fresh('A'), B: b }), ['color.link, light: Plan A lagoon.800, Plan B lagoon.700']);
  const c = fresh('B');
  c.rows.pop();
  assert.equal(planParity({ A: fresh('A'), B: c }).length, 1);
});
