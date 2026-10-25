// The migration map: aliases only where a name has one target, every target
// exists, the coverage scan catches an unmapped name, and the SCSS follows modes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildPlan } from './build.mjs';
import { ALIASES, ROWS, aliasScss, legacyCoverage, missingTargets, rowFor } from './legacy-map.mjs';

test('every alias sits on the row that matches its name', () => {
  for (const row of ROWS) {
    for (const legacy of Object.keys(row.aliases ?? {})) assert.equal(rowFor(legacy), row, legacy);
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

test("every alias target is named in its row's proposal, so the aliases cannot drift from the map", () => {
  for (const row of ROWS) {
    for (const [legacy, token] of Object.entries(row.aliases ?? {})) assert.ok(proposes(row.proposed, token), `${legacy} -> ${token} is not in "${row.proposed}"`);
  }
});

test('the proposal check rejects a target the row does not name', () => {
  assert.equal(proposes('elevation.surface / .raised / .overlay / .sunken', 'elevation.surface.raised'), true);
  assert.equal(proposes('elevation.shadow.raised / .overlay', 'elevation.shadow.overlay'), true);
  assert.equal(proposes('color.text.brand', 'color.text.subtle'), false);
  assert.equal(proposes('color.border.bold (hover edge)', 'color.border'), false);
});

test('every alias target is a token both plans emit', () => {
  for (const key of ['A', 'B']) assert.deepEqual(missingTargets(buildPlan(key).semantics), [], `Plan ${key}`);
});

test('a missing target is reported', () => {
  const semantics = structuredClone(buildPlan('A').semantics);
  semantics.rows = semantics.rows.filter((r) => r.name !== 'color.blanket');
  assert.deepEqual(missingTargets(semantics), ['--color-scrim aliases color.blanket, which the generator does not emit']);
});

test('names that split by property, state layers and the hue families are not aliased', () => {
  for (const name of [
    '--color-primary', '--color-on-primary', '--color-outline-variant', '--color-surface', '--color-on-surface',
    '--color-primary-state-08', '--color-on-surface-state-12', '--color-danger-text', '--color-info',
    '--color-tertiary-container', '--color-relationship-text', '--color-outline-state-12',
  ]) {
    assert.ok(rowFor(name), `${name} has a row`);
    assert.equal(ALIASES[name], undefined, name);
  }
});

test('the alias sheet resolves on :root and on any element carrying a mode', () => {
  const css = aliasScss('// header\n');
  assert.match(css, /^\/\/ header\n:root,\n\[data-color-mode\],\n\[data-contrast-mode\] \{\n/);
  assert.match(css, /^ {2}--color-disabled-opacity: var\(--ds-opacity-disabled\);$/m);
  assert.match(css, /^ {2}--surface-sunken: var\(--ds-surface-sunken\);$/m);
  assert.match(css, /^ {2}--elevation-light-3: var\(--ds-shadow-overlay\);$/m);
  assert.doesNotMatch(css, /var\(--ds-[^)]*,/, 'no fallbacks');
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
