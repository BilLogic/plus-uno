/**
 * The ratchet's tests: one conformance case over every live record, then the
 * invariant driven through the interface over scratch records.
 *
 * The live case reads `scripts/baselines/` itself rather than a list, so a new
 * record is held to the envelope the moment it lands. Every other case writes
 * a record into a scratch tree, so nothing in the repo is touched.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { REPO_ROOT } from './corpus.mjs';
import { MAIN, UNREVIEWED, isUnreviewed, openRatchet } from './ratchet.mjs';

const BASELINES = 'scripts/baselines';
const FILE = `${BASELINES}/fixture.json`;

/** Run `body` over a scratch tree holding `record` (or none) at `FILE`. */
function scratch(record, body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  try {
    const absolute = path.join(root, FILE);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    if (record !== null) {
      fs.writeFileSync(absolute, typeof record === 'string' ? record : `${JSON.stringify(record, null, 2)}\n`);
    }
    return body(root, absolute);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const read = (absolute) => JSON.parse(fs.readFileSync(absolute, 'utf8'));
const open = (root, set) => openRatchet({ file: FILE, set, repoRoot: root });

/** A record in the envelope, with one set. */
const record = (entries, extra = {}) => ({
  why: 'A fixture.',
  measuredOn: '2026-11-07',
  sets: { [MAIN]: { ...extra, entries } },
});

/* ─── every live record ───────────────────────────────────────────────────── */

test('every live record is in the envelope, reads as itself, and a no-movement --update changes no byte', () => {
  const files = fs.readdirSync(path.join(REPO_ROOT, BASELINES)).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 22, `${files.length} records found`);
  for (const name of files) {
    const file = `${BASELINES}/${name}`;
    const text = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    const live = JSON.parse(text);
    assert.equal(text, `${JSON.stringify(live, null, 2)}\n`, `${file} is encoded the way update writes it`);
    assert.equal(typeof live.why, 'string', `${file} says why`);
    assert.ok(live.why.trim(), `${file} says why`);
    const sets = Object.keys(live.sets ?? {});
    assert.ok(sets.length, `${file} records at least one set`);

    scratch(text, (root, absolute) => {
      for (const set of sets) {
        const opened = openRatchet({ file: FILE, set, repoRoot: root });
        const found = Object.fromEntries([...opened.entries].map(([key, e]) => [key, e.count]));
        assert.equal(opened.entries.size, Object.keys(live.sets[set].entries).length, `${file} § ${set}`);
        assert.deepEqual(opened.failures(found), [], `${file} § ${set} does not fail against itself`);
        assert.deepEqual(opened.stale(found), [], `${file} § ${set} has nothing stale against itself`);
        assert.deepEqual(opened.unreviewed(), [], `${file} § ${set} has a reason wherever one is required`);
        opened.update(found);
        assert.equal(fs.readFileSync(absolute, 'utf8'), text, `${file} § ${set}: no-movement update is a no-op`);
      }
    });
  }
});

/* ─── the invariant ───────────────────────────────────────────────────────── */

test('a NEW finding fails, and an absent key is stale rather than a failure', () => {
  scratch(record({ a: { count: 2 }, b: { count: 1 } }), (root) => {
    const ratchet = open(root);
    assert.deepEqual(ratchet.failures({ a: 2, b: 1, c: 1 }), [{ kind: 'new', key: 'c', count: 1 }]);
    assert.deepEqual(ratchet.failures({ a: 2 }), []);
    assert.deepEqual(ratchet.stale({ a: 2 }), [{ key: 'b', recorded: 1, reason: undefined }]);
  });
});

test('the run may hand in keys, numbers, or objects carrying a count', () => {
  scratch(record({ a: { count: 1 }, b: { count: 3 } }), (root) => {
    const ratchet = open(root);
    assert.deepEqual(ratchet.failures(['a', 'b']), []);
    assert.deepEqual(ratchet.failures({ a: { count: 1, ratio: 1.5 }, b: { count: 4 } }), [
      { kind: 'rose', key: 'b', count: 4, recorded: 3 },
    ]);
  });
});

test('direction: shrink-only fails a rise, grow-only a fall, both either', () => {
  const cases = [
    [undefined, ['rose'], []],
    ['grow-only', [], ['fell']],
    ['both', ['rose'], ['fell']],
  ];
  for (const [direction, up, down] of cases) {
    scratch(record({ n: { count: 5 } }, direction ? { direction } : {}), (root) => {
      const ratchet = open(root);
      assert.deepEqual(ratchet.failures({ n: 6 }).map((f) => f.kind), up, `${direction} up`);
      assert.deepEqual(ratchet.failures({ n: 4 }).map((f) => f.kind), down, `${direction} down`);
    });
  }
});

test('a placeholder reason is unreviewed where reasons are required, and nowhere else', () => {
  const entries = { a: { count: 1, reason: 'TBD' }, b: { count: 1, reason: 'WCAG 1.4.11 exempts an inactive control.' } };
  scratch(record(entries, { reasons: 'required' }), (root) => {
    assert.deepEqual(open(root).unreviewed(), [{ key: 'a', reason: 'TBD' }]);
  });
  scratch(record(entries), (root) => assert.deepEqual(open(root).unreviewed(), []));
});

/* ─── the record that will not read ───────────────────────────────────────── */

test('an absent record is one failure and nothing else', () => {
  scratch(null, (root) => {
    const ratchet = open(root);
    assert.equal(ratchet.absent, true);
    const failures = ratchet.failures({ a: 1, b: 2 });
    assert.equal(failures.length, 1);
    assert.equal(failures[0].kind, 'absent');
    assert.match(failures[0].message, /no baseline is recorded at/);
    assert.deepEqual(ratchet.stale({ a: 1 }), []);
    assert.deepEqual(ratchet.unreviewed(), []);
    assert.equal(ratchet.envelope(), undefined);
  });
});

test('an unreadable record is an error, never an empty set', () => {
  const broken = [
    '{ "sets": ',
    { why: 'x' },
    { why: 'x', sets: { other: { entries: {} } } },
    { why: 'x', sets: { main: { entries: [] } } },
    { why: 'x', sets: { main: { entries: { a: 3 } } } },
    { why: 'x', sets: { main: { entries: { a: { count: 'three' } } } } },
    { why: 'x', sets: { main: { direction: 'sideways', entries: {} } } },
  ];
  for (const record of broken) {
    scratch(record, (root) => assert.throws(() => open(root), /cannot be read as a baseline record/));
  }
});

/* ─── --update is a merge ─────────────────────────────────────────────────── */

test('--update replaces only its own set, carries reasons, and stamps a new entry where one is required', () => {
  const start = {
    why: 'A fixture.',
    measuredOn: '2026-11-07',
    sets: {
      main: { reasons: 'required', entries: { kept: { count: 2, reason: 'Argued in the PR that kept it.' }, gone: { count: 1, reason: 'Fixed since.' } } },
      other: { entries: { x: { count: 9 } } },
    },
  };
  scratch(start, (root, absolute) => {
    open(root).update({ kept: 1, fresh: 1 });
    const after = read(absolute);
    assert.equal(after.why, start.why);
    assert.equal(after.measuredOn, start.measuredOn);
    assert.deepEqual(after.sets.other, start.sets.other, 'the sibling set survives');
    assert.deepEqual(after.sets.main.entries, {
      kept: { count: 1, reason: 'Argued in the PR that kept it.' },
      fresh: { count: 1, reason: UNREVIEWED },
    });
    assert.equal(after.sets.main.reasons, 'required', 'the set keeps its own rule');
  });
});

test('two sets written one after the other are two merges', () => {
  scratch(null, (root, absolute) => {
    const corpus = open(root, 'corpus');
    const counts = open(root, 'counts');
    corpus.update({ docs: 3 }, { seed: { why: 'Seeded.', 'sets.corpus.direction': 'grow-only' } });
    counts.update({ 'AGENTS.md': 2 }, { seed: { why: 'Something else entirely.' } });
    const written = read(absolute);
    assert.equal(written.why, 'Seeded.', 'a seed never restates what the record holds');
    assert.deepEqual(written.sets.corpus, { direction: 'grow-only', entries: { docs: { count: 3 } } });
    assert.deepEqual(written.sets.counts, { entries: { 'AGENTS.md': { count: 2 } } });
    assert.equal(open(root, 'corpus').failures({ docs: 2 })[0].kind, 'fell', 'the seeded direction holds');
  });
});

test('the envelope is read at any depth and is a clone', () => {
  scratch({ ...record({}), scopes: { bundled: { measuredOn: 'the body' } } }, (root) => {
    const ratchet = open(root);
    assert.equal(ratchet.envelope('scopes.bundled.measuredOn'), 'the body');
    assert.equal(ratchet.envelope('scopes.nope.measuredOn'), undefined);
    assert.equal(ratchet.why, 'A fixture.');
    ratchet.envelope().scopes.bundled.measuredOn = 'edited';
    ratchet.envelope('scopes').bundled.measuredOn = 'edited';
    assert.equal(ratchet.envelope('scopes.bundled.measuredOn'), 'the body');
  });
});

/* ─── what counts as no reason at all ─────────────────────────────────────── */

test('a reason that says nothing is unreviewed, whatever it was typed as', () => {
  for (const nothing of ['', '   ', 'TODO', 'tbd', 'n/a', '?', '—', UNREVIEWED, undefined, 42]) {
    assert.equal(isUnreviewed(nothing), true, `${JSON.stringify(nothing)} says nothing`);
  }
  assert.equal(isUnreviewed('WCAG 1.4.11 exempts an inactive component.'), false);
});
