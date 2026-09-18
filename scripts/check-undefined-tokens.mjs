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
 * and is a regression, so the bare count is held down on its own. Both numbers
 * are declared as ratcheted fields of the record's entry in
 * `scripts/lib/ratchet-shapes.mjs`, which is what holds them apart now (#600).
 *
 * THE RECORD IS `scripts/lib/ratchet.mjs`'s. This file reads it through the
 * module rather than parsing it, and `--update` is the module's MERGE rather
 * than a rewrite of its own: every key the module does not own — the envelope,
 * and anything a person adds beside the sets — survives by construction.
 *
 * Usage:
 *   npm run check:undefined-tokens              fail on any new or risen name
 *   npm run check:undefined-tokens -- --update  re-record the baseline
 *   npm run check:undefined-tokens -- --report  print every finding, exit 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
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
export const MIN_FILES = 1300;

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

/**
 * The record, on the shape `scripts/lib/ratchet-shapes.mjs` declares for it
 * (#600). Opened per call rather than memoized with the corpus: `update` merges
 * into the record as it was when the ratchet was opened, and this record holds
 * TWO ratcheted sets — the per-name entries and the census — so one held across
 * the other's write would write the pre-write record back.
 */
const gate = (repoRoot, set) => openRatchet({ file: BASELINE, set, repoRoot });

/**
 * What the run found, in THE RECORD'S OWN SHAPE — `{ name: { uses, bare } }`,
 * and nothing else. The measurement also carries the files each name appears
 * in, which the record does not hold and `--update` must therefore not write:
 * a ratchet writes back the entry it was handed.
 */
const measured = (undefinedTokens) =>
  Object.fromEntries(
    Object.entries(undefinedTokens).map(([name, entry]) => [name, { uses: entry.uses, bare: entry.bare }]),
  );

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files, undefinedTokens, names, uses, bare } = inputs(repoRoot);
  const entries = gate(repoRoot, 'tokens');

  // ONE stated absent-record error mode, the module's — said once, before the
  // census gate, because with nothing recorded every name would be reported new
  // and bury the only fact that matters.
  if (entries.absent) return entries.failures({}).map(({ message }) => ({ message }));

  const side = measured(undefinedTokens);
  const found = ratchetFailures(undefinedTokens, {
    failures: entries.failures(side),
    stale: entries.stale(side),
  }).map((message) => ({ message }));

  /*
   * The census is a ratcheted set of its own, and it is not the sum of the one
   * above: the three numbers are held down together, so a set of per-name moves
   * that cancel out cannot leave the whole population bigger than it was.
   */
  for (const rise of gate(repoRoot, 'totals').failures({ names: names.length, uses, bare })) {
    found.push({
      message:
        `ROSE totals.${rise.field} — ${rise.recorded} recorded, ${rise.count} now. ` +
        'The whole population may fall, never rise.',
    });
  }

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

/**
 * `--update` re-records the baseline. A write, which is why it is never inside
 * `run`, and it is the RATCHET's write (#600): the record is read, the container
 * at the declared path is replaced, and the whole record is written back, so
 * every key the module does not own survives. This function used to rebuild the
 * file from scratch — which is the write that, on three other records in this
 * repo, deleted the reasons a person had written, and is the defect that sank
 * the first attempt at #599.
 *
 * TWO SETS, TWO WRITES, THE SECOND OPENED AFTER THE FIRST. `tokens` and
 * `totals` are separate ratcheted containers of one record; `update` merges into
 * the record it read when it was opened, so a ratchet held from before the first
 * write would undo it.
 *
 * `seed` is only for a record that does not exist yet. On the one that does, the
 * envelope — its `note`, when it was measured, the roots it was measured over —
 * is its reader's, and an `--update` that restated it would be a rewrite again.
 */
function update(repoRoot = REPO_ROOT) {
  const { undefinedTokens, names, uses, bare } = inputs(repoRoot);
  const seed = {
    note:
      'Token names used in the corpus and defined nowhere in it. A ratchet: counts may ' +
      'FALL and must never RISE, and an entry that stops matching is itself a finding. ' +
      'Regenerate with `npm run check:undefined-tokens -- --update`, and only when the ' +
      'numbers went DOWN.',
    measuredAt: new Date().toISOString().slice(0, 10),
    roots: ROOTS,
  };
  gate(repoRoot, 'tokens').update(measured(undefinedTokens), { seed });
  gate(repoRoot, 'totals').update({ names: names.length, uses, bare }, { seed });
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
