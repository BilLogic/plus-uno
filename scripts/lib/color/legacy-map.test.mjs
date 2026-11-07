// The migration map: retired only where a name had one target, every target
// exists, and the coverage scan catches an unmapped name.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildPlan } from './build.mjs';
import { composite } from './checks.mjs';
import { PAIRS, RETIRED_LEGACY, ROWS, legacyCoverage, missingTargets, pairFailures, rowFor } from './legacy-map.mjs';
import { contrast } from './oklch.mjs';

test('every retired name sits on the row that matches its name', () => {
  for (const row of ROWS) {
    for (const legacy of Object.keys(row.retired ?? {})) assert.equal(rowFor(legacy), row, legacy);
  }
});

/**
 * Does the row's proposal text name this token? Literally, or as a sibling
 * written in the proposal's shorthand: `elevation.surface / .raised` names
 * elevation.surface.raised, `elevation.shadow.raised / .overlay` names
 * elevation.shadow.overlay.
 */
function proposes(proposed, token) {
  const full = proposed.match(/\b(?:color|elevation|opacity)(?:\.[a-z]+)+/g) ?? [];
  if (full.includes(token)) return true;
  return full.some((t) => {
    for (const base of [t, t.slice(0, t.lastIndexOf('.'))]) {
      if (token.startsWith(`${base}.`) && proposed.includes(` .${token.slice(base.length + 1)}`)) return true;
    }
    return false;
  });
}

test("every retired name's target is named in its row's proposal, so the record cannot drift from the map", () => {
  for (const row of ROWS) {
    for (const [legacy, token] of Object.entries(row.retired ?? {})) assert.ok(proposes(row.proposed, token), `${legacy} -> ${token} is not in "${row.proposed}"`);
  }
});

test('the proposal check rejects a target the row does not name', () => {
  assert.equal(proposes('elevation.surface / .raised / .overlay / .sunken', 'elevation.surface.raised'), true);
  assert.equal(proposes('elevation.shadow.raised / .overlay', 'elevation.shadow.overlay'), true);
  assert.equal(proposes('color.text.brand', 'color.text.subtle'), false);
  assert.equal(proposes('color.border.bold (hover edge)', 'color.border'), false);
});

test('every retired name\'s target is a token both plans emit', () => {
  for (const key of ['A', 'B']) assert.deepEqual(missingTargets(buildPlan(key).semantics), [], `Plan ${key}`);
});

test('a missing target is reported', () => {
  const semantics = structuredClone(buildPlan('A').semantics);
  semantics.rows = semantics.rows.filter((r) => r.name !== 'color.blanket');
  assert.deepEqual(missingTargets(semantics), ['--color-scrim moved to color.blanket, which the generator does not emit']);
});

test('names that split by property and the hue families are not retired', () => {
  for (const name of [
    '--color-primary', '--color-on-primary', '--color-outline-variant', '--color-surface', '--color-on-surface',
    '--color-danger-text', '--color-info',
    '--color-tertiary-container', '--color-relationship-text',
    '--color-primary-text', '--color-secondary-text', '--color-primary-container', '--surface-sunken',
  ]) {
    assert.ok(rowFor(name), `${name} has a row`);
    assert.equal(RETIRED_LEGACY[name], undefined, name);
  }
});

test('coverage: the repo has a row for every in-use name', () => {
  assert.deepEqual(legacyCoverage().unmapped, []);
});

test('coverage: an unmapped name fails, an undefined one is listed apart, a test fixture is ignored', () => {
  const root = mkdtempSync(join(tmpdir(), 'legacy-map-'));
  try {
    mkdirSync(join(root, 'design-system/src'), { recursive: true });
    writeFileSync(join(root, 'design-system/src/tokens.scss'), ':root { --color-brand-new: #000; --color-scrim: #000; }\n');
    writeFileSync(join(root, 'design-system/src/a.scss'), '.a { color: var(--color-brand-new); background: var(--color-scrim); border-color: var(--color-nowhere); }\n');
    writeFileSync(join(root, 'design-system/src/a.test.js'), "const x = 'var(--color-brand-new)';\n");
    const c = legacyCoverage({ root });
    assert.deepEqual(c.unmapped, [['--color-brand-new', 1]]);
    assert.deepEqual(c.undefinedNames, ['--color-nowhere']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const pairs = (names, retired) => pairFailures(names, buildPlan('A').semantics, contrast, composite, retired);

test('pairs: the repo retires partners together or not at all, and passes 4.5:1 where it does', () => {
  assert.deepEqual(pairs(legacyCoverage().used.keys()), []);
  for (const key of ['A', 'B']) assert.deepEqual(pairFailures(legacyCoverage().used.keys(), buildPlan(key).semantics, contrast, composite), [], `Plan ${key}`);
});

test('pairs: brand text retired alone, against the legacy primary container, fails before Storybook does', () => {
  const failures = pairs(['--color-primary-text', '--color-primary-container'], { ...RETIRED_LEGACY, '--color-primary-text': 'color.text.brand' });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /--color-primary-text retired but --color-primary-container not/);
});

test('pairs: a fully retired pair that loses contrast fails', () => {
  const failures = pairs([], { ...RETIRED_LEGACY, '--color-inverse-on-surface': 'color.text.subtlest' });
  assert.ok(failures.some((f) => /--color-inverse-on-surface on --color-inverse-surface is \d/.test(f)), failures.join('\n'));
});

test('pairs: every group names a foreground and a ground', () => {
  for (const group of PAIRS) assert.ok(group.fg.length && group.bg.length, group.label);
});
