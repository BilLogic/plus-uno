/**
 * Every Google Fonts link that loads Merriweather Sans loads weight 500.
 *
 * A button or tab label is `--body-default` at `--type-weight-medium` (500),
 * and the body family is Merriweather Sans. A weight the stylesheet never
 * fetched is synthesized from the nearest one the browser has, so a link that
 * stops at 300 · 400 · 600 · 700 draws every button label at 400 or 600 and
 * nothing reports it. The links are hand-written in each HTML entry point and
 * in the design system's setup snippet, so this reads all of them.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Where an entry point or a setup snippet writes a Google Fonts link. */
const ROOTS = ['.storybook', 'prototypes', 'design-system/README.md', 'index.html'];

/** The weights a family loads, from a `css2` URL: `Merriweather+Sans:wght@300;400` → [300, 400]. */
export function weights(url, family) {
  const match = url.match(new RegExp(`family=${family}:wght@([\\d;]+)`));
  return match ? match[1].split(';').map(Number) : null;
}

function links(root) {
  const files = ROOTS.flatMap((entry) => {
    if (fs.statSync(path.join(root, entry)).isFile()) return [entry];
    return documents(entry, { root, ext: ['.html'], skipDotDirs: false });
  });
  return files.flatMap((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    return [...text.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s)]+/g)].map((m) => ({ file, url: m[0] }));
  });
}

test('weights reads a family out of a css2 URL', () => {
  const url = 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400&family=Merriweather+Sans:wght@400;500&display=swap';
  assert.deepEqual(weights(url, 'Merriweather\\+Sans'), [400, 500]);
  assert.equal(weights(url, 'Open\\+Sans'), null);
});

test('every link that loads Merriweather Sans loads 500, the medium weight', () => {
  const found = links(REPO_ROOT).filter(({ url }) => weights(url, 'Merriweather\\+Sans'));
  // The Storybook preview, the root page, the README snippet and the prototypes.
  assert.ok(found.length >= 15, `only ${found.length} Merriweather Sans links found`);
  const missing = found.filter(({ url }) => !weights(url, 'Merriweather\\+Sans').includes(500));
  assert.deepEqual(missing.map(({ file }) => file), []);
});
