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
 * `require('x')`, `import.meta.glob('x')`, `vi.mock('x')`/`jest.mock('x')`,
 * SCSS/CSS `@use`/`@import`/`@forward` and CSS `url()`. Comments are dropped
 * first, so an import commented out is not one. A
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

import { stripComments } from './lib/js-comments.mjs';
import { LIBRARY_ROOT, STORYBOOK_ROOT, CONSUMER_ROOTS } from './lib/ds-facts.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const FORMS_ROOT = 'design-system/src/components/forms-and-inputs';
export const FORMS_INTERNAL = `${FORMS_ROOT}/_internal`;
export const ROOTS = [LIBRARY_ROOT, STORYBOOK_ROOT, ...CONSUMER_ROOTS];
const SOURCE = /\.(?:[cm]?[jt]sx?|mdx|s?css)$/;

/**
 * The floors, one per root, measured 2026-11-19 (1278, 10 and 0 files). A walk that
 * stopped matching finds nothing, and one root vanishing must not hide behind
 * another's count. `prototypes/` holds no source on main, so it has no floor.
 */
export const MIN_FILES = 1200; // the library's, the one the registry row records
export const MIN_STORYBOOK_FILES = 8;
const FLOORS = { [LIBRARY_ROOT]: MIN_FILES, [STORYBOOK_ROOT]: MIN_STORYBOOK_FILES };

export const REMEDY =
  '  -> `_internal/` belongs to the forms-and-inputs components beside it. A piece another\n' +
  '     group needs goes through `design-system/src/lib/field` or `lib/menu`: move it there\n' +
  '     (or import the one that is already there) instead of reaching into the folder.';

const BARE_FORMS_INTERNAL = /(^|\/)forms-and-inputs\/_internal(\/|$)/;

const SPECIFIERS = [
  /\b(?:import|export)\b[^'"`;]*?\bfrom\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*(['"])([^'"\n]+)\1/g,
  /\b(?:import|require)\s*\(\s*(['"`])([^'"`\n]+)\1/g,
  /@(?:use|import|forward)\s+(['"])([^'"\n]+)\1/g,
  /\burl\(\s*(['"]?)([^'")\n]+)\1\s*\)/g,
];

/** `import.meta.glob(...)` and the test runners' module mocks take a string or a list of them. */
const CALLS = /\b(?:import\.meta\.glob|(?:vi|jest)\.(?:mock|doMock|unmock|importActual|requireActual))\s*\(\s*(\[[^\]]*\]|(['"`])[^'"`\n]+\2)/g;
const STRING = /(['"`])([^'"`\n]+)\1/g;

/** The text with its comments dropped: JS and SCSS by `stripComments`, MDX only its own comment forms (prose apostrophes would open a string). */
export function withoutComments(file, text) {
  if (/\.mdx$/.test(file)) return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
  return stripComments(text);
}

/** Every module specifier in `text` (comments already dropped), with its 1-based line in `original`. */
export function specifiers(text, original = text) {
  const found = [];
  for (const re of SPECIFIERS) for (const m of text.matchAll(re)) found.push({ spec: m[2], at: m.index });
  for (const m of text.matchAll(CALLS)) {
    for (const s of m[1].matchAll(STRING)) found.push({ spec: s[2].replace(/^!/, ''), at: m.index });
  }
  // Dropping a block comment drops its newlines, so the line is found in the original:
  // the nth line that writes this specifier as a whole string.
  const lines = original.split('\n');
  const whole = (line, spec) => new RegExp(`['"\`]!?${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`).test(line);
  const used = new Map();
  const seen = new Set();
  const out = [];
  for (const { spec, at } of found.sort((a, b) => a.at - b.at)) {
    const nth = used.get(spec) ?? 0;
    used.set(spec, nth + 1);
    let line = 0;
    for (let i = 0, k = 0; i < lines.length; i++) {
      if (whole(lines[i], spec) && k++ === nth) { line = i + 1; break; }
    }
    line ||= text.slice(0, at).split('\n').length;
    // `@import 'x'` also reads as a bare `import 'x'`: one finding per place.
    if (seen.has(`${line}:${spec}`)) { used.set(spec, nth); continue; }
    seen.add(`${line}:${spec}`);
    out.push({ spec, line });
  }
  return out;
}

const inside = (target, folder) => target === folder || target.startsWith(`${folder}/`);

/** Whether `spec`, written in repo-relative `file`, reaches the forms folder's `_internal`. */
export function reachesInternal(file, spec) {
  let target;
  if (spec.startsWith('.')) target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
  else if (spec.startsWith('@/')) target = path.posix.normalize(`${LIBRARY_ROOT}/${spec.slice(2)}`);
  else return BARE_FORMS_INTERNAL.test(spec);
  return inside(target, FORMS_INTERNAL);
}

/** Findings for already-read `{path, text}` sources. */
export function findInternalImports(files) {
  const found = [];
  for (const { path: file, text } of files) {
    if (inside(file, FORMS_ROOT)) continue;
    for (const { spec, line } of specifiers(withoutComments(file, text), text)) {
      if (reachesInternal(file, spec)) {
        found.push({ file, line, message: `imports \`${spec}\`, inside the forms-and-inputs \`_internal\` folder.` });
      }
    }
  }
  return found;
}

const inputs = byRoot((repoRoot) => trackedSources(repoRoot, ROOTS, SOURCE));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, minFiles = FLOORS } = {}) {
  const files = inputs(repoRoot);
  const found = findInternalImports(files);
  for (const [root, floor] of Object.entries(minFiles)) {
    const n = files.filter((f) => f.path.startsWith(`${root}/`)).length;
    if (n < floor) found.unshift({ message: `${n} files searched under ${root}, fewer than the ${floor} this was measured over.` });
  }
  return found;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).length} files read; none outside the forms folder imports its \`_internal\``;
}

main(import.meta.url, 'check:forms-internals', { run, summary, remedy: REMEDY });
