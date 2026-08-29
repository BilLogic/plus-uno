/**
 * Tests for the snapshot-staleness guard.
 *
 * #191's rule: a guard nobody has watched fail is a guard nobody knows works.
 * Every case here is one way a snapshot stops describing its subject, and the
 * first is the one #339 measured — a file five weeks behind a library that had
 * moved, with `check:token-registry` green over the difference.
 *
 * Time is injected rather than read, so these do not go red on a calendar day.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ageInDays, ages, failures } from './figma-snapshots.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const KEY = 'zAecJNRdvJzAUOcjV32tRX';
const NOW = new Date('2026-08-29T12:00:00Z');
const OPTS = { now: NOW, fileKey: KEY, maxAgeDays: 180, minVariables: 2, minComponents: 2 };

const sound = () => ({
  variables: {
    figmaFileKey: KEY,
    capturedAt: '2026-08-01',
    totalVariables: 2,
    collections: { a: { modes: ['m'], variables: ['x', 'y'] } },
  },
  components: { lastChecked: '2026-08-01T00:00:00.000Z', components: [{ key: '1' }, { key: '2' }] },
});

test('a sound pair produces nothing', () => {
  assert.deepEqual(failures(sound(), OPTS), []);
});

test('the #339 defect: a snapshot past the ceiling is a finding, and names the remedy', () => {
  const files = sound();
  files.variables.capturedAt = '2025-01-01';
  const found = failures(files, OPTS);
  assert.equal(found.length, 1);
  assert.match(found[0], /captured 2025-01-01, \d+ days ago \(ceiling 180\)/);
  assert.match(found[0], /audit:figma-variables/);
});

test('the component snapshot names the poller, because the poller writes it', () => {
  const files = sound();
  files.components.lastChecked = '2025-01-01T00:00:00.000Z';
  const found = failures(files, OPTS);
  assert.equal(found.length, 1);
  assert.match(found[0], /poll-figma-library\.js/);
});

test('a date in the future is a finding, not a very fresh snapshot', () => {
  const files = sound();
  files.variables.capturedAt = '2027-01-01';
  assert.match(failures(files, OPTS)[0], /in the future/);
});

test('a missing date is a finding — an undated snapshot cannot be stale or fresh', () => {
  const files = sound();
  delete files.variables.capturedAt;
  assert.match(failures(files, OPTS)[0], /no readable `capturedAt`/);
});

test('the declared total is checked against the contents', () => {
  const files = sound();
  files.variables.totalVariables = 99;
  const found = failures(files, OPTS);
  assert.equal(found.length, 1);
  assert.match(found[0], /says 99 variables, contains 2/);
});

test('a snapshot that shrank silently fails, because an empty one agrees with everything', () => {
  const files = sound();
  files.variables.collections = { a: { modes: ['m'], variables: ['x'] } };
  files.variables.totalVariables = 1;
  const found = failures(files, OPTS);
  assert.equal(found.length, 1);
  assert.match(found[0], /1 variables, fewer than the 2/);
});

test('a snapshot of a different Figma file is a finding', () => {
  const files = sound();
  files.variables.figmaFileKey = 'W0qzhXWxFsMwSJzkdV2yal';
  assert.match(failures(files, OPTS)[0], /not this library's/);
});

test('ageInDays reads both stamp shapes, and refuses anything else', () => {
  assert.equal(ageInDays('2026-08-28', NOW), 1);
  assert.equal(ageInDays('2026-08-28T12:00:00.000Z', NOW), 1);
  assert.equal(ageInDays('not a date', NOW), null);
  assert.equal(ageInDays(undefined, NOW), null);
});

test('the clock is reported even on a green run', () => {
  const reported = ages(sound(), NOW);
  assert.deepEqual(reported.map((a) => a.name), ['variables', 'components']);
  assert.equal(reported[0].age, 28);
});

test('the real snapshots are internally consistent', () => {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, p), 'utf8'));
  const variables = read('scripts/figma-variables-snapshot.json');
  const counted = Object.values(variables.collections).reduce((n, c) => n + c.variables.length, 0);
  assert.equal(variables.totalVariables, counted);
  assert.equal(variables.figmaFileKey, KEY);
  for (const collection of Object.values(variables.collections)) {
    assert.deepEqual(
      collection.variables,
      [...collection.variables].sort(),
      'names are stored sorted, so a refresh diffs as a change and not a reordering',
    );
  }
});
