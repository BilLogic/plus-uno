/**
 * How `generate-component-docs.mjs` reads an enum named by a constant.
 *
 * The generator runs on import, so it cannot be imported here. It reads a
 * named enum through `resolveNamedOneOf` and `namedEnumValues` in
 * `doc-identifiers.mjs`, the same reader `check:doc-identifiers` uses, and
 * that is what these tests hold. `check:component-docs` then compares the
 * committed pages with a fresh run.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { namedEnumValues, resolveNamedOneOf } from './doc-identifiers.mjs';

test('a plain array of strings is read in order', () => {
  const source = "export const STYLES = ['primary', 'success'];\n";
  assert.deepEqual(namedEnumValues(source, 'STYLES'), ['primary', 'success']);
  assert.equal(
    resolveNamedOneOf('PropTypes.oneOf(STYLES)', source),
    "PropTypes.oneOf(['primary', 'success'])",
  );
});

test('double quotes read the same as single quotes', () => {
  const source = 'const KINDS = ["state", \'date\'];\n';
  assert.deepEqual(namedEnumValues(source, 'KINDS'), ['state', 'date']);
});

test('an array with a spread stays unresolved rather than listing part of it', () => {
  // Tag: `TAG_TYPES = ['plain', ...AVATAR_TAG_TYPES]`. Reading only the
  // literals documented `plain` as the one legal type.
  const source = "const AVATAR = ['person', 'agent', 'team'];\nconst TYPES = ['plain', ...AVATAR];\n";
  assert.equal(namedEnumValues(source, 'TYPES'), null);
  assert.equal(resolveNamedOneOf('PropTypes.oneOf(TYPES)', source), 'PropTypes.oneOf(TYPES)');
});

test('any element that is not a string or number literal stays unresolved', () => {
  assert.equal(namedEnumValues("const X = ['a', OTHER];", 'X'), null);
  assert.equal(namedEnumValues("const X = ['a', `b`];", 'X'), null);
});

test('a numeric array lists its numbers', () => {
  const source = 'export const SIZES = [16, 20, 24];\n';
  assert.deepEqual(namedEnumValues(source, 'SIZES'), ['16', '20', '24']);
  assert.equal(resolveNamedOneOf('PropTypes.oneOf(SIZES)', source), 'PropTypes.oneOf([16, 20, 24])');
});

test('every named oneOf in a type is resolved, not only the first', () => {
  const source = "const A = ['a'];\nconst B = ['b'];\n";
  assert.equal(
    resolveNamedOneOf('PropTypes.oneOfType([PropTypes.oneOf(A), PropTypes.oneOf(B)])', source),
    "PropTypes.oneOfType([PropTypes.oneOf(['a']), PropTypes.oneOf(['b'])])",
  );
});

test('a constant from another module stays as written', () => {
  assert.equal(resolveNamedOneOf('PropTypes.oneOf(SIZES)', 'import { SIZES } from "./s";'), 'PropTypes.oneOf(SIZES)');
});
