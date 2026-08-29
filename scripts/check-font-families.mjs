#!/usr/bin/env node
/**
 * `npm run check:font-families` — every font stack ends where somebody chose,
 * and every fallback names the face its token names.
 *
 * See `scripts/font-families.mjs` for the three shapes and what each one cost.
 * In short: `--font-family-display4` named one face and no generic, so a
 * missing Open Sans fell through to the browser's default; three files fell
 * back from `--font-family-body` to Lato, which is the HEADER face, so body
 * text would have rendered in the heading font the one time the fallback was
 * needed; and `--font-family-code` once fell back to `sans-serif`, measured at
 * 171.13px where `monospace` is 480.08px.
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ROOTS = ['design-system/src', '.storybook', 'prototypes'];

/** The floor, measured 2026-08-29. A walk that stopped matching finds nothing. */
const MIN_FILES = 1300;

const files = corpus(REPO_ROOT, ROOTS).map((rel) => ({
  path: rel,
  text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
}));

const found = failures(files);
if (files.length < MIN_FILES) {
  found.unshift(
    `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over.`,
  );
}

const tokens = familyTokens(files);
const uses = familyFallbacks(files);

if (found.length) {
  console.error(`\n[font-families] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(`✗ check:font-families — ${tokens.size} family token(s), ${uses.length} fallback(s)\n`);
  console.error(
    '  -> A fallback only paints when the token fails to load, which is exactly when\n' +
      '     there is nothing else to catch it. End every stack in a CSS generic, and\n' +
      '     start it with the same face the token starts with.',
  );
  process.exit(1);
}

console.log(
  `✓ check:font-families — ${tokens.size} family token(s) and ${uses.length} inline ` +
    `fallback(s); every stack ends in a generic and names its token's own face`,
);
