#!/usr/bin/env node
/**
 * `npm run generate:design-tokens` — the deep-foundations role and motion
 * tokens (ADR-038), generated from `scripts/lib/tokens/plan.mjs`.
 *
 * WHAT IT WRITES. `design-system/src/tokens/deep/`: `_roles.scss` (container
 * and element role tokens, keyed to density), `_motion.scss` (duration and
 * easing roles, reduced-motion handled once), `_legacy-size-aliases.scss`
 * (the old names the role tokens make redundant, for one cycle) and
 * `figma-spec.json` (the Figma variables payload — written, never pushed;
 * pushing it is a separate, one-writer-queue step, out of scope here).
 *
 * Primitives (`--space-*`, `--radius-*`) are NOT written here: they already
 * exist, already on PLUS ×16 numbering, and nothing reads this generator for
 * them. See the header of `scripts/lib/tokens/plan.mjs`.
 *
 * Usage:
 *   node scripts/generate-design-tokens.mjs            # write
 *   node scripts/generate-design-tokens.mjs --check     # CI: fail on drift
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { artifacts as renderArtifacts } from './lib/tokens/build.mjs';
import { isEntry, main } from './lib/findings.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const NORM = (text) => text.replace(/\r\n/g, '\n');

/** @returns {{path: string, content: string}[]} every file this generator writes, rendered and not written */
export function artifacts() {
  return Object.entries(renderArtifacts()).map(([file, content]) => ({ path: `${TOKEN_DIR}/${file}`, content }));
}

/** The drift check. Reports and never writes. */
export function run({ repoRoot = ROOT } = {}) {
  return artifacts()
    .filter(({ path, content }) => {
      const abs = join(repoRoot, path);
      return !existsSync(abs) || NORM(readFileSync(abs, 'utf8')) !== content;
    })
    .map(({ path }) => ({ file: path, message: 'is stale or missing — run: npm run generate:design-tokens' }));
}

export const summary = () => `${artifacts().length} deep-foundation token files match the plan`;

if (isEntry(import.meta.url)) {
  if (process.argv.includes('--check')) {
    main(import.meta.url, 'check:design-tokens', { run, summary });
  } else {
    for (const { path, content } of artifacts()) {
      const abs = join(ROOT, path);
      if (existsSync(abs) && NORM(readFileSync(abs, 'utf8')) === content) continue;
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
      console.log(`[write] ${abs}`);
    }
    console.log(`[ok] ${summary()}`);
  }
}
