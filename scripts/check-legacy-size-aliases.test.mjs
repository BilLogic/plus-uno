/**
 * The safety property `scripts/lib/tokens/plan.mjs`'s `LEGACY_ALIASES` claims:
 * every old name resolves to the SAME value through its role-token alias as it
 * did before ADR-038, so loading `deep/_legacy-size-aliases.scss` last in
 * `main.scss` changes no pixel.
 *
 * Reads the committed declarations directly (no `sass` compile — CI does not
 * carry the `sass` CLI, and a pure declaration read needs no build step: every
 * file here is a flat `:root { --name: value; }` block, already the form
 * `tokenDeclarationPattern` parses) and resolves each side's `var()` chain by
 * hand to a literal value.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEGACY_ALIASES } from './lib/tokens/plan.mjs';
import { artifacts } from './generate-design-tokens.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The non-responsive legacy declaration files every `LEGACY_ALIASES.old` name lives in. */
const LEGACY_FILES = [
  'design-system/src/tokens/_spacing_semantics.scss',
  'design-system/src/tokens/_frame_layers.scss',
  'design-system/src/tokens/_scales.scss',
  'design-system/src/tokens/_primitives.scss',
];

/** Every `--name: value;` across the legacy files and the generated artifacts, first definition wins. */
function declarations() {
  const map = new Map();
  const texts = [
    ...LEGACY_FILES.map((rel) => readFileSync(join(ROOT, rel), 'utf8')),
    ...artifacts().map(({ content }) => content),
  ];
  for (const text of texts) {
    for (const [, name, value] of text.matchAll(tokenDeclarationPattern())) {
      if (!map.has(name)) map.set(name, value.trim());
    }
  }
  return map;
}

/** Follow a chain of `var(--x)` references to its literal value. */
function resolve(name, map, seen = new Set()) {
  if (seen.has(name)) throw new Error(`cycle resolving ${name}`);
  seen.add(name);
  const value = map.get(name);
  if (value === undefined) throw new Error(`${name} is not declared in any legacy or generated token file`);
  const ref = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(value);
  return ref ? resolve(ref[1], map, seen) : value;
}

test('every legacy size alias resolves to the same value as the new role token', () => {
  const map = declarations();
  for (const { old, role } of LEGACY_ALIASES) {
    assert.equal(resolve(old, map), resolve(role, map), `${old} should resolve to the same value as ${role}`);
  }
});
