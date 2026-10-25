import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { tokenSources } from '../design-system/src/lib/tokens-node.mjs';
import { COLOR_SPEC, deriveCandidates, specCodeSyntax } from './generate-token-registry.mjs';

const COLLECTION = 'colors / accent';

test('a Border Subtle variable maps to its -border-subtle token first', () => {
  assert.equal(deriveCandidates(COLLECTION, 'Success/Success Border Subtle')[0], '--color-success-border-subtle');
});

test('a Border Subtle variable never falls back to the 3:1 -border role', () => {
  // Primary has no -border-subtle token. If a candidate ever named
  // --color-primary-border, the pale label border would silently bind to the
  // 3:1 role instead of being reported as unresolved.
  const candidates = deriveCandidates(COLLECTION, 'Primary/Primary Border Subtle');
  assert.equal(candidates.includes('--color-primary-border'), false, candidates.join(', '));
});

test('the 3:1 Border role still maps to -border', () => {
  assert.equal(deriveCandidates(COLLECTION, 'Success/Success Border')[0], '--color-success-border');
});

test('a layout min or max height maps to its --layout-*-height-* token', () => {
  assert.equal(deriveCandidates('size / layout', 'Min Heights/listbox')[0], '--layout-min-height-listbox');
  assert.equal(deriveCandidates('size / layout', 'Max Heights/listbox')[0], '--layout-max-height-listbox');
  assert.equal(deriveCandidates('size / layout', 'Min Heights/card-body')[0], '--layout-min-height-card-body');
});

test('a typography variable maps by its folder: the same rule the type generator uses', () => {
  assert.deepEqual(deriveCandidates('typography', 'Font size/0875'), ['--font-size-0875']);
  assert.deepEqual(deriveCandidates('typography', 'Line height/125'), ['--line-height-125']);
  assert.deepEqual(deriveCandidates('typography', 'Family/heading'), ['--type-family-heading']);
  assert.deepEqual(deriveCandidates('typography', 'Weight/medium'), ['--type-weight-medium']);
});

/*
 * THE COLOR FOUNDATIONS CARRY THEIR CODE NAME. The generated Figma spec writes
 * each `--ds-*` variable's code syntax beside it, so the registry reads that
 * rather than deriving a `--color-${slug}` name the new set does not use.
 */
const SPEC = {
  collections: [
    { name: 'color / primitives', variables: [{ name: 'teal/100', value: { r: 1, g: 1, b: 1, a: 1 } }] },
    {
      name: 'color / foundations',
      variables: [
        { name: 'color/text/brand', codeSyntax: { WEB: 'var(--ds-text-brand)' } },
        { name: 'elevation/surface/raised/default', codeSyntax: { WEB: 'var(--ds-surface-raised)' } },
        { name: 'elevation/shadow/raised/layer-1', codeSyntax: {} },
      ],
    },
  ],
};

test('the spec code syntax is read per collection, and a variable without one is left out', () => {
  const syntax = specCodeSyntax(SPEC);
  assert.deepEqual([...syntax.keys()], ['color / foundations']);
  assert.deepEqual([...syntax.get('color / foundations')], [
    ['color/text/brand', '--ds-text-brand'],
    ['elevation/surface/raised/default', '--ds-surface-raised'],
  ]);
});

test('a color foundations variable maps to its code syntax, not a derived --color- name', () => {
  const codeSyntax = specCodeSyntax(SPEC).get('color / foundations');
  assert.deepEqual(deriveCandidates('color / foundations', 'color/text/brand', { codeSyntax }), ['--ds-text-brand']);
  assert.deepEqual(
    deriveCandidates('color / foundations', 'elevation/surface/raised/default', { codeSyntax }),
    ['--ds-surface-raised'],
  );
});

test('the legacy color collections still derive their --color- names', () => {
  const codeSyntax = specCodeSyntax(SPEC).get('color / foundations');
  assert.equal(deriveCandidates(COLLECTION, 'Success/Success Border', { codeSyntax })[0], '--color-success-border');
});

test('the live spec maps every --ds- semantic token, and every one exists in the token sheets', () => {
  const syntax = specCodeSyntax(JSON.parse(fs.readFileSync(COLOR_SPEC, 'utf8')));
  const foundations = syntax.get('color / foundations');
  assert.ok(foundations.size > 500, `${foundations.size} foundations with code syntax`);
  const defined = new Set(
    tokenSources().flatMap((source) => [...source.text.matchAll(tokenDeclarationPattern('--ds-'))].map((m) => m[1])),
  );
  const missing = [...foundations.values()].filter((token) => !defined.has(token));
  assert.deepEqual(missing, []);
});
