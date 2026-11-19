/**
 * The token collections the Foundations ▸ Tokens pages show: every token in the
 * source lands in exactly one collection, one tier and (for a semantic) one
 * scope, so no page repeats a token and none is left out.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import { documents, text } from './lib/corpus.mjs';
import {
  COLLECTIONS,
  SCOPES,
  TIERS,
  allTokens,
  placeToken,
  tokenCollections,
  tokenNamingAudit,
} from '../design-system/src/storybook-docs/lib/token-collections.mjs';

const records = JSON.parse(fs.readFileSync(new URL('../design-system/agent-views/tokens.json', import.meta.url), 'utf8')).tokens;
const names = records.map((r) => r.name);
const at = new Map(records.map((r) => [r.name, r]));
const where = (name) => placeToken(name, at.get(name));
const corpus = tokenCorpus();

test('the source has tokens to place', () => {
  assert.ok(names.length > 1000, `only ${names.length} tokens read`);
});

test('the token table names exactly the tokens the stylesheets define, with the values they declare', () => {
  assert.deepEqual([...names].sort(), [...corpus.keys()].sort());
  for (const r of records) assert.equal(r.value, corpus.get(r.name).raw, r.name);
});

test('every token lands in exactly one collection, tier and scope', () => {
  const unplaced = [];
  for (const name of names) {
    const place = where(name);
    if (!place) {
      unplaced.push(name);
      continue;
    }
    assert.ok(COLLECTIONS.includes(place.collection), `${name}: collection ${place.collection}`);
    assert.ok(TIERS.includes(place.tier), `${name}: tier ${place.tier}`);
    if (place.tier === 'primitive') assert.equal(place.scope, null, `${name}: a primitive has no scope`);
    else assert.ok(SCOPES.includes(place.scope), `${name}: scope ${place.scope}`);
  }
  assert.deepEqual(unplaced, []);
});

test('the sections partition the corpus: no token twice, none missing', () => {
  const seen = new Map();
  for (const { collection, sections } of tokenCollections(records)) {
    for (const section of sections) {
      for (const t of section.tokens) {
        assert.equal(seen.has(t.name), false, `${t.name} is on ${seen.get(t.name)} and ${collection}`);
        seen.set(t.name, collection);
      }
    }
  }
  assert.equal(seen.size, names.length);
});

test('collections come back in page order, and a section keeps the table order, which is the stylesheet order', () => {
  const collections = tokenCollections(records);
  assert.deepEqual(collections.map((c) => c.collection), COLLECTIONS);
  const position = new Map(names.map((n, i) => [n, i]));
  for (const { sections } of collections) {
    for (const { tokens } of sections) {
      const at = tokens.map((t) => position.get(t.name));
      assert.deepEqual(at, [...at].sort((a, b) => a - b));
    }
  }
  assert.equal(allTokens(collections).length, names.length);
});

test('ladders render in their meaning: layers by z-index, sizes small to large, motion fast to slow', () => {
  const sections = tokenCollections(records);
  const order = (collection, scope, pattern) =>
    sections.find((c) => c.collection === collection).sections.find((s) => s.scope === scope)
      .tokens.map((t) => t.name).filter((n) => pattern.test(n));
  const before = (list, ...names) => {
    for (const n of names) assert.ok(list.includes(n), `${n} is on its page`);
    assert.deepEqual(names.map((n) => list.indexOf(n)), names.map((n) => list.indexOf(n)).sort((a, b) => a - b), `${names.join(' < ')} in ${list.join(', ')}`);
  };
  for (const n of ['--layer-card', '--layer-navigation', '--layer-dialog']) assert.ok(names.includes(n), n);
  const layers = order('elevation', 'global', /^--layer-/);
  before(layers, '--layer-card', '--layer-navigation', '--layer-dialog');
  const controls = order('spacing', 'global', /^--control-/);
  before(controls, '--control-sm', '--control-md', '--control-lg');
  const headings = order('typography', 'global', /^--heading-(xxl|xl|lg|md|sm|xs|xxs)$/);
  before(headings, '--heading-xxl', '--heading-xl', '--heading-lg', '--heading-md', '--heading-sm', '--heading-xs', '--heading-xxs');
  const motion = order('motion', 'global', /^--ds-motion-spatial-/);
  before(motion, '--ds-motion-spatial-fast', '--ds-motion-spatial-default', '--ds-motion-spatial-slow');
});

test('a token carries its resolved value and its intent', () => {
  const found = new Map(allTokens(tokenCollections(records)).map((t) => [t.name, t]));
  assert.notEqual(found.get('--ds-text').value, found.get('--ds-text').raw);
  assert.equal(found.get('--ds-text-subtle').intent, at.get('--ds-text-subtle').intent ?? '');
});

test('frame tokens sit on Spacing and size and layer tokens on Elevation and layers', () => {
  assert.equal(where('--page-pad').collection, 'spacing');
  assert.equal(where('--page-pad').scope, 'templates');
  assert.equal(where('--frame-sidebar-width').collection, 'spacing');
  assert.equal(where('--layer-modal').collection, 'elevation');
  assert.equal(where('--layer-frame-sidebar').collection, 'elevation');
  assert.equal(where('--layer-frame-sidebar').scope, 'templates');
  assert.equal(where('--card-pad').scope, 'components');
});

test('scope follows the family: page-level tokens are Templates, card, modal, popup and table are Components', () => {
  const scopeOf = (family) => {
    const scopes = new Set();
    for (const name of names) {
      if (!name.startsWith(`--${family}-`)) continue;
      const p = where(name);
      if (p.collection === 'spacing') scopes.add(p.scope);
    }
    return [...scopes];
  };
  for (const f of ['page', 'section']) assert.deepEqual(scopeOf(f), ['templates'], f);
  for (const f of ['card', 'modal', 'popup', 'table']) assert.deepEqual(scopeOf(f), ['components'], f);
});

test('the audit names no token twice and gives each a proposed name', () => {
  const rows = tokenNamingAudit(records);
  assert.equal(new Set(rows.map((r) => r.token)).size, rows.length);
  for (const r of rows) {
    assert.ok(r.token && r.collection && r.problem && r.proposed, JSON.stringify(r));
    assert.notEqual(r.token, r.proposed, JSON.stringify(r));
  }
});


test('Skeleton colors stay in Color and all Skeleton dimensions stay in Spacing and size', () => {
  const skeleton = names.filter((name) => name.startsWith('--skeleton-'));
  assert.equal(skeleton.length, 10);
  for (const name of skeleton) {
    assert.deepEqual(where(name), {
      collection: name === '--skeleton-subtle' ? 'color' : 'spacing',
      tier: 'semantic', scope: 'components',
    }, name);
  }
});

test('typography size spelling has zero naming outliers', () => {
  assert.deepEqual(tokenNamingAudit(records).filter((row) => row.problem.startsWith('Size step spelled out')), []);
});

test('no docs file imports a token stylesheet raw or reads tokens a second way', () => {
  const files = documents('design-system/src/storybook-docs', { ext: ['.js', '.jsx', '.mjs', '.mdx'] }).filter((f) => !/\.test\./.test(f));
  assert.ok(files.length > 20, `only ${files.length} docs files read`);
  for (const file of files) {
    const src = text(file);
    assert.equal(/tokens\/[\w/-]*\.scss\?raw/.test(src), false, `${file} imports a token stylesheet raw`);
    assert.equal(/\b(?:readTokens|tokenCorpus|collectTokens|readDarkTokens)\(/.test(src), false, `${file} collects tokens itself`);
  }
});
