/**
 * Px parity for the primitive-read migration: every primitive a source used to
 * read and the role token that replaced it resolve to the same length, read
 * from the token files themselves. A swap that moved a rendered size fails here.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';

const TOKEN_DIRS = ['design-system/src/tokens', 'design-system/src/tokens/ladder'];

const declarations = new Map();
for (const dir of TOKEN_DIRS) {
  for (const file of fs.readdirSync(path.join(REPO_ROOT, dir)).filter((f) => f.endsWith('.scss'))) {
    const text = fs.readFileSync(path.join(REPO_ROOT, dir, file), 'utf8');
    for (const [, name, value] of text.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) {
      if (!declarations.has(name)) declarations.set(name, value.trim());
    }
  }
}

/** A length in px: literal px or rem (16px root), a `var()` of another token, or a calc of those with one * or /. */
function px(value) {
  let v = value.replace(/\/\*.*?\*\//g, '').trim();
  const ref = v.match(/^var\((--[a-z0-9-]+)\)$/);
  if (ref) return px(declarations.get(ref[1]) ?? assert.fail(`no declaration for ${ref[1]}`));
  const calc = v.match(/^calc\((.+?)\s*([*/])\s*([\d.]+)\)$/);
  if (calc) return calc[2] === '*' ? px(calc[1]) * Number(calc[3]) : px(calc[1]) / Number(calc[3]);
  const lit = v.match(/^([\d.]+)(px|rem)$/);
  if (lit) return lit[2] === 'rem' ? Number(lit[1]) * 16 : Number(lit[1]);
  return assert.fail(`cannot resolve ${value}`);
}
const of = (name) => px(`var(${name})`);

/** old primitive -> the role token every source now reads in its place. */
const SWAPS = {
  '--size-500': '--example-size-80', '--width-500': '--example-size-80', '--height-500': '--example-size-80',
  '--size-750': '--example-size-120', '--height-750': '--example-size-120',
  '--size-1000': '--example-size-160', '--width-1000': '--example-size-160',
  '--size-1400': '--example-size-224', '--width-1400': '--example-size-224',
  '--size-1500': '--example-size-240', '--width-1500': '--example-size-240',
  '--size-1900': '--example-size-304', '--width-1900': '--example-size-304',
  '--size-2000': '--example-size-320', '--width-2000': '--example-size-320', '--height-2000': '--example-size-320',
  '--size-2500': '--example-size-400', '--width-2500': '--example-size-400',
  '--size-3000': '--example-size-480', '--width-3000': '--example-size-480',
  '--size-4000': '--example-size-640', '--size-5400': '--example-size-864',
  '--height-100': '--example-size-16', '--height-150': '--example-size-24', '--height-250': '--example-size-40',
  '--type-size-075': '--font-size-xs', '--type-size-0875': '--font-size-sm', '--type-size-100': '--font-size-md',
  '--type-size-150': '--font-size-xl',
  '--type-size-200': '--font-size-3xl',
  '--stroke-1': '--border-width-default', '--stroke-2': '--border-width-selected',
};

for (const [old, role] of Object.entries(SWAPS)) {
  test(`${old} and ${role} are the same length`, () => assert.equal(of(role), of(old)));
}

test('the component and template reads keep their length', () => {
  assert.equal(of('--control-lg'), of('--height-250'), 'InlineEdit height');
  assert.equal(of('--date-range-presets-width'), of('--width-1000'), 'range presets column');
  assert.equal(of('--select-check-size'), of('--type-size-0875'), 'Select check box');
  assert.equal(of('--page-border-width'), of('--stroke-2'), 'surface edge ring');
  assert.equal(of('--focus-ring-width'), of('--stroke-2'), 'Colors story outline');
  assert.equal(of('--border-width-hairline'), of('--stroke-1') / 2, 'hero hairline');
});
