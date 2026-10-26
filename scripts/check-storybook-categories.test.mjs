import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ATLASSIAN_CATEGORIES,
  MIN_FILES,
  folderOf,
  isSentenceCase,
  run,
} from './check-storybook-categories.mjs';

test('sentence case allows a capitalized first word and acronyms, and refuses Title Case', () => {
  for (const ok of ['Text field', 'AI label', 'Declared API', 'Label & caption', '_Field', 'Date time picker']) {
    assert.equal(isSentenceCase(ok), true, ok);
  }
  for (const bad of ['Text Field', 'Date And Time', 'Button Group']) {
    assert.equal(isSentenceCase(bad), false, bad);
  }
});

test('a category folder is its name in kebab case', () => {
  assert.equal(folderOf('Overlays and layering'), 'overlays-and-layering');
  assert.equal(ATLASSIAN_CATEGORIES[0], 'Forms and inputs');
});

/** A throwaway repo with the given files, tracked, so `git ls-files` sees them. */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-categories-'));
  const taxonomy = {
    componentGroups: { 'Forms and inputs': [], Labels: [] },
    storySortOrder: ['Components', ['Forms and inputs', [], 'Labels', []]],
  };
  const all = {
    'storybook.taxonomy.json': JSON.stringify(taxonomy),
    'design-system/src/components/_internal/.keep': '',
    ...files,
  };
  for (let i = 0; i < MIN_FILES; i++) {
    all[`design-system/src/components/forms-and-inputs/F${i}.stories.jsx`] =
      `export default {\n    title: 'Components/Forms and inputs/Field ${i}',\n};\n`;
  }
  for (const [rel, src] of Object.entries(all)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), src);
  }
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  return root;
}

const story = (title) => `export default {\n    title: '${title}',\n};\n`;
const messages = (root) => run({ repoRoot: root }).map((f) => f.message);

test('a fixture with only good titles is green', () => {
  assert.deepEqual(messages(fixture({})), []);
});

test('a retired group, a wrong folder, Title Case and a retired path each go red', () => {
  const retired = ['design-system', 'src', 'components', 'actions', 'Button'].join('/');
  const root = fixture({
    'design-system/src/components/labels/Tag.stories.jsx': story('Components/Status and loading/Tag'),
    'design-system/src/components/labels/Count.stories.jsx': story('Components/Forms and inputs/Count'),
    'design-system/src/components/forms-and-inputs/Text.stories.jsx': story('Components/Forms and inputs/Text Field'),
    'design-system/src/components/status-and-loading/Old.jsx': '',
    'docs/note.md': `see ${retired}/Button.jsx`,
  });
  const found = messages(root);
  assert.ok(found.some((m) => m.includes('Tag.stories.jsx') && m.includes('outside every component category')));
  assert.ok(found.some((m) => m.includes('Count.stories.jsx') && m.includes('lives in labels/')));
  assert.ok(found.some((m) => m.includes('"Text Field" is not sentence case')));
  assert.ok(found.some((m) => m.includes('status-and-loading/  is not a category folder')));
  assert.ok(found.some((m) => m.startsWith('docs/note.md') && m.includes('retired folder')));
});

test('groups out of Atlassian order go red', () => {
  const root = fixture({});
  const file = path.join(root, 'storybook.taxonomy.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      componentGroups: { Labels: [], 'Forms and inputs': [] },
      storySortOrder: ['Components', ['Labels', [], 'Forms and inputs', []]],
    }),
  );
  assert.ok(messages(root).some((m) => m.includes("out of Atlassian's order")));
});

test('a collapsed corpus is refused rather than passed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-categories-empty-'));
  fs.mkdirSync(path.join(root, 'design-system/src/components'), { recursive: true });
  fs.writeFileSync(path.join(root, 'storybook.taxonomy.json'), '{}');
  execFileSync('git', ['init', '-q'], { cwd: root });
  assert.match(messages(root)[0], /expected at least/);
});

test('an _internal story may name any category; a titleless story goes red', () => {
  const root = fixture({
    'design-system/src/components/_internal/Navbar.stories.jsx': story('Components/Labels/Navbar'),
    'design-system/src/components/labels/Empty.stories.jsx': 'export default {};\n',
  });
  const found = messages(root);
  assert.ok(!found.some((m) => m.includes('Navbar.stories.jsx')));
  assert.ok(found.some((m) => m.includes('Empty.stories.jsx') && m.includes('no `title:`')));
});

test('a group that is not an Atlassian category, and a sort that disagrees, go red', () => {
  const root = fixture({});
  fs.writeFileSync(
    path.join(root, 'storybook.taxonomy.json'),
    JSON.stringify({
      componentGroups: { 'Forms and inputs': [], Actions: [], Labels: [] },
      storySortOrder: ['Components', ['Forms and inputs', [], 'Labels', []]],
    }),
  );
  const found = messages(root);
  assert.ok(found.some((m) => m.includes('"Actions" is not an Atlassian category')));
  assert.ok(found.some((m) => m.includes('storySortOrder lists different Components groups')));
});

test('a retired folder is matched by repo path or alias, with no trailing path needed', () => {
  const alias = ['@', 'components', 'status-and-loading'].join('/');
  const own = ['src', 'components', 'overlays', 'Tooltip'].join('/');
  const root = fixture({
    'docs/a.md': `import X from '${alias}';`,
    'docs/b.md': `${own} is a prototype's own folder`,
  });
  const found = messages(root);
  assert.ok(found.some((m) => m.startsWith('docs/a.md')));
  assert.ok(!found.some((m) => m.startsWith('docs/b.md')));
});
