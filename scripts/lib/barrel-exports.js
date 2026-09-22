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
 * Drop comments before any export is matched.
 *
 * The barrels carry a running commentary — why `BadgeVariants` is a second
 * export through the deprecation period, why `constants.js` stays private —
 * and some of that commentary is a disabled export line kept for the record.
 * Matching export syntax against raw text cannot tell the two apart. No
 * specifier in these barrels contains `//`, so stripping is safe here.
 */
export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
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

  const named = /export\s+\{.*as\s+([a-zA-Z0-9]+)\s*\}/g;
  let m;
  while ((m = named.exec(content)) !== null) names.push(m[1]);

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
