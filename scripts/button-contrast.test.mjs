import assert from 'node:assert/strict';
import test from 'node:test';

import {
  combination,
  composite,
  contrast,
  duplicateGrounds,
  findings,
  parseColour,
  readRepo,
  resolveToken,
  sweep,
  themeMap,
  tokenValues,
  toHex,
} from './button-contrast.mjs';

/*
 * The point of this file is that the check can FAIL. A guard exercised only
 * against the repo, which is green by construction once the baseline is
 * written, is a guard nobody has watched work.
 */

test('parseColour reads the three shapes the token file uses', () => {
  assert.deepEqual(parseColour('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColour('#9f8205'), { r: 159, g: 130, b: 5, a: 1 });
  assert.deepEqual(parseColour('rgba(113, 92, 0, 0.08)'), { r: 113, g: 92, b: 0, a: 0.08 });
});

test('parseColour returns null rather than a guess', () => {
  assert.equal(parseColour('currentColor'), null);
  assert.equal(parseColour('var(--color-primary)'), null);
  assert.equal(parseColour('rgb(300, 0, 0)'), null, 'an out-of-range channel is not a colour');
  assert.equal(parseColour('rgba(0, 0, 0, 4)'), null, 'nor is an out-of-range alpha');
  assert.equal(parseColour(undefined), null);
});

test('composite lays an alpha colour over an opaque one', () => {
  const over = composite({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(over, { r: 128, g: 128, b: 128, a: 1 });
});

test('an 8% state layer read as solid is the arithmetic this exists to avoid', () => {
  const page = { r: 249, g: 249, b: 252, a: 1 };
  const layer = parseColour('rgba(113, 92, 0, 0.08)');
  const label = parseColour('#5b4a00');

  const composited = contrast(label, composite(layer, page));
  const asSolid = contrast(label, { ...layer, a: 1 });

  assert.ok(composited > 4.5, `composited should pass, got ${composited}`);
  assert.ok(asSolid < 2, `read as solid it looks like a failure, got ${asSolid}`);
});

test('contrast matches the values WCAG gives for the extremes', () => {
  assert.equal(contrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 21);
  assert.equal(contrast({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }), 1);
});

test('resolveToken follows an alias to the literal behind it', () => {
  const values = new Map([
    ['--color-tertiary', '#0e8175'],
    ['--color-info', 'var(--color-tertiary)'],
  ]);
  assert.equal(resolveToken('--color-info', values), '#0e8175');
});

test('resolveToken terminates on a cycle rather than hanging', () => {
  const values = new Map([['--a', 'var(--b)'], ['--b', 'var(--a)']]);
  assert.equal(resolveToken('--a', values), undefined);
});

test('tokenValues takes the first definition and ignores the rest', () => {
  const values = tokenValues(':root { --color-primary: #123456; }\n.dark { --color-primary: #abcdef; }');
  assert.equal(values.get('--color-primary'), '#123456');
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

test('findings reports that failure, and the baseline silences it', () => {
  const loud = findings(FAILING.themes, FAILING.values);
  assert.equal(loud.length, 1);
  assert.match(loud[0], /^bad\/filled: label is 3\.7:1/);

  const quiet = findings(FAILING.themes, FAILING.values, { contrast: ['bad/filled'], duplicates: [] });
  assert.deepEqual(quiet, []);
});

test('a baseline entry that no longer fails is itself a finding', () => {
  const found = findings(FAILING.themes, FAILING.values, {
    contrast: ['bad/filled', 'ok/filled'],
    duplicates: [],
  });
  assert.equal(found.length, 1);
  assert.match(found[0], /baseline entry "ok\/filled" no longer fails/);
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
});

test('an unresolvable token is reported, not scored', () => {
  const themes = [{ style: 'ghosted', main: '--missing', onMain: '--on', state: '--s', text: '--x' }];
  const values = new Map([
    ['--color-surface', '#ffffff'], ['--on', '#ffffff'],
    ['--s', 'rgba(0,0,0,0.08)'], ['--x', '#000000'],
  ]);
  const built = combination(themes[0], 'filled', values);
  assert.deepEqual(built.unresolved, ['--missing']);
  assert.match(findings(themes, values)[0], /cannot resolve --missing/);
});

test('toHex round-trips a parsed colour', () => {
  assert.equal(toHex(parseColour('#9f8205')), '#9f8205');
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
