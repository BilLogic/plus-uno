#!/usr/bin/env node
/**
 * `npm run check:radius-literals` — a component rounds its corners with a
 * radius token, never a number.
 *
 * WHY. Radius is a ladder: the semantic steps, the Radius / Control group,
 * and one token per template or component. A `4px`, a `50%` or a primitive
 * step (`--space-0625`) written in a component is a corner nothing else
 * knows about: the ladder can move in Figma and the generated tokens with it,
 * and that corner stays where it was.
 *
 * WHAT COUNTS. In a `border-radius` (or a corner longhand such as
 * `border-start-end-radius`), a custom property named `--*-radius*`, or a JSX
 * `borderRadius`, any of: a length (`px`, `rem`, `em`), a `%`, a primitive
 * radius read (`--space-0125` and the other numbered steps), or a literal
 * fallback inside `var()` (`var(--radius-full, 9999px)` draws 9999px the one
 * time the token is missing). Circles take `--radius-full`.
 *
 * ALLOWED. The Control group, pattern and component
 * tokens, `--radius-full`, `0`, `inherit`, and a `calc()` / `min()` that
 * scales a token (`calc(var(--tile-size) / 4)`: the corner moves with it).
 *
 * WHERE. `design-system/src/components` and `design-system/src/templates`.
 * Token-definition files (`design-system/src/styles`) are exempt, as are
 * stories, tests and docs. A JSX value that is an identifier is a variable
 * decided at runtime and is skipped rather than guessed.
 *
 * Component SCSS reads roles; existing raw semantic holds are counted in
 * the `exceptions` list in scripts/exceptions.json and
 * the counts in scripts/baselines/radius-literals.json. Other source types retain the literal rule.
 *
 * NO BASELINE. The count that is correct is zero.
 *
 * Run: npm run check:radius-literals
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';
import { SHARED_UI_ROOTS } from './lib/ds-facts.mjs';
import { loadExceptions } from './lib/exceptions.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { absentMessage, openRatchet } from './lib/ratchet.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['design-system/src/components', 'design-system/src/templates', ...SHARED_UI_ROOTS];
const EXT = ['.scss', '.css', '.jsx', '.js', '.tsx'];
const EXCLUDED = /\.(stories|test)\.[jt]sx?$/;

/** The floor, measured 2026-11-12. A walk that stopped matching finds nothing. */
export const MIN_FILES = 150;

export const REMEDY =
  '  -> Read a radius role: the Control group\n' +
  '     (`var(--radius-control-lg)`), a template or component token, or `var(--radius-full)`\n' +
  '     for a circle. No px, no %, no primitive step, no literal fallback.';

/**
 * Reviewed holds for existing pixels: the `exceptions` list of this check in
 * `scripts/exceptions.json` (a file, a token and why it is held), with the count held in
 * `scripts/baselines/radius-literals.json`. The count may fall and never rise; a visual
 * migration belongs to the designer, and a new raw read is a finding.
 */
export const radiusExceptions = () => loadExceptions('check:radius-literals', 'exceptions');
export const RADIUS_RECORD = 'scripts/baselines/radius-literals.json';
const heldKey = (file, token) => `${file}|${token}`;

/** Raw semantic scale reads in component SCSS, plus the findings of a held count that rose or went stale. */
export function roleRadii(files, { exceptions = radiusExceptions(), ratchet = openRatchet({ file: RADIUS_RECORD }) } = {}) {
  const reads = files.filter((f) => f.path.endsWith('.scss') && ['design-system/src/components', ...SHARED_UI_ROOTS].some((root) => f.path.startsWith(`${root}/`)))
    .flatMap(({ path: file, text }) => {
      const source = stripComments(text, false);
      return [...source.matchAll(/--radius-(?:\d+|sm|md|lg|xl|xxl)(?![\w-])/g)].map((m) => ({
        file, token: m[0], line: source.slice(0, m.index).split('\n').length,
      }));
    });
  if (ratchet.absent) return [{ message: absentMessage(RADIUS_RECORD) }];
  const counts = {};
  for (const r of reads) counts[heldKey(r.file, r.token)] = (counts[heldKey(r.file, r.token)] ?? 0) + 1;
  const stale = (key, expected, found) => {
    const [file, token] = key.split('|');
    return { message: `stale radius exception: ${file} ${token}: expected ${expected}, found ${found}` };
  };
  const findings = [
    ...ratchet.failures(counts).filter((f) => f.kind === 'rose').map((f) => stale(f.key, f.recorded, f.count)),
    ...ratchet.stale(counts).map((s) => stale(s.key, s.recorded, 0)),
  ];
  const held = new Set(exceptions.map((e) => heldKey(e.at, e.token)));
  for (const read of reads) {
    const key = heldKey(read.file, read.token);
    const recorded = ratchet.entries.get(key)?.count;
    if (!held.has(key) || recorded === undefined || counts[key] > recorded) {
      findings.push({ ...read, message: `${read.file}:${read.line} reads raw radius scale ${read.token}; use a radius role or a reviewed central exception` });
    }
  }
  return findings;
}

const PRIMITIVE = /--(?:space|size|stroke|radius)-\d+\b/;
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
export function run({ repoRoot = REPO_ROOT, exceptions = radiusExceptions(), ratchet = openRatchet({ file: RADIUS_RECORD }) } = {}) {
  const files = inputs(repoRoot);
  const found = literalRadii(files).map(({ file, line, value }) => ({
    message: `${file}:${line} sets a literal radius: ${value}`,
  }));
  found.push(...roleRadii(files, { exceptions, ratchet }));
  if (files.length < MIN_FILES) {
    found.unshift({ message: `${files.length} files searched, fewer than the ${MIN_FILES} this was measured over.` });
  }
  return found;
}

/** The green line, which carries the size of the population that was searched. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).length} component and pattern files; every radius is a token; component SCSS uses roles or counted exceptions`;
}

main(import.meta.url, 'check:radius-literals', { run, summary, remedy: REMEDY });
