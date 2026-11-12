#!/usr/bin/env node
/**
 * `npm run check:slot-names` — one naming rule for the before and after slots.
 *
 * A component names a slot by what the slot accepts, so the right prop name is
 * predictable (`docs/engineering/coding.md` § Slot names):
 *
 *   iconBefore / iconAfter    an icon only
 *   elemBefore / elemAfter    any element: an avatar, a count, a tag
 *   icon                      the single icon of a component built around one
 *   trailingMetric            the count after a label
 *
 * The retired names are `leadingVisual`, `trailingVisual` and a bare `leading`
 * slot. Any of them is a finding, with no baseline and no exemption.
 *
 * WHAT IT READS. Every tracked `.jsx .js .mjs .mdx` file under the shared
 * source roots (`design-system/src`, `prototypes`, `src`), by `git ls-files`.
 *
 * WHAT IT COUNTS, per rule and per file, keyed `<rule> <path>`:
 *   word:leadingVisual / word:trailingVisual   the name anywhere on a line.
 *   prop:leading   a `leading` JSX attribute, object key, prop-type or
 *                  destructured parameter. A CSS class such as
 *                  `plus-option-row-leading` or prose ("a leading icon") is not
 *                  a prop and is not counted.
 *
 * Run: `npm run check:slot-names`.
 */
import { REPO_ROOT } from './lib/corpus.mjs';
import { SOURCE_ROOTS } from './lib/ds-facts.mjs';
import { main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
export const SEARCH_ROOTS = SOURCE_ROOTS;
export const SEARCHED = /\.(jsx|js|mjs|mdx)$/;

/** `leading` as a slot prop: attribute, key, optional key, `option.leading`, or a destructured name. */
const LEADING_PROP = /(?<![\w$-])leading\s*(?:=\s*[{"'`]|\??:\s)|\.leading\b(?!\s*\()|[{,]\s*leading\s*[,}]|^\s*leading\s*,\s*$/;

const LINE_RULES = [
  ['word:leadingVisual', /\bleadingVisual\b/],
  ['word:trailingVisual', /\btrailingVisual\b/],
  ['prop:leading', LEADING_PROP],
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
    const lines = text.split('\n');
    for (const [rule, re] of LINE_RULES) {
      const hits = lines.flatMap((l, i) => (re.test(l) ? [i + 1] : []));
      if (hits.length > 0) found.set(`${rule} ${file}`, { count: hits.length, line: hits[0] });
    }
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

const RULE_MESSAGE = new Map([
  ['word:leadingVisual', 'use `iconBefore` for an icon-only slot, `icon` for the single icon of a component, `elemBefore` for any element'],
  ['word:trailingVisual', 'use `iconAfter` for an icon-only slot or `elemAfter` for any element'],
  ['prop:leading', 'a before slot that takes any element is `elemBefore`'],
]);

export const REMEDY = '  -> name the slot by what it accepts: iconBefore / iconAfter, elemBefore / elemAfter, icon, trailingMetric.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  return [...found].map(([key, { count, line }]) => {
    const [rule, ...rest] = key.split(' ');
    return {
      file: rest.join(' '),
      line,
      message: `slot name: ${count} x ${rule}; ${RULE_MESSAGE.get(rule)}`,
    };
  });
}

/** The total, for the one-line summary. */
export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  return `${now} retired slot names in ${found.size} rule/file pairs`;
}

main(import.meta.url, 'check:slot-names', { run, summary, remedy: REMEDY });
