#!/usr/bin/env node
/**
 * `npm run check:old-system` — the code holds only the current design system.
 *
 * The old system is every token generated from a Figma collection now under
 * `archived /`, plus the old type classes. It is gone from the code outside
 * `design-system/src/specs/`, and the ban is hard: any hit is a finding, with
 * no baseline and no `--update`. Git history and the `archive/pre-ads-library`
 * branch keep the past.
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js .mjs .ts .tsx .html .mdx
 * .md` file under `design-system/src`, `prototypes` and `src`, by
 * `git ls-files` (a filesystem walk finds a second copy of the tree under
 * `.claude/worktrees/`). Comments count: a comment that cites an old name
 * teaches it.
 *
 * WHAT IT COUNTS, per family and per file, keyed `<family> <path>`: lines
 * matching one of `FAMILIES`, a family named by its wildcard (`--x-*`) included.
 * Each family that moves to the current system adds its row here. The docs
 * outside these roots (guidelines, agent views, `docs/`) join when the docs
 * purge removes their legacy rows.
 *
 * WHAT IT SKIPS.
 *   - `design-system/src/specs/`: the Storybook Specs replica, not yet
 *     revamped. It reads the old tokens until its revamp deletes them.
 *   - `OLD_DEFINITIONS`: the token files that still declare the old names
 *     the Specs replica reads. They leave the global layer for `specs/`, and
 *     this list empties.
 *   - `NOT_THE_DESIGN_SYSTEM`: a file whose matching names belong to another
 *     tool's namespace, named with its reason.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
export const SEARCH_ROOTS = ['design-system/src', 'prototypes', 'src'];
export const SEARCHED = /\.(scss|css|jsx|js|mjs|ts|tsx|html|mdx|md)$/;

const SPECS = /^design-system\/src\/specs\//;

/** The token files that declare old names for the Specs replica, until they move into `specs/`. */
export const OLD_DEFINITIONS = [
  'design-system/src/tokens/_colors.scss',
  'design-system/src/tokens/_color_roles.scss',
  'design-system/src/tokens/_elevation.scss',
];

/** Files whose matches are another tool's names, not the design system's. */
const NOT_THE_DESIGN_SYSTEM = new Map([
  [
    'design-system/src/storybook-docs/storybook-tailwind.css',
    "Tailwind's theme namespace is `--color-*`; these name the docs chrome's own palette",
  ],
]);

/**
 * One row per old family: its name, the line pattern, and what to use instead.
 * The pattern refuses a match inside a longer name (`--bs-link-color-rgb`,
 * `--x--color-y`).
 */
export const FAMILIES = [
  {
    name: 'color',
    pattern: /(?<![\w-])--color-[a-z0-9*]/,
    remedy: 'the Material `--color-*` roles are old; use the `--ds-*` color token for the role (fill, edge, text, icon)',
  },
];

/**
 * Measure sources: `{ path, text }[]` in, `Map<key, {count, line}>` out.
 *
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  for (const { path: file, text } of sources) {
    if (SPECS.test(file) || OLD_DEFINITIONS.includes(file) || NOT_THE_DESIGN_SYSTEM.has(file)) continue;
    const lines = text.split('\n');
    for (const { name, pattern } of FAMILIES) {
      const hits = lines.flatMap((l, i) => (pattern.test(l) ? [i + 1] : []));
      if (hits.length) found.set(`${name} ${file}`, { count: hits.length, line: hits[0] });
    }
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

const REMEDY_OF = new Map(FAMILIES.map(({ name, remedy }) => [name, remedy]));

export const REMEDY = '  -> outside specs/ the code holds only the current design system; the old names may not come back.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  return [...measure(sources ?? sourcesOf(repoRoot))].map(([key, { count, line }]) => {
    const [family, ...rest] = key.split(' ');
    return { file: rest.join(' '), line, message: `old system: ${count} x ${family}; ${REMEDY_OF.get(family)}` };
  });
}

/** The total, for the one-line summary. */
export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const total = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  return `${total} old-system lines in ${found.size} family/file pairs`;
}

main(import.meta.url, 'check:old-system', { run, summary, remedy: REMEDY });
