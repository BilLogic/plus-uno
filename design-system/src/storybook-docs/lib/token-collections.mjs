/**
 * Which Foundations ▸ Tokens page each token is shown on, and in which section.
 *
 * ONE LIST, ONE MAPPING. Every docs token block reads the generated token table
 * (`agent-views/tokens.json`: name, value, tier, intent, and the dark value
 * where the dark mode changes it) through `tokenCollections`, which returns
 * ordered collections. A token's collection (Color, Typography, Spacing and
 * size, Elevation and layers, Motion), tier (primitive or semantic) and scope
 * (global, components or templates) are derived here from its name and its
 * record, and nowhere else: the collection pages, the Library page, the color
 * and type blocks and the naming audit all read it. A token added to the source
 * shows on its page once the table is regenerated, with no edit to a page.
 *
 * Templates are page-level tokens (page, section, frame and
 * frame layers); Components are card, modal, popup, table and every
 * per-component token; Global is everything shared. Frame tokens live on
 * Spacing and size, layer tokens on Elevation and layers.
 *
 * Plain ESM with no Node-only import, so Vite bundles it for the pages and
 * `node --test` loads the same file.
 */
import { resolveToken, tokenNamePattern } from '../../lib/tokens.mjs';

export const COLLECTIONS = ['color', 'typography', 'spacing', 'elevation', 'motion'];
export const TIERS = ['primitive', 'semantic'];
export const SCOPES = ['global', 'components', 'templates'];

export const COLLECTION_TITLES = {
  color: 'Color',
  typography: 'Typography',
  spacing: 'Spacing and size',
  elevation: 'Elevation and layers',
  motion: 'Motion',
};

export const SCOPE_TITLES = { global: 'Global', components: 'Components', templates: 'Templates' };

const TEMPLATE_PREFIXES = ['page', 'section', 'frame'];

const place = (collection, tier, scope = null) => ({ collection, tier, scope: tier === 'primitive' ? null : scope });

/**
 * Collection, tier and scope of one token, or null when no rule claims it.
 *
 * @param {string} name
 * @param {{tier?: string, group?: string}} [record] the token's row in the table
 */
export function placeToken(name, record = {}) {
  if (/^--palette-/.test(name)) return place('color', 'primitive');
  if (/^--ds-(shadow|opacity)-/.test(name)) return place('elevation', 'semantic', 'global');
  if (/^--ds-motion-/.test(name)) return place('motion', 'semantic', 'global');
  if (/^--chart-/.test(name) || name === '--skeleton-subtle') return place('color', 'semantic', 'components');
  if (/^--ds-/.test(name)) return place('color', 'semantic', 'global');

  if (/^--type-(size|line-height)-\d/.test(name) || /^--type-(family|weight|tracking)-/.test(name)) {
    return place('typography', 'primitive');
  }
  if (/^--(heading|body|metric|code|label-eyebrow)(-|$)/.test(name)) return place('typography', 'semantic', 'global');

  if (/^--motion-spring-/.test(name)) return place('motion', 'primitive');

  if (/^--layer-frame-/.test(name)) return place('elevation', 'semantic', 'templates');
  if (/^--layer-/.test(name)) return place('elevation', 'semantic', 'global');

  if (/^--(space|size|width|height|stroke)-\d/.test(name) || name === '--space-0' || /^--radius-(\d|full$)/.test(name)) {
    return place('spacing', 'primitive');
  }
  if (TEMPLATE_PREFIXES.some((p) => name.startsWith(`--${p}-`))) return place('spacing', 'semantic', 'templates');
  if (/^--(pad|stack|inline|radius|control|footer|focus-ring|grid|screen|content|border|breakpoint|col)-/.test(name)) {
    return place('spacing', 'semantic', 'global');
  }
  // Card, modal, popup, table, blanket, panel and every per-component size
  // (field, row, label, icon, image, button, tag ...) are Components: a token
  // the ladder files own (a component or template token, a frame or layer
  // token) or one of the scales.
  if (tokenNamePattern().test(name) && (record.tier === 'component' || record.tier === 'template' || /^Scale /.test(record.group ?? ''))) {
    return place('spacing', 'semantic', 'components');
  }
  return null;
}

/**
 * The docs token collections, in page order: Color, Typography, Spacing and
 * size, Elevation and layers, Motion. Each is ordered sections: Primitives, then
 * Semantics split into Global, Components and Templates, with the tokens of a
 * section in the table's order, which is the stylesheet's: a z-index or size
 * ladder reads small to large. A section with no tokens and a collection with
 * no section are left out.
 *
 * A token's value is its alias followed to a literal, as the page resolves it;
 * `raw` is what the stylesheet says; `dark` is its dark-mode value, or null when
 * the dark mode leaves it alone.
 *
 * @param {{name: string, value: string, tier?: string, group?: string, intent?: string, dark?: string}[]} records the rows of `agent-views/tokens.json`
 * @returns {{collection: string, title: string, sections: {id: string, tier: string, scope: string|null, title: string, tokens: {name: string, raw: string, value: string, dark: string|null, intent: string}[]}[]}[]}
 */
export function tokenCollections(records) {
  const raw = new Map(records.map((r) => [r.name, r.value]));
  const order = [['primitive', null], ...SCOPES.map((s) => ['semantic', s])];
  const buckets = new Map(COLLECTIONS.flatMap((c) => order.map(([tier, scope]) => [`${c}|${tier}|${scope}`, []])));
  for (const record of records) {
    const place = placeToken(record.name, record);
    if (!place) continue;
    buckets.get(`${place.collection}|${place.tier}|${place.scope}`).push({
      name: record.name,
      raw: record.value,
      value: resolveToken(record.name, raw) ?? record.value,
      dark: record.dark ?? null,
      intent: record.intent ?? '',
    });
  }
  return COLLECTIONS.map((collection) => ({
    collection,
    title: COLLECTION_TITLES[collection],
    sections: order
      .map(([tier, scope]) => ({
        id: tier === 'primitive' ? 'primitives' : `semantics-${scope}`,
        tier,
        scope,
        title: tier === 'primitive' ? 'Primitives' : SCOPE_TITLES[scope],
        tokens: buckets.get(`${collection}|${tier}|${scope}`),
      }))
      .filter((section) => section.tokens.length > 0),
  })).filter((c) => c.sections.length > 0);
}

/** Every token of the collections as one list, in page order. */
export const allTokens = (collections) => collections.flatMap((c) => c.sections.flatMap((s) => s.tokens));

/* ─── The naming audit ─────────────────────────────────────────────────────── */

const SHORT = { xxlarge: 'xxl', xlarge: 'xl', large: 'lg', medium: 'md', small: 'sm', xsmall: 'xs', xxsmall: 'xxs' };

/**
 * Rules for the collection naming convention: a tier readable from the prefix,
 * a scope prefix on every component or template token, and size steps in the
 * short sm / md / lg form (primitives in rem × 100). Each rule says what it
 * found and proposes a name; nothing here renames a token.
 */
const AUDIT_RULES = [
  {
    problem: 'Size step spelled out (small, medium, large); every other family uses sm, md, lg',
    match: (n) => /^--(heading|body|metric)-.*(xxlarge|xlarge|large|medium|small|xsmall|xxsmall)(-tracking)?$/.test(n),
    propose: (n) => n.replace(/(xxlarge|xlarge|large|medium|small|xsmall|xxsmall)/, (s) => SHORT[s]),
  },
  {
    problem: 'Typography primitives use three prefixes (`font-size`, `line-height`, `type`)',
    match: (n) => /^--(font-size|line-height)-\d/.test(n),
    propose: (n) => n.replace(/^--font-size-/, '--type-size-').replace(/^--line-height-/, '--type-line-height-'),
  },
  {
    problem: 'Text style with no variant segment; `body` and `heading` carry one',
    match: (n) => n === '--code',
    propose: () => '--code-default',
  },
  {
    problem: 'Width token named `border-*` reads as a color or a border style; the color tokens are `--ds-border-*`',
    match: (n) => /^--border-(default|selected|focused)$/.test(n),
    propose: (n) => n.replace('--border-', '--border-width-'),
  },
  {
    problem: 'Duplicates `--control-*` (24 and 32 high) under a second family name',
    match: (n) => /^--item-height-(sm|md)$/.test(n),
    propose: (n) => n.replace('--item-height-', '--control-'),
  },
  {
    problem: 'Layer token starts with `frame-`, but it is a layer: the scope prefix and the collection disagree',
    match: (n) => /^--frame-layer-/.test(n),
    propose: (n) => n.replace('--frame-layer-', '--layer-frame-'),
  },
  {
    problem: 'Component color token carries the global `--ds-` prefix',
    match: (n) => /^--ds-(chart|skeleton)-/.test(n),
    propose: (n) => n.replace('--ds-', '--'),
  },
  {
    problem: 'Side is spelled `end`; every other pad token uses `-x` / `-y`',
    match: (n) => /^--tag-pad-end/.test(n),
    propose: (n) => n.replace('pad-end', 'pad-x-end'),
  },
];

/**
 * Every token whose name breaks the collection convention.
 *
 * @returns {{token: string, collection: string, problem: string, proposed: string}[]}
 */
export function tokenNamingAudit(records) {
  const rows = [];
  const seen = new Set();
  for (const record of records) {
    const name = record.name;
    const p = placeToken(name, record);
    if (!p) continue;
    for (const rule of AUDIT_RULES) {
      if (seen.has(name) || !rule.match(name)) continue;
      seen.add(name);
      rows.push({ token: name, collection: COLLECTION_TITLES[p.collection], problem: rule.problem, proposed: rule.propose(name) });
    }
  }
  return rows;
}
