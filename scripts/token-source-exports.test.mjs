/**
 * Token source export invariants:
 * - No source file or frame-layer collection uses a `patterns` name (renamed to `templates`).
 * - Every `WEB` code syntax (`var(--name)`) in `design-system/src/tokens/source/*.json`
 *   names a token with a live declaration in the generated SCSS.
 * - `scripts/generate-all-tokens.js` no longer carries the retired `old` drop list.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TOKEN_DIR, tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { FRAME_LAYER_COLLECTIONS } from './lib/frame-layer-collections.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(REPO_ROOT, TOKEN_DIR, 'source');
const WEB_SYNTAX = /^var\((--[a-z0-9-]+)\)$/;

test('token source filenames and frame-layer collections hold no patterns name', () => {
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.json'));
  assert.ok(files.length > 0, 'no token source files found');
  for (const file of files) {
    assert.doesNotMatch(file, /\bpatterns\b/, `${file} still uses a patterns collection name`);
  }
  for (const { name, heading } of FRAME_LAYER_COLLECTIONS) {
    assert.doesNotMatch(name, /\bpatterns\b/, `collection "${name}" still uses patterns`);
    assert.doesNotMatch(heading, /\bpatterns\b/, `heading "${heading}" still uses patterns`);
  }
});

test('every WEB code syntax in token source JSONs resolves to a live SCSS token', () => {
  const corpus = tokenCorpus({ root: REPO_ROOT });
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.json')).sort();
  const dead = [];
  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8'));
    for (const v of json.variables) {
      if (v.resolvedType === 'BOOLEAN') continue;
      const web = v.codeSyntax?.WEB;
      const match = WEB_SYNTAX.exec(web ?? '');
      if (!match) {
        dead.push(`${file} > ${v.name}: missing or malformed WEB code syntax (${web ?? 'none'})`);
        continue;
      }
      if (!corpus.has(match[1])) {
        dead.push(`${file} > ${v.name}: ${match[1]} has no live SCSS definition`);
      }
    }
  }
  assert.deepEqual(dead, []);
});

test('generate-all-tokens.js no longer imports RETIRED_TOKENS', () => {
  const generator = fs.readFileSync(path.join(REPO_ROOT, 'scripts/generate-all-tokens.js'), 'utf8');
  assert.doesNotMatch(generator, /\bRETIRED_TOKENS\b/);
});
