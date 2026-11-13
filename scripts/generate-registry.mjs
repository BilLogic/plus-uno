#!/usr/bin/env node
/**
 * The copy-in registry (#2117): static shadcn registry-item JSON for the foundation and
 * every component, built from the design-system source into `dist/registry/`. It runs in
 * `build:all`, so it publishes only with a release (Netlify production is release-only).
 *
 *   node scripts/generate-registry.mjs            write dist/registry
 *   node scripts/generate-registry.mjs --check    fail on anything the registry cannot ship (check:registry)
 *
 * `main` only runs for the check; the writer runs when the file is the entry without `--check`.
 *
 * The release stamp is `RELEASE_TAG`, else `v` + the root package.json version.
 */
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { isEntry, main } from './lib/findings.mjs';
import { buildRegistry, verify } from './lib/registry.mjs';

export const OUT = 'dist/registry';
/** Where the registry is served; a dependency is a full URL so `shadcn add <url>` can follow it. */
export const BASE_URL = 'https://plus-uno.netlify.app/registry';
const SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';

export function releaseTag(root = REPO_ROOT) {
  return process.env.RELEASE_TAG || `v${JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version}`;
}

/** `{ items, problems }`: the built items and every reason the registry is not shippable. */
export function generate(root = REPO_ROOT, release = releaseTag(root)) {
  const { items, refusals } = buildRegistry(root, release);
  return { items, problems: [...refusals, ...verify(items, root)] };
}

export function write(items, root = REPO_ROOT, release = releaseTag(root)) {
  const out = path.join(root, OUT);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const served = items.map((i) => ({ ...i, registryDependencies: i.registryDependencies.map((d) => `${BASE_URL}/${d}.json`) }));
  for (const item of served) fs.writeFileSync(path.join(out, `${item.name}.json`), `${JSON.stringify({ $schema: SCHEMA, ...item }, null, 2)}\n`);
  const index = { $schema: 'https://ui.shadcn.com/schema/registry.json', name: 'plus-ds', homepage: 'https://plus-uno.netlify.app/storybook/', release, items: served.map(({ files, ...rest }) => ({ ...rest, files: files.map(({ content, ...f }) => f) })) };
  fs.writeFileSync(path.join(out, 'registry.json'), `${JSON.stringify(index, null, 2)}\n`);
}

/** check:registry: one finding per reason the registry cannot ship. */
export function run({ repoRoot = REPO_ROOT } = {}) {
  return generate(repoRoot).problems.map((message) => ({ message }));
}

if (isEntry(import.meta.url) && !process.argv.includes('--check')) {
  // REGISTRY_ROOT lets a test point the real script at a fixture tree.
  const root = process.env.REGISTRY_ROOT || REPO_ROOT;
  const { items, problems } = generate(root);
  if (problems.length) {
    console.error(`registry: ${problems.length} problem(s) the registry cannot ship:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
  write(items, root);
  console.log(`registry: wrote ${items.length} items to ${OUT}`);
}

if (process.argv.includes('--check')) main(import.meta.url, 'check:registry', {
  run: () => run({ repoRoot: process.env.REGISTRY_ROOT || REPO_ROOT }),
  summary: () => 'every foundation and component item builds from source and ships only what a project can install.',
  remedy: '-> Import the part directly from design-system/src, drop the internal or deprecated import, or fix the path.',
});
