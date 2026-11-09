/**
 * Every Google Fonts link that loads Noto Sans loads weight 500.
 *
 * A button or tab label is `--body-default` at `--type-weight-medium` (500),
 * and the body family is Noto Sans. A weight the stylesheet never
 * fetched is synthesized from the nearest one the browser has, so a link that
 * stops at 400 · 600 draws every button label at 400 or 600 and
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
const ROOTS = ['.storybook', 'prototypes', 'design-system/README.md', 'skills/uno-prototype/scripts/scaffold-prototype.sh'];

/** The weights a family loads, from a `css2` URL: `Noto+Sans:wght@300;400` → [300, 400]. */
export function weights(url, family) {
  const match = url.match(new RegExp(`family=${family}:wght@([\\d;.]+)`));
  if (!match) return null;
  return match[1].split(';').flatMap((part) => {
    const [from, to = from] = part.split('..').map(Number);
    return [from, ...[100, 200, 300, 400, 500, 600, 700, 800, 900].filter((w) => w > from && w <= to)];
  });
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
  const url = 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@500;600&family=Noto+Sans:wght@400..600&display=swap';
  assert.deepEqual(weights(url, 'Noto\\+Sans'), [400, 500, 600]);
  assert.equal(weights(url, 'Open\\+Sans'), null);
});

test('every link that loads Noto Sans loads 500, the medium weight', () => {
  const found = links(REPO_ROOT).filter(({ url }) => weights(url, 'Noto\\+Sans'));
  // The Storybook preview, the README snippet, the prototypes and the scaffold.
  assert.ok(found.length >= 4, `only ${found.length} Noto Sans links found`);
  const missing = found.filter(({ url }) => !weights(url, 'Noto\\+Sans').includes(500));
  assert.deepEqual(missing.map(({ file }) => file), []);
});
