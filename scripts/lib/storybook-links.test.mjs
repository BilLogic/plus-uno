// The Storybook ids a file links to: every form a link takes in this repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { storybookLinks, isLinkable } from './storybook-links.mjs';

const ids = (text) => storybookLinks(text).map((link) => link.id);

test('a ?path= link names a docs or story id', () => {
  assert.deepEqual(ids('<a href="?path=/docs/patterns-frame-frame--docs">Frame</a>'), ['patterns-frame-frame--docs']);
  assert.deepEqual(ids('[x](/storybook/?path=/story/ai-ai-chat--default)'), ['ai-ai-chat--default']);
});

test('a DocsLink names its page by id, and a story by id and story', () => {
  assert.deepEqual(ids('<DocsLink id="foundations-tokens">Tokens</DocsLink>'), ['foundations-tokens--docs']);
  assert.deepEqual(ids('<DocsLink id="tools-documented-contract" story="documented-variants-render">x</DocsLink>'), [
    'tools-documented-contract--documented-variants-render',
  ]);
});

test('a registry storybookId and an iframe id are links', () => {
  assert.deepEqual(ids('"storybookId": "components-labels-ai-label-ai-label--docs"'), ['components-labels-ai-label-ai-label--docs']);
  assert.deepEqual(ids('src="iframe.html?id=foundations-visual-color--surface-roles&viewMode=story"'), ['foundations-visual-color--surface-roles']);
});

test('an id assembled at run time is not a link to check', () => {
  assert.deepEqual(ids('href={`?path=/docs/foundations-${id}--docs`}'), []);
  assert.deepEqual(ids('`iframe.html?id=${storyId}&viewMode=story`'), []);
});

test('each link carries its 1-based line', () => {
  assert.equal(storybookLinks('a\nb\n?path=/docs/x-y--docs').at(0).line, 3);
});

test('records and fixtures are not linked to the live Storybook', () => {
  assert.equal(isLinkable('docs/plans/2026-10-24-001-storybook-url-migration.json'), false);
  assert.equal(isLinkable('docs/adr/001-x.md'), false);
  assert.equal(isLinkable('agents/uno-bot/tests/figma-links.test.ts'), false);
  assert.equal(isLinkable('scripts/lib/storybook-links.test.mjs'), false);
  assert.equal(isLinkable('design-system/src/patterns/Frame/Frame.mdx'), true);
});

test('an id prefix named in prose is not a link', () => {
  assert.deepEqual(ids('a "storybookId": "components-" prefix'), []);
});
