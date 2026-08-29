/**
 * Tests for the two things `check:text-contrast` gets wrong if left naive.
 *
 * Both were made, in order, while writing it — which is why they are the bulk
 * of this suite rather than a footnote:
 *
 *   1. READING A GROUND THAT IS NOT THERE. The first draft measured everything
 *      against the page and reported `color: var(--color-surface)` beside
 *      `background-color: var(--color-success)` as white-on-white at 1:1.
 *   2. READING A STATE LAYER AS PAINT. The second draft read the ground from
 *      the rule and then treated `rgba(4, 114, 168, 0.08)` as solid. 34 of its
 *      48 findings were an 8% wash mistaken for a colour — the same arithmetic
 *      #268's audit made and had to correct.
 *
 * The ratchet is tested too, in all three directions it can move, because a
 * baseline that only ever gets appended to is not a ratchet.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  census,
  enclosingBlock,
  findings,
  groundFor,
  keyOf,
  opaqueGround,
  ratchetFailures,
  ratio,
  textDeclarations,
  textSibling,
} from './text-contrast.mjs';

/**
 * A Map, because that is what `tokenValues` returns. Stated here because the
 * first version of `textSibling` treated it as a plain object, which is always
 * false on a Map: the hint naming the fix never fired once, in a report whose
 * whole job is to name the fix. A fixture of the wrong TYPE would have hidden
 * that, so this one has the right type.
 */
const VALUES = new Map([
  ['--color-surface', '#f9f9fc'],
  ['--color-success', '#3e691a'],
  ['--color-warning', '#9f8205'],
  ['--color-warning-text', '#5b4a00'],
  ['--color-primary', '#0472a8'],
  ['--color-primary-state-08', 'rgba(4, 114, 168, 0.08)'],
]);

function fixture(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'text-contrast-'));
  const full = path.join(dir, name);
  fs.writeFileSync(full, content);
  return { root: '/', file: path.relative('/', full) };
}

test('a background in the SAME rule is the ground', () => {
  const { root, file } = fixture(
    'snack.scss',
    `.a {\n  background-color: var(--color-success);\n  color: var(--color-surface);\n}\n`,
  );
  const [use] = textDeclarations([file], root);
  assert.equal(use.ground, '--color-success');
  // White on green, not white on white. Under the page assumption this is 1:1.
  assert.ok(ratio(use.token, VALUES, use.ground) > 4.5);
});

test('a background in a CHILD rule is not this rule’s ground', () => {
  // The shape that actually occurs: the header sets the text colour, the
  // variant modifier sets the fill. Reported as a page finding, and the
  // baseline records why — a wrong answer here would be worse than no answer.
  const { root, file } = fixture(
    'child.scss',
    `.a {\n  color: var(--color-surface);\n\n  &--created {\n    background-color: var(--color-success);\n  }\n}\n`,
  );
  const [use] = textDeclarations([file], root);
  assert.equal(use.ground, '--color-surface');
});

test('a translucent ground is composited over the page, not read as paint', () => {
  const solid = opaqueGround('--color-primary-state-08', VALUES);
  // 8% of #0472a8 over #f9f9fc is a near-white wash, nothing like the blue.
  assert.ok(solid.r > 220 && solid.g > 220 && solid.b > 230, JSON.stringify(solid));
  const measured = ratio('--color-primary', VALUES, '--color-primary-state-08');
  assert.ok(measured > 4 && measured < 5, `expected ~4.46, got ${measured}`);
});

test('background-color and border-color are not text', () => {
  const { root, file } = fixture(
    'not-text.scss',
    `.a {\n  background-color: var(--color-warning);\n  border-color: var(--color-warning);\n}\n`,
  );
  assert.deepEqual(textDeclarations([file], root), []);
});

test('enclosingBlock blanks nested rules so a child cannot answer for a parent', () => {
  const source = `.a {\n  color: red;\n  .b {\n    background: blue;\n  }\n}\n`;
  const block = enclosingBlock(source, source.indexOf('color: red'));
  assert.match(block, /color: red/);
  assert.doesNotMatch(block, /blue/);
});

test('groundFor ignores a literal background', () => {
  // Only a token ground is trusted; a literal leaves the page assumption in
  // place rather than being silently used.
  const source = `.a {\n  background-color: #ffffff;\n  color: var(--color-warning);\n}\n`;
  assert.equal(groundFor(source, source.indexOf('color: var(--color-warning)')), '--color-surface');
});

test('the -text sibling is offered only when the token file defines one', () => {
  assert.equal(textSibling('--color-warning', VALUES), '--color-warning-text');
  assert.equal(textSibling('--color-primary', VALUES), null);
});

test('a warning text colour on the page is a finding, and names its sibling', () => {
  const { root, file } = fixture('tag.scss', `.a {\n  color: var(--color-warning);\n}\n`);
  const [found] = findings(textDeclarations([file], root), VALUES);
  assert.equal(found.token, '--color-warning');
  assert.equal(found.ratio, 3.52);
  assert.equal(found.sibling, '--color-warning-text');
  assert.ok(found.siblingRatio > 8);
});

test('the same colour via the -text sibling is not a finding', () => {
  const { root, file } = fixture('tag.scss', `.a {\n  color: var(--color-warning-text);\n}\n`);
  assert.deepEqual(findings(textDeclarations([file], root), VALUES), []);
});

const KEY = 'a.scss|--color-warning|--color-surface';

test('the ratchet fails on a NEW finding', () => {
  const failures = ratchetFailures({ [KEY]: 1 }, {});
  assert.equal(failures.length, 1);
  assert.match(failures[0], /NEW/);
});

test('the ratchet fails when a recorded count ROSE', () => {
  const failures = ratchetFailures({ [KEY]: 3 }, { [KEY]: { count: 2, why: 'x' } });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /ROSE/);
});

test('the ratchet fails on a STALE entry that no longer occurs', () => {
  // The direction most baselines forget. A fix that leaves its exemption
  // behind turns the baseline into a list of things nobody has looked at.
  const failures = ratchetFailures({}, { [KEY]: { count: 1, why: 'x' } });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /STALE/);
});

test('the ratchet passes when the count shrank', () => {
  assert.deepEqual(ratchetFailures({ [KEY]: 1 }, { [KEY]: { count: 2, why: 'x' } }), []);
});

test('the baseline key is file + token + ground, not a line number', () => {
  const key = keyOf({ file: 'a.scss', token: '--color-warning', ground: '--color-surface', line: 91 });
  assert.equal(key, KEY);
  assert.deepEqual(census([{ file: 'a.scss', token: '--color-warning', ground: '--color-surface', line: 1 },
    { file: 'a.scss', token: '--color-warning', ground: '--color-surface', line: 40 }]), { [KEY]: 2 });
});
