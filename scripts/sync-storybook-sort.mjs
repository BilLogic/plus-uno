#!/usr/bin/env node
/**
 * Regenerate the sidebar sort order in .storybook/preview.jsx from
 * storybook.taxonomy.json (the IA single source of truth).
 *
 * Storybook statically parses `parameters.options.storySort`, so the value must
 * be inlined as a literal — it cannot be imported at runtime. This script keeps
 * the literal in sync. Run it after any edit to storybook.taxonomy.json.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const taxonomyPath = path.join(root, 'storybook.taxonomy.json');
const previewPath = path.join(root, '.storybook', 'preview.jsx');

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const literal = JSON.stringify(taxonomy.storySortOrder, null, 2)
  .split('\n')
  .map((l, i) => (i === 0 ? l : `        ${l}`))
  .join('\n');

const preview = fs.readFileSync(previewPath, 'utf8');
const START = '/* IA-SORT-START */';
const END = '/* IA-SORT-END */';
const re = new RegExp(
  `${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);
if (!re.test(preview)) {
  console.error('IA-SORT markers not found in .storybook/preview.jsx');
  process.exit(1);
}
const next = preview.replace(re, `${START}\n        order: ${literal},\n        ${END}`);
fs.writeFileSync(previewPath, next);
console.log('storySort order synced from storybook.taxonomy.json');
