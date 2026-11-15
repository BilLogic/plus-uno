#!/usr/bin/env node
/**
 * Bakes the `@plus-uno/cli` package: `packages/cli/dist/` gets the lookup's own
 * source (the import closure of `scripts/ds.mjs` and the MCP server, at the same repo-relative paths)
 * and a snapshot of the facts it reads, so `dist/` is a repo root as far as
 * `createLookup` can tell. The snapshot is the file set the hosted `/mcp/ds` bundles
 * (netlify.toml `[functions."ds-mcp"]`), minus consumer code, which only `ds check` reads.
 * It also builds `registry/` (one item JSON per foundation and component, from `generate-registry.mjs`) for `ds add`;
 * that registry is most of the size, which is why the budget in `snapshot-budget.json` sits near 3.4 MB packed and 13.5 MB unpacked.
 * Runs as the package's `prepack`; `snapshot-budget.json` holds its size.
 */
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { isEntry } from './lib/findings.mjs';
import { generate } from './generate-registry.mjs';

export const PACKAGE_DIR = path.join(REPO_ROOT, 'packages/cli');
export const DIST = path.join(PACKAGE_DIR, 'dist');
// `ds` and `ds mcp` (the stdio server), both over the same lookup.
const ENTRIES = ['scripts/ds.mjs', 'scripts/lib/ds-mcp-server.mjs'];

/** The snapshot: [folder, extensions | null for any, extra file names] and single files, repo-relative. */
export const SNAPSHOT_DIRS = [
  ['design-system/agent-views', null],
  ['design-system/guidelines', null],
  // Docs pages, generated component pages and the barrels `loadFacts` reads; stories, styles and component source are not needed.
  ['design-system/src', ['.md', '.mdx', '.json'], ['index.js']],
];
export const SNAPSHOT_FILES = [
  'design-system/figma/component-registry.json',
  'docs/engineering/ds-usage-rules.md',
  'docs/conventions/design-system-glossary.md',
];

const IMPORT = /^\s*(?:import|export)[^'"\n;]*from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;

/** Every repo-relative file `entry` imports, itself included. */
export function importClosure(entry, root = REPO_ROOT, seen = new Set()) {
  const walk = (file) => {
    seen.add(file);
    for (const m of fs.readFileSync(path.join(root, file), 'utf8').matchAll(IMPORT)) {
      const spec = m[1] ?? m[2];
      if (!spec.startsWith('.')) continue;
      const target = path.relative(root, path.resolve(root, path.dirname(file), spec));
      if (!seen.has(target) && fs.existsSync(path.join(root, target)) && fs.statSync(path.join(root, target)).isFile()) walk(target);
    }
  };
  walk(entry);
  return [...seen];
}

function* files(dir, exts, names, root) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(rel, exts, names, root);
    else if (!exts || exts.includes(path.extname(e.name)) || names?.includes(e.name)) yield rel;
  }
}

/** Every repo-relative file the package carries, sorted. */
export function bakedFiles(root = REPO_ROOT) {
  const set = new Set();
  for (const entry of ENTRIES) importClosure(entry, root, set);
  for (const f of SNAPSHOT_FILES) if (fs.existsSync(path.join(root, f))) set.add(f);
  for (const [dir, exts, names] of SNAPSHOT_DIRS) for (const f of files(dir, exts, names, root)) set.add(f);
  return [...set].sort();
}

export function build(root = REPO_ROOT, dist = DIST) {
  fs.rmSync(dist, { recursive: true, force: true });
  const list = bakedFiles(root);
  for (const f of list) {
    fs.mkdirSync(path.dirname(path.join(dist, f)), { recursive: true });
    fs.copyFileSync(path.join(root, f), path.join(dist, f));
  }
  // The copy-in registry `ds add` installs from: one item JSON per foundation/component, dependencies by name.
  const { items, problems } = generate(root);
  if (problems.length) throw new Error(`registry cannot ship:\n${problems.map((x) => `  - ${x}`).join('\n')}`);
  fs.mkdirSync(path.join(dist, 'registry'), { recursive: true });
  for (const item of items) fs.writeFileSync(path.join(dist, 'registry', `${item.name}.json`), `${JSON.stringify(item)}\n`);
  // The scripts import design-system/src/lib as ESM and read the repo's package type.
  fs.writeFileSync(path.join(dist, 'package.json'), '{"type":"module","private":true}\n');
  return [...list, ...items.map((i) => `registry/${i.name}.json`)];
}

if (isEntry(import.meta.url)) {
  const list = build();
  console.log(`cli package: baked ${list.length} files into packages/cli/dist`);
}
