/**
 * The components existence index (AGENTS.md hard rule 1: "a component absent
 * from the index does not exist") has to list every component the
 * `@/components` barrel exports. This reads the barrel and the committed
 * index independently of the generator's own reader, so a regression in the
 * reader cannot hide the components it drops.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripComments } from './lib/barrel-exports.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BARREL = path.join(REPO_ROOT, 'design-system/src/components/index.js');
const INDEX = path.join(REPO_ROOT, 'design-system/agent-views/components/index.md');

/** Component names: every `default as X` in a live (uncommented) export list. */
function barrelComponents() {
  const src = stripComments(fs.readFileSync(BARREL, 'utf8'));
  return [...src.matchAll(/default\s+as\s+([A-Za-z0-9_$]+)/g)].map((m) => m[1]);
}

test('the components index lists every component the barrel exports', () => {
  const index = fs.readFileSync(INDEX, 'utf8');
  const components = barrelComponents();
  assert.ok(components.length > 40, `barrel read found only ${components.length} components`);
  const missing = components.filter((name) => !new RegExp(`^- (\\[${name}\\]\\(|${name} — )`, 'm').test(index));
  assert.deepEqual(missing, [], `absent from agent-views/components/index.md: ${missing.join(', ')}`);
});
