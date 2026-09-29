/**
 * The tokens the label components (Status, Count, Tag) draw with, pinned to
 * the values the BS4 Foundation variables hold.
 *
 * - `Element/pad-x-xs` aliases `space-050` (4): the trailing padding of a pill
 *   that ends in a Remove button, beside the other Element padding steps.
 * - `<Hue> (Border)` is the hue at 45% alpha, the border of every outlined
 *   label. A paint opacity on a bound colour does not carry into Figma
 *   instances, so the alpha lives in the token rather than at the use site.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { cssColours, normalise } from './figma-colour-drift.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HUES = [
  'success',
  'warning',
  'danger',
  'tertiary',
  'mastering-content',
  'advocacy',
  'relationship',
  'social-emotional',
  'technology-tools',
];

test('--size-element-pad-x-xs resolves to 4px, the space-050 step', () => {
  const entry = tokenCorpus({ root: REPO_ROOT, prefix: '--size-element-' }).get('--size-element-pad-x-xs');
  assert.ok(entry, '--size-element-pad-x-xs is not declared');
  assert.equal(entry.value, '4px');
});

test('--color-info-border-subtle is the tertiary one, as every info token is', () => {
  const colours = cssColours(REPO_ROOT);
  assert.equal(colours.get('--color-info-border-subtle'), colours.get('--color-tertiary-border-subtle'));
});

for (const hue of HUES) {
  test(`--color-${hue}-border-subtle is --color-${hue} at 45%`, () => {
    const colours = cssColours(REPO_ROOT);
    const token = `--color-${hue}-border-subtle`;
    assert.equal(colours.has(token), true, `${token} is not declared`);
    const [base] = normalise(colours.get(`--color-${hue}`)).split('@');
    assert.equal(normalise(colours.get(token)), `${base}@0.45`);
  });
}
