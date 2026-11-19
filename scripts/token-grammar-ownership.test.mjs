/**
 * #622 — the harness has one token grammar.
 *
 * The docs check used to carry its own reader, alias resolver, color key,
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
      /function (terminal|colorKey|dimensionKey|readTokenDefinitions)\(/.test(src),
      false,
      `${file} still holds a token parser of its own`,
    );
  }
});

/**
 * The eight scripts that matched a token name with a pattern of their own now
 * compose the grammar module's. A spelling like `--[\w-]+` or `--[a-z0-9-]+`
 * in one of them is a second grammar: change the naming scheme and it would not
 * follow.
 */
const MATCHERS = [
  'check-docs-token-literals.mjs',
  'check-font-size-literals.mjs',
  'export-kit-art.mjs',
  'lib/ds-usage.mjs',
  'lib/script-reach.mjs',
  'lib/manager-theme.mjs',
  'lib/tokens/retire.mjs',
  'generate-check-scripts.mjs',
];

test('no script spells the token-name pattern itself', () => {
  for (const file of MATCHERS) {
    // A Font Awesome icon name is not a token, and ds-usage reads those with its own tail.
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\\bfa-\(\[a-z0-9-\]\+\)/g, '');
    assert.equal(/--\[(?:\\w|a-z)/.test(src), false, `${file} writes a token-name character class after the dashes`);
    assert.equal(/\[a-z0-9-\]/.test(src), false, `${file} writes the token tail itself`);
    assert.match(src, /design-system\/src\/lib\/tokens\.mjs/, `${file} does not import the grammar module`);
  }
});
