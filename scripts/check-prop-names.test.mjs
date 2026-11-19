// The prop-name rule, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findingsOf, run } from './check-prop-names.mjs';
import { BARE_BOOLEANS, ALLOWED, isName, ruleFor } from './lib/prop-names.mjs';

const facts = (...components) => ({ components });
const comp = (name, ...props) => ({ name, source: `design-system/src/${name}.jsx`, props: props.map(([n, type]) => ({ name: n, type })) });

test('a bare boolean state prop is a finding that names the is… prop', () => {
  for (const bare of BARE_BOOLEANS) {
    const found = findingsOf(facts(comp('Widget', [bare, 'bool'])));
    assert.equal(found.length, 1, bare);
    assert.match(found[0].message, new RegExp(`name it \`${isName(bare)}\``));
  }
});

test('the is… name is the bare name with a capital', () => {
  assert.equal(isName('readOnly'), 'isReadOnly');
  assert.equal(isName('open'), 'isOpen');
});

test('variant and tone are findings whatever their type', () => {
  const found = findingsOf(facts(comp('Widget', ['variant', 'oneOf'], ['tone', 'string'])));
  assert.deepEqual(found.map((f) => f.message), ['Widget `variant`: name it `appearance`', 'Widget `tone`: name it `appearance or type`']);
});

test('is… props, handlers and a non-boolean selected are not findings', () => {
  const clean = comp('Widget', ['isDisabled', 'bool'], ['isOpen', 'bool'], ['defaultOpen', 'bool'], ['onOpenChange', 'func'], ['selected', 'string or instanceOf'], ['appearance', 'oneOf']);
  assert.deepEqual(findingsOf(facts(clean)), []);
});

test('an allowed bare name passes for its component only', () => {
  const { component, prop } = ALLOWED[0];
  assert.deepEqual(findingsOf(facts(comp(component, [prop, 'bool']))), []);
  assert.equal(findingsOf(facts(comp('Elsewhere', [prop, 'bool']))).length, 1);
});

test('ruleFor reads one rule for every caller', () => {
  assert.equal(ruleFor({ name: 'disabled', type: 'bool' }).use, 'isDisabled');
  assert.equal(ruleFor({ name: 'disabled', type: 'string' }), null);
});

test('the tree has no bare boolean or variant/tone', () => {
  assert.deepEqual(run(), []);
});
