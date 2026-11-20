#!/usr/bin/env node
/**
 * Generate `design-system/agent-views/ds-index.json` — the single pre-built
 * lookup index `createLookup` in `scripts/lib/ds-lookup.mjs` loads on cold
 * start so `ds_find`, `ds_get`, `ds_tokens` and `ds_guide` never scan source
 * or parse MDX per process.
 *
 * Usage:
 *   node scripts/generate-ds-index.mjs
 *   node scripts/generate-ds-index.mjs --check   (CI: fail if stale, write nothing)
 */
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { DS_INDEX, buildDsIndex, serializeDsIndex } from './lib/ds-lookup.mjs';
import { byRoot, isEntry, main } from './lib/findings.mjs';

const artifacts = byRoot((repoRoot) => {
  const index = buildDsIndex(repoRoot);
  const content = serializeDsIndex(index);
  return [{ file: DS_INDEX, content, counts: { entries: index.entries.length, guides: Object.keys(index.guides).length } }];
});

/** The drift check. Reports and never writes. */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const found = [];
  for (const { file, content } of artifacts(repoRoot)) {
    const abs = path.join(repoRoot, file);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    if (current !== content) {
      found.push({
        file,
        message: file + ' is stale. Run `node scripts/generate-ds-index.mjs` (or `npm run regenerate`).',
      });
    }
  }
  return found;
}

/** The green line, which carries what the artifact was measured to hold. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const [{ counts }] = artifacts(repoRoot);
  return `${DS_INDEX} up to date (${counts.entries} entries, ${counts.guides} guides).`;
}

if (isEntry(import.meta.url)) {
  if (process.argv.includes('--check')) {
    main(import.meta.url, 'check:ds-index', { run, summary });
  } else {
    const [{ file, content, counts }] = artifacts(REPO_ROOT);
    const abs = path.join(REPO_ROOT, file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
    console.log(`✓ ${file} (${counts.entries} entries, ${counts.guides} guides)`);
  }
}
