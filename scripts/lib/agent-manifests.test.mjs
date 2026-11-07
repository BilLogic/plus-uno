import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComponentsManifest,
  buildTokensManifest,
  deprecationOf,
  serializeManifest,
} from './agent-manifests.mjs';

const button = {
  name: 'Button',
  group: 'forms-and-inputs',
  source: 'design-system/src/components/forms-and-inputs/Button/Button.jsx',
  summary: 'Universal interactive element.',
  props: [
    { name: 'appearance', type: 'enum', description: 'How loud the button is.', enumValues: ['primary', 'subtle'] },
    { name: 'size', type: 'enum', description: '@deprecated use `spacing` instead.', enumValues: ['small', 'medium'] },
    { name: 'onClick', type: 'func (required)', description: '', enumValues: null },
  ],
  defaults: { appearance: "'primary'" },
  descriptions: { onClick: 'Called on press.' },
};

test('one record per barrel export, in name order, with the import path', () => {
  const m = buildComponentsManifest({ exports: ['Card', 'Button'], components: [button], version: '1.2.3' });
  assert.equal(m.version, '1.2.3');
  assert.deepEqual(m.components.map((c) => c.name), ['Button', 'Card']);
  assert.equal(m.components[0].import, "import { Button } from '@/components';");
});

test('a pattern is a record of kind pattern, imported from its own barrel, with props from source', () => {
  const card = { ...button, name: 'PatternCard', group: 'patterns', source: 'design-system/src/patterns/PatternCard/PatternCard.jsx' };
  const m = buildComponentsManifest({
    exports: ['Button'],
    patterns: [{ name: 'PatternCard', from: '@/patterns' }],
    components: [button],
    parsedPatterns: [card],
    version: '0',
  });
  const [b, p] = m.components;
  assert.equal(b.kind, 'component');
  assert.equal(p.kind, 'pattern');
  assert.equal(p.import, "import { PatternCard } from '@/patterns';");
  assert.deepEqual(p.props.find((x) => x.name === 'appearance').values, ['primary', 'subtle']);
});

test('a name both a component and a pattern is refused', () => {
  assert.throws(
    () => buildComponentsManifest({ exports: ['Button'], patterns: [{ name: 'Button', from: '@/patterns' }], components: [button], version: '0' }),
    /Button is exported from both @\/components and @\/patterns/,
  );
});

test('a barrel export with no parsed component is still listed, with props unknown', () => {
  const m = buildComponentsManifest({ exports: ['Button', 'useToast'], components: [button], version: '0' });
  const hook = m.components.find((c) => c.name === 'useToast');
  assert.equal(hook.props, null);
  assert.equal(hook.source, null);
});

test('a parsed component the barrel does not export is left out', () => {
  const internal = { ...button, name: 'Footer', group: '_internal' };
  const m = buildComponentsManifest({ exports: ['Button'], components: [button, internal], version: '0' });
  assert.deepEqual(m.components.map((c) => c.name), ['Button']);
});

test('props carry enum values, defaults, required and the best description', () => {
  const [b] = buildComponentsManifest({ exports: ['Button'], components: [button], version: '0' }).components;
  const appearance = b.props.find((p) => p.name === 'appearance');
  assert.deepEqual(appearance.values, ['primary', 'subtle']);
  assert.equal(appearance.default, "'primary'");
  assert.equal(appearance.required, false);
  const onClick = b.props.find((p) => p.name === 'onClick');
  assert.equal(onClick.type, 'func');
  assert.equal(onClick.required, true);
  assert.equal(onClick.description, 'Called on press.');
  assert.equal(onClick.values, null);
});

test('a prop marked @deprecated says so and names its replacement', () => {
  const [b] = buildComponentsManifest({ exports: ['Button'], components: [button], version: '0' }).components;
  const size = b.props.find((p) => p.name === 'size');
  assert.deepEqual(size.deprecated, { replacement: 'spacing' });
  assert.equal(b.props.find((p) => p.name === 'appearance').deprecated, null);
});

test('deprecationOf reads the replacement when one is named, and only then', () => {
  assert.deepEqual(deprecationOf('@deprecated use `spacing` instead'), { replacement: 'spacing' });
  assert.deepEqual(deprecationOf('@deprecated'), { replacement: null });
  assert.equal(deprecationOf('Deprecated sizes draw like medium'), null);
  assert.deepEqual(deprecationOf('Deprecated: scrolls the body. Use `height` instead.'), { replacement: 'height' });
});

test('tokens: one record per name, tier and group from the section, first value kept', () => {
  const m = buildTokensManifest([
    { group: 'Color Tokens', tier: 'semantic', tokens: [{ name: '--ds-text', value: 'var(--palette-neutral-1000)' }] },
    { group: 'Color Primitives', tier: 'primitive', tokens: [{ name: '--palette-neutral-1000', value: '#172b4d' }] },
    { group: 'Frame and Layer Tokens', tier: 'pattern', tokens: [{ name: '--card-pad-default', value: 'var(--space-200)' }] },
  ]);
  assert.deepEqual(m.tokens.map((t) => t.name), ['--card-pad-default', '--ds-text', '--palette-neutral-1000']);
  const text = m.tokens.find((t) => t.name === '--ds-text');
  assert.equal(text.tier, 'semantic');
  assert.equal(text.group, 'Color Tokens');
  assert.equal(text.value, 'var(--palette-neutral-1000)');
  assert.equal(text.intent, null);
});

test('tokens: a name in two sections keeps the first section and is not duplicated', () => {
  const m = buildTokensManifest([
    { group: 'A', tier: 'semantic', tokens: [{ name: '--x', value: '1px' }] },
    { group: 'B', tier: 'primitive', tokens: [{ name: '--x', value: '2px' }] },
  ]);
  assert.equal(m.tokens.length, 1);
  assert.equal(m.tokens[0].group, 'A');
});

test('tokens: the component tier is accepted for when component tokens join the view', () => {
  const m = buildTokensManifest([{ group: 'Button', tier: 'component', tokens: [{ name: '--button-radius', value: 'var(--radius-md)' }] }]);
  assert.equal(m.tokens[0].tier, 'component');
});

test('tokens: an unknown tier is refused', () => {
  assert.throws(() => buildTokensManifest([{ group: 'A', tier: 'base', tokens: [] }]), /tier/);
});

test('serialized manifests carry the generated header and end in a newline', () => {
  const out = serializeManifest({ components: [] }, 'npm run generate:agent');
  const parsed = JSON.parse(out);
  assert.match(parsed.$generated, /DO NOT EDIT BY HAND.*npm run generate:agent/);
  assert.ok(out.endsWith('\n'));
  assert.equal(Object.keys(parsed)[0], '$generated');
});
