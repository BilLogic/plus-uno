import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(REPO_ROOT, 'design-system/figma/token-registry.json');
const corpus = tokenCorpus();

test('the small element radius is 2px, as Figma and the Input fallback say', () => {
  const token = corpus.get('--size-element-radius-sm');
  assert.equal(token?.raw, 'var(--size-border-radius-radius-50)');
  assert.equal(token?.value, '2px');
});

test('the four Figma surface roles resolve under their colour names', () => {
  // Figma's `Surface roles/*` alias Surface Container Lowest (#ffffff), except
  // sunken, which aliases Surface (#f9f9fc).
  const expected = {
    '--color-surface-default': '#ffffff',
    '--color-surface-overlay': '#ffffff',
    '--color-surface-raised': '#ffffff',
    '--color-surface-sunken': '#f9f9fc',
  };
  for (const [name, value] of Object.entries(expected)) {
    assert.equal(corpus.get(name)?.value?.toLowerCase(), value, name);
  }
});

test("Figma's Element/opacity-disabled maps to the existing disabled opacity", () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  assert.equal(registry.mappings.colors['Element/opacity-disabled'], 'var(--color-disabled-opacity)');
  assert.equal(corpus.get('--color-disabled-opacity')?.value, '0.38');
});
