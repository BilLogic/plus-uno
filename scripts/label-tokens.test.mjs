/**
 * The pad the label components (Status, Count, Tag) draw with: `Pad/pad-x-xs`
 * aliases `space-025` (4), the trailing padding of a pill that ends in a
 * Remove button, beside the other Pad steps.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('--pad-x-xs resolves to 4px, the space-025 step', () => {
  const entry = tokenCorpus({ root: REPO_ROOT, prefix: '--pad-x-' }).get('--pad-x-xs');
  assert.ok(entry, '--pad-x-xs is not declared');
  assert.equal(entry.value, '4px');
});
