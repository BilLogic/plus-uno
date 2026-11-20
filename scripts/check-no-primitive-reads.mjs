/**
 * `npm run check:no-primitive-reads` — components, patterns, stories and docs
 * reading a primitive (ADR-038): a component or pattern reads a tier
 * token (components, templates, semantics), never `--space-*`, `--radius-<n>`,
 * `--size-<n>` or `--stroke-<n>` directly.
 *
 * STORIES AND DOCS. Stories feed Show code, and the docs figures and styles
 * feed the pages readers copy from, so they read a role token too: the whole
 * primitive set is forbidden in a story and a docs file exactly as in a
 * component. A palette color is a primitive everywhere.
 *
 * When no tier holds the value, the gap is named and a ladder row is added
 * (`scripts/lib/tokens/plan.mjs`).
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js` file under
 * `design-system/src/components`, `design-system/src/templates`,
 * the shared UI roots (`SHARED_UI_ROOTS`, `scripts/lib/ds-facts.mjs`),
 * `design-system/src/dataviz`, `design-system/src/storybook-docs` and `design-system/src/styles`, by
 * `git ls-files`; tests are skipped. The token definitions live in
 * `design-system/src/tokens`, outside every root.
 *
 * WHAT IT COUNTS. `var(` uses of a primitive name, per file. A primitive is a
 * numbered step of a scale in `_scales.scss` (`--space-<n>`, `--radius-<n>`,
 * `--size-<n>`, `--stroke-<n>`, `--height-<n>`, `--width-<n>`) or `_type.scss`
 * (`--type-size-<n>`), or a `--palette-*` color. `--radius-full` is not one: the
 * ladder's Radius/full row carries the primitive's own name (plan.mjs).
 *
 * ZERO. There is no baseline and no exemption: one read of a primitive in a counted file fails
 * the check. A demo-only frame in a story is a literal, not a read.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { SHARED_UI_ROOTS } from './lib/ds-facts.mjs';
import { main } from './lib/findings.mjs';
import { varReferencePattern } from '../design-system/src/lib/tokens.mjs';

export { REPO_ROOT };

export const SEARCH_ROOTS = [
  'design-system/src/components',
  'design-system/src/templates',
  ...SHARED_UI_ROOTS,
  'design-system/src/dataviz',
  'design-system/src/storybook-docs',
  'design-system/src/styles',
];
export const SEARCHED = /\.(scss|css|jsx|js)$/;
const SKIPPED = /\.test\.[cm]?[jt]sx?$/;
const PRIMITIVE = /^--(?:(?:space|radius|size|stroke|height|width|type-size)-\d+|palette-.+)$/;

/** Whether a custom property name is a primitive: a numbered step of a scale, or a palette color. */
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

export const REMEDY =
  '  -> read the tier token: a component token if the component has one, else the template token, else a\n' +
  '     semantics step. When none holds the value, add a row to scripts/lib/tokens/plan.mjs and regenerate\n' +
  '     (design-system/src/styles/Spacing.mdx § Fallback rule, ADR-038). A demo-only frame in a story stays a\n' +
  '     literal with a `/* demo frame */` note (design-system/guidelines/foundations/overview.md).';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  return [...found.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([file, { count, line }]) => ({
      file,
      line,
      message: `primitive read: ${count} use(s) of a primitive; read a tier token`,
    }));
}

export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  return `${now} primitive read(s) in ${found.size} file(s)`;
}

main(import.meta.url, 'check:no-primitive-reads', { run, summary, remedy: REMEDY });
