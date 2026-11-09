#!/usr/bin/env node
/**
 * `npm run check:font-families` — every font stack ends where somebody chose,
 * and every fallback names the face its token names.
 *
 * See `scripts/font-families.mjs` for the three shapes and what each one cost:
 * a stack that names one face and no generic, a body fallback that names the
 * heading face, and a code stack that once fell back to `sans-serif`, measured
 * at 171.13px where `monospace` is 480.08px.
 *
 * WHY THIS IS A HARD GATE AND NOT A RATCHET. There were seven findings and all
 * seven are fixed. A ratchet exists for a population too large to repair in one
 * change; this one was not.
 *
 * Run: `npm run check:font-families`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { corpus } from './undefined-tokens.mjs';
import { failures, familyFallbacks, familyTokens } from './font-families.mjs';
import { CONSUMER_ROOTS, LIBRARY_ROOT, STORYBOOK_ROOT } from './lib/ds-facts.mjs';
import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
/** The library, Storybook and the prototypes. */
export const ROOTS = [LIBRARY_ROOT, STORYBOOK_ROOT, ...CONSUMER_ROOTS];

/** The floor, measured 2026-08-29. A walk that stopped matching finds nothing. */
// Lowered from 1300 to 700 when the Specs code, the root app and the specs prototypes left main (kept on archive/legacy-ds).
export const MIN_FILES = 700;

export const REMEDY =
  '  -> A fallback only paints when the token fails to load, which is exactly when\n' +
  '     there is nothing else to catch it. End every stack in a CSS generic, and\n' +
  "     start it with the same face the token starts with.";

const inputs = byRoot((repoRoot) =>
  corpus(repoRoot, ROOTS).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(repoRoot, rel), 'utf8'),
  })),
);

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const files = inputs(repoRoot);
  const found = failures(files).map((message) => ({ message }));
  if (files.length < MIN_FILES) {
    found.unshift({
      message: `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over.`,
    });
  }
  return found;
}

/** The green line, which carries the size of the population that was searched. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const files = inputs(repoRoot);
  return (
    `${familyTokens(files).size} family token(s) and ${familyFallbacks(files).length} inline ` +
    `fallback(s); every stack ends in a generic and names its token's own face`
  );
}

main(import.meta.url, 'check:font-families', { run, summary, remedy: REMEDY });
