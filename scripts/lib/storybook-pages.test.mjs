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

test('attached Meta resolves aliased extensionless stories, custom names, tags and component source', (t) => {
  const stories = 'design-system/src/styles/Color.stories.tsx';
  const component = 'design-system/src/styles/Swatch.tsx';
  const root = fixture(t, {
    [FILE]: `import * as Palette from '@/styles/Color.stories';\n<Meta\n of={Palette}\n name="Guidelines"\n/>`,
    [stories]: `import Swatch from './Swatch';\nconst example = { title: 'Not the page' };\nexport default {\n title: 'Foundations/Visual/Color', component: Swatch, tags: ['!dev', 'manifest']\n};`,
    [component]: 'export default function Swatch() {}',
  });
  assert.deepEqual(readStorybookPage(root, FILE), {
    file: FILE, title: 'Foundations/Visual/Color', categoryRoot: 'Foundations',
    docsId: 'foundations-visual-color--guidelines', docsName: 'Guidelines',
    tags: ['!dev', 'manifest'], storiesFile: stories, componentSource: component, componentName: null,
  });
  const story = readStorybookPage(root, stories);
  assert.equal(story.title, 'Foundations/Visual/Color');
  assert.deepEqual(story.tags, ['!dev', 'manifest']);
  assert.equal(story.componentSource, component);
  assert.deepEqual(scanStorybookPages(root).map((p) => p.file), [FILE, stories]);
});
