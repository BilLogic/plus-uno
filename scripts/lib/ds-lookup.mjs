/**
 * The design-system lookup: five operations over the DS facts module, which
 * the `ds` command (`scripts/ds.mjs`) and the local MCP server
 * (`scripts/ds-mcp.mjs`) both adapt. Each adapter is a few lines of argument
 * parsing; every answer is made here, so the command and the MCP cannot
 * disagree.
 *
 *   createLookup(root, {readPaths})
 *     .find(query)               entry point: patterns, components, Figma names,
 *                                not-here names, tokens and icons, ranked
 *     .get(names, section?)      full records: the generated doc's text, or one section of it
 *     .tokens(role)              the steps for a role, each with its intent
 *     .guide(topic?)             a guideline, a rule's section, or the orientation
 *     .check({code, path} | {paths})   check:ds-usage, in-process
 *   render(op, result)           the same answer as text
 *   ORIENTATION, TOOL_ORDER      what the server sends at connection
 *
 * HOW FIND RANKS. In lanes, in this order: the exact name (a record, a barrel
 * export, a Figma name, a not-here name) or an exact alias; not-here components the query names
 * by a whole word; token steps, only when the query speaks token vocabulary
 * (`speaksTokens`), and then ahead of components; the Pro row and Free icons,
 * only when the query asks for an icon; components and patterns ranked by
 * field-weighted BM25 over their name, the first sentence of their summary
 * (what it is; the rest of a long JSDoc is implementation notes), the Usage
 * and Best practices sections of their Storybook page and their authored
 * aliases (`agent-views/_aliases.json`, with a bonus when the query carries an
 * alias whole) (`ds-rank.mjs`; the numbers are its `FIND_TUNING`); other barrel
 * exports on a word-start match, constants never; and last, a `guide` row
 * when a query word names a guideline topic (`topicsOf`). Each lane is one
 * function below `find`. The index is built on the first
 * find from the same files `get` reads, so there is no second copy to drift.
 *
 * WHERE THE ANSWERS COME FROM. Names, imports, props and tokens are the facts
 * module's (`ds-facts.mjs`). Usage, best practices and accessibility are the
 * component's authored Storybook page, found and read through the page model
 * (`docs-page.mjs`: the page its stories' meta names, as text with no JSX); the
 * Figma mapping is `design-system/figma/component-registry.json`; guidelines
 * are the files under `design-system/guidelines/`; rule explanations are
 * `docs/engineering/ds-usage-rules.md`. Nothing here is authored content.
 *
 * A component's or pattern's `get` text is its generated doc, byte for byte:
 * one render (`component-render.mjs`) from its manifest record and its page,
 * and a `get` section is that text's matching `##` sections. Every other
 * answer carries a `next`: the tool to call after it, or instead of it on a
 * miss.
 */

import fs from 'node:fs';
import path from 'node:path';
import { REFERENCE_SCREENS } from './story-examples.mjs';

import { componentContext, contextLines, contextList } from './component-context.mjs';

import { contextOf, escapes, expandPaths } from '../check-ds-usage.mjs';
import { BARRELS, loadFacts } from './ds-facts.mjs';
import { createPageFinder, pageText, readDocsPage, sectionText } from './docs-page.mjs';
import { FIND_TUNING, STOPWORDS, createRanker } from './ds-rank.mjs';
import { INSTALL_FOLDER } from './ds-add.mjs';
import { readIconLists } from './icon-lists.mjs';
import { tokenMatchers } from './inventions.mjs';
import { RULES, RULES_DOC, docLink, escapesIn } from './ds-usage.mjs';
import { SECTION_ALIASES, SECTION_TITLES, componentFacts, docPathOf, governedByOf, governedNamesOf, renderComponent, sectionsOf } from './component-render.mjs';
import { retiredRenames } from './tokens/plan.mjs';

export const DS_INDEX = 'design-system/agent-views/ds-index.json';
export const TOOL_ORDER = ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check'];

export const ORIENTATION = `PLUS design system: the React components, templates, patterns and tokens every PLUS prototype is built from. A name the lookup does not know does not exist here: propose it rather than write it.

Barrels (import only from these):
- ${BARRELS[1]}: the templates (Frame, which every full page starts from, Page, PatternSection, PatternCard, Table, overlays)
- ${BARRELS[0]}: the components (Button, TextField, SectionMessage...)

Build in five stages:
1. Template — which template each screen sits in and what fills its slots: ds_find (a brief or component list returns the kit), ds_guide("templates")
2. Blocks — the Sections and Cards on the grid, and which pattern governs each situation: ds_guide("patterns"), then ds_guide("<pattern>")
3. Pieces — the components in each slot and their props: ds_find → ds_get
4. Polish — spacing, type, color, radius and elevation tokens by role: ds_tokens("<role>")
5. Motion — which state changes animate and with which transition: ds_guide("motion")

Hard rules:
- Template, then blocks, then pieces; build new interactive behavior on @base-ui/react styled with tokens.
- Props and values come from ds_get, never from memory.
- Style with semantic, pattern or component tokens (ds_tokens); never a literal, never a primitive (--palette-*, --space-<n>).
- Icons are Font Awesome Free: fa-solid, fa-regular, fa-brands.
- A full page starts from a template: Frame with the PLUS Sidebar (ds_guide("templates")).
- Run ds_check once at the end.`;

const FIND_LIMIT = 10;
const PER_KIND = { token: 3, icon: 3 };
/**
 * Words that make a query a token question on their own: a property, a hue, or
 * the word token. The everyday words fill, stroke, surface, brand, space,
 * neutral and palette are left out on purpose ("fill out a form", "brand
 * logo"): beside one of these they still narrow which steps lead, but alone
 * they never open the token lane.
 */
const TOKEN_WORDS = new Set(
  'color colour token tokens background border spacing radius shadow elevation opacity font red orange yellow lime green teal blue purple magenta gray grey'.split(' '),
);
/** Token words that name no step: they ask for tokens without narrowing which. */
const TOKEN_FILLER = new Set(['color', 'colour', 'token', 'tokens', 'ds']);
const ICON_WORDS = new Set(['icon', 'icons', 'glyph']);
/** Pro family words that read as plain English too; only `duotone` stands alone without an icon word. */
const PRO_WORDS = new Set(['light', 'thin', 'sharp']);
const CONSTANT = /^[A-Z0-9_]+$/;
/**
 * Words people ask with → the guideline `ds_guide` answers. `ds_guide` reads
 * every key; the guide row in `ds_find` reads the one-word keys, and a word in
 * `GUIDE_WEAK` names its topic there only beside a second signal: a word from
 * `GUIDE_CUES` or another topic word.
 */
const TOPIC_ALIASES = {
  __proto__: null,
  a11y: 'accessibility',
  'layout formulas': 'layout',
  formulas: 'layout',
  'form-behavior': 'forms',
  page: 'layout',
  pages: 'layout',
  icons: 'iconography',
  icon: 'iconography',
  copy: 'content',
  writing: 'content',
  voice: 'content',
  type: 'typography',
  colour: 'color',
  colors: 'color',
  shadow: 'elevation',
  dataviz: 'data-visualization',
  charts: 'data-visualization',
  accessibility: 'accessibility',
  iconography: 'iconography',
  layout: 'layout',
  typography: 'typography',
  color: 'color',
  elevation: 'elevation',
  content: 'content',
  grid: 'grid',
  filter: 'filtering',
  filters: 'filtering',
  filtering: 'filtering',
  toolbar: 'section',
  'view bar': 'section',
  'view-bar': 'section',
  viewbar: 'section',
  validation: 'forms',
  forms: 'forms',
  search: 'search',
  empty: 'empty',
  'empty state': 'empty',
  'empty-state': 'empty',
  error: 'errors',
  errors: 'errors',
  'error state': 'errors',
  'error-state': 'errors',
  loading: 'loading',
  notification: 'notifications',
  notifications: 'notifications',
  toast: 'notifications',
  toasts: 'notifications',
  banner: 'notifications',
  banners: 'notifications',
  alert: 'notifications',
  alerts: 'notifications',
  action: 'common-actions',
  actions: 'common-actions',
  bulk: 'common-actions',
  'bulk actions': 'common-actions',
  'bulk-actions': 'common-actions',
  'row actions': 'common-actions',
  'row-actions': 'common-actions',
  'common-actions': 'common-actions',
  commonactions: 'common-actions',
  nav: 'navigation',
  sidebar: 'navigation',
  breadcrumb: 'navigation',
  breadcrumbs: 'navigation',
  navigation: 'navigation',
  disabled: 'disabled',
  unavailable: 'disabled',
  'tooltip on disabled': 'disabled',
  readonly: 'read-only',
  'read-only': 'read-only',
  'read only': 'read-only',
  overflow: 'overflow',
  truncation: 'overflow',
  indicator: 'indicators',
  indicators: 'indicators',
  badge: 'indicators',
  tag: 'indicators',
  status: 'indicators',
  templates: 'templates',
  template: 'templates',
  patterns: 'patterns',
  pattern: 'patterns',
  foundations: 'foundations',
  foundation: 'foundations',
  motion: 'motion',
  transitions: 'transitions',
  choreography: 'choreography',
  sound: 'sound',
  sounds: 'sound',
};
/** Topic words that are everyday English too ("copy to clipboard", "grid of cards"). */
const GUIDE_WEAK = new Set('copy content grid icon icons page pages type writing voice shadow charts formulas'.split(' '));
/** Words that ask for a guideline outright, so a weak topic word beside one counts. */
const GUIDE_CUES = new Set('guide guides guideline guidelines guidance rule rules convention conventions'.split(' '));

/** Whether a query speaks token vocabulary: a leading `--`, or a strong token word (`TOKEN_WORDS`); a weak one alone does not. */
export function speaksTokens(query) {
  const ql = String(query ?? '').trim().toLowerCase();
  return ql.startsWith('--') || (ql.match(/[a-z0-9]+/g) ?? []).some((w) => TOKEN_WORDS.has(w));
}
const SECTIONS = ['props', 'usage', 'practices', 'a11y', 'figma'];
/** A page section as `get` prints it: its heading, then its text. */
const headed = (page, title) => {
  const text = sectionText(page, title);
  return text === null ? null : `## ${title}\n\n${text}`.trim();
};
const PRO_FAMILY = /\bfa-(?:sharp-duotone|sharp|duotone|light|thin)\b/;
const GUIDELINES = 'design-system/guidelines';
const AGENT_VIEWS = 'design-system/agent-views';
const PATTERNS_SRC = 'design-system/src/patterns';
const TEMPLATE_COMPONENTS = ['Frame', 'Page', 'PatternSection', 'PatternCard', 'Table', 'Modal'];
const readIf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
const firstSentence = (text, max = 160) => {
  if (!text) return null;
  const s = text.replace(/\s+/g, ' ').trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text.trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};
/** The first sentence, cut at a word boundary so the whole stays within `max`. */
const shortSummary = (text, max = 90) => {
  const s = firstSentence(text, Infinity);
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max - 1).replace(/[\s,;:.-]+$/, '')}…`;
};
const wordsOf = (q) =>
  q
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .flatMap((w) => (w.length > 3 && w.endsWith('s') ? [w, w.slice(0, -1)] : [w]));

/** Whether `text` carries `phrase` as whole words. */
const hasPhrase = (text, phrase) => new RegExp(`(?:^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?:[^a-z0-9]|$)`).test(text);

/**
 * The lookup for one tree.
 *
 * @param {string} root  the repo root
 */
/** What `check` says when it is built not to read paths (the hosted server): it never reads the caller's files, and has none of theirs. */
export const PATHS_REFUSAL =
  'The hosted ds_check checks code only: pass code (and path, the file name it would have). It does not read paths on the server. To check files, run the local plus-ds server or npm run check:ds-usage in the checkout.';

/** Thrown by `check` for `paths` when `readPaths` is off; the message is `PATHS_REFUSAL`. */
export class PathsRefused extends Error {
  constructor() {
    super(PATHS_REFUSAL);
    this.name = 'PathsRefused';
  }
}

const importLine = (name, from) => `import { ${name} } from '${from}';`;

function parsePropRow(not) {
  const m = not.match(/^(\w+)\s+(\w+)(.*)$/);
  if (!m) return null;
  return { component: m[1], prop: m[2], values: [...m[3].matchAll(/"([^"]+)"/g)].map((v) => v[1]) };
}

/** The symbol a component `.jsx` file implements, for live JSDoc drift checks. */
function implSymbol(source, fileName) {
  if (new RegExp(`\\b${fileName}\\.propTypes\\s*=`).test(source)) return fileName;
  const aliased = source.match(new RegExp(`export\\s*\\{\\s*(\\w+)\\s+as\\s+${fileName}\\s*\\}`));
  if (aliased) return aliased[1];
  const def = source.match(/export\s+default\s+(\w+)\s*;/);
  if (def) return def[1];
  return fileName;
}

/** The JSDoc block immediately above a component's declaration in `.jsx` source. */
function jsdocFor(source, name) {
  const decl = new RegExp(`(?:export\\s+)?(?:const\\s+${name}\\s*=|function\\s+${name}\\s*\\()`, 'g');
  let declIndex = -1;
  for (const m of source.matchAll(decl)) declIndex = m.index;
  if (declIndex === -1) return '';
  const before = source.slice(0, declIndex);
  const close = before.lastIndexOf('*/');
  if (close === -1 || before.slice(close + 2).trim() !== '') return '';
  const open = before.lastIndexOf('/**', close);
  if (open === -1) return '';
  const lines = before
    .slice(open + 3, close)
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'));
  if (lines[0] && new RegExp(`^${name}\\b`, 'i').test(lines[0]) && !new RegExp(`^${name}\\s*[:—–-]\\s`, 'i').test(lines[0]) && lines.length > 1) lines.shift();
  return lines.join(' ').trim();
}

/** A folder's `.md` files other than its overview; none when the folder is empty or gone. */
const mdIn = (root, dir) =>
  fs.existsSync(path.join(root, dir))
    ? fs.readdirSync(path.join(root, dir)).sort().filter((f) => f.endsWith('.md') && f !== 'overview.md' && f !== 'index.md')
    : [];

/**
 * Topic → the file that answers it: generated template, pattern and
 * foundation agent views (`agent-views/<root>/<Name>.md` and component-backed
 * templates under `src/patterns/<Name>/index.md`), plus any surviving
 * `guidelines/` pages.
 */
function scanTopics(root) {
  const map = {};
  for (const dir of ['patterns', 'templates', 'foundations']) {
    for (const f of mdIn(root, `${AGENT_VIEWS}/${dir}`)) {
      const rel = `${AGENT_VIEWS}/${dir}/${f}`;
      const stem = f.replace(/(?:Overview)?\.md$/, '');
      const kebab = stem.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      const lower = stem.toLowerCase();
      map[kebab] = rel;
      map[lower] = rel;
      if (TOPIC_ALIASES[lower]) map[TOPIC_ALIASES[lower]] = rel;
      if (dir === 'foundations' && /^motion-/.test(kebab)) {
        const sub = kebab.slice('motion-'.length);
        if (sub === 'physics') map.motion = rel;
        else map[sub] ??= rel;
      }
    }
  }
  for (const sub of TEMPLATE_COMPONENTS) {
    const rel = `${PATTERNS_SRC}/${sub}/index.md`;
    if (!fs.existsSync(path.join(root, rel))) continue;
    const kebab = sub.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    const short = sub.replace(/^Pattern/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    if (short === 'page') {
      map['page-template'] ??= rel;
    } else {
      map[kebab] ??= rel;
      map[sub.toLowerCase()] ??= rel;
      map[short] ??= rel;
    }
  }
  if (map.templates) map.layout = map.templates;
  for (const f of mdIn(root, `${GUIDELINES}/foundations`)) {
    const key = f.replace(/\.md$/, '');
    map[key] ??= `${GUIDELINES}/foundations/${f}`;
  }
  if (fs.existsSync(path.join(root, GUIDELINES, 'foundations/content/overview.md'))) map.content = `${GUIDELINES}/foundations/content/overview.md`;
  for (const f of mdIn(root, `${GUIDELINES}/foundations/content`)) map[f.replace(/\.md$/, '')] = `${GUIDELINES}/foundations/content/${f}`;
  for (const [key, file] of [['components', 'components/overview.md'], ['figma', 'figma/overview.md']]) {
    if (fs.existsSync(path.join(root, GUIDELINES, file))) map[key] = `${GUIDELINES}/${file}`;
  }
  return map;
}

/**
 * Build the deterministic lookup index (`design-system/agent-views/ds-index.json`)
 * from the design-system facts, Storybook docs pages, Figma registry, reference
 * screens, guidelines and rule docs.
 */
export function buildDsIndex(root) {
  const facts = loadFacts(root);
  const ds = fs.existsSync(path.join(root, 'design-system')) && fs.statSync(path.join(root, 'design-system')).isDirectory() ? path.join(root, 'design-system') : root;
  const inventions = JSON.parse(readIf(path.join(ds, 'agent-views/_inventions.json')) ?? '{"components":[],"props":[],"tokens":[]}');
  const registry = JSON.parse(readIf(path.join(root, 'design-system/figma/component-registry.json')) ?? '{"components":{},"patterns":{}}');
  const records = facts.manifests.components.components;
  const context = componentContext(root, records, { source: true });
  const findPage = createPageFinder(root, registry);
  const pages = new Map();
  const pageOf = (name, source) => {
    if (!pages.has(name)) {
      const rel = findPage({ name, source });
      pages.set(name, rel ? { path: rel, page: readDocsPage(fs.readFileSync(path.join(root, rel), 'utf8'), { root, file: rel }) } : null);
    }
    return pages.get(name);
  };

  const figmaAliases = [];
  for (const [name, entry] of Object.entries(registry.components ?? {})) {
    if (facts.lookup(name).status !== 'exists') continue;
    for (const set of entry.figma?.sets ?? []) if (set.name && set.name !== name) figmaAliases.push({ alias: set.name, name });
  }
  const patternFigma = new Map();
  for (const [key, entry] of Object.entries(registry.patterns ?? {})) {
    const name = `Pattern${key.replace(/^Pattern\//, '').replace(/\s+(\w)/g, (_, c) => c.toUpperCase())}`;
    if (facts.lookup(name).status !== 'exists') continue;
    figmaAliases.push({ alias: key, name });
    patternFigma.set(name, { key, ...entry });
  }

  function figmaFor(name) {
    const entry = registry.components?.[name];
    if (entry?.figma) {
      return {
        fileKey: entry.figma.fileKey ?? null,
        sets: (entry.figma.sets ?? []).map((s) => ({ name: s.name, node: s.componentSetNodeId ?? s.nodeId ?? null, url: s.url ?? null, variantProps: s.variantProps ?? null })),
        docsPage: entry.figma.docsPageUrl ?? null,
      };
    }
    const pattern = patternFigma.get(name);
    if (pattern) {
      return {
        fileKey: null,
        sets: [{ name: pattern.key, node: pattern.componentSetNodeId ?? null, url: pattern.url ?? null, variantProps: pattern.variantProps ?? null }],
        tokens: pattern.tokenPrefix ?? null,
        docsPage: null,
      };
    }
    return null;
  }

  const entries = records.map((r) => {
    const a = facts.lookup(r.name);
    const home = a.aliasOf ? facts.lookup(a.aliasOf) : a;
    const homeName = a.aliasOf ?? a.name;
    const srcFile = home.source ?? a.source;
    const src = srcFile ? readIf(path.join(root, srcFile)) : null;
    const liveSummary = src && a.kind !== 'pattern' ? (jsdocFor(src, implSymbol(src, homeName)) || null) : a.summary;
    const rankPage = pageOf(r.name, a.source)?.page;
    const docs = pageOf(homeName, srcFile);
    const edges = context.edges[homeName];
    const manifestForRender =
      liveSummary !== a.summary
        ? {
            ...facts.manifests.components,
            components: facts.manifests.components.components.map((c) => (c.name === homeName ? { ...c, summary: liveSummary } : c)),
          }
        : facts.manifests.components;
    const componentFactsOf = componentFacts(manifestForRender, homeName, { [homeName]: facts.lookup(homeName).aliases });
    const text = componentFactsOf?.source ? renderComponent(componentFactsOf, docs, edges) : null;
    const doc = text ? docPathOf(componentFactsOf) : null;
    const section = (h) => (rankPage && sectionText(rankPage, h)) ?? '';
    return {
      name: r.name,
      kind: a.kind,
      group: a.group,
      import: a.import,
      source: srcFile,
      aliasOf: a.aliasOf,
      summary: liveSummary,
      aliases: [...a.aliases],
      props: a.props ?? null,
      replacement: [...a.replacement],
      why: a.why ?? null,
      docs: docs?.path ?? null,
      doc,
      text,
      figma: figmaFor(homeName),
      rankedText: {
        usage: section('Usage'),
        best: section('Best practices'),
        related: section('Related'),
      },
    };
  });

  const backEdges = Object.fromEntries(
    Object.keys(context.edges)
      .sort()
      .map((name) => [
        name,
        {
          usedIn: context.edges[name].usedIn.map((p) => p.name),
          governedBy: context.edges[name].governedBy.map((p) => p.name),
        },
      ]),
  );

  const rawTopics = scanTopics(root);
  const topics = Object.fromEntries(Object.entries(rawTopics).sort(([a], [b]) => a.localeCompare(b)));
  const guidePaths = [...new Set(Object.values(topics))].sort();
  const guides = Object.fromEntries(
    guidePaths.map((rel) => {
      const source = fs.readFileSync(path.join(root, rel), 'utf8');
      const text = rel.endsWith('.mdx')
        ? pageText(readDocsPage(source, { kind: 'foundation', root, file: rel }))
        : source
            .replace(/^<!--\s*DO NOT EDIT[\s\S]*?-->\n+/, '')
            .replace(/\n*<!--\s*authored coverage:[\s\S]*?-->\s*$/, '')
            .trim();
      return [rel, text];
    }),
  );

  const rulesSource = readIf(path.join(root, RULES_DOC));
  const rulesPage = rulesSource ? readDocsPage(rulesSource) : null;
  const rules = Object.fromEntries(
    Object.keys(RULES)
      .sort()
      .map((rule) => [rule, rulesPage ? headed(rulesPage, rule) : null]),
  );

  return {
    entries,
    figmaAliases,
    contextPages: context.pages,
    backEdges,
    referenceScreens: JSON.parse(readIf(path.join(root, REFERENCE_SCREENS)) ?? '[]'),
    barrels: Object.fromEntries(BARRELS.map((spec) => [spec, [...facts.barrels[spec]].sort()])),
    inventions,
    tokens: facts.manifests.tokens.tokens,
    vocabulary: facts.vocabulary,
    topics,
    guides,
    rules,
  };
}

function loadDsIndex(root, { buildIndex = false } = {}) {
  if (buildIndex) return buildDsIndex(root);
  for (const rel of [DS_INDEX, 'agent-views/ds-index.json']) {
    const file = path.join(root, rel);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  throw new Error('design-system/agent-views/ds-index.json is missing. Run `node scripts/generate-ds-index.mjs`.');
}

/**
 * `readPaths: false` is the hosted server's; `aliases: false` zeroes the alias field (the retrieval bench's second arm);
 * `consumerRoot` is where `check` reads `paths` from when that is not the facts' tree (the packaged `ds check` reads the caller's project);
 * `iconMetadata` stands in for the committed Free icon lists (the `icons.json` shape), for a test that needs a small set;
 * `buildIndex: true` opts fixture-root tests into building the index in memory instead of reading `ds-index.json`.
 */
export function createLookup(root, { readPaths = true, aliases = true, iconMetadata = null, consumerRoot = root, buildIndex = false } = {}) {
  const index = loadDsIndex(root, { buildIndex });
  const records = index.entries;
  const entriesByName = new Map(records.map((r) => [r.name, r]));
  const barrels = Object.fromEntries(BARRELS.map((spec) => [spec, new Set(index.barrels[spec] ?? [])]));
  const retired = retiredRenames();
  const inventions = index.inventions ?? { components: [], props: [], tokens: [] };
  const inventedComponents = new Map((inventions.components ?? []).map((r) => [r.not, r]));
  const inventedProps = (inventions.props ?? []).map((r) => ({ row: r, ...parsePropRow(r.not) })).filter((r) => r.component);
  const inventedTokens = (inventions.tokens ?? []).map((r) => ({ row: r, matchers: tokenMatchers(r.not) }));
  const tokenRecords = new Map((index.tokens ?? []).map((t) => [t.name, t]));
  const figmaAliases = index.figmaAliases ?? [];
  const contextPages = index.contextPages ?? [];
  const templatePageByName = new Map(contextPages.filter((p) => p.kind === 'template').map((p) => [p.name, p]));
  const patternPageByName = new Map(contextPages.filter((p) => p.kind === 'pattern').map((p) => [p.name, p]));
  const contextEdges = Object.fromEntries(
    Object.entries(index.backEdges ?? {}).map(([name, edge]) => [
      name,
      {
        usedIn: (edge.usedIn ?? []).map((n) => templatePageByName.get(n) ?? { name: n, kind: 'template' }),
        governedBy: (edge.governedBy ?? []).map((n) => patternPageByName.get(n) ?? { name: n, kind: 'pattern' }),
      },
    ]),
  );
  const contexts = () => ({ pages: contextPages, edges: contextEdges });

  const answer = (name, status, fields = {}) => ({
    name,
    status,
    kind: null,
    import: null,
    group: null,
    source: null,
    summary: null,
    props: null,
    aliasOf: null,
    replacement: [],
    why: null,
    aliases: [],
    ...fields,
  });
  const note = (row) => (row ? { replacement: [...row.use], why: row.why ?? null } : {});

  function lookupName(name) {
    const entry = entriesByName.get(name);
    if (entry) {
      return answer(name, 'exists', {
        kind: entry.kind,
        import: entry.import,
        group: entry.group,
        source: entry.source,
        summary: entry.summary,
        props: entry.props,
        aliasOf: entry.aliasOf,
        replacement: [...(entry.replacement ?? [])],
        why: entry.why ?? null,
        aliases: [...(entry.aliases ?? [])],
      });
    }
    const invented = inventedComponents.get(name);
    const from = BARRELS.find((spec) => barrels[spec].has(name));
    if (from) return answer(name, 'exists', { kind: 'export', import: importLine(name, from), ...note(invented) });
    if (invented) return answer(name, 'not-here', note(invented));
    return answer(name, 'unknown');
  }

  function lookupProp(name) {
    const [target, value = null] = name.split('=');
    const [component, propName] = target.split('.');
    const owner = lookupName(component);
    const prop = owner.status === 'exists' ? (owner.props ?? []).find((p) => p.name === propName) : undefined;
    const invented = inventedProps.find(
      (r) => r.component === component && r.prop === propName && (value === null ? r.values.length === 0 : r.values.includes(value)),
    );
    const base = {
      kind: 'prop',
      component,
      type: prop?.type ?? null,
      values: prop?.values ?? null,
      default: prop?.default ?? null,
      required: prop?.required ?? null,
      description: prop?.description ?? null,
      deprecated: prop?.deprecated ?? null,
      replacement: [],
      why: null,
    };
    const accepted = prop && (value === null || prop.values === null || prop.values.includes(value));
    if (accepted) {
      const replacement = prop.deprecated?.replacement;
      return { name, status: 'exists', ...base, replacement: replacement ? [replacement.includes('.') ? replacement : `${component}.${replacement}`] : [] };
    }
    if (invented) return { name, status: 'not-here', ...base, replacement: [...invented.row.use], why: invented.row.why ?? null };
    return { name, status: 'unknown', ...base };
  }

  function lookupTokens(query) {
    const token = (t, extra = {}) => ({ name: t.name, status: 'exists', tier: t.tier, group: t.group, value: t.value, intent: t.intent ?? null, replacement: [], why: null, ...extra });
    if (query.startsWith('--')) {
      const invented = inventedTokens.find((r) => r.matchers.some((re) => re.test(query)))?.row;
      const record = tokenRecords.get(query);
      if (record) return [token(record, note(invented))];
      const empty = { name: query, tier: null, group: null, value: null, intent: null };
      if (retired.has(query)) return [{ ...empty, status: 'retired', replacement: [retired.get(query)], why: null }];
      if (invented) return [{ ...empty, status: 'not-here', ...note(invented) }];
      return [];
    }
    const role = query.toLowerCase();
    return [...tokenRecords.values()]
      .filter((t) => t.name === `--${role}` || t.name.startsWith(`--${role}-`) || t.group.toLowerCase() === role)
      .map((t) => token(t));
  }

  const notHereRows = [];
  for (const [section, kind] of [['components', 'component'], ['props', 'prop'], ['tokens', 'token']]) {
    for (const r of inventions[section] ?? []) notHereRows.push({ not: r.not, kind, use: [...r.use], why: r.why ?? null });
  }
  for (const [not, use] of retired) notHereRows.push({ not, kind: 'token', use: [use], why: null });

  const facts = {
    barrels,
    retired,
    vocabulary: index.vocabulary,
    lookup: (name) => (name.includes('.') ? lookupProp(name) : lookupName(name)),
    tokens: lookupTokens,
    notHere: () => notHereRows,
  };

  const usableTokens = (index.tokens ?? []).filter((t) => t.tier !== 'primitive' && !/^Legacy\b/.test(t.group));
  const roles = [...new Set(usableTokens.map((t) => t.name.slice(2).split('-')[0]))].sort();

  let icons;
  const iconSets = () => {
    if (icons) return icons;
    const of = (style) => new Set(Object.entries(iconMetadata).filter(([, i]) => i.free?.includes(style)).map(([n]) => n));
    icons = iconMetadata
      ? { regular: of('regular'), solid: of('solid'), brands: of('brands') }
      : readIconLists(root);
    icons.complete = icons.solid.size > 0;
    return icons;
  };

  const brief = (name) => {
    const a = facts.lookup(name);
    return { name, status: a.status, kind: a.kind, import: a.import };
  };

  /** A name as written or in any case; a Figma name resolves to its code name. */
  function resolveName(name) {
    const exact = facts.lookup(name);
    if (exact.status !== 'unknown' || name.includes('.')) return exact;
    const lower = name.toLowerCase();
    const same = records.find((r) => r.name.toLowerCase() === lower) ?? figmaAliases.find((a) => a.alias.toLowerCase() === lower);
    if (same) return facts.lookup(same.name);
    const notHere = facts.notHere().find((r) => r.kind === 'component' && r.not.toLowerCase() === lower);
    return notHere ? facts.lookup(notHere.not) : exact;
  }

  // ── find ────────────────────────────────────────────────────────────────

  /** The ranker over every component and pattern, built on the first find. */
  let ranker;
  const rank = () => {
    if (ranker) return ranker;
    const docs = records.map((r) => ({
      id: r.name,
      fields: {
        name: r.name,
        aliases: aliases ? r.aliases : [],
        summary: firstSentence(r.summary, Infinity) ?? '',
        usage: r.rankedText?.usage ?? '',
        best: r.rankedText?.best ?? '',
        related: r.rankedText?.related ?? '',
      },
    }));
    ranker = createRanker(docs, aliases ? {} : { aliases: 0 });
    return ranker;
  };

  /** A Free icon's rows for the words of a query that asked for an icon. */
  function iconRows(bare) {
    if (!bare) return [];
    const rows = [];
    for (const [family, set] of Object.entries(iconSets()).filter(([k]) => k !== 'complete')) {
      for (const name of set) {
        const score = name === bare ? 3 : bare.length > 2 && name.includes(bare) ? 1 : 0;
        if (score) rows.push({ kind: 'icon', name: `fa-${family} fa-${name}`, status: 'exists', score });
      }
    }
    return rows.sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : 1));
  }

  /** A component or pattern as a find row. */
  const item = (name, extra = {}) => {
    const a = facts.lookup(name);
    // A component is a registry item; `ds add <registryItem>` installs it (an alias installs its target).
    return { kind: a.kind, name, status: 'exists', import: a.import, summary: shortSummary(a.summary), aliasOf: a.aliasOf, ...(a.kind === 'component' ? { registryItem: a.aliasOf ?? name } : {}), ...extra };
  };
  /** A not-here row: the name, why, and what to use instead. */
  const notHereRow = (row) => {
    const bare = row.not.replace(/\s*\(.*$/, '');
    return { kind: 'not-here', name: bare, status: row.kind === 'token' && facts.retired.has(bare) ? 'retired' : 'not-here', use: row.use.map(brief), why: row.why };
  };

  /** The words of one query, in the shapes the lanes read. */
  function parseQuery(q) {
    const ql = q.toLowerCase();
    const recorded = new Set(records.map((r) => r.name));
    return {
      q,
      ql,
      words: wordsOf(q),
      raw: ql.match(/[a-z0-9-]+/g) ?? [],
      joined: ql.replace(/[\s-]+/g, ''),
      singleWord: !/\s/.test(ql),
      notHere: facts.notHere().map((row) => ({ row, bl: row.not.replace(/\s*\(.*$/, '').toLowerCase() })),
      barrelOnly: [...facts.barrels[BARRELS[0]]].filter((n) => !recorded.has(n) && /^[A-Z]/.test(n)),
    };
  }

  /** Lane 1: the exact name (a record, a barrel export, a Figma name, a not-here name) or an exact alias. Constants answer only here. */
  function exactLane({ ql, joined, notHere, barrelOnly }) {
    const rows = [];
    for (const r of records) if (r.name.toLowerCase() === ql || r.name.toLowerCase() === joined) rows.push(item(r.name));
    for (const n of barrelOnly) if (n.toLowerCase() === ql || (!CONSTANT.test(n) && n.toLowerCase() === joined)) rows.push({ kind: 'export', name: n, status: 'exists', import: facts.lookup(n).import });
    for (const { alias, name } of figmaAliases) if (alias.toLowerCase() === ql) rows.push(item(name, { figma: alias }));
    for (const { row, bl } of notHere) if (bl === ql) rows.push(notHereRow(row));
    if (aliases) for (const r of records) if (facts.lookup(r.name).aliases.includes(ql)) rows.push(item(r.name));
    return rows;
  }

  /** Lane 2: a not-here component named by a whole word of the query (or, for a one-word query, containing it). */
  function notHereLane({ ql, words, singleWord, notHere }) {
    const rows = [];
    for (const { row, bl } of notHere) if (row.kind === 'component' && words.includes(bl)) rows.push(notHereRow(row));
    if (singleWord && ql.length > 2) for (const { row, bl } of notHere) if (row.kind === 'component' && bl.includes(ql)) rows.push(notHereRow(row));
    return rows;
  }

  /** Components and patterns by BM25, with the alias-phrase bonus and the pattern lift, cut to the band. Returns the band and its best score. */
  function rankedBand({ q, ql }) {
    const { band, patternLift, aliasPhrase } = FIND_TUNING;
    const ranked = rank()
      .score(q)
      .map((r) => {
        const a = facts.lookup(r.id);
        const phrases = aliases ? a.aliases.filter((al) => al.length > 3 && hasPhrase(ql, al)) : [];
        const bonus = phrases.reduce((sum, al) => sum + aliasPhrase + al.split(' ').length, 0);
        return { ...r, score: r.score + bonus + (a.kind === 'pattern' ? patternLift : 0) };
      })
      .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    const top = ranked[0]?.score ?? 0;
    return { top, band: ranked.filter((x) => x.score >= Math.max(band.share * top, band.min)).slice(0, band.max) };
  }

  /** Lane 3: token steps, only when the query speaks token vocabulary; one fewer when a component scores above the yield. */
  function tokenLane({ q, ql, notHere }, top) {
    if (!speaksTokens(q)) return [];
    const t = FIND_TUNING.token;
    const want = ql.split(/[^a-z0-9]+/).filter((w) => w && !TOKEN_FILLER.has(w) && !STOPWORDS.has(w));
    const bareQuery = ql.replace(/^--/, '');
    const steps = [];
    for (const tok of usableTokens) {
      const n = tok.name.slice(2);
      const segs = n.split('-');
      const intent = (tok.intent ?? '').toLowerCase();
      let score = 0;
      for (const w of want) score += segs.includes(w) ? t.segment : intent.includes(w) ? t.intent : 0;
      if (n === bareQuery) score += t.exact;
      else if (ql.startsWith('--') && n.startsWith(bareQuery)) score += t.prefix;
      if (/-(hovered|pressed)$/.test(n)) score -= t.state;
      if (score > 0) steps.push({ kind: 'token', name: tok.name, status: 'exists', tier: tok.tier, intent: tok.intent ?? null, score });
    }
    // For tied hue matches, shared roles lead component colors; a prefix rename preserves discovery.
    const componentColor = (name) => /^--(chart|skeleton)-/.test(name);
    steps.sort((a, b) => b.score - a.score || Number(componentColor(a.name)) - Number(componentColor(b.name)) || (a.name < b.name ? -1 : 1));
    if (ql.length > 2) for (const { row, bl } of notHere) if (row.kind === 'token' && bl.includes(bareQuery)) steps.push(notHereRow(row));
    return steps.slice(0, top > t.yield ? PER_KIND.token - 1 : PER_KIND.token);
  }

  /** Lane 4: icons, only when the query asks for one: the Pro row first, then the Free match on the other words. */
  function iconLane({ q, ql, raw, singleWord }) {
    const rows = [];
    const iconWord = raw.some((w) => ICON_WORDS.has(w));
    const faPro = ql.match(PRO_FAMILY)?.[0];
    const barePro = raw.find((w) => w === 'duotone' || (iconWord && PRO_WORDS.has(w)));
    if (faPro || barePro) {
      const family = faPro ?? `fa-${barePro}`;
      rows.push({ kind: 'icon', name: faPro ? q : family, status: 'pro', why: `${family} is a Font Awesome Pro family, not licensed here`, use: [{ name: 'fa-solid, fa-regular or fa-brands', status: 'exists' }] });
    }
    if (!(iconWord || faPro || barePro || ql.startsWith('fa-') || (singleWord && !ql.startsWith('--') && ql.includes('-')))) return rows;
    const bare = raw
      .filter((w) => !STOPWORDS.has(w) && !ICON_WORDS.has(w) && !PRO_WORDS.has(w) && w !== 'duotone' && !/^fa-(?:solid|regular|brands|sharp-duotone|sharp|duotone|light|thin)$/.test(w))
      .map((w) => w.replace(/^fa-/, ''))
      .join('-');
    const sets = iconSets();
    if (!faPro && /^fa-[a-z0-9-]+$/.test(ql.replace(/\bfa-(?:solid|regular|brands)\b/g, '').trim()) && sets.complete && ![sets.solid, sets.regular, sets.brands].some((s) => s.has(bare))) {
      rows.push({ kind: 'icon', name: `fa-${bare}`, status: 'pro', why: 'not in Font Awesome Free; Pro-only names render blank here' });
    }
    return [...rows, ...iconRows(bare).slice(0, PER_KIND.icon)];
  }

  /** Lane 5: the ranked band, then a Figma name the query is part of. */
  function meaningLane({ ql, words }, band) {
    const rows = band.map((r) => item(r.id));
    for (const { alias, name } of figmaAliases) {
      const al = alias.toLowerCase();
      if ((ql.length > 2 && al.includes(ql)) || (words.length && words.every((w) => al.includes(w)))) rows.push(item(name, { figma: alias }));
    }
    return rows;
  }

  /** Lane 6: other barrel exports on a word-start match of a camel part; constants never here. */
  function exportLane({ ql, words, joined, barrelOnly }) {
    const rows = [];
    for (const n of barrelOnly) {
      if (CONSTANT.test(n)) continue;
      const parts = n.split(/(?=[A-Z][a-z])/).map((_, i, all) => all.slice(i).join('').toLowerCase());
      const score = (ql.length > 2 && parts.some((p) => p.startsWith(joined)) ? 2 : 0) + words.filter((w) => w.length > 2 && parts.some((p) => p.startsWith(w))).length;
      if (score) rows.push({ kind: 'export', name: n, status: 'exists', import: facts.lookup(n).import, score });
    }
    return rows.sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : 1));
  }

  /** The guideline topics a query names: a strong topic word, or a weak one that is the whole query or sits beside a cue or another topic word. */
  function topicsOf({ raw }) {
    const named = [...new Set(raw.filter((w) => TOPIC_ALIASES[w]))];
    const seconded = raw.length === 1 || named.length > 1 || raw.some((w) => GUIDE_CUES.has(w));
    return [...new Set(named.filter((w) => seconded || !GUIDE_WEAK.has(w)).map((w) => TOPIC_ALIASES[w]))];
  }

  const pageRankers = new Map();
  const pageRankerOf = (kind) => {
    if (!pageRankers.has(kind)) {
      pageRankers.set(
        kind,
        createRanker(
          contextPages
            .filter((p) => p.kind === kind && p.name !== 'Overview')
            .map((p) => ({ id: p.name, fields: { name: p.name, summary: p.intro, usage: p.text } })),
          { name: 5, summary: 8, usage: 0.2 },
        ),
      );
    }
    return pageRankers.get(kind);
  };

  function find(query) {
    const q = String(query ?? '').trim();
    if (!q) return { query: q, results: [], next: 'Call ds_find with a task in words, a name or an alias; ds_guide() for the orientation.' };
    const c = parseQuery(q);

    const out = [];
    const seen = new Set();
    const push = ({ score, ...row }) => {
      const key = `${row.kind === 'not-here' ? 'not' : row.kind === 'token' || row.kind === 'icon' || row.kind === 'guide' ? row.kind : 'name'}:${row.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(row);
    };

    const referenceRows = [];
    const exact = exactLane(c);
    const named = records.filter((r) => hasPhrase(c.ql, r.name.toLowerCase()));
    const kitQuery = named.length >= 3 || (c.raw.length >= 6 && /\b(build|create|design|screen|dashboard|page|with)\b/.test(c.ql));
    const situation = /\b(narrow|nothing|confirm|delet\w*|filter\w*|search|empty|loading|error\w*|disabled|overflow|navigation|notification\w*)\b/.test(c.ql) && !exact.length && !speaksTokens(q) && !c.raw.some((w) => ICON_WORDS.has(w)) && c.raw.length >= 2;
    const pages = contexts().pages;
    const pageRank = (kind) => pageRankerOf(kind).score(q.replace(/\byet\b/gi, '')).filter((r) => r.score > 0).map((r) => pages.find((p) => p.name === r.id && p.kind === kind));
    const pageRow = (p) => ({ kind: p.kind, name: p.name, doc: p.doc, use: p.components.map(brief), next: `ds_guide("${p.name.toLowerCase().replace(/ /g, '-')}")` });
    const patternPages = situation || kitQuery ? pageRank('pattern') : [];
    const explicitPattern = topicsOf(c).map((topic) => pages.find((p) => p.kind === 'pattern' && p.name.toLowerCase().replace(/ /g, '-') === topic)).find(Boolean);
    if (explicitPattern && patternPages.includes(explicitPattern)) {
      patternPages.splice(patternPages.indexOf(explicitPattern), 1);
      patternPages.unshift(explicitPattern);
    }
    const exactPattern = pages.find((p) => p.kind === 'pattern' && p.name.toLowerCase().replace(/ /g, '-') === c.ql.replace(/ /g, '-'));
    if (exactPattern && !exact.length) push(pageRow(exactPattern));
    const exactTemplate = pages.find((p) => p.kind === 'template' && p.name.toLowerCase() === c.ql);
    if (exactTemplate && !exact.some((r) => r.kind === 'not-here')) push({ ...(exactTemplate.component ? item(exactTemplate.component) : {}), ...pageRow(exactTemplate) });
    if (situation && patternPages.length) {
      push(pageRow(patternPages[0]));
    }
    if (!exact.length && /\b(list|queue|review|detail)\b/.test(c.ql) && !speaksTokens(q) && !c.raw.some((w) => ICON_WORDS.has(w))) {
      const kind = /\bdetail\b/.test(c.ql) ? 'detail' : 'list';
      const reference = (index.referenceScreens ?? []).find((r) => r.reference === kind);
      if (reference) referenceRows.push({ kind: 'reference', name: reference.name, file: reference.file, export: reference.export, url: reference.url });
    }
    for (const row of exact) push(row);
    for (const row of notHereLane(c)) push(row);
    // The band is scored before the token lane: its best score decides how many token steps lead.
    const { top, band } = rankedBand(c);
    for (const row of tokenLane(c, top)) push(row);
    for (const row of iconLane(c)) push(row);
    for (const row of meaningLane(c, band)) push(row);
    if (c.raw.length >= 2 && !exact.length && !speaksTokens(q) && !c.raw.some((w) => ICON_WORDS.has(w))) {
      const template = pageRank('template')[0];
      if (template) push(pageRow(template));
    }
    for (const row of exportLane(c)) push(row);

    // Lane 7: a pointer to the guideline a query word names, always kept as the last row.
    const topics = topicsOf(c);
    const guideRow = topics.length ? [{ kind: 'guide', name: topics[0], next: `ds_guide("${topics[0]}")` }] : [];
    const results = [...out.slice(0, FIND_LIMIT - guideRow.length - referenceRows.length), ...referenceRows, ...guideRow];

    let kit;
    if (kitQuery) {
      const template = /\b(frame|screen|page|dashboard)\b/.test(c.ql) ? pages.find((p) => p.component === 'Frame') : pageRank('template')[0] ?? pages.find((p) => p.component === 'Frame');
      const components = [...new Set([...named.map((r) => r.name), ...out.filter((r) => ['component', 'pattern', 'template'].includes(r.kind) && r.import).map((r) => r.name), ...(patternPages[0]?.components ?? [])])].slice(0, 16);
      const governing = components.flatMap((name) => contexts().edges[name]?.governedBy ?? []);
      const frequency = (page) => governing.filter((p) => p.name === page.name).length;
      const patterns = [...new Map([...patternPages.slice(0, 3), ...governing.sort((a, b) => frequency(b) - frequency(a))].map((p) => [p.name, pageRow(p)])).values()].slice(0, 6);
      kit = {
        template: pageRow(template), patterns,
        components: components.map(brief),
        tokenRoles: ['stack', 'inline', 'pad', 'ds-text', 'ds-background', 'radius'].map((role) => ({ role, steps: tokens(role).steps.slice(0, 3) })),
      };
    }
    const next = kit ? `These fill ${kit.template.name}. Start from that template: ${kit.template.next}; ds_get for the components.` : out.length
      ? 'Next: ds_get with the names you will use (section "props" first); ds_tokens for a styling role.'
      : `Nothing matches "${q}". Try one plain word (card, table, date); ds_tokens for a token role; ${topics.length ? `ds_guide(${topics.map((t) => `"${t}"`).join(', ')})` : 'ds_guide for a guideline topic'}.`;
    const backEdges = Object.fromEntries(results.filter((r) => contexts().edges[r.aliasOf ?? r.name]).map((r) => {
      const name = r.aliasOf ?? r.name;
      const edges = contexts().edges[name];
      return [r.name, { usedIn: contextList(edges.usedIn.map((p) => p.name), 48), governedBy: contextList(governedNamesOf(name, edges), 48) }];
    }));
    return { query: q, results, backEdges, ...(kit ? { kit } : {}), next };
  }

  // ── get ─────────────────────────────────────────────────────────────────

  function getOne(name, section) {
    if (name.startsWith('--')) {
      const [token] = facts.tokens(name);
      if (!token) return { name, status: 'unknown', next: `No token ${name}. Call ds_tokens with its role (the word after --).` };
      return { ...token, use: token.replacement.map((r) => ({ name: r })), next: token.status === 'exists' ? null : 'Use the replacement; ds_tokens lists its role.' };
    }
    const a = resolveName(name);
    if (a.status === 'unknown') return { name, status: 'unknown', next: `"${name}" is not a PLUS name. Call ds_find("${name}") for what exists.` };
    if (a.status !== 'exists') {
      return { name: a.name, status: a.status, why: a.why, use: a.replacement.map(brief), next: 'Use the replacement: ds_get it for its props.' };
    }
    if (a.kind === 'prop') return { ...a, next: null };
    const homeName = a.aliasOf ?? a.name;
    const homeEntry = entriesByName.get(homeName);
    const record = {
      name: a.name,
      status: a.status,
      kind: a.kind,
      import: a.import,
      aliasOf: a.aliasOf,
      summary: firstSentence(a.summary, 300),
      aliases: a.aliases,
      source: homeEntry?.source ?? a.source,
      docs: homeEntry?.docs ?? null,
      why: a.why,
      use: a.replacement.map(brief),
    };
    const edges = contexts().edges[homeName];
    const { usedIn } = contextLines(edges);
    const governedBy = governedByOf(homeName, edges);
    if (usedIn) record.usedIn = usedIn;
    if (governedBy) record.governedBy = governedBy;
    const text = homeEntry?.text ?? null;
    if (text && homeEntry?.doc) record.doc = homeEntry.doc;
    const wanted = section ? [section] : SECTIONS;
    for (const s of wanted) {
      if (s === 'props') record.props = (a.props ?? []).map((p) => ({ name: p.name, type: p.type, values: p.values, default: p.default, required: p.required, description: p.description, deprecated: p.deprecated }));
      else if (s === 'figma') record.figma = homeEntry?.figma ?? null;
      else record[s] = text ? sectionsOf(text, SECTION_TITLES[s]) : null;
    }
    if (text) {
      record.text = section
        ? [`# ${a.name}`, a.import, ...(section !== 'a11y' && usedIn ? [`**Used in:** ${usedIn}`] : []), ...(section !== 'a11y' && governedBy ? [`**Governed by:** ${governedBy}`] : []), sectionsOf(text, SECTION_TITLES[section]) ?? `## ${section}\n\nNone in the generated doc.`].join('\n\n') + '\n'
        : text;
    } else record.next = 'Next: ds_tokens for the roles you style; ds_check once the code is written.';
    return record;
  }

  function get(names, asked) {
    const section = SECTION_ALIASES[asked] ?? asked;
    const list = (Array.isArray(names) ? names : [names]).flatMap((n) => String(n).split(',')).map((n) => n.trim()).filter(Boolean);
    if (section && !SECTIONS.includes(section)) {
      return { section, records: [], next: `No section "${section}". Sections: ${SECTIONS.join(', ')}; or leave it out for all of them.` };
    }
    if (!list.length) return { section: section ?? null, records: [], next: 'Name what to get; ds_find finds the names.' };
    return { section: section ?? null, records: list.map((n) => getOne(n, section)) };
  }

  // ── tokens ──────────────────────────────────────────────────────────────

  function tokens(role) {
    const r = String(role ?? '').trim().replace(/^var\((.*)\)$/, '$1');
    if (!r) return { role: r, steps: [], roles, next: 'Name a role: one of the roles listed.' };
    const found = facts.tokens(r);
    const steps = r.startsWith('--') ? found : found.filter((t) => t.tier !== 'primitive' && !/^Legacy\b/.test(t.group ?? ''));
    const hidden = found.length - steps.length;
    if (!steps.length) {
      const near = roles.filter((x) => x.includes(r.toLowerCase()) || r.toLowerCase().includes(x));
      return { role: r, steps: [], roles: near.length ? near : roles, next: hidden ? `"${r}" names primitives only, which consumer code never reads; pick a role listed.` : `No role "${r}". Pick a role listed, or ds_find("${r}") to search by meaning.` };
    }
    return { role: r, steps, hiddenPrimitives: hidden, next: 'Read the step whose intent fits: var(--name). ds_check confirms it.' };
  }

  // ── guide ───────────────────────────────────────────────────────────────

  const topics = () => index.topics;
  const topicText = (rel) => index.guides[rel];
  const CHOOSER_HEADING = /^(?:Usage|Alternatives|Types|Header types|Slots|The nine templates|Which .*|Frame, Modal, Panel or Popup\?)$/;
  const isBriefGuide = (rel) =>
    rel.startsWith(`${AGENT_VIEWS}/patterns/`) ||
    rel.startsWith(`${AGENT_VIEWS}/templates/`) ||
    rel.startsWith(`${PATTERNS_SRC}/`);
  const summarizeGuide = (rel, fullText) => {
    const parts = fullText.split(/\n(?=## )/);
    const header = parts[0].trim();
    const blocks = parts.slice(1);
    const sections = blocks.map((b) => b.match(/^## ([^\n]+)/)?.[1]?.trim()).filter(Boolean);
    const includeFirst = rel.startsWith(`${AGENT_VIEWS}/`);
    const chosen = blocks.filter((b, idx) => {
      const title = b.match(/^## ([^\n]+)/)?.[1]?.trim() ?? '';
      return (includeFirst && idx === 0) || CHOOSER_HEADING.test(title);
    });
    const text = [header, ...chosen.map((b) => b.trim()), `## Sections\n\n${sections.map((s) => `- ${s}`).join('\n')}`].join('\n\n');
    return { text, sections };
  };

  function guide(arg, opts = {}) {
    let rawArg = String(arg ?? '').trim();
    const optObj = typeof opts === 'string' ? (opts.toLowerCase() === 'full' ? { full: true } : { section: opts }) : (opts ?? {});
    let wantFull = Boolean(optObj.full);
    let wantSection = optObj.section ? String(optObj.section).trim() : null;
    if (/(?:^|\s)--full$/i.test(rawArg) || /\s+full$/i.test(rawArg)) {
      wantFull = true;
      rawArg = rawArg.replace(/(?:^|\s)--full$/i, '').replace(/\s+full$/i, '').trim();
    }
    const secFlag = rawArg.match(/\s+--section(?:=|\s+)(.+)$/i);
    if (secFlag) {
      wantSection = secFlag[1].trim().replace(/^["']|["']$/g, '');
      rawArg = rawArg.slice(0, secFlag.index).trim();
    }
    if (wantSection && wantSection.toLowerCase() === 'full') {
      wantFull = true;
      wantSection = null;
    }
    const t = rawArg.toLowerCase();
    if (!t) return { topic: null, path: null, text: ORIENTATION, next: 'Start with ds_find.' };
    const rule = Object.keys(RULES).find((id) => id === t || id === `ds/${t}`);
    if (rule) {
      return { topic: rule, path: docLink(rule), text: index.rules[rule], next: 'Fix the code as the section says, then ds_check again.' };
    }
    const map = topics();
    const key = map[t] ? t : TOPIC_ALIASES[t] ?? Object.keys(map).find((k) => t.split(/[\s/-]+/).includes(k)) ?? Object.entries(TOPIC_ALIASES).find(([a]) => t.includes(a))?.[1];
    if (key && map[key]) {
      const rel = map[key];
      const fullText = topicText(rel);
      const allParts = fullText.split(/\n(?=## )/);
      const sections = allParts.slice(1).map((b) => b.match(/^## ([^\n]+)/)?.[1]?.trim()).filter(Boolean);
      if (wantSection) {
        const match = allParts.slice(1).find((b) => b.match(/^## ([^\n]+)/)?.[1]?.trim().toLowerCase() === wantSection.toLowerCase());
        const text = match ? `${allParts[0].trim()}\n\n${match.trim()}` : fullText;
        return { topic: key, path: rel, brief: false, sections, text, next: 'Next: ds_find for the parts the guideline names.' };
      }
      if (!wantFull && isBriefGuide(rel)) {
        const { text } = summarizeGuide(rel, fullText);
        return {
          topic: key,
          path: rel,
          brief: true,
          sections,
          text,
          next: `Full page: ds_guide("${key}", { full: true }) or ds guide ${key} --full. Next: ds_find for the parts the guideline names.`,
        };
      }
      return { topic: key, path: rel, brief: false, sections, text: fullText, next: 'Next: ds_find for the parts the guideline names.' };
    }
    return {
      topic: t,
      path: null,
      text: null,
      topics: Object.keys(map).sort(),
      rules: Object.keys(RULES),
      next: `No guideline "${t}". Pick a topic or rule listed; for a component, ds_find("${t}").`,
    };
  }

  // ── check ───────────────────────────────────────────────────────────────

  function check({ code, path: file, paths } = {}) {
    let found;
    let checked = null;
    if (typeof code === 'string' && code.trim()) {
      found = escapesIn({ path: file ?? 'prototypes/snippet.jsx', text: code }, contextOf(root));
    } else if (paths?.length || consumerRoot !== root) {
      if (!readPaths) throw new PathsRefused();
      // In a project, the `plus-ds/` folder `ds add` copied in is the design system's own source (it defines the raw values), not the project's code.
      const files = expandPaths(consumerRoot, paths?.length ? paths : ['.']).filter((f) => consumerRoot === root || !new RegExp(`(^|/)${INSTALL_FOLDER}/`).test(f));
      checked = files.length;
      found = escapes(consumerRoot, files, root);
    } else {
      return { findings: [], next: 'Pass code (with a file name for its language) or paths.' };
    }
    const findings = found.map((f) => ({ file: f.file, line: f.line, col: f.col, rule: f.rule, level: f.level, message: f.message, fix: f.fix, see: docLink(f.rule) }));
    const failing = findings.filter((f) => f.level === 'fail').length;
    return {
      findings,
      failing,
      ...(checked === null ? {} : { checked }),
      next: failing
        ? 'Fix each finding as its fix says; ds_guide(<rule>) explains a rule. Then ds_check again.'
        : findings.length
          ? 'No escapes; the warnings are worth a look.'
          : 'Clean: no escapes. Template and pattern fit is not checked here.',
    };
  }

  /** What the glossary's design-system sections add to `find`: aliases per component, and what was left out. */
  const vocabulary = () => facts.vocabulary;

  return { find, get, tokens, guide, check, vocabulary };
}

// ── text ──────────────────────────────────────────────────────────────────

const pad = (s, n) => String(s).padEnd(n);

function renderFind(r) {
  const lines = r.results.map((x) => {
    if (x.kind === 'not-here') {
      const use = x.use.map((u) => u.import ?? u.name).join(' | ');
      return `${pad(x.status, 10)}${x.name} → ${use}${x.why ? `  (${x.why})` : ''}`;
    }
    if (x.kind === 'token') return `${pad('token', 10)}${x.name}  ${shortSummary(x.intent) ?? ''}`.trimEnd();
    if (x.kind === 'reference') return `${pad('reference', 10)}${x.name}  → ${x.file}#${x.export}\n          ${x.url}`;
    if (['template', 'pattern'].includes(x.kind) && x.doc) return `${pad(x.kind, 10)}${x.name}  → ${x.next}`;
    if (x.kind === 'guide') return `${pad('guide', 10)}${x.name}  → ${x.next}`;
    if (x.kind === 'icon') return `${pad('icon', 10)}${x.name}${x.status === 'pro' ? `  PRO: ${x.why}` : ''}`;
    const { usedIn, governedBy } = r.backEdges?.[x.name] ?? {};
    const via = x.figma ? `  (Figma "${x.figma}")` : x.aliasOf ? `  (alias of ${x.aliasOf})` : '';
    return `${pad(x.kind, 10)}${x.import ?? x.name}${via}${!usedIn && !governedBy && x.summary ? `  ${x.summary}` : ''}${usedIn ? `  Used in: ${usedIn}` : ''}${governedBy ? `  Governed by: ${governedBy}` : ''}`.slice(0, 160);
  });
  // One line names what to install, so no result row grows past the width a find line holds.
  const add = [...new Set(r.results.map((x) => x.registryItem).filter(Boolean))];
  const kit = r.kit ? [
    `Template: ${r.kit.template.name} → ${r.kit.template.next}`,
    `Patterns: ${r.kit.patterns.map((p) => `${p.name} → ${p.next}`).join('; ')}`,
    `Components: ${r.kit.components.map((c) => c.import?.replace(/;$/, '') ?? c.name).join('; ')}`,
    `Token roles: ${r.kit.tokenRoles.map((r) => `${r.role}: ${r.steps.map((s) => s.name).join(', ')}`).join('; ')}`,
  ] : [];
  const wrap = (line) => line.match(/.{1,160}(?:\s|$)|.{1,160}/g)?.map((part) => part.trimEnd()) ?? [];
  return [...kit.flatMap(wrap), ...lines, ...(add.length ? [`Add to a project: ds add ${add.slice(0, 5).join(' ')}`] : []), r.next].join('\n');
}

function renderGet(r) {
  const blocks = r.records.map((x) => {
    if (x.name.startsWith('--')) {
      if (x.status === 'unknown') return `${x.name}: unknown\n${x.next}`;
      const head = `${x.name}: ${x.status}${x.tier ? ` [${x.tier}]` : ''}${x.value ? `  ${x.value}` : ''}${x.intent ? `  ${x.intent}` : ''}`;
      const use = x.replacement.length ? [`  read instead: ${x.replacement.join(', ')}${x.why ? ` (${x.why})` : ''}`] : [];
      return [head, ...use, ...(x.next ? [x.next] : [])].join('\n');
    }
    if (x.status !== 'exists' || x.kind === 'prop') {
      const head = `${x.name}: ${x.status}`;
      const use = (x.use ?? x.replacement?.map((n) => ({ name: n })) ?? []).map((u) => `  use ${u.import ?? u.name}`);
      return [head, ...(x.why ? [`  why: ${x.why}`] : []), ...use, ...(x.values ? [`  values: ${x.values.join(' | ')}`] : []), ...(x.next ? [x.next] : [])].join('\n');
    }
    if (x.text) return x.text;
    const out = [`# ${x.name} (${x.kind})`, x.import, ...(x.aliasOf ? [`Alias of ${x.aliasOf}.`] : []), ...(x.summary ? [x.summary] : []), ...(x.aliases?.length ? [`Also asked as: ${x.aliases.join(', ')}.`] : [])];
    if ('props' in x) {
      out.push('', '## Props');
      for (const p of x.props) {
        const values = p.values ? ` ${p.values.map((v) => `"${v}"`).join(' | ')}` : '';
        const def = p.default ? ` = ${p.default}` : '';
        const dep = p.deprecated ? ` DEPRECATED${p.deprecated.replacement ? ` → ${p.deprecated.replacement}` : ''}` : '';
        out.push(`- ${p.name}${p.required ? ' (required)' : ''}: ${p.type ?? '?'}${values}${def}${dep}${p.description ? `. ${p.description}` : ''}`);
      }
    }
    for (const s of ['usage', 'practices', 'a11y']) if (s in x) out.push('', x[s] ?? `## ${s}\nNone authored${x.docs ? ` in ${x.docs}` : ''}.`);
    if ('figma' in x) {
      out.push('', '## Figma');
      if (!x.figma) out.push('No Figma mapping in design-system/figma/component-registry.json.');
      else for (const s of x.figma.sets) out.push(`- "${s.name}" node ${s.node ?? '?'}${s.variantProps ? ` variants ${JSON.stringify(s.variantProps)}` : ''}${s.url ? ` ${s.url}` : ''}`);
      if (x.figma?.tokens) out.push(`Tokens: ${x.figma.tokens}*`);
    }
    out.push('', x.next);
    return out.join('\n');
  });
  return [...blocks, ...(r.next ? [r.next] : [])].join('\n\n');
}

function renderTokens(r) {
  if (!r.steps.length) return `${r.next}\nRoles: ${r.roles.join(', ')}`;
  const lines = r.steps.map((t) =>
    t.status === 'exists' ? `${t.name}  ${t.value}  [${t.tier}]${t.intent ? `  ${t.intent}` : ''}` : `${t.name}: ${t.status} → ${t.replacement.join(', ')}`,
  );
  return [...lines, r.next].join('\n');
}

function renderGuide(r) {
  if (!r.text) return `${r.next}\nTopics: ${r.topics.join(', ')}\nRules: ${r.rules.join(', ')}`;
  return [r.path ? `(${r.path})` : null, r.text, '', r.next].filter((l) => l !== null).join('\n');
}

function renderCheck(r) {
  const lines = r.findings.map((f) => `${f.file}:${f.line}:${f.col}  ${f.rule}${f.level === 'warn' ? ' (warning)' : ''}  ${f.message}\n    -> ${f.fix}\n    see ${f.see}`);
  return [...lines, r.next].join('\n');
}

/** An operation's answer as text: what the command prints and the MCP returns. */
export function render(op, result) {
  return { find: renderFind, get: renderGet, tokens: renderTokens, guide: renderGuide, check: renderCheck }[op](result);
}
