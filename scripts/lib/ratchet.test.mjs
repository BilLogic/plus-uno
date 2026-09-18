/**
 * The ratchet's tests: the conformance suite over every live baseline record,
 * plus the cases that are about the MODULE rather than about a record — the
 * shape table's own refusals, the envelope read, the seed and what counts as a
 * reason.
 *
 * The suite runs 12 records × their declared sets. A record whose shape the
 * module cannot read fails here rather than in CI six weeks later reading as a
 * green ratchet over an empty set, which is the failure #599 was reopened for.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { REPO_ROOT } from './corpus.mjs';
import { UNREVIEWED, isUnreviewed, openRatchet } from './ratchet.mjs';
import { runRatchetConformance } from './ratchet-conformance.mjs';
import { SHAPES, setOf, shapeOf } from './ratchet-shapes.mjs';

runRatchetConformance({ test });

/* ─── the shape table ──────────────────────────────────────────────────────── */

test('the table holds a row for every baseline the registry declares', async () => {
  const { CHECKS, EXCLUDED } = await import('../checks.registry.mjs');
  const declared = [...CHECKS, ...EXCLUDED].map((row) => row.baseline).filter(Boolean);
  const surveyed = new Set(SHAPES.map((shape) => shape.file));
  for (const file of declared) {
    assert.ok(surveyed.has(file), `${file} is declared in the registry and surveyed nowhere`);
  }
  // And nothing in the table describes a record that has stopped existing: a
  // row for a deleted baseline is prose the repo has already falsified.
  for (const shape of SHAPES) {
    assert.ok(
      fs.existsSync(path.join(REPO_ROOT, shape.file)),
      `${shape.file} has a row and no record`,
    );
    assert.ok(declared.includes(shape.file), `${shape.file} has a row and no registry declaration`);
  }
});

test('a record with no row is refused rather than read on a guessed shape', () => {
  assert.throws(() => shapeOf('docs/evals/invented.json'), /has no row in scripts\/lib\/ratchet-shapes.mjs/);
  assert.throws(
    () => openRatchet({ file: 'docs/evals/invented.json' }),
    /has no row in scripts\/lib\/ratchet-shapes.mjs/,
  );
});

test('a record with two sets has to be asked for one by name', () => {
  const twoSets = SHAPES.find((shape) => shape.sets.length > 1);
  assert.throws(() => setOf(twoSets), /name the one to open/);
  assert.throws(() => setOf(twoSets, 'nope'), /has no set named 'nope'/);
});

/* ─── the absent record, written ───────────────────────────────────────────── */

test('an absent record stops being absent once it is written', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-write-'));
  try {
    const file = 'docs/evals/text-contrast-baseline.json';
    const opened = openRatchet({ file, repoRoot: root });
    assert.equal(opened.absent, true);
    const written = opened.update(
      { 'a.scss|--color-warning|--color-surface': { count: 1, ratio: 3.5 } },
      { seed: { measured: 'AA 4.5:1' } },
    );
    assert.equal(written.entries, 1);
    // A brand-new record carries the envelope the check seeded it with, so the
    // one thing `--update` cannot merge into is not left blank.
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')).measured, 'AA 4.5:1');

    const reopened = openRatchet({ file, repoRoot: root });
    assert.equal(reopened.absent, false);
    // A record written from nothing has no reason to carry, so every entry of
    // it is unreviewed — which is a failure on its own, separately from the
    // counts, because `--update` records the finding and a person records why.
    assert.deepEqual(reopened.unreviewed().map((u) => u.reason), [UNREVIEWED]);

    // And a seed never restates an envelope the record already holds: the
    // second write is a merge like any other.
    reopened.update(
      { 'a.scss|--color-warning|--color-surface': { count: 1, ratio: 3.5 } },
      { seed: { measured: 'something else entirely' } },
    );
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')).measured,
      'AA 4.5:1',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/* ─── the record's unowned half ────────────────────────────────────────────── */

test('the envelope is read through the module, at any depth, and is a clone', () => {
  // Three checks GATE on the unowned half — negation on each scope's recorded
  // reading, glossary on the date, the benchmark on Atlassian's own surface —
  // and without a read for it each would open the file a second time, which is
  // the defect the module exists to end.
  const opened = openRatchet({ file: 'docs/evals/negation-baseline.json', set: 'bundled' });
  assert.equal(
    opened.envelope('scopes.bundled.measuredOn'),
    opened.envelope().scopes.bundled.measuredOn,
    'a dotted path and the whole record agree',
  );
  assert.equal(opened.envelope('scopes.nope.measuredOn'), undefined, 'a path that is not there');

  const record = opened.envelope();
  record.scopes.bundled.measuredOn = 'edited';
  assert.notEqual(
    openRatchet({ file: 'docs/evals/negation-baseline.json', set: 'bundled' }).envelope('scopes.bundled.measuredOn'),
    'edited',
    'the envelope is a clone: a reader of it cannot edit the module\u2019s reading',
  );

  const absent = openRatchet({ file: 'docs/evals/glossary-baseline.json', repoRoot: os.tmpdir() });
  assert.equal(absent.envelope(), undefined, 'and there is nothing to read where there is no record');
});

test('a seed is a dotted path, and still never restates what the record holds', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-seed-'));
  try {
    const file = 'docs/evals/negation-baseline.json';
    // The envelope this record wants is three levels in — one corpus sentence
    // and one reading per SCOPE — so a seed that could only reach the top level
    // would leave a record written from nothing failing its own reading
    // comparison on the next run.
    // Both handles are opened BEFORE the first write, which is what a record
    // with six sets forces: opening a set whose container no write has created
    // yet is an UNREADABLE record, and merging from the copy each handle read at
    // open time would have the second write undo the first.
    const corpus = openRatchet({ file, set: 'bundled-corpus', repoRoot: root });
    const counts = openRatchet({ file, set: 'bundled', repoRoot: root });
    corpus.update({ docs: 3 }, { seed: { 'scopes.bundled.measuredOn': 'the bundled body' } });
    counts.update(
      { 'AGENTS.md': 2 },
      { seed: { 'scopes.bundled.measuredOn': 'something else entirely' } },
    );
    const written = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    assert.equal(written.scopes.bundled.measuredOn, 'the bundled body');
    // And the two writes are two merges: neither replaced the other's container.
    assert.equal(written.scopes.bundled.docs, 3);
    assert.deepEqual(written.scopes.bundled.counts, { 'AGENTS.md': 2 });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a seeded key inside an ignored slot survives the container write', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-ignored-'));
  try {
    const file = 'docs/evals/atlassian-benchmark.json';
    // `ours` keeps `note` and `recordedAt` in among its four numbers, declared
    // IGNORED. On a brand-new record they arrive by seed, and a container write
    // that read the ignored keys off the record rather than off the merge target
    // would drop them the moment they were seeded.
    openRatchet({ file, repoRoot: root }).update(
      { 'intent.borderTokens': 7 },
      { seed: { 'ours.note': 'OUR side of the comparison.' } },
    );
    const written = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    assert.deepEqual(written.ours, { note: 'OUR side of the comparison.', 'intent.borderTokens': 7 });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/* ─── what counts as no reason at all ─────────────────────────────────────── */

test('a reason that says nothing is unreviewed, whatever it was typed as', () => {
  for (const nothing of ['', '   ', 'TODO', 'tbd', 'n/a', '?', '—', UNREVIEWED, undefined, 42]) {
    assert.equal(isUnreviewed(nothing), true, `${JSON.stringify(nothing)} says nothing`);
  }
  assert.equal(isUnreviewed('WCAG 1.4.11 exempts an inactive component. #268.'), false);
});

