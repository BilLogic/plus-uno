/**
 * The radius ladder, Radius 2.0: a Radius step set
 * (sm to xxl), a Radius / Control group (control height ÷ 4), one pattern
 * token per template, and a Button that nests in its field. Eighteen
 * tokens (the semantic and component rows below, plus --radius-full); every retired name has no declaration and no reader.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { variablesPayload } from './lib/tokens/build.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = tokenCorpus();

/** name -> [px, the raw value it is written as] */
const RADIUS = {
  '--radius-sm': [2, 'var(--space-0125)'],
  '--radius-md': [4, 'var(--space-025)'],
  '--radius-lg': [8, 'var(--space-050)'],
  '--radius-xl': [12, 'var(--space-075)'],
  '--radius-xxl': [16, 'var(--space-100)'],
  '--radius-control-sm': [6, 'var(--space-0375)'],
  '--radius-control-md': [8, 'var(--space-050)'],
  '--radius-control-lg': [10, 'var(--space-0625)'],
  '--section-radius': [16, 'var(--radius-xxl)'],
  '--modal-radius': [16, 'var(--radius-xxl)'],
  '--card-radius': [16, 'var(--radius-xxl)'],
  '--popup-radius': [12, 'var(--radius-xl)'],
  '--table-radius': [12, 'var(--radius-xl)'],
  '--frame-sidebar-row-radius': [6, 'var(--radius-control-sm)'],
};

test('--radius-full and the 18 semantic and component tokens exist', () => {
  for (const name of ['--radius-full', '--button-radius-default', '--button-radius-compact', '--button-radius-spacious']) assert.ok(corpus.has(name), name);
  assert.equal(Object.keys(RADIUS).length + 4, 18);
});

for (const [name, [px, raw]] of Object.entries(RADIUS)) {
  test(`${name} is ${px}px`, () => {
    const entry = corpus.get(name);
    assert.ok(entry, `${name} is not declared`);
    assert.equal(entry.value, `${px}px`);
    assert.equal(entry.raw, raw);
  });
}

test('the slot inset is 4px and the Button radii follow the control ladder', () => {
  assert.equal(corpus.get('--pad-x-xs')?.value, '4px');
  assert.equal(corpus.get('--button-radius-default')?.raw, 'calc(var(--radius-control-lg) - var(--pad-x-xs))');
  assert.equal(corpus.get('--button-radius-compact')?.raw, 'calc(var(--radius-control-md) - var(--pad-x-xs))');
  assert.equal(corpus.get('--button-radius-spacious')?.raw, 'var(--radius-control-lg)');
  assert.equal(corpus.get('--button-radius-spacious')?.value, '10px');
});

const RETIRED = [
  '--card-radius-sm', '--popup-radius-menu-md', '--popup-radius-menu-sm',
  '--tooltip-radius', '--page-radius', '--page-radius-md', '--tile-radius-sm', '--tile-radius-lg',
];

test('a retired name has no declaration', () => {
  for (const name of RETIRED) assert.equal(corpus.has(name), false, name);
});

test('a retired name has no reader in code, docs or stories', () => {
  const pattern = `(${RETIRED.map((n) => `${n}\\b`).join('|')})`;
  let out = '';
  try {
    out = execFileSync('git', ['grep', '-nE', '-e', pattern, '--', 'design-system/src', 'prototypes', '.storybook', 'docs',
      ':!scripts', ':!design-system/agent-views', ':!design-system/figma', ':!*generated*', ':!*/source/*.json'], { cwd: REPO_ROOT, encoding: 'utf8' });
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  assert.equal(out, '', `retired radius names still read:\n${out}`);
});

test('the Figma payload holds Radius / Control in the semantics collection', () => {
  const semantics = variablesPayload().collections.find((c) => c.name === 'spacing / semantics');
  const names = semantics.variables.map((v) => v.name);
  for (const leaf of ['sm', 'md', 'lg']) assert.ok(names.includes(`Radius/Control/${leaf}`), `Radius/Control/${leaf}`);
  for (const leaf of ['sm', 'md', 'lg', 'xl', 'xxl']) assert.ok(names.includes(`Radius/${leaf}`), `Radius/${leaf}`);
});
