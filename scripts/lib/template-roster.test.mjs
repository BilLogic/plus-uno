import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkRoster, barrelTemplates, glossaryTemplates, titleNames, visibleChildren, stageTemplates, tileTexts, readRoster } from './template-roster.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EIGHT = ['Frame', 'Page', 'Section', 'Card', 'Table', 'Modal', 'Panel', 'Popup'];
const agreeing = () => ({ roster: EIGHT, layers: { glossary: EIGHT, overview: EIGHT, 'agent-view list': EIGHT, 'components index': EIGHT, 'Storybook titles': EIGHT, 'guidelines stages': EIGHT }, children: [], purposes: {}, uses: {}, tiles: {} });

test('layers that name the same eight templates pass', () => {
  assert.deepEqual(checkRoster(agreeing()), []);
});

test('a layer that drops a template fails and names the layer', () => {
  const m = agreeing();
  m.layers.glossary = EIGHT.filter((n) => n !== 'Card');
  assert.deepEqual(checkRoster(m), ['glossary is missing the Card template']);
});

test('a layer that adds a template the barrel does not export fails', () => {
  const m = agreeing();
  m.layers.overview = [...EIGHT, 'Form'];
  assert.deepEqual(checkRoster(m), ['overview names Form, which the @/templates barrel does not export']);
});

test('a renamed template fails as one drop and one add', () => {
  const m = agreeing();
  m.layers['components index'] = EIGHT.map((n) => (n === 'Modal' ? 'Dialog' : n));
  assert.equal(checkRoster(m).length, 2);
});

test('a template whose title has a visible child fails', () => {
  const m = agreeing();
  m.children = [{ title: 'Templates/Page/Reference screens', file: 'p/R.stories.jsx' }];
  assert.deepEqual(checkRoster(m), ['Templates/Page/Reference screens (p/R.stories.jsx) shows Page as a folder in Storybook; tag the stories !dev']);
});

test('a row or a tile that differs from its page purpose fails', () => {
  const m = agreeing();
  m.purposes = { Card: 'A container for one object.', Frame: 'The app frame.' };
  m.uses = { Card: 'A raised container.', Frame: 'The app frame.' };
  m.tiles = { Frame: 'The app frame, retyped.' };
  assert.deepEqual(checkRoster(m), [
    'the agent-view list row for Card differs from its page purpose',
    'the overview tile for Frame differs from its page purpose',
  ]);
});

test('the guidelines stages are read up to what the stage goes on to settle', () => {
  const text = '| **1. Template** | The shell and overlays (`Frame`, `Page`) and what fills each slot, such as the `Sidebar` | x |\n| **2. Blocks** | The `Section` and `Card` shells on the grid, and which pattern governs | y |';
  assert.deepEqual(stageTemplates(text), ['Frame', 'Page', 'Section', 'Card']);
});

test('hand-typed overview tiles are read by name and text', () => {
  assert.deepEqual(tileTexts('<ThumbTile hero="templates-card" title="Card">A container.</ThumbTile>'), { Card: 'A container.' });
});

test('the barrel names a template once its folder exists and it is exported; ListPage is a starter', () => {
  const src = "export { default as Frame } from './Frame';\nexport { Popup } from '@/components';\nexport { default as Panel, PanelBody } from './Panel';\n// ListPage stays out";
  assert.deepEqual(barrelTemplates(src, ['Frame', 'Panel', 'Popup', 'ListPage']), ['Frame', 'Popup', 'Panel']);
});

test('the glossary entry is read from the Template term', () => {
  const text = '**Template**:\nAn arrangement of things: **Frame**, **Page** and Popup. There is no Form template: x.\n\n**Frame**:\nx';
  assert.deepEqual(glossaryTemplates(text), ['Frame', 'Page', 'Popup']);
});

test('titles name the template by their second segment, and only a visible nested title is a child', () => {
  const files = [
    { file: 'a.stories.jsx', text: "export default {\n    title: 'Templates/Page',\n    tags: ['!dev', '!autodocs'],\n};" },
    { file: 'b.stories.jsx', text: "export default {\n    title: 'Templates/Page/Reference screens',\n    tags: ['!dev'],\n};" },
    { file: 'c.stories.jsx', text: "export default {\n    title: 'Templates/Card/Examples',\n};" },
    { file: 'd.mdx', text: '<Meta title="Templates/Popup" tags={[\'manifest\']} />' },
  ];
  assert.deepEqual(titleNames(files), ['Card', 'Page', 'Popup']);
  assert.deepEqual(visibleChildren(files), [{ title: 'Templates/Card/Examples', file: 'c.stories.jsx' }]);
});

test('THE COMMITTED LAYERS agree on the eight templates', () => {
  const model = readRoster(REPO_ROOT);
  assert.deepEqual(model.roster, EIGHT);
  assert.deepEqual(checkRoster(model), []);
});
