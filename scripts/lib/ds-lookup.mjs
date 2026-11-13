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

import { contextOf, escapes, expandPaths } from '../check-ds-usage.mjs';
import { BARRELS, loadFacts } from './ds-facts.mjs';
import { createPageFinder, pageText, readDocsPage, sectionText } from './docs-page.mjs';
import { FIND_TUNING, STOPWORDS, createRanker } from './ds-rank.mjs';
import { readIconLists } from './icon-lists.mjs';
import { RULES, RULES_DOC, docLink, escapesIn } from './ds-usage.mjs';
import { SECTION_ALIASES, SECTION_TITLES, componentFacts, docPathOf, renderComponent, sectionsOf } from './component-render.mjs';

export const TOOL_ORDER = ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check'];

export const ORIENTATION = `PLUS design system: the React components, patterns and tokens every PLUS prototype is built from. A name the lookup does not know does not exist here: propose it rather than write it.

Barrels (import only from these):
- ${BARRELS[1]}: the shells (Frame, which every full page starts from, PatternCard, PatternSection, PatternTable, overlays)
- ${BARRELS[0]}: the components (Button, TextField, SectionMessage...)

Order: ds_find (what exists for the task) → ds_get (props, usage, practices, a11y, figma) → ds_tokens (steps for a role) → ds_guide (layout, content, a rule) → write → ds_check (findings to zero).

Hard rules:
- Patterns first, then components; build new interactive behavior on @base-ui/react styled with tokens.
- Props and values come from ds_get, never from memory.
- Style with semantic, pattern or component tokens (ds_tokens); never a literal, never a primitive (--palette-*, --space-<n>).
- Icons are Font Awesome Free: fa-solid, fa-regular, fa-brands.
- A full page starts from a template: Frame with the PLUS Sidebar (ds_guide layout).`;

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
const FOUNDATION_PAGES = 'design-system/src/styles';
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

/**
 * `readPaths: false` is the hosted server's; `aliases: false` zeroes the alias field (the retrieval bench's second arm);
 * `consumerRoot` is where `check` reads `paths` from when that is not the facts' tree (the packaged `ds check` reads the caller's project);
 * `iconMetadata` stands in for the committed Free icon lists (the `icons.json` shape), for a test that needs a small set.
 */
export function createLookup(root, { readPaths = true, aliases = true, iconMetadata = null, consumerRoot = root } = {}) {
  const facts = loadFacts(root);
  const registry = JSON.parse(readIf(path.join(root, 'design-system/figma/component-registry.json')) ?? '{"components":{},"patterns":{}}');
  const records = facts.manifests.components.components;
  const findPage = createPageFinder(root, registry);
  /** A component's docs page, found by its Storybook meta or the registry: `{path, page}`, or null. Read once. */
  const pages = new Map();
  const pageOf = (name, source) => {
    if (!pages.has(name)) {
      const rel = findPage({ name, source });
      pages.set(name, rel ? { path: rel, page: readDocsPage(fs.readFileSync(path.join(root, rel), 'utf8'), { root, file: rel }) } : null);
    }
    return pages.get(name);
  };

  /** Figma component and set names → the code name they map to. */
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

  const usableTokens = facts.manifests.tokens.tokens.filter((t) => t.tier !== 'primitive' && !/^Legacy\b/.test(t.group));
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
    const docs = records.map((r) => {
      const a = facts.lookup(r.name);
      const page = pageOf(r.name, a.source)?.page;
      const section = (h) => (page && sectionText(page, h)) ?? '';
      return {
        id: r.name,
        fields: { name: r.name, aliases: aliases ? a.aliases : [], summary: firstSentence(a.summary, Infinity) ?? '', usage: section('Usage'), best: section('Best practices'), related: section('Related') },
      };
    });
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
    return { kind: a.kind, name, status: 'exists', import: a.import, summary: shortSummary(a.summary), aliasOf: a.aliasOf, ...extra };
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
    steps.sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : 1));
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

    for (const row of exactLane(c)) push(row);
    for (const row of notHereLane(c)) push(row);
    // The band is scored before the token lane: its best score decides how many token steps lead.
    const { top, band } = rankedBand(c);
    for (const row of tokenLane(c, top)) push(row);
    for (const row of iconLane(c)) push(row);
    for (const row of meaningLane(c, band)) push(row);
    for (const row of exportLane(c)) push(row);

    // Lane 7: a pointer to the guideline a query word names, always kept as the last row.
    const topics = topicsOf(c);
    const guideRow = topics.length ? [{ kind: 'guide', name: topics[0], next: `ds_guide("${topics[0]}")` }] : [];
    const results = [...out.slice(0, FIND_LIMIT - guideRow.length), ...guideRow];

    const next = out.length
      ? 'Next: ds_get with the names you will use (section "props" first); ds_tokens for a styling role.'
      : `Nothing matches "${q}". Try one plain word (card, table, date); ds_tokens for a token role; ${topics.length ? `ds_guide(${topics.map((t) => `"${t}"`).join(', ')})` : 'ds_guide for a guideline topic'}.`;
    return { query: q, results, next };
  }

  // ── get ─────────────────────────────────────────────────────────────────

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
    const home = a.aliasOf ? facts.lookup(a.aliasOf) : a;
    const docs = pageOf(a.aliasOf ?? a.name, home.source ?? a.source);
    const record = {
      name: a.name,
      status: a.status,
      kind: a.kind,
      import: a.import,
      aliasOf: a.aliasOf,
      summary: firstSentence(a.summary, 300),
      aliases: a.aliases,
      source: home.source ?? a.source,
      docs: docs?.path ?? null,
      why: a.why,
      use: a.replacement.map(brief),
    };
    // The text is the generated doc's: one render (`component-render.mjs`) from the manifest record and the page.
    const homeName = a.aliasOf ?? a.name;
    const componentFactsOf = componentFacts(facts.manifests.components, homeName, { [homeName]: facts.lookup(homeName).aliases });
    const text = componentFactsOf?.source ? renderComponent(componentFactsOf, docs) : null;
    if (text) record.doc = docPathOf(componentFactsOf);
    const wanted = section ? [section] : SECTIONS;
    for (const s of wanted) {
      if (s === 'props') record.props = (a.props ?? []).map((p) => ({ name: p.name, type: p.type, values: p.values, default: p.default, required: p.required, description: p.description, deprecated: p.deprecated }));
      else if (s === 'figma') record.figma = figmaFor(a.aliasOf ?? a.name);
      else record[s] = text ? sectionsOf(text, SECTION_TITLES[s]) : null;
    }
    if (text) record.text = section ? [`# ${a.name}`, a.import, sectionsOf(text, SECTION_TITLES[section]) ?? `## ${section}\n\nNone in the generated doc.`].join('\n\n') + '\n' : text;
    else record.next = 'Next: ds_tokens for the roles you style; ds_check once the code is written.';
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

  /** A folder's `.md` files other than its overview; none when the folder is empty or gone. */
  const mdIn = (dir) => (fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.md') && f !== 'overview.md') : []);
  /**
   * Topic → the file that answers it. A guideline file answers its topic while
   * it exists; a foundation topic with none is answered by its Storybook
   * foundation page (`Colors.mdx` → color), read through the page model.
   */
  const topics = () => {
    const map = {};
    for (const dir of ['foundations', 'composition']) {
      for (const f of mdIn(`${GUIDELINES}/${dir}`)) map[f.replace(/\.md$/, '')] ??= `${GUIDELINES}/${dir}/${f}`;
    }
    if (fs.existsSync(path.join(root, GUIDELINES, 'foundations/content/overview.md'))) map.content = `${GUIDELINES}/foundations/content/overview.md`;
    for (const f of mdIn(`${GUIDELINES}/foundations/content`)) map[f.replace(/\.md$/, '')] = `${GUIDELINES}/foundations/content/${f}`;
    for (const f of fs.existsSync(path.join(root, FOUNDATION_PAGES)) ? fs.readdirSync(path.join(root, FOUNDATION_PAGES)) : []) {
      const base = f.match(/^([A-Z][A-Za-z]*)\.mdx$/)?.[1]?.toLowerCase();
      if (base && base !== 'foundationsoverview') map[TOPIC_ALIASES[base] ?? base] ??= `${FOUNDATION_PAGES}/${f}`;
    }
    for (const [key, file] of [['components', 'components/overview.md'], ['figma', 'figma/overview.md']]) {
      if (fs.existsSync(path.join(root, GUIDELINES, file))) map[key] = `${GUIDELINES}/${file}`;
    }
    return map;
  };
  /** A topic file's text: a guideline as written, a foundation page as its page model's markdown. */
  const topicText = (rel) => {
    const source = fs.readFileSync(path.join(root, rel), 'utf8');
    return rel.endsWith('.mdx') ? pageText(readDocsPage(source, { kind: 'foundation', root, file: rel })) : source.trim();
  };

  function guide(arg) {
    const t = String(arg ?? '').trim().toLowerCase();
    if (!t) return { topic: null, path: null, text: ORIENTATION, next: 'Start with ds_find.' };
    const rule = Object.keys(RULES).find((id) => id === t || id === `ds/${t}`);
    if (rule) {
      const text = headed(readDocsPage(fs.readFileSync(path.join(root, RULES_DOC), 'utf8')), rule);
      return { topic: rule, path: docLink(rule), text, next: 'Fix the code as the section says, then ds_check again.' };
    }
    const map = topics();
    const key = map[t] ? t : TOPIC_ALIASES[t] ?? Object.keys(map).find((k) => t.split(/[\s/-]+/).includes(k)) ?? Object.entries(TOPIC_ALIASES).find(([a]) => t.includes(a))?.[1];
    if (key && map[key]) {
      return { topic: key, path: map[key], text: topicText(map[key]), next: 'Next: ds_find for the parts the guideline names.' };
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
    if (typeof code === 'string' && code.trim()) {
      found = escapesIn({ path: file ?? 'prototypes/snippet.jsx', text: code }, contextOf(root));
    } else if (paths?.length || consumerRoot !== root) {
      if (!readPaths) throw new PathsRefused();
      found = escapes(consumerRoot, expandPaths(consumerRoot, paths?.length ? paths : ['.']), root);
    } else {
      return { findings: [], next: 'Pass code (with a file name for its language) or paths.' };
    }
    const findings = found.map((f) => ({ file: f.file, line: f.line, col: f.col, rule: f.rule, level: f.level, message: f.message, fix: f.fix, see: docLink(f.rule) }));
    const failing = findings.filter((f) => f.level === 'fail').length;
    return {
      findings,
      failing,
      next: failing
        ? 'Fix each finding as its fix says; ds_guide(<rule>) explains a rule. Then ds_check again.'
        : findings.length
          ? 'No escapes; the warnings are worth a look.'
          : 'Clean: no escapes.',
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
    if (x.kind === 'guide') return `${pad('guide', 10)}${x.name}  → ${x.next}`;
    if (x.kind === 'icon') return `${pad('icon', 10)}${x.name}${x.status === 'pro' ? `  PRO: ${x.why}` : ''}`;
    const via = x.figma ? `  (Figma "${x.figma}")` : x.aliasOf ? `  (alias of ${x.aliasOf})` : '';
    return `${pad(x.kind, 10)}${x.import ?? x.name}${via}${x.summary ? `  ${x.summary}` : ''}`;
  });
  return [...lines, r.next].join('\n');
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
