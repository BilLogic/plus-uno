/**
 * Tests for the BUTTON half of `check:button-contrast`.
 *
 * The maths — `parseColor`, `composite`, `luminance`, `contrast`,
 * `resolveToken`, `toHex` — moved to `design-system/src/lib/tokens.mjs` in
 * #506, and its tests moved with it to `design-system/tests/tokens.test.js`
 * (run by `npm test`). The ratchet went the same way and then on to
 * `scripts/lib/ratchet.mjs` in #599, where it is asserted against every live
 * baseline record by its own tests — and in #600 this
 * check's own read of its record went with it. What is tested here is what
 * stayed: reading the `$btn-appearances` map, building a ground per appearance
 * and state, the duplicate-ground assertion, the two sides the record is
 * written in, and the wording of every verdict the ratchet can hand back.
 *
 * The point of this file is that the check can FAIL. A guard exercised only
 * against the repo, which is green by construction once the baseline is
 * written, is a guard nobody has watched work.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { toHex } from '../design-system/src/lib/tokens.mjs';
import {
  combination,
  duplicateGrounds,
  findings,
  measured,
  readRepo,
  sweep,
  themeMap,
  tokenValues,
} from './button-contrast.mjs';

test('tokenValues reads the color tokens and only those', () => {
  const values = tokenValues(':root { --color-primary: #123456; --space-2: 8px; }');
  assert.equal(values.get('--color-primary'), '#123456');
  assert.equal(values.has('--space-2'), false, 'a spacing token is not a color this check can resolve');
});

test('tokenValues reads both color vocabularies and the ramps --ds- tokens alias', () => {
  const values = tokenValues(
    ':root { --color-primary: #123456; --ds-text-brand: var(--palette-lagoon-800); --palette-lagoon-800: #106972; --space-2: 8px; }',
  );
  assert.equal(values.get('--color-primary'), '#123456');
  assert.equal(values.get('--ds-text-brand'), 'var(--palette-lagoon-800)');
  assert.equal(values.get('--palette-lagoon-800'), '#106972');
  assert.equal(values.has('--space-2'), false);
});

test('a map written in --ds- tokens is swept through the palette aliases', () => {
  const values = tokenValues(`:root {
    --color-surface: #f9f9fc;
    --palette-lagoon-700: #147b84;
    --palette-neutral-0: #ffffff;
    --palette-yellow-300: #f5e08a;
    --ds-background-brand-bold: var(--palette-lagoon-700);
    --ds-background-brand-bold-hovered: var(--palette-lagoon-700);
    --ds-background-brand-bold-pressed: var(--palette-lagoon-700);
    --ds-text-inverse: var(--palette-neutral-0);
    --ds-text-pale: var(--palette-yellow-300);
  }`);
  const themes = themeMap(`
$btn-appearances: (
    'brand': ('--ds-background-brand-bold', '--ds-text-inverse', '--i', '--ds-background-brand-bold-hovered', '--ds-background-brand-bold-pressed', 'transparent'),
    'pale': ('--ds-background-brand-bold', '--ds-text-pale', '--i', '--ds-background-brand-bold-hovered', '--ds-background-brand-bold-pressed', 'transparent')
);`);
  const rows = sweep(themes, values);
  assert.equal(rows.filter((row) => row.ratio === null).length, 0, 'every --ds- slot resolves through its palette alias');
  assert.deepEqual(measured(themes, values).contrast, ['pale/rest', 'pale/hovered', 'pale/pressed']);
  assert.deepEqual(measured(themes, values).duplicates, ['brand+pale']);
});

test('themeMap reads the map rather than a copy of it', () => {
  const themes = themeMap(`
$btn-appearances: (
    'primary': ('--g', '--l', '--i', '--h', '--p', 'transparent'),
    'danger': ('--dg', '--dl', '--di', '--dh', '--dp', '--e')
);`);
  assert.equal(themes.length, 2);
  assert.deepEqual(themes[0], {
    appearance: 'primary',
    ground: '--g',
    label: '--l',
    icon: '--i',
    hovered: '--h',
    pressed: '--p',
    edge: 'transparent',
  });
});

/** A two-appearance map with one failing combination, built to fail. */
const FAILING = {
  themes: [
    { appearance: 'ok', ground: '--ok', label: '--on-ok', hovered: '--ok', pressed: '--ok', edge: 'transparent' },
    { appearance: 'bad', ground: '--bad', label: '--on-bad', hovered: '--ok', pressed: '--ok', edge: 'transparent' },
  ],
  values: new Map([
    ['--color-surface', '#ffffff'],
    ['--ok', '#00404a'], ['--on-ok', '#ffffff'],
    ['--bad', '#9f8205'], ['--on-bad', '#ffffff'],
  ]),
};

test('the sweep reports a label under AA', () => {
  const rows = sweep(FAILING.themes, FAILING.values);
  const bad = rows.find((row) => row.appearance === 'bad' && row.state === 'rest');
  assert.ok(bad.ratio < 4.5, `expected a failure, got ${bad.ratio}`);
  const ok = rows.find((row) => row.appearance === 'ok' && row.state === 'rest');
  assert.ok(ok.ratio >= 4.5);
});

test('a transparent ground is the page, and an alpha step is composited over it', () => {
  const values = new Map([
    ['--color-surface', '#ffffff'], ['--label', '#000000'], ['--clear', 'transparent'], ['--step', 'rgba(0, 0, 0, 0.08)'],
  ]);
  const theme = { appearance: 'subtle', ground: '--clear', label: '--label', hovered: '--step', pressed: '--step', edge: 'transparent' };
  const rest = combination(theme, 'rest', values);
  assert.equal(toHex(rest.ground), '#ffffff');
  const hovered = combination(theme, 'hovered', values);
  assert.notEqual(toHex(hovered.ground), '#ffffff', 'an 8% step over white is not white');
  assert.notEqual(toHex(hovered.ground), '#000000', 'and is not read as solid black');
});

test('the measured side is the record shape, and the failure is in it', () => {
  // What the ratchet is handed (#600): two arrays of keys, the shape
  // `scripts/baselines/button-contrast-baseline.json` holds.
  assert.deepEqual(measured(FAILING.themes, FAILING.values), { contrast: ['bad/rest'], duplicates: [] });
});

test('findings words a failure the ratchet called new, and says nothing about a recorded one', () => {
  const loud = findings(FAILING.themes, FAILING.values, { contrast: { fresh: ['bad/rest'] } });
  assert.equal(loud.length, 1);
  assert.match(loud[0], /^bad\/rest: label is 3\.7:1/);

  // Nothing new is nothing said. Which keys are new is the ratchet's call and
  // is asserted once, in scripts/lib/ratchet.test.mjs.
  assert.deepEqual(findings(FAILING.themes, FAILING.values, {}), []);
});

test('a baseline entry that no longer fails is itself a finding', () => {
  const found = findings(FAILING.themes, FAILING.values, { contrast: { stale: ['ok/rest'] } });
  assert.equal(found.length, 1);
  assert.match(found[0], /baseline entry "ok\/rest" no longer fails/);
});

test('duplicateGrounds finds two appearances drawing one look, and an edge tells two apart', () => {
  const themes = [
    { appearance: 'a', ground: '--t', label: '--x', hovered: '--t', pressed: '--t', edge: 'transparent' },
    { appearance: 'b', ground: '--i', label: '--x', hovered: '--t', pressed: '--t', edge: 'transparent' },
    { appearance: 'c', ground: '--i', label: '--x', hovered: '--t', pressed: '--t', edge: '--line' },
  ];
  const values = new Map([
    ['--color-surface', '#ffffff'], ['--t', '#0e8175'], ['--i', 'var(--t)'], ['--x', '#ffffff'], ['--line', '#888888'],
  ]);
  assert.deepEqual(duplicateGrounds(themes, values), [['a', 'b']]);
  assert.deepEqual(measured(themes, values).duplicates, ['a+b']);

  const found = findings(themes, values, { duplicates: { fresh: ['a+b'] } });
  assert.match(found.at(-1), /^a\+b: these appearances draw the same ground and edge/);
  assert.deepEqual(findings(themes, values, {}), []);
});

test('a duplicate baseline entry that no longer duplicates is a finding', () => {
  const themes = [{ appearance: 'solo', ground: '--t', label: '--x', hovered: '--t', pressed: '--t', edge: 'transparent' }];
  const values = new Map([['--color-surface', '#ffffff'], ['--t', '#00404a'], ['--x', '#ffffff']]);
  const found = findings(themes, values, { duplicates: { stale: ['a+b'] } });
  assert.deepEqual(found, ['baseline entry "a+b" no longer duplicates — remove it']);
});

test('an unresolvable token is reported, not scored', () => {
  const themes = [{ appearance: 'ghosted', ground: '--missing', label: '--x', hovered: '--x', pressed: '--x', edge: 'transparent' }];
  const values = new Map([['--color-surface', '#ffffff'], ['--x', '#000000']]);
  const built = combination(themes[0], 'rest', values);
  assert.deepEqual(built.unresolved, ['--missing']);
  assert.match(findings(themes, values)[0], /cannot resolve --missing/);
});

test('against the real repo, every label clears AA and every appearance draws its own look', () => {
  const { values, themes } = readRepo();
  const rows = sweep(themes, values);

  // Every combination resolves: no token in the map is missing.
  assert.equal(rows.filter((row) => row.ratio === null).length, 0);
  assert.deepEqual(rows.filter((row) => row.ratio < 4.5), []);
  assert.deepEqual(duplicateGrounds(themes, values), []);
  assert.deepEqual(
    themes.map((theme) => theme.appearance),
    ['default', 'primary', 'subtle', 'warning', 'danger', 'discovery', 'ai', 'selected'],
  );
});
