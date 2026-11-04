#!/usr/bin/env node
/**
 * `npm run check:react-bootstrap-imports` — the guard on the behavior layer.
 *
 * Base UI is becoming the single behavior layer for every interactive PLUS
 * component (ADR-037, widening ADR-036 and superseding the Bootstrap-fallback
 * half of ADR-009; #1687). Each family's
 * gated rebuild drops `react-bootstrap` in favor of Base UI parts or plain
 * markup, and this check holds the line while that migration runs family by
 * family: a file may stop importing `react-bootstrap`, never start.
 *
 * WHAT IT READS. Every tracked `.jsx .js .mjs .ts .tsx` file under
 * `design-system/src`, `prototypes` and `src`, by `git ls-files` (a filesystem
 * walk finds a second copy of the tree under `.claude/worktrees/`).
 *
 * WHAT IT COUNTS, per file: import statements naming `react-bootstrap` or one
 * of its subpaths (`react-bootstrap/Button`, ...) as their source.
 *
 * THE RATCHET. The count of a file may fall and never rise, and a file the
 * baseline does not hold starts at zero. A file that reaches zero leaves the
 * record, and the check reports the stale entry until the record is
 * regenerated. The record is `scripts/baselines/react-bootstrap-imports.json`,
 * read and written through `scripts/lib/ratchet.mjs` (`counts` form).
 *
 * HOW A PR LOWERS THE BASELINE. A migration PR moves a file off
 * `react-bootstrap` onto Base UI or plain markup, then runs
 *
 *     npm run check:react-bootstrap-imports -- --update
 *
 * and commits the regenerated file in the same PR. Never edit the JSON by
 * hand: `--update` refuses to record a rise or a new file.
 *
 * THE HARD BAN. Once the baseline reaches zero, the final sweep removes the
 * `react-bootstrap` dependency and this check's ratchet becomes a
 * floor of zero in every sense that matters: any import is a finding with
 * nothing in the record to excuse it.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
/** Repo-relative: this record's key in the shape table, and what the registry row declares. */
export const BASELINE = 'scripts/baselines/react-bootstrap-imports.json';

export const SEARCH_ROOTS = ['design-system/src', 'prototypes', 'src'];
export const SEARCHED = /\.(jsx|js|mjs|ts|tsx)$/;

/** An import statement whose source is `react-bootstrap` or one of its subpaths. */
const IMPORT = /\bimport\s[^;]*\bfrom\s+['"]react-bootstrap(?:\/[^'"]+)?['"]/g;

/**
 * Measure sources: `{ path, text }[]` in, `Map<file, {count, line}>` out, where
 * `line` is the first line the file was found on, for the finding to point at.
 *
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  for (const { path: file, text } of sources) {
    const lines = text.split('\n');
    let count = 0;
    let line;
    lines.forEach((l, i) => {
      const hits = l.match(IMPORT)?.length ?? 0;
      if (hits) line ??= i + 1;
      count += hits;
    });
    if (count > 0) found.set(file, { count, line });
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

/** The ratchet's side of a measurement: a plain `file -> count` object in path order. */
const asRecord = (found) =>
  Object.fromEntries(
    [...found.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, v.count]),
  );

/** Opened fresh on every call: `--update` writes the record and the gate then reads it back. */
const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

export const REMEDY =
  '  -> move this file onto Base UI (a wrapped part) or plain markup, in the family\'s gated\n' +
  '     rebuild (spec #1687). A migration PR lowers the baseline with\n' +
  '     `npm run check:react-bootstrap-imports -- --update`; never edit it by hand.';

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
          ? `react-bootstrap import: ${failure.count} x in a file the baseline does not hold (new code starts at zero)`
          : `react-bootstrap imports rose: ${failure.count} x against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      findings.push({
        file: entry.key,
        message: `react-bootstrap import is gone (baseline held ${entry.recorded}); regenerate with \`npm run check:react-bootstrap-imports -- --update\``,
      });
    }
  }
  return findings;
}

/** The total against the record, and a nudge when the code is under it. */
export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  const recorded = Object.values(ratchetFor(repoRoot).envelope('counts') ?? {}).reduce((a, b) => a + b, 0);
  const fell = now < recorded ? ` — under the baseline of ${recorded}; record it with --update` : '';
  return `${now} react-bootstrap imports in ${found.size} file(s)${fell}`;
}

/**
 * `--update` re-records the ratchet downward. It refuses a rise or a file the
 * record does not hold, so the only movement it can write is down. It falls
 * through to the gate, so a refused update still fails loudly.
 */
function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-react-bootstrap-imports] not recorded: ${rising.length} file(s) rose or are new. Move them onto Base UI instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'react-bootstrap import statements, per file, in design-system/src, prototypes and src. Base UI is the single ' +
        'behavior layer (ADR-037, #1687); a count may fall and never rise, a file that reaches zero leaves the ' +
        'record, and a new file starts at zero. At a baseline of zero the final sweep removes the dependency and ' +
        'this check becomes a hard ban. Regenerate with `npm run check:react-bootstrap-imports -- --update`; never ' +
        'edit by hand.',
    },
  });
  console.log(`[check-react-bootstrap-imports] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:react-bootstrap-imports', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
