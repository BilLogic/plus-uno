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

test('chart color vision: series 5 and 6 a protan reads as one fail, in dark too', () => {
  const sem = fresh();
  const five = sem.rows.find((r) => r.name === 'color.chart.categorical.5').dark;
  assert.ok(failing(set(sem, 'color.chart.categorical.6', 'dark', five)).includes('chart color vision'));
});

test('chart color vision: neighboring SMART subjects that read as one fail', () => {
  const sem = fresh();
  const s = sem.rows.find((r) => r.name === 'color.chart.smart.social-emotional').light;
  assert.ok(failing(set(sem, 'color.chart.smart.mastering-content', 'light', s)).includes('chart color vision'));
});

test('chart color vision: neighbors too alike for full color vision fail', () => {
  const sem = fresh();
  // the same hue one step on: far enough apart under simulation, too close for anyone
  const one = sem.rows.find((r) => r.name === 'color.chart.categorical.1.hovered').light;
  assert.ok(failing(set(sem, 'color.chart.categorical.2', 'light', one)).includes('chart color vision'));
});

test('chart contrast: a series under 3:1 on a surface fails', () => {
  assert.ok(failing(set(fresh(), 'color.chart.categorical.3', 'dark', '#2a2a2a')).includes('chart contrast'));
  assert.ok(failing(set(fresh(), 'color.chart.success', 'light_ic', '#9fd0a0')).includes('chart contrast'));
});

test('chart ramps: a sequential step that does not move away from the surface fails', () => {
  const sem = fresh();
  const bold = sem.rows.find((r) => r.name === 'color.chart.teal.bold').dark;
  assert.ok(failing(set(sem, 'color.chart.teal.bolder', 'dark', bold)).includes('chart ramps'));
});

test('chart ramps: a diverging midpoint further from the surface than an arm fails', () => {
  assert.ok(failing(set(fresh(), 'color.background.accent.gray.subtler', 'light', '#333333')).includes('chart ramps'));
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
