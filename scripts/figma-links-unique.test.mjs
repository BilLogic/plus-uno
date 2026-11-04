import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS_SRC = path.join(REPO_ROOT, 'design-system', 'src');
const LINK_RE = /figmaLink\s*=\s*["'][^"']*node-id=([\d-]+)["']/;

function docsPageIds() {
  const byId = new Map();
  for (const rel of documents('.', { root: DS_SRC, ext: ['.mdx'] })) {
    // Specs pages legitimately share one frame across screens; the rule is for component docs.
    if (/ \d+\.mdx$/.test(rel) || rel.startsWith('specs/')) continue;
    const m = LINK_RE.exec(fs.readFileSync(path.join(DS_SRC, rel), 'utf8'));
    if (!m) continue;
    byId.set(m[1], [...(byId.get(m[1]) ?? []), rel]);
  }
  return byId;
}

test('no two component docs share one Figma docs-page node id', () => {
  const shared = [...docsPageIds()].filter(([, files]) => files.length > 1);
  assert.deepEqual(shared, []);
});

test('docs-page links repointed away from dead ids', () => {
  const dead = ['17883-1895', '17884-2099', '17885-57', '17885-47731', '18314-53755'];
  const ids = docsPageIds();
  for (const id of dead) assert.equal(ids.has(id), false, `${id} resolves to nothing in Figma`);
});
