#!/usr/bin/env node
/**
 * `npm run check:dodont-figures` — every Do and Don't in the docs looks and
 * reads the same.
 *
 * WHY IT EXISTS. `Do`, `Dont`, `DoDont` and `DoDontPair` already put every
 * pair in one card (`DoDontCard`, in `storybook-docs/ds-docs-layout.jsx`): the
 * card owns the ground, border, radius, padding, height and centering. What
 * still drifted was what sat inside it: inline `style` wrappers that arranged
 * or boxed a figure, hand-drawn `<svg>`, an `<img>`, a hex color, and a pair
 * with no caption under it. A page now passes the card a figure and a
 * caption, and arranges several parts with `FigureRow` or `FigureStack`.
 *
 * WHAT IT FAILS ON, in any `.mdx` or `.jsx` under `design-system/src`:
 *   1. a figure with an inline `style`;
 *   2. a figure with an `<svg>` literal, an `<img>`, or a hex color: a figure
 *      is a live PLUS component or an illustration-kit drawing;
 *   3. a missing, empty or run-on caption: one sentence under the figure;
 *   4. `stacked` without a reason: a pair is side by side at docs width and
 *      stacks on its own when narrow, so `stacked="why"` says why a figure
 *      needs the full width.
 *
 * WHAT IT CANNOT SEE. Whether the two halves of a pair show the same
 * component, and whether a live figure is the right one: those are a reader's
 * judgment, so they live in the docs review, not in an exit code. A figure
 * built inside a separate helper component is read where it is written, not
 * where it is used.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { attrsOf, readElement } from './lib/docs-page.mjs';
import { main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SRC = 'design-system/src';

/** The files that define the Do and Don't blocks, not pages that use them. */
const DEFINITIONS = new Set([
  'design-system/src/storybook-docs/ds-docs-layout.jsx',
  'design-system/src/storybook-docs/foundation-blocks.jsx',
]);

const BLOCKS = /<(DoDontPair|DoDontCard|Dont|Do)(?=[\s>/])/g;

/** A caption as plain text: JSX tags and `{' '}` spacers dropped. */
export function captionText(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/^\{|\}$/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\{\s*(['"`])(.*?)\1\s*\}/g, '$2')
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when the text holds more than one sentence. */
export const isRunOn = (text) => /[.!?][”’")]?\s+[A-Z“‘"(]/.test(text.replace(/\b(e\.g|i\.e|vs)\./g, '$1'));

/** The problems with one figure's source. */
function figureProblems(figure) {
  const found = [];
  if (/\bstyle\s*=/.test(figure)) found.push('has an inline style; arrange parts with FigureRow or FigureStack, and let the card own the frame');
  if (/<svg[\s>]/.test(figure)) found.push('draws an <svg>; use a PLUS component or an illustration-kit drawing');
  if (/<img[\s/>]/.test(figure)) found.push('uses an <img>; use a PLUS component or an illustration-kit drawing');
  if (/#[0-9a-fA-F]{3,8}\b/.test(figure.replace(/&#\d+;/g, ''))) found.push('carries a hex color; use a PLUS component, which brings its own tokens');
  return found;
}

function captionProblems(label, raw) {
  const text = captionText(raw);
  if (!text) return [`${label} has no caption; put one sentence under the figure`];
  if (isRunOn(text)) return [`${label} caption runs past one sentence: "${text.slice(0, 60)}"`];
  return [];
}

/**
 * Every problem in one source file.
 *
 * @returns {{ line: number, message: string }[]}
 */
export function checkSource(source) {
  const problems = [];
  BLOCKS.lastIndex = 0;
  let m;
  while ((m = BLOCKS.exec(source))) {
    const el = readElement(source, m.index);
    const attrs = attrsOf(el.attrs);
    const line = source.slice(0, m.index).split('\n').length;
    const add = (message) => problems.push({ line, message: `<${el.name}> ${message}` });
    if (el.name === 'DoDontPair') {
      for (const [label, figure, caption] of [['Do', attrs.doExample, attrs.doCaption], ['Don’t', attrs.dontExample, attrs.dontCaption]]) {
        if (typeof figure === 'string') figureProblems(figure).forEach((p) => add(`${label} figure ${p}`));
        else add(`${label} figure is missing`);
        captionProblems(`${label}`, caption).forEach(add);
      }
      if (attrs.stacked !== undefined && !(typeof attrs.stacked === 'string' && /^(["'])\S[\s\S]*\1$/.test(attrs.stacked))) {
        add('uses stacked with no reason; write stacked="why the figure needs the full width"');
      }
    } else {
      figureProblems(el.children).forEach((p) => add(`figure ${p}`));
      captionProblems(el.name, attrs.caption).forEach(add);
    }
    BLOCKS.lastIndex = m.index + 1;
  }
  return problems;
}

function files(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files(full, out);
    else if (/\.(mdx|jsx)$/.test(e.name) && !/\.test\.jsx$/.test(e.name)) out.push(full);
  }
  return out;
}

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const findings = [];
  for (const abs of files(path.join(repoRoot, SRC))) {
    const file = path.relative(repoRoot, abs).split(path.sep).join('/');
    if (DEFINITIONS.has(file)) continue;
    const source = fs.readFileSync(abs, 'utf8');
    if (!/\bDo(Dont)?\b|DoDontPair|DoDontCard|<Dont\b/.test(source)) continue;
    for (const { line, message } of checkSource(source)) findings.push({ file, line, message });
  }
  return findings;
}

export const REMEDY =
  '  -> A Do or Don\'t figure is a live PLUS component or an illustration-kit drawing,\n'
  + '     with no inline style: arrange several parts with <FigureRow> or <FigureStack>\n'
  + '     (storybook-docs/ds-docs-layout.jsx). Put one sentence under it as the caption.';

export function summary({ repoRoot = REPO_ROOT } = {}) {
  let blocks = 0;
  for (const abs of files(path.join(repoRoot, SRC))) {
    const source = fs.readFileSync(abs, 'utf8');
    blocks += (source.match(BLOCKS) ?? []).length;
  }
  return `${blocks} Do and Don't block(s) hold one figure rule.`;
}

main(import.meta.url, 'check:dodont-figures', { run, summary, remedy: REMEDY });
