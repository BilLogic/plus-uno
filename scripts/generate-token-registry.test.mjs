import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveCandidates } from './generate-token-registry.mjs';

const COLLECTION = 'colors / accent';

test('a Border Subtle variable maps to its -border-subtle token first', () => {
  assert.equal(deriveCandidates(COLLECTION, 'Success/Success Border Subtle')[0], '--color-success-border-subtle');
});

test('a Border Subtle variable never falls back to the 3:1 -border role', () => {
  // Primary has no -border-subtle token. If a candidate ever named
  // --color-primary-border, the pale label border would silently bind to the
  // 3:1 role instead of being reported as unresolved.
  const candidates = deriveCandidates(COLLECTION, 'Primary/Primary Border Subtle');
  assert.equal(candidates.includes('--color-primary-border'), false, candidates.join(', '));
});

test('the 3:1 Border role still maps to -border', () => {
  assert.equal(deriveCandidates(COLLECTION, 'Success/Success Border')[0], '--color-success-border');
});
