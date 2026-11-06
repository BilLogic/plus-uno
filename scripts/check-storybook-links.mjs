#!/usr/bin/env node
/**
 * `npm run check:storybook-links` — every link to a Storybook page lands on one.
 *
 * WHY IT EXISTS. A page's Storybook id is its title, sanitized. Moving a page
 * (the sidebar restructure, #1948) changes the id, and every link written with
 * the old one then opens "Couldn't find story" without any build going red:
 * 30-odd links were already dead before that move and nobody saw them. The
 * only authority on which ids exist is the built `index.json`, so this builds
 * Storybook and compares.
 *
 * WHAT IT READS: every tracked file, for the five link shapes in
 * `scripts/lib/storybook-links.mjs` (the same reader its unit tests pin).
 * Plans, ADRs and the uno-bot test fixtures are records, not links.
 *
 * WHY IT IS NOT PART OF `check:harness`. It needs a Storybook build (about a
 * minute), which that gate's budget cannot carry. It runs as a step of
 * `.github/workflows/storybook-gate.yml`, which already has `npm ci`.
 *
 * Usage:
 *   npm run check:storybook-links                    build Storybook, then check
 *   npm run check:storybook-links -- --index <file>  check against a built index.json
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isLinkable, storybookLinks } from './lib/storybook-links.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Storybook's entry ids, from a built `index.json`. */
export const indexIds = (file) => new Set(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')).entries));

/** @returns {{ file: string, line: number, id: string }[]} links whose id is not in `ids`. */
export function brokenLinks(files, ids, root = REPO_ROOT) {
  const broken = [];
  for (const file of files.filter(isLinkable)) {
    let text;
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const link of storybookLinks(text)) if (!ids.has(link.id)) broken.push({ file, ...link });
  }
  return broken;
}

function buildIndex() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'storybook-links-'));
  execFileSync('npx', ['storybook', 'build', '--config-dir', '.storybook', '-o', out], { cwd: REPO_ROOT, stdio: 'inherit' });
  return path.join(out, 'index.json');
}

function main() {
  const flag = process.argv.indexOf('--index');
  const index = flag > -1 ? process.argv[flag + 1] : buildIndex();
  const ids = indexIds(index);
  const files = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n').filter(Boolean);
  const broken = brokenLinks(files, ids);
  if (broken.length) {
    console.error(`check:storybook-links: ${broken.length} link(s) to a Storybook id missing from index.json`);
    for (const { file, line, id } of broken) console.error(`  ${file}:${line}  ${id}`);
    process.exit(1);
  }
  console.log(`check:storybook-links: every Storybook link resolves (${ids.size} entries)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
