/**
 * Structural contract tests for #2598:
 * - FooterActions.mdx carries the Placement and Hug or fill sections.
 * - Button.mdx and Modal.mdx each carry a Footer actions section and link to FooterActions.
 * - Every DocsLink on the three pages resolves to a real Storybook docs or story id.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readDocsPage } from './lib/docs-page.mjs';
import { blankComments, closeOf } from './lib/jsx-scan.mjs';
import { storybookId } from './lib/storybook-id.mjs';
import { storybookLinks } from './lib/storybook-links.mjs';
import { readStorybookPage, scanStorybookPages } from './lib/storybook-pages.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = {
  FooterActions: 'design-system/src/components/forms-and-inputs/FooterActions/FooterActions.mdx',
  Button: 'design-system/src/components/forms-and-inputs/Button/Button.mdx',
  Dialog: 'design-system/src/components/messaging/Dialog/Dialog.mdx',
  Modal: 'design-system/src/patterns/Modal/Modal.mdx',
};

const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

/** All real Storybook docs and story ids derived from the source tree. */
function collectStorybookIds(root = REPO_ROOT) {
  const scanned = scanStorybookPages(root);
  const mdxStoriesFiles = new Set(scanned.filter((p) => p.file.endsWith('.mdx') && p.storiesFile).map((p) => p.storiesFile));
  const ids = new Set();

  for (const page of scanned) {
    const isMdx = page.file.endsWith('.mdx');
    const hasDocsEntry = isMdx || (!mdxStoriesFiles.has(page.file) && !page.tags.includes('!autodocs'));
    if (page.docsId && hasDocsEntry) ids.add(page.docsId);

    if (!page.file.includes('.stories.') || !page.title) continue;
    const text = blankComments(read(page.file));
    for (const match of text.matchAll(/export\s+const\s+(\w+)\s*=\s*(\{)?/g)) {
      const exportName = match[1];
      let storyName = exportName.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
      if (match[2]) {
        const start = match.index + match[0].length - 1;
        const body = text.slice(start, closeOf(text, start));
        storyName = body.match(/\bname:\s*['"]([^'"]+)['"]/)?.[1] ?? storyName;
      }
      const override = text.match(new RegExp(`\b${exportName}\.storyName\s*=\s*['"]([^'"]+)['"]`))?.[1];
      ids.add(storybookId(page.title, override ?? storyName));
    }
  }
  return ids;
}

const allHeadings = (page) => [
  ...page.sections.map((s) => s.title.toLowerCase()),
  ...page.sections.flatMap((s) => s.subsections.map((sub) => sub.title.toLowerCase())),
];

test('FooterActions page has the Placement and Hug or fill sections', () => {
  const page = readDocsPage(read(PAGES.FooterActions));
  const headings = allHeadings(page);
  assert.ok(headings.includes('placement'), 'FooterActions.mdx is missing the Placement section');
  assert.ok(headings.includes('hug or fill'), 'FooterActions.mdx is missing the Hug or fill section');
});

test('Button and Modal pages each have a Footer actions section and link to FooterActions', () => {
  const footerDocsId = readStorybookPage(REPO_ROOT, PAGES.FooterActions).docsId;
  assert.ok(footerDocsId, 'FooterActions.mdx resolves to a Storybook docsId');

  for (const name of ['Button', 'Dialog']) {
    const src = read(PAGES[name]);
    const page = readDocsPage(src);
    assert.ok(
      page.sections.some((s) => s.title.toLowerCase() === 'footer actions'),
      `${name}.mdx is missing a ## Footer actions section`,
    );
    const linkedIds = storybookLinks(src).map((l) => l.id);
    assert.ok(
      linkedIds.includes(footerDocsId),
      `${name}.mdx does not link to ${footerDocsId}`,
    );
  }
});

test('every DocsLink on FooterActions, Button and Modal resolves to a real story or docs id', () => {
  const validIds = collectStorybookIds(REPO_ROOT);
  for (const [name, file] of Object.entries(PAGES)) {
    const links = storybookLinks(read(file));
    assert.ok(links.length > 0, `${name}.mdx should carry at least one Storybook link`);
    for (const link of links) {
      assert.ok(validIds.has(link.id), `${file}:${link.line} links to missing Storybook id "${link.id}"`);
    }
  }
});
