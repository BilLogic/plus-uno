#!/usr/bin/env node
/**
 * `npm run check:legacy-colors` — the guard on the color layer.
 *
 * Two layers of color tokens exist. The `--ds-*` semantic tokens are themed:
 * light, dark and more contrast. The legacy `--color-*` tokens are static
 * light-only values, and a component that reads one stays light in dark mode.
 * A hex fallback inside `var()` (`var(--x, #fff)`) is light-only for the same
 * reason, and it hides a token that is missing. New code uses `--ds-*`.
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js .mjs .ts .tsx .html .mdx`
 * file under `design-system/src/components`, `design-system/src/ai` and
 * `prototypes`, by `git ls-files` (a filesystem walk finds a second copy of the
 * tree under `.claude/worktrees/`). Tests are skipped: they plant fixture names.
 *
 * WHAT IT COUNTS, per file, keyed `<rule> <path>`:
 *   color-var      `var(--color-*` uses, whatever the fallback.
 *   hex-fallback   `var()` calls whose fallback is a hex literal.
 *
 * THE RATCHET. The count of a (rule, file) pair may fall and never rise, and a
 * pair the baseline does not hold is a finding: a new file starts at zero. A
 * pair that reaches zero leaves the record, and the check reports the stale
 * entry until the record is regenerated. The record is
 * `scripts/baselines/legacy-colors.json`, read and written through
 * `scripts/lib/ratchet.mjs` (`counts` form).
 *
 * HOW A PR LOWERS THE BASELINE. A migration PR moves a component onto `--ds-*`
 * (mapping: `design-system/guidelines/foundations/color-migration.md`), then runs
 *
 *     npm run check:legacy-colors -- --update
 *
 * and commits the regenerated file in the same PR. Never edit the JSON by hand:
 * `--update` refuses to record a rise or a new pair.
 */

import { LIBRARY_ROOT, PROTOTYPE_ROOTS } from './lib/ds-facts.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
/** Repo-relative: what the registry row declares. */
export const BASELINE = 'scripts/baselines/legacy-colors.json';

/** The library's components and AI parts, and the prototypes; the app shell is not held yet (`PROTOTYPE_ROOTS`). */
export const SEARCH_ROOTS = [`${LIBRARY_ROOT}/components`, `${LIBRARY_ROOT}/ai`, ...PROTOTYPE_ROOTS];
export const SEARCHED = /\.(scss|css|jsx|js|mjs|ts|tsx|html|mdx)$/;
const TEST = /\.test\.[cm]?[jt]sx?$/;

const RULES = [
  ['color-var', /var\(\s*--color-[a-z0-9-]*[a-z0-9]/g],
  ['hex-fallback', /var\(\s*--[a-z0-9-]+\s*,\s*#[0-9a-fA-F]{3,8}\b/g],
];

/**
 * Measure sources: `{ path, text }[]` in, `Map<key, {count, line}>` out, where
 * `line` is the first line the pair was found on, for the finding to point at.
 *
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  for (const { path: file, text } of sources) {
    if (TEST.test(file)) continue;
    const lines = text.split('\n');
    for (const [rule, re] of RULES) {
      let count = 0;
      let line;
      lines.forEach((l, i) => {
        const hits = l.match(re)?.length ?? 0;
        if (hits) line ??= i + 1;
        count += hits;
      });
      if (count > 0) found.set(`${rule} ${file}`, { count, line });
    }
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

/** The ratchet's side of a measurement: a plain `key -> count` object in key order. */
const asRecord = (found) =>
  Object.fromEntries(
    [...found.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, v.count]),
  );

/** Opened fresh on every call: `--update` writes the record and the gate then reads it back. */
const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

export const REMEDY =
  '  -> use the --ds-* tokens, which are themed for dark and more contrast (mapping:\n' +
  '     design-system/guidelines/foundations/color-migration.md), and drop the hex fallback. A migration PR\n' +
  '     lowers the baseline with `npm run check:legacy-colors -- --update`; never edit it by hand.';

const WHAT = { 'color-var': 'var(--color-*) use', 'hex-fallback': 'hex fallback in var()' };

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const ratchet = ratchetFor(repoRoot);
  const findings = ratchet.failures(asRecord(found)).map((failure) => {
    if (failure.kind === 'absent') return { message: failure.message };
    const [rule, ...rest] = failure.key.split(' ');
    return {
      file: rest.join(' '),
      line: found.get(failure.key)?.line,
      message:
        failure.kind === 'new'
          ? `legacy color: ${failure.count} x ${WHAT[rule]} in a file the baseline does not hold (new code starts at zero)`
          : `legacy color rose: ${failure.count} x ${WHAT[rule]} against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      const [rule, ...rest] = entry.key.split(' ');
      findings.push({
        file: rest.join(' '),
        message: `${rule} is gone (baseline held ${entry.recorded}); regenerate with \`npm run check:legacy-colors -- --update\``,
      });
    }
  }
  return findings;
}

/** The total against the record, and a nudge when the code is under it. */
export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  const recorded = [...ratchetFor(repoRoot).entries.values()].reduce((sum, { count }) => sum + count, 0);
  const fell = now < recorded ? ` — under the baseline of ${recorded}; record it with --update` : '';
  return `${now} legacy color uses in ${found.size} rule/file pairs${fell}`;
}

/**
 * `--update` re-records the ratchet downward. It refuses a rise or a pair the
 * record does not hold, so the only movement it can write is down. It falls
 * through to the gate, so a refused update still fails loudly.
 */
function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-legacy-colors] not recorded: ${rising.length} pair(s) rose or are new. Use the --ds-* tokens instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'Legacy --color-* uses and hex fallbacks inside var(), per rule and per file. They are light-only, so a component ' +
        'reading one stays light in dark mode. A count may fall and never rise; a pair that reaches zero leaves the record; ' +
        'a new file starts at zero. Regenerate with `npm run check:legacy-colors -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-legacy-colors] baseline recorded: ${Object.keys(found).length} pairs`);
}

main(import.meta.url, 'check:legacy-colors', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
