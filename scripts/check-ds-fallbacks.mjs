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
 * not an exception either.
 *
 * WHERE. What `check:color-fallbacks` searches: `design-system/src`,
 * `.storybook` and `prototypes`, listed through `git ls-files` because agent
 * worktrees live under `.claude/worktrees/`. The generated color files are
 * skipped: they define the tokens, and a definition is not a use.
 *
 * Run: npm run check:ds-fallbacks
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COLOR_TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { varReferencePattern } from '../design-system/src/lib/tokens.mjs';
import { byRoot, main } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEARCH_ROOTS = ['design-system/src', '.storybook', 'prototypes'];
const SEARCHED = /\.(scss|css|jsx|tsx|js|mdx|html)$/;

/**
 * The floor, measured 2026-10-25 at 1651 files. A listing that stopped finding
 * the tree finds no fallback either, which is the one green this must not give.
 */
export const MIN_FILES = 1500;

export const REMEDY =
  '  -> Write the token bare: `var(--ds-border-focused)`, not\n' +
  '     `var(--ds-border-focused, #147b84)`. The token has a value in every mode;\n' +
  '     a fallback is one more color that none of them chose.';

/** `var(--ds-name` then, after optional space, a comma: a fallback follows. */
const WITH_FALLBACK = new RegExp(`${varReferencePattern('--ds-').source}\\s*,`, 'g');

/**
 * Every `var(--ds-*, …)` in the given files, as `{ file, line, token }`.
 *
 * @param {{path: string, text: string}[]} files
 */
export function dsFallbacks(files) {
  const found = [];
  for (const { path: file, text } of files) {
    text.split('\n').forEach((line, i) => {
      for (const match of line.matchAll(WITH_FALLBACK)) found.push({ file, line: i + 1, token: match[1] });
    });
  }
  return found;
}

const inputs = byRoot((repoRoot) =>
  execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...SEARCH_ROOTS], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((rel) => rel && SEARCHED.test(rel) && !rel.startsWith(`${COLOR_TOKEN_DIR}/`))
    .map((rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') })),
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
  const uses = files.reduce((n, { text }) => n + [...text.matchAll(varReferencePattern('--ds-'))].length, 0);
  return `${files.length} files, ${uses} --ds-* use(s); none written with a fallback`;
}

main(import.meta.url, 'check:ds-fallbacks', { run, summary, remedy: REMEDY });
