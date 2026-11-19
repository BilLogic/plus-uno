/**
 * The CDN split record, read through the ratchet: a recorded split holds, a new
 * version of a recorded library fails, and a split that closed is reported.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { BASELINE, splitVerdict } from './check-deps.mjs';
import { openRatchet } from './lib/ratchet.mjs';

/** Open the record over a scratch tree whose `main` set holds `entries` (key → reason). */
function recorded(entries) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cdn-splits-'));
  try {
    fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
    const body = Object.fromEntries(Object.entries(entries).map(([key, reason]) => [key, { count: 1, reason }]));
    fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'x', sets: { main: { reasons: 'required', entries: body } } }));
    return openRatchet({ file: BASELINE, repoRoot: root });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const split = (lib, ...versions) => ({ lib, versions, where: {} });

test('a split nobody recorded is a new conflict, whole', () => {
  const { newConflicts, baselined } = splitVerdict([split('fa', '6.4.0', '7.2.0')], [], recorded({}));
  assert.equal(newConflicts.length, 1);
  assert.equal(newConflicts[0].extra, undefined);
  assert.equal(baselined, 0);
});

test('a recorded split holds, and a third version of that library is new', () => {
  const ratchet = recorded({ 'fa@6.4.0': 'why', 'fa@7.2.0': 'why' });
  assert.deepEqual(splitVerdict([split('fa', '6.4.0', '7.2.0')], [], ratchet).newConflicts, []);
  const { newConflicts, baselined } = splitVerdict([split('fa', '6.4.0', '6.5.1', '7.2.0')], [], ratchet);
  assert.deepEqual(newConflicts.map((c) => c.extra), [['6.5.1']]);
  assert.equal(baselined, 1);
});

test('a recorded split that closed is reported, and one that cannot be looked at is not', () => {
  const ratchet = recorded({ 'fa@6.4.0': 'why', 'fa@7.2.0': 'why' });
  const closed = splitVerdict([split('fa', '7.2.0')], [], ratchet);
  assert.equal(closed.staleBaseline.length, 1);
  assert.match(closed.staleBaseline[0], /fa \(recorded 6\.4\.0, 7\.2\.0; still present: 7\.2\.0\)/);
  assert.deepEqual(splitVerdict([], ['fa'], ratchet).staleBaseline, [], 'not installed here: not a closed split');
});
