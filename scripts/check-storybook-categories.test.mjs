import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ATLASSIAN_CATEGORIES,
  MIN_FILES,
  SITE_SECTIONS,
  docsTitle,
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
    aiComponents: ['AI message'],
    rootSources: {
      Templates: ['design-system/src/patterns/Frame', 'design-system/src/storybook-docs/templates/'],
      Patterns: ['design-system/src/storybook-docs/patterns/'],
    },
    storySortOrder: [
      'Get started',
      'Foundations',
      'Templates',
      'Patterns',
      'Components',
      ['Forms and inputs', [], 'Labels', []],
      'AI UI',
      'Specs',
      '*',
    ],
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
      storySortOrder: [...SITE_SECTIONS.slice(0, 5), ['Forms and inputs', [], 'Labels', []], ...SITE_SECTIONS.slice(5)],
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

test('a docs title is read from a story default export or an MDX Meta', () => {
  assert.equal(docsTitle(story('Patterns/Frame')), 'Patterns/Frame');
  assert.equal(docsTitle('<Meta\n  title="Get started/About"\n/>'), 'Get started/About');
  assert.equal(docsTitle('<Meta of={Stories} />'), null);
});

test('the sidebar roots lead with the site sections, in order', () => {
  const root = fixture({});
  fs.writeFileSync(
    path.join(root, 'storybook.taxonomy.json'),
    JSON.stringify({
      componentGroups: { 'Forms and inputs': [], Labels: [] },
      storySortOrder: ['Getting started', 'Components', ['Forms and inputs', [], 'Labels', []], 'Patterns'],
    }),
  );
  assert.ok(messages(root).some((m) => m.includes('roots must lead with')));
});

test('a docs page under a root the sidebar does not list goes red', () => {
  const root = fixture({
    'design-system/src/storybook-docs/Intro.mdx': '<Meta title="Getting started/Introduction" />\n',
    'design-system/src/patterns/Frame.stories.jsx': story('Foundations/Patterns/Frame'),
    'design-system/src/storybook-docs/patterns/Filtering.stories.jsx': story('Patterns/Filtering'),
  });
  const found = messages(root);
  assert.ok(found.some((m) => m.includes('Intro.mdx') && m.includes('"Getting started"')));
  assert.ok(!found.some((m) => m.includes('Filtering.stories.jsx')));
});

test('a component story under Patterns goes red: components are titled under their category', () => {
  const root = fixture({
    'design-system/src/components/layout-and-structure/Panel.stories.jsx': story('Patterns/Panel'),
  });
  assert.ok(messages(root).some((m) => m.includes('Panel.stories.jsx')));
});

test('an AI component may sit under AI UI, and only one the taxonomy names', () => {
  const root = fixture({
    'design-system/src/components/labels/AiMessage.stories.jsx': story('AI UI/Components/AI message'),
    'design-system/src/components/labels/Tag.stories.jsx': story('AI UI/Components/Tag'),
  });
  const found = messages(root);
  assert.ok(!found.some((m) => m.includes('AiMessage.stories.jsx')));
  assert.ok(found.some((m) => m.includes('Tag.stories.jsx')));
});

test('Templates and Patterns sit above Components, Templates first, and there is no Tools section', () => {
  assert.ok(SITE_SECTIONS.indexOf('Templates') < SITE_SECTIONS.indexOf('Patterns'));
  assert.ok(SITE_SECTIONS.indexOf('Patterns') < SITE_SECTIONS.indexOf('Components'));
  assert.ok(!SITE_SECTIONS.includes('Tools'));
});

test('a template page and a pattern page in their own roots are green', () => {
  const root = fixture({
    'design-system/src/patterns/Frame/Frame.stories.jsx': story('Templates/Frame/Frame'),
    'design-system/src/storybook-docs/templates/Overview.mdx': '<Meta title="Templates/Overview" />\n',
    'design-system/src/storybook-docs/patterns/Overview.mdx': '<Meta title="Patterns/Overview" />\n',
  });
  assert.deepEqual(messages(root), []);
});

test('a template page titled under Patterns, or a pattern page under Templates, goes red', () => {
  const root = fixture({
    'design-system/src/patterns/Frame/Frame.stories.jsx': story('Patterns/Frame'),
    'design-system/src/storybook-docs/patterns/Filtering.mdx': '<Meta title="Templates/Filtering" />\n',
  });
  const found = messages(root);
  assert.ok(found.some((m) => m.includes('Frame.stories.jsx') && m.includes('belongs under "Templates"')));
  assert.ok(found.some((m) => m.includes('Filtering.mdx') && m.includes('belongs under "Patterns"')));
});

test('a page under a root with no source folder listed for it goes red', () => {
  const root = fixture({
    'design-system/src/somewhere/Loose.mdx': '<Meta title="Templates/Loose" />\n',
  });
  assert.ok(messages(root).some((m) => m.includes('Loose.mdx') && m.includes('not under a source folder listed for "Templates"')));
});

test('a page in a template source folder titled outside Templates goes red', () => {
  const root = fixture({
    'design-system/src/storybook-docs/templates/Stray.mdx': '<Meta title="Foundations/Stray" />\n',
  });
  assert.ok(messages(root).some((m) => m.includes('Stray.mdx') && m.includes('belongs under "Templates"')));
});

test('a sidebar sort that lists Patterns before Templates goes red', () => {
  const root = fixture({});
  fs.writeFileSync(
    path.join(root, 'storybook.taxonomy.json'),
    JSON.stringify({
      componentGroups: { 'Forms and inputs': [], Labels: [] },
      storySortOrder: ['Get started', 'Foundations', 'Patterns', 'Templates', 'Components', ['Forms and inputs', [], 'Labels', []], 'AI UI'],
    }),
  );
  assert.ok(messages(root).some((m) => m.includes('roots must lead with')));
});

test('the real Templates tree is flat: eight templates, no Overlays folder', () => {
  const tax = JSON.parse(fs.readFileSync(new URL('../storybook.taxonomy.json', import.meta.url), 'utf8'));
  const at = tax.storySortOrder.indexOf('Templates');
  const order = tax.storySortOrder[at + 1];
  assert.deepEqual(order.filter((x) => typeof x === 'string'), [
    'Templates and patterns', 'Overview', 'Frame', 'Page', 'Section', 'Form', 'Modal', 'Panel', 'Popup',
  ]);
  assert.ok(!order.includes('Overlays'));
  assert.ok(!order.includes('Page templates'));
});

test('the illustration kit is a Get started page, not a Templates source', () => {
  const tax = JSON.parse(fs.readFileSync(new URL('../storybook.taxonomy.json', import.meta.url), 'utf8'));
  assert.ok(!tax.rootSources.Templates.some((dir) => dir.includes('/illustrations')));
  const mdx = fs.readFileSync(new URL('../design-system/src/storybook-docs/illustrations/IllustrationKit.mdx', import.meta.url), 'utf8');
  assert.equal(docsTitle(mdx), 'Get started/Illustration kit');
});

/** Lists the Foundations · Motion pages in the fixture's sidebar sort. */
function listMotion(root, entries) {
  const file = path.join(root, 'storybook.taxonomy.json');
  const taxonomy = JSON.parse(fs.readFileSync(file, 'utf8'));
  taxonomy.storySortOrder.splice(2, 0, 'Foundations', ['Motion', entries]);
  taxonomy.storySortOrder.splice(1, 1);
  fs.writeFileSync(file, JSON.stringify(taxonomy));
}
const motionPage = (name) => `<Meta title="Foundations/Motion/${name}" />\n`;
const motionFiles = (...names) =>
  Object.fromEntries(names.map((n) => [`design-system/src/styles/Motion${n.replace(/ /g, '')}.mdx`, motionPage(n)]));

test('Foundations · Motion pages that the sort lists, Library among them, are green', () => {
  const root = fixture(motionFiles('Physics', 'Library'));
  listMotion(root, ['Physics', 'Library']);
  assert.deepEqual(messages(root), []);
});

test('a Foundations · Motion page the sort does not list goes red', () => {
  const root = fixture(motionFiles('Physics', 'Library', 'Durations and easings'));
  listMotion(root, ['Physics', 'Library']);
  assert.match(messages(root).join('\n'), /Durations and easings/);
});

test('a Foundations · Motion entry in the sort with no page, Library included, goes red', () => {
  const root = fixture(motionFiles('Physics'));
  listMotion(root, ['Physics', 'Library']);
  assert.match(messages(root).join('\n'), /Library/);
});

test('a Foundations · Motion list without Library goes red', () => {
  const root = fixture(motionFiles('Physics'));
  listMotion(root, ['Physics']);
  assert.match(messages(root).join('\n'), /Library/);
});
