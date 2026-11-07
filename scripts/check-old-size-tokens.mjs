/**
 * `npm run check:old-size-tokens` — the ratchet on the retired token names
 * (ADR-038, #1756): the old `--size-element-*` / `--element-*` / `--layout-*`
 * / `--overlay-*` names and the rest of `RETIRED_TOKENS`
 * (`scripts/lib/tokens/plan.mjs`). Their declarations are gone, so a `var()` of
 * one resolves to nothing; the baseline is empty and stays empty.
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js .mjs .ts .tsx .html .mdx`
 * file under `design-system/src`, `prototypes` and `src`, by `git ls-files`.
 *
 * WHAT IT COUNTS. `var(` uses of a name in `RETIRED_TOKENS`, per file — the
 * exact set, not a prefix: `--card-` and `--modal-` also open live pattern
 * tokens (`--card-stack-md`, `--modal-pad-x-default`).
 *
 * THE RATCHET. A count may fall and never rise, read through
 * `scripts/lib/ratchet.mjs`; the baseline is at zero.
 */

import { RETIRED_TOKENS } from './lib/tokens/plan.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';
import { varReferencePattern } from '../design-system/src/lib/tokens.mjs';

export { REPO_ROOT };

export const BASELINE = 'scripts/baselines/old-size-tokens.json';
export const SEARCH_ROOTS = ['design-system/src', 'prototypes', 'src'];
export const SEARCHED = /\.(scss|css|jsx|js|mjs|ts|tsx|html|mdx)$/;
const TEST = /\.test\.[cm]?[jt]sx?$/;

/**
 * The exact set of retired token names — not a prefix guess.
 * @returns {Set<string>}
 */
export function oldSizeTokenNames() {
  return new Set(RETIRED_TOKENS);
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

/**
 * `path -> {count, line}` across every source.
 * @param {{path: string, text: string}[]} sources
 * @param {Set<string>} oldNames
 */
export function measure(sources, oldNames) {
  const found = new Map();
  const pattern = varReferencePattern();
  for (const { path: file, text } of sources) {
    if (TEST.test(file)) continue;
    const lines = text.split('\n');
    let count = 0;
    let line;
    lines.forEach((l, i) => {
      const hits = [...l.matchAll(pattern)].filter(([, name]) => oldNames.has(name)).length;
      if (hits) line ??= i + 1;
      count += hits;
    });
    if (count > 0) found.set(file, { count, line });
  }
  return found;
}

const asRecord = (found) =>
  Object.fromEntries([...found.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, v.count]));

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

export const REMEDY =
  '  -> read the name that replaced it: architecture/token-tiers-name-map.md lists every retired name\n' +
  '     beside its replacement (design-system/src/tokens/ladder/, ADR-038).';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot), oldSizeTokenNames());
  const ratchet = ratchetFor(repoRoot);
  const findings = ratchet.failures(asRecord(found)).map((failure) => {
    if (failure.kind === 'absent') return { message: failure.message };
    return {
      file: failure.key,
      line: found.get(failure.key)?.line,
      message:
        failure.kind === 'new'
          ? `retired token name: ${failure.count} use(s) in a file the baseline does not hold (new code starts at zero)`
          : `old size tokens rose: ${failure.count} use(s) against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      findings.push({
        file: entry.key,
        message: `old size tokens are gone (baseline held ${entry.recorded}); regenerate with \`npm run check:old-size-tokens -- --update\``,
      });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot), oldSizeTokenNames());
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  const recorded = Object.values(ratchetFor(repoRoot).envelope('counts') ?? {}).reduce((a, b) => a + b, 0);
  const fell = now < recorded ? ` — under the baseline of ${recorded}; record it with --update` : '';
  return `${now} old-size-token uses in ${found.size} file(s)${fell}`;
}

function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT), oldSizeTokenNames()));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-old-size-tokens] not recorded: ${rising.length} file(s) rose or are new. Read the replacement name instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'Uses of the retired token names (RETIRED_TOKENS in scripts/lib/tokens/plan.mjs), per file. Their declarations ' +
        'are gone, so the record is empty and stays empty. Regenerate with `npm run check:old-size-tokens -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-old-size-tokens] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:old-size-tokens', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
