// Semantic resolution at the seams: Atlassian's references land on the named
// PLUS primitives, and every PLUS decision overrides them where it should.
// Expected values are the reference generator's.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlan } from './build.mjs';
import { buildPalette, loadPlan } from './plans.mjs';
import { buildSemantics } from './semantics.mjs';
import { contrast } from './oklch.mjs';

const refs = (key, name) => {
  const r = buildPlan(key).semantics.rows.find((row) => row.name === name);
  assert.ok(r, `${name} exists`);
  return [r.light_ref, r.dark_ref, r.light_ic_ref, r.dark_ic_ref];
};
const hex = (key, name, mode = 'light') => buildPlan(key).semantics.rows.find((row) => row.name === name)[mode];

test('523 tokens, every value a primitive reference', () => {
  const { rows } = buildPlan('A').semantics;
  assert.equal(rows.length, 523);
  assert.equal(new Set(rows.map((r) => r.name)).size, 523);
  for (const r of rows) {
    for (const m of ['light', 'dark', 'light_ic', 'dark_ic']) {
      assert.match(r[`${m}_ref`], /^(transparent|[a-zA-Z]+\.[0-9]+(a[0-9]+)?)$/, `${r.name} ${m}`);
    }
  }
});

test("Atlassian's neutrals and hues resolve onto PLUS steps", () => {
  assert.deepEqual(refs('A', 'color.text'), ['neutral.1000', 'darkNeutral.1000', 'neutral.1100', 'darkNeutral.1100']);
  assert.deepEqual(refs('A', 'elevation.surface.sunken'), ['neutral.100', 'darkNeutral.0', 'neutral.0', 'darkNeutral.0']);
  assert.deepEqual(refs('A', 'color.background.brand.bold'), ['lagoon.700', 'lagoon.400', 'lagoon.900', 'lagoon.200']);
});

test('PLUS overrides win: links at lagoon.800, the line alpha, a hue at an opacity', () => {
  assert.deepEqual(refs('A', 'color.link'), ['lagoon.800', 'lagoon.300', 'lagoon.1000', 'lagoon.100']);
  assert.deepEqual(refs('A', 'color.border'), ['neutralAlpha.300', 'darkNeutralAlpha.300', 'neutralAlpha.900', 'darkNeutralAlpha.900']);
  assert.deepEqual(refs('A', 'color.blanket.danger'), ['red.500a8', 'red.600a8', 'red.500a8', 'red.600a8']);
  assert.equal(hex('A', 'color.blanket.danger'), '#e16c6214');
  assert.equal(hex('A', 'color.border'), '#1d1b1614');
});

test('checked controls follow brand.bold; tags step one further; SMART aliases its accent', () => {
  assert.deepEqual(refs('A', 'color.background.selected.bold'), refs('A', 'color.background.brand.bold'));
  assert.deepEqual(refs('A', 'color.text.accent.blue'), ['blue.850', 'blue.250', 'blue.1000', 'blue.100']);
  assert.deepEqual(refs('A', 'color.text.smart.relationship'), refs('A', 'color.text.accent.magenta'));
  assert.deepEqual(refs('A', 'color.background.accent.brown.subtler'), ['brown.200', 'brown.900', 'brown.200', 'brown.900']);
  assert.deepEqual(refs('A', 'color.chart.categorical.1'), ['blue.600', 'blue.400', 'blue.850', 'blue.300']);
  assert.deepEqual(refs('A', 'color.background.danger.subtle'), ['red.300', 'red.800', 'red.300', 'red.900']);
});

test('a plan changes hex values, never references', () => {
  assert.deepEqual(refs('A', 'color.text'), refs('B', 'color.text'));
  assert.equal(hex('A', 'color.text'), '#2c2c2b');
  assert.equal(hex('B', 'color.text'), '#1a1a1a');
});

test('the base palette is not mutated by registering hue alphas', () => {
  const palette = buildPalette(loadPlan('A'));
  const { palette: extended } = buildSemantics(palette);
  assert.equal('500a8' in palette.red, false);
  assert.equal(extended.red['500a8'].hex, '#e16c6214');
});

test('SMART subtle: every subject, every mode, its accent subtle; the line work it carries', () => {
  const SMART = { 'mastering-content': 'teal', relationship: 'magenta', 'social-emotional': 'orange', advocacy: 'lime', 'technology-tools': 'brown' };
  for (const key of ['A', 'B']) {
    const byName = Object.fromEntries(buildPlan(key).semantics.rows.map((r) => [r.name, r]));
    for (const [subject, hue] of Object.entries(SMART)) {
      const name = `color.background.smart.${subject}.subtle`;
      const accent = byName[`color.background.accent.${hue}.subtle`];
      assert.ok(byName[name], `${name} exists in Plan ${key}`);
      assert.equal(`${name}.hovered` in byName || `${name}.pressed` in byName, false, `${name} has no states`);
      for (const m of ['light', 'dark', 'light_ic', 'dark_ic']) {
        assert.equal(byName[name][`${m}_ref`], accent[`${m}_ref`], `${name} ${m}`);
        assert.equal(byName[name][m], accent[m], `${name} ${m} hex`);
      }
      // The dark-gray line work (color.icon.subtle) on the body, in Light, sits under 3:1:
      // about 2.6:1 in Plan A and 3.0:1 in Plan B, the same as on the math characters'
      // accent subtle. The floor catches a ramp change that would push it lower.
      const ratio = contrast(byName['color.icon.subtle'].light, byName[name].light);
      assert.ok(ratio >= 2.5, `${name}: icon.subtle at ${ratio.toFixed(2)}:1 in Plan ${key} Light`);
    }
  }
});
