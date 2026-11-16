import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '../design-system/src');

const mdxFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return mdxFiles(p);
    return e.name.endsWith('.mdx') ? [p] : [];
  });

test('no docs section repeats its heading as its first example title', () => {
  // `## Overview` then an example titled "Overview" reads twice; the example takes no title instead.
  const repeats = [];
  for (const file of mdxFiles(SRC)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const section of source.matchAll(/^## (.+)\n+((?:(?!^## ).*\n){0,6})/gm)) {
      const title = /<ComponentExample[^>]*\btitle="([^"]+)"/.exec(section[2]);
      if (title && title[1].trim().toLowerCase() === section[1].trim().toLowerCase()) {
        repeats.push(`${path.relative(SRC, file)}: "${section[1].trim()}"`);
      }
    }
  }
  assert.deepEqual(repeats, []);
});
