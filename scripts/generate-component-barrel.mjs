#!/usr/bin/env node
/**
 * Generate `design-system/src/components/index.js` — the public component
 * barrel — from the folder shape, rather than a hand-maintained list.
 *
 * SOURCE OF TRUTH: the directory tree under `design-system/src/components/`.
 * Every immediate subdirectory of `components/` is a group, except `_internal`
 * (never a public import surface). Within a group:
 *   - a group that owns its own `index.js` (today, only `forms-and-inputs`) is
 *     re-exported wholesale (`export * from '@/components/<group>'`) — that
 *     file is the group's own curated public surface, and this script does not
 *     second-guess it;
 *   - otherwise, every immediate subdirectory with an `index.js` is a
 *     component folder. Its default export becomes the barrel's `<Name>`
 *     export, and any OTHER named export its own `index.js` exposes (tracing
 *     one `export * from './X'` hop into the component's own file, the usual
 *     shape) comes along too — `TagContext`/`useTagContext`, `ToastContainer`,
 *     the `Table` sub-parts. `<Name>` itself is never duplicated: a component
 *     whose own file both default- and named-exports itself (`Button`) gets
 *     one `Button` binding, not two.
 *
 * This is why `_internal` leaking into the barrel is a thing of the past
 * (#1702): a component that should be public lives in a group folder and is
 * picked up for free; a component that should stay private lives under
 * `_internal` and this script never looks at it.
 *
 * `@/dataviz` is a sibling of `design-system/src/components/`, not a group
 * inside it, so it stays a hand-written trailing line, same as the stylesheet
 * side-effect import at the top.
 *
 * Usage:
 *   node scripts/generate-component-barrel.mjs          (write)
 *   node scripts/generate-component-barrel.mjs --check  (CI: fail if stale)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntry, main } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = path.join(REPO_ROOT, 'design-system/src/components');
const OUT = 'design-system/src/components/index.js';

const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const hasFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

/** Resolve a relative specifier (`./X`) against the file that imports it, to a real file. */
function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.jsx`, `${base}.js`, `${base}.tsx`, path.join(base, 'index.js')];
  return candidates.find(hasFile) ?? null;
}

/**
 * The named (non-default) export identifiers visible on a module, following
 * one level of relative `export * from` re-exports. Non-relative specifiers
 * (`@/...`, package names) are not followed: they point outside the component
 * folder, and the component's own index.js is the only file this needs to
 * understand to know its public surface.
 */
function namedExportsOf(file, seen = new Set()) {
  const names = new Set();
  if (!file || seen.has(file)) return names;
  seen.add(file);
  const src = fs.readFileSync(file, 'utf8');

  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*(?:from\s*['"][^'"]+['"])?\s*;/g)) {
    for (const item of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
      const parts = item.split(/\s+as\s+/).map((s) => s.trim());
      const exported = parts[parts.length - 1];
      if (exported && exported !== 'default') names.add(exported);
    }
  }
  for (const m of src.matchAll(/^export\s+(?:const|function|class)\s+(\w+)/gm)) {
    names.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]\s*;/g)) {
    const resolved = resolveRelative(file, m[1]);
    for (const n of namedExportsOf(resolved, seen)) names.add(n);
  }
  return names;
}

function groupBlock(group) {
  const groupDir = path.join(COMPONENTS_DIR, group);
  if (hasFile(path.join(groupDir, 'index.js'))) {
    return [`export * from '@/components/${group}';`];
  }

  const names = fs
    .readdirSync(groupDir)
    .filter((name) => name !== '_internal' && isDir(path.join(groupDir, name)))
    .filter((name) => hasFile(path.join(groupDir, name, 'index.js')))
    .sort((a, b) => a.localeCompare(b));

  return names.map((name) => {
    const indexFile = path.join(groupDir, name, 'index.js');
    const extra = [...namedExportsOf(indexFile)].filter((n) => n !== name).sort((a, b) => a.localeCompare(b));
    const binding = [`default as ${name}`, ...extra].join(', ');
    return `export { ${binding} } from '@/components/${group}/${name}';`;
  });
}

/** @returns {{file: string, content: string}[]} */
export function artifacts(repoRoot = REPO_ROOT) {
  const componentsDir = path.join(repoRoot, 'design-system/src/components');
  const groups = fs
    .readdirSync(componentsDir)
    .filter((name) => name !== '_internal' && isDir(path.join(componentsDir, name)))
    .sort((a, b) => a.localeCompare(b));

  let content = `// DO NOT EDIT BY HAND. Generated by npm run generate:component-barrel\n`;
  content += `// from design-system/src/components/<group>/<Name>/index.js — one folder shape, no _internal exports.\n\n`;
  content += `import '../styles/main.scss';\n\n`;
  for (const group of groups) {
    content += groupBlock(group).join('\n') + '\n\n';
  }
  content += `// A sibling of components/, not a group inside it.\n`;
  content += `export * from '@/dataviz';\n`;

  return [{ file: OUT, content, counts: { groups: groups.length } }];
}

/** The drift check. Reports and never writes. */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const found = [];
  for (const { file, content } of artifacts(repoRoot)) {
    const abs = path.join(repoRoot, file);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    if (current !== content) {
      found.push({ file, message: `${file} is stale. Run \`npm run generate:component-barrel\`.` });
    }
  }
  return found;
}

/** The green line, which carries what the artifact was measured to hold. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const [{ counts }] = artifacts(repoRoot);
  return `design-system/src/components/index.js up to date (${counts.groups} groups).`;
}

if (isEntry(import.meta.url)) {
  if (process.argv.includes('--check')) {
    main(import.meta.url, 'check:component-barrel', { run, summary });
  } else {
    const [{ file, content, counts }] = artifacts(REPO_ROOT);
    fs.writeFileSync(path.join(REPO_ROOT, file), content);
    console.log(`✓ ${file} (${counts.groups} groups)`);
  }
}
