/**
 * Tests for the lock walk the harness job's scoped parser install pins with.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { lockClosure, readLock, resolveIn } from './lock-closure.mjs';

const entry = (version, dependencies) => ({ version, ...(dependencies ? { dependencies } : {}) });

test('a dependency resolves nested under its parent first, then through each ancestor, then the top level', () => {
  const lock = {
    'node_modules/a': entry('1.0.0', { b: '*' }),
    'node_modules/a/node_modules/b': entry('1.0.0', { c: '*' }),
    // c is not under b; it is one level up, under a. Parent-then-top-level
    // would skip this and take the top-level c.
    'node_modules/a/node_modules/c': entry('2.0.0'),
    'node_modules/c': entry('1.0.0'),
  };
  assert.equal(resolveIn(lock, 'node_modules/a/node_modules/b', 'c'), 'node_modules/a/node_modules/c');
  assert.equal(resolveIn(lock, 'node_modules/a', 'c'), 'node_modules/a/node_modules/c');
  assert.equal(resolveIn(lock, '', 'c'), 'node_modules/c');
  assert.deepEqual(lockClosure(lock, ['a']), new Map([['a', '1.0.0'], ['b', '1.0.0'], ['c', '2.0.0']]));
});

test('a scoped dependency is one name, `@scope/name`, at any depth', () => {
  const lock = {
    'node_modules/a': entry('1.0.0', { '@s/b': '*' }),
    'node_modules/a/node_modules/@s/b': entry('1.2.0', { '@s/c': '*', d: '*' }),
    'node_modules/@s/c': entry('3.0.0'),
    'node_modules/d': entry('4.0.0'),
  };
  assert.equal(resolveIn(lock, 'node_modules/a/node_modules/@s/b', 'd'), 'node_modules/d');
  assert.deepEqual(
    lockClosure(lock, ['a']),
    new Map([['a', '1.0.0'], ['@s/b', '1.2.0'], ['@s/c', '3.0.0'], ['d', '4.0.0']]),
  );
});

test('peer dependencies are pinned too; an optional one the lock lacks is skipped', () => {
  const lock = {
    'node_modules/a': {
      version: '1.0.0',
      peerDependencies: { p: '*', q: '*' },
      peerDependenciesMeta: { q: { optional: true } },
      optionalDependencies: { o: '*' },
    },
    'node_modules/p': entry('5.0.0'),
  };
  assert.deepEqual(lockClosure(lock, ['a']), new Map([['a', '1.0.0'], ['p', '5.0.0']]));
  delete lock['node_modules/p'];
  assert.throws(() => lockClosure(lock, ['a']), /p is not in package-lock.json/);
});

test('a name the lock cannot resolve is an error', () => {
  assert.throws(() => lockClosure({ 'node_modules/a': entry('1.0.0', { b: '*' }) }, ['a']), /b is not in package-lock.json/);
});

test('two versions of one name are refused: the install is flat', () => {
  const lock = {
    'node_modules/a': entry('1.0.0', { c: '*' }),
    'node_modules/a/node_modules/c': entry('2.0.0'),
    'node_modules/b': entry('1.0.0', { c: '*' }),
    'node_modules/c': entry('1.0.0'),
  };
  assert.throws(() => lockClosure(lock, ['a', 'b']), /two versions of c/);
});

test('the parser the contrast checks read with closes over this lock', () => {
  const pins = lockClosure(readLock(), ['postcss', 'postcss-scss', 'postcss-selector-parser']);
  for (const name of ['postcss', 'postcss-scss', 'postcss-selector-parser']) assert.ok(pins.has(name), name);
});
