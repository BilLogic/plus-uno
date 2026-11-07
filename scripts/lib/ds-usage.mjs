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
import { blankComments, closeOf, importsOf, jsxElementsOf, positionAt, styleObjectsOf } from './jsx-scan.mjs';

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
};

/** The rule's section in the rules doc, as a link a terminal can open. */
export const docLink = (rule) => `${RULES_DOC}#${rule.replace('/', '')}`;

const SCRIPT = /\.(jsx|js|mjs|cjs|tsx|ts)$/;
const STYLE = /\.(scss|css)$/;
const MARKUP = /\.html$/;

/** Specifiers that are the public barrel. */
const BARREL = /^(?:@|@plus-ds)\/components\/?$/;
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
 *   retired?: Map<string, string>, promoted?: Set<string>}} input
 *
 * `retired` is retired token name -> its replacement (the token plan's
 * `retiredRenames()`); `promoted` holds primitive names a semantic row of the
 * plan uses as its own name (`--radius-full`), which consumer code may read.
 */
export function contextFrom({
  components,
  tokens,
  defined = new Set(),
  freeRegular = new Set(),
  freeIcons = null,
  retired = new Map(),
  promoted = new Set(),
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
export function escapesIn({ path, text: raw }, ctx) {
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

function scriptEscapes(text, ctx, add) {
  const bound = new Map(); // local name -> component record
  const namespaces = new Set();

  for (const imp of importsOf(text)) {
    if (BARREL.test(imp.source)) {
      if (imp.namespace) namespaces.add(imp.namespace);
      for (const { imported, local } of imp.named) {
        const record = ctx.components.get(imported);
        if (record) bound.set(local, record);
        else {
          add(
            'ds/no-unknown-component',
            nameIndex(text, imp.index, imported),
            `\`${imported}\` is not a component the design system exports`,
            didYouMean(imported, ctx.componentNames, 'check design-system/agent-views/components/index.md, or propose a new component'),
          );
        }
      }
    } else if (DEEP.test(imp.source)) {
      const names = [imp.default, ...imp.named.map((n) => n.imported)].filter(Boolean);
      const shown = names.length ? names.join(', ') : '…';
      add(
        'ds/no-deep-import',
        imp.index,
        `\`${imp.source}\` reaches past the barrel into design-system source`,
        `import { ${shown} } from '@/components'`,
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
      record = ctx.components.get(member);
      if (!record) {
        add(
          'ds/no-unknown-component',
          el.index + 1,
          `\`${member}\` is not a component the design system exports`,
          didYouMean(member, ctx.componentNames, 'check design-system/agent-views/components/index.md'),
        );
        continue;
      }
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
      if (reason) add('ds/no-raw-literal', index, `\`${key}: ${value}\` is a raw ${reason}`, rawFix(reason, literalText(value), ctx));
    }
  }
}

/** The text of a JS string literal, else the value as written. */
const literalText = (value) => {
  const m = value.match(/^(['"`])([\s\S]*)\1$/);
  return m ? m[2] : value;
};

function rawInJsxStyle(key, value) {
  const str = value.match(/^(['"`])([\s\S]*)\1$/);
  if (str) {
    if (str[1] === '`' && str[2].includes('${')) return null;
    return rawInCss(key, str[2]);
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    if (FONT_WEIGHT.test(key)) return 'font value';
    if (Number(value) !== 0 && PX_KEYS.test(key)) return 'size';
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

function rawFix(reason, literal, ctx) {
  const exact = ctx.tokensByValue.get(normalizeValue(literal));
  if (exact) return holding(exact);
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
    add('ds/no-raw-literal', m.index + lead.length, `\`${property}: ${value.trim()}\` is a raw ${reason}`, rawFix(reason, value, ctx));
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
