import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { run } from './check-intent-roles.mjs';
import { EDGE, INTENTS, counts, edgeUses, failures, stylesheets } from './intent-roles.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

/** A throwaway corpus, so the tests describe the rule rather than today's code. */
function corpus(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'intent-roles-'));
  for (const [rel, source] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), source);
  }
  return root;
}

test('an intent base on any edge property is a use', () => {
  const root = corpus({
    'design-system/src/a.scss': [
      '.a { border-color: var(--color-danger); }',
      '.b { border: 1px solid var(--color-primary); }',
      '.c { border-bottom-color: var(--color-success) !important; }',
      '.d { outline: 2px solid var(--color-primary); }',
    ].join('\n'),
  });
  const uses = edgeUses(stylesheets(root), root);
  assert.equal(uses.length, 4);
  assert.deepEqual(uses.map((u) => u.kind), ['border', 'border', 'border', 'outline']);
  assert.equal(uses[0].role, '--color-danger-border');
});

test('a declaration written across two lines is still one declaration', () => {
  // A line-anchored scanner misses this, and two of the 137 real uses are
  // written exactly this way.
  const root = corpus({
    'design-system/src/a.scss': '.a {\n  border:\n    1px solid var(--color-primary);\n}\n',
  });
  assert.equal(edgeUses(stylesheets(root), root).length, 1);
});

test('the role itself is not a use of the base', () => {
  const root = corpus({
    'design-system/src/a.scss': '.a { border-color: var(--color-danger-border); }',
  });
  assert.equal(edgeUses(stylesheets(root), root).length, 0);
});

test('properties that carry no colour do not match', () => {
  // `border-radius: var(--color-…)` is nonsense, but `border-width` and
  // `border-style` sit beside real borders everywhere and an alternation that
  // ended at `border` would swallow them.
  for (const property of ['border-radius', 'border-width', 'border-style', 'border-image']) {
    assert.equal(
      [...`.a { ${property}: var(--color-primary); }`.matchAll(EDGE)].length,
      0,
      `${property} matched`,
    );
  }
});

test('the token directory is not scanned, because it DEFINES the roles', () => {
  const root = corpus({
    [`${TOKEN_DIR}/_color_roles.scss`]: ':root { --color-danger-border: var(--color-danger); }',
    'design-system/src/a.scss': '.a { color: var(--color-danger); }',
  });
  assert.deepEqual(stylesheets(root), ['design-system/src/a.scss']);
});

test('`color:` is not an edge', () => {
  const root = corpus({ 'design-system/src/a.scss': '.a { color: var(--color-warning); }' });
  assert.equal(edgeUses(stylesheets(root), root).length, 0);
});

/*
 * The verdicts, worded. Which count rose, which fell, which file the record has
 * never seen and which entry has no reason is `scripts/lib/ratchet.mjs`'s — a
 * record declaring `direction: 'both'`, asserted once against all twelve live
 * records in `scripts/lib/ratchet-conformance.mjs` (#600). What is asserted
 * here is the measured side this check hands it, and what each verdict says.
 */

const USES = [
  { file: 'a.scss', kind: 'border', line: 1, property: 'border-color' },
  { file: 'a.scss', kind: 'outline', line: 2, property: 'outline' },
];

test('the measured side is the record shape — both counts per file, zeroes included', () => {
  assert.deepEqual(counts(USES), { 'a.scss': { border: 1, outline: 1 } });
});

test('nothing moved is nothing said', () => {
  assert.deepEqual(failures(USES, {}), []);
});

test('a rise and a fall are each worded, and say which count moved', () => {
  const up = failures(USES, {
    failures: [{ kind: 'rose', key: 'a.scss', field: 'border', count: 1, recorded: 0 }],
  });
  assert.equal(up.length, 1);
  assert.match(up[0], /1 border use\(s\) of an intent base, up from 0/);

  const down = failures(USES, {
    failures: [{ kind: 'fell', key: 'a.scss', field: 'outline', count: 1, recorded: 3 }],
  });
  assert.equal(down.length, 1);
  assert.match(down[0], /down from 3/);
});

test('a file the record has never seen is named with its lines', () => {
  const unseen = failures(USES, { failures: [{ kind: 'new', key: 'a.scss', count: 1 }] });
  assert.equal(unseen.length, 1);
  assert.match(unseen[0], /not in the baseline: line 1 \(border-color\), 2 \(outline\)/);
});

test('a stale entry and a reasonless one are each their own finding', () => {
  const gone = failures([], { stale: [{ key: 'a.scss', recorded: 1 }] });
  assert.equal(gone.length, 1);
  assert.match(gone[0], /Delete its entry/);

  const bare = failures(USES, { unreviewed: ['a.scss'] });
  assert.equal(bare.length, 1);
  assert.match(bare[0], /baselined without a reason/);
});

test('counts group by file and kind', () => {
  assert.deepEqual(
    counts([
      { file: 'a', kind: 'border' },
      { file: 'a', kind: 'border' },
      { file: 'b', kind: 'outline' },
    ]),
    { a: { border: 2, outline: 0 }, b: { border: 0, outline: 1 } },
  );
});

/*
 * The policy half (#611). Measurement above plants strings; the gate is a run
 * against a fixture tree — a reverted call site, and a vanished token directory.
 */

const ROLES_SCSS = `:root {\n${INTENTS.map((intent) => `  --color-${intent}-border: var(--color-${intent});`).join('\n')}\n}\n`;

const INTENT_BASELINE = JSON.stringify({
  note: 'Remaining edge uses of an intent base, recorded so a new one fails.',
  recordedAt: '2026-09-18',
  migrated: 0,
  files: {},
});

test('an intent base on an edge in a fixture tree is a finding', () => {
  const { root, done } = policyTree({
    [`${TOKEN_DIR}/_color_roles.scss`]: ROLES_SCSS,
    'design-system/src/a.scss': '.a { border-color: var(--color-danger); }\n',
    'docs/evals/intent-role-adoption.json': INTENT_BASELINE,
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /paints an edge from an intent base/.test(message)),
      `expected a planted edge-use finding, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree({
    'design-system/src/a.scss': '.a { border-color: var(--color-danger); }\n',
    'docs/evals/intent-role-adoption.json': INTENT_BASELINE,
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.ok(
      found.some((message) => /only \d+ stylesheets scanned \(floor 150\)/.test(message)),
      `expected the stylesheet floor, got:\n${found.join('\n')}`,
    );
    assert.ok(
      found.some((message) => /no longer defines --color-danger-border/.test(message)),
      `expected the vanished role, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});
