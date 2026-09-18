/**
 * The ratchet conformance suite.
 *
 * Written ONLY against the `Ratchet` interface in `scripts/lib/ratchet.mjs`: it
 * opens a ratchet over a record, drives it through the whole invariant, and
 * asserts nothing about the record's own shape. That is the point. The invariant
 * is STATED ONCE — in the module's header — and ASSERTED ONCE, here.
 *
 * This is the shape `agents/uno-bot/tests/helpers/thread-state-conformance.ts`
 * holds two adapters to. There, the in-memory fake is trustworthy as a stand-in
 * for the Durable Object only because one suite runs against both.
 *
 * IT RUNS AGAINST THE LIVE RECORDS, NOT A SYNTHETIC ONE. Every case copies the
 * real `docs/evals/*.json` into a scratch tree and drives the ratchet over it,
 * once per declared set of all twelve. A synthetic fixture would have passed the
 * first attempt at #599, which mis-read six of the twelve shapes and deleted the
 * reasons block of three: the record on disk is the specification, and a suite
 * that does not read it is testing the shape the module would have chosen.
 *
 * NOTHING IS WRITTEN IN THE TREE. The scratch copy is what gets mutated, and it
 * is removed after each case — which is also the only way to test the absent
 * record, the one case a tracked fixture cannot carry.
 *
 * RUNNER-AGNOSTIC, for the same reason the ThreadState suite is: it is handed
 * its `test` rather than importing one.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';
import { UNREVIEWED, openRatchet } from './ratchet.mjs';
import { SHAPES, setOf } from './ratchet-shapes.mjs';

/** Walk a dotted path; `''` is the value itself. */
const read = (value, dotted) =>
  dotted === '' ? value : dotted.split('.').reduce((here, step) => here?.[step], value);

/**
 * What the run "found", started from what the record holds — so the no-movement
 * case is genuinely no movement, and every other case is one stated edit to it.
 */
const liveFound = (record, set) => structuredClone(read(record, set.at));

/**
 * The edits, per form. Each returns a NEW found side, or `null` where the form
 * cannot express that edit: a `scalar` set has fixed field names, so it has no
 * new entry and no stale one, and a presence-only set has no count to move.
 */
const EDITS = {
  keys: {
    add: (found) => [...found, 'ratchet-conformance/added'],
    drop: (found) => (found.length ? found.slice(1) : null),
    raise: () => null,
    lower: () => null,
    keyOf: (found) => (found.length ? found[0] : null),
  },
  lists: {
    add: (found) => {
      const head = Object.keys(found)[0];
      return head ? { ...found, [head]: [...found[head], 'ratchet-conformance-rule'] } : null;
    },
    drop: (found) => {
      const head = Object.keys(found)[0];
      if (!head || !found[head].length) return null;
      return { ...found, [head]: found[head].slice(1) };
    },
    raise: () => null,
    lower: () => null,
    keyOf: (found) => {
      const head = Object.keys(found)[0];
      return head && found[head].length ? head : null;
    },
  },
  counts: {
    add: (found) => ({ ...found, 'ratchet-conformance/added': 1 }),
    drop: (found, set) => dropFirst(found, set),
    raise: (found, set) => bump(found, set, 1),
    lower: (found, set) => bump(found, set, -1),
    keyOf: (found, set) => firstKey(found, set),
  },
  entries: {
    add: (found, set) => {
      const head = firstKey(found, set);
      return head
        ? { ...found, 'ratchet-conformance/added': structuredClone(found[head]) }
        : null;
    },
    drop: (found, set) => dropFirst(found, set),
    raise: (found, set) => shift(found, set, 1),
    lower: (found, set) => shift(found, set, -1),
    keyOf: (found, set) => firstKey(found, set),
  },
  reasons: {
    add: (found) => ({ ...found, 'ratchet-conformance/added': 'recorded by the conformance suite' }),
    drop: (found, set) => dropFirst(found, set),
    raise: () => null,
    lower: () => null,
    keyOf: (found, set) => firstKey(found, set),
  },
  scalar: {
    add: () => null,
    drop: () => null,
    raise: (found, set) => ({ ...found, [set.fields[0]]: found[set.fields[0]] + 1 }),
    lower: (found, set) => ({ ...found, [set.fields[0]]: found[set.fields[0]] - 1 }),
    keyOf: (_found, set) => set.fields[0],
  },
};

/**
 * The first ENTRY of a container, which is not always its first key: the
 * `ours` block of `atlassian-benchmark.json` keeps its `note` and `recordedAt`
 * in with its four numbers, and the set declares them `ignore`d.
 */
const firstKey = (found, set) =>
  Object.keys(found).find((key) => !(set.ignore ?? []).includes(key)) ?? null;

function dropFirst(found, set) {
  const head = firstKey(found, set);
  if (!head) return null;
  const next = { ...found };
  delete next[head];
  return next;
}

function bump(found, set, by) {
  const head = firstKey(found, set);
  if (!head) return null;
  return { ...found, [head]: found[head] + by };
}

function shift(found, set, by) {
  const head = firstKey(found, set);
  const field = set.fields?.[0];
  if (!head || !field) return null;
  return { ...found, [head]: { ...found[head], [field]: found[head][field] + by } };
}

/**
 * Every top-level key of the record except the ones this set owns — the
 * container it replaces and, where the reasons live outside the entry, the map
 * they live in. This list is the whole point of the suite: after a write, every
 * one of these has to be byte-identical, `button-contrast`'s `notes` and
 * `focus-ring`'s `measured` included.
 */
function unowned(record, set) {
  const owned = new Set([set.at.split('.')[0], set.reason?.beside?.split('.')[0]]);
  // A `scalar` set at the record root owns only its named fields, so every
  // other top-level key is unowned — including the fields of a sibling set.
  if (set.at === '') for (const field of set.fields) owned.add(field);
  return Object.keys(record).filter((key) => !owned.has(key));
}

/**
 * Run the suite over every declared set of every live baseline record.
 *
 * @param {{test: (name: string, fn: () => void) => void}} runner
 * @param {{repoRoot?: string}} [opts]
 */
export function runRatchetConformance(runner, { repoRoot = REPO_ROOT } = {}) {
  for (const shape of SHAPES) {
    for (const declared of shape.sets) {
      runSetConformance(runner, shape, declared, repoRoot);
    }
  }
}

/** One record, one of its sets. Exported so a migrating check can drive one. */
export function runSetConformance(runner, shape, declared, repoRoot = REPO_ROOT) {
  const set = setOf(shape, declared.name);
  const label = `${path.basename(shape.file)} § ${set.name}`;
  const test = (name, fn) => runner.test(`[${label}] ${name}`, fn);
  const edits = EDITS[set.form];

  /** The live record, read once, and never written to. */
  const live = JSON.parse(fs.readFileSync(path.join(repoRoot, shape.file), 'utf8'));

  /** A scratch tree holding a copy of this one record. Removed after the case. */
  function inScratch(body) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-conformance-'));
    try {
      const to = path.join(root, shape.file);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(path.join(repoRoot, shape.file), to);
      body(root, to);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  const open = (root) => openRatchet({ file: shape.file, set: set.name, repoRoot: root });
  const found = () => liveFound(live, set);
  const written = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

  // ── the live record reads, and reads as itself ─────────────────────────────

  test('reads the live record on its declared shape', () => {
    inScratch((root) => {
      const ratchet = open(root);
      assert.equal(ratchet.absent, false);
      // The whole failure mode this module exists to prevent: a shape the
      // module cannot read coming back as an empty set, which is a green
      // ratchet. An empty set here is only ever a record that IS empty.
      const onDisk = read(live, set.at);
      const size = Array.isArray(onDisk)
        ? onDisk.length
        : set.form === 'scalar'
          ? set.fields.length
          : set.form === 'lists'
            ? Object.values(onDisk).reduce((n, list) => n + list.length, 0)
            : Object.keys(onDisk).filter((k) => !(set.ignore ?? []).includes(k)).length;
      assert.equal(ratchet.entries.size, size, 'every entry on disk is an entry in the module');
      assert.deepEqual(ratchet.failures(found()), [], 'the live record does not fail against itself');
      assert.deepEqual(ratchet.stale(found()), [], 'nothing on disk is stale against itself');
    });
  });

  // ── the absent record: ONE stated error mode ───────────────────────────────

  test('reports an absent record as one failure, and nothing else', () => {
    inScratch((root, file) => {
      fs.rmSync(file);
      const ratchet = open(root);
      assert.equal(ratchet.absent, true);

      const failures = ratchet.failures(found());
      assert.equal(failures.length, 1, 'one failure, not one per finding');
      assert.equal(failures[0].kind, 'absent');
      assert.match(failures[0].message, /no baseline is recorded at/);

      // With nothing recorded there is nothing to call stale or unreviewed, and
      // saying so twice would bury the one fact that matters.
      assert.deepEqual(ratchet.stale(found()), []);
      assert.deepEqual(ratchet.unreviewed(), []);
    });
  });

  // ── an unreadable record is an ERROR, never an empty set ───────────────────

  test('refuses a record that is not JSON', () => {
    inScratch((root, file) => {
      fs.writeFileSync(file, '{ "findings": ');
      assert.throws(() => open(root), /cannot be read as the baseline shape it declares/);
    });
  });

  test('refuses a record whose container is the wrong type, rather than reading it as empty', () => {
    inScratch((root, file) => {
      const broken = structuredClone(live);
      if (set.at === '') for (const field of set.fields) broken[field] = 'not a number';
      else writeAt(broken, set.at, 42);
      fs.writeFileSync(file, JSON.stringify(broken, null, 2));
      assert.throws(() => open(root), /cannot be read as the baseline shape it declares/);
    });
  });

  test('refuses a record whose container is missing, rather than reading it as empty', () => {
    inScratch((root, file) => {
      const broken = structuredClone(live);
      if (set.at === '') for (const field of set.fields) delete broken[field];
      else deleteAt(broken, set.at);
      fs.writeFileSync(file, JSON.stringify(broken, null, 2));
      assert.throws(() => open(root), /cannot be read as the baseline shape it declares/);
    });
  });

  // ── a finding grows ───────────────────────────────────────────────────────

  test('a NEW finding fails', () => {
    const grown = edits.add(found(), set);
    if (grown === null) return; // this form has no entry to add
    inScratch((root) => {
      const failures = open(root).failures(grown);
      assert.equal(failures.length, 1);
      assert.equal(failures[0].kind, 'new');
    });
  });

  test('a recorded count that moved the wrong way fails, and the other way is silent', () => {
    const raised = edits.raise(found(), set);
    const lowered = edits.lower(found(), set);
    if (raised === null || lowered === null) return; // presence only: no count to move
    inScratch((root) => {
      const ratchet = open(root);
      const up = ratchet.failures(raised);
      const down = ratchet.failures(lowered);
      if (set.direction === 'grow-only') {
        assert.deepEqual(up, [], 'a FLOOR may rise');
        assert.equal(down.length, 1);
        assert.equal(down[0].kind, 'fell');
      } else if (set.direction === 'both') {
        assert.equal(up[0]?.kind, 'rose');
        assert.equal(down[0]?.kind, 'fell');
      } else {
        assert.equal(up.length, 1);
        assert.equal(up[0].kind, 'rose');
        assert.deepEqual(down, [], 'a ratchet only fails on a rise');
      }
    });
  });

  // ── a finding is fixed ────────────────────────────────────────────────────

  test('a fixed finding is reported STALE and is not a failure', () => {
    const fixed = edits.drop(found(), set);
    if (fixed === null) return; // nothing recorded to fix
    inScratch((root) => {
      const ratchet = open(root);
      assert.deepEqual(ratchet.failures(fixed), [], 'a fix is not a failure');
      const stale = ratchet.stale(fixed);
      assert.equal(stale.length, 1, 'a fix that leaves its exemption behind is reported');
      assert.equal(typeof stale[0].key, 'string');
    });
  });

  // ── a placeholder reason ──────────────────────────────────────────────────

  test('a placeholder reason is reported UNREVIEWED', () => {
    if (!set.reason) {
      inScratch((root) => assert.deepEqual(open(root).unreviewed(), [],
        'a set that records no reason has nothing to review'));
      return;
    }
    const key = edits.keyOf(found(), set);
    if (key === null) return; // an empty exception map has no entry to blank
    inScratch((root, file) => {
      const record = structuredClone(live);
      stampPlaceholder(record, set, key);
      fs.writeFileSync(file, JSON.stringify(record, null, 2));
      const unreviewed = open(root).unreviewed();
      assert.equal(unreviewed.length, 1);
      assert.equal(unreviewed[0].key, key);
    });
  });

  // ── `--update` IS A MERGE ─────────────────────────────────────────────────

  test('--update over what is already recorded changes nothing', () => {
    inScratch((root, file) => {
      open(root).update(found());
      assert.deepEqual(written(file), live, 'a no-movement write is a no-op on the whole record');
    });
  });

  test('--update preserves every key the module does not own', () => {
    const grown = edits.add(found(), set) ?? edits.raise(found(), set);
    if (grown === null) return;
    inScratch((root, file) => {
      open(root).update(grown);
      const after = written(file);
      const keys = unowned(live, set);
      assert.ok(keys.length > 0, 'this record has sibling keys, and they are what is at stake');
      for (const key of keys) {
        assert.deepEqual(after[key], live[key], `\`${key}\` survived the write`);
      }
      assert.deepEqual(
        Object.keys(after).sort(),
        Object.keys(live).sort(),
        'the write added and removed no top-level key',
      );
    });
  });

  test('--update carries an existing reason across and stamps a new entry', () => {
    if (!set.reason) return;
    const grown = edits.add(found(), set);
    const survivor = edits.keyOf(found(), set);
    if (grown === null) return;
    inScratch((root, file) => {
      open(root).update(grown);
      const after = written(file);
      const added = reasonFor(after, set, 'ratchet-conformance/added');
      assert.equal(added, UNREVIEWED, 'a reason is never invented by the tool');
      if (survivor !== null) {
        assert.equal(
          reasonFor(after, set, survivor),
          reasonFor(live, set, survivor),
          'a reviewed reason is carried across untouched',
        );
      }
    });
  });
}

/* ─── the record surgery the cases need, stated once ───────────────────────── */

function writeAt(record, dotted, value) {
  const steps = dotted.split('.');
  const last = steps.pop();
  steps.reduce((here, step) => here[step], record)[last] = value;
}

function deleteAt(record, dotted) {
  const steps = dotted.split('.');
  const last = steps.pop();
  delete steps.reduce((here, step) => here[step], record)[last];
}

/** Where one entry's reason lives, read off the set's declaration. */
function reasonFor(record, set, key) {
  if (set.reason?.beside) return read(record, set.reason.beside)[key];
  if (set.reason?.is === 'value') return read(record, set.at)[key];
  return read(record, set.at)[key]?.[set.reason.in];
}

function stampPlaceholder(record, set, key) {
  if (set.reason.beside) read(record, set.reason.beside)[key] = 'TBD';
  else if (set.reason.is === 'value') read(record, set.at)[key] = 'TBD';
  else read(record, set.at)[key][set.reason.in] = 'TBD';
}
