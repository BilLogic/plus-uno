#!/usr/bin/env node
/**
 * `npm run check:motion-literals` — motion in components and docs reads a
 * motion token; it never writes a time or a curve of its own (spec #2200).
 *
 * WHY. Motion is springs only: every duration and easing is generated from the
 * plan (`scripts/lib/tokens/plan.mjs`) into `--ds-motion-<family>-<speed>` and
 * its `-duration`. A `200ms` or a `cubic-bezier()` written in a component is a
 * timing nothing else knows about: the plan can change and that element keeps
 * its old feel, and a retired curve survives in the one place nobody searches.
 *
 * WHAT COUNTS. Inside a motion declaration (a `transition`, `animation`,
 * `*-duration`, `*-delay` or `duration` / `delay` key, in CSS or a JSX style
 * object), a number with a `ms` or `s` unit. A `cubic-bezier(` anywhere. A
 * time written beside no motion word (`width: 100ms` is not motion) is not read.
 *
 * WHAT IT CANNOT SEE. A bare number (`duration: 300`), a time held in a JS
 * variable, and a literal on a continuation line past a JS-style `,` that
 * starts the next property.
 *
 * WHERE. Tracked `.scss`, `.css`, `.jsx`, `.js`, `.mdx` and stories under
 * `design-system/`, less generated token output (`design-system/src/tokens/ladder/_*.scss`,
 * `*.generated.*`) and tests. In `.mdx`, prose is not read: only fenced code,
 * JSX lines and `style=` attributes. The generator lives in `scripts/`, outside
 * the roots.
 *
 * THE RATCHET. The count per file may fall and never rise; a file not in the
 * record starts at zero. The record is `scripts/baselines/motion-literals.json`,
 * through `scripts/lib/ratchet.mjs`. A migration PR moves its literals onto
 * tokens, then runs
 *
 *     npm run check:motion-literals -- --update
 *
 * and commits the lowered record. Never edit the JSON by hand.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
export const BASELINE = 'scripts/baselines/motion-literals.json';
export const SEARCH_ROOTS = ['design-system'];
export const SEARCHED = /\.(scss|css|jsx|js|mdx)$/;
const GENERATED = /(^design-system\/src\/tokens\/ladder\/_[^/]*\.scss$)|(\.generated\.[jt]sx?$)/;
const TEST = /\.test\.[jt]sx?$/;

/** True when a path is generated token output or a test: not source this check reads. */
export const excluded = (file) => GENERATED.test(file) || TEST.test(file);

const MOTION_WORD = /transition|animation|duration|delay/gi;
const TIME = /(?<![\w.-])\d*\.?\d+(?:ms|s)\b/g;
const BEZIER = /cubic-bezier\(/g;
const WINDOW_MAX = 400;

/** Blank comments to spaces, keeping offsets and line numbers. */
function stripComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"])\/\/.*$/gm, (m, lead) => lead + ' '.repeat(m.length - lead.length));
}

/** MDX: keep fenced code, JSX lines and `style=` lines; blank the prose. */
function mdxScannable(text) {
  let fenced = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced;
        return ' '.repeat(line.length);
      }
      return fenced || /^\s*</.test(line) || /style=/.test(line) ? line : ' '.repeat(line.length);
    })
    .join('\n');
}

/** Where the value of a motion word ends, from `from`. */
function windowEnd(text, from, cssLike) {
  const stop = cssLike ? /[;{}]/g : /[;}]|,\s*[\w$'"-]+\s*:/g;
  stop.lastIndex = from;
  const m = stop.exec(text);
  return Math.min(m ? m.index : text.length, from + WINDOW_MAX);
}

/**
 * Every raw motion literal in one file, as `{ line, value }`.
 *
 * @param {string} file
 * @param {string} text
 */
export function literalsIn(file, text) {
  const cssLike = /\.s?css$/.test(file);
  let source = stripComments(text);
  if (file.endsWith('.mdx')) source = mdxScannable(source);
  const hits = new Map(); // offset -> value
  for (const m of source.matchAll(BEZIER)) hits.set(m.index, 'cubic-bezier()');
  for (const word of source.matchAll(MOTION_WORD)) {
    const end = windowEnd(source, word.index, cssLike);
    for (const t of source.slice(word.index, end).matchAll(TIME)) hits.set(word.index + t.index, t[0]);
  }
  return [...hits.entries()]
    .sort(([a], [b]) => a - b)
    .map(([offset, value]) => ({ line: source.slice(0, offset).split('\n').length, value }));
}

/**
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  for (const { path: file, text } of sources) {
    if (excluded(file)) continue;
    const hits = literalsIn(file, text);
    if (hits.length) found.set(`motion-literal ${file}`, { count: hits.length, line: hits[0].line });
  }
  return found;
}

export const sourcesOf = (repoRoot) => trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);

const asRecord = (found) =>
  Object.fromEntries([...found.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, v.count]));

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });
const fileOf = (key) => key.slice('motion-literal '.length);

export const REMEDY =
  '  -> read a motion token: `transition: opacity var(--ds-motion-appearance-fast-duration) var(--ds-motion-appearance-fast)`.\n' +
  '     A migration PR lowers the record with `npm run check:motion-literals -- --update`; never edit it by hand.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const ratchet = ratchetFor(repoRoot);
  const findings = ratchet.failures(asRecord(found)).map((failure) => {
    if (failure.kind === 'absent') return { message: failure.message };
    return {
      file: fileOf(failure.key),
      line: found.get(failure.key)?.line,
      message:
        failure.kind === 'new'
          ? `motion literal: ${failure.count} raw duration/curve in a file the baseline does not hold (new code starts at zero)`
          : `motion literal: ${failure.count} raw duration/curve rose against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      findings.push({
        file: fileOf(entry.key),
        message: `no motion literals left (baseline held ${entry.recorded}); regenerate with \`npm run check:motion-literals -- --update\``,
      });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  const recorded = [...ratchetFor(repoRoot).entries.values()].reduce((sum, { count }) => sum + count, 0);
  const fell = now < recorded ? ` — under the baseline of ${recorded}; record it with --update` : '';
  return `${now} raw motion literals in ${found.size} file(s)${fell}`;
}

/** `--update` re-records downward; it refuses a rise, then falls through to the gate. */
function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-motion-literals] not recorded: ${rising.length} file(s) rose or are new. Read a motion token instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'Raw motion literals (a ms/s duration in a motion declaration, or a cubic-bezier) per file under design-system/ (spec #2200). ' +
        'A count may fall and never rise; a file that reaches zero leaves the record. Regenerate with ' +
        '`npm run check:motion-literals -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-motion-literals] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:motion-literals', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
