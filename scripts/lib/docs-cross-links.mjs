/**
 * Cross-links between docs pages: a pattern page pointing at the exact rule a
 * template page owns, `?path=/docs/<page id>--docs#<heading slug>`, and back.
 *
 *   docsIndex(root)       { [docsId]: Set<slug> }  every MDX page's docs id and heading slugs
 *   crossLinksIn(text)    [{ id, anchor, line }]   the docs links a page writes
 *   deadCrossLinks(root)  { failures, count }      links into Templates/ or Patterns/ that land nowhere
 *
 * Read statically, with no Storybook build, so it runs in check:harness:
 *
 *   - A page's docs id is its `<Meta title>`, or the `title` of the stories
 *     file its `<Meta of>` names, sanitized as Storybook does, plus `--docs`.
 *   - A heading's slug is the one Storybook's MDX gives it (github-slugger):
 *     lowercased, punctuation dropped, each space a hyphen.
 *
 * Only links into the Templates and Patterns roots are checked here: those
 * pages are all MDX, so a missing one is a dead link. A link elsewhere may
 * land on a page Storybook writes from stories alone; `check:storybook-links`
 * reads the built index for those.
 */

import fs from 'node:fs';
import path from 'node:path';

import { pagesUnder } from './docs-page.mjs';
import { readStorybookPage } from './storybook-pages.mjs';

/** The roots whose pages are all MDX, so every link into them can be resolved from source. */
export const CHECKED_ROOTS = ['templates-', 'patterns-'];

const LINK = /path=\/docs\/([a-z0-9][a-z0-9-]*--docs)(?:#([a-z0-9][a-z0-9-]*))?/g;

/** Storybook's heading id: github-slugger's, without its duplicate counter. */
export function headingSlug(heading) {
  return heading
    .replace(/[`*_]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/** Every MDX page's docs id, with the slugs of its `##` to `####` headings. */
export function docsIndex(root) {
  const index = {};
  for (const file of pagesUnder(root)) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const { docsId } = readStorybookPage(root, file);
    if (!docsId) continue;
    const slugs = new Set();
    for (const m of source.matchAll(/^#{1,4}\s+(.+?)\s*$/gm)) slugs.add(headingSlug(m[1]));
    index[docsId] = slugs;
  }
  return index;
}

/** The docs links a page writes, each with its anchor when it names one. */
export function crossLinksIn(text) {
  const lineAt = (offset) => text.slice(0, offset).split('\n').length;
  return [...text.matchAll(LINK)].map((m) => ({ id: m[1], anchor: m[2] ?? null, line: lineAt(m.index) }));
}

/** Links into Templates/ or Patterns/ whose page or heading does not exist. */
export function deadCrossLinks(root) {
  const index = docsIndex(root);
  const failures = [];
  let count = 0;
  for (const file of pagesUnder(root)) {
    for (const link of crossLinksIn(fs.readFileSync(path.join(root, file), 'utf8'))) {
      if (!CHECKED_ROOTS.some((prefix) => link.id.startsWith(prefix))) continue;
      count += 1;
      const slugs = index[link.id];
      const at = `${file}:${link.line}`;
      if (!slugs) failures.push(`${at}: cross-link to \`${link.id}\` — no page has that id`);
      else if (link.anchor && !slugs.has(link.anchor)) failures.push(`${at}: cross-link to \`${link.id}#${link.anchor}\` — no heading by that anchor`);
    }
  }
  return { failures, count };
}
