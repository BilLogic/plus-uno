import { test } from 'node:test';
import assert from 'node:assert/strict';

import { retiredRenames } from './plan.mjs';

/** A primitive is a numbered step or a palette color: a caller never reads one. */
const PRIMITIVE = /^--(?:(?:space|radius|size|stroke|height|width|type-size)-\d+|palette-.+)$/;

test('no retired token names a primitive as its replacement', () => {
  const offenders = [...retiredRenames()].filter(([, target]) => PRIMITIVE.test(target));
  assert.deepEqual(offenders, []);
});

test('a primitive target would be caught', () => {
  for (const name of ['--space-025', '--stroke-2', '--size-200', '--palette-neutral-500']) assert.match(name, PRIMITIVE);
  for (const name of ['--stack-sm', '--radius-full', '--border-width-default']) assert.doesNotMatch(name, PRIMITIVE);
});
