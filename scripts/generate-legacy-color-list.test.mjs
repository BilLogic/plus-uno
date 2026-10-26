import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { GUIDE, guideUpdate, renderList, run, statusOf } from './generate-legacy-color-list.mjs';

const ROWS = [
  { component: 'labels/Tag', uses: 4, names: ['--color-a', '--color-b', '--color-c', '--color-d'] },
  { component: 'navigation/Breadcrumb', uses: 2, names: ['--color-on-surface-variant'] },
];

test('renderList tallies the rows, shortens long name lists and marks holds', () => {
  const out = renderList(ROWS);
  assert.match(out, /^<!-- gen:LEGACY-COMPONENTS -->\n2 components, 6 legacy uses\./);
  assert.match(out, /\| `labels\/Tag` \| 4 \| 4 names \| take \|/);
  assert.match(out, /\| `navigation\/Breadcrumb` \| 2 \| `--color-on-surface-variant` \| take \|/);
  assert.match(out, /<!-- \/gen:LEGACY-COMPONENTS -->$/);
});

test('holds: the specific row wins over the category, internal composites are taken', () => {
  assert.equal(statusOf('forms-and-inputs/Button'), 'held: Button refresh (Cynthia)');
  assert.equal(statusOf('forms-and-inputs/Radio'), 'take');
  assert.match(statusOf('_internal/Navbar'), /^take: internal composite/);
});

test('guideUpdate replaces only the block, and reports missing markers', () => {
  const text = '# Guide\n\nBefore.\n\n<!-- gen:LEGACY-COMPONENTS -->\nold\n<!-- /gen:LEGACY-COMPONENTS -->\n\nAfter.\n';
  assert.equal(guideUpdate(text, ROWS).next, `# Guide\n\nBefore.\n\n${renderList(ROWS)}\n\nAfter.\n`);
  assert.equal(guideUpdate('# Guide, no markers\n', ROWS).next, null);
});

function fixture(guide) {
  const root = mkdtempSync(join(tmpdir(), 'legacy-color-list-'));
  const put = (rel, body) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  put('design-system/src/components/navigation/Breadcrumb/Breadcrumb.scss', 'a { color: var(--color-primary-text); }');
  put(GUIDE, guide);
  return root;
}

test('run fails on missing markers and on a stale list, and passes on a fresh one', () => {
  assert.match(run({ repoRoot: fixture('# Guide\n') })[0].message, /missing the/);
  const stale = '<!-- gen:LEGACY-COMPONENTS -->\nold\n<!-- /gen:LEGACY-COMPONENTS -->\n';
  assert.match(run({ repoRoot: fixture(stale) })[0].message, /stale/);
  const fresh = `${renderList([{ component: 'navigation/Breadcrumb', uses: 1, names: ['--color-primary-text'] }])}\n`;
  assert.deepEqual(run({ repoRoot: fixture(fresh) }), []);
});
