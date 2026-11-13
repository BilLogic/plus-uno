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
 * ALLOWED. The Control group, pattern and component
 * tokens, `--radius-full`, `0`, `inherit`, and a `calc()` / `min()` that
 * scales a token (`calc(var(--tile-size) / 4)`: the corner moves with it).
 *
 * WHERE. `design-system/src/components` and `design-system/src/patterns`.
 * Token-definition files (`design-system/src/styles`) are exempt, as are
 * stories, tests and docs. A JSX value that is an identifier is a variable
 * decided at runtime and is skipped rather than guessed.
 *
 * Component SCSS reads roles; existing raw semantic holds are counted in
 * RADIUS_EXCEPTIONS below. Other source types retain the literal rule.
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
  '  -> Read a radius role: the Control group\n' +
  '     (`var(--radius-control-lg)`), a pattern or component token, or `var(--radius-full)`\n' +
  '     for a circle. No px, no %, no primitive step, no literal fallback.';

// Exact, reviewed holds for existing pixels. A visual migration belongs to
// the designer; new uses and stale entries fail this check.
export const RADIUS_EXCEPTIONS = [
  {
    "file": "design-system/src/components/forms-and-inputs/Checkbox/Checkbox.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/forms-and-inputs/Select/Select.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/forms-and-inputs/_internal/Calendar.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/forms-and-inputs/_internal/FieldFrame.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/forms-and-inputs/_internal/OptionRow.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/images-and-icons/Avatar/Avatar.scss",
    "token": "--radius-xxl",
    "count": 1,
    "why": "Keep the size-derived Avatar corner capped at 16px; this is proportional image geometry, not a surface role."
  },
  {
    "file": "design-system/src/components/images-and-icons/Tile/Tile.scss",
    "token": "--radius-sm",
    "count": 1,
    "why": "Keep the existing 2px small mark; the control roles are 6/8/10px and would change its shape."
  },
  {
    "file": "design-system/src/components/labels/AiMessage/AiMessage.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/AiMessage/AiMessage.scss",
    "token": "--radius-sm",
    "count": 1,
    "why": "Keep the existing 2px small mark; the control roles are 6/8/10px and would change its shape."
  },
  {
    "file": "design-system/src/components/labels/ChangeTag/ChangeTag.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/CountTag/CountTag.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/DateTag/DateTag.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/StatusTag/StatusTag.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/Suggestion/Suggestion.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/Tag/Tag.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/labels/Tag/Tag.scss",
    "token": "--radius-sm",
    "count": 3,
    "why": "Keep the existing 2px small mark; the control roles are 6/8/10px and would change its shape."
  },
  {
    "file": "design-system/src/components/layout-and-structure/ScrollBar/ScrollBar.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/loading/Skeleton/Skeleton.scss",
    "token": "--radius-md",
    "count": 5,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/messaging/Flag/Flag.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/messaging/Spotlight/Spotlight.scss",
    "token": "--radius-lg",
    "count": 1,
    "why": "Keep the existing 8px media corner; a control role would assign interactive sizing to an image."
  },
  {
    "file": "design-system/src/components/navigation/Link/Link.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/text-and-data-display/Code/Code.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/text-and-data-display/InlineEdit/InlineEdit.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  },
  {
    "file": "design-system/src/components/text-and-data-display/Table/Table.scss",
    "token": "--radius-md",
    "count": 1,
    "why": "Keep the existing 4px corner; the control roles are 6/8/10px and require a visual decision."
  }
];

/** Raw semantic scale reads in component SCSS, plus stale exception findings. */
export function roleRadii(files, exceptions = RADIUS_EXCEPTIONS) {
  const reads = files.filter((f) => f.path.endsWith('.scss') && f.path.startsWith('design-system/src/components/'))
    .flatMap(({ path: file, text }) => {
      const source = stripComments(text, false);
      return [...source.matchAll(/--radius-(?:\d+|sm|md|lg|xl|xxl)(?![\w-])/g)].map((m) => ({
        file, token: m[0], line: source.slice(0, m.index).split('\n').length,
      }));
    });
  const findings = [];
  for (const exception of exceptions) {
    if (!exception.why) {
      findings.push({ message: `radius exception needs a reason: ${exception.file} ${exception.token}` });
      continue;
    }
    const count = reads.filter((r) => r.file === exception.file && r.token === exception.token).length;
    if (count !== exception.count) findings.push({ message: `stale radius exception: ${exception.file} ${exception.token}: expected ${exception.count}, found ${count}` });
  }
  for (const read of reads) {
    if (!exceptions.some((e) => e.file === read.file && e.token === read.token && e.why && e.count === reads.filter((r) => r.file === read.file && r.token === read.token).length)) {
      findings.push({ ...read, message: `${read.file}:${read.line} reads raw radius scale ${read.token}; use a radius role or a reviewed central exception` });
    }
  }
  return findings;
}

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
export function run({ repoRoot = REPO_ROOT, exceptions = RADIUS_EXCEPTIONS } = {}) {
  const files = inputs(repoRoot);
  const found = literalRadii(files).map(({ file, line, value }) => ({
    message: `${file}:${line} sets a literal radius: ${value}`,
  }));
  found.push(...roleRadii(files, exceptions));
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
