#!/usr/bin/env node
/**
 * `npm run check:forms-internals` — nothing outside the forms-and-inputs folder
 * imports its `_internal` folder.
 *
 * The forms folder's `_internal/` is private to the components beside it. A
 * piece that two groups need lives in `design-system/src/lib/field` or
 * `lib/menu`, which are shared on purpose; reaching past the folder into
 * `_internal` ties another group to code that is free to change.
 *
 * WHAT IT READS. Every tracked JS, TS, MDX and style file under the library,
 * Storybook's config and the prototypes, and every module specifier in it: an
 * `import`/`export … from`, a bare `import 'x'`, a dynamic `import('x')`,
 * `require('x')`, SCSS/CSS `@use`/`@import`/`@forward` and CSS `url()`. A
 * relative specifier resolves against the importing file, `@/` against
 * `design-system/src`; any other specifier that names
 * `forms-and-inputs/_internal` counts too. The specifier is read, not the file
 * resolved, so a path that does not exist yet is still held.
 *
 * WHY A HARD GATE. Nothing outside the folder imports it today, so there is no
 * population to ratchet: the first outside import is the finding.
 *
 * Run: `npm run check:forms-internals`.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LIBRARY_ROOT, STORYBOOK_ROOT, CONSUMER_ROOTS } from './lib/ds-facts.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const FORMS_ROOT = 'design-system/src/components/forms-and-inputs';
export const FORMS_INTERNAL = `${FORMS_ROOT}/_internal`;
export const ROOTS = [LIBRARY_ROOT, STORYBOOK_ROOT, ...CONSUMER_ROOTS];
const SOURCE = /\.(?:[cm]?[jt]sx?|mdx|s?css)$/;

/** The floor, measured 2026-11-19. A walk that stopped matching finds nothing. */
export const MIN_FILES = 1000;

export const REMEDY =
  '  -> `_internal/` belongs to the forms-and-inputs components beside it. A piece another\n' +
  '     group needs goes through `design-system/src/lib/field` or `lib/menu`: move it there\n' +
  '     (or import the one that is already there) instead of reaching into the folder.';

const SPECIFIERS = [
  /\b(?:import|export)\b[^'"`;]*?\bfrom\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*(['"])([^'"\n]+)\1/g,
  /\b(?:import|require)\s*\(\s*(['"`])([^'"`\n]+)\1/g,
  /@(?:use|import|forward)\s+(['"])([^'"\n]+)\1/g,
  /\burl\(\s*(['"]?)([^'")\n]+)\1\s*\)/g,
];

/** Every module specifier in `text`, with its 1-based line. */
export function specifiers(text) {
  const out = new Map(); // `@import 'x'` also reads as a bare `import 'x'`: one finding per place
  for (const re of SPECIFIERS) {
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split('\n').length;
      out.set(`${line}:${m[2]}`, { spec: m[2], line });
    }
  }
  return [...out.values()].sort((a, b) => a.line - b.line);
}

const inside = (target, folder) => target === folder || target.startsWith(`${folder}/`);

/** Whether `spec`, written in repo-relative `file`, reaches the forms folder's `_internal`. */
export function reachesInternal(file, spec) {
  let target;
  if (spec.startsWith('.')) target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
  else if (spec.startsWith('@/')) target = path.posix.normalize(`${LIBRARY_ROOT}/${spec.slice(2)}`);
  else return spec.includes('forms-and-inputs/_internal');
  return inside(target, FORMS_INTERNAL);
}

/** Findings for already-read `{path, text}` sources. */
export function findInternalImports(files) {
  const found = [];
  for (const { path: file, text } of files) {
    if (inside(file, FORMS_ROOT)) continue;
    for (const { spec, line } of specifiers(text)) {
      if (reachesInternal(file, spec)) {
        found.push({ file, line, message: `imports \`${spec}\`, inside the forms-and-inputs \`_internal\` folder.` });
      }
    }
  }
  return found;
}

const inputs = byRoot((repoRoot) => trackedSources(repoRoot, ROOTS, SOURCE));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, minFiles = MIN_FILES } = {}) {
  const files = inputs(repoRoot);
  const found = findInternalImports(files);
  if (files.length < minFiles) {
    found.unshift({ message: `${files.length} files searched, fewer than the ${minFiles} this was measured over.` });
  }
  return found;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).length} files read; none outside the forms folder imports its \`_internal\``;
}

main(import.meta.url, 'check:forms-internals', { run, summary, remedy: REMEDY });
