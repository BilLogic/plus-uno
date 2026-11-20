import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveStyleSource } from './style-sources.mjs';

const files = [
  'components/forms-and-inputs/Button/Button.scss',
  'components/text-and-data-display/Table/Table.scss',
  'templates/Table/Table.scss',
  'lib/field/FieldBox.scss',
  'styles/_state.scss',
];

test('a name finds its file wherever the folder is', () => {
  assert.equal(resolveStyleSource(files, 'Button.scss'), 'components/forms-and-inputs/Button/Button.scss');
  assert.equal(resolveStyleSource(files, '_state.scss'), 'styles/_state.scss');
});

test('a moved file is still found, with no change to the name', () => {
  const moved = files.map((f) => f.replace('components/forms-and-inputs/Button', 'lib/button'));
  assert.equal(resolveStyleSource(moved, 'Button.scss'), 'lib/button/Button.scss');
});

test('a renamed file is not found', () => {
  const renamed = files.map((f) => f.replace('FieldBox.scss', 'FieldShell.scss'));
  assert.throws(() => resolveStyleSource(renamed, 'FieldBox.scss'), /No style file matches "FieldBox.scss"/);
});

test('a shared name needs its folder', () => {
  assert.throws(() => resolveStyleSource(files, 'Table.scss'), /matches 2 style files/);
  assert.equal(resolveStyleSource(files, 'templates/**/Table.scss'), 'templates/Table/Table.scss');
  assert.throws(() => resolveStyleSource(files, 'Table/Table.scss'), /matches 2 style files/);
  assert.equal(resolveStyleSource(files, 'components/**/Table.scss'), files[1]);
  const moved = files.map((f) => f.replace('text-and-data-display', 'data'));
  assert.equal(resolveStyleSource(moved, 'components/**/Table.scss'), 'components/data/Table/Table.scss');
});

test('a partial folder name does not match mid-segment', () => {
  assert.throws(() => resolveStyleSource(files, 'utton.scss'), /No style file matches/);
});
