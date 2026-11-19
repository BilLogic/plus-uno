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
 *   4. an `*Examples.jsx` module that imports a docs-only wrapper (anything
 *      from `@/storybook-docs`) or reaches outside its own folder
 *      with a relative path: it imports only the public barrels.
 *
 * WHAT IT CANNOT SEE. Whether an example reads well or is the right one; that
 * is the docs review.
 */
import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { trackedFiles, trackedSources } from './lib/tracked-sources.mjs';

const ROOTS = ['design-system/src/templates', 'design-system/src/storybook-docs/patterns'];

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
    for (const match of text.matchAll(/^import\s[^;]*?from\s+'(@\/storybook-docs[^']*)'/gm)) {
      found.push({ line: lineOf(text, match.index), message: `imports ${match[1]}; an example is PLUS parts only, and staging belongs in the Cases module` });
    }
    for (const match of text.matchAll(/^import\s[^;]*?from\s+'(\.\.[^']*)'/gm)) {
      found.push({ line: lineOf(text, match.index), message: `imports ${match[1]}, outside its own template folder; import PLUS parts from @/components or @/templates (a Blanket belongs to the Modal, so stage dimming goes in the Cases module)` });
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
