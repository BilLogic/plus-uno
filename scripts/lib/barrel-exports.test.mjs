/**
 * Tests for the barrel reader behind the components existence index.
 *
 * The defect these were written against is real and shipped: the components
 * index listed `PageLayout` for nine months while its barrel line sat behind
 * `//`, because the export regex read the file as text. The index is the
 * existence law, so an entry nothing can import is the worst failure it has.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { extractExports, stripComments } from './barrel-exports.js';

/** Write a throwaway barrel tree and return its root. */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'barrel-exports-'));
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

test('a commented-out export is not an export', () => {
  const root = fixture({
    'index.js': [
      "export { default as Sidebar } from './Sidebar/Sidebar';",
      "// export { default as PageLayout } from './PageLayout/PageLayout';",
    ].join('\n'),
  });

  assert.deepEqual(extractExports(path.join(root, 'index.js'), { repoRoot: root }), ['Sidebar']);
});

test('a block-commented export is not an export either', () => {
  const root = fixture({
    'index.js': [
      '/* export { default as Retired } from "./Retired"; */',
      "export { default as Button } from './Button';",
    ].join('\n'),
  });

  assert.deepEqual(extractExports(path.join(root, 'index.js'), { repoRoot: root }), ['Button']);
});

test('prose above a live export does not suppress it', () => {
  const root = fixture({
    'index.js': [
      '// A separate export through the deprecation period: 84 call sites',
      "export { default as BadgeVariants } from './BadgeVariants';",
    ].join('\n'),
  });

  assert.deepEqual(extractExports(path.join(root, 'index.js'), { repoRoot: root }), ['BadgeVariants']);
});

test('`export *` is followed into a sibling barrel', () => {
  const root = fixture({
    'index.js': "export * from './forms';",
    'forms/index.js': [
      "export { default as Input } from './Input';",
      "// export { default as Retired } from './Retired';",
    ].join('\n'),
  });

  assert.deepEqual(extractExports(path.join(root, 'index.js'), { repoRoot: root }), ['Input']);
});

test('`export *` outside the boundary belongs to another section', () => {
  const root = fixture({
    'components/index.js': ["export { default as Card } from './Card';", "export * from '../dataviz';"].join('\n'),
    'dataviz/index.js': "export { default as BarChart } from './BarChart';",
  });

  const names = extractExports(path.join(root, 'components/index.js'), {
    repoRoot: root,
    boundary: path.join(root, 'components'),
  });
  assert.deepEqual(names, ['Card']);
});

test('stripComments leaves import specifiers intact', () => {
  assert.equal(stripComments("export { default as A } from '@/components/A';").trim(), "export { default as A } from '@/components/A';");
});
