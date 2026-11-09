import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { tokenSources } from '../design-system/src/lib/tokens-node.mjs';
import { ARCHIVED_COLLECTION, COLOR_SPEC, deriveCandidates, specCodeSyntax } from './generate-token-registry.mjs';

test('the archived color and size collections are not mapped', () => {
  for (const collection of ['colors / accent', 'colors / neutral', 'size / layout', 'size / primitive', 'size / semantics']) {
    assert.equal(ARCHIVED_COLLECTION.test(collection), true, collection);
  }
  for (const collection of ['color / foundations', 'spacing / primitives', 'spacing / layout', 'typography']) {
    assert.equal(ARCHIVED_COLLECTION.test(collection), false, collection);
  }
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
 * rather than deriving a name from the path.
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

test('a color foundations variable maps to its code syntax, not a derived name', () => {
  const codeSyntax = specCodeSyntax(SPEC).get('color / foundations');
  assert.deepEqual(deriveCandidates('color / foundations', 'color/text/brand', { codeSyntax }), ['--ds-text-brand']);
  assert.deepEqual(
    deriveCandidates('color / foundations', 'elevation/surface/raised/default', { codeSyntax }),
    ['--ds-surface-raised'],
  );
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
