import { test } from 'node:test';
import assert from 'node:assert/strict';

import { measure } from './check-old-size-tokens.mjs';

const NAMES = new Set(['--card-pad-sm', '--size-element-pad-x-md']);

test('counts only tokens in the exact old-name set, not every name under the prefix', () => {
  const sources = [
    {
      path: 'a.scss',
      text: [
        '.a { padding: var(--card-pad-sm); }', // old: counted
        '.b { padding: var(--card-pad-default); }', // new role token, same prefix: not counted
        '.c { padding: var(--size-element-pad-x-md); }', // old: counted
      ].join('\n'),
    },
  ];
  const found = measure(sources, NAMES);
  assert.deepEqual([...found.keys()], ['a.scss']);
  assert.equal(found.get('a.scss').count, 2);
});

test('a file with no old-name use is absent from the result', () => {
  const sources = [{ path: 'clean.scss', text: '.x { padding: var(--card-pad-default); }' }];
  assert.equal(measure(sources, NAMES).size, 0);
});

test('a .test. file is skipped', () => {
  const sources = [{ path: 'fixture.test.jsx', text: 'var(--card-pad-sm)' }];
  assert.equal(measure(sources, NAMES).size, 0);
});
