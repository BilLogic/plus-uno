/**
 * The safety property `scripts/lib/tokens/plan.mjs`'s `LEGACY_ALIASES` claims:
 * every old name resolves to the SAME value through its role-token alias as it
 * did before ADR-038, so loading `deep/_legacy-size-aliases.scss` last in
 * `main.scss` changes no pixel. Compiles the real stylesheet with `sass` and
 * diffs each pair's resolved custom property.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEGACY_ALIASES } from './lib/tokens/plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN = join(ROOT, 'design-system/src/styles/main.scss');

function compiledCss() {
  return execFileSync('npx', ['sass', '--load-path', join(ROOT, 'design-system/src'), '--quiet', MAIN], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
}

/** Every `--name: value;` declaration in the compiled CSS, LAST one wins (cascade order, :root only). */
function declarations(css) {
  const map = new Map();
  for (const [, name, value] of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    map.set(name, value.trim());
  }
  return map;
}

/** Follow a chain of `var(--x)` references to its literal value. */
function resolve(name, map, seen = new Set()) {
  if (seen.has(name)) throw new Error(`cycle resolving ${name}`);
  seen.add(name);
  const value = map.get(name);
  if (value === undefined) throw new Error(`${name} is not declared anywhere in the compiled CSS`);
  const ref = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(value);
  return ref ? resolve(ref[1], map, seen) : value;
}

test('every legacy size alias resolves to the same value as the new role token', () => {
  const map = declarations(compiledCss());
  for (const { old, role } of LEGACY_ALIASES) {
    assert.equal(resolve(old, map), resolve(role, map), `${old} should resolve to the same value as ${role}`);
  }
});
