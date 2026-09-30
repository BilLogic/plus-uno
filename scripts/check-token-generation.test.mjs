/**
 * The verdict half of `check:token-generation`: which generator exits pass.
 *
 * The only accepted non-zero exit is the shrink refusal. A stale exception, a
 * thrown error or any other refusal fails the check and quotes the generator,
 * so printing a refusal is not a way to keep CI green.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { SHRINK_REFUSAL, verdict } from './check-token-generation.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('a clean run passes', () => {
  assert.deepEqual(verdict({ status: 0, output: 'No file would lose a token.' }), []);
});

test('the shrink refusal, exiting 1, passes', () => {
  assert.deepEqual(verdict({ status: 1, output: `❌ Refusing to write. ${SHRINK_REFUSAL}.` }), []);
});

test('the shrink refusal exiting 0 is cosmetic, and fails', () => {
  const [finding] = verdict({ status: 0, output: `❌ Refusing to write. ${SHRINK_REFUSAL}.` });
  assert.match(finding, /cosmetic/);
});

test('a stale exception fails, and the finding quotes the generator', () => {
  const output =
    'Generating token SCSS files...\n\n❌ Stale exception. These exceptions no longer describe a difference from Figma:\n\n' +
    "   SEMANTIC_OVERRIDES: Figma's element-radius-sm is now var(--size-border-radius-radius-100)\n";
  const [finding] = verdict({ status: 1, output });
  assert.match(finding, /exited 1, and not because a file would shrink/);
  assert.match(finding, /Stale exception/);
  assert.match(finding, /SEMANTIC_OVERRIDES: Figma's element-radius-sm/);
  assert.doesNotMatch(finding, /Generating token SCSS files/);
});

test('a thrown error fails, even in the legacy wording that says "Refusing to write"', () => {
  const [finding] = verdict({ status: 1, output: '❌ Refusing to write. size _ semantics.json: 2 modes.' });
  assert.match(finding, /not because a file would shrink/);
  assert.match(finding, /2 modes/);
});

test('the generator prints the exact marker this check accepts', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'scripts/generate-all-tokens.js'), 'utf8');
  assert.ok(source.includes(SHRINK_REFUSAL), 'the shrink refusal text drifted from SHRINK_REFUSAL');
  assert.equal(source.split(SHRINK_REFUSAL).length - 1, 1, 'only the shrink refusal may carry the marker');
});
