/**
 * Which components still use legacy color tokens — read-only, for the
 * migration guide's generated list.
 *
 * A legacy use is what `legacyCoverage()` in `legacy-map.mjs` counts (its
 * `USE` capture: a `var()` of a `--color-*`, `--surface-*` or `--elevation-*`
 * name), minus the names whose map row leaves them unchanged — the
 * `--surface-container`, `-pad`, `-stack` and `-radius` spacing and radius
 * names. A name with no row at all still counts: it is used and defined
 * nowhere, and the sweep fixes it at the call site.
 *
 * A component is a folder under a category (`navigation/NavTabs/…`) or, for a
 * flat file, its file name up to the first dot (`loading/Spinner.scss` and
 * `loading/Spinner.stories.jsx` are both `loading/Spinner`). Tests are
 * skipped: they plant fixture names, and a fixture is not a use.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT, documents } from '../corpus.mjs';

import { USE, rowFor } from './legacy-map.mjs';

export const COMPONENTS_ROOT = 'design-system/src/components';
const EXT = ['.scss', '.css', '.js', '.jsx', '.ts', '.tsx', '.mdx'];
const TEST = /\.test\.[jt]sx?$/;

/** A name the map keeps as it is, because it is not a color. */
const isUnchanged = (name) => rowFor(name)?.proposed.startsWith('unchanged') ?? false;

const stem = (file) => file.split('.')[0];

/**
 * `navigation/NavTabs/NavTabs.scss` -> `navigation/NavTabs`;
 * `loading/Spinner.stories.jsx` -> `loading/Spinner`;
 * a file at the root of the components folder (`index.js`) -> null, since it
 * belongs to no component.
 */
export function componentOf(rel) {
  const parts = rel.slice(COMPONENTS_ROOT.length + 1).split('/');
  if (parts.length < 2) return null;
  return `${parts[0]}/${parts.length === 2 ? stem(parts[1]) : parts[1]}`;
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
    const key = componentOf(rel);
    if (!key) continue;
    const text = readFileSync(join(root, rel), 'utf8');
    for (const [, name] of text.matchAll(USE)) {
      if (isUnchanged(name)) continue;
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
