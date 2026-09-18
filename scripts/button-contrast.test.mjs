/**
 * Tests for the BUTTON half of `check:button-contrast`.
 *
 * The maths — `parseColour`, `composite`, `luminance`, `contrast`,
 * `resolveToken`, `toHex` — moved to `design-system/src/lib/tokens.mjs` in
 * #506, and its tests moved with it to `design-system/tests/tokens.test.js`
 * (run by `npm test`). The ratchet went the same way and then on to
 * `scripts/lib/ratchet.mjs` in #599, where it is asserted against every live
 * baseline record by `scripts/lib/ratchet-conformance.mjs`. What is tested here
 * is what stayed: reading the `$btn-themes` map, building a ground per style ×
 * fill, the duplicate-ground assertion, and the findings this check words.
 *
 * The point of this file is that the check can FAIL. A guard exercised only
 * against the repo, which is green by construction once the baseline is
 * written, is a guard nobody has watched work.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  combination,
  duplicateGrounds,
  findings,
  readRepo,
  sweep,
  themeMap,
  tokenValues,
} from './button-contrast.mjs';
import { openRatchet } from './lib/ratchet.mjs';

test('tokenValues reads the colour tokens and only those', () => {
  const values = tokenValues(':root { --color-primary: #123456; --space-2: 8px; }');
  assert.equal(values.get('--color-primary'), '#123456');
  assert.equal(values.has('--space-2'), false, 'a spacing token is not a colour this check can resolve');
});

test('themeMap reads the map rather than a copy of it', () => {
  const themes = themeMap(`
$btn-themes: (
    'primary': ('--color-primary', '--color-on-primary', '--color-primary-state-08', '--color-primary-text', '--c', '--oc'),
    'danger': ('--color-danger', '--color-on-danger', '--color-danger-state-08', '--color-danger-text', '--c', '--oc')
);`);
  assert.equal(themes.length, 2);
  assert.deepEqual(themes[0], {
    style: 'primary',
    main: '--color-primary',
    onMain: '--color-on-primary',
    state: '--color-primary-state-08',
    text: '--color-primary-text',
  });
});

/** A two-style map with one failing combination, built to fail. */
const FAILING = {
  themes: [
    { style: 'ok', main: '--ok', onMain: '--on-ok', state: '--ok-08', text: '--ok-text' },
    { style: 'bad', main: '--bad', onMain: '--on-bad', state: '--bad-08', text: '--bad-text' },
  ],
  values: new Map([
    ['--color-surface', '#ffffff'],
    ['--ok', '#00404a'], ['--on-ok', '#ffffff'],
    ['--ok-08', 'rgba(0, 64, 74, 0.08)'], ['--ok-text', '#00404a'],
    ['--bad', '#9f8205'], ['--on-bad', '#ffffff'],
    ['--bad-08', 'rgba(159, 130, 5, 0.08)'], ['--bad-text', '#5b4a00'],
  ]),
};

test('the sweep reports a filled label under AA', () => {
  const rows = sweep(FAILING.themes, FAILING.values);
  const bad = rows.find((row) => row.style === 'bad' && row.fill === 'filled');
  assert.ok(bad.ratio < 4.5, `expected a failure, got ${bad.ratio}`);
  const ok = rows.find((row) => row.style === 'ok' && row.fill === 'filled');
  assert.ok(ok.ratio >= 4.5);
});

test('a tonal ground is composited, so an 8% state layer is not read as paint', () => {
  const rows = sweep(FAILING.themes, FAILING.values);
  const tonal = rows.find((row) => row.style === 'bad' && row.fill === 'tonal');
  // Read as solid this is ~1.3:1; composited over white it clears AA easily.
  assert.ok(tonal.ratio > 4.5, `expected the composited ratio, got ${tonal.ratio}`);
});

/**
 * The record, in a scratch tree, and the two sets opened over it the way the
 * check opens them.
 *
 * Since #601 the classification is `scripts/lib/ratchet.mjs` and only the
 * wording is here, so a test that handed `findings` a plain object would assert
 * the sentences and nothing about the wiring — and the wiring is where a
 * migration goes wrong. The `notes` map is written because the record declares
 * its reasons BESIDE both sets, which is the half of this shape that a rewrite
 * would have deleted.
 */
function worded(themes, values, { contrast = [], duplicates = [], notes = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'button-contrast-record-'));
  const file = 'docs/evals/button-contrast-baseline.json';
  fs.mkdirSync(path.join(root, 'docs/evals'), { recursive: true });
  fs.writeFileSync(
    path.join(root, file),
    `${JSON.stringify({ why: 'a scratch record', contrast, duplicates, notes }, null, 2)}\n`,
  );
  try {
    return findings(themes, values, {
      contrast: openRatchet({ file, set: 'contrast', repoRoot: root }),
      duplicates: openRatchet({ file, set: 'duplicates', repoRoot: root }),
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('findings reports that failure, and the baseline silences it', () => {
  const loud = worded(FAILING.themes, FAILING.values);
  assert.equal(loud.length, 1);
  assert.match(loud[0], /^bad\/filled: label is 3\.7:1/);

  const quiet = worded(FAILING.themes, FAILING.values, {
    contrast: ['bad/filled'],
    notes: { 'bad/filled': 'A token decision this fixture does not have to make. #268.' },
  });
  assert.deepEqual(quiet, []);
});

test('a baseline entry that no longer fails is itself a finding', () => {
  const found = worded(FAILING.themes, FAILING.values, {
    contrast: ['bad/filled', 'ok/filled'],
    notes: {
      'bad/filled': 'A token decision this fixture does not have to make. #268.',
      'ok/filled': 'Recorded and then fixed, which is what this case is about.',
    },
  });
  assert.equal(found.length, 1);
  assert.match(found[0], /baseline entry "ok\/filled" no longer fails/);
});

test('no record at all is the one stated error mode, not an empty baseline', () => {
  // An empty baseline reads as a GREEN ratchet, so the absent case has to be
  // loud — and it is the module's sentence, worded once for all twelve records.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'button-contrast-absent-'));
  const file = 'docs/evals/button-contrast-baseline.json';
  const found = findings(FAILING.themes, FAILING.values, {
    contrast: openRatchet({ file, set: 'contrast', repoRoot: root }),
    duplicates: openRatchet({ file, set: 'duplicates', repoRoot: root }),
  });
  fs.rmSync(root, { recursive: true, force: true });
  // ONCE, not once per set: it is one record and one file to write.
  assert.equal(found.filter((line) => /no baseline is recorded at/.test(line)).length, 1);
  assert.match(found.join('\n'), /Record it by hand, with a reason per entry/);
});

test('duplicateGrounds finds two styles pointing at one colour', () => {
  const themes = [
    { style: 'tertiary', main: '--t', onMain: '--on', state: '--s', text: '--x' },
    { style: 'info', main: '--i', onMain: '--on', state: '--s', text: '--x' },
    { style: 'danger', main: '--d', onMain: '--on', state: '--s', text: '--x' },
  ];
  const values = new Map([
    ['--color-surface', '#ffffff'],
    ['--t', '#0e8175'], ['--i', 'var(--t)'], ['--d', '#ba1a1a'],
    ['--on', '#ffffff'], ['--s', 'rgba(0,0,0,0.08)'], ['--x', '#000000'],
  ]);
  assert.deepEqual(duplicateGrounds(themes, values), [['info', 'tertiary']]);

  const found = worded(themes, values);
  assert.match(found.at(-1), /^info\+tertiary: these styles render the same filled ground/);
  assert.deepEqual(
    worded(themes, values, {
      duplicates: ['info+tertiary'],
      notes: { 'info+tertiary': 'Two names, one appearance. A token decision, not this map\u2019s. #268.' },
    }),
    [],
  );
});

test('a duplicate baseline entry that no longer duplicates is a finding', () => {
  const themes = [{ style: 'solo', main: '--t', onMain: '--on', state: '--s', text: '--x' }];
  const values = new Map([
    ['--color-surface', '#ffffff'], ['--t', '#00404a'],
    ['--on', '#ffffff'], ['--s', 'rgba(0,0,0,0.08)'], ['--x', '#000000'],
  ]);
  const found = worded(themes, values, {
    duplicates: ['a+b'],
    notes: { 'a+b': 'Recorded and then fixed, which is what this case is about.' },
  });
  assert.deepEqual(found, ['baseline entry "a+b" no longer duplicates — remove it']);
});

test('an unresolvable token is reported, not scored', () => {
  const themes = [{ style: 'ghosted', main: '--missing', onMain: '--on', state: '--s', text: '--x' }];
  const values = new Map([
    ['--color-surface', '#ffffff'], ['--on', '#ffffff'],
    ['--s', 'rgba(0,0,0,0.08)'], ['--x', '#000000'],
  ]);
  const built = combination(themes[0], 'filled', values);
  assert.deepEqual(built.unresolved, ['--missing']);
  assert.match(worded(themes, values)[0], /cannot resolve --missing/);
});

test('against the real repo, it finds exactly what #312 measured in a browser', () => {
  const { values, themes } = readRepo();
  const rows = sweep(themes, values);

  // Every combination resolves — no token in the map is missing.
  assert.equal(rows.filter((row) => row.ratio === null).length, 0);

  // The one failure, at the value the browser sweep reported.
  const failures = rows.filter((row) => row.ratio < 4.5);
  assert.deepEqual(failures.map((row) => `${row.style}/${row.fill}`), ['warning/filled']);
  assert.equal(failures[0].ratio, 3.7);

  // And the one duplicate.
  assert.deepEqual(duplicateGrounds(themes, values), [['info', 'tertiary']]);
});
