/**
 * The size roles and the table cell pad, as code reads them after generation.
 *
 * - One primitive size scale is used through five roles: Icon, Indicator,
 *   Control, Row and Media. A role token is an alias of a spacing primitive,
 *   never a number of its own.
 * - A table cell has `pad-x`, `pad-y` and an `inline` gap, named by the same
 *   grammar as the rest of the layers (`pad` when all four sides match,
 *   `pad-x` + `pad-y` when they differ). The older `cell-x`, `cell-y` and
 *   `cell-gap` still resolve, and cell-x and cell-gap move from 10 to 12.
 * - No token name carries the word "section" for these roles.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';

const corpus = tokenCorpus();

/** name -> [px, the primitive it points at] */
const ROLES = {
  '--size-icon-sm': [12, '--size-spacing-medium-space-200'],
  '--size-icon-md': [16, '--size-spacing-medium-space-300'],
  '--size-icon-lg': [24, '--size-spacing-medium-space-500'],
  '--size-indicator-sm': [16, '--size-spacing-medium-space-300'],
  '--size-indicator-md': [20, '--size-spacing-medium-space-400'],
  '--control-sm': [24, '--size-150'],
  '--control-md': [32, '--size-200'],
  '--control-lg': [40, '--size-250'],
  '--size-row-compact': [32, '--size-spacing-large-space-600'],
  '--size-row-default': [40, '--size-spacing-large-space-700'],
  '--size-row-comfortable': [48, '--size-spacing-large-space-800'],
  '--size-media-xxs': [16, '--size-spacing-medium-space-300'],
  '--size-media-xs': [20, '--size-spacing-medium-space-400'],
  '--size-media-sm': [24, '--size-spacing-medium-space-500'],
  '--size-media-md': [32, '--size-spacing-large-space-600'],
  '--size-media-lg': [40, '--size-spacing-large-space-700'],
  '--size-media-xl': [48, '--size-spacing-large-space-800'],
};

const TABLE = {
  '--size-table-cell-pad-x': [12, '--size-spacing-medium-space-200'],
  '--size-table-cell-pad-y': [8, '--size-spacing-small-space-100'],
  '--size-table-cell-inline': [12, '--size-spacing-medium-space-200'],
};

for (const [group, tokens] of Object.entries({ ROLES, TABLE })) {
  for (const [name, [px, target]] of Object.entries(tokens)) {
    test(`${group}: ${name} is ${px}px through ${target}`, () => {
      const entry = corpus.get(name);
      assert.ok(entry, `${name} is not declared`);
      assert.equal(entry.raw, `var(${target})`);
      assert.equal(entry.value, `${px}px`);
    });
  }
}

test('the older table cell tokens follow the new ones: 10 moves to 12, cell-y stays 8', () => {
  assert.equal(corpus.get('--size-table-cell-x')?.value, '12px');
  assert.equal(corpus.get('--size-table-cell-gap')?.value, '12px');
  assert.equal(corpus.get('--size-table-cell-y')?.value, '8px');
});

test('nothing else in the size family changes value', () => {
  const unchanged = {
    '--size-card-pad-x-md': '20px',
    '--size-modal-pad-x-md': '16px',
    '--size-table-radius-md': '8px',
    '--size-table-radius-sm': '6px',
  };
  for (const [name, value] of Object.entries(unchanged)) assert.equal(corpus.get(name)?.value, value, name);
});

test('no role or table token is named for a Section', () => {
  const minted = [...Object.keys(ROLES), ...Object.keys(TABLE)];
  for (const name of minted) assert.doesNotMatch(name, /section/, name);
});
