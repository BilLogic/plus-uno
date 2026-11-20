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

/** The size a `font` text role sets, in px: the `--type-size-*` its shorthand names. */
function fontSize(role) {
  const size = declarations.get(role)?.match(/var\((--type-size-\d+)\)/)?.[1];
  return size ? of(size) : assert.fail(`${role} names no --type-size`);
}

/** Old primitive -> the existing role token every source now reads in its place. */
const ROLE_SWAPS = {
  '--height-250': '--control-lg', // InlineEdit, FieldBox
  '--width-1000': '--field-width-sm', // range picker presets column
  '--width-1500': '--field-width-md', // docs browser tab
  '--width-3000': '--field-width-xl', // docs browser field
  '--height-150': '--control-sm', // docs loop bar
  '--stroke-1': '--border-width-default', // illustration strokes, docs dot ground, Colors border
  '--stroke-2': '--border-width-selected', // illustration series stroke
  '--type-size-200': '--image-md', // EmptyState and Carousel story glyph, 32
  '--type-size-150': '--icon-lg', // compact EmptyState glyph, 24
};
for (const [old, role] of Object.entries(ROLE_SWAPS)) {
  test(`${old} and ${role} are the same length`, () => assert.equal(of(role), of(old)));
}

test('the ring and outline reads keep their width', () => {
  assert.equal(of('--page-border-width'), of('--stroke-2'), 'surface edge ring, Frame story');
  assert.equal(of('--focus-ring-width'), of('--stroke-2'), 'Colors story outline');
  assert.equal(of('--select-check-size'), of('--type-size-0875'), 'Select check box');
  assert.equal(px('calc(var(--border-width-default) / 2)'), of('--stroke-1') / 2, 'hero hairline');
});

/** Old font-size primitive -> the text role whose shorthand sets that size. */
const TYPE_SWAPS = [
  ['--type-size-075', ['--heading-xxs', '--body-sm']], // Avatar 16 and 24, docs code caption, figure labels
  ['--type-size-0875', ['--heading-xs', '--body-default']], // Avatar 32, CodeBlock
  ['--type-size-100', ['--heading-sm', '--body-lg']], // Avatar 40, docs prose and tabs
  ['--type-size-200', ['--heading-xxl']], // Avatar 96 and 128
];
for (const [old, roles] of TYPE_SWAPS) {
  for (const role of roles) test(`${role} sets ${old}'s size`, () => assert.equal(fontSize(role), of(old)));
}

/** Demo frames kept as literals: each literal is the px of the primitive it replaced. */
const DEMO_FRAMES = {
  '16px': '--height-100', '24px': '--height-150', '40px': '--height-250', '80px': '--size-500',
  '120px': '--height-750', '160px': '--size-1000', '224px': '--size-1400', '240px': '--size-1500',
  '304px': '--size-1900', '320px': '--size-2000', '400px': '--size-2500', '480px': '--size-3000',
  '640px': '--size-4000', '864px': '--size-5400', '144px': '--height-100', // 144 = nine of --height-100
};
for (const [literal, old] of Object.entries(DEMO_FRAMES)) {
  test(`${literal} keeps ${old}'s length`, () => assert.equal(px(literal), literal === '144px' ? of(old) * 9 : of(old)));
}
