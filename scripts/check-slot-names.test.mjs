// The slot naming rule, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure } from './check-slot-names.mjs';

const src = (file, text) => ({ path: file, text });
const countOf = (sources, key) => measure(sources).get(key)?.count;

test('leadingVisual and trailingVisual are counted wherever they appear', () => {
  const jsx = '<StatusTag leadingVisual="check" />\n// trailingVisual is gone\nPropTypes.bool, trailingVisual: x\n';
  const found = measure([src('a.jsx', jsx)]);
  assert.equal(found.get('word:leadingVisual a.jsx').count, 1);
  assert.equal(found.get('word:trailingVisual a.jsx').count, 2);
});

test('a leading slot prop is counted in every shape it takes', () => {
  const cases = [
    '<FieldBox leading={x} />',
    '<FieldBox leading="x" />',
    'const o = { leading: <i /> };',
    'leading: PropTypes.node,',
    'leading?: *,',
    'const F = ({ leading, children }) => null;',
    '    leading,\n',
    'const v = option.leading;',
  ];
  for (const text of cases) assert.equal(countOf([src('a.jsx', text)], 'prop:leading a.jsx'), 1, text);
});

test('classes, prose and local variables are not slot props', () => {
  const clean = [
    '<span className="plus-option-row-leading">',
    '<div className="plus-field__leading">',
    'A leading icon or a trailing action.',
    'const leading = [];\nleading.push(x);',
    'leading-edge: 1;',
    'const leadingItems = a;',
  ];
  for (const text of clean) assert.equal(measure([src('a.jsx', text)]).size, 0, text);
});

test('the current names are clean', () => {
  const ok = '<Tag elemBefore={x} iconBefore="a" />\nelemBefore: PropTypes.node,\n';
  assert.equal(measure([src('a.jsx', ok)]).size, 0);
});
