import { test } from 'node:test';
import assert from 'node:assert/strict';

import { enumValuesOf } from './enum-values.mjs';

/** An in-memory tree: path → source. A directory resolves through its index.js. */
function tree(files) {
  return (file) => (Object.prototype.hasOwnProperty.call(files, file) ? files[file] : null);
}
const opts = { alias: { '@': '/r/src' } };

test('a constant in the same file', () => {
  const read = tree({ '/r/src/A.jsx': "export const SIZES = ['sm', 'md'];" });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(SIZES)', '/r/src/A.jsx', read, opts), ['sm', 'md']);
});

test('an imported constant, through a re-exporting index', () => {
  const read = tree({
    '/r/src/G/Group.jsx': "import { AVATAR_SIZES } from '../Avatar';",
    '/r/src/Avatar/index.js': "export { default, AVATAR_SIZES } from './Avatar';",
    '/r/src/Avatar/Avatar.jsx': 'export const AVATAR_SIZES = [16, 24, 32];',
  });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(AVATAR_SIZES)', '/r/src/G/Group.jsx', read, opts), ['16', '24', '32']);
});

test('an aliased import and a renamed specifier', () => {
  const read = tree({
    '/r/src/X.jsx': "import { BUTTON_APPEARANCES as APPEARANCES } from '@/Button/Button';",
    '/r/src/Button/Button.jsx': "export const BUTTON_APPEARANCES = ['primary', 'subtle'];",
  });
  // The prop names the local alias; the lookup follows it to the exported name.
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(APPEARANCES)', '/r/src/X.jsx', read, opts), ['primary', 'subtle']);
  const read2 = tree({
    '/r/src/X.jsx': "import { BUTTON_APPEARANCES } from '@/Button/Button';",
    '/r/src/Button/Button.jsx': "export const BUTTON_APPEARANCES = ['primary', 'subtle'];",
  });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(BUTTON_APPEARANCES)', '/r/src/X.jsx', read2, opts), ['primary', 'subtle']);
});

test('spreads of other constants, in order, without duplicates', () => {
  const read = tree({
    '/r/src/I.jsx': "const SMART = ['a', 'b'];\nconst MATH = ['c', 'a'];\nexport const ALL = [...SMART, ...MATH, 'd'];",
  });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(ALL)', '/r/src/I.jsx', read, opts), ['a', 'b', 'c', 'd']);
});

test('Object.keys of an object literal, quoted and bare keys', () => {
  const read = tree({ '/r/src/S.jsx': "export const RADII = {\n  none: '0',\n  'card-radius-sm': 'var(--x)', // note\n};" });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(Object.keys(RADII))', '/r/src/S.jsx', read, opts), ['none', 'card-radius-sm']);
});

test('anything unreadable gives null, never a partial list', () => {
  const read = tree({
    '/r/src/C.jsx': "export const NAMES = ['a', makeName()];\nexport const FROM_PKG = ['x'];\nimport { EXT } from 'some-package';",
  });
  assert.equal(enumValuesOf('PropTypes.oneOf(NAMES)', '/r/src/C.jsx', read, opts), null);
  assert.equal(enumValuesOf('PropTypes.oneOf(EXT)', '/r/src/C.jsx', read, opts), null);
  assert.equal(enumValuesOf('PropTypes.oneOf(MISSING)', '/r/src/C.jsx', read, opts), null);
  assert.equal(enumValuesOf('PropTypes.string', '/r/src/C.jsx', read, opts), null);
});

test('a renamed re-export is followed to the original name', () => {
  const read = tree({
    '/r/src/X.jsx': "import { SIZES } from './index';",
    '/r/src/index.js': "export { AVATAR_SIZES as SIZES } from './Avatar';",
    '/r/src/Avatar.jsx': 'export const AVATAR_SIZES = [16, 24];',
  });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(SIZES)', '/r/src/X.jsx', read, opts), ['16', '24']);
});

test('a named import beside a default import', () => {
  const read = tree({
    '/r/src/S.jsx': "import CountTag, { COUNT_APPEARANCES, formatCount } from './CountTag';",
    '/r/src/CountTag.jsx': "export const COUNT_APPEARANCES = ['neutral', 'danger'];",
  });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(COUNT_APPEARANCES)', '/r/src/S.jsx', read, opts), ['neutral', 'danger']);
});

test('a spread of Object.keys inside an array', () => {
  const read = tree({
    '/r/src/K.jsx': "const SHAPES = ['line', 'circle'];\nconst PRESETS = { card: 1, row: 2 };\nexport const ALL = [...SHAPES, ...Object.keys(PRESETS)];",
  });
  assert.deepEqual(enumValuesOf('PropTypes.oneOf(ALL)', '/r/src/K.jsx', read, opts), ['line', 'circle', 'card', 'row']);
});

test('a re-export cycle stops instead of looping', () => {
  const read = tree({
    '/r/src/a.js': "export * from './b';",
    '/r/src/b.js': "export * from './a';",
    '/r/src/X.jsx': "import { Z } from './a';",
  });
  assert.equal(enumValuesOf('PropTypes.oneOf(Z)', '/r/src/X.jsx', read, opts), null);
});
