#!/usr/bin/env node
/**
 * `npm run check:size-fallbacks` — #268, the other half.
 *
 * `check:colour-fallbacks` holds the literal beside a COLOUR token to that
 * token's value. This holds the literal beside a DIMENSION token to its value,
 * over the same corpus, with the same ratchet, from the same module. The defect
 * is identical and the reason it needs a second entry point is not conceptual:
 * the two families disagree about which tokens they cover and whether an
 * undefined name is a finding. `scripts/token-fallbacks.mjs` says why, once.
 *
 * IT IS THE BIGGER HALF. 546 disagreements inside `design-system/src` against
 * colour's 191 across the whole corpus, and the spread is worse: 61 uses of
 * `var(--size-section-gap-sm, 16px)` for a token that is `8px`, 52 of
 * `var(--size-element-pad-y-lg, 12px)` for a token that is `8px`. When the token
 * sheet is late — the Storybook docs iframe and six prototype pages carry none —
 * that is not a slightly-wrong shade, it is a different layout.
 *
 * WHICH TOKENS COUNT. Any token, from the same token sources, whose value
 * RESOLVES to a length. Not a name prefix: dimensions are spread across
 * `--size-*`, `--spacing-*`, `--font-size-*` and `--font-line-height-*`, and a
 * prefix list is a thing to forget to update. Selecting by value means a new
 * family is covered the day it is minted.
 *
 * WHY UNDEFINED NAMES ARE NOT REPORTED HERE, when they are for colour: 324 of
 * them are component-local custom properties — `var(--table-cell-x, 10px)`,
 * defined a few lines up in the component's own stylesheet, where the fallback
 * is the documented default and the whole construction is correct. Colour has no
 * equivalent population, so there the undefined name really is a defect. Putting
 * both under one exit code would bury one finding under 324 non-findings, which
 * is how a check stops being read.
 *
 * Usage:
 *   npm run check:size-fallbacks              hold the ratchet
 *   npm run check:size-fallbacks -- --update  re-record the baseline
 *   npm run check:size-fallbacks -- --report  print the whole audit
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fallbackAudit,
  fallbackFailures,
  fallbackUsages,
  normaliseDimension,
  resolveAliases,
  staleEntries,
  tokenDefinitions,
} from './token-fallbacks.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(REPO_ROOT, 'docs', 'evals', 'size-fallback-baseline.json');

const TOKEN_DIR = 'design-system/src/tokens';
const SEARCHED = /\.(scss|css|jsx|tsx|mdx|html)$/;
const SEARCH_ROOTS = ['design-system/src', '.storybook', 'prototypes'];

/** Every custom-property name. The dimension family is then picked by VALUE. */
const ANY_TOKEN = /--[a-z0-9-]+/;

// `git ls-files`, not a filesystem walk: this repository keeps agent worktrees
// under `.claude/worktrees/`, and a walk finds a whole second copy of the tree.
const tracked = (patterns) =>
  execFileSync('git', ['-C', REPO_ROOT, 'ls-files', '-z', ...patterns], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean);

const read = (rel) => ({ path: rel, text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8') });

function main() {
  const args = process.argv.slice(2);

  const tokenFiles = tracked([TOKEN_DIR]).filter((f) => /\.(scss|css)$/.test(f)).map(read);
  const all = resolveAliases(tokenDefinitions(tokenFiles, { names: ANY_TOKEN }));
  const tokens = new Map([...all].filter(([, value]) => normaliseDimension(value) !== null));

  // An empty token map makes every comparison vacuous — the shape a moved
  // directory produces, and the shape that reports green on a broken tree.
  if (tokens.size === 0) {
    console.error(
      `[size] no dimension tokens found under ${TOKEN_DIR}. That is not a clean tree, it is a ` +
        'path that no longer exists.',
    );
    process.exit(1);
  }

  const sources = tracked(SEARCH_ROOTS).filter((f) => SEARCHED.test(f)).map(read);
  const audit = fallbackAudit({
    tokens,
    usages: fallbackUsages(sources, { names: ANY_TOKEN }),
    normalise: normaliseDimension,
    reportUndefined: false,
  });

  if (args.includes('--report')) console.log(JSON.stringify(audit, null, 2));

  if (args.includes('--update')) {
    const keys = [...new Set(audit.disagreements.map((d) => d.key))].sort();
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(
      BASELINE,
      `${JSON.stringify(
        {
          why:
            'Literal fallbacks that disagree with their own DIMENSION token (#268). The colour ' +
            'half is docs/evals/colour-fallback-baseline.json; this is the bigger one. Keyed on ' +
            '"<token> <literal>" rather than file and line, because a line number churns on ' +
            'every edit above it while the pair is the actual decision. The set may shrink and ' +
            'never grow; delete an entry when it is fixed, and the check reports any recorded ' +
            'pair that no longer disagrees. There is no undefinedTokens list here: an ' +
            'undefined name in this family is almost always a component-local custom property ' +
            'with a documented default, which is correct code — see scripts/check-size-fallbacks.mjs.',
          disagreements: keys,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`[size] baseline written: ${keys.length} distinct disagreeing pair(s).`);
    return;
  }

  let baseline = null;
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  } catch { /* absent — reported by fallbackFailures */ }

  const failures = fallbackFailures(audit, baseline, { noun: 'dimension' });
  const stale = baseline ? staleEntries(audit, baseline) : [];
  if (stale.length) {
    failures.push(
      `${stale.length} baseline entr(ies) that no longer disagree:\n` +
        stale.slice(0, 10).map((s) => `       ${s}`).join('\n') +
        (stale.length > 10 ? `\n       …and ${stale.length - 10} more` : '') +
        '\n     Someone fixed them. Delete the entries, so the baseline stops asserting\n' +
        '     something untrue and cannot readmit them silently.',
    );
  }

  if (failures.length) {
    console.error(`[size] ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  -> ${f}`);
    process.exit(1);
  }

  console.log(
    `[size] ${tokens.size} dimension token(s); ${audit.comparable} comparable fallback(s), ` +
      `${audit.agreeing} agreeing, ${audit.disagreements.length} recorded; ` +
      `${audit.incomparable} not comparable.`,
  );
}

main();
