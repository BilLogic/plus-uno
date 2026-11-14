/**
 * Which Foundations ▸ Tokens page each token is shown on, and in which section.
 *
 * ONE MAPPING. A token's collection (Color, Typography, Spacing and size,
 * Elevation and layers, Motion), tier (primitive or semantic) and scope
 * (global, components or templates) are derived here from its name and the
 * stylesheet that defines it, and nowhere else: the collection pages, the
 * Library page and the naming audit all read `placeToken`.
 *
 * Templates are page-level tokens (page, focused page, section, frame and
 * frame layers); Components are card, modal, popover, table and every
 * per-component token; Global is everything shared. Frame tokens live on
 * Spacing and size, layer tokens on Elevation and layers.
 *
 * Plain ESM with no Node-only import, so Vite bundles it for the pages and
 * `node --test` loads the same file.
 */
import { readTokens, resolveToken } from '../../lib/tokens.mjs';

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

const TEMPLATE_PREFIXES = ['page', 'focused-page', 'section', 'frame'];

const place = (collection, tier, scope = null) => ({ collection, tier, scope: tier === 'primitive' ? null : scope });

/** Collection, tier and scope of one token, or null when no rule claims it. */
export function placeToken(name, file = '') {
  if (/^--palette-/.test(name)) return place('color', 'primitive');
  if (/^--ds-(shadow|opacity)-/.test(name)) return place('elevation', 'semantic', 'global');
  if (/^--ds-motion-/.test(name)) return place('motion', 'semantic', 'global');
  if (/^--ds-(chart|skeleton)-/.test(name)) return place('color', 'semantic', 'components');
  if (/^--ds-/.test(name)) return place('color', 'semantic', 'global');

  if (/^--(font-size|line-height)-\d/.test(name) || /^--type-(family|weight|tracking)-/.test(name)) {
    return place('typography', 'primitive');
  }
  if (/^--(heading|body|metric|code)(-|$)/.test(name)) return place('typography', 'semantic', 'global');

  if (/^--motion-spring-/.test(name)) return place('motion', 'primitive');

  if (/^--frame-layer-/.test(name)) return place('elevation', 'semantic', 'templates');
  if (/^--layer-/.test(name)) return place('elevation', 'semantic', 'global');

  if (/^--(space|size|width|height|stroke)-\d/.test(name) || name === '--space-0' || /^--radius-(\d|full$)/.test(name)) {
    return place('spacing', 'primitive');
  }
  if (TEMPLATE_PREFIXES.some((p) => name.startsWith(`--${p}-`))) return place('spacing', 'semantic', 'templates');
  if (/^--(pad|stack|inline|radius|control|focus-ring|grid|screen|content|border|breakpoint|col)-/.test(name)) {
    return place('spacing', 'semantic', 'global');
  }
  // Card, modal, popover, table, blanket, panel and every per-component size
  // (field, row, label, icon, image, button, tag ...) are Components.
  if (/^--[a-z0-9-]+$/.test(name) && /(^|\/)(ladder\/_components|ladder\/_patterns|_frame_layers|_scales)\.scss$/.test(file)) {
    return place('spacing', 'semantic', 'components');
  }
  return null;
}

/**
 * The token table from raw stylesheet text, in the shape `tokenCorpus` returns
 * (name → {raw, value, file}), so a browser page and a node test share it.
 *
 * @param {{file: string, text: string}[]} sources
 * @returns {Map<string, {raw: string, value: string, file: string}>}
 */
export function collectTokens(sources) {
  const raw = new Map();
  const files = new Map();
  for (const { file, text } of sources) {
    for (const [name, value] of readTokens(text)) {
      if (raw.has(name)) continue;
      raw.set(name, value);
      files.set(name, file);
    }
  }
  const out = new Map();
  for (const [name, value] of raw) {
    out.set(name, { raw: value, value: resolveToken(name, raw) ?? value, file: files.get(name) });
  }
  return out;
}

/**
 * One collection's tokens as ordered sections: Primitives, then Semantics split
 * into Global, Components and Templates. A section with no tokens is left out.
 *
 * @returns {{id: string, tier: string, scope: string|null, title: string, tokens: {name: string, value: string, raw: string, file: string}[]}[]}
 */
export function groupBySection(corpus, collection) {
  const buckets = new Map();
  const order = [['primitive', null], ...SCOPES.map((s) => ['semantic', s])];
  for (const [tier, scope] of order) buckets.set(`${tier}:${scope}`, []);
  for (const [name, entry] of corpus) {
    const p = placeToken(name, entry.file);
    if (!p || p.collection !== collection) continue;
    buckets.get(`${p.tier}:${p.scope}`).push({ name, value: entry.value, raw: entry.raw, file: entry.file });
  }
  return order
    .map(([tier, scope]) => ({
      id: tier === 'primitive' ? 'primitives' : `semantics-${scope}`,
      tier,
      scope,
      title: tier === 'primitive' ? 'Primitives' : SCOPE_TITLES[scope],
      tokens: buckets.get(`${tier}:${scope}`),
    }))
    .filter((s) => s.tokens.length > 0);
}

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
    problem: 'Primitive and semantic radius share the `--radius-` prefix, so the tier cannot be read from the name; `full` is not a rem × 100 step',
    match: (n) => /^--radius-(\d+|full)$/.test(n),
    propose: (n) => n.replace('--radius-', '--radius-scale-'),
  },
  {
    problem: 'Stroke step is a bare pixel count; the other primitives are rem × 100',
    match: (n) => /^--stroke-[12]$/.test(n),
    propose: (n) => ({ '--stroke-1': '--stroke-00625', '--stroke-2': '--stroke-0125' })[n],
  },
  {
    problem: 'Typography primitives use three prefixes (`font-size`, `line-height`, `type`)',
    match: (n) => /^--(font-size|line-height)-\d/.test(n),
    propose: (n) => n.replace(/^--font-size-/, '--type-size-').replace(/^--line-height-/, '--type-leading-'),
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
    problem: 'Flag, menu and tooltip tokens sit in the `popover` family; each has (or should have) its own family',
    match: (n) => /^--popover-.*-(flag|menu|tooltip)$/.test(n),
    propose: (n) => n.replace(/^--popover-(.*)-(flag|menu|tooltip)$/, '--$2-$1'),
  },
  {
    problem: 'Side is spelled `end`; every other pad token uses `-x` / `-y`',
    match: (n) => /^--tag-pad-end/.test(n),
    propose: (n) => n.replace('pad-end', 'pad-x-end'),
  },
  {
    problem: 'Property segment is `vertical-size`; other sizes are `size` or `height`',
    match: (n) => n === '--button-vertical-size',
    propose: () => '--button-size-vertical',
  },
];

/**
 * Every token whose name breaks the collection convention.
 *
 * @returns {{token: string, collection: string, problem: string, proposed: string}[]}
 */
export function tokenNamingAudit(corpus) {
  const rows = [];
  const seen = new Set();
  for (const [name, entry] of corpus) {
    const p = placeToken(name, entry.file);
    if (!p) continue;
    for (const rule of AUDIT_RULES) {
      if (seen.has(name) || !rule.match(name)) continue;
      seen.add(name);
      rows.push({ token: name, collection: COLLECTION_TITLES[p.collection], problem: rule.problem, proposed: rule.propose(name) });
    }
  }
  return rows;
}
