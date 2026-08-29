import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenNames, compare, refusals } from './token-generation.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('tokenNames reads declarations and not uses', () => {
  const scss = `:root {\n  --color-a: #fff;\n  --color-b: var(--color-a);\n}\n.x { color: var(--color-c); }`;
  assert.deepEqual(tokenNames(scss), ['--color-a', '--color-b']);
});

test('a file that keeps everything and adds is not a refusal', () => {
  const c = compare([{ file: 'x', committed: '--a: 1;', generated: '--a: 1;\n--b: 2;' }]);
  assert.deepEqual(c[0].lost, []);
  assert.equal(c[0].after, 2);
  assert.deepEqual(refusals(c), []);
});

test('a file that loses one token is a refusal, named', () => {
  const c = compare([{ file: '_colors.scss', committed: '--a: 1;\n--warning-text: 2;', generated: '--a: 1;' }]);
  assert.deepEqual(c[0].lost, ['--warning-text']);
  const [line] = refusals(c);
  assert.match(line, /_colors\.scss/);
  assert.match(line, /would DELETE 1/);
  assert.match(line, /--warning-text/); // the NAME, not just the count
});

test('a net-neutral swap is still a refusal', () => {
  // 79 -> 77 with 3 lost and 1 gained is what `_spacing_semantics.scss` does
  // today. Counting only the total would have called that a shrink of two and
  // missed which three names left.
  const c = compare([{ file: 'y', committed: '--a: 1;\n--b: 2;', generated: '--a: 1;\n--c: 3;' }]);
  assert.equal(c[0].before, 2);
  assert.equal(c[0].after, 2);
  assert.deepEqual(c[0].lost, ['--b']);
  assert.equal(refusals(c).length, 1);
});

test('a long loss list is truncated but never understated', () => {
  const committed = Array.from({ length: 20 }, (_, i) => `--t${i}: 1;`).join('\n');
  const [line] = refusals(compare([{ file: 'z', committed, generated: '' }]));
  assert.match(line, /would DELETE 20/);
  assert.match(line, /and 14 more/);
});

test('a missing file on disk is not a refusal', () => {
  // First generation of a new token file has nothing to lose.
  assert.deepEqual(refusals(compare([{ file: 'new', committed: '', generated: '--a: 1;' }])), []);
});

test('the generator still announces the protection it now has', () => {
  // The warning text was the whole defect: it claimed a protection that was a
  // console.warn with no exit. If someone reinstates that phrasing without an
  // exit, check:token-generation catches it — this catches the phrasing itself
  // being lost, so the reason stays next to the code.
  const source = fs.readFileSync(path.join(REPO_ROOT, 'scripts/generate-all-tokens.js'), 'utf8');
  assert.match(source, /Refusing to write/);
  assert.match(source, /process\.exit\(1\)/);
  assert.ok(!/DISABLED to protect existing tokens/.test(source), 'the unbacked claim is still there');
});
