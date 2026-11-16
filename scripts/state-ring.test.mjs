import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import * as sass from 'sass';

const STYLES = path.join(path.dirname(fileURLToPath(import.meta.url)), '../design-system/src/styles');
const compile = (body) =>
  sass.compileString(`@use 'state' as *;\n.row { @include plus-state((), ${body}); }`, { loadPaths: [STYLES] }).css;

test('plus-state draws an inset ring with a valid width', () => {
  // The offset used to double as the outline width, so an inset ring asked for
  // a negative width: invalid, and the browser dropped the whole outline.
  const css = compile('$ring-offset: calc(-1 * var(--focus-ring-width))');
  assert.match(css, /outline: var\(--focus-ring-width\) solid var\(--ds-border-focused\)/);
  assert.match(css, /outline-offset: calc\(-1 \* var\(--focus-ring-width\)\)/);
});

test('plus-state keeps the default ring outside the edge', () => {
  const css = compile('$ring: true');
  assert.match(css, /outline: var\(--focus-ring-width\) solid var\(--ds-border-focused\)/);
  assert.match(css, /outline-offset: var\(--focus-ring-width\)/);
});
