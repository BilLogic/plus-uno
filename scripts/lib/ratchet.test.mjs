/**
 * Tests for the ratchet — the harness's one reader and writer of a baseline
 * record.
 *
 * THE INVARIANT IS NOT ASSERTED HERE. It is asserted by
 * `scripts/lib/ratchet-conformance.mjs`, which this file runs against the
 * REFERENCE adapter: a record of the module's own default shape, in a scratch
 * directory. `scripts/text-contrast.test.mjs` runs the same suite against the
 * pilot check's ratchet, and the two answering identically is the whole reason
 * the suite is a separate file.
 *
 * What is left here is what belongs to this module alone and to no adapter: the
 * record shapes it accepts, what the envelope does, and the reason predicate.
 *
 * Run: npm run test:scripts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { runRatchetConformance } from './ratchet-conformance.mjs';
import { UNREVIEWED, isUnreviewed, openRatchet } from './ratchet.mjs';

const FILE = 'docs/evals/reference-baseline.json';

/** The reference adapter: the module's own defaults, nothing else. */
runRatchetConformance(
  'reference',
  {
    open: (repoRoot) =>
      openRatchet({
        file: FILE,
        repoRoot,
        command: 'node scripts/reference.mjs --update',
        envelope: { measured: 'the reference record' },
      }),
    keys: ['a.scss|--color-warning|--color-surface', 'b.scss|--color-outline|--color-surface'],
  },
  { test },
);

/** A scratch tree with a record already in it, written by hand rather than by
 *  `update` — which is how every one of the twelve records reached disk. */
function withRecord(record) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  fs.mkdirSync(path.join(root, path.dirname(FILE)), { recursive: true });
  fs.writeFileSync(path.join(root, FILE), `${JSON.stringify(record, null, 2)}\n`);
  return root;
}

const open = (root, spec = {}) =>
  openRatchet({ file: FILE, repoRoot: root, command: 'x --update', ...spec });

// ── the record shapes the twelve have written ────────────────────────────────

test('a keyed set can be an array of keys, each counted once', () => {
  // `colour-fallback-baseline.json`'s shape: the key IS the decision, and a
  // second occurrence of the same pair is the same decision.
  const root = withRecord({ why: 'w', disagreements: ['--color-danger #d32f2f'] });
  const ratchet = open(root, { set: 'disagreements' });
  assert.deepEqual(ratchet.failures({ '--color-danger #d32f2f': 1 }), []);
  assert.deepEqual(ratchet.failures({ '--color-danger #ef4444': 1 }), [
    { kind: 'new', key: '--color-danger #ef4444', count: 1 },
  ]);
});

test('a keyed set can be key to count', () => {
  const root = withRecord({ findings: { '--x': 2 } });
  assert.deepEqual(open(root).failures({ '--x': 3 }), [
    { kind: 'rose', key: '--x', count: 3, recorded: 2 },
  ]);
});

test('a keyed set can be key to a record carrying the reason', () => {
  const root = withRecord({ findings: { '--x': { count: 2, why: 'a real reason' } } });
  const ratchet = open(root);
  assert.deepEqual(ratchet.failures({ '--x': { count: 2 } }), []);
  assert.deepEqual(ratchet.unreviewed(), []);
  assert.equal(ratchet.entries.get('--x').reason, 'a real reason');
});

test('the reason field is named by the caller, not assumed', () => {
  // `intent-role-adoption.json` calls it `why`; a record that called it
  // `note` would otherwise read as having no reason at all.
  const root = withRecord({ findings: { '--x': { count: 1, note: 'because' } } });
  assert.deepEqual(open(root, { reasonKey: 'note' }).unreviewed(), []);
  assert.deepEqual(
    open(root).unreviewed().map((u) => u.key),
    ['--x'],
  );
});

test('an unreadable record is absent, not a crash', () => {
  // The shape a half-finished merge leaves behind. A check that throws here and
  // a check that passes look the same to the person who broke the file.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  fs.mkdirSync(path.join(root, path.dirname(FILE)), { recursive: true });
  fs.writeFileSync(path.join(root, FILE), '{ not json');
  const ratchet = open(root);
  assert.equal(ratchet.absent, true);
  assert.equal(ratchet.failures({ '--x': 1 })[0].kind, 'absent');
});

// ── the envelope ─────────────────────────────────────────────────────────────

test('the envelope prose is readable off the ratchet', () => {
  const root = withRecord({ why: 'the reason this record exists', findings: {} });
  assert.equal(open(root).why, 'the reason this record exists');
});

test('update writes the envelope ahead of the set, in the order given', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  open(root, { envelope: { why: 'w', measured: '2026-09-18' } }).update({ '--x': { count: 1 } });
  const text = fs.readFileSync(path.join(root, FILE), 'utf8');
  assert.deepEqual(Object.keys(JSON.parse(text)), ['why', 'measured', 'findings']);
  assert.ok(text.endsWith('}\n'), 'a trailing newline, so the file is a text file');
});

test('update keeps the payload the check measured beside the reason', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  open(root).update({ '--x': { count: 3, ratio: 4.46 } });
  const entry = JSON.parse(fs.readFileSync(path.join(root, FILE), 'utf8')).findings['--x'];
  assert.deepEqual(entry, { count: 3, ratio: 4.46, why: UNREVIEWED });
});

// ── the reason predicate ─────────────────────────────────────────────────────

test('a reason is unreviewed when it is missing, blank or a placeholder', () => {
  for (const nothing of [undefined, null, 42, '', '  ', UNREVIEWED, 'TODO', 'tbd', 'N/A', '??', '—']) {
    assert.equal(isUnreviewed(nothing), true, `${String(nothing)} is not a reason`);
  }
  assert.equal(isUnreviewed('WCAG 1.4.11 exempts an inactive component.'), false);
});
