/**
 * A small reader for the parts of a JSX file `check:ds-usage` holds to the
 * design system: import statements, JSX opening tags with their attributes,
 * and `style={{ ... }}` objects.
 *
 * WHY NOT A PARSER. No JavaScript parser is a declared dependency of this repo
 * (TypeScript 7 ships no JS API), and adding one is the user's call. The
 * checker needs four shapes, not a syntax tree, so this reads those four and
 * rejects anything that does not fit them: a `<` only becomes a tag when the
 * text after it parses as a tag, which is what keeps `a < b && c > d` and
 * `useState<Item>()` out.
 *
 * Every result carries `index`, an offset into the text it was given;
 * `positionAt` turns one into a line and column. Pass text through
 * `blankComments` first: it keeps every offset, so positions stay true.
 */

import { stripComments } from '../undefined-tokens.mjs';

/** Comments replaced by spaces, every offset and line kept. */
export const blankComments = stripComments;

/** 1-based line and column of an offset. */
export function positionAt(text, index) {
  let line = 1;
  let start = 0;
  for (let i = text.indexOf('\n'); i !== -1 && i < index; i = text.indexOf('\n', i + 1)) {
    line += 1;
    start = i + 1;
  }
  return { line, col: index - start + 1 };
}

const IMPORT = /\bimport\s+(?:([^;'"]*?)\s+from\s+)?(['"])([^'"\n]+)\2/g;

/**
 * Every import statement.
 * @returns {{source: string, index: number, default: string|null, namespace: string|null,
 *   named: {imported: string, local: string}[]}[]}
 */
export function importsOf(text) {
  const out = [];
  for (const m of text.matchAll(IMPORT)) {
    const clause = (m[1] ?? '').trim();
    const record = { source: m[3], index: m.index, default: null, namespace: null, named: [] };
    const braces = clause.match(/\{([\s\S]*)\}/);
    if (braces) {
      for (const raw of braces[1].split(',')) {
        const s = raw.trim().replace(/^type\s+/, '');
        if (!s) continue;
        const [imported, local] = s.split(/\s+as\s+/).map((x) => x.trim());
        record.named.push({ imported, local: local ?? imported });
      }
    }
    const rest = clause.replace(/\{[\s\S]*\}/, '').split(',').map((x) => x.trim()).filter(Boolean);
    for (const part of rest) {
      const ns = part.match(/^\*\s+as\s+([\w$]+)$/);
      if (ns) record.namespace = ns[1];
      else if (/^[\w$]+$/.test(part)) record.default = part;
    }
    out.push(record);
  }
  return out;
}

/**
 * The offset just past the bracket that closes the one at `start`, skipping
 * strings and template literals; -1 if it never closes.
 */
export function closeOf(text, start) {
  const open = text[start];
  const close = { '{': '}', '(': ')', '[': ']' }[open];
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const end = endOfString(text, i);
      if (end === -1) return -1;
      i = end - 1;
    } else if (ch === '`') {
      const end = endOfTemplate(text, i);
      if (end === -1) return -1;
      i = end - 1;
    } else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function endOfString(text, start) {
  const quote = text[start];
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === '\\') i += 1;
    else if (text[i] === quote) return i + 1;
    else if (text[i] === '\n') return -1;
  }
  return -1;
}

function endOfTemplate(text, start) {
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === '\\') i += 1;
    else if (text[i] === '`') return i + 1;
    else if (text[i] === '$' && text[i + 1] === '{') {
      const end = closeOf(text, i + 1);
      if (end === -1) return -1;
      i = end - 1;
    }
  }
  return -1;
}

const TAG_START = /<([A-Za-z_$][\w$]*(?:\.[\w$]+)*)/g;
const ATTR_NAME = /[A-Za-z_$][\w$:.-]*/y;
const NUMBER = /^-?\d+(?:\.\d+)?$/;

/** A literal written inside `{...}`: `'x'`, `"x"`, a template with no `${}`, or a number. */
export function literalOf(inner) {
  const s = inner.trim();
  const str = s.match(/^(['"`])((?:(?!\1)[^\\]|\\.)*)\1$/);
  if (str && !(str[1] === '`' && str[2].includes('${'))) return { kind: 'string', text: str[2] };
  if (NUMBER.test(s)) return { kind: 'number', text: s };
  return { kind: 'expression', text: s };
}

/**
 * Every JSX opening tag, lowercase and capitalized.
 * @returns {{name: string, index: number, spread: boolean,
 *   attributes: {name: string, index: number, value: {kind: 'string'|'number'|'expression'|'bare', text?: string}}[]}[]}
 */
export function jsxElementsOf(text) {
  const out = [];
  for (const m of text.matchAll(TAG_START)) {
    const before = text[m.index - 1];
    if (before && /[\w$)\].]/.test(before)) continue; // `a<B`, `useState<T>`, `x)<y`
    const el = tagAt(text, m.index, m[1]);
    if (el) out.push(el);
  }
  return out;
}

function tagAt(text, index, name) {
  const el = { name, index, spread: false, attributes: [] };
  let i = index + 1 + name.length;
  for (;;) {
    while (/\s/.test(text[i] ?? '')) i += 1;
    if (text[i] === '>' || (text[i] === '/' && text[i + 1] === '>')) return el;
    if (text[i] === '{') {
      if (!/^\{\s*\.\.\./.test(text.slice(i, i + 8))) return null;
      const end = closeOf(text, i);
      if (end === -1) return null;
      el.spread = true;
      i = end;
      continue;
    }
    ATTR_NAME.lastIndex = i;
    const n = ATTR_NAME.exec(text);
    if (!n) return null;
    const attr = { name: n[0], index: i, value: { kind: 'bare' } };
    i += n[0].length;
    let j = i;
    while (/\s/.test(text[j] ?? '')) j += 1;
    if (text[j] === '=') {
      j += 1;
      while (/\s/.test(text[j] ?? '')) j += 1;
      if (text[j] === '"' || text[j] === "'") {
        const end = text.indexOf(text[j], j + 1);
        if (end === -1) return null;
        attr.value = { kind: 'string', text: text.slice(j + 1, end) };
        i = end + 1;
      } else if (text[j] === '{') {
        const end = closeOf(text, j);
        if (end === -1) return null;
        attr.value = literalOf(text.slice(j + 1, end - 1));
        i = end;
      } else return null;
    } else if (j === i && !/[\s/>]/.test(text[i] ?? '')) return null;
    el.attributes.push(attr);
  }
}

/** Split at depth-0 commas, keeping each part's offset. */
function topLevelParts(text, base) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if ('{(['.includes(ch)) {
      const end = closeOf(text, i);
      if (end === -1) break;
      i = end - 1;
    } else if (ch === '"' || ch === "'") {
      const end = endOfString(text, i);
      if (end === -1) break;
      i = end - 1;
    } else if (ch === '`') {
      const end = endOfTemplate(text, i);
      if (end === -1) break;
      i = end - 1;
    } else if (ch === ',') {
      parts.push({ text: text.slice(start, i), index: base + start });
      start = i + 1;
    }
  }
  parts.push({ text: text.slice(start), index: base + start });
  return parts;
}

/**
 * Every `style={{ ... }}` object literal and its top-level properties.
 * @returns {{index: number, properties: {key: string, value: string, index: number}[]}[]}
 */
export function styleObjectsOf(text) {
  const out = [];
  for (const m of text.matchAll(/\bstyle\s*=\s*\{\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const end = closeOf(text, open);
    if (end === -1) continue;
    const body = text.slice(open + 1, end - 1);
    const properties = [];
    for (const part of topLevelParts(body, open + 1)) {
      const kv = part.text.match(/^(\s*)(?:(['"])([^'"]+)\2|([\w$]+))\s*:\s*([\s\S]*?)\s*$/);
      if (!kv) continue;
      properties.push({ key: kv[3] ?? kv[4], value: kv[5], index: part.index + kv[1].length });
    }
    out.push({ index: m.index, properties });
  }
  return out;
}
