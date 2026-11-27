/**
 * `npm run check:docs-type-tracking` — no inline text-style `font` in the docs,
 * a story, an MDX page or a demo/cases file without its letter spacing. `font: 'var(--body-sm)'`
 * cannot carry tracking, so docs demos use `typeStyle('body-sm')` from
 * `storybook-docs/lib/type-style.js`, which returns the pair. `*Examples.jsx`
 * (printed consumer code) is out of scope.
 */
import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

const ROOT = 'design-system/src/';
const FONT = /\bfont:\s*(['"`])var\(--(?:(?:heading|body|metric|label)-[a-z0-9-]+|code-sm)\)\1/g;
const MIN_SOURCES = 30;
const REMEDY =
  "A `font` shorthand cannot carry letter spacing. Spread `typeStyle('<style>')` from storybook-docs/lib/type-style.js instead.";

export function inScope(rel) {
  if (!rel.startsWith(ROOT) || !/\.(jsx|js|mdx)$/.test(rel)) return false;
  if (/\.test\.[jt]sx?$/.test(rel) || /Examples\.jsx$/.test(rel)) return false;
  if (rel.endsWith('lib/type-style.js')) return false;
  return rel.startsWith(`${ROOT}storybook-docs/`) || /(Demo|Cases)\.jsx$/.test(rel) || /\.stories\.jsx?$/.test(rel) || rel.endsWith('.mdx');
}

/** 1-based lines holding a bare text-style `font`. */
export function findUntracked(source) {
  const hits = [];
  for (const m of source.matchAll(FONT)) {
    hits.push(source.slice(0, m.index).split('\n').length);
  }
  return hits;
}

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const sources = trackedSources(repoRoot, [ROOT], /\.(jsx|js|mdx)$/).filter(({ path }) => inScope(path));
  if (sources.length < MIN_SOURCES) {
    return [{ message: `walked ${sources.length} docs/demo files, expected at least ${MIN_SOURCES}. The source walk broke.` }];
  }
  return sources.flatMap(({ path, text }) =>
    findUntracked(text).map((line) => ({ file: path, line, message: 'text-style font without its letter spacing' })),
  );
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const n = trackedSources(repoRoot, [ROOT], /\.(jsx|js|mdx)$/).filter(({ path }) => inScope(path)).length;
  return `${n} docs, story and demo files, every inline text style carries its letter spacing`;
}

main(import.meta.url, 'check:docs-type-tracking', { run, summary, remedy: REMEDY });
