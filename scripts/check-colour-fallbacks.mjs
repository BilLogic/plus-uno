#!/usr/bin/env node
/**
 * `npm run check:colour-fallbacks` — #268.
 *
 * What each defect is, and why one is ratcheted and the other is not, is written
 * once in `scripts/colour-fallbacks.mjs`. This file is the filesystem.
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
import { fileURLToPath } from 'node:url';

import { fallbackAudit, fallbackFailures, fallbackUsages, staleEntries, tokenDefinitions } from './colour-fallbacks.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(REPO_ROOT, 'docs', 'evals', 'colour-fallback-baseline.json');

const TOKEN_DIR = 'design-system/src/tokens';
const SEARCHED = /\.(scss|css|jsx|tsx|mdx|html)$/;
const SEARCH_ROOTS = ['design-system/src', '.storybook', 'prototypes'];

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
  const tokens = tokenDefinitions(tokenFiles);
  // An empty token map makes every `var()` look like an undefined token and
  // every comparison vacuous — the shape a moved directory produces.
  if (tokens.size === 0) {
    console.error(
      `[colour] no --color-* tokens found under ${TOKEN_DIR}. That is not a clean tree, it is a ` +
        'path that no longer exists.',
    );
    process.exit(1);
  }

  const sources = tracked(SEARCH_ROOTS).filter((f) => SEARCHED.test(f)).map(read);
  const audit = fallbackAudit({ tokens, usages: fallbackUsages(sources) });

  if (args.includes('--report')) console.log(JSON.stringify(audit, null, 2));

  if (args.includes('--update')) {
    const keys = [...new Set(audit.disagreements.map((d) => d.key))].sort();
    const undef = audit.undefinedTokens.map((u) => u.token).sort();
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(
      BASELINE,
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
    return;
  }

  let baseline = null;
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  } catch { /* absent — reported by fallbackFailures */ }

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

  if (failures.length) {
    console.error(`[colour] ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  -> ${f}`);
    process.exit(1);
  }

  console.log(
    `[colour] ${tokens.size} token(s); ${audit.comparable} comparable fallback(s), ` +
      `${audit.agreeing} agreeing, ${audit.disagreements.length} recorded; ` +
      `${audit.incomparable} not comparable; ${audit.undefinedTokens.length} undefined token(s), ` +
      'all recorded.',
  );
}

main();
