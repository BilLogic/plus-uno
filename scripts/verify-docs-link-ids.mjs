#!/usr/bin/env node
/**
 * Every `?path=/docs/<id>` href and every DocsLink id in the docs source must
 * name an entry in a built Storybook's index.json.
 *   node scripts/verify-docs-link-ids.mjs <path to index.json>
 */
import fs from 'node:fs';

import { REPO_ROOT } from './lib/corpus.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

const indexPath = process.argv[2];
if (!indexPath) {
  console.error('usage: node scripts/verify-docs-link-ids.mjs <index.json>');
  process.exit(2);
}
const ids = new Set(Object.keys(JSON.parse(fs.readFileSync(indexPath, 'utf8')).entries));
const roots = ['design-system/src', '.storybook'];
const sources = trackedSources(REPO_ROOT, roots, /\.(mdx|jsx|js|mjs|md)$/).filter(({ path: file }) => !/\.test\./.test(file));
let checked = 0;
const missing = [];
for (const { path: f, text: src } of sources) {
  const hits = [
    ...[...src.matchAll(/\?path=\/(?:docs|story)\/([a-z0-9-]+(?:--[a-z0-9-]+)?)/g)].map((m) => m[1]),
    ...[...src.matchAll(/<DocsLink\b([^>]*)>/g)]
      .map((m) => {
        const id = /\bid="([a-z0-9-]+)"/.exec(m[1])?.[1];
        const story = /\bstory="([a-z0-9-]+)"/.exec(m[1])?.[1];
        return id && (story ? `${id}--${story}` : id);
      })
      .filter(Boolean),
  ];
  for (const raw of hits) {
    if (raw.endsWith("-")) continue; // template literal, resolved at render
    checked += 1;
    const id = raw.includes('--') ? raw : `${raw}--docs`;
    if (!ids.has(id)) missing.push(`${f}: ${raw}`);
  }
}
console.log(`checked ${checked} link ids in ${sources.length} files against ${ids.size} index entries`);
if (missing.length) {
  console.log(missing.join('\n'));
  process.exit(1);
}
console.log('no docs page links to a missing id');
