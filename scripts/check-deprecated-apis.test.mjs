import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, ceilingMajor, TRIPWIRES } from './check-deprecated-apis.mjs';

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

test('every armed tripwire still points at a file that exists and uses the API', () => {
  // Generalised from a hard-coded read of `register.jsx`, which is exactly what
  // this test was for: ADR-025 deleted that file when it retired `types.TAB`,
  // and this went red rather than letting a tripwire outlive its code. Driven off
  // TRIPWIRES now, so the next one is covered without an edit here.
  for (const t of TRIPWIRES) {
    const file = path.join(REPO_ROOT, t.uses);
    assert.ok(fs.existsSync(file), `${t.uses} is gone — retire the tripwire with it`);
  }
});

test('an empty tripwire list is a state this file knows about, not an accident', () => {
  // TRIPWIRES is legitimately empty right now. That makes `check:deprecated-apis`
  // pass unconditionally, which is only safe because `main()` says so out loud;
  // this pins that wording so the vacuous pass can never quietly start reading
  // like a verified one.
  assert.ok(Array.isArray(TRIPWIRES));
  const src = fs.readFileSync(path.join(REPO_ROOT, 'scripts/check-deprecated-apis.mjs'), 'utf8');
  assert.match(src, /0 tripwires armed — this check is currently measuring NOTHING/);
});

test('the real package.json is pinned below every watched removal', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.deepEqual(check(pkg), [], 'a watched dependency crossed its removal major');
});
