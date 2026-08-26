import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, ceilingMajor } from './check-deprecated-apis.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRIP = [{ dep: 'storybook', removedIn: 11, api: 'tabs', uses: 'x', ticket: '#202', note: '' }];

test('a caret range stays inside its major, so it does not trip', () => {
  assert.equal(ceilingMajor('^10.5.0'), 10);
  assert.deepEqual(check({ devDependencies: { storybook: '^10.5.0' } }, TRIP), []);
});

test('a tilde range stays inside its major too', () => {
  assert.equal(ceilingMajor('~10.5.0'), 10);
  assert.deepEqual(check({ devDependencies: { storybook: '~10.5.0' } }, TRIP), []);
});

test('an exact pin below the removal does not trip', () => {
  assert.deepEqual(check({ devDependencies: { storybook: '10.5.10' } }, TRIP), []);
});

test('bumping the major to the removal trips', () => {
  const due = check({ devDependencies: { storybook: '^11.0.0' } }, TRIP);
  assert.equal(due.length, 1);
  assert.equal(due[0].ticket, '#202');
});

test('a range past the removal trips', () => {
  assert.equal(check({ devDependencies: { storybook: '^12.1.0' } }, TRIP).length, 1);
});

test('an open range trips, because it can resolve anywhere', () => {
  assert.equal(ceilingMajor('>=10'), Infinity);
  assert.equal(check({ devDependencies: { storybook: '>=10' } }, TRIP).length, 1);
  assert.equal(check({ devDependencies: { storybook: '*' } }, TRIP).length, 1);
});

test('it reads dependencies as well as devDependencies', () => {
  assert.equal(check({ dependencies: { storybook: '^11.0.0' } }, TRIP).length, 1);
});

test('a dependency the repo does not have is not a finding', () => {
  assert.deepEqual(check({ devDependencies: {} }, TRIP), []);
});

test("the watched API is still in use — a tripwire for code that left is noise", () => {
  const src = fs.readFileSync(
    path.join(REPO_ROOT, '.storybook/addons/component-tabs/register.jsx'),
    'utf8',
  );
  assert.match(src, /types\.TAB/, 'register.jsx no longer uses types.TAB — retire the tripwire with it');
});

test('the real package.json is pinned below every watched removal', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.deepEqual(check(pkg), [], 'a watched dependency crossed its removal major');
});
