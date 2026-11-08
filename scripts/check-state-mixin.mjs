#!/usr/bin/env node
/**
 * `npm run check:state-mixin` — the guard the state mixin exists to make
 * unnecessary going forward.
 *
 * A component used to retype the same two blocks — `outline: none;` on
 * `:focus` to swallow the browser default, then the 2px ring on
 * `:focus-visible` — once per control, with a hand-picked token (`--ds-border-
 * focused`, the legacy `--color-focus-ring`, or the forced-colors `Highlight`
 * keyword). `design-system/src/styles/_state.scss`'s `plus-state` and
 * `plus-ring` mixins are the one place that pattern is written now; this check
 * counts the three ways of hand-rolling it outside that file.
 *
 * WHAT IT READS. Every tracked `.scss` file under `design-system/src/components`
 * and `design-system/src/patterns`, by `git ls-files` (a filesystem walk finds
 * a second copy of the tree under `.claude/worktrees/`). The mixin's own file,
 * `design-system/src/styles/_state.scss`, is excluded: it is where the three
 * patterns are SUPPOSED to live, once.
 *
 * WHAT IT COUNTS, per file, keyed `<rule> <path>`:
 *   outline-none        `outline: none` (or `0`), the raw reset.
 *   legacy-ring-token    `var(--color-focus-ring` or `-inverse)`, the pre-ADR-035 ring.
 *   highlight-ring       `Highlight` as an outline color, the forced-colors ring
 *                        written by hand instead of through `plus-ring`'s
 *                        `$high-contrast` option.
 *   hand-hover           a `:hover` pseudo-class selector written by hand —
 *                        the mixin's `hovered:` state key, not retyped per
 *                        component (#1698).
 *   hand-pressed         an `:active` pseudo-class selector written by
 *                        hand — the mixin's `pressed:` state key.
 *
 * THE RATCHET. The count of a (rule, file) pair may fall and never rise, and a
 * pair the baseline does not hold is a finding: a new file starts at zero. A
 * pair that reaches zero leaves the record, and the check reports the stale
 * entry until the record is regenerated. The record is
 * `scripts/baselines/state-mixin.json`, read and written through
 * `scripts/lib/ratchet.mjs` (`counts` form).
 *
 * HOW A PR LOWERS THE BASELINE. Adopt `plus-state` or `plus-ring`
 * (`design-system/src/styles/_state.scss`) in place of the hand-rolled rule,
 * then run
 *
 *     npm run check:state-mixin -- --update
 *
 * and commit the regenerated file in the same PR. Never edit the JSON by hand.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
/** Repo-relative: what the registry row declares. */
export const BASELINE = 'scripts/baselines/state-mixin.json';

export const SEARCH_ROOTS = ['design-system/src/components', 'design-system/src/patterns'];
export const SEARCHED = /\.scss$/;
/** The mixin's own file: the one place these three patterns are meant to live. */
const MIXIN_FILE = 'design-system/src/styles/_state.scss';
const TEST = /\.test\.[cm]?[jt]sx?$/;

/** A `$hovered-selector:` / `$pressed-selector:` argument passes `:hover` / `:active` text
 * straight through `plus-state` as the sanctioned selector override (Range, Checkbox, Radio,
 * Toggle); that line is the mixin call, not a hand-rolled rule next to it. */
const SELECTOR_OVERRIDE = /[$-]?(?:hovered|pressed|selected|disabled)-selector\s*:/;

const RULES = [
  ['outline-none', /outline\s*:\s*(none|0)\b/g],
  ['legacy-ring-token', /var\(\s*--color-focus-ring(-inverse)?\b/g],
  ['highlight-ring', /outline(?:-color)?\s*:[^;]*\bHighlight\b/g],
  ['hand-hover', /:hover\b/g, SELECTOR_OVERRIDE],
  ['hand-pressed', /:active\b/g, SELECTOR_OVERRIDE],
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
    if (TEST.test(file) || file === MIXIN_FILE) continue;
    const lines = text.split('\n');
    for (const [rule, re, exclude] of RULES) {
      let count = 0;
      let line;
      lines.forEach((l, i) => {
        if (exclude?.test(l)) return;
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
  '  -> draw hover, press, selection, disabled and the focus ring through `plus-state` or\n' +
  '     `plus-ring` in `design-system/src/styles/_state.scss` instead of retyping the ring by\n' +
  '     hand. A migration PR lowers the baseline with `npm run check:state-mixin -- --update`;\n' +
  '     never edit it by hand.';

const WHAT = {
  'outline-none': 'hand-rolled `outline: none`',
  'legacy-ring-token': 'legacy `--color-focus-ring` use',
  'highlight-ring': 'hand-rolled `Highlight` ring',
  'hand-hover': 'hand-rolled `:hover` selector',
  'hand-pressed': 'hand-rolled `:active` selector',
};

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
          ? `state mixin: ${failure.count} x ${WHAT[rule]} in a file the baseline does not hold (new code starts at zero)`
          : `state mixin: ${failure.count} x ${WHAT[rule]} rose against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      const [rule, ...rest] = entry.key.split(' ');
      findings.push({
        file: rest.join(' '),
        message: `${rule} is gone (baseline held ${entry.recorded}); regenerate with \`npm run check:state-mixin -- --update\``,
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
  return `${now} hand-rolled state/ring uses in ${found.size} rule/file pairs${fell}`;
}

/**
 * `--update` re-records the ratchet downward. It refuses a rise, or a pair
 * under a RULE the record already tracks, so the only movement it can write
 * for a known rule is down. It falls through to the gate, so a refused update
 * still fails loudly.
 *
 * A pair under a rule the record has NEVER tracked (no file anywhere in the
 * baseline carries that rule name) is the one-time seed for that rule, not a
 * rise: `hand-hover` and `hand-pressed` did not exist as rules until this
 * check was extended to them, so their first measurement across the whole
 * tree is what the ratchet starts counting down from, same as the baseline's
 * original rules did when this file did not exist yet.
 */
function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const knownRules = new Set([...ratchet.entries.keys()].map((key) => key.split(' ')[0]));
  const rising = ratchet.absent
    ? []
    : ratchet
        .failures(found)
        .filter((f) => (f.kind === 'new' || f.kind === 'rose') && knownRules.has(f.key.split(' ')[0]));
  if (rising.length) {
    console.error(`[check-state-mixin] not recorded: ${rising.length} pair(s) rose or are new. Use the state mixin instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'Hand-rolled focus-ring, hover and press patterns the state mixin (design-system/src/styles/_state.scss) exists ' +
        'to replace: a raw `outline: none` reset, the legacy `--color-focus-ring` token, a hand-written forced-colors ' +
        '`Highlight` ring, and a `:hover` / `:active` selector written outside the mixin\'s `hovered:` / `pressed:` ' +
        'state keys. Counted per rule and per file in design-system/src/components and design-system/src/patterns. ' +
        'A count may fall and never rise; a new file starts at zero. Regenerate with `npm run check:state-mixin -- --update`; ' +
        'never edit by hand.',
    },
  });
  console.log(`[check-state-mixin] baseline recorded: ${Object.keys(found).length} pairs`);
}

main(import.meta.url, 'check:state-mixin', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
