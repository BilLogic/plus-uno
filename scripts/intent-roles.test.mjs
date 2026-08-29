import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { EDGE, counts, edgeUses, failures, stylesheets } from './intent-roles.mjs';

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
    'design-system/src/tokens/_color_roles.scss': ':root { --color-danger-border: var(--color-danger); }',
    'design-system/src/a.scss': '.a { color: var(--color-danger); }',
  });
  assert.deepEqual(stylesheets(root), ['design-system/src/a.scss']);
});

test('`color:` is not an edge', () => {
  const root = corpus({ 'design-system/src/a.scss': '.a { color: var(--color-warning); }' });
  assert.equal(edgeUses(stylesheets(root), root).length, 0);
});

test('the ratchet fails in both directions, and on a file it has never seen', () => {
  const uses = [
    { file: 'a.scss', kind: 'border', line: 1, property: 'border-color' },
    { file: 'a.scss', kind: 'outline', line: 2, property: 'outline' },
  ];
  assert.deepEqual(failures(uses, { 'a.scss': { border: 1, outline: 1 } }), []);

  const up = failures(uses, { 'a.scss': { border: 0, outline: 1 } });
  assert.equal(up.length, 1);
  assert.match(up[0], /up from 0/);

  const down = failures(uses, { 'a.scss': { border: 1, outline: 3 } });
  assert.equal(down.length, 1);
  assert.match(down[0], /down from 3/);

  const unseen = failures(uses, {});
  assert.equal(unseen.length, 1);
  assert.match(unseen[0], /not in the baseline/);

  const gone = failures([], { 'a.scss': { border: 1, outline: 0 } });
  assert.equal(gone.length, 1);
  assert.match(gone[0], /Delete its entry/);
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
