import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { cssName, cssColours, normalise, compare, failures } from './figma-colour-drift.mjs';
import { run } from './check-figma-colour-drift.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORDING = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'design-system/figma/colour-values.json'), 'utf8'),
);

test('the Figma naming convention maps onto the CSS one', () => {
  assert.equal(cssName('Primary/Primary'), '--color-primary');
  assert.equal(cssName('Primary/Primary (Text)'), '--color-primary-text');
  assert.equal(cssName('Primary/Primary Container'), '--color-primary-container');
  assert.equal(cssName('Primary/On Primary'), '--color-on-primary');
  assert.equal(cssName('Primary/On Primary Container'), '--color-on-primary-container');
  assert.equal(cssName('Primary/Inverse Primary'), '--color-inverse-primary');
  assert.equal(cssName('Warning/Warning Icon'), '--color-warning-icon');
  assert.equal(cssName('Warning/Warning Border'), '--color-warning-border');
  assert.equal(cssName('Mastering-Content/Mastering-Content (Text)'), '--color-mastering-content-text');
  assert.equal(cssName('Neutral Colors/Surface container/surface-container-highest'), '--color-surface-container-highest');
  assert.equal(cssName('Neutral Colors/Alternative/inverse-on-surface'), '--color-inverse-on-surface');
});

test('proposals are not compared', () => {
  // A candidate has no CSS counterpart by definition; treating one as a
  // divergence would make every proposal a failure.
  assert.equal(cssName('Proposal/Info Bold (candidate)'), null);
});

test('a name recorded before the 2026-09-06 rename still maps', () => {
  // The accent groups shed their leading `_` that day. The strip in cssName is
  // what keeps an older recording readable, so it is pinned rather than assumed.
  assert.equal(cssName('_Primary/Primary'), '--color-primary');
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
    [],
    'scrim went to the M3 0.32 in CSS; success-container went to #bdf292 in Figma (2026-09-15)',
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

/*
 * The policy half (#611). Measurement above maps names; the gate is a run
 * against a fixture tree — one CSS value that drifted, and an emptied token
 * directory so nothing maps.
 */

/**
 * 90 Figma↔CSS pairs that agree, plus an optional drifted primary.
 *
 * @param {{drift?: boolean}} [opts]
 * @returns {{scss: string, recording: string}}
 */
function colourPairs({ drift = false } = {}) {
  const variables = {};
  const decls = [];
  for (let i = 0; i < 90; i += 1) {
    const hex = `#${i.toString(16).padStart(6, '0')}`;
    variables[`colors / accent::Tone${i}/Tone${i}`] = hex;
    decls.push(`  --color-tone${i}: ${hex};`);
  }
  variables['colors / accent::Primary/Primary'] = '#0472a8';
  decls.push(`  --color-primary: ${drift ? '#000000' : '#0472a8'};`);
  return {
    scss: `:root {\n${decls.join('\n')}\n}\n`,
    recording: JSON.stringify({
      measuredAt: '2026-09-15',
      variables,
    }),
  };
}

test('a CSS colour that drifted from Figma in a fixture tree is a finding', () => {
  const { scss, recording } = colourPairs({ drift: true });
  const { root, done } = policyTree({
    'design-system/src/tokens/_colors.scss': scss,
    'design-system/figma/colour-values.json': recording,
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /--color-primary/.test(message) && /nothing followed/.test(message)),
      `expected a drift finding, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an empty token directory fires the sentinel floor, not a clean sweep', () => {
  const { recording } = colourPairs();
  const { root, done } = policyTree({
    'design-system/figma/colour-values.json': recording,
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty token directory must not report a clean sweep');
    assert.ok(
      found.some((message) => /only 0 variables mapped to a CSS token \(floor 90\)/.test(message)),
      `expected the compared-pairs floor, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});
