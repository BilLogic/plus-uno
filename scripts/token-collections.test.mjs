/**
 * The token collections the Foundations ▸ Tokens pages show: every token in the
 * source lands in exactly one collection, one tier and (for a semantic) one
 * scope, so no page repeats a token and none is left out.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { tokenCorpus } from '../design-system/src/lib/tokens-node.mjs';
import {
  COLLECTIONS,
  SCOPES,
  TIERS,
  groupBySection,
  placeToken,
  tokenNamingAudit,
} from '../design-system/src/storybook-docs/lib/token-collections.mjs';

const corpus = tokenCorpus();
const names = [...corpus.keys()];

test('the source has tokens to place', () => {
  assert.ok(names.length > 1000, `only ${names.length} tokens read`);
});

test('every token lands in exactly one collection, tier and scope', () => {
  const unplaced = [];
  for (const [name, entry] of corpus) {
    const place = placeToken(name, entry.file);
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
  for (const collection of COLLECTIONS) {
    for (const section of groupBySection(corpus, collection)) {
      for (const t of section.tokens) {
        assert.equal(seen.has(t.name), false, `${t.name} is on ${seen.get(t.name)} and ${collection}`);
        seen.set(t.name, collection);
      }
    }
  }
  assert.equal(seen.size, names.length);
});

test('frame tokens sit on Spacing and size and layer tokens on Elevation and layers', () => {
  assert.equal(placeToken('--page-pad', 'ladder/_patterns.scss').collection, 'spacing');
  assert.equal(placeToken('--page-pad', 'ladder/_patterns.scss').scope, 'templates');
  assert.equal(placeToken('--frame-sidebar-width', 'ladder/_patterns.scss').collection, 'spacing');
  assert.equal(placeToken('--layer-modal', 'ladder/_layers.scss').collection, 'elevation');
  assert.equal(placeToken('--frame-layer-sidebar', '_frame_layers.scss').collection, 'elevation');
  assert.equal(placeToken('--frame-layer-sidebar', '_frame_layers.scss').scope, 'templates');
  assert.equal(placeToken('--card-pad-default', 'ladder/_patterns.scss').scope, 'components');
});

test('the audit names no token twice and gives each a proposed name', () => {
  const rows = tokenNamingAudit(corpus);
  assert.equal(new Set(rows.map((r) => r.token)).size, rows.length);
  for (const r of rows) assert.ok(r.token && r.collection && r.problem && r.proposed, JSON.stringify(r));
});
