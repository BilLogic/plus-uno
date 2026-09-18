/**
 * Tests for the import walk the check registry asks its questions of.
 *
 * WRITTEN OVER FIXTURES, NOT OVER THE REAL CHECKS. What the real reach of the
 * twelve `baseline:` rows answers is asserted where it is USED — in
 * `scripts/check-harness.test.mjs`, against the live registry. What is asserted
 * here is the walk and the three readings, including the cases the live tree has
 * none of: a record named only in a comment, a flag offered nowhere, a
 * three-hop reach. A fixture is the only way to watch those fail.
 *
 * Run: npm run test:scripts
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { reachOf } from './script-reach.mjs';

/** A scratch tree with the files given, keyed by repo-relative path. */
function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'script-reach-'));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return root;
}

const RECORD = 'docs/evals/example-baseline.json';

test('the record is found through the hop, where the check names it and the lib opens it', () => {
  // The two fallback families' shape exactly: the entry spells the path in the
  // literal it hands over, and every piece of record logic is one hop away.
  const root = tree({
    'scripts/check-example.mjs': `
      import { exampleCheck } from './lib/example.mjs';
      const EXAMPLE = exampleCheck({ check: 'check:example', baseline: '${RECORD}' });
    `,
    'scripts/lib/example.mjs': `
      import { openRatchet } from './ratchet.mjs';
      export function exampleCheck(family) {
        const { check, baseline: BASELINE } = family;
        const gate = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });
        return { run: () => gate('.'), flags: { '--update': () => gate('.').update([]) } };
      }
    `,
    'scripts/lib/ratchet.mjs': 'export function openRatchet() {}',
  });
  const reach = reachOf('scripts/check-example.mjs', { repoRoot: root });

  assert.deepEqual(reach.files, [
    'scripts/check-example.mjs',
    'scripts/lib/example.mjs',
    'scripts/lib/ratchet.mjs',
  ]);
  assert.equal(reach.opens(RECORD), true);
  assert.equal(reach.slotOf('--update'), 'flags');
});

test('a record opened through an imported constant needs no filename in the entry', () => {
  const root = tree({
    'scripts/check-example.mjs': `
      import { BASELINE, gate } from './lib/example.mjs';
      export const run = () => gate(BASELINE);
    `,
    'scripts/lib/example.mjs': `
      import { openRatchet } from './ratchet.mjs';
      export const BASELINE = '${RECORD}';
      export const gate = () => openRatchet({ file: BASELINE, repoRoot: '.' });
    `,
    'scripts/lib/ratchet.mjs': 'export function openRatchet() {}',
  });
  const reach = reachOf('scripts/check-example.mjs', { repoRoot: root });

  assert.equal(fs.readFileSync(path.join(root, 'scripts/check-example.mjs'), 'utf8').includes(RECORD), false);
  assert.equal(reach.opens(RECORD), true);
});

test('a record only a comment mentions is neither named nor opened', () => {
  const root = tree({
    'scripts/check-example.mjs': `
      /**
       * It used to hold ${RECORD}, and it used to call
       * openRatchet({ file: BASELINE }) to do it. Both are gone.
       */
      // openRatchet({ file: '${RECORD}' });
      export const run = () => [];
    `,
  });
  const reach = reachOf('scripts/check-example.mjs', { repoRoot: root });

  assert.equal(reach.names(RECORD), false);
  assert.equal(reach.opens(RECORD), false);
});

test('a reach that names the record but never opens it is told apart from one that does', () => {
  const root = tree({
    'scripts/check-example.mjs': `
      import fs from 'node:fs';
      const BASELINE = '${RECORD}';
      export const run = () => JSON.parse(fs.readFileSync(BASELINE, 'utf8')).findings;
    `,
  });
  const reach = reachOf('scripts/check-example.mjs', { repoRoot: root });

  assert.equal(reach.names(RECORD), true);
  assert.equal(reach.opens(RECORD), false);
});

test('the two flag slots are told apart, and a flag read off argv is neither', () => {
  const root = tree({
    'scripts/check-terminal.mjs': "main(import.meta.url, 'x', { flags: { '--update': write } });",
    'scripts/check-gating.mjs':
      "main(import.meta.url, 'x', { fallThrough: { '--update': write }, run });",
    'scripts/check-by-hand.mjs': "const UPDATE = process.argv.includes('--update');",
    'scripts/check-none.mjs': 'export const run = () => [];',
  });
  const at = (file) => reachOf(file, { repoRoot: root });

  assert.equal(at('scripts/check-terminal.mjs').slotOf('--update'), 'flags');
  assert.equal(at('scripts/check-gating.mjs').slotOf('--update'), 'fallThrough');
  assert.equal(at('scripts/check-by-hand.mjs').slotOf('--update'), 'argv');
  assert.equal(at('scripts/check-none.mjs').slotOf('--update'), null);
});

test('a flag offered by a lib two hops away is still the check\'s flag', () => {
  const root = tree({
    'scripts/check-example.mjs': "import { check } from './lib/a.mjs';\nmain(url, 'x', check);",
    'scripts/lib/a.mjs': "export { check } from './b.mjs';",
    'scripts/lib/b.mjs': "export const check = { flags: { '--update': () => {} } };",
  });
  assert.equal(reachOf('scripts/check-example.mjs', { repoRoot: root }).slotOf('--update'), 'flags');
});

test('the walk stops at the edge of scripts/, and a missing import is not a crash', () => {
  const root = tree({
    'scripts/check-example.mjs': `
      import { contrast } from '../design-system/src/lib/tokens.mjs';
      import { gone } from './lib/deleted.mjs';
      import { here } from './lib/here.mjs';
    `,
    'design-system/src/lib/tokens.mjs': `export const RECORD = '${RECORD}';`,
    'scripts/lib/here.mjs': 'export const here = 1;',
  });
  const reach = reachOf('scripts/check-example.mjs', { repoRoot: root });

  assert.deepEqual(reach.files, ['scripts/check-example.mjs', 'scripts/lib/here.mjs']);
  assert.equal(reach.names(RECORD), false);
});

test('a file the caller calls no evidence is walked for its imports and read for nothing else', () => {
  const root = tree({
    'scripts/check-example.mjs': "import { SHAPES } from './lib/table.mjs';",
    // The shape table's shape: it names every record in the repo, so naming one
    // there says nothing about which record THIS check reads.
    'scripts/lib/table.mjs': `
      import { helper } from './helper.mjs';
      export const SHAPES = [{ file: '${RECORD}', command: 'npm run x -- --update' }];
    `,
    'scripts/lib/helper.mjs': 'export const helper = 1;',
  });
  const reach = reachOf('scripts/check-example.mjs', {
    repoRoot: root,
    notEvidence: ['scripts/lib/table.mjs'],
  });

  assert.deepEqual(reach.files, [
    'scripts/check-example.mjs',
    'scripts/lib/table.mjs',
    'scripts/lib/helper.mjs',
  ]);
  assert.equal(reach.names(RECORD), false);
});

test('a cycle terminates', () => {
  const root = tree({
    'scripts/check-example.mjs': "import './lib/a.mjs';",
    'scripts/lib/a.mjs': "import './b.mjs';",
    'scripts/lib/b.mjs': "import '../check-example.mjs';",
  });
  assert.equal(reachOf('scripts/check-example.mjs', { repoRoot: root }).files.length, 3);
});
