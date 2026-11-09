#!/usr/bin/env node
/**
 * `npm run check:raw-buttons` — no unstyled or Bootstrap buttons in stories and docs.
 *
 * A raw `<button>` in a story or an MDX example renders as the browser's
 * default control, and a `className="btn btn-primary"` renders as Bootstrap
 * blue. Neither is the PLUS Button, so a reader of Storybook sees a control
 * the design system never drew. The PLUS components cover every case: `Button`
 * for an action, `IconButton` for an icon alone, `CloseButton` for a close X.
 *
 * WHAT IT READS. Every tracked `*.stories.jsx` and `*.mdx` file under
 * `design-system/src`, by `git ls-files` (a filesystem walk finds a second copy
 * of the tree under `.claude/worktrees/`).
 *
 * WHAT IT COUNTS, per file, each as a finding:
 *   - a JSX `<button` opening tag (lower case; `<Button` is the PLUS component);
 *   - a Bootstrap button class (`btn`, `btn-*`, `btn-close`, `btn-group`) inside
 *     a `className="..."` attribute. `plus-btn` is not Bootstrap and does not count.
 *
 * WHAT IT SKIPS (a simple heuristic, on purpose):
 *   - text inside backticks, so prose and inline code that merely name `<button>`
 *     are not findings;
 *   - fenced code blocks in `.mdx`, which show source rather than render it;
 *   - comment lines (`//`, `*`, `{/*`);
 *   - a line whose previous line carries a `raw-button:` comment. Use it when a
 *     native button is the point (a test proving a component works inside one,
 *     or an inert copy of another component's own markup), and give the reason:
 *         a `//` comment, or a JSX comment in MDX, reading `raw-button: <reason>`
 *
 * THE FLOOR. Zero. The record is empty, so there is no baseline: any hit is a
 * finding, and the only way to excuse one is the exemption comment above.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };

export const SEARCH_ROOTS = ['design-system/src'];
export const SEARCHED = /\.(stories\.jsx|mdx)$/;
/** A corpus smaller than this means the glob broke, not that the docs are clean. */
// Lowered from 500 to 300 when the Specs code, the root app and the specs prototypes left main (kept on archive/legacy-ds).
export const MIN_FILES = 300;

const EXEMPT = /raw-button:/;
const RAW_TAG = /<button\b/g;
const CLASS_ATTR = /className=\{?\s*["'`]([^"'`]*)["'`]/g;
/** `btn`, `btn-primary`, `btn-close`; not `plus-btn` (a hyphen before it) and not `btnish`. */
const BOOTSTRAP_BTN = /(?<![\w-])btn(?:-[\w-]+)?(?![\w-])/;

const isComment = (line) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line);
const withoutInlineCode = (line) => line.replace(/`[^`]*`/g, '``');

/**
 * Raw buttons in one file's text: `{line, kind}[]`, line 1-based.
 *
 * @param {string} text
 * @param {{mdx?: boolean}} [opts]
 */
export function scan(text, { mdx = false } = {}) {
  const lines = text.split('\n');
  const hits = [];
  let fenced = false;
  lines.forEach((raw, i) => {
    if (mdx && /^\s*```/.test(raw)) {
      fenced = !fenced;
      return;
    }
    if (fenced || isComment(raw)) return;
    if (i > 0 && EXEMPT.test(lines[i - 1])) return;
    const line = withoutInlineCode(raw);
    for (const _ of line.matchAll(RAW_TAG)) hits.push({ line: i + 1, kind: 'raw <button>' });
    for (const m of line.matchAll(CLASS_ATTR)) {
      if (BOOTSTRAP_BTN.test(m[1])) hits.push({ line: i + 1, kind: `Bootstrap button class "${m[1].trim()}"` });
    }
  });
  return hits;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

export const REMEDY =
  '  -> use the PLUS component: `Button` (an action), `IconButton` (an icon alone, with a label),\n' +
  '     `CloseButton` (a close X), imported from `@/components`. Map `disabled` to `isDisabled`.\n' +
  '     A native button that is the point of the demo takes a `raw-button: <reason>` comment on the line above.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources, minFiles = MIN_FILES } = {}) {
  const files = sources ?? sourcesOf(repoRoot);
  const findings = [];
  if (files.length < minFiles) {
    findings.push({ message: `${files.length} story and docs files searched, fewer than the ${minFiles} this was measured over.` });
  }
  for (const { path: file, text } of files) {
    for (const { line, kind } of scan(text, { mdx: file.endsWith('.mdx') })) {
      findings.push({ file, line, message: `${kind}: use the PLUS Button, IconButton or CloseButton` });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const files = sources ?? sourcesOf(repoRoot);
  return `${files.length} story and docs files swept, no raw or Bootstrap buttons.`;
}

main(import.meta.url, 'check:raw-buttons', { run, summary, remedy: REMEDY });
