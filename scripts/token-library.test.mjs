/**
 * The Foundations ▸ Tokens ▸ Library lookup: every token once, light and dark
 * values read from the source, and search plus the three filters combining.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { buildLibrary, filterLibrary, groupLibrary, readDarkTokens } from '../design-system/src/storybook-docs/lib/token-library.mjs';

const read = (f) => fs.readFileSync(new URL(`../design-system/src/tokens/${f}`, import.meta.url), 'utf8');
const darkSources = ['color/_semantic.scss', 'color/_elevation.scss'].map((file) => ({ file, text: read(file) }));
const corpus = tokenCorpus();
const intents = new Map(
  JSON.parse(fs.readFileSync(new URL('../design-system/agent-views/tokens.json', import.meta.url), 'utf8')).tokens.map((t) => [t.name, t.intent]),
);
const library = buildLibrary(corpus, { darkSources, intents });

test('every token appears in the library exactly once', () => {
  assert.equal(library.length, corpus.size);
  assert.equal(new Set(library.map((e) => e.name)).size, corpus.size);
  const grouped = groupLibrary(library).flatMap((c) => c.sections.flatMap((s) => s.rows));
  assert.equal(grouped.length, corpus.size);
  assert.equal(new Set(grouped.map((r) => r.name)).size, corpus.size);
});

test('a color role carries a light and a dark value read from the source', () => {
  const text = library.find((e) => e.name === '--ds-text');
  assert.ok(text.light && text.dark && text.light !== text.dark, `${text.light} / ${text.dark}`);
  assert.equal(library.find((e) => e.name === '--space-100').dark, null);
});

test('readDarkTokens reads only the plain dark block', () => {
  const dark = readDarkTokens('a{--x:1}\n[data-color-mode="dark"] {\n  --x: 2;\n}\n[data-color-mode="dark"][data-contrast-mode="more"] {\n  --x: 3;\n}');
  assert.equal(dark.get('--x'), '2');
});

test('search matches a substring of the name, exact match the whole name', () => {
  const sub = filterLibrary(library, { query: 'ds-text-sub' });
  assert.ok(sub.length > 1 && sub.every((e) => e.name.includes('ds-text-sub')));
  const exact = filterLibrary(library, { query: '--ds-text-subtle', exact: true });
  assert.deepEqual(exact.map((e) => e.name), ['--ds-text-subtle']);
  assert.equal(filterLibrary(library, { query: 'ds-text-subtle', exact: true }).length, 1, 'the leading dashes are optional');
  assert.equal(filterLibrary(library, { query: 'text-sub', exact: true }).length, 0);
});

test('search, exact and the three filters combine', () => {
  const all = filterLibrary(library, {}).length;
  assert.equal(all, library.length);
  const color = filterLibrary(library, { collection: 'color' });
  const semantic = filterLibrary(library, { collection: 'color', tier: 'semantic' });
  const global = filterLibrary(library, { collection: 'color', tier: 'semantic', scope: 'global' });
  assert.ok(all > color.length && color.length > semantic.length && semantic.length > global.length && global.length > 0);
  const searched = filterLibrary(library, { collection: 'color', tier: 'semantic', scope: 'global', query: 'border' });
  assert.ok(searched.length > 0 && searched.length < global.length && searched.every((e) => e.name.includes('border')));
  assert.equal(filterLibrary(library, { tier: 'primitive', scope: 'components' }).length, 0, 'a primitive has no scope');
});

test('results group by collection, then subgroup', () => {
  const groups = groupLibrary(filterLibrary(library, { collection: 'motion' }));
  assert.deepEqual(groups.map((g) => g.collection), ['motion']);
  assert.ok(groups[0].sections.length >= 2);
});
