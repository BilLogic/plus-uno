/**
 * The Foundations ▸ Tokens ▸ Library lookup: every token once, its value read
 * from the source, and search plus the three filters combining.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { tokenCollections } from '../design-system/src/storybook-docs/lib/token-collections.mjs';
import { buildLibrary, filterLibrary, groupLibrary } from '../design-system/src/storybook-docs/lib/token-library.mjs';

const corpus = tokenCorpus();
const records = JSON.parse(fs.readFileSync(new URL('../design-system/agent-views/tokens.json', import.meta.url), 'utf8')).tokens;
const library = buildLibrary(tokenCollections(records));

test('every token appears in the library exactly once', () => {
  assert.equal(library.length, corpus.size);
  assert.equal(new Set(library.map((e) => e.name)).size, corpus.size);
  const grouped = groupLibrary(library).flatMap((c) => c.sections.flatMap((s) => s.rows));
  assert.equal(grouped.length, corpus.size);
  assert.equal(new Set(grouped.map((r) => r.name)).size, corpus.size);
});

test('the light value of every row is what the stylesheets resolve', () => {
  for (const row of library) assert.equal(row.light, corpus.get(row.name).value, row.name);
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

test('every row has a one-line description', () => {
  assert.ok(library.every((e) => e.description && !e.description.includes('\n')));
});
