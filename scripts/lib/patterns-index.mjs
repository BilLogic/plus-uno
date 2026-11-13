/**
 * The "Patterns" section of `design-system/agent-views/components/index.md`,
 * from `design-system/agent-views/_patterns.json` and the DS facts.
 *
 * Agents read the component index as the existence list, so a pattern missing
 * from it reads as missing from the system: the ds-usage eval's agents wrote
 * "no design-system Card exists" while `PatternCard` shipped, and hand-made
 * their page shells. The list keeps only what source cannot say: the group a
 * pattern is filed under and when to reach for it. Its import line and its
 * Storybook page come from the facts (`scripts/lib/ds-facts.mjs`), which read
 * them from the barrels and the source. `checkPatterns` holds each name to the
 * facts, each page to a file, and every pattern the facts hold to a row.
 */

import fs from 'node:fs';
import path from 'node:path';

import { loadFacts } from './ds-facts.mjs';

export const PATTERNS_FILE = 'design-system/agent-views/_patterns.json';

/** The fields a row may carry: everything else comes from source. */
const ROW_FIELDS = new Set(['group', 'name', 'use']);

/** A pattern with no page of its own: the section of its parent's page that documents it. */
const FOLDED_INTO = { Backdrop: 'design-system/src/patterns/PatternModal/PatternModal.mdx' };

/** A pattern's Storybook page: the MDX beside its source, or the page it is folded into. */
const docOf = (answer, name) => FOLDED_INTO[name] ?? answer.source?.replace(/\.jsx$/, '.mdx') ?? null;

/**
 * Every row that names nothing real, keeps a field source owns, or points at a
 * page that is not there, and every pattern the facts hold with no row.
 * @param {{group: string, name: string, use: string}[]} rows
 * @param {{lookup: (name: string) => {status: string, kind: string|null, source: string|null},
 *   exists: (doc: string) => boolean, required: string[]}} env
 */
export function checkPatterns(rows, { lookup, exists, required }) {
  const problems = [];
  for (const r of rows) {
    const extra = Object.keys(r).filter((k) => !ROW_FIELDS.has(k));
    if (extra.length) problems.push(`${r.name}: ${extra.map((k) => `\`${k}\``).join(', ')} come from source; a row keeps only group, name and use`);
    const answer = lookup(r.name);
    if (answer.status !== 'exists' || !['pattern', 'component'].includes(answer.kind)) {
      problems.push(`${r.name} is not a pattern or component the design system exports`);
      continue;
    }
    const doc = docOf(answer, r.name);
    if (!doc || !exists(doc)) problems.push(`${r.name}: ${doc ?? 'its source'} is not a file`);
  }
  const listed = new Set(rows.map((r) => r.name));
  for (const name of required) if (!listed.has(name)) problems.push(`${name} is a pattern and missing from the list`);
  return problems;
}

/** The section, with doc links relative to the folder the index is written in. */
export function renderPatterns(rows, { from, lookup }) {
  const link = (doc) => path.relative(from, doc).split(path.sep).join('/');
  let out = `## Patterns: start a page, section, card, table or overlay here\n\n`;
  out += `A pattern is a shell that owns the frame (fill, pad, radius, elevation) and leaves you slots to fill. `;
  out += `Build a page or a container from these before writing a \`div\` with its own flex or grid. `;
  out += `Each one's props are on its page (linked) and in its source.\n\n`;
  out += `| Group | Name | Import | Reach for it when |\n|---|---|---|---|\n`;
  for (const r of rows) {
    const answer = lookup(r.name);
    out += `| ${r.group} | [\`${r.name}\`](${link(docOf(answer, r.name))}) | \`${answer.import}\` | ${r.use} |\n`;
  }
  return `${out}\n`;
}

/** The committed list's rows. */
export function readPatterns(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, PATTERNS_FILE), 'utf8')).patterns;
}

/** The router names every pattern too; this is the line it does so in. */
export const OVERVIEW_FILE = 'design-system/guidelines/overview.md';

/** Every pattern the facts hold: the `@/patterns` barrel's. */
const patternNames = (facts) => facts.manifests.components.components.filter((c) => c.kind === 'pattern').map((c) => c.name);

/** The committed list, read against the real facts and the router. */
export function checkCommitted(repoRoot) {
  const rows = readPatterns(repoRoot);
  const facts = loadFacts(repoRoot);
  const overview = fs.readFileSync(path.join(repoRoot, OVERVIEW_FILE), 'utf8');
  const unrouted = rows.filter((r) => !overview.includes(`\`${r.name}\``)).map((r) => `${r.name} is missing from ${OVERVIEW_FILE}`);
  const env = { lookup: (name) => facts.lookup(name), exists: (doc) => fs.existsSync(path.join(repoRoot, doc)), required: patternNames(facts) };
  return [...checkPatterns(rows, env), ...unrouted];
}
