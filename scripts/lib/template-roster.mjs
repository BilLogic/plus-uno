/**
 * The template roster, held by every layer that names it.
 *
 * The templates are the names the `@/templates` barrel exports that have a
 * folder under `design-system/src/templates/`. Everything else that lists them
 * is a copy: the glossary's Template entry, the Templates overview, the
 * hand-kept agent-view list, the Templates table of the components index and
 * the `Templates/*` Storybook titles. A copy that adds, drops or renames one
 * reads as a template that exists or does not, so each is held to the barrel.
 * `ListPage` has a folder and no export: a CLI registry starter, not a template.
 *
 * Each row of the agent-view list, and any hand-typed overview tile, reads as
 * its template page's `purpose`.
 *
 * A template is one page in the Storybook sidebar. A visible story titled
 * beneath it (`Templates/Page/Reference screens`) turns it into a folder, so a
 * visible nested title fails too; hidden stories carry `!dev`.
 */

import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = 'design-system/src/templates';
const BARREL = `${TEMPLATES_DIR}/index.js`;
const GLOSSARY = 'docs/conventions/design-system-glossary.md';
const OVERVIEW = 'design-system/src/storybook-docs/templates/TemplatesOverview.mdx';
const AGENT_LIST = 'design-system/agent-views/_templates.json';
const INDEX = 'design-system/agent-views/components/index.md';

const GUIDELINES = 'design-system/guidelines/overview.md';

const sorted = (names) => [...new Set(names)].sort();

/** The names the barrel exports that are folders of the templates directory, in export order. */
export function barrelTemplates(source, folders) {
  const code = source.replace(/\/\/.*$/gm, '');
  const exported = [...code.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) => m[1].split(',').map((part) => part.trim().split(/\s+as\s+/).pop()));
  return [...new Set(exported.filter((name) => folders.includes(name)))];
}

/** The templates the glossary's Template entry names, between its colon and its first full stop. */
export function glossaryTemplates(text) {
  const lines = text.split('\n');
  const entry = lines[lines.findIndex((l) => l.startsWith('**Template**:')) + 1] ?? '';
  const list = entry.slice(entry.indexOf(':') + 1).split('.')[0];
  return list.replace(/\*\*/g, '').split(/,\s*|\s+and\s+/).map((n) => n.trim()).filter(Boolean);
}

/** The templates the guidelines' first two stages name, up to what each stage goes on to settle. */
export function stageTemplates(text) {
  return text
    .split('\n')
    .filter((l) => /^\| \*\*[12]\. /.test(l))
    .flatMap((l) => [...l.split('|')[2].split(/ and (?:what|which)\b/)[0].matchAll(/`([A-Z]\w+)`/g)].map((m) => m[1]).filter((n) => n !== 'Sidebar'));
}

/** Hand-typed overview tiles: name to text. */
export function tileTexts(mdx) {
  return Object.fromEntries([...mdx.matchAll(/<ThumbTile\s+hero="[^"]*"\s+title="([^"]+)"[^>]*>([^<]*)<\/ThumbTile>/g)].map((m) => [m[1], m[2].trim()]));
}

/** `[{ file, text }]` -> every `Templates/...` title, as `{ title, file, hidden }`. */
function titlesOf(files) {
  const found = [];
  for (const { file, text } of files) {
    const stories = file.endsWith('.jsx') || file.endsWith('.js');
    const title = (stories ? text.match(/^\s*title:\s*'([^']+)'/m) : text.match(/<Meta\s+title="([^"]+)"/))?.[1];
    if (!title?.startsWith('Templates/')) continue;
    const block = stories ? text.slice(text.indexOf('export default {')).split('\n};')[0] : '';
    found.push({ title, file, hidden: block.includes("'!dev'") });
  }
  return found;
}

/** The template each title belongs to: its second segment. */
export const titleNames = (files) => sorted(titlesOf(files).map((t) => t.title.split('/')[1]));

/** Visible titles nested under a template's page. */
export const visibleChildren = (files) =>
  titlesOf(files)
    .filter((t) => t.title.split('/').length > 2 && !t.hidden)
    .map(({ title, file }) => ({ title, file }));

/**
 * Every layer held to the roster.
 * @param {{roster: string[], layers: Record<string, string[]>, children: {title: string, file: string}[], purposes?: Record<string, string>, uses?: Record<string, string>, tiles?: Record<string, string>}} model
 */
export function checkRoster({ roster, layers, children, purposes = {}, uses = {}, tiles = {} }) {
  const problems = [];
  for (const [layer, names] of Object.entries(layers)) {
    for (const name of roster) if (!names.includes(name)) problems.push(`${layer} is missing the ${name} template`);
    for (const name of sorted(names)) if (!roster.includes(name)) problems.push(`${layer} names ${name}, which the @/templates barrel does not export`);
  }
  for (const [name, use] of Object.entries(uses)) if (purposes[name] !== undefined && use !== purposes[name]) problems.push(`the agent-view list row for ${name} differs from its page purpose`);
  for (const [name, text] of Object.entries(tiles)) if (purposes[name] !== undefined && text !== purposes[name]) problems.push(`the overview tile for ${name} differs from its page purpose`);
  for (const { title, file } of children) problems.push(`${title} (${file}) shows ${title.split('/')[1]} as a folder in Storybook; tag the stories !dev`);
  return problems;
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

/** The roster and every layer, read from the repo. */
export function readRoster(root) {
  const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
  const folders = fs.readdirSync(path.join(root, TEMPLATES_DIR), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const roster = barrelTemplates(read(BARREL), folders);
  const files = folders
    .flatMap((f) => walk(path.join(root, TEMPLATES_DIR, f)))
    .filter((f) => /\.(stories\.jsx|mdx)$/.test(f))
    .map((f) => ({ file: path.relative(root, f), text: fs.readFileSync(f, 'utf8') }));
  const index = read(INDEX);
  const overview = read(OVERVIEW);
  const rows = JSON.parse(read(AGENT_LIST)).templates;
  const byLower = Object.fromEntries(roster.map((n) => [n.toLowerCase(), n]));
  const purpose = (n) => fs.readFileSync(path.join(root, TEMPLATES_DIR, n, `${n}.mdx`), 'utf8').match(/purpose="([^"]+)"/)?.[1];
  const section = index.slice(index.indexOf('## Templates'), index.indexOf('## UI components'));
  return {
    roster,
    layers: {
      glossary: glossaryTemplates(read(GLOSSARY)),
      overview: [...overview.matchAll(/templates-(\w+)--docs/g)].map((m) => byLower[m[1]] ?? m[1]),
      'agent-view list': rows.map((r) => r.name),
      'components index': [...section.matchAll(/^\|[^|]*\| \[`(\w+)`\]/gm)].map((m) => m[1]),
      'Storybook titles': titleNames(files),
      'guidelines stages': stageTemplates(read(GUIDELINES)),
    },
    purposes: Object.fromEntries(roster.map((n) => [n, purpose(n)])),
    uses: Object.fromEntries(rows.map((r) => [r.name, r.use])),
    tiles: tileTexts(overview),
    children: visibleChildren(files),
  };
}
