#!/usr/bin/env node
/**
 * `npm run check:ds-fallbacks` — no `--ds-*` color token is written with a
 * fallback.
 *
 * WHY THE RECORD IS EMPTY. The legacy `--color-*` tokens carry their
 * fallbacks as debt: well over a hundred disagree with their own token, and
 * `check:color-fallbacks` can only stop that set growing. The `--ds-*` tokens
 * start with none, so this ratchet starts at zero and has nowhere lower to go:
 * every fallback is new, and every one fails. A fallback only paints when the
 * token fails to load, and every `--ds-*` token has four values (light, dark and
 * each with increased contrast) where a literal has one — so a fallback is not
 * a safety net but a fifth, unmoded color that shows up only when something
 * else has already broken. Atlassian's own `token(path, fallback)` writes one;
 * the color migration's house rules do not.
 *
 * WHAT COUNTS. Any `var(--ds-…, …)`: a literal (`#fff`, `rgba(…)`, `white`) and
 * a nested `var()` alike. A `var(--ds-x, var(--color-y))` reads as a bridge to
 * the legacy name, and it is the same unmoded fallback one hop later, so it is
 * not an exception either. A use written across lines counts: the capture is
 * `fallbackUsages` from `scripts/token-fallbacks.mjs`, the one the fallback
 * checks share, read over the whole file. Its one blind spot is theirs too — a
 * fallback nested more than one `var()` deep is not matched.
 *
 * WHERE. What the fallback checks search, through the same lister
 * (`searchedSources` in `scripts/lib/fallback-check.mjs`). The generated color
 * files are skipped: they define the tokens, and a definition is not a use.
 *
 * Run: npm run check:ds-fallbacks
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COLOR_TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { searchedSources } from './lib/fallback-check.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { fallbackUsages } from './token-fallbacks.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The floor, measured 2026-10-25 at 1421 files. A listing that stopped finding
 * the tree finds no fallback either, which is the one green this must not give.
 */
export const MIN_FILES = 1300;

export const REMEDY =
  '  -> Write the token bare: `var(--ds-border-focused)`, not\n' +
  '     `var(--ds-border-focused, #147b84)`. The token has a value in every mode;\n' +
  '     a fallback is one more color that none of them chose.';

/**
 * Every `var(--ds-*, …)` in the given files, as `{ file, line, token }`, on the
 * line its `var(` opens.
 *
 * @param {{path: string, text: string}[]} files
 */
export function dsFallbacks(files) {
  return fallbackUsages(files, { prefix: '--ds-', multiline: true })
    .filter((use) => use.literal !== null)
    .map(({ path: file, line, token }) => ({ file, line, token }));
}

const inputs = byRoot((repoRoot) =>
  searchedSources(repoRoot).filter((source) => !source.path.startsWith(`${COLOR_TOKEN_DIR}/`)),
);

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const files = inputs(repoRoot);
  const found = dsFallbacks(files).map(({ file, line, token }) => ({
    message: `${file}:${line} writes ${token} with a fallback.`,
  }));
  if (files.length < MIN_FILES) {
    found.unshift({ message: `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over.` });
  }
  return found;
}

/** The green line, which carries how many `--ds-*` uses were read. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const files = inputs(repoRoot);
  const uses = fallbackUsages(files, { prefix: '--ds-', multiline: true }).length;
  return `${files.length} files, ${uses} --ds-* use(s); none written with a fallback`;
}

main(import.meta.url, 'check:ds-fallbacks', { run, summary, remedy: REMEDY });
