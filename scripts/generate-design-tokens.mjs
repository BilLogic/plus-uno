#!/usr/bin/env node
/**
 * `npm run generate:design-tokens` — the four-tier token ladder and motion
 * (ADR-038, #1756), generated from `scripts/lib/tokens/plan.mjs`.
 *
 * WHAT IT WRITES. `design-system/src/tokens/ladder/`: `_semantics.scss`,
 * `_patterns.scss`, `_components.scss`, `_layers.scss` from `TOKEN_LADDER`,
 * and `_springs.scss` plus `springs.generated.js` (the motion springs, ADR-041). `design-system/figma/variables-payload.json` is the combined Figma
 * variables payload for all of the above — written, never pushed; pushing it
 * is a separate, one-writer-queue step, out of scope here.
 *
 * `design-system/figma/motion-payload.json` is the Figma motion collection and
 * animation styles (#2281), applied unchanged by the Figma writer.
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

export const summary = () => `${artifacts().length} token ladder files match the plan`;

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
