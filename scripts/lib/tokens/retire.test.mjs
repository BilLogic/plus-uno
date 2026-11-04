import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dropRetired } from './retire.mjs';

const retired = new Set(['--old-a', '--old-b']);

test('a retired declaration is dropped and a live one stays', () => {
  const out = dropRetired(':root {\n    --old-a: 1px;\n    --live: 2px; /* kept */\n}\n', retired);
  assert.equal(out, ':root {\n    --live: 2px; /* kept */\n}\n');
});

test('a section comment left empty goes with its declarations', () => {
  const scss = ':root {\n    /* Gone */\n    --old-a: 1px;\n    --old-b: 2px;\n\n    /* Kept */\n    --live: 3px;\n}\n';
  assert.equal(dropRetired(scss, retired), ':root {\n    /* Kept */\n    --live: 3px;\n}\n');
});

test('a media block whose only declarations were retired is removed', () => {
  const scss = ':root {\n    --live: 1px;\n}\n\n@media (min-width: 1024px) {\n    :root {\n        --old-a: 2px;\n    }\n}\n';
  assert.equal(dropRetired(scss, retired), ':root {\n    --live: 1px;\n}\n');
});

test('nothing retired leaves the text unchanged', () => {
  const scss = ':root {\n    /* Kept */\n    --live: 3px;\n}\n';
  assert.equal(dropRetired(scss, retired), scss);
});

test('a top-level comment left at the end of the file by a removed block goes too', () => {
  const scss = ':root {\n    --live: 1px;\n}\n\n/* A short screen */\n@media (max-height: 600px) {\n    :root {\n        --old-a: 2px;\n    }\n}\n';
  assert.equal(dropRetired(scss, retired), ':root {\n    --live: 1px;\n}\n');
});
