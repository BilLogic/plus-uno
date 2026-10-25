// Every expected number here was printed by the reference Python generator
// (ok.py, gen.py), so a drift in the port shows up as a changed digit.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  contrast,
  hexToOklch,
  lForContrast,
  luminance,
  maxChroma,
  oklchToHex,
  pyRound,
} from './oklch.mjs';
import { ramp } from './ramps.mjs';

const close = (actual, expected, eps = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} is not ${expected}`);

test('pyRound rounds half to even, like Python round()', () => {
  assert.equal(pyRound(0.5), 0);
  assert.equal(pyRound(1.5), 2);
  assert.equal(pyRound(76.5), 76);
  assert.equal(pyRound(127.5), 128);
  assert.equal(pyRound(25.500000000000004), 26);
  assert.equal(pyRound(0.0625, 3), 0.062);
  assert.equal(pyRound(3.21942520158176, 2), 3.22);
  assert.equal(pyRound(-1.5), -2);
});

test('hex to OKLCH matches the reference', () => {
  const [L, C, H] = hexToOklch('#e16c62');
  close(L, 0.66829138972565);
  close(C, 0.14793017764099528);
  close(H, 26.74387648364827, 1e-10);
});

test('WCAG luminance and contrast match the reference', () => {
  close(luminance('#1d1b16'), 0.011030041191665504);
  close(contrast('#e16c62', '#ffffff'), 3.21942520158176);
  assert.equal(contrast('#ffffff', '#000000'), 21);
});

test('gamut mapping reduces chroma at constant L and H', () => {
  close(maxChroma(0.6, 205), 0.10245925877352421);
  assert.equal(oklchToHex(0.6, 0.3, 205), '#00919d');
  assert.equal(oklchToHex(0.5, 0.05, 25), '#7e5855');
});

test('the contrast solver finds the lightness that hits a target', () => {
  close(lForContrast(4.5, '#ffffff', 205, 0.1), 0.5581070699536212);
});

test('a ramp step keeps its contrast promise against white', () => {
  const lagoon = ramp(205, 0.95, 0.15);
  assert.deepEqual(lagoon[100], { L: 0.955, C: 0.021, H: 205, hex: '#e1f4f7', cr_white: 1.14 });
  assert.deepEqual(lagoon[700], { L: 0.533, C: 0.087, H: 205, hex: '#147b84', cr_white: 5 });
  assert.deepEqual(lagoon[1100], { L: 0.233, C: 0.038, H: 205, hex: '#022326', cr_white: 16.52 });
});
