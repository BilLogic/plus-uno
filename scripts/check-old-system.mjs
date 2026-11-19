#!/usr/bin/env node
/**
 * `npm run check:old-system` — the code holds only the current design system.
 *
 * The old system is every token generated from a Figma collection now under
 * `archived /`, plus the old type classes. It is gone from the code, and the
 * ban is hard: any hit is a finding, with no baseline and no `--update`. Git
 * history and the `archive/deprecated-library` and `archive/legacy-ds`
 * branches keep the past.
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js .mjs .ts .tsx .html .mdx
 * .md` file under `design-system/src` and `prototypes`, by
 * `git ls-files` (a filesystem walk finds a second copy of the tree under
 * `.claude/worktrees/`), plus the docs that teach the system (`DOC_ROOTS`).
 * Comments count: a comment that cites an old name teaches it.
 *
 * WHAT IT COUNTS, per family and per file, keyed `<family> <path>`: lines
 * naming a retired token or an old family. Both are the retirement list's
 * (`design-system/agent-views/_inventions.json`): a spelling row with a `rule`
 * is a family (`color`, `elevation`, `size`, `type`), and a retired token row,
 * or a name the token plan retired (ADR-038), counts under `size`. A file the
 * list allows to keep retired tokens (decision records, the archive) is not read.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { SOURCE_ROOTS } from './lib/ds-facts.mjs';
import { main } from './lib/findings.mjs';
import { loadRetirement } from './lib/retirement.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
/** The docs an agent or a designer learns the system from. */
export const DOC_ROOTS = [
  '.storybook',
  'design-system/guidelines',
  'design-system/agent-views',
  'docs/engineering',
  'docs/conventions',
  'docs/connectors',
];
export const SEARCH_ROOTS = [...SOURCE_ROOTS, ...DOC_ROOTS];
export const SEARCHED = /\.(scss|css|jsx|js|mjs|ts|tsx|html|mdx|md)$/;


/** The retirement list: the old families are its spelling rows (by `rule`), the retired tokens its token rows. */
const RETIREMENT = loadRetirement(REPO_ROOT);

/** The family a retired token belongs to when its row names none: the ladder retired size and spacing names. */
const TOKEN_FAMILY = 'size';
const familyOf = (row) => row.rule ?? TOKEN_FAMILY;

/** One row per old family, from the list: its name and what to use instead. */
export const FAMILIES = RETIREMENT.ofKind('spelling')
  .filter((row) => row.rule && row.rule !== 'state-step')
  .map((row) => ({ name: row.rule, remedy: row.why }));

/**
 * Measure sources: `{ path, text }[]` in, `Map<key, {count, line}>` out.
 *
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  for (const { path: file, text } of sources) {
    if (RETIREMENT.allowed(file, 'token')) continue;
    const families = new Map();
    for (const { row, index } of RETIREMENT.findIn(text, { kinds: ['spelling', 'token'], retiredOnly: true, file })) {
      if (row.kind === 'spelling' && !row.rule) continue; // another check's spelling
      const lines = families.get(familyOf(row)) ?? new Set();
      lines.add(text.slice(0, index).split('\n').length);
      families.set(familyOf(row), lines);
    }
    for (const [name, lines] of families) found.set(`${name} ${file}`, { count: lines.size, line: Math.min(...lines) });
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

const REMEDY_OF = new Map(FAMILIES.map(({ name, remedy }) => [name, remedy]));

export const REMEDY = '  -> the code holds only the current design system; the old names may not come back.';

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
