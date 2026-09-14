#!/usr/bin/env node
/**
 * `npm run check:colour-fallbacks` — #268.
 *
 * What each defect is, and why one is ratcheted and the other is not, is written
 * once in `scripts/token-fallbacks.mjs`. This file is the filesystem.
 *
 * WHY IT COMPOSES INTO `check:harness` when `check:storybook` and
 * `check:docs-chrome` do not: it is static. No browser, no server, no `npm ci` —
 * it parses the token sources and the tree, and runs in well under a second.
 *
 * Usage:
 *   npm run check:colour-fallbacks              hold the ratchet
 *   npm run check:colour-fallbacks -- --update  re-record the baseline
 *   npm run check:colour-fallbacks -- --report  print the whole audit
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
  resolveAliases,
  staleEntries,
  tokenDefinitions,
} from './token-fallbacks.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'docs/evals/colour-fallback-baseline.json';

const TOKEN_DIR = 'design-system/src/tokens';
const SEARCHED = /\.(scss|css|jsx|tsx|mdx|html)$/;
const SEARCH_ROOTS = ['design-system/src', '.storybook', 'prototypes'];

// `git ls-files`, not a filesystem walk: this repository keeps agent worktrees
// under `.claude/worktrees/`, and a walk finds a whole second copy of the tree.
const tracked = (repoRoot, patterns) =>
  execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...patterns], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean);

const read = (repoRoot, rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') });

/**
 * The token sources, the corpus and the audit over them — once per repo root.
 * `run`, `summary` and `--report` all want the same audit, and it is two
 * `git ls-files` runs and a parse of the whole tree; doing it once is the
 * difference between this check staying under a second and not.
 */
const inputs = byRoot((repoRoot) => {
  const tokenFiles = tracked(repoRoot, [TOKEN_DIR])
    .filter((f) => /\.(scss|css)$/.test(f))
    .map((rel) => read(repoRoot, rel));
  // Aliases resolved so `--color-x: var(--color-y)` compares as `--color-y`'s
  // value rather than as an incomparable `var()`. Only 11 of 195 colour tokens
  // are aliases, and adding this found two more disagreements immediately —
  // both in the `--color-info-*` family, which is one alias hop from
  // `--color-tertiary-*` and was therefore invisible to the check that shipped
  // in #313. Both are fixed in that change rather than recorded; the recorded
  // set is still 191.
  const tokens = resolveAliases(tokenDefinitions(tokenFiles));

  const sources = tracked(repoRoot, SEARCH_ROOTS)
    .filter((f) => SEARCHED.test(f))
    .map((rel) => read(repoRoot, rel));
  const audit = fallbackAudit({ tokens, usages: fallbackUsages(sources) });

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

  // An empty token map makes every `var()` look like an undefined token and
  // every comparison vacuous — the shape a moved directory produces.
  if (tokens.size === 0) {
    return [
      {
        message:
          `no --color-* tokens found under ${TOKEN_DIR}. That is not a clean tree, it is a ` +
          'path that no longer exists.',
      },
    ];
  }

  const failures = fallbackFailures(audit, baseline);
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
 * The green line. It carries the whole census rather than a verdict, because
 * the interesting number here is how much of the corpus was COMPARABLE: a drop
 * in that is how a parse quietly stops reading fallbacks at all.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { tokens, audit } = inputs(repoRoot);
  return (
    `${tokens.size} token(s); ${audit.comparable} comparable fallback(s), ` +
    `${audit.agreeing} agreeing, ${audit.disagreements.length} recorded; ` +
    `${audit.incomparable} not comparable; ${audit.undefinedTokens.length} undefined token(s), ` +
    'all recorded.'
  );
}

/** `--update` re-records the baseline. A write, so it stays out of `run`. */
function update(repoRoot = REPO_ROOT) {
  const { audit } = inputs(repoRoot);
  const keys = [...new Set(audit.disagreements.map((d) => d.key))].sort();
  const undef = audit.undefinedTokens.map((u) => u.token).sort();
  const file = path.join(repoRoot, BASELINE);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `${JSON.stringify(
      {
        why:
          'Literal fallbacks that disagree with their own token (#268). Keyed on ' +
          '"<token> <literal>" rather than file and line, because a line number churns on ' +
          'every edit above it while the pair is the actual decision. The set may shrink ' +
          'and never grow; delete an entry when it is fixed and the check reports any that ' +
          'no longer disagree. `undefinedTokens` is a separate list with a different ' +
          'endpoint: those names have no definition at all, so the fallback IS the colour, ' +
          'and the list should be driven to zero deliberately rather than shrinking as ' +
          'files are touched.',
        disagreements: keys,
        undefinedTokens: undef,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `[colour] baseline written: ${keys.length} distinct disagreeing pair(s), ` +
      `${undef.length} undefined token(s).`,
  );
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
else main(import.meta.url, 'check:colour-fallbacks', { run, summary });
