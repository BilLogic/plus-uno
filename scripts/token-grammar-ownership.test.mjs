/**
 * #622 — the harness has one token grammar.
 *
 * The docs check used to carry its own reader, alias resolver, colour key,
 * dimension key and family map. The registry generator used the loosest
 * `var()` in the tree (`var((--[^)]+))`, which swallows a fallback as the
 * name). The font-family check restated the declaration and `var()` patterns
 * four times. This file is the acceptance criterion: those spellings are
 * gone, and the module's `tokenDeclarationPattern` / `varReferencePattern`
 * are what remains.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const FILES = [
  'check-docs-token-literals.mjs',
  'generate-token-registry.mjs',
  'font-families.mjs',
];

test('every declaration and var() pattern in the named checks comes from the grammar module', () => {
  for (const file of FILES) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.equal(
      src.includes('(--[\\w-]+)'),
      false,
      `${file} restates a grammar that allows uppercase and underscore`,
    );
    assert.equal(
      src.includes('var\\((--[^)]+)'),
      false,
      `${file} uses the loosest var() in the tree, which captures a fallback as the name`,
    );
    assert.equal(
      src.includes('--font-family-[a-z0-9-]+'),
      false,
      `${file} restates the font-family prefix instead of composing the module's patterns`,
    );
    assert.equal(
      /function (terminal|colourKey|dimensionKey|readTokenDefinitions)\(/.test(src),
      false,
      `${file} still holds a token parser of its own`,
    );
  }
});
