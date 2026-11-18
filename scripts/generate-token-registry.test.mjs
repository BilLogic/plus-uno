import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { tokenSources } from '../design-system/src/lib/tokens-node.mjs';
import {
  ARCHIVED_COLLECTION,
  build,
  buildFigmaVariableMappings,
  COLOR_SPEC,
  deriveCandidates,
  parseWebCodeSyntax,
  specCodeSyntax,
} from './generate-token-registry.mjs';

test('collections prefixed with "archived / " are skipped, and active collections are not', () => {
  for (const collection of [
    'archived / colors / accent',
    'archived / colors / neutral',
    'archived / size / layout',
    'archived / size / primitive',
    'archived / size / semantics',
    'archived / spacing / layout',
    'archived / color / templates',
  ]) {
    assert.equal(ARCHIVED_COLLECTION.test(collection), true, collection);
  }
  for (const collection of ['color / semantics', 'color / primitives', 'spacing / primitives', 'typography', 'motion']) {
    assert.equal(ARCHIVED_COLLECTION.test(collection), false, collection);
  }
});

test('a typography variable maps by its folder: the same rule the type generator uses', () => {
  assert.deepEqual(deriveCandidates('typography', 'Font size/0875'), ['--type-size-0875']);
  assert.deepEqual(deriveCandidates('typography', 'Line height/125'), ['--type-line-height-125']);
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
    tokenSources().flatMap((source) => [...source.text.matchAll(tokenDeclarationPattern())].map((m) => m[1])),
  );
  const missing = [...foundations.values()].filter((token) => !defined.has(token));
  assert.deepEqual(missing, []);
});

const SAMPLE_SNAPSHOT = {
  capturedAt: '2026-11-16',
  totalVariables: 9,
  collections: {
    'archived / colors / accent': {
      modes: ['Light', 'Dark'],
      variables: ['Advocacy/Advocacy', 'Brand/Primary'],
      codeSyntax: { 'Advocacy/Advocacy': 'var(--ds-text)' },
    },
    'color / semantics': {
      modes: ['Light', 'Dark'],
      variables: ['color/text/default', 'color/text/stale'],
      codeSyntax: {
        'color/text/default': 'var(--ds-text)',
        'color/text/stale': 'var(--ds-does-not-exist)',
      },
    },
    'spacing / semantics': {
      modes: ['Default'],
      variables: ['Size/Control/xl'],
      codeSyntax: {
        'Size/Control/xl': 'var(--control-xl)',
      },
    },
    motion: {
      modes: ['Default'],
      variables: ['Spring/880/stiffness'],
      codeSyntax: {
        'Spring/880/stiffness': 'var(--motion-spring-880)',
      },
    },
    typography: {
      modes: ['Value'],
      variables: ['Font size/0875', 'Line height/125'],
      codeSyntax: {
        // Even though Font size/0875 would match --type-size-0875 by name rule,
        // an explicit code syntax naming a missing token must NOT fall back.
        'Font size/0875': 'var(--type-size-missing)',
      },
    },
    'color / primitives': {
      modes: ['Value'],
      variables: ['teal/100'],
      codeSyntax: {},
    },
  },
};

/** The SCSS tokens the sample resolves against: a fixture, so a token rename cannot break these tests. */
const DEFINED_TOKENS = () => new Set(['--ds-text', '--control-xl', '--motion-spring-880', '--type-line-height-125']);

test('a variable with codeSyntax.WEB resolves to that CSS token when defined in SCSS', () => {
  const result = buildFigmaVariableMappings(DEFINED_TOKENS(), { snapshot: SAMPLE_SNAPSHOT, specSyntax: new Map() });
  assert.equal(result.resolved['color / semantics']['color/text/default'], 'var(--ds-text)');
  assert.equal(result.resolved['spacing / semantics']['Size/Control/xl'], 'var(--control-xl)');
  assert.equal(result.resolved.motion['Spring/880/stiffness'], 'var(--motion-spring-880)');
});

test('a code syntax naming a missing SCSS token is reported as unresolved and does not fall back to name rules', () => {
  const result = buildFigmaVariableMappings(DEFINED_TOKENS(), { snapshot: SAMPLE_SNAPSHOT, specSyntax: new Map() });
  assert.equal(result.resolved['color / semantics']['color/text/stale'], undefined);
  assert.equal(result.resolved.typography['Font size/0875'], undefined);

  const stale = result.unresolved.find((u) => u.figmaVariable === 'color/text/stale');
  assert.deepEqual(stale, {
    collection: 'color / semantics',
    figmaVariable: 'color/text/stale',
    tried: ['--ds-does-not-exist'],
    reason: 'code syntax names a token the code does not have',
  });

  const noFallback = result.unresolved.find((u) => u.figmaVariable === 'Font size/0875');
  assert.deepEqual(noFallback, {
    collection: 'typography',
    figmaVariable: 'Font size/0875',
    tried: ['--type-size-missing'],
    reason: 'code syntax names a token the code does not have',
  });
});

test('a variable with no code syntax falls back to the name rules, and reports "no code syntax" when unmapped', () => {
  const result = buildFigmaVariableMappings(DEFINED_TOKENS(), { snapshot: SAMPLE_SNAPSHOT, specSyntax: new Map() });
  assert.equal(result.resolved.typography['Line height/125'], 'var(--type-line-height-125)');
  assert.equal(result.resolved['color / primitives']['teal/100'], undefined);

  const primitive = result.unresolved.find((u) => u.figmaVariable === 'teal/100');
  assert.deepEqual(primitive, {
    collection: 'color / primitives',
    figmaVariable: 'teal/100',
    tried: ['--100'],
    reason: 'no code syntax',
  });
});

test('archived collections are skipped, excluded from coverage counts, and reported as skipped rather than unresolved', () => {
  const result = buildFigmaVariableMappings(DEFINED_TOKENS(), { snapshot: SAMPLE_SNAPSHOT, specSyntax: new Map() });
  assert.equal('archived / colors / accent' in result.resolved, false);
  assert.equal(
    result.unresolved.some((u) => u.collection.startsWith('archived / ')),
    false,
  );
  assert.deepEqual(result.skippedCollections, [{ collection: 'archived / colors / accent', count: 2 }]);
  // 9 total in SAMPLE_SNAPSHOT minus 2 in archived = 7 non-archived variables (4 resolved + 3 unresolved)
  assert.equal(result.total, 7);
  assert.equal(result.unresolved.length, 3);
});

test('build populates validation.figmaVariableCoverage from non-archived collections with skippedCollections and reasons', () => {
  const { registry } = build({ snapshot: SAMPLE_SNAPSHOT, specSyntax: new Map() });
  const cov = registry.validation.figmaVariableCoverage;
  assert.equal(cov.total, 7);
  assert.equal(cov.resolved, 4);
  assert.equal(cov.percent, 57);
  assert.deepEqual(cov.skippedCollections, [{ collection: 'archived / colors / accent', count: 2 }]);
  assert.deepEqual(
    cov.unresolved.map((u) => [u.figmaVariable, u.reason]),
    [
      ['color/text/stale', 'code syntax names a token the code does not have'],
      ['Font size/0875', 'code syntax names a token the code does not have'],
      ['teal/100', 'no code syntax'],
    ],
  );
});

test('parseWebCodeSyntax reads the token from var() with or without a fallback, and rejects anything else', () => {
  assert.equal(parseWebCodeSyntax('var(--ds-text)'), '--ds-text');
  assert.equal(parseWebCodeSyntax('  var( --control-xl )  '), '--control-xl');
  assert.equal(parseWebCodeSyntax('var(--space-md, 4px)'), '--space-md');
  assert.equal(parseWebCodeSyntax('4px'), null);
  assert.equal(parseWebCodeSyntax(undefined), null);
});
