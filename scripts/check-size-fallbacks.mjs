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
import { fileURLToPath, pathToFileURL } from 'node:url';

import { byRoot, main } from './lib/findings.mjs';
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
const BASELINE = 'docs/evals/size-fallback-baseline.json';

const TOKEN_DIR = 'design-system/src/tokens';
const SEARCHED = /\.(scss|css|jsx|tsx|mdx|html)$/;
const SEARCH_ROOTS = ['design-system/src', '.storybook', 'prototypes'];

/**
 * Every custom-property name — the `--` prefix and nothing narrower, since the
 * dimension family is picked by VALUE and not by name. The grammar after the
 * prefix is the tokens module's (#507); this file used to spell it.
 */
const ANY_TOKEN = '--';

// `git ls-files`, not a filesystem walk: this repository keeps agent worktrees
// under `.claude/worktrees/`, and a walk finds a whole second copy of the tree.
const tracked = (repoRoot, patterns) =>
  execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...patterns], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean);

const read = (repoRoot, rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') });

/**
 * The token sources, the corpus and the audit over them — once per repo root.
 * This is the bigger half: 1093 comparable fallbacks over the whole tracked
 * tree, so `run`, `summary` and `--report` share one walk rather than three.
 */
const inputs = byRoot((repoRoot) => {
  const tokenFiles = tracked(repoRoot, [TOKEN_DIR])
    .filter((f) => /\.(scss|css)$/.test(f))
    .map((rel) => read(repoRoot, rel));
  const all = resolveAliases(tokenDefinitions(tokenFiles, { prefix: ANY_TOKEN }));
  const tokens = new Map([...all].filter(([, value]) => normaliseDimension(value) !== null));

  const sources = tracked(repoRoot, SEARCH_ROOTS)
    .filter((f) => SEARCHED.test(f))
    .map((rel) => read(repoRoot, rel));
  const audit = fallbackAudit({
    tokens,
    usages: fallbackUsages(sources, { prefix: ANY_TOKEN }),
    normalise: normaliseDimension,
    reportUndefined: false,
  });

  let baseline = null;
  try {
    baseline = JSON.parse(fs.readFileSync(path.join(repoRoot, BASELINE), 'utf8'));
  } catch {
    /* absent — reported by fallbackFailures */
  }

  return { tokens, audit, baseline };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { tokens, audit, baseline } = inputs(repoRoot);

  // An empty token map makes every comparison vacuous — the shape a moved
  // directory produces, and the shape that reports green on a broken tree.
  if (tokens.size === 0) {
    return [
      {
        message:
          `no dimension tokens found under ${TOKEN_DIR}. That is not a clean tree, it is a ` +
          'path that no longer exists.',
      },
    ];
  }

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
  return failures.map((message) => ({ message }));
}

/**
 * The green line, which carries the census. There is no undefined-token count
 * here, for the reason the header gives: in this family an undefined name is
 * usually correct code.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { tokens, audit } = inputs(repoRoot);
  return (
    `${tokens.size} dimension token(s); ${audit.comparable} comparable fallback(s), ` +
    `${audit.agreeing} agreeing, ${audit.disagreements.length} recorded; ` +
    `${audit.incomparable} not comparable.`
  );
}

/** `--update` re-records the baseline. A write, so it stays out of `run`. */
function update(repoRoot = REPO_ROOT) {
  const { audit } = inputs(repoRoot);
  const keys = [...new Set(audit.disagreements.map((d) => d.key))].sort();
  const file = path.join(repoRoot, BASELINE);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
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
}

// The side flags belong to the CLI. `--report` dumps the audit and then still
// holds the gate, which is why it falls through; `--update` writes and stops,
// so it takes the other branch.
// The CLI is one branch or the other. A side flag prints (or writes) instead of
// gating, so the gate does not also run; `main()` re-checks the entry guard for
// itself, which is what keeps an import of this module reaching neither.
const entry = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (entry && process.argv.includes('--report')) {
  console.log(JSON.stringify(inputs(REPO_ROOT).audit, null, 2));
}
if (entry && process.argv.includes('--update')) update();
else main(import.meta.url, 'check:size-fallbacks', { run, summary });
