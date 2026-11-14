/** Static Storybook page metadata, shared by checks, generators and docs lookup. */
import fs from 'node:fs';
import path from 'node:path';

import { storybookId } from './storybook-id.mjs';

const DS_SRC = 'design-system/src';
const toPosix = (file) => file.split(path.sep).join('/');
const strings = (text) => [...text.matchAll(/['"]([^'"]*)['"]/g)].map((m) => m[1]);

/** Read literal Meta props without evaluating the page. Unresolved metadata is null. */
export function readStorybookPage(repoRoot, file) {
  file = toPosix(path.relative(repoRoot, path.resolve(repoRoot, file)));
  const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  const meta = source.match(/<Meta\b([^>]*)>/)?.[1] ?? '';
  const title = meta.match(/\btitle\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? null;
  const docsName = meta.match(/\bname\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? 'Docs';
  const tags = strings(meta.match(/\btags\s*=\s*\{\s*\[([^\]]*)\]/)?.[1] ?? '');
  return {
    file, title, categoryRoot: title?.split('/')[0] ?? null,
    docsId: title ? storybookId(title, docsName) : null, docsName, tags,
    storiesFile: null, componentSource: null, componentName: null,
  };
}

/** Every authored MDX and stories file under the design-system source, in path order. */
export function scanStorybookPages(repoRoot) {
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/(?:\.mdx|\.stories\.[jt]sx?)$/.test(entry.name) && !/ \d+\.mdx$/.test(entry.name)) files.push(toPosix(path.relative(repoRoot, full)));
    }
  };
  walk(path.join(repoRoot, DS_SRC));
  return files.sort().map((file) => readStorybookPage(repoRoot, file));
}
