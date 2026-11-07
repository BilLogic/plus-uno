/**
 * Read the component names a barrel actually exports.
 *
 * This is the input to the components existence index, which AGENTS.md hard
 * rule 1 treats as law: "A component absent from the index does not exist."
 * The converse has to hold too — a name the index lists has to be importable —
 * so what counts here is the export the module system sees, not the text of
 * the file. A commented-out export line is not an export: it names a component
 * nothing can import, and listing it sends agents to write `import { X }` that
 * resolves to `undefined`.
 */

import fs from 'fs';
import path from 'path';

/** Resolve an import specifier (`@/components/x`, `./x`) to a barrel file. */
export function resolveBarrel(spec, fromFile, repoRoot) {
  const base = spec.startsWith('@/')
    ? path.join(repoRoot, 'design-system/src', spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec);
  for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/**
 * Drop comments before any export is matched, leaving strings alone.
 *
 * The barrels carry a running commentary — why `BadgeVariants` is a second
 * export through the deprecation period, why `constants.js` stays private —
 * and some of that commentary is a disabled export line kept for the record.
 * Matching export syntax against raw text cannot tell the two apart.
 *
 * The scan tracks quotes rather than running a regex over the whole file,
 * because a specifier may legally contain `//` — `https://…` in a bare URL
 * import, or any specifier a future bundler resolves. Truncating such a line
 * at the `//` would erase its export from the existence law without a word,
 * which is the failure this reader exists to prevent, pointed the other way.
 */
export function stripComments(source) {
  let out = '';
  let quote = null; // the delimiter of the string being scanned, or null

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += source[i + 1] ?? '';
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      continue;
    }

    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      out += '\n';
      continue;
    }

    if (ch === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2);
      i = close === -1 ? source.length : close + 1;
      continue;
    }

    out += ch;
  }

  return out;
}

/**
 * Every component name a barrel exports, following `export * from` one barrel
 * at a time.
 *
 * The star form is not cosmetic: `components/index.js` re-exports the whole
 * `forms-and-inputs` group that way, so a named-export-only regex silently
 * dropped DatePicker and InputGroup — real, documented, exported components —
 * from an index whose own header says "If it's not listed, it DOES NOT EXIST."
 * A generator that quietly under-reports is worse than one that fails.
 *
 * `boundary` bounds how far `export *` is followed: a starred barrel outside it
 * belongs to a different section of the IA and is left to that section.
 */
export function extractExports(indexPath, { repoRoot, boundary, onUnresolved, seen = new Set() } = {}) {
  if (!fs.existsSync(indexPath) || seen.has(indexPath)) return [];
  seen.add(indexPath);
  const content = stripComments(fs.readFileSync(indexPath, 'utf8'));
  const names = [];

  // One brace pair at a time, then every `as` alias inside it. The list is not
  // always a lone `default as X`: a component exported beside its constants
  // (`default as AiIcon, AI_ICON_NAMES`) or its parts (`default as Panel,
  // PanelBody`) has the alias first, and a matcher that wanted `as X` to be
  // the last specifier dropped forty components, Button among them, from the
  // existence law. `[^}]` rather than `.` keeps a reformatted multi-line list
  // inside its own pair.
  const named = /export\s+\{([^}]*)\}/g;
  let m;
  while ((m = named.exec(content)) !== null) {
    for (const alias of m[1].matchAll(/\bas\s+([a-zA-Z0-9_$]+)/g)) names.push(alias[1]);
  }

  const root = boundary && path.dirname(indexPath).startsWith(boundary) ? boundary : path.dirname(indexPath);
  const star = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = star.exec(content)) !== null) {
    const barrel = resolveBarrel(m[1], indexPath, repoRoot);
    if (!barrel) {
      onUnresolved?.(m[1], indexPath);
      continue;
    }
    if (!barrel.startsWith(root)) continue; // e.g. @/dataviz — a different section
    names.push(...extractExports(barrel, { repoRoot, boundary, onUnresolved, seen }));
  }

  return [...new Set(names)].sort();
}

/**
 * Every name a barrel makes importable: each specifier of `export { … }`
 * (constants and parts such as `TableRow` included, not only the `as`
 * components the existence index lists), each `export const|function|class`,
 * and everything an `export *` brings in, across sections (`@/dataviz` too).
 *
 * `extractExports` answers "which components exist"; this answers "can this
 * name be imported from the barrel", which is what a usage checker holds an
 * import to.
 *
 * @param {string} indexPath
 * @param {{repoRoot: string, seen?: Set<string>}} opts
 * @returns {string[]}
 */
export function publicNames(indexPath, { repoRoot, seen = new Set() } = {}) {
  if (!fs.existsSync(indexPath) || seen.has(indexPath)) return [];
  seen.add(indexPath);
  const content = stripComments(fs.readFileSync(indexPath, 'utf8'));
  const names = [];
  for (const m of content.matchAll(/export\s+\{([^}]*)\}/g)) {
    for (const raw of m[1].split(',')) {
      const spec = raw.trim().replace(/^type\s+/, '');
      if (!spec) continue;
      const parts = spec.split(/\s+as\s+/);
      const name = (parts[1] ?? parts[0]).trim();
      if (name !== 'default') names.push(name);
    }
  }
  for (const m of content.matchAll(/export\s+(?:const|let|var|function\*?|class|async\s+function)\s+([A-Za-z_$][\w$]*)/g)) names.push(m[1]);
  for (const m of content.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const barrel = resolveBarrel(m[1], indexPath, repoRoot);
    if (barrel) names.push(...publicNames(barrel, { repoRoot, seen }));
  }
  return [...new Set(names)].sort();
}
