/**
 * The values a `PropTypes.oneOf(NAME)` accepts when NAME is not written in the
 * component's own file.
 *
 * Most enum props name a constant (`oneOf(AVATAR_SIZES)`), and the constant is
 * often imported (`from '../Avatar'`), re-exported through an index, built
 * from spreads (`[...SMART_CHARACTERS, ...MATH_CHARACTERS]`) or read as
 * `Object.keys(SKELETON_RADII)`. A manifest that stops at the first hop says
 * "unknown" for exactly the props a checker most needs to hold to a list.
 *
 * Reads source text only: no module is executed. Anything it cannot read
 * (a computed value, a call, a non-literal element) makes the answer `null`,
 * never a partial list, because a partial list would reject valid values.
 */

import path from 'path';

const MAX_HOPS = 6;
const IDENT = '[A-Za-z_$][\\w$]*';

/**
 * @param {string} expr      the prop's type expression, e.g. `PropTypes.oneOf(AVATAR_SIZES)`
 * @param {string} file      absolute path of the file the expression is in
 * @param {(file: string) => string|null} read   source text, or null when the file does not exist
 * @param {{alias: Record<string,string>}} opts  import aliases, e.g. `{ '@': '/repo/design-system/src' }`
 * @returns {string[]|null}
 */
export function enumValuesOf(expr, file, read, opts) {
  const keys = expr.match(new RegExp(`^PropTypes\\.oneOf\\(\\s*Object\\.keys\\(\\s*(${IDENT})\\s*\\)\\s*\\)`));
  if (keys) return lookup(keys[1], file, read, opts, 'keys', 0);
  const named = expr.match(new RegExp(`^PropTypes\\.oneOf\\(\\s*(${IDENT})\\s*\\)`));
  if (named) return lookup(named[1], file, read, opts, 'array', 0);
  return null;
}

function lookup(name, file, read, opts, kind, hops) {
  if (hops > MAX_HOPS) return null;
  const source = read(file);
  if (source === null) return null;

  const decl = declaration(source, name, kind === 'keys' ? '{' : '[');
  if (decl !== null) {
    return kind === 'keys' ? objectKeys(decl) : arrayValues(decl, file, read, opts, hops);
  }

  // Not declared here: follow an import of it, or a re-export.
  // `import { A }` and `import Default, { A }` both bring A in.
  const imported = new RegExp(`import\\s+(?:${IDENT}\\s*,\\s*)?\\{([^}]*)\\}\\s*from\\s*['"]([^'"]+)['"]`, 'g');
  let m;
  while ((m = imported.exec(source)) !== null) {
    const exported = specifiers(m[1]).get(name);
    if (exported) {
      const target = resolveModule(m[2], file, read, opts);
      return target ? lookup(exported, target, read, opts, kind, hops + 1) : null;
    }
  }
  const reexported = new RegExp(`export\\s*\\{([^}]*)\\}\\s*from\\s*['"]([^'"]+)['"]`, 'g');
  while ((m = reexported.exec(source)) !== null) {
    // `export { A as B } from` exports B; the other module declares A.
    const original = specifiers(m[1]).get(name);
    if (original) {
      const target = resolveModule(m[2], file, read, opts);
      return target ? lookup(original, target, read, opts, kind, hops + 1) : null;
    }
  }
  const star = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = star.exec(source)) !== null) {
    const target = resolveModule(m[1], file, read, opts);
    if (!target) continue;
    const found = lookup(name, target, read, opts, kind, hops + 1);
    if (found) return found;
  }
  return null;
}

/**
 * A `{ a, b as c }` specifier list as right-hand name → left-hand name: for an
 * import, the local name → the name the other module exports; for a
 * re-export, the name this module exports → the name the other module declares.
 */
function specifiers(list) {
  const map = new Map();
  for (const raw of list.split(',')) {
    const s = raw.trim();
    if (!s) continue;
    const [left, right] = s.split(/\s+as\s+/).map((x) => x.trim());
    map.set(right ?? left, left);
  }
  return map;
}

/** The bracketed body of `const NAME = [ ... ]` (or `{ ... }`), or null. */
function declaration(source, name, open) {
  const escaped = name.replace(/\$/g, '\\$');
  const at = new RegExp(`(?:export\\s+)?const\\s+${escaped}\\s*=\\s*\\${open}`).exec(source);
  if (!at) return null;
  const start = at.index + at[0].length - 1;
  const close = { '[': ']', '{': '}' }[open];
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start + 1, i);
    }
  }
  return null;
}

/** Split at depth-0 commas, comments removed. */
function topLevel(body) {
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const parts = [];
  let depth = 0;
  let quote = null;
  let buf = '';
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quote) {
      buf += ch;
      if (ch === '\\') { buf += clean[i + 1] ?? ''; i += 1; }
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    if ('([{'.includes(ch)) depth += 1;
    if (')]}'.includes(ch)) depth -= 1;
    if (ch === ',' && depth === 0) { parts.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.filter(Boolean);
}

function arrayValues(body, file, read, opts, hops) {
  const out = [];
  for (const el of topLevel(body)) {
    const str = el.match(/^(['"])((?:(?!\1)[^\\])*)\1$/);
    if (str) { out.push(str[2]); continue; }
    if (/^-?\d+(?:\.\d+)?$/.test(el)) { out.push(el); continue; }
    const spreadKeys = el.match(new RegExp(`^\\.\\.\\.Object\\.keys\\(\\s*(${IDENT})\\s*\\)$`));
    if (spreadKeys) {
      const inner = lookup(spreadKeys[1], file, read, opts, 'keys', hops + 1);
      if (!inner) return null;
      out.push(...inner);
      continue;
    }
    const spread = el.match(new RegExp(`^\\.\\.\\.(${IDENT})$`));
    if (spread) {
      const inner = lookup(spread[1], file, read, opts, 'array', hops + 1);
      if (!inner) return null;
      out.push(...inner);
      continue;
    }
    return null;
  }
  return out.length ? [...new Set(out)] : null;
}

function objectKeys(body) {
  const keys = [];
  for (const entry of topLevel(body)) {
    const m = entry.match(new RegExp(`^(?:(['"])([^'"]+)\\1|(${IDENT}))\\s*:`));
    if (!m) return null;
    keys.push(m[2] ?? m[3]);
  }
  return keys.length ? keys : null;
}

function resolveModule(spec, fromFile, read, opts) {
  let base = null;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else {
    for (const [prefix, target] of Object.entries(opts.alias || {})) {
      if (spec === prefix || spec.startsWith(`${prefix}/`)) {
        base = path.join(target, spec.slice(prefix.length));
        break;
      }
    }
  }
  if (!base) return null; // a package import: not ours to read
  for (const candidate of [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, path.join(base, 'index.js'), path.join(base, 'index.jsx')]) {
    if (read(candidate) !== null) return candidate;
  }
  return null;
}
