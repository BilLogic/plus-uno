/**
 * The ratchet conformance suite.
 *
 * Written ONLY against the `Ratchet` interface in `scripts/lib/ratchet.mjs`: it
 * opens a ratchet through the factory it is handed, drives it through the whole
 * invariant, and asserts nothing about the record's own shape. That is the
 * point. Twelve checks declare a baseline, and each one keys, nests and words
 * its record differently; what they must not differ on is whether a rise fails,
 * whether a fix is reported, what an absent record does, and whether a
 * placeholder reason is caught. So the invariant is STATED ONCE — in the
 * module's header — and ASSERTED ONCE, here, against every adapter.
 *
 * This is the shape `agents/uno-bot/tests/helpers/thread-state-conformance.ts`
 * holds two adapters to. There, the in-memory fake is trustworthy as a stand-in
 * for the Durable Object only because one suite runs against both. Here, the
 * module's own reference adapter and each migrated check's ratchet answer the
 * same suite, so a check that reads the module cannot have quietly re-declared
 * a direction. A migrating check adds one adapter and nothing else.
 *
 * NO FIXTURE LIVES IN THE TREE. Every case runs in a scratch directory the
 * suite creates and removes, because the absent-record case is a REAL absent
 * file — the one case a tracked fixture cannot carry — and because a record
 * planted in the live tree is a file every other sweep then has to read.
 *
 * RUNNER-AGNOSTIC, for the same reason the ThreadState suite is: it is handed
 * its `test` rather than importing one, so it can be driven from
 * `node --test` today and from another runner without duplicating a case.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * One adapter: how to open a ratchet over a scratch tree, and two keys its
 * check's own grammar accepts.
 *
 * @typedef {object} RatchetAdapter
 * @property {(repoRoot: string) => import('./ratchet.mjs').Ratchet} open
 *           opens the ratchet over the root it is handed. Called fresh for
 *           every read, because a ratchet reads its record once when it opens
 *           and the suite asserts what the NEXT open sees.
 * @property {[string, string]} keys  two distinct keys, spelled the way this
 *           check keys its findings.
 * @property {(count: number) => object} [payload]  the per-entry payload the
 *           check writes beside the reason. Default `{count}`.
 *
 * @typedef {object} ConformanceRunner
 * @property {(name: string, fn: () => void) => void} test
 */

/**
 * Run the suite against one adapter.
 *
 * @param {string} label  names the adapter in every test title, so a failure
 *                        says which ratchet disagreed.
 * @param {RatchetAdapter} adapter
 * @param {ConformanceRunner} runner  the caller's test function.
 */
export function runRatchetConformance(label, adapter, runner) {
  const [KEY, OTHER] = adapter.keys;
  const payload = adapter.payload ?? ((count) => ({ count }));
  const found = (counts) =>
    new Map(Object.entries(counts).map(([key, count]) => [key, payload(count)]));

  /** A scratch tree per case, removed after it. Nothing is shared. */
  function inScratch(body) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-conformance-'));
    try {
      body(root);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  /** Seed a record, then reopen so the suite reads it the way a check does. */
  function seeded(root, counts) {
    adapter.open(root).update(found(counts));
    return adapter.open(root);
  }

  /** Write a real reason onto a recorded entry, the way a person does. */
  function review(root, key, reason) {
    const ratchet = adapter.open(root);
    const file = path.join(root, ratchet.file);
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    record[ratchet.set][key][ratchet.reasonKey] = reason;
    fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  }

  const test = (name, fn) => runner.test(`[${label}] ratchet ${name}`, fn);

  // ── the absent record: ONE stated error mode ───────────────────────────────

  test('reports an absent record as one failure, and nothing else', () => {
    inScratch((root) => {
      const ratchet = adapter.open(root);
      assert.equal(ratchet.absent, true);

      const failures = ratchet.failures(found({ [KEY]: 1 }));
      assert.equal(failures.length, 1, 'one failure, not one per finding');
      assert.equal(failures[0].kind, 'absent');
      assert.match(failures[0].message, /baseline/);

      // With nothing recorded there is nothing to call stale or unreviewed, and
      // saying so twice would bury the one fact that matters.
      assert.deepEqual(ratchet.stale(found({ [KEY]: 1 })), []);
      assert.deepEqual(ratchet.unreviewed(), []);
    });
  });

  test('an absent record stops being absent once it is written', () => {
    inScratch((root) => {
      const written = adapter.open(root).update(found({ [KEY]: 1 }));
      assert.equal(written.entries, 1);
      assert.equal(adapter.open(root).absent, false);
    });
  });

  // ── the shrink-only invariant ──────────────────────────────────────────────

  test('a recorded finding at its recorded count is silent', () => {
    inScratch((root) => {
      assert.deepEqual(seeded(root, { [KEY]: 2 }).failures(found({ [KEY]: 2 })), []);
    });
  });

  test('a finding that GREW fails, naming the record and the run', () => {
    inScratch((root) => {
      const failures = seeded(root, { [KEY]: 2 }).failures(found({ [KEY]: 5 }));
      assert.equal(failures.length, 1);
      assert.deepEqual(failures[0], { kind: 'rose', key: KEY, count: 5, recorded: 2 });
    });
  });

  test('a finding that SHRANK is silent — a ratchet only fails on a rise', () => {
    inScratch((root) => {
      assert.deepEqual(seeded(root, { [KEY]: 5 }).failures(found({ [KEY]: 2 })), []);
    });
  });

  test('a finding the record does not hold fails as new', () => {
    inScratch((root) => {
      const failures = seeded(root, { [KEY]: 1 }).failures(found({ [KEY]: 1, [OTHER]: 3 }));
      assert.equal(failures.length, 1);
      assert.deepEqual(failures[0], { kind: 'new', key: OTHER, count: 3 });
    });
  });

  test('failures come back in the order the run found them', () => {
    inScratch((root) => {
      const ratchet = seeded(root, { [KEY]: 1 });
      const failures = ratchet.failures(found({ [OTHER]: 1, [KEY]: 9 }));
      assert.deepEqual(
        failures.map((f) => f.kind),
        ['new', 'rose'],
      );
    });
  });

  // ── the fix: a ratchet that cannot shrink is a list ────────────────────────

  test('a finding that was FIXED is reported stale, not as a failure', () => {
    inScratch((root) => {
      const ratchet = seeded(root, { [KEY]: 1, [OTHER]: 2 });
      assert.deepEqual(ratchet.failures(found({ [KEY]: 1 })), []);
      assert.deepEqual(ratchet.stale(found({ [KEY]: 1 })), [
        { key: OTHER, recorded: 2, reason: ratchet.entries.get(OTHER).reason },
      ]);
    });
  });

  test('a run that finds everything recorded has nothing stale', () => {
    inScratch((root) => {
      assert.deepEqual(seeded(root, { [KEY]: 1 }).stale(found({ [KEY]: 1 })), []);
    });
  });

  // ── the reason: recorded by a person, never by the tool ────────────────────

  test('an entry the tool recorded carries a placeholder and reads unreviewed', () => {
    inScratch((root) => {
      const ratchet = seeded(root, { [KEY]: 1 });
      assert.deepEqual(
        ratchet.unreviewed().map((u) => u.key),
        [KEY],
      );
    });
  });

  test('an entry with a written reason is not unreviewed', () => {
    inScratch((root) => {
      seeded(root, { [KEY]: 1 });
      review(root, KEY, 'WCAG 1.4.11 exempts an inactive component outright.');
      assert.deepEqual(adapter.open(root).unreviewed(), []);
    });
  });

  test('a reason that says nothing is still unreviewed', () => {
    inScratch((root) => {
      seeded(root, { [KEY]: 1 });
      for (const nothing of ['', '   ', 'TODO', 'tbd', 'n/a', '?']) {
        review(root, KEY, nothing);
        assert.deepEqual(
          adapter.open(root).unreviewed().map((u) => u.key),
          [KEY],
          `"${nothing}" is not a reason`,
        );
      }
    });
  });

  test('a re-record carries a written reason across and stamps only the new entry', () => {
    inScratch((root) => {
      seeded(root, { [KEY]: 1 });
      review(root, KEY, 'A token decision this check cannot make for itself.');

      adapter.open(root).update(found({ [KEY]: 1, [OTHER]: 1 }));
      const ratchet = adapter.open(root);

      assert.match(ratchet.entries.get(KEY).reason, /token decision/);
      assert.deepEqual(
        ratchet.unreviewed().map((u) => u.key),
        [OTHER],
      );
    });
  });

  test('a re-record drops the entries the run no longer finds', () => {
    inScratch((root) => {
      seeded(root, { [KEY]: 1, [OTHER]: 1 });
      adapter.open(root).update(found({ [KEY]: 1 }));
      const ratchet = adapter.open(root);
      assert.deepEqual([...ratchet.entries.keys()], [KEY]);
      assert.deepEqual(ratchet.stale(found({ [KEY]: 1 })), []);
    });
  });
}
