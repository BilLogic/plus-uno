import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkPatterns, renderPatterns } from './patterns-index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const exportsOf = {
  '@/patterns': ['Frame', 'PatternCard'],
  '@/specs/Universal/Pages': ['PageLayout'],
  '@/components': ['Popup'],
};
const exists = (doc) => doc !== 'missing.mdx';
const row = (name, imp, group = 'Card', doc = 'ok.mdx') => ({ group, name, import: imp, use: 'x', doc });

test('a list that names only real exports and real docs passes', () => {
  const rows = [row('PageLayout', '@/specs/Universal/Pages'), row('Frame', '@/patterns'), row('PatternCard', '@/patterns')];
  assert.deepEqual(checkPatterns(rows, { exportsOf, exists, required: ['Frame', 'PatternCard'] }), []);
});

test('A NAME ITS BARREL DOES NOT EXPORT FAILS', () => {
  const problems = checkPatterns([row('Card', '@/patterns')], { exportsOf, exists, required: [] });
  assert.deepEqual(problems, ['Card is not exported from @/patterns']);
});

test('a doc path that is not a file fails', () => {
  const problems = checkPatterns([row('Frame', '@/patterns', 'Frame', 'missing.mdx')], { exportsOf, exists, required: [] });
  assert.deepEqual(problems, ['Frame: missing.mdx is not a file']);
});

test('a pattern the barrel exports and the list leaves out fails', () => {
  const problems = checkPatterns([row('Frame', '@/patterns')], { exportsOf, exists, required: ['Frame', 'PatternCard'] });
  assert.deepEqual(problems, ['PatternCard is exported from @/patterns and missing from the list']);
});

test('rendering groups the rows under one table, with each import line', () => {
  const out = renderPatterns([row('PageLayout', '@/specs/Universal/Pages', 'Templates'), row('PatternCard', '@/patterns')], { from: 'design-system/agent-views/components' });
  assert.match(out, /^## Patterns: start a page, section, card, table or overlay here/m);
  assert.match(out, /\| Templates \| \[`PageLayout`\]\(\.\.\/\.\.\/\.\.\/ok\.mdx\) \| `import \{ PageLayout \} from '@\/specs\/Universal\/Pages';` \| x \|/);
  assert.match(out, /\| Card \| \[`PatternCard`\]/);
});

test('THE COMMITTED LIST passes against the real barrels', async () => {
  const { checkCommitted } = await import('./patterns-index.mjs');
  assert.deepEqual(checkCommitted(REPO_ROOT), []);
  assert.ok(fs.existsSync(path.join(REPO_ROOT, 'design-system/agent-views/_patterns.json')));
});
