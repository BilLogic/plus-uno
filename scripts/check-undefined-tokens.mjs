#!/usr/bin/env node
/**
 * `npm run check:undefined-tokens` — no NEW token that is used and defined
 * nowhere.
 *
 * See `scripts/undefined-tokens.mjs` for the defect and why no existing check
 * saw it. In short: `var(--font-weight-light)` is in six shipped components and
 * no such token exists, so text designed at 300 renders at its inherited
 * weight; `Tooltip` reaches for `--font-size-body4`, which does not exist
 * either, so its text has no size of its own.
 *
 * WHY A RATCHET AND NOT A THRESHOLD. 145 names across 508 uses were already
 * there when this was written. Failing the build on all of them would have made
 * the check unmergeable, and a check that cannot be merged protects nothing.
 * The baseline records what was found; it may fall and must never rise, and a
 * name that stops appearing is reported so a fix cannot leave a stale entry
 * behind.
 *
 * BARE IS RATCHETED SEPARATELY. `var(--x)` with no fallback drops the whole
 * declaration; `var(--x, 14px)` renders correctly and only lies about the token
 * name. A change that converts the second into the first keeps the total flat
 * and is a regression, so the bare count is held down on its own.
 *
 * Usage:
 *   npm run check:undefined-tokens              fail on any new or risen name
 *   npm run check:undefined-tokens -- --update  rewrite the baseline
 *   npm run check:undefined-tokens -- --report  print every finding, exit 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main } from './lib/findings.mjs';
import { audit, corpus, ratchetFailures } from './undefined-tokens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ROOTS = ['design-system/src', '.storybook', 'prototypes'];
const BASELINE = 'docs/evals/undefined-token-baseline.json';

/**
 * The floor. 1349 searched files, measured 2026-08-29. A walk that quietly
 * stopped matching would report zero undefined tokens and read as a fix — the
 * failure #234 found in the negation ratchet and `check:unspread-rest` found in
 * its own corpus walk.
 */
const MIN_FILES = 1300;

export const REMEDY =
  '  -> A bare `var(--x)` on a token that does not exist DROPS the declaration.\n' +
  '     Point it at a real token. If a name genuinely went away, re-record with\n' +
  `     \`npm run check:undefined-tokens -- --update\` — and only downward.`;

/**
 * The corpus walk and the audit over it, once per repo root. `run` asks what is
 * new, `summary` asks how big the recorded population is, and `--report` asks
 * for all of it — three questions over one read of 1361 files.
 */
const inputs = byRoot((repoRoot) => {
  const files = corpus(repoRoot, ROOTS).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(repoRoot, rel), 'utf8'),
  }));
  const { undefinedTokens, interpolated, defined } = audit(files);
  const names = Object.keys(undefinedTokens);
  const uses = names.reduce((n, k) => n + undefinedTokens[k].uses, 0);
  const bare = names.reduce((n, k) => n + undefinedTokens[k].bare, 0);
  return { files, undefinedTokens, interpolated, defined, names, uses, bare };
});

const baselineOf = (repoRoot) => JSON.parse(fs.readFileSync(path.join(repoRoot, BASELINE), 'utf8'));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, undefinedTokens } = inputs(repoRoot);
  const found = ratchetFailures(undefinedTokens, baselineOf(repoRoot)).map((message) => ({ message }));

  if (files.length < MIN_FILES) {
    found.unshift({
      message:
        `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over. ` +
        `A walk that stopped matching reports no undefined tokens and reads as a fix.`,
    });
  }
  return found;
}

/** The green line, which carries the whole recorded population so a drift is visible. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { files, names, uses, bare, defined } = inputs(repoRoot);
  return (
    `${names.length} undefined name(s) over ${uses} use(s) ` +
    `(${bare} bare) in ${files.length} files, none new (${defined} tokens defined)`
  );
}

/** `--update` rewrites the baseline. A write, which is why it is never inside `run`. */
function update(repoRoot = REPO_ROOT) {
  const { undefinedTokens, names, uses, bare } = inputs(repoRoot);
  const tokens = {};
  for (const name of names) {
    tokens[name] = { uses: undefinedTokens[name].uses, bare: undefinedTokens[name].bare };
  }
  fs.writeFileSync(
    path.join(repoRoot, BASELINE),
    `${JSON.stringify(
      {
        note:
          'Token names used in the corpus and defined nowhere in it. A ratchet: counts may ' +
          'FALL and must never RISE, and an entry that stops matching is itself a finding. ' +
          'Regenerate with `npm run check:undefined-tokens -- --update`, and only when the ' +
          'numbers went DOWN.',
        measuredAt: '2026-08-29',
        roots: ROOTS,
        totals: { names: names.length, uses, bare },
        tokens,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`[undefined-tokens] wrote ${BASELINE}: ${names.length} names, ${uses} uses, ${bare} bare.`);
}

/** `--report` prints the census rather than the ratchet, and passes either way. */
function printReport(repoRoot = REPO_ROOT) {
  const { undefinedTokens, interpolated, names, uses, bare } = inputs(repoRoot);
  console.log(`[undefined-tokens] ${names.length} name(s), ${uses} use(s), ${bare} bare:\n`);
  for (const name of names) {
    const entry = undefinedTokens[name];
    console.log(
      `  ${name.padEnd(42)} ${String(entry.uses).padStart(3)} use(s) ` +
        `${String(entry.bare).padStart(3)} bare  ${entry.files[0]}`,
    );
  }
  if (interpolated.length) {
    console.log(`\n  Not counted — produced by SCSS interpolation: ${interpolated.join(', ')}`);
  }
}

// The side flags belong to the CLI and not to `run`: one of them writes a file.
// Both are TERMINAL — they print or write instead of gating — so `main()` owns
// the entry comparison and the dispatch, and `--update` wins when both are
// typed because it is declared first.
main(import.meta.url, 'check:undefined-tokens', {
  run,
  summary,
  remedy: REMEDY,
  flags: { '--update': () => update(), '--report': () => printReport() },
});
