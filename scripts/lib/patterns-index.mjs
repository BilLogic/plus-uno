/**
 * The "Patterns" section of `design-system/agent-views/components/index.md`,
 * from `design-system/agent-views/_patterns.json`.
 *
 * Agents read the component index as the existence list, so a pattern missing
 * from it reads as missing from the system: the ds-usage eval's agents wrote
 * "no design-system Card exists" while `PatternCard` shipped, and hand-made
 * their page shells. The list is hand-kept, since each row says when to reach
 * for the pattern; the rendering is generated, and `checkPatterns` holds each
 * name to its barrel, each doc to a file, and every pattern the `@/patterns`
 * barrel exports to a row.
 */

import fs from 'node:fs';
import path from 'node:path';

import { extractExports, publicNames, resolveBarrel } from './barrel-exports.js';

export const PATTERNS_FILE = 'design-system/agent-views/_patterns.json';

/**
 * Every row that names nothing real, and every barrel pattern with no row.
 * @param {{name: string, import: string, doc: string}[]} rows
 * @param {{exportsOf: Record<string, string[]>, exists: (doc: string) => boolean, required: string[]}} env
 */
export function checkPatterns(rows, { exportsOf, exists, required }) {
  const problems = [];
  for (const r of rows) {
    if (!(exportsOf[r.import] ?? []).includes(r.name)) problems.push(`${r.name} is not exported from ${r.import}`);
    if (!exists(r.doc)) problems.push(`${r.name}: ${r.doc} is not a file`);
  }
  const listed = new Set(rows.map((r) => r.name));
  for (const name of required) if (!listed.has(name)) problems.push(`${name} is exported from @/patterns and missing from the list`);
  return problems;
}

/** The section, with doc links relative to the folder the index is written in. */
export function renderPatterns(rows, { from }) {
  const link = (doc) => path.relative(from, doc).split(path.sep).join('/');
  let out = `## Patterns: start a page, section, card, table or overlay here\n\n`;
  out += `A pattern is a shell that owns the frame (fill, pad, radius, elevation) and leaves you slots to fill. `;
  out += `Build a page or a container from these before writing a \`div\` with its own flex or grid. `;
  out += `Each one's props are on its page (linked) and in its source.\n\n`;
  out += `| Pattern | Name | Import | Reach for it when |\n|---|---|---|---|\n`;
  for (const r of rows) {
    out += `| ${r.group} | [\`${r.name}\`](${link(r.doc)}) | \`import { ${r.name} } from '${r.import}';\` | ${r.use} |\n`;
  }
  return `${out}\n`;
}

/** The router names every pattern too; this is the line it does so in. */
export const OVERVIEW_FILE = 'design-system/guidelines/overview.md';

/** The committed list, read against the real barrels and the router. */
export function checkCommitted(repoRoot) {
  const rows = readPatterns(repoRoot);
  const overview = fs.readFileSync(path.join(repoRoot, OVERVIEW_FILE), 'utf8');
  const unrouted = rows.filter((r) => !overview.includes(`\`${r.name}\``)).map((r) => `${r.name} is missing from ${OVERVIEW_FILE}`);
  const from = path.join(repoRoot, 'package.json');
  const exportsOf = {};
  for (const spec of new Set(rows.map((r) => r.import))) {
    exportsOf[spec] = publicNames(resolveBarrel(spec, from, repoRoot), { repoRoot });
  }
  const required = extractExports(resolveBarrel('@/patterns', from, repoRoot), { repoRoot });
  return [...checkPatterns(rows, { exportsOf, exists: (doc) => fs.existsSync(path.join(repoRoot, doc)), required }), ...unrouted];
}

/** The committed list's rows. */
export function readPatterns(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, PATTERNS_FILE), 'utf8')).patterns;
}
