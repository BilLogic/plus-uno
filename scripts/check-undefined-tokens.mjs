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

const files = corpus(REPO_ROOT, ROOTS).map((rel) => ({
  path: rel,
  text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
}));

const { undefinedTokens, interpolated, defined } = audit(files);
const names = Object.keys(undefinedTokens);
const uses = names.reduce((n, k) => n + undefinedTokens[k].uses, 0);
const bare = names.reduce((n, k) => n + undefinedTokens[k].bare, 0);

if (process.argv.includes('--update')) {
  const tokens = {};
  for (const name of names) {
    tokens[name] = { uses: undefinedTokens[name].uses, bare: undefinedTokens[name].bare };
  }
  fs.writeFileSync(
    path.join(REPO_ROOT, BASELINE),
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
  process.exit(0);
}

const report = process.argv.includes('--report');
const baseline = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8'));
const found = ratchetFailures(undefinedTokens, baseline);

if (files.length < MIN_FILES) {
  found.unshift(
    `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over. ` +
      `A walk that stopped matching reports no undefined tokens and reads as a fix.`,
  );
}

if (report) {
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
  process.exit(0);
}

if (found.length) {
  console.error(`\n[undefined-tokens] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(
    `✗ check:undefined-tokens — ${names.length} name(s), ${uses} use(s), ${bare} bare, ` +
      `over ${files.length} files\n`,
  );
  console.error(
    '  -> A bare `var(--x)` on a token that does not exist DROPS the declaration.\n' +
      '     Point it at a real token. If a name genuinely went away, re-record with\n' +
      `     \`npm run check:undefined-tokens -- --update\` — and only downward.`,
  );
  process.exit(1);
}

console.log(
  `✓ check:undefined-tokens — ${names.length} undefined name(s) over ${uses} use(s) ` +
    `(${bare} bare) in ${files.length} files, none new (${defined} tokens defined)`,
);
