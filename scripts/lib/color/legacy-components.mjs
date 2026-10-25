/**
 * Which components still use legacy color tokens — read-only, for the
 * migration guide's generated list.
 *
 * A legacy color name is a `var()` of a `--color-*`, `--surface-*` or
 * `--elevation-*` name, the same capture `legacyCoverage()` in
 * `legacy-map.mjs` uses, minus the `--surface-container`, `-pad`, `-stack`
 * and `-radius` names: those are spacing and radius, and the migration map
 * leaves them unchanged.
 *
 * A component is a folder under a category (`navigation/NavTabs/…`) or, for a
 * flat file, its file name up to the first dot (`loading/Spinner.scss` and
 * `loading/Spinner.stories.jsx` are both `loading/Spinner`). Tests are
 * skipped: they plant fixture names, and a fixture is not a use.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT, documents } from '../corpus.mjs';

export const COMPONENTS_ROOT = 'design-system/src/components';
const EXT = ['.scss', '.css', '.js', '.jsx', '.ts', '.tsx', '.mdx'];
const USE = /var\(\s*(--(?:color|surface|elevation)-[a-z0-9-]*[a-z0-9])/g;
const NOT_COLOR = /^--surface-(container|pad|stack|radius)(-[a-z0-9]+)*$/;
const TEST = /\.test\.[jt]sx?$/;

/** `navigation/NavTabs/NavTabs.scss` -> `navigation/NavTabs`; `loading/Spinner.stories.jsx` -> `loading/Spinner`. */
export function componentOf(rel) {
  const parts = rel.slice(COMPONENTS_ROOT.length + 1).split('/');
  if (parts.length >= 3) return `${parts[0]}/${parts[1]}`;
  if (parts.length === 2) return `${parts[0]}/${parts[1].split('.')[0]}`;
  return parts[0].split('.')[0];
}

/**
 * @param {{root?: string}} [options]
 * @returns {{component: string, uses: number, names: string[]}[]} components with
 *   at least one legacy use, most uses first, then by name
 */
export function legacyComponents({ root = REPO_ROOT } = {}) {
  const byComponent = new Map();
  for (const rel of documents(COMPONENTS_ROOT, { root, ext: EXT })) {
    if (TEST.test(rel)) continue;
    const text = readFileSync(join(root, rel), 'utf8');
    for (const [, name] of text.matchAll(USE)) {
      if (NOT_COLOR.test(name)) continue;
      const key = componentOf(rel);
      const entry = byComponent.get(key) ?? { component: key, uses: 0, names: new Set() };
      entry.uses += 1;
      entry.names.add(name);
      byComponent.set(key, entry);
    }
  }
  return [...byComponent.values()]
    .map((e) => ({ component: e.component, uses: e.uses, names: [...e.names].sort() }))
    .sort((a, b) => b.uses - a.uses || (a.component < b.component ? -1 : 1));
}
