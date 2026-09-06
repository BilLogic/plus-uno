/**
 * Tests for `npm run snapshot:figma-variables`.
 *
 * The half that matters is `--write`: a refresh that stops at "here is the
 * probe" leaves 361 names to be typed into JSON by hand, which is how a
 * refreshed file acquires a stale `capturedAt` and how hand-authored prose gets
 * lost. So the cases are about what survives a write and what does not.
 *
 * Fixtures are written into a temp directory. An earlier test in this repo put
 * them in the live tree and raced the other sweeps.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { PROBE, count, parseArgs, refreshed } from './snapshot-figma-variables.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const previous = () => ({
  note: 'the file-level prose',
  figmaFileKey: 'zAecJNRdvJzAUOcjV32tRX',
  figmaFileName: 'Design System - BS4 Foundation (Component LIbrary)',
  capturedAt: '2026-08-29',
  totalVariables: 2,
  byType: { COLOR: 2 },
  collections: {
    'colors / accent': { note: 'why this one is shaped so', modes: ['New'], variables: ['b', 'a'] },
    'gone / soon': { modes: ['Mode 1'], variables: ['z'] },
  },
});

const probe = () => ({
  totalVariables: 3,
  byType: { COLOR: 3 },
  collections: { 'colors / accent': { modes: ['New'], variables: ['c', 'a', 'b'] } },
});

test('the probe sorts, because an unsorted capture diffs as a reordering', () => {
  assert.match(PROBE, /\.sort\(\)/);
});

test('names are stored sorted and counted from the lists themselves', () => {
  const { snapshot } = refreshed(previous(), probe(), '2026-09-06');
  assert.deepEqual(snapshot.collections['colors / accent'].variables, ['a', 'b', 'c']);
  assert.equal(snapshot.totalVariables, 3);
  assert.equal(count(snapshot), 3);
});

test('hand-authored prose is carried across — the probe has no opinion about it', () => {
  const { snapshot } = refreshed(previous(), probe(), '2026-09-06');
  assert.equal(snapshot.note, 'the file-level prose');
  assert.equal(snapshot.figmaFileKey, 'zAecJNRdvJzAUOcjV32tRX');
  assert.equal(snapshot.collections['colors / accent'].note, 'why this one is shaped so');
});

test('the capture date is this run, not the one being replaced', () => {
  const { snapshot } = refreshed(previous(), probe(), '2026-09-06');
  assert.equal(snapshot.capturedAt, '2026-09-06');
});

test('a collection that vanished is named rather than silently dropped', () => {
  const { snapshot, droppedCollections } = refreshed(previous(), probe(), '2026-09-06');
  assert.deepEqual(droppedCollections, ['gone / soon']);
  assert.ok(!('gone / soon' in snapshot.collections));
});

test('a probe result with no collections is refused, not written', () => {
  assert.throws(() => refreshed(previous(), { totalVariables: 0 }, '2026-09-06'), /no `collections`/);
});

test('the write is idempotent — same probe, same date, same bytes', () => {
  const first = refreshed(previous(), probe(), '2026-09-06').snapshot;
  const second = refreshed(first, probe(), '2026-09-06').snapshot;
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('parseArgs reads --write and --date', () => {
  assert.deepEqual(parseArgs(['--write', 'p.json']), { write: 'p.json', date: null });
  assert.deepEqual(parseArgs(['--write', 'p.json', '--date', '2026-01-02']), {
    write: 'p.json',
    date: '2026-01-02',
  });
  assert.deepEqual(parseArgs([]), { write: null, date: null });
});

test('end to end: the printed probe names the file key it is to be pasted against', () => {
  const out = execFileSync('node', [path.join(REPO_ROOT, 'scripts/snapshot-figma-variables.mjs')], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  assert.match(out, /zAecJNRdvJzAUOcjV32tRX/);
  assert.match(out, /getLocalVariableCollectionsAsync/);
  assert.match(out, /--write/);
});

test('end to end: --write refuses a date that is not a date, and leaves the file alone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-vars-'));
  const probePath = path.join(dir, 'probe.json');
  fs.writeFileSync(probePath, JSON.stringify(probe()));
  const live = path.join(REPO_ROOT, 'scripts/figma-variables-snapshot.json');
  const before = fs.readFileSync(live, 'utf8');

  assert.throws(
    () =>
      execFileSync(
        'node',
        [
          path.join(REPO_ROOT, 'scripts/snapshot-figma-variables.mjs'),
          '--write',
          probePath,
          '--date',
          'yesterday',
        ],
        { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' },
      ),
    /Command failed/,
  );
  assert.equal(fs.readFileSync(live, 'utf8'), before, 'a rejected run writes nothing');
  fs.rmSync(dir, { recursive: true, force: true });
});
