#!/usr/bin/env node
/**
 * `npm run check:font-size-literals` — no component sets a raw font size.
 *
 * WHY. Text in a component takes a text style (`font: var(--body-default)`)
 * or, for an icon glyph, an icon size (`font-size: var(--icon-md)`). A number
 * written in the component is a size nothing else knows about: the type scale
 * can change in Figma and the generated tokens with it, and that text stays
 * where it was. The type scale's move to the Atlassian sizes found seven of
 * them — `font-size: 7px` on a tag's dot, `16px` / `14px` / `12px` in two
 * snackbars, `1.5em` and `0.8em` on icons — and each one had been reading as
 * part of the scale.
 *
 * WHAT COUNTS AS A LITERAL. In a `font-size`, `font` or JSX `fontSize` / `font`
 * declaration, anything left once every `var(--name` is removed that is a
 * number (with or without a unit) or a CSS size keyword (`small`, `larger`, …).
 * A literal FALLBACK inside `var()` counts too — `var(--x, 12px)` paints 12px
 * the one time the token is missing, which is exactly when nothing else checks
 * it. `inherit`, `initial`, `unset` and `revert` are not literals: they take
 * the parent's size, which a token already set. Nor is a `calc()` that scales
 * a token (`calc(var(--icon-md) * 7 / 16)`, a tag's initials in its 16 disc):
 * the size moves when the token does.
 *
 * WHAT IT CANNOT SEE. A JSX value that is an identifier (`fontSize: size`) is
 * a variable whose value is decided at runtime; it is skipped rather than
 * guessed. An SCSS `$variable` is skipped for the same reason. Line heights
 * are not read: the ticket was font size, and `line-height: 1` on an icon
 * glyph is correct code.
 *
 * WHERE. `design-system/src/components` and `design-system/src/patterns`:
 * stylesheets and component source. Stories, tests and docs are excluded —
 * a story's demo frame is not a component.
 *
 * NO BASELINE. The count that is correct is zero, and it is zero.
 *
 * Run: npm run check:font-size-literals
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

/** The floor, measured 2026-10-23. A walk that stopped matching finds nothing. */
export const MIN_FILES = 200;

export const REMEDY =
  '  -> Give the text a style (`font: var(--body-default)`, `var(--heading-small)`, …)\n' +
  '     or an icon a size (`font-size: var(--icon-md)`), with no literal fallback.';

const KEYWORDS = /\b(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger)\b/;
const NUMBER = /(^|[^\w-])\d*\.?\d+/;

/** Blank comments to spaces, keeping line numbers. */
function stripComments(text, jsLike) {
  let out = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // A `//` comment, but not the `//` of a URL.
  out = out.replace(/(^|[^:'"])\/\/.*$/gm, (m, lead) => lead + ' '.repeat(m.length - lead.length));
  if (jsLike) out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '));
  return out;
}

/** True when a declared value sets a size with a literal. */
export function isLiteral(value) {
  // A `calc()` that scales a token is a size derived from that token.
  if (/^calc\(.*var\(--[\w-]+\)/.test(value) && !/var\(--[\w-]+\s*,/.test(value)) return false;
  const rest = value.replace(/var\(\s*--[\w-]+/g, '').replace(/#\{[^}]*\}/g, '');
  return NUMBER.test(rest) || KEYWORDS.test(rest);
}

/**
 * Every literal font size in the given files, as `{ file, line, value }`.
 *
 * @param {{path: string, text: string}[]} files
 */
export function literalSizes(files) {
  const found = [];
  for (const { path: file, text } of files) {
    const jsLike = /\.[jt]sx?$/.test(file);
    const source = stripComments(text, jsLike);
    const pattern = jsLike
      ? /\b(fontSize|font)\s*:\s*([^,}\n]+)/g
      : /(^|[\s;{])(font-size|font)\s*:\s*([^;{}]+)/g;
    for (const match of source.matchAll(pattern)) {
      const raw = (jsLike ? match[2] : match[3]).trim();
      // A JSX value that is not a literal string or number is a variable.
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
  const found = literalSizes(files).map(({ file, line, value }) => ({
    message: `${file}:${line} sets a literal font size: ${value}`,
  }));
  if (files.length < MIN_FILES) {
    found.unshift({ message: `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over.` });
  }
  return found;
}

/** The green line, which carries the size of the population that was searched. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).length} component and pattern files; every font size is a token`;
}

main(import.meta.url, 'check:font-size-literals', { run, summary, remedy: REMEDY });
