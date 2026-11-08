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
 *     .get(names, section?)      full records: props, usage, examples, a11y, figma
 *     .tokens(role)              the steps for a role, each with its intent
 *     .guide(topic?)             a guideline, a rule's section, or the orientation
 *     .check({code, path} | {paths})   check:ds-usage, in-process
 *   render(op, result)           the same answer as text
 *   ORIENTATION, TOOL_ORDER      what the server sends at connection
 *
 * HOW FIND RANKS. An exact name first; then the not-here, Figma-name, token
 * and icon lanes; components and patterns rank by field-weighted BM25 over
 * their name, summary and the Usage and Best practices sections of their
 * Storybook page (`ds-rank.mjs`). The index is built on the first find from
 * the same files `get` reads, so there is no second copy to drift.
 *
 * WHERE THE ANSWERS COME FROM. Names, imports, props and tokens are the facts
 * module's (`ds-facts.mjs`). Usage, examples and accessibility are the
 * component's authored Storybook page (the `.mdx` beside its source); the
 * Figma mapping is `design-system/figma/component-registry.json`; guidelines
 * are the files under `design-system/guidelines/`; rule explanations are
 * `docs/engineering/ds-usage-rules.md`. Nothing here is authored content.
 *
 * Every answer carries a `next`: the tool to call after it, or instead of it
 * on a miss.
 */

import fs from 'node:fs';
import path from 'node:path';

import { contextOf, escapes, expandPaths } from '../check-ds-usage.mjs';
import { BARRELS, loadFacts } from './ds-facts.mjs';
import { createRanker } from './ds-rank.mjs';
import { RULES, RULES_DOC, docLink, escapesIn } from './ds-usage.mjs';

export const TOOL_ORDER = ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check'];

export const ORIENTATION = `PLUS design system: the React components, patterns and tokens every PLUS prototype is built from. A name the lookup does not know does not exist here: propose it rather than write it.

Barrels (import only from these):
- ${BARRELS[1]}: the shells (PageLayout's parts, PatternCard, PatternSection, PatternTable, overlays)
- ${BARRELS[0]}: the components (Button, TextField, SectionMessage...)
- ${BARRELS[2]}: PageLayout, which every full page starts from

Order: ds_find (what exists for the task) → ds_get (props, usage, examples, a11y, figma) → ds_tokens (steps for a role) → ds_guide (layout, content, a rule) → write → ds_check (findings to zero).

Hard rules:
- Patterns first, then components; build new interactive behavior on @base-ui/react styled with tokens.
- Props and values come from ds_get, never from memory.
- Style with semantic, pattern or component tokens (ds_tokens); never a literal, never a primitive (--palette-*, --space-<n>).
- Icons are Font Awesome Free: fa-solid, fa-regular, fa-brands.
- A full page starts from PageLayout (ds_guide layout).`;

const FIND_LIMIT = 10;
const PER_KIND = { token: 3, icon: 3 };
const SECTIONS = ['props', 'usage', 'examples', 'a11y', 'figma'];
const MDX_SECTIONS = { usage: ['Usage', 'Content guidelines'], examples: ['Best practices'], a11y: ['Accessibility'] };
const STOP = new Set('a an and the of for to with in on or my our is it that this which what i we need want use show build make page'.split(' '));
const PRO_FAMILY = /\bfa-(?:sharp-duotone|sharp|duotone|light|thin)\b/;
const FA_METADATA = ['node_modules/@fortawesome/fontawesome-free/metadata/icons.json', 'design-system/node_modules/@fortawesome/fontawesome-free/metadata/icons.json'];
const FREE_REGULAR = 'design-system/src/lib/icon-regular.generated.js';
const GUIDELINES = 'design-system/guidelines';
/** Words people ask with, mapped to the guideline file that answers them. */
const TOPIC_ALIASES = {
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
  shadow: 'elevation',
  dataviz: 'data-visualization',
  charts: 'data-visualization',
};

const readIf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
const firstSentence = (text, max = 160) => {
  if (!text) return null;
  const s = text.replace(/\s+/g, ' ').trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text.trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};
const wordsOf = (q) =>
  q
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .flatMap((w) => (w.length > 3 && w.endsWith('s') ? [w, w.slice(0, -1)] : [w]));

/** Search scores for the ranked band: above a token or export word match, below a not-here word. */
const BAND_FLOOR = 60;
const BAND_SPAN = 19;
/** Keep ranked hits within this share of the best one, so a long query does not drag in every weak match. */
const BAND_SHARE = 0.18;
const BAND_MIN = 0.6;
const BAND_MAX = 8;
/** A pattern that scores at all sits just above a component tied with it. */
const PATTERN_LIFT = 0.3;

/** One H2 section of a markdown or MDX file, without its layout wrappers. */
function sectionOf(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines
    .slice(start, end === -1 ? undefined : end)
    .filter((l) => !/^\s*<\/?div\b[^>]*>\s*$/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

/** `readPaths: false` is the hosted server's; `aliases: false` zeroes the alias field (the retrieval bench's second arm). */
export function createLookup(root, { readPaths = true, aliases = true } = {}) {
  const facts = loadFacts(root);
  const registry = JSON.parse(readIf(path.join(root, 'design-system/figma/component-registry.json')) ?? '{"components":{},"patterns":{}}');
  const records = facts.manifests.components.components;

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
    const regular = new Set([...(readIf(path.join(root, FREE_REGULAR)) ?? '').matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
    const meta = FA_METADATA.map((f) => readIf(path.join(root, f))).find(Boolean);
    const all = meta ? JSON.parse(meta) : null;
    const of = (style) => new Set(all ? Object.entries(all).filter(([, i]) => i.free?.includes(style)).map(([n]) => n) : []);
    icons = { regular, solid: of('solid'), brands: of('brands'), complete: Boolean(all) };
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
      const mdx = mdxFor(a.source);
      const text = mdx ? fs.readFileSync(mdx, 'utf8') : '';
      const section = (h) => (sectionOf(text, h) ?? '').replace(/^## .*$/m, '').replace(/<[^>]+>/g, ' ');
      return {
        id: r.name,
        fields: { name: r.name, aliases: [], summary: a.summary ?? '', usage: section('Usage'), best: section('Best practices'), related: section('Related') },
      };
    });
    ranker = createRanker(docs, aliases ? {} : { aliases: 0 });
    return ranker;
  };

  function find(query) {
    const q = String(query ?? '').trim();
    const ql = q.toLowerCase();
    const words = wordsOf(q);
    const hits = new Map();
    const hit = (key, score, item) => {
      if (score <= 0) return;
      const prev = hits.get(key);
      if (!prev || prev.score < score) hits.set(key, { ...item, score });
    };
    // A name matches at a word start: `table` finds DynamicTable, never InlineEditableTextfield.
    const nameScore = (name) => {
      const n = name.toLowerCase();
      if (n === ql) return 100;
      const parts = name.split(/(?=[A-Z][a-z])/).map((_, i, all) => all.slice(i).join('').toLowerCase());
      if (ql.length > 2 && parts.some((p) => p.startsWith(ql))) return 70 - Math.min(20, n.length - ql.length);
      return words.filter((w) => parts.some((p) => p.startsWith(w))).length * 30;
    };
    if (!q) return { query: q, results: [], next: 'Call ds_find with a task in words, a name or an alias; ds_guide() for the orientation.' };

    const joined = ql.replace(/[\s-]+/g, '');
    const item = (name) => {
      const a = facts.lookup(name);
      return { kind: a.kind, name, status: 'exists', import: a.import, summary: firstSentence(a.summary), aliasOf: a.aliasOf };
    };
    for (const r of records) if (r.name.toLowerCase() === ql || r.name.toLowerCase() === joined) hit(`name:${r.name}`, 100, item(r.name));
    const ranked = rank()
      .score(q)
      .map((r) => ({ ...r, score: r.score + (facts.lookup(r.id).kind === 'pattern' ? PATTERN_LIFT : 0) }))
      .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    const top = ranked[0]?.score ?? 0;
    for (const r of ranked.filter((x) => x.score >= Math.max(BAND_SHARE * top, BAND_MIN)).slice(0, BAND_MAX)) {
      hit(`name:${r.id}`, BAND_FLOOR + (BAND_SPAN * r.score) / top, item(r.id));
    }
    const recorded = new Set(records.map((r) => r.name));
    for (const name of facts.barrels[BARRELS[0]]) {
      if (recorded.has(name) || !/^[A-Z]/.test(name)) continue;
      hit(`name:${name}`, nameScore(name), { kind: 'export', name, status: 'exists', import: facts.lookup(name).import });
    }
    for (const { alias, name } of figmaAliases) {
      const al = alias.toLowerCase();
      const score = al === ql ? 90 : ql.length > 2 && al.includes(ql) ? 50 : words.filter((w) => al.includes(w)).length * 20;
      if (!score) continue;
      const a = facts.lookup(name);
      const key = `name:${name}`;
      const prev = hits.get(key);
      if (!prev || prev.score < score) hit(key, score, { kind: a.kind, name, status: 'exists', import: a.import, summary: firstSentence(a.summary), figma: alias });
    }
    for (const row of facts.notHere()) {
      const bare = row.not.replace(/\s*\(.*$/, '');
      const bl = bare.toLowerCase();
      const score = bl === ql ? 98 : row.kind === 'component' && words.some((w) => bl === w) ? 80 : ql.length > 2 && bl.includes(ql) ? (row.kind === 'token' ? 30 : 55) : 0;
      hit(`not:${row.not}`, score, { kind: 'not-here', name: bare, status: row.kind === 'token' && facts.retired.has(bare) ? 'retired' : 'not-here', use: row.use.map(brief), why: row.why });
    }
    if (ql.length > 2 || words.length) {
      for (const t of usableTokens) {
        const n = t.name.slice(2);
        const score = n === ql.replace(/^--/, '') ? 60 : ql.length > 2 && n.includes(ql.replace(/^--/, '')) ? 35 : words.filter((w) => n.split('-').includes(w)).length * 12;
        hit(`token:${t.name}`, score, { kind: 'token', name: t.name, status: 'exists', tier: t.tier, intent: t.intent ?? null });
      }
    }
    const iconQuery = ql.replace(/\bfa-(?:solid|regular|brands)\b/g, '').trim();
    const pro = ql.match(PRO_FAMILY)?.[0];
    if (pro) {
      hit(`icon:${ql}`, 99, { kind: 'icon', name: q, status: 'pro', why: `${pro} is a Font Awesome Pro family, not licensed here`, use: [{ name: 'fa-solid, fa-regular or fa-brands', status: 'exists' }] });
    } else {
      const sets = iconSets();
      const bare = iconQuery.replace(/^fa-/, '');
      for (const [family, set] of Object.entries({ solid: sets.solid, regular: sets.regular, brands: sets.brands })) {
        for (const name of set) {
          const score = name === bare ? 45 : bare.length > 2 && name.includes(bare) ? 25 : 0;
          hit(`icon:${name}`, score, { kind: 'icon', name: `fa-${family} fa-${name}`, status: 'exists' });
        }
      }
      if (/^fa-[a-z0-9-]+$/.test(iconQuery) && sets.complete && ![sets.solid, sets.regular, sets.brands].some((s) => s.has(bare))) {
        hit(`icon:${bare}`, 97, { kind: 'icon', name: iconQuery, status: 'pro', why: 'not in Font Awesome Free; Pro-only names render blank here' });
      }
    }

    const counts = {};
    const results = [...hits.values()]
      .sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : 1))
      .filter((r) => {
        const kind = r.name.startsWith('--') ? 'token' : r.kind;
        counts[kind] = (counts[kind] ?? 0) + 1;
        return counts[kind] <= (PER_KIND[kind] ?? FIND_LIMIT);
      })
      .slice(0, FIND_LIMIT)
      .map(({ score, ...r }) => r);
    const next = results.length
      ? 'Next: ds_get with the names you will use (section "props" first); ds_tokens for a styling role.'
      : `Nothing matches "${q}". Try one plain word (card, table, date); ds_tokens for a token role; ds_guide for a guideline topic.`;
    return { query: q, results, next };
  }

  // ── get ─────────────────────────────────────────────────────────────────

  function mdxFor(source) {
    if (!source) return null;
    const dir = path.join(root, path.dirname(source));
    const own = path.join(dir, `${path.basename(source).replace(/\.[jt]sx?$/, '')}.mdx`);
    if (fs.existsSync(own)) return own;
    const any = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.endsWith('.mdx')) : null;
    return any ? path.join(dir, any) : null;
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
    const mdx = mdxFor(home.source ?? a.source);
    const mdxText = mdx ? fs.readFileSync(mdx, 'utf8') : null;
    const record = {
      name: a.name,
      status: a.status,
      kind: a.kind,
      import: a.import,
      aliasOf: a.aliasOf,
      summary: firstSentence(a.summary, 300),
      source: home.source ?? a.source,
      docs: mdx ? path.relative(root, mdx).split(path.sep).join('/') : null,
      why: a.why,
      use: a.replacement.map(brief),
    };
    const wanted = section ? [section] : SECTIONS;
    for (const s of wanted) {
      if (s === 'props') record.props = (a.props ?? []).map((p) => ({ name: p.name, type: p.type, values: p.values, default: p.default, required: p.required, description: p.description, deprecated: p.deprecated }));
      else if (s === 'figma') record.figma = figmaFor(a.aliasOf ?? a.name);
      else record[s] = mdxText ? MDX_SECTIONS[s].map((h) => sectionOf(mdxText, h)).filter(Boolean).join('\n\n') || null : null;
    }
    record.next = 'Next: ds_tokens for the roles you style; ds_check once the code is written.';
    return record;
  }

  function get(names, section) {
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

  const topics = () => {
    const map = {};
    for (const dir of ['foundations', 'composition']) {
      for (const f of fs.readdirSync(path.join(root, GUIDELINES, dir)).filter((f) => f.endsWith('.md') && f !== 'overview.md')) {
        map[f.replace(/\.md$/, '')] ??= `${GUIDELINES}/${dir}/${f}`;
      }
    }
    map.content = `${GUIDELINES}/foundations/content/overview.md`;
    for (const f of fs.readdirSync(path.join(root, GUIDELINES, 'foundations/content')).filter((f) => f.endsWith('.md') && f !== 'overview.md')) {
      map[f.replace(/\.md$/, '')] = `${GUIDELINES}/foundations/content/${f}`;
    }
    map.components = `${GUIDELINES}/components/overview.md`;
    map.figma = `${GUIDELINES}/figma/overview.md`;
    return map;
  };

  function guide(arg) {
    const t = String(arg ?? '').trim().toLowerCase();
    if (!t) return { topic: null, path: null, text: ORIENTATION, next: 'Start with ds_find.' };
    const rule = Object.keys(RULES).find((id) => id === t || id === `ds/${t}`);
    if (rule) {
      const text = sectionOf(fs.readFileSync(path.join(root, RULES_DOC), 'utf8'), rule);
      return { topic: rule, path: docLink(rule), text, next: 'Fix the code as the section says, then ds_check again.' };
    }
    const map = topics();
    const key = map[t] ? t : TOPIC_ALIASES[t] ?? Object.keys(map).find((k) => t.split(/[\s/-]+/).includes(k)) ?? Object.entries(TOPIC_ALIASES).find(([a]) => t.includes(a))?.[1];
    if (key && map[key]) {
      return { topic: key, path: map[key], text: fs.readFileSync(path.join(root, map[key]), 'utf8').trim(), next: 'Next: ds_find for the parts the guideline names.' };
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
    } else if (paths?.length) {
      if (!readPaths) throw new PathsRefused();
      found = escapes(root, expandPaths(root, paths));
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

  return { find, get, tokens, guide, check };
}

// ── text ──────────────────────────────────────────────────────────────────

const pad = (s, n) => String(s).padEnd(n);

function renderFind(r) {
  const lines = r.results.map((x) => {
    if (x.kind === 'not-here') {
      const use = x.use.map((u) => u.import ?? u.name).join(' | ');
      return `${pad(x.status, 10)}${x.name} → ${use}${x.why ? `  (${x.why})` : ''}`;
    }
    if (x.kind === 'token') return `${pad('token', 10)}${x.name}  ${x.intent ?? ''}`.trimEnd();
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
    const out = [`# ${x.name} (${x.kind})`, x.import, ...(x.aliasOf ? [`Alias of ${x.aliasOf}.`] : []), ...(x.summary ? [x.summary] : [])];
    if ('props' in x) {
      out.push('', '## Props');
      for (const p of x.props) {
        const values = p.values ? ` ${p.values.map((v) => `"${v}"`).join(' | ')}` : '';
        const def = p.default ? ` = ${p.default}` : '';
        const dep = p.deprecated ? ` DEPRECATED${p.deprecated.replacement ? ` → ${p.deprecated.replacement}` : ''}` : '';
        out.push(`- ${p.name}${p.required ? ' (required)' : ''}: ${p.type ?? '?'}${values}${def}${dep}${p.description ? `. ${p.description}` : ''}`);
      }
    }
    for (const s of ['usage', 'examples', 'a11y']) if (s in x) out.push('', x[s] ?? `## ${s}\nNone authored${x.docs ? ` in ${x.docs}` : ''}.`);
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
