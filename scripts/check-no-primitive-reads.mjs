/**
 * `npm run check:no-primitive-reads` — the ratchet on components and patterns
 * reading a primitive (ADR-038): a component or pattern reads a tier
 * token (components, patterns, semantics), never `--space-*`, `--radius-<n>`,
 * `--size-<n>` or `--stroke-<n>` directly. When no tier holds the value, the
 * gap is named and a ladder row is added (`scripts/lib/tokens/plan.mjs`).
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js` file under
 * `design-system/src/components` and `design-system/src/patterns`, by
 * `git ls-files`; tests and stories are skipped.
 *
 * WHAT IT COUNTS. `var(` uses of a primitive name, per file. A primitive is a
 * numbered step of the four scales in `_scales.scss`: `--space-<n>`,
 * `--radius-<n>`, `--size-<n>`, `--stroke-<n>`. `--radius-full` is not one: the
 * ladder's Radius/full row carries the primitive's own name (plan.mjs).
 *
 * THE RATCHET. A count may fall and never rise, read through
 * `scripts/lib/ratchet.mjs`; the baseline holds the residue the family PRs
 * have not migrated yet.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { varReferencePattern } from '../design-system/src/lib/tokens.mjs';

export { REPO_ROOT };

export const BASELINE = 'scripts/baselines/no-primitive-reads.json';
export const SEARCH_ROOTS = ['design-system/src/components', 'design-system/src/patterns'];
export const SEARCHED = /\.(scss|css|jsx|js)$/;
const SKIPPED = /\.(test|stories)\.[cm]?[jt]sx?$/;

const PRIMITIVE = /^--(space|radius|size|stroke)-\d+$/;

/** Whether a custom property name is a numbered primitive step. */
export const isPrimitive = (name) => PRIMITIVE.test(name);

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...SEARCH_ROOTS], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
    .split('\0')
    .filter((rel) => rel && SEARCHED.test(rel) && fs.existsSync(path.join(repoRoot, rel)))
    .map((rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') }));
}

/**
 * `path -> {count, line}` across every source.
 * @param {{path: string, text: string}[]} sources
 */
export function measure(sources) {
  const found = new Map();
  const pattern = varReferencePattern();
  for (const { path: file, text } of sources) {
    if (SKIPPED.test(file)) continue;
    let count = 0;
    let line;
    text.split('\n').forEach((l, i) => {
      const hits = [...l.matchAll(pattern)].filter(([, name]) => isPrimitive(name)).length;
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
  '  -> read the tier token: a component token if the component has one, else the pattern token, else a\n' +
  '     semantics step. When none holds the value, add a row to scripts/lib/tokens/plan.mjs and regenerate\n' +
  '     (design-system/guidelines/foundations/spacing.md, ADR-038).';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const ratchet = ratchetFor(repoRoot);
  const findings = ratchet.failures(asRecord(found)).map((failure) => {
    if (failure.kind === 'absent') return { message: failure.message };
    return {
      file: failure.key,
      line: found.get(failure.key)?.line,
      message:
        failure.kind === 'new'
          ? `primitive read: ${failure.count} use(s) in a file the baseline does not hold (new code reads a tier token)`
          : `primitive reads rose: ${failure.count} use(s) against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      findings.push({
        file: entry.key,
        message: `primitive reads fell (baseline held ${entry.recorded}); record it with \`npm run check:no-primitive-reads -- --update\``,
      });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  return `${now} primitive read(s) in ${found.size} component/pattern file(s)`;
}

function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-no-primitive-reads] not recorded: ${rising.length} file(s) rose or are new. Read a tier token instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'Reads of a numbered primitive (--space-<n>, --radius-<n>, --size-<n>, --stroke-<n>) in design-system/src/components and ' +
        'design-system/src/patterns, per file. The record only falls. Regenerate with `npm run check:no-primitive-reads -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-no-primitive-reads] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:no-primitive-reads', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
