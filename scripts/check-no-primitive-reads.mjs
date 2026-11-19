/**
 * `npm run check:no-primitive-reads` — the ratchet on components and patterns
 * reading a primitive (ADR-038): a component or pattern reads a tier
 * token (components, templates, semantics), never `--space-*`, `--radius-<n>`,
 * `--size-<n>` or `--stroke-<n>` directly.
 *
 * STORIES AND DOCS. Stories feed Show code, and the docs figures and styles
 * feed the pages readers copy from, so they read a role token too. Until the
 * remaining numbered reads there are migrated, stories and docs files are
 * checked for `--space-<n>` and `--palette-*` ONLY, and held at zero. Their
 * `--size`, `--stroke`, `--height`, `--width` and `--type-size` reads are not
 * counted yet (a follow-up migration).
 *
 * When no tier holds the value, the gap is named and a ladder row is added
 * (`scripts/lib/tokens/plan.mjs`).
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js` file under
 * `design-system/src/components`, `design-system/src/templates`,
 * `design-system/src/storybook-docs` and `design-system/src/styles`, by
 * `git ls-files`; tests are skipped. The token definitions live in
 * `design-system/src/tokens`, outside every root.
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
export const SEARCH_ROOTS = [
  'design-system/src/components',
  'design-system/src/templates',
  'design-system/src/storybook-docs',
  'design-system/src/styles',
];
export const SEARCHED = /\.(scss|css|jsx|js)$/;
const SKIPPED = /\.test\.[cm]?[jt]sx?$/;
/** A story, or anything outside components and templates: the docs figures and styles. */
const DOCS_FILE = /\.stories\.[cm]?[jt]sx?$|^design-system\/src\/(storybook-docs|styles)\//;

const PRIMITIVE = /^--(space|radius|size|stroke|height|width|type-size)-\d+$/;

/** The primitives a story or a docs file must not read: a spacing step or a palette color. */
const DOCS_PRIMITIVE = /^--(?:space-\d+|palette-.+)$/;

/** Whether a custom property name is a numbered primitive step. */
export const isPrimitive = (name) => PRIMITIVE.test(name);

/** Whether `name` is a primitive for this file: the whole set in a component, the spacing and palette in a story or docs file. */
const isPrimitiveIn = (file, name) => (DOCS_FILE.test(file) ? DOCS_PRIMITIVE.test(name) : PRIMITIVE.test(name));

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
      const hits = [...l.matchAll(pattern)].filter(([, name]) => isPrimitiveIn(file, name)).length;
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
  '  -> read the tier token: a component token if the component has one, else the template token, else a\n' +
  '     semantics step. When none holds the value, add a row to scripts/lib/tokens/plan.mjs and regenerate\n' +
  '     (design-system/src/styles/Spacing.mdx § Fallback rule, ADR-038).';

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
  return `${now} primitive read(s) in ${found.size} file(s)`;
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
        'Reads of a numbered primitive (--space-<n>, --radius-<n>, --size-<n>, --stroke-<n>, --height-<n>, --width-<n>, --type-size-<n>) in design-system/src/components and ' +
        'design-system/src/templates, and of --space-<n> and --palette-* in their stories and in design-system/src/storybook-docs and design-system/src/styles (held at zero), per file. The record only falls. Regenerate with `npm run check:no-primitive-reads -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-no-primitive-reads] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:no-primitive-reads', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
