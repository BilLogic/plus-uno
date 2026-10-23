/**
 * The scale tokens the layout, token and type system adds beside the old
 * `--size-*` ones, as code reads them after generation from the BS4
 * Foundation export: the Primitives, Element, Size and Border collections.
 *
 * - Primitives are named by rem × 100 (`--space-025` is 4) and the radius,
 *   stroke and small size steps point at Space.
 * - Category tokens point at the common scales: `--item-height-md` is a var()
 *   of `--height-200`, not a second 32.
 * - There is no 40 Item, and a collection that holds one property skips the
 *   word (`--border-default`, `--icon-md`, `--image-sm`).
 * - The old tokens still resolve, at their old values, until every use moves.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';

const corpus = tokenCorpus();

/** name -> [px, the token it points at, or null for a value of its own] */
const PRIMITIVES = {
  '--space-0': [0, null],
  '--space-00625': [1, null],
  '--space-0125': [2, null],
  '--space-025': [4, null],
  '--space-0375': [6, null],
  '--space-050': [8, null],
  '--space-0625': [10, null],
  '--space-075': [12, null],
  '--space-0875': [14, null],
  '--space-100': [16, null],
  '--space-125': [20, null],
  '--space-150': [24, null],
  '--space-200': [32, null],
  '--space-250': [40, null],
  '--space-300': [48, null],
  '--space-400': [64, null],
  '--space-500': [80, null],
  '--radius-0125': [2, '--space-0125'],
  '--radius-025': [4, '--space-025'],
  '--radius-0375': [6, '--space-0375'],
  '--radius-050': [8, '--space-050'],
  '--radius-0625': [10, '--space-0625'],
  '--radius-075': [12, '--space-075'],
  '--radius-0875': [14, '--space-0875'],
  '--radius-100': [16, '--space-100'],
  '--radius-full': [9999, null],
  '--stroke-1': [1, '--space-00625'],
  '--stroke-2': [2, '--space-0125'],
  '--size-075': [12, '--space-075'],
  '--size-100': [16, '--space-100'],
  '--size-125': [20, '--space-125'],
  '--size-150': [24, '--space-150'],
  '--size-200': [32, '--space-200'],
  '--size-250': [40, '--space-250'],
  '--size-300': [48, '--space-300'],
  '--size-500': [80, '--space-500'],
  '--size-750': [120, null],
  '--size-1000': [160, null],
  '--size-1400': [224, null],
  '--size-1500': [240, null],
  '--size-1900': [304, null],
  '--size-2000': [320, null],
  '--size-2500': [400, null],
  '--size-3000': [480, null],
  '--size-4500': [720, null],
  '--size-5400': [864, null],
  '--size-7700': [1232, null],
};

const ELEMENT = {
  '--element-pad-x-xs': [4, '--space-025'],
  '--element-pad-x-sm': [8, '--space-050'],
  '--element-pad-x-md': [12, '--space-075'],
  '--element-pad-y-sm': [2, '--space-0125'],
  '--element-pad-y-md': [6, '--space-0375'],
  '--element-stack-sm': [4, '--space-025'],
  '--element-stack-md': [8, '--space-050'],
  '--element-stack-lg': [12, '--space-075'],
  '--element-inline-sm': [4, '--space-025'],
  '--element-inline-md': [8, '--space-050'],
  '--element-inline-lg': [12, '--space-075'],
  '--element-radius-sm': [2, '--radius-0125'],
  '--element-radius-md': [4, '--radius-025'],
  '--element-radius-lg': [8, '--radius-050'],
  '--element-radius-item-sm': [6, '--radius-0375'],
  '--element-radius-item-md': [8, '--radius-050'],
  '--element-radius-full': [9999, '--radius-full'],
};

const SIZE = {
  '--height-100': [16, '--size-100'],
  '--height-125': [20, '--size-125'],
  '--height-150': [24, '--size-150'],
  '--height-200': [32, '--size-200'],
  '--height-250': [40, '--size-250'],
  '--height-300': [48, '--size-300'],
  '--height-500': [80, '--size-500'],
  '--height-750': [120, '--size-750'],
  '--height-2000': [320, '--size-2000'],
  '--width-500': [80, '--size-500'],
  '--width-1000': [160, '--size-1000'],
  '--width-1400': [224, '--size-1400'],
  '--width-1500': [240, '--size-1500'],
  '--width-2000': [320, '--size-2000'],
  '--width-2500': [400, '--size-2500'],
  '--width-3000': [480, '--size-3000'],
  '--item-height-sm': [24, '--height-150'],
  '--item-height-md': [32, '--height-200'],
  '--row-height-sm': [32, '--height-200'],
  '--row-height-md': [40, '--height-250'],
  '--row-height-lg': [48, '--height-300'],
  '--label-height-sm': [16, '--height-100'],
  '--label-height-md': [20, '--height-125'],
  '--label-max-width': [160, '--width-1000'],
  '--field-width-xs': [80, '--width-500'],
  '--field-width-sm': [160, '--width-1000'],
  '--field-width-md': [240, '--width-1500'],
  '--field-width-lg': [320, '--width-2000'],
  '--field-width-xl': [480, '--width-3000'],
  '--field-min-height-sm': [80, '--height-500'],
  '--field-min-height-lg': [120, '--height-750'],
  '--icon-sm': [12, '--size-075'],
  '--icon-md': [16, '--size-100'],
  '--icon-lg': [24, '--size-150'],
  '--image-xxs': [16, '--size-100'],
  '--image-xs': [20, '--size-125'],
  '--image-sm': [24, '--size-150'],
  '--image-md': [32, '--size-200'],
  '--image-lg': [40, '--size-250'],
  '--image-xl': [48, '--size-300'],
};

const BORDER = {
  '--border-default': [1, '--stroke-1'],
  '--border-selected': [2, '--stroke-2'],
  '--border-focused': [2, '--stroke-2'],
};

for (const [group, tokens] of Object.entries({ PRIMITIVES, ELEMENT, SIZE, BORDER })) {
  for (const [name, [px, target]] of Object.entries(tokens)) {
    test(`${group}: ${name} resolves to ${px}px${target ? ` through ${target}` : ''}`, () => {
      const entry = corpus.get(name);
      assert.ok(entry, `${name} is not declared`);
      assert.equal(entry.value, `${px}px`);
      if (target) assert.equal(entry.raw, `var(${target})`);
      else assert.doesNotMatch(entry.raw, /var\(/, `${name} should hold its own value`);
    });
  }
}

test('there is no 40 Item, and no Width/250', () => {
  for (const name of ['--item-height-lg', '--width-250']) assert.equal(corpus.has(name), false, name);
});

test('one-property collections skip the property word', () => {
  for (const name of ['--border-width-default', '--icon-size-md', '--image-size-sm']) {
    assert.equal(corpus.has(name), false, name);
  }
});

test('the old tokens still resolve at their old values', () => {
  const old = {
    '--size-element-pad-x-xs': '4px',
    '--size-element-pad-x-sm': '8px',
    '--size-element-pad-y-sm': '4px',
    '--size-element-pad-y-md': '6px',
    '--size-element-radius-sm': '4px',
    '--size-element-radius-full': '999px',
    '--size-element-border': '1px',
    '--size-spacing-small-space-050': '4px',
    '--size-spacing-small-space-100': '8px',
    '--size-border-radius-radius-200': '8px',
    '--size-border-stroke-stroke-100': '1px',
  };
  for (const [name, value] of Object.entries(old)) assert.equal(corpus.get(name)?.value, value, name);
});
