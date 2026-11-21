#!/usr/bin/env node
/**
 * `npm run check:show-code` — a template docs example's Show code is its own
 * source, never a string typed beside it.
 *
 * WHY IT EXISTS. Every template example used to be written twice: live JSX,
 * and a hand-typed string for Show code. Nothing tied the two, so they drifted
 * (a bar example whose snippet lost Back, a Page snippet that passed
 * `description` through a docs-only header, Panel snippets naming helpers no
 * reader could import). A template's examples now live in one `*Examples.jsx`
 * module of PLUS parts, the docs page prints each example from that module with
 * `showCode` (`storybook-docs/lib/show-code.js`), and the staging the docs add
 * (stage, window, Blanket) stays in `*Cases.jsx`, which Show code never reads.
 *
 * WHAT IT FAILS ON, under `design-system/src/templates` and
 * `design-system/src/storybook-docs/patterns` (a pattern page prints its examples the same way):
 *   1. a module named `*CaseCode*`: a place to type snippets;
 *   2. a `doCode` or `dontCode` prop in an `.mdx` page that is anything
 *      but `{CODE.Name}`: a string or template literal is a typed snippet;
 *   3. a `CODE` export that is not built with `showCode(`, or that holds a
 *      template-literal entry;
 *   4. an `*Examples.jsx` module that imports anything but `react`,
 *      `@/components` and `@/templates`. Those are the public barrels; there is
 *      no `@/lib` barrel, so a `@/lib/...` path is an internal helper a
 *      consumer cannot import and never belongs in printed code. A docs-only
 *      wrapper (`@/storybook-docs`) or a relative path is the same fault.
 *   5. a printed example that writes a color or percent literal (a hex or
 *      rgb color, a `35%`): style on tokens or a PLUS part, and stage anything
 *      with no DS part in the Cases module;
 *   6. under the patterns folder, a `DoDontPair` without both `doCode` and
 *      `dontCode`, unless its page is on `DEFERRED_PAGES` with the reason it
 *      waits. (Template pages still hold pairs that do not print; they are a
 *      separate follow-up and not read by this rule yet.)
 *
 * WHAT IT CANNOT SEE. Whether an example reads well or is the right one; that
 * is the docs review.
 */
import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { trackedFiles, trackedSources } from './lib/tracked-sources.mjs';

const PATTERNS_ROOT = 'design-system/src/storybook-docs/patterns';
const ROOTS = ['design-system/src/templates', PATTERNS_ROOT];

/** The only modules an example may import: the public barrels and React. */
const ALLOWED_IMPORTS = new Set(['react', '@/components', '@/templates']);

/** A hex or functional color, or a percent other than the full width, written inside an example's own source. */
const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?!100%)\d+(?:\.\d+)?%/g;

/** A pair, from its opening tag to the line that closes it. */
const PAIR = /<DoDontPair\b[\s\S]*?(?:\n\/>|\/>\n)/g;

/**
 * Pages whose pairs do not print yet, each with the reason it waits. It is
 * empty today: an entry leaves the day its pairs print, and the list never grows.
 */
export const DEFERRED_PAGES = {};

/**
 * Examples staged in a `*Cases.jsx` because no consumer can write them: the
 * figure is a styled decoration (a fade) that printed code, which sets layout on
 * tokens only, cannot carry. A pair may leave the matching code prop off for
 * these and nothing else.
 */
export const STAGED_ONLY = new Set(['FadedListCase']);

const CODE_PROP = /\b(doCode|dontCode)=(\{[^}]*\}|"[^"]*"|'[^']*')/g;
const CODE_REFERENCE = /^\{CODE\.[A-Za-z_$][\w$]*\}$/;
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/**
 * Every problem in one file, as `{ line, message }`.
 *
 * @param {string} file repo-relative path
 * @param {string} text file contents
 */
export function checkFile(file, text) {
  const found = [];
  if (/\.mdx$/.test(file)) {
    for (const match of text.matchAll(CODE_PROP)) {
      if (!CODE_REFERENCE.test(match[2])) {
        found.push({ line: lineOf(text, match.index), message: `${match[1]} is typed here; pass {CODE.Name}, printed from the example's own source with showCode` });
      }
    }
  }
  if (/Cases\.jsx$/.test(file)) {
    const code = /export const CODE\s*=/.exec(text);
    if (code) {
      const body = text.slice(code.index, text.indexOf('\n\n', code.index) === -1 ? undefined : text.indexOf('\n\n', code.index));
      if (!/showCode\(/.test(text)) found.push({ line: lineOf(text, code.index), message: 'CODE is not built with showCode(); print each example from its own source' });
      if (/`/.test(body)) found.push({ line: lineOf(text, code.index), message: 'CODE holds a template literal; a snippet is printed from source, never typed' });
    }
  }
  if (/Examples\.jsx$/.test(file)) {
    for (const match of text.matchAll(/^import\s[^;]*?from\s+'([^']+)'/gm)) {
      const from = match[1];
      if (ALLOWED_IMPORTS.has(from)) continue;
      const why = from.startsWith('@/storybook-docs')
        ? 'an example is PLUS parts only, and staging belongs in the Cases module'
        : from.startsWith('.')
          ? 'a relative path reaches outside the example; import PLUS parts from @/components or @/templates'
          : from.startsWith('@/lib')
            ? 'there is no @/lib barrel, so a consumer cannot write this import; use a PLUS part, or stage it in the Cases module'
            : 'an example imports only react, @/components and @/templates';
      found.push({ line: lineOf(text, match.index), message: `imports ${from}; ${why}` });
    }
    for (const match of text.matchAll(LITERAL)) {
      found.push({ line: lineOf(text, match.index), message: `writes the literal ${match[0].trim()}; style on a token or a PLUS part, and stage anything with no DS part in the Cases module` });
    }
  }
  if (/\.mdx$/.test(file) && file.startsWith(PATTERNS_ROOT) && !DEFERRED_PAGES[file]) {
    for (const match of text.matchAll(PAIR)) {
      const staged = (side) => STAGED_ONLY.has(new RegExp(`\\b${side}Example=\\{<(\\w+)`).exec(match[0])?.[1]);
      const missing = ['do', 'dont'].filter((side) => !staged(side) && !new RegExp(`\\b${side}Code=`).test(match[0])).map((side) => `${side}Code`);
      if (missing.length) found.push({ line: lineOf(text, match.index), message: `DoDontPair has no ${missing.join(' or ')}; every pair prints both examples' source` });
    }
  }
  return found;
}

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const findings = [];
  for (const file of trackedFiles(repoRoot, ROOTS)) {
    if (/CaseCode/.test(file)) findings.push({ file, message: 'a hand-typed code module; print Show code from the example with showCode instead' });
  }
  for (const { path: file, text } of trackedSources(repoRoot, ROOTS, /\.(mdx|jsx)$/)) {
    if (/\.(test|stories)\.jsx$/.test(file)) continue;
    for (const { line, message } of checkFile(file, text)) findings.push({ file, line, message });
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const pages = trackedSources(repoRoot, ROOTS, /\.mdx$/).filter(({ text }) => /\bdontCode=/.test(text)).length;
  return `${pages} page(s) print Show code from source.`;
}

export const REMEDY =
  '  -> Write the example once in the template\'s *Examples.jsx (PLUS parts only), stage it in *Cases.jsx,\n'
  + '     and build CODE with showCode(examplesSource, [...names]) (storybook-docs/lib/show-code.js).';

main(import.meta.url, 'check:show-code', { run, summary, remedy: REMEDY });
