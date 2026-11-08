/**
 * The committed Font Awesome Free name lists, read as text. `design-system/` is
 * not an ES-module package, so importing the generated files from Node warns
 * on every run; every Node reader parses them here instead: the generator's
 * drift check, the design-system lookup and `check:ds-usage`.
 *
 *   ICON_LISTS              the two generated files, repo-relative
 *   parseSet(text, name)    the names inside `export const <name> = new Set([...])`
 *   readIconLists(root)     {regular, solid, brands}, empty sets for a missing file
 */
import fs from 'node:fs';
import path from 'node:path';

export const ICON_LISTS = Object.freeze({
  regular: 'design-system/src/lib/icon-regular.generated.js',
  free: 'design-system/src/lib/icon-free.generated.js',
});

/** The names inside `export const <exportName> = new Set([...])`. */
export function parseSet(text, exportName) {
  const block = String(text ?? '').match(new RegExp(`${exportName} = new Set\\(\\[([^\\]]*)\\]\\)`));
  return block ? [...block[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]) : [];
}

const readIf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

/** The committed lists as sets; a missing file reads as an empty set. */
export function readIconLists(root) {
  const regular = readIf(path.join(root, ICON_LISTS.regular));
  const free = readIf(path.join(root, ICON_LISTS.free));
  return {
    regular: new Set(parseSet(regular, 'FREE_REGULAR_ICONS')),
    solid: new Set(parseSet(free, 'FREE_SOLID_ICONS')),
    brands: new Set(parseSet(free, 'FREE_BRANDS_ICONS')),
  };
}
