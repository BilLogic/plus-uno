import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isPrimitive, measure } from './check-no-primitive-reads.mjs';

test('numbered space, radius, size and stroke steps are primitives', () => {
  for (const name of ['--space-050', '--radius-025', '--size-200', '--stroke-2']) assert.ok(isPrimitive(name), name);
});

test('tier tokens and --radius-full are not primitives', () => {
  for (const name of ['--pad-x-md', '--checkbox-control-size', '--radius-full', '--radius-h32', '--space-pad']) {
    assert.ok(!isPrimitive(name), name);
  }
});

test('counts primitive reads per file, with the first line', () => {
  const found = measure([
    { path: 'a.scss', text: '.a { color: red; }\n.b { gap: var(--space-050); padding: var(--space-025) var(--pad-x-md); }' },
  ]);
  assert.deepEqual(found.get('a.scss'), { count: 2, line: 2 });
});

test('a fallback after the primitive still counts as a read', () => {
  assert.equal(measure([{ path: 'a.scss', text: 'gap: var(--space-050, 8px);' }]).get('a.scss').count, 1);
});

test('a clean file, a story and a test are absent', () => {
  const found = measure([
    { path: 'clean.scss', text: '.x { gap: var(--stack-md); }' },
    { path: 'A.stories.jsx', text: 'var(--space-050)' },
    { path: 'A.test.jsx', text: 'var(--space-050)' },
  ]);
  assert.equal(found.size, 0);
});
