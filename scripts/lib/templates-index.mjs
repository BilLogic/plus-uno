/**
 * The "Templates" section of `design-system/agent-views/components/index.md`,
 * from `design-system/agent-views/_templates.json` and the DS facts.
 *
 * Agents read the component index as the existence list, so a template missing
 * from it reads as missing from the system: the ds-usage eval's agents wrote
 * "no design-system Card exists" while the `Card` template shipped, and hand-made
 * their page shells. The list keeps only what source cannot say: the group a
 * template is filed under and when to reach for it. Its import line and its
 * Storybook page come from the facts (`scripts/lib/ds-facts.mjs`), which read
 * them from the barrels and the source. `checkTemplates` holds each name to the
 * facts, each page to a file, and every template the facts hold to a row.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadFacts } from './ds-facts.mjs';

export const TEMPLATES_FILE = 'design-system/agent-views/_templates.json';

/** The fields a row may carry: everything else comes from source. */
const ROW_FIELDS = new Set(['group', 'name', 'use']);

/** A template with no page of its own: the section of its parent's page that documents it. */
const FOLDED_INTO = {};

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** A template's own page in the templates folder, where there is one (Popup's source is a component, its page is not). */
const templatePage = (name) => {
  const doc = `design-system/src/templates/${name}/${name}.mdx`;
  return fs.existsSync(path.join(REPO, doc)) ? doc : null;
};

/** A template's Storybook page: its own page, the MDX beside its source, or the page it is folded into. */
const docOf = (answer, name, pageOf = templatePage) => FOLDED_INTO[name] ?? pageOf(name) ?? answer.source?.replace(/\.jsx$/, '.mdx') ?? null;

/**
 * Every row that names nothing real, keeps a field source owns, or points at a
 * page that is not there, and every template the facts hold with no row.
 * @param {{group: string, name: string, use: string}[]} rows
 * @param {{lookup: (name: string) => {status: string, kind: string|null, source: string|null},
 *   exists: (doc: string) => boolean, required: string[]}} env
 */
export function checkTemplates(rows, { lookup, exists, required, pageOf }) {
  const problems = [];
  for (const r of rows) {
    const extra = Object.keys(r).filter((k) => !ROW_FIELDS.has(k));
    if (extra.length) problems.push(`${r.name}: ${extra.map((k) => `\`${k}\``).join(', ')} come from source; a row keeps only group, name and use`);
    const answer = lookup(r.name);
    if (answer.status !== 'exists' || !['template', 'component'].includes(answer.kind)) {
      problems.push(`${r.name} is not a template or component the design system exports`);
      continue;
    }
    const doc = docOf(answer, r.name, pageOf);
    if (!doc || !exists(doc)) problems.push(`${r.name}: ${doc ?? 'its source'} is not a file`);
  }
  const listed = new Set(rows.map((r) => r.name));
  for (const name of required) if (!listed.has(name)) problems.push(`${name} is a template and missing from the list`);
  return problems;
}

/** The section, with doc links relative to the folder the index is written in. */
export function renderTemplates(rows, { from, lookup, pageOf }) {
  const link = (doc) => path.relative(from, doc).split(path.sep).join('/');
  let out = `## Templates: start a page, section, card, table or overlay here\n\n`;
  out += `A template is a shell that owns the frame (fill, pad, radius, elevation) and leaves you slots to fill. `;
  out += `Build a page or a container from these before writing a \`div\` with its own flex or grid. `;
  out += `Each one's props are on its page (linked) and in its source.\n\n`;
  out += `| Group | Name | Import | Reach for it when |\n|---|---|---|---|\n`;
  let group = null;
  for (const r of rows) {
    const answer = lookup(r.name);
    out += `| ${r.group === group ? ' ' : r.group} | [\`${r.name}\`](${link(docOf(answer, r.name, pageOf))}) | \`${answer.import}\` | ${r.use} |\n`;
    group = r.group;
  }
  return `${out}\n`;
}

/** The committed list's rows. */
export function readTemplates(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, TEMPLATES_FILE), 'utf8')).templates;
}

/** The component index that renders the Templates table. */
export const OVERVIEW_FILE = 'design-system/agent-views/components/index.md';

/** Every template the facts hold: the `@/templates` barrel's. */
const templateNames = (facts) => facts.manifests.components.components.filter((c) => c.kind === 'template').map((c) => c.name);

/** The committed list, read against the real facts and the rendered index. */
export function checkCommitted(repoRoot) {
  const rows = readTemplates(repoRoot);
  const facts = loadFacts(repoRoot);
  const overview = fs.readFileSync(path.join(repoRoot, OVERVIEW_FILE), 'utf8');
  const unrouted = rows.filter((r) => !overview.includes(`\`${r.name}\``)).map((r) => `${r.name} is missing from ${OVERVIEW_FILE}`);
  const env = { lookup: (name) => facts.lookup(name), exists: (doc) => fs.existsSync(path.join(repoRoot, doc)), required: templateNames(facts) };
  return [...checkTemplates(rows, env), ...unrouted];
}
