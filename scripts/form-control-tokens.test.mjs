import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(REPO_ROOT, 'design-system/figma/token-registry.json');
const corpus = tokenCorpus();

test('the medium radius stays 4px: Storybook won the conflict with Figma', () => {
  const token = corpus.get('--radius-md');
  assert.equal(token?.raw, 'var(--radius-025)');
  assert.equal(token?.value, '4px');
});

test("Figma's Element/opacity-disabled maps to the generated disabled opacity", () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  assert.equal(registry.mappings.colors['Element/opacity-disabled'], 'var(--ds-opacity-disabled)');
  assert.equal(corpus.get('--ds-opacity-disabled')?.value, '0.4');
});
