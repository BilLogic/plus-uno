import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { cssName, cssColours, normalise, compare, failures } from './figma-colour-drift.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORDING = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'design-system/figma/colour-values.json'), 'utf8'),
);

test('the Figma naming convention maps onto the CSS one', () => {
  assert.equal(cssName('_Primary/Primary'), '--color-primary');
  assert.equal(cssName('_Primary/Primary (Text)'), '--color-primary-text');
  assert.equal(cssName('_Primary/Primary Container'), '--color-primary-container');
  assert.equal(cssName('_Primary/On Primary'), '--color-on-primary');
  assert.equal(cssName('_Primary/On Primary Container'), '--color-on-primary-container');
  assert.equal(cssName('_Primary/Inverse Primary'), '--color-inverse-primary');
  assert.equal(cssName('_Warning/Warning Icon'), '--color-warning-icon');
  assert.equal(cssName('_Warning/Warning Border'), '--color-warning-border');
  assert.equal(cssName('_Mastering-Content/Mastering-Content (Text)'), '--color-mastering-content-text');
  assert.equal(cssName('Neutral Colors/Surface container/surface-container-highest'), '--color-surface-container-highest');
  assert.equal(cssName('Neutral Colors/Alternative/inverse-on-surface'), '--color-inverse-on-surface');
});

test('proposals are not compared', () => {
  // A candidate has no CSS counterpart by definition; treating one as a
  // divergence would make every proposal a failure.
  assert.equal(cssName('_Proposal/Info Bold (candidate)'), null);
});

test('normalise reads every form both sides write', () => {
  assert.equal(normalise('#ABCDEF'), '#abcdef');
  assert.equal(normalise('#abc'), '#aabbcc');
  assert.equal(normalise('rgba(189, 242, 146, 0.5)'), '#bdf292@0.50');
  assert.equal(normalise('rgb(0, 0, 0)'), '#000000');
  assert.equal(normalise('rgba(0, 0, 0, 1)'), '#000000', 'fully opaque loses the suffix on both sides');
  assert.equal(normalise('#000000@0.320'), '#000000@0.32');
  assert.equal(normalise('var(--something)'), null);
});

test('the CSS side follows alias chains', () => {
  const colours = cssColours(REPO_ROOT);
  // --color-info is `var(--color-tertiary)`, and --color-info-icon is
  // `var(--color-info-text)` -> `var(--color-tertiary-text)` — two hops, and
  // across two files, since the role layer lives in its own stylesheet. A
  // scanner that stopped at the first hop would report `var(...)` and be
  // unreadable rather than wrong, which is worse.
  assert.equal(colours.get('--color-info'), colours.get('--color-tertiary'));
  assert.equal(colours.get('--color-info-icon'), colours.get('--color-tertiary-text'));
  assert.match(colours.get('--color-info-icon'), /^#[0-9a-f]{6}$/);
});

test('the repository is in the state the check records', () => {
  const result = compare(RECORDING, cssColours(REPO_ROOT));
  assert.ok(result.compared >= 90, `only ${result.compared} compared`);
  assert.equal(result.unreadable.length, 0);
  assert.deepEqual(
    result.divergences.map((d) => d.token).sort(),
    ['--color-success-container'],
    'scrim was resolved to the M3 0.32; success-container is the one Bill still owns',
  );
});

test('an unrecorded divergence fails; a recorded one does not', () => {
  const result = {
    compared: 1,
    unmapped: [],
    unreadable: [],
    divergences: [{ token: '--color-danger', figmaName: '_Danger/Danger', figma: '#aaa', css: '#bbb' }],
  };
  assert.equal(failures(result, []).length, 1);
  assert.match(failures(result, [])[0], /nothing followed/);
  assert.deepEqual(
    failures(result, [{ token: '--color-danger', figma: '#aaa', css: '#bbb', why: 'x' }]),
    [],
  );
});

test('a known divergence that changed shape fails', () => {
  // Otherwise an exemption written for one difference silently covers the next.
  const result = {
    compared: 1,
    unmapped: [],
    unreadable: [],
    divergences: [{ token: '--color-danger', figmaName: '_D/D', figma: '#aaa', css: '#ccc' }],
  };
  const found = failures(result, [{ token: '--color-danger', figma: '#aaa', css: '#bbb', why: 'x' }]);
  assert.equal(found.length, 1);
  assert.match(found[0], /changed shape/);
});

test('a known divergence that stopped diverging fails', () => {
  const clean = { compared: 1, unmapped: [], unreadable: [], divergences: [] };
  const found = failures(clean, [{ token: '--color-danger', figma: '#aaa', css: '#bbb', why: 'x' }]);
  assert.equal(found.length, 1);
  assert.match(found[0], /no longer diverges/);
});

test('an unreadable pair is a finding, not a silent skip', () => {
  const result = { compared: 0, unmapped: [], unreadable: ['--color-x: figma ?, css ?'], divergences: [] };
  assert.equal(failures(result, []).length, 1);
});

test('the recording is a measurement with its method attached', () => {
  assert.equal(RECORDING.figmaFileKey, 'zAecJNRdvJzAUOcjV32tRX');
  assert.match(RECORDING.measuredAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(RECORDING.method.length > 80, 'reproducible from the file alone');
  assert.equal(Object.keys(RECORDING.variables).length, RECORDING.count);
  assert.ok(
    Object.keys(RECORDING.variables).every((k) => k.includes('::')),
    'each key names its collection, since two collections both define surface-container',
  );
});
