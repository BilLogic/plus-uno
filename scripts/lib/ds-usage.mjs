/**
 * The escape rules behind `check:ds-usage`: one place where agent-written code
 * leaves the design system, found in one file, from the manifests alone.
 *
 * Pure. The caller reads the files and the two manifests
 * (`design-system/agent-views/components.json`, `tokens.json`) and hands them
 * in; this module never touches the disk, so every rule is tested on strings.
 *
 * Each finding names its rule, where it is, what is wrong and what to write
 * instead (the closest real name from the manifest, where one is close). The
 * rules and what each holds are documented one per section in
 * `docs/engineering/ds-usage-rules.md`; a rule's id is its anchor there.
 */

import { varReferencePattern } from '../../design-system/src/lib/tokens.mjs';
import { EXTERNAL, isInterpolated } from '../undefined-tokens.mjs';
import { blankComments, closeOf, importsOf, jsxElementsOf, literalOf, positionAt, styleObjectsOf } from './jsx-scan.mjs';

export const RULES_DOC = 'docs/engineering/ds-usage-rules.md';

/** id -> level. `fail` blocks; `warn` is printed and never blocks. */
export const RULES = {
  'ds/no-unknown-component': { level: 'fail' },
  'ds/no-deep-import': { level: 'fail' },
  'ds/no-unknown-prop': { level: 'fail' },
  'ds/no-raw-literal': { level: 'fail' },
  'ds/no-unknown-token': { level: 'fail' },
  'ds/no-primitive-read': { level: 'fail' },
  'ds/fa-free-only': { level: 'fail' },
  'ds/prefer-plus-component': { level: 'warn' },
  'ds/no-retired-name': { level: 'warn' },
  'ds/page-starts-from-pattern': { level: 'warn' },
};

/** The rule's section in the rules doc, as a link a terminal can open. */
export const docLink = (rule) => `${RULES_DOC}#${rule.replace('/', '')}`;

const SCRIPT = /\.(jsx|js|mjs|cjs|tsx|ts)$/;
const STYLE = /\.(scss|css)$/;
const MARKUP = /\.html$/;

/**
 * Specifiers that are a public barrel: the components, the patterns, and the
 * page templates `PageLayout` comes from. The capture is the barrel's canonical
 * `@/` name, whichever alias wrote it.
 */
const BARREL = /^(?:@|@plus-ds)\/(components|patterns|specs\/Universal\/Pages)\/?$/;
const barrelOf = (source) => `@/${source.match(BARREL)[1]}`;
/** The barrel a manifest record imports from: its import line's specifier, or `@/components`. */
const homeOf = (record) => record.import?.match(/from '([^']+)'/)?.[1] ?? '@/components';
/** Specifiers that reach past a barrel into design-system source. */
const DEEP = /^(?:@|@plus-ds)\/(?:components|patterns|dataviz)\/.+|(?:^|\/)design-system\/(?:src\/)?components(?:\/|$)|(?:^|\/)design-system\/src\//;
const BOOTSTRAP = /^react-bootstrap(?:\/([\w]+))?$/;

/**
 * Props every component takes without declaring them: React's own, and the
 * attribute families a component forwards to its DOM node.
 */
const UNDECLARED = new Set(['key', 'ref', 'children', 'className', 'style', 'id', 'role', 'title', 'tabIndex']);
const isUndeclaredProp = (name) => UNDECLARED.has(name) || /^(aria|data)-/.test(name);

/** JSX style keys React turns a bare number into pixels for. */
const PX_KEYS =
  /^(?:width|height|(?:min|max)(?:Width|Height)|(?:padding|margin)(?:Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?|gap|rowGap|columnGap|top|right|bottom|left|inset|borderRadius|border(?:Top|Right|Bottom|Left)?Width|borderWidth|fontSize|letterSpacing|outlineWidth|outlineOffset|flexBasis)$/;

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch)\(/;
const SIZE = /(?<![\w.#-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/g;
const FONT_FAMILY = /^font-?family$/i;
const FONT_WEIGHT = /^font-?weight$/i;

/**
 * The lookup tables a check needs, built once from the manifests.
 * @param {{components: {components: object[]}, tokens: {tokens: object[]},
 *   defined?: Set<string>, freeRegular?: Set<string>,
 *   freeIcons?: {solid: Set<string>, brands: Set<string>}|null,
 *   retired?: Map<string, string>, promoted?: Set<string>, exported?: Set<string>}} input
 *
 * `retired` is retired token name -> its replacement (the token plan's
 * `retiredRenames()`); `promoted` holds primitive names a semantic row of the
 * plan uses as its own name (`--radius-full`), which consumer code may read.
 * `exported` is every name the `@/components` barrel makes importable (parts
 * such as `TableRow` and constants included); a name there is never an unknown
 * component, though only a manifest record holds its props. `barrels` holds the
 * same for the other barrels (`@/patterns` → its hooks and constants too).
 */
export function contextFrom({
  components,
  tokens,
  defined = new Set(),
  freeRegular = new Set(),
  freeIcons = null,
  retired = new Map(),
  promoted = new Set(),
  exported = new Set(),
  barrels = {},
}) {
  const byName = new Map(components.components.map((c) => [c.name, c]));
  const tokenByName = new Map(
    tokens.tokens.map((t) => [t.name, promoted.has(t.name) && t.tier === 'primitive' ? { ...t, tier: 'semantic' } : t]),
  );
  const usable = [...tokenByName.values()].filter((t) => t.tier !== 'primitive' && !isLegacy(t));
  // Each usable token's chain of `var(--x)` hops to its literal: what lets a
  // primitive read or a raw literal be answered with the token that holds it,
  // however many tiers sit between.
  const byValue = new Map();
  const byPrimitive = new Map();
  const push = (map, key, name, hops) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ name, hops });
  };
  for (const t of usable) {
    let value = t.value;
    for (let hops = 1; hops <= 8; hops += 1) {
      const ref = String(value).trim().match(/^var\((--[\w-]+)\)$/);
      if (!ref) {
        push(byValue, normalizeValue(value), t.name, hops);
        break;
      }
      const next = tokenByName.get(ref[1]);
      if (next?.tier === 'primitive') push(byPrimitive, ref[1], t.name, hops);
      if (!next) break;
      value = next.value;
    }
  }
  const ranked = (map) =>
    new Map([...map].map(([k, v]) => [k, v.sort((a, b) => a.hops - b.hops || a.name.length - b.name.length).map((x) => x.name)]));
  return {
    components: byName,
    componentNames: [...byName.keys()],
    tokens: tokenByName,
    usableTokenNames: usable.map((t) => t.name),
    tokensByValue: ranked(byValue),
    tokensByPrimitive: ranked(byPrimitive),
    defined,
    freeRegular,
    freeIcons,
    retired,
    exported,
    barrels: { '@/components': exported, ...barrels },
  };
}

const isLegacy = (token) => /^Legacy\b/.test(token.group);
const normalizeValue = (v) => String(v).trim().toLowerCase().replace(/\s+/g, ' ');

/** Levenshtein distance, capped for speed. */
function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = temp;
    }
  }
  return prev[b.length];
}

/** The candidate nearest `name`, when it is near enough to be the one meant; else null. */
export function closest(name, candidates) {
  const limit = Math.max(2, Math.floor(name.length / 3));
  let best = null;
  let bestDistance = Infinity;
  const lower = name.toLowerCase();
  for (const c of candidates) {
    if (Math.abs(c.length - name.length) > limit) continue;
    const d = distance(lower, c.toLowerCase());
    if (d < bestDistance) {
      best = c;
      bestDistance = d;
    }
  }
  return bestDistance <= limit ? best : null;
}

const didYouMean = (name, candidates, otherwise) => {
  const near = closest(name, candidates);
  return near ? `did you mean \`${near}\`?` : otherwise;
};

/**
 * Every escape in one file.
 * @param {{path: string, text: string}} file
 * @param {ReturnType<typeof contextFrom>} ctx
 * @returns {{rule: string, level: 'fail'|'warn', file: string, line: number, col: number, message: string, fix: string}[]}
 */
export function escapesIn({ path, text: raw, page = isPageModule(path) }, ctx) {
  const text = blankComments(raw);
  const found = [];
  const add = (rule, index, message, fix) => {
    const { line, col } = positionAt(text, index);
    found.push({ rule, level: RULES[rule].level, file: path, line, col, message, fix });
  };

  if (SCRIPT.test(path)) {
    scriptEscapes(text, ctx, add);
    iconEscapes(text, ctx, add);
    tokenEscapes(text, ctx, add);
    if (page) pageEscapes(text, add);
  } else if (STYLE.test(path)) {
    styleEscapes(text, ctx, add);
    tokenEscapes(text, ctx, add);
  } else if (MARKUP.test(path)) {
    iconEscapes(text, ctx, add);
    tokenEscapes(text, ctx, add);
  }
  return found.sort((a, b) => a.line - b.line || a.col - b.col);
}

function nameIndex(text, from, name) {
  const re = new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`, 'g');
  re.lastIndex = from;
  const m = re.exec(text);
  return m ? m.index : from;
}

/**
 * What `name` from `barrel` is: its record, `true` for an export with no
 * record, `{wrongBarrel}` for a record another barrel exports, or null.
 */
function resolveFrom(ctx, barrel, name) {
  const record = ctx.components.get(name);
  if (record && (homeOf(record) === barrel || ctx.barrels[barrel]?.has(name))) return record;
  if (ctx.barrels[barrel]?.has(name)) return true;
  return record ? { wrongBarrel: record } : null;
}

function scriptEscapes(text, ctx, add) {
  const bound = new Map(); // local name -> component record
  const namespaces = new Map(); // local name -> barrel

  const unknown = (index, name, barrel, otherwise) => {
    const found = resolveFrom(ctx, barrel, name);
    if (found?.wrongBarrel) {
      add('ds/no-unknown-component', index, `\`${name}\` is not exported from \`${barrel}\``, found.wrongBarrel.import);
    } else {
      add('ds/no-unknown-component', index, `\`${name}\` is not a component the design system exports`, didYouMean(name, ctx.componentNames, otherwise));
    }
  };

  for (const imp of importsOf(text)) {
    if (BARREL.test(imp.source)) {
      const barrel = barrelOf(imp.source);
      if (imp.namespace) namespaces.set(imp.namespace, barrel);
      for (const { imported, local } of imp.named) {
        const found = resolveFrom(ctx, barrel, imported);
        if (found && !found.wrongBarrel) {
          if (found !== true) bound.set(local, found);
          continue;
        }
        unknown(nameIndex(text, imp.index, imported), imported, barrel, 'check design-system/agent-views/components/index.md, or propose a new component');
      }
    } else if (DEEP.test(imp.source)) {
      const names = [imp.default, ...imp.named.map((n) => n.imported)].filter(Boolean);
      const shown = names.length ? names.join(', ') : '…';
      const home = names.map((n) => ctx.components.get(n)).find(Boolean);
      add(
        'ds/no-deep-import',
        imp.index,
        `\`${imp.source}\` reaches past the barrel into design-system source`,
        `import { ${shown} } from '${home ? homeOf(home) : '@/components'}'`,
      );
      for (const { imported, local } of imp.named) {
        const record = ctx.components.get(imported);
        if (record) bound.set(local, record);
      }
      if (imp.default && ctx.components.has(imp.default)) bound.set(imp.default, ctx.components.get(imp.default));
    } else {
      const bs = imp.source.match(BOOTSTRAP);
      if (!bs) continue;
      const names = [...imp.named.map((n) => n.imported), ...(bs[1] && imp.default ? [bs[1]] : [])];
      for (const name of names) {
        if (!ctx.components.has(name)) continue;
        add(
          'ds/prefer-plus-component',
          nameIndex(text, imp.index, name),
          `\`${name}\` comes from react-bootstrap, and the design system has its own`,
          `import { ${name} } from '@/components'`,
        );
      }
    }
  }

  for (const el of jsxElementsOf(text)) {
    let record = bound.get(el.name);
    const dot = el.name.indexOf('.');
    if (!record && dot > 0 && namespaces.has(el.name.slice(0, dot))) {
      const member = el.name.slice(dot + 1);
      const found = resolveFrom(ctx, namespaces.get(el.name.slice(0, dot)), member);
      if (!found || found.wrongBarrel) {
        unknown(el.index + 1, member, namespaces.get(el.name.slice(0, dot)), 'check design-system/agent-views/components/index.md');
        continue;
      }
      if (found !== true) record = found;
    }
    if (!record || !record.props) continue;
    const props = new Map(record.props.map((p) => [p.name, p]));
    for (const attr of el.attributes) {
      const prop = props.get(attr.name);
      if (!prop) {
        if (isUndeclaredProp(attr.name)) continue;
        add(
          'ds/no-unknown-prop',
          attr.index,
          `\`${record.name}\` has no prop \`${attr.name}\``,
          didYouMean(attr.name, [...props.keys()], `see the props in design-system/agent-views/components.json (${record.name})`),
        );
        continue;
      }
      if (prop.deprecated) {
        add(
          'ds/no-retired-name',
          attr.index,
          `\`${record.name}.${attr.name}\` is deprecated`,
          prop.deprecated.replacement ? `use \`${prop.deprecated.replacement}\`` : `see ${record.name}'s docs`,
        );
      }
      const literal = attr.value.kind === 'string' || attr.value.kind === 'number';
      if (prop.values && literal && !prop.values.includes(attr.value.text)) {
        add(
          'ds/no-unknown-prop',
          attr.index,
          `\`${record.name}.${attr.name}\` does not accept "${attr.value.text}"`,
          didYouMean(attr.value.text, prop.values, `one of: ${prop.values.join(', ')}`),
        );
      }
    }
  }

  for (const obj of styleObjectsOf(text)) {
    for (const { key, value, index } of obj.properties) {
      const reason = rawInJsxStyle(key, value);
      if (reason) add('ds/no-raw-literal', index, `\`${key}: ${value}\` is a raw ${reason}`, rawFix(reason, key, literalOf(value).text, ctx));
    }
  }
}

function rawInJsxStyle(key, value) {
  const literal = literalOf(value);
  if (literal.kind === 'string') return rawInCss(key, literal.text);
  if (literal.kind === 'number') {
    if (FONT_WEIGHT.test(key)) return 'font value';
    if (Number(literal.text) !== 0 && PX_KEYS.test(key)) return 'size';
  }
  return null;
}

/** `var(...)` calls replaced by spaces, so a fallback is not read as a literal. */
function withoutVars(value) {
  let out = value;
  for (let i = out.indexOf('var('); i !== -1; i = out.indexOf('var(', i + 1)) {
    const end = closeOf(out, i + 3);
    if (end === -1) break;
    out = out.slice(0, i) + ' '.repeat(end - i) + out.slice(end);
  }
  return out;
}

/** Why a CSS value is a raw literal ('color', 'size', 'font value'), or null. */
function rawInCss(property, value) {
  const bare = withoutVars(value);
  if (FONT_FAMILY.test(property)) return /[A-Za-z]/.test(bare.replace(/\b(?:inherit|initial|unset)\b/g, '')) ? 'font value' : null;
  if (FONT_WEIGHT.test(property)) return /\b(?:[1-9]00|bold|bolder|lighter|normal)\b/.test(bare) ? 'font value' : null;
  if (COLOR.test(bare)) return 'color';
  for (const m of bare.matchAll(SIZE)) if (Number.parseFloat(m[0]) !== 0) return 'size';
  return null;
}

/**
 * The tokens that hold a value, nearest first. The match is by value, not by
 * role, so the reader picks: a 32px gap and a 32px image both resolve here.
 */
const holding = (names) =>
  names.length === 1
    ? `use var(${names[0]})`
    : `tokens that hold this value: ${names.slice(0, 3).join(', ')}; use the one named for this role`;

/**
 * Words a token name carries for the role a CSS property plays, so a value
 * match prefers a padding token for `padding` over an icon size that happens
 * to share the value.
 */
const ROLE_WORDS = [
  [/^(?:padding|pad)/i, /pad/],
  [/^(?:gap|row-?gap|column-?gap|margin)/i, /stack|inline|gap|space/],
  [/radius/i, /radius/],
  [/^(?:width|height|min|max|inset|top|right|bottom|left|flex-?basis)/i, /size|width|height/],
  [/^font|^letter/i, /font|type|text|letter/],
  [/border|outline|stroke/i, /border|stroke|focus/],
  [/color|background|fill|shadow/i, /^--ds-/],
];

function rawFix(reason, property, literal, ctx) {
  const exact = ctx.tokensByValue.get(normalizeValue(literal));
  if (exact) {
    const words = ROLE_WORDS.find(([prop]) => prop.test(property))?.[1];
    const fitting = words ? exact.filter((name) => words.test(name)) : [];
    return holding(fitting.length ? fitting : exact);
  }
  if (reason === 'color') return 'use a --ds-* color token (design-system/agent-views/tokens/tokens.md)';
  if (reason === 'size') return 'use a spacing or size token (design-system/agent-views/tokens/tokens.md)';
  return 'use a typography token (design-system/agent-views/tokens/tokens.md)';
}

/** At-rule preludes (`@media (...)`, `@include x(...)`) blanked: their values are not declarations. */
const blankAtRules = (text) => text.replace(/@[a-z-]+[^{;]*/g, (m) => m.replace(/[^\n]/g, ' '));

const DECLARATION = /(^|[;{\s])(\$[\w-]+|--[\w-]+|[a-z][a-z-]*)\s*:\s*([^;{}]+?)\s*(?=;|}|$)/gm;

function styleEscapes(text, ctx, add) {
  const body = blankAtRules(text);
  for (const m of body.matchAll(DECLARATION)) {
    const [, lead, property, value] = m;
    const reason = rawInCss(property, value);
    if (!reason) continue;
    add('ds/no-raw-literal', m.index + lead.length, `\`${property}: ${value.trim()}\` is a raw ${reason}`, rawFix(reason, property, value, ctx));
  }
}

function tokenEscapes(text, ctx, add) {
  for (const m of text.matchAll(varReferencePattern())) {
    const name = m[1];
    if (isInterpolated(name) || EXTERNAL.has(name)) continue;
    const index = m.index + m[0].indexOf(name);
    const token = ctx.tokens.get(name);
    const replacement = ctx.retired.get(name);
    if (replacement) {
      // Still declared somewhere, it renders and only speaks the old name; declared
      // nowhere, it renders nothing, which is an unknown token.
      const live = Boolean(token) || ctx.defined.has(name);
      add(
        live ? 'ds/no-retired-name' : 'ds/no-unknown-token',
        index,
        live ? `\`${name}\` is a retired token name` : `\`${name}\` was retired and is no longer a token`,
        `use var(${replacement})`,
      );
    } else if (token?.tier === 'primitive') {
      const tiers = ctx.tokensByPrimitive.get(name) ?? [];
      add(
        'ds/no-primitive-read',
        index,
        `\`${name}\` is a primitive; consumer code reads a semantic, pattern or component token`,
        tiers.length ? holding(tiers) : 'read the semantic token that holds this value (design-system/agent-views/tokens/tokens.md)',
      );
    } else if (token && isLegacy(token)) {
      add('ds/no-retired-name', index, `\`${name}\` is a legacy token`, 'use the --ds-* token for the same role (design-system/agent-views/tokens/tokens.md)');
    } else if (!token && !ctx.defined.has(name)) {
      add(
        'ds/no-unknown-token',
        index,
        `\`${name}\` is not a token`,
        didYouMean(name, ctx.usableTokenNames, 'pick a token from design-system/agent-views/tokens/tokens.md'),
      );
    }
  }
}

const PRO_FAMILY = /\bfa-(?:sharp-duotone|sharp|duotone|light|thin)\b|\bfa[ltd]\b(?=[\s'"`])/g;
const MODIFIER = /^(?:solid|regular|brands|fw|xs|sm|lg|xl|2xs|2xl|\d{1,2}x|spin|spin-pulse|spin-reverse|pulse|beat|beat-fade|fade|bounce|flip|shake|inverse|border|li|ul|stack|stack-1x|stack-2x|pull-(?:left|right|start|end)|rotate-(?:90|180|270|by)|flip-(?:horizontal|vertical|both)|width-auto)$/;

function iconEscapes(text, ctx, add) {
  for (const m of text.matchAll(PRO_FAMILY)) {
    add('ds/fa-free-only', m.index, `\`${m[0]}\` is a Font Awesome Pro family, not licensed here`, 'use fa-solid, fa-regular or fa-brands');
  }
  // A class string: the run of icon classes around a family name.
  for (const m of text.matchAll(/\bfa-(regular|solid|brands)\b/g)) {
    const family = m[1];
    const known = family === 'regular' ? ctx.freeRegular : ctx.freeIcons?.[family];
    if (!known || known.size === 0) continue;
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    const lineEnd = text.indexOf('\n', m.index);
    const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    const at = m.index - lineStart;
    const open = Math.max(line.lastIndexOf('"', at), line.lastIndexOf("'", at), line.lastIndexOf('`', at));
    const closeAt = [line.indexOf('"', at), line.indexOf("'", at), line.indexOf('`', at)].filter((x) => x !== -1);
    const segment = line.slice(open + 1, closeAt.length ? Math.min(...closeAt) : undefined);
    for (const icon of segment.matchAll(/\bfa-([a-z0-9-]+)\b/g)) {
      if (MODIFIER.test(icon[1]) || /^(?:sharp|duotone|light|thin)/.test(icon[1])) continue;
      if (!known.has(icon[1])) {
        add(
          'ds/fa-free-only',
          lineStart + open + 1 + icon.index,
          `\`fa-${family} fa-${icon[1]}\` is not in Font Awesome Free`,
          didYouMean(icon[1], [...known], family === 'regular' ? 'use fa-solid for this icon' : 'pick an icon Font Awesome Free ships'),
        );
      }
    }
  }
}

/**
 * A page-level module, by its path alone: an app entry (`src/App.jsx`), a
 * module directly in a `pages/` folder or a page folder's own module
 * (`pages/Home/Home.jsx`), or a module named for a page (`SessionsPage.jsx`).
 * `pagesOf` adds the module an app entry renders as its root.
 */
const PAGE_MODULE = /(?:^|\/)src\/App\.[jt]sx$|(?:^|\/)pages\/[^/]+\.[jt]sx$|(?:^|\/)pages\/([^/]+)\/\1\.[jt]sx$|Page\.[jt]sx$/;
export const isPageModule = (path) => PAGE_MODULE.test(path) && !/\.(?:test|spec|stories)\.[jt]sx$/.test(path);

/** The containers a page may not hand-style as its outer element. */
const SHELL_TAGS = new Set(['div', 'main', 'section']);
const LAYOUT_KEYS = /\b(?:display|grid\w*|flex\w*|gap|rowGap|columnGap|(?:padding|margin)\w*|(?:min|max)?(?:Width|Height)|width|height|alignItems|justifyContent|placeItems)\s*:/;

/**
 * The body of the module's default-exported component, as an offset range:
 * `export default function X() {…}`, `export default () => …`, or
 * `export default X` naming a function or an arrow. An arrow with an expression body is its own range. Null when
 * the module exports no component this can read.
 */
function defaultComponentOf(text) {
  const direct = /\bexport\s+default\s+(?:function\s*[\w$]*\s*)?\(/.exec(text);
  let at = direct ? direct.index + direct[0].length - 1 : -1;
  if (at === -1) {
    const named = /\bexport\s+default\s+([A-Z][\w$]*)\s*;?\s*$/m.exec(text);
    if (!named) return null;
    const name = named[1];
    const decl =
      new RegExp(`\\bfunction\\s+${name}\\s*\\(`).exec(text) ??
      new RegExp(`\\b(?:const|let)\\s+${name}\\s*(?::[^=]+)?=\\s*(?:async\\s*)?(?:\\(|[\\w$]+\\s*=>)`).exec(text);
    if (!decl) return null;
    at = decl.index + decl[0].length - 1;
  }
  let arrow = text.slice(at - 1, at + 1) === '=>'; // `name => …`
  if (arrow) at += 1;
  else {
    const end = closeOf(text, at);
    if (end === -1) return null;
    const head = /^(?:\s*:[^={]+)?\s*(=>)?/.exec(text.slice(end));
    arrow = Boolean(head[1]);
    at = end + head[0].length;
  }
  const start = at + /^\s*/.exec(text.slice(at))[0].length;
  if (text[start] !== '{') return arrow ? { start, end: text.length, expression: true } : null;
  // A top-level component closes at the first `}` that starts a line.
  const close = text.indexOf('\n}', start);
  return { start: start + 1, end: close === -1 ? text.length : close, expression: false };
}

/** Offset of the JSX a `return` (or an arrow's expression body) at `from` renders, else -1. */
function jsxAt(text, from) {
  const m = /^\s*\(?\s*</.exec(text.slice(from));
  return m ? from + m[0].length - 1 : -1;
}

/**
 * The element a page renders outermost: the JSX of its component's last
 * return at the shallowest indent, a fragment or a `*Provider` stepped
 * through to its first child. Null when there is none to read.
 */
export function pageRootOf(text) {
  const body = defaultComponentOf(text);
  if (!body) return null;
  let at = -1;
  if (body.expression) at = jsxAt(text, body.start);
  else {
    // Returns nested in callbacks or blocks sit deeper; of the shallowest, the last renders.
    let indent = Infinity;
    const returns = /^([ \t]*)return\b/gm;
    returns.lastIndex = body.start;
    for (let m = returns.exec(text); m && m.index < body.end; m = returns.exec(text)) {
      if (m[1].length > indent) continue;
      indent = m[1].length;
      at = jsxAt(text, m.index + m[0].length);
    }
  }
  if (at === -1) return null;
  const jsx = text.slice(at, body.end);
  for (const el of jsxElementsOf(jsx)) {
    // Only a child written directly inside the wrapper is outermost; one behind `{cond && …}` is not.
    if (el.index > 0 && !jsx.slice(0, el.index).trimEnd().endsWith('>')) return null;
    if (!/Provider$/.test(el.name)) return { ...el, index: el.index + at };
  }
  return null;
}

/** A relative import's candidate paths, from the importing module's path. */
function candidatesOf(from, source) {
  const parts = from.split('/').slice(0, -1);
  for (const seg of source.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  const ext = ['.jsx', '.tsx', '.js', '.ts'];
  return [base, ...ext.map((e) => base + e), ...ext.map((e) => `${base}/index${e}`)];
}

/**
 * The page-level modules among `files`: those `isPageModule` names, and the
 * local module each app entry renders as its root (`<Reviews />` from
 * `./Reviews`), one hop. Pure, like the rules.
 * @param {{path: string, text: string}[]} files
 */
export function pagesOf(files) {
  const known = new Set(files.map((f) => f.path));
  const pages = new Set(files.filter((f) => isPageModule(f.path)).map((f) => f.path));
  for (const file of files) {
    if (!/(?:^|\/)src\/App\.[jt]sx$/.test(file.path)) continue;
    const text = blankComments(file.text);
    const root = pageRootOf(text);
    if (!root || !/^[A-Z]/.test(root.name)) continue;
    const imp = importsOf(text).find(
      (i) => i.source.startsWith('.') && (i.default === root.name || i.named.some((n) => n.local === root.name)),
    );
    const target = imp && candidatesOf(file.path, imp.source).find((c) => known.has(c));
    if (target) pages.add(target);
  }
  return pages;
}

function pageEscapes(text, add) {
  const root = pageRootOf(text);
  if (!root || !SHELL_TAGS.has(root.name)) return;
  const className = root.attributes.find((a) => a.name === 'className');
  const style = root.attributes.find((a) => a.name === 'style');
  const laidOut = style && (style.value.kind !== 'expression' || !/^\{/.test(style.value.text) || LAYOUT_KEYS.test(style.value.text));
  if (!className && !laidOut) return;
  add(
    'ds/page-starts-from-pattern',
    root.index,
    `the page's outer element is a hand-styled \`<${root.name}>\`, not \`PageLayout\` or a pattern`,
    "wrap the page in `PageLayout` (import { PageLayout } from '@/patterns'), or start it from a pattern such as `Page` or `PatternCard` (@/patterns)",
  );
}
