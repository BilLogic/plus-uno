#!/usr/bin/env node
/**
 * `npm run check:radius-literals` — a component rounds its corners with a
 * radius token, never a number.
 *
 * WHY. Radius is a ladder: the semantic steps, the Radius / Control group,
 * and one token per pattern or component. A `4px`, a `50%` or a primitive
 * step (`--radius-0625`) written in a component is a corner nothing else
 * knows about: the ladder can move in Figma and the generated tokens with it,
 * and that corner stays where it was.
 *
 * WHAT COUNTS. In a `border-radius` (or a corner longhand such as
 * `border-start-end-radius`), a custom property named `--*-radius*`, or a JSX
 * `borderRadius`, any of: a length (`px`, `rem`, `em`), a `%`, a primitive
 * radius read (`--radius-0125` and the other numbered steps), or a literal
 * fallback inside `var()` (`var(--radius-full, 9999px)` draws 9999px the one
 * time the token is missing). Circles take `--radius-full`.
 *
 * ALLOWED. The semantic steps, the Control group, pattern and component
 * tokens, `--radius-full`, `0`, `inherit`, and a `calc()` / `min()` that
 * scales a token (`calc(var(--tile-size) / 4)`: the corner moves with it).
 *
 * WHERE. `design-system/src/components` and `design-system/src/patterns`.
 * Token-definition files (`design-system/src/styles`) are exempt, as are
 * stories, tests and docs. A JSX value that is an identifier is a variable
 * decided at runtime and is skipped rather than guessed.
 *
 * NO BASELINE. The count that is correct is zero.
 *
 * Run: npm run check:radius-literals
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['design-system/src/components', 'design-system/src/patterns'];
const EXT = ['.scss', '.css', '.jsx', '.js', '.tsx'];
const EXCLUDED = /\.(stories|test)\.[jt]sx?$/;

/** The floor, measured 2026-11-12. A walk that stopped matching finds nothing. */
export const MIN_FILES = 150;

export const REMEDY =
  '  -> Read a radius token: a semantic step (`var(--radius-md)`), the Control group\n' +
  '     (`var(--radius-control-lg)`), a pattern or component token, or `var(--radius-full)`\n' +
  '     for a circle. No px, no %, no primitive step, no literal fallback.';

const PRIMITIVE = /--radius-\d+\b/;
const LENGTH = /(^|[^\w.-])\d*\.?\d+\s*(px|rem|em|%)/;

/** Blank comments to spaces, keeping line numbers. */
function stripComments(text, jsLike) {
  let out = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/(^|[^:'"])\/\/.*$/gm, (m, lead) => lead + ' '.repeat(m.length - lead.length));
  if (jsLike) out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '));
  return out;
}

/** True when a declared radius value writes a number or a primitive. */
export function isLiteral(value) {
  if (PRIMITIVE.test(value)) return true;
  // `var(--token, fallback)`: the fallback is read as part of the value.
  const rest = value.replace(/var\(\s*--[\w-]+\s*\)/g, '').replace(/#\{[^}]*\}/g, '');
  return LENGTH.test(rest);
}

/**
 * Every literal radius in the given files, as `{ file, line, value }`.
 *
 * @param {{path: string, text: string}[]} files
 */
export function literalRadii(files) {
  const found = [];
  for (const { path: file, text } of files) {
    const jsLike = /\.[jt]sx?$/.test(file);
    const source = stripComments(text, jsLike);
    const pattern = jsLike
      ? /\b(borderRadius|--[\w-]*radius[\w-]*)['"]?\s*:\s*([^,}\n]+)/g
      : /(^|[\s;{])((?:border(?:-[a-z]+)*-radius|--[\w-]*radius[\w-]*))\s*:\s*([^;{}]+)/g;
    for (const match of source.matchAll(pattern)) {
      const raw = (jsLike ? match[2] : match[3]).trim();
      if (jsLike && !/^['"`\d.]/.test(raw)) continue;
      const value = jsLike ? raw.replace(/^['"`]|['"`]$/g, '') : raw.replace(/\s*!important$/, '');
      if (value.startsWith('$')) continue;
      if (!isLiteral(value)) continue;
      const line = source.slice(0, match.index + match[0].indexOf(match[jsLike ? 1 : 2])).split('\n').length;
      found.push({ file, line, value });
    }
  }
  return found;
}

const inputs = byRoot((repoRoot) =>
  ROOTS.flatMap((dir) => documents(dir, { root: repoRoot, ext: EXT }))
    .filter((rel) => !EXCLUDED.test(rel))
    .map((rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') })),
);

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const files = inputs(repoRoot);
  const found = literalRadii(files).map(({ file, line, value }) => ({
    message: `${file}:${line} sets a literal radius: ${value}`,
  }));
  if (files.length < MIN_FILES) {
    found.unshift({ message: `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over.` });
  }
  return found;
}

/** The green line, which carries the size of the population that was searched. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).length} component and pattern files; every radius is a token`;
}

main(import.meta.url, 'check:radius-literals', { run, summary, remedy: REMEDY });
