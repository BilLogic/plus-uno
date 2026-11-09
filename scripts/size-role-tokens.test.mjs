/**
 * The size roles and the table cell pad, as code reads them after generation.
 *
 * - One primitive size scale is used through the roles: Icon, Control, Row
 *   and Image. A role token is an alias of a size step, never a number of its
 *   own.
 * - A table cell pads on `pad-x-cell` and `pad-y-cell`, named by the same
 *   grammar as the rest of the patterns.
 * - No token name carries the word "section" for these roles.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';

const corpus = tokenCorpus();

/** name -> [px, the step it points at] */
const ROLES = {
  '--icon-sm': [12, '--size-075'],
  '--icon-md': [16, '--size-100'],
  '--icon-lg': [24, '--size-150'],
  '--control-sm': [24, '--size-150'],
  '--control-md': [32, '--size-200'],
  '--control-lg': [40, '--size-250'],
  '--row-height-sm': [32, '--height-200'],
  '--row-height-md': [40, '--height-250'],
  '--row-height-lg': [48, '--height-300'],
  '--image-xxs': [16, '--size-100'],
  '--image-xs': [20, '--size-125'],
  '--image-sm': [24, '--size-150'],
  '--image-md': [32, '--size-200'],
  '--image-lg': [40, '--size-250'],
  '--image-xl': [48, '--size-300'],
};

const TABLE = {
  '--table-pad-x-cell': [8, '--space-050'],
  '--table-pad-y-cell': [4, '--space-025'],
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

test('no role or table token is named for a Section', () => {
  const minted = [...Object.keys(ROLES), ...Object.keys(TABLE)];
  for (const name of minted) assert.doesNotMatch(name, /section/, name);
});
