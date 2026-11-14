import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readStorybookPage, scanStorybookPages } from './storybook-pages.mjs';

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'storybook-pages-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [file, source] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), source);
  }
  return root;
}

const FILE = 'design-system/src/styles/Color.mdx';

test('a standalone multiline Meta supplies its title, docs name, id and tags', (t) => {
  const root = fixture(t, { [FILE]: `<Meta\n title="Foundations/Visual/Color"\n tags={['manifest', '!dev']}\n/>` });
  assert.deepEqual(readStorybookPage(root, FILE), {
    file: FILE, title: 'Foundations/Visual/Color', categoryRoot: 'Foundations',
    docsId: 'foundations-visual-color--docs', docsName: 'Docs',
    tags: ['manifest', '!dev'], storiesFile: null, componentSource: null, componentName: null,
  });
});
