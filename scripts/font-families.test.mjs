/**
 * Tests for the font-stack guard.
 *
 * #191's rule: a guard nobody has watched fail is a guard nobody knows works.
 * The first three cases are the three defects this found in the tree — a token
 * with no generic, a fallback naming the header face where the token is the
 * body face, and #267's monospace measurement — and the rest are the shapes a
 * naive version would report wrongly.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GENERICS, failures, familyTokens, resolve, stack } from './font-families.mjs';
import { corpus } from './undefined-tokens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const file = (p, text) => ({ path: p, text });
const TOKENS = file(
  'tokens.scss',
  ':root {\n' +
    '  --font-family-header: "Lato", sans-serif;\n' +
    '  --font-family-body: "Merriweather Sans", "Open Sans", sans-serif;\n' +
    '  --font-family-title: var(--font-family-header);\n' +
    '  --font-family-code: "Source Code Pro", monospace;\n' +
    '}\n',
);

test('the tree as it stands has no findings', () => {
  const files = corpus(REPO_ROOT, ['design-system/src', '.storybook', 'prototypes']).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
  }));
  assert.deepEqual(failures(files), []);
});

test('display4: a token that names a face and no generic', () => {
  const found = failures([file('t.scss', ':root { --font-family-display4: "Open Sans"; }')]);
  assert.equal(found.length, 1);
  assert.match(found[0], /ends in "Open Sans", not a CSS generic/);
});

test('the wrong face: a body fallback that names the header face', () => {
  const found = failures([
    TOKENS,
    file('App.scss', ".a { font-family: var(--font-family-body, 'Lato', sans-serif); }"),
  ]);
  assert.equal(found.length, 1);
  assert.match(found[0], /names "Lato" where the token is "Merriweather Sans"/);
});

test("#267's measurement: a monospace token that falls back to sans-serif", () => {
  const found = failures([file('t.scss', ':root { --font-family-code: "Source Code Pro", sans-serif; }')]);
  assert.equal(found.length, 1);
  assert.match(found[0], /monospace token and falls back to "sans-serif"/);
  assert.match(found[0], /171\.13px/, 'the message carries the measurement, not an opinion');
});

test('a bare face name as the whole fallback is a finding', () => {
  const found = failures([TOKENS, file('a.jsx', "s = 'var(--font-family-header, Lato)'")]);
  assert.equal(found.length, 1);
  assert.match(found[0], /ends in "Lato", not a CSS generic/);
});

test('`inherit` is not a family', () => {
  const found = failures([TOKENS, file('a.jsx', "s = 'var(--font-family-body, inherit)'")]);
  assert.equal(found.length, 1);
  assert.match(found[0], /ends in "inherit"/);
});

/* ------------------------------------------------- what is NOT a finding */

test('a SHORTER stack is fine — a fallback is a safety net, not a duplicate', () => {
  // Drops "Open Sans" from the middle; still starts with the right face and
  // ends in a generic. 13 files in the tree do exactly this.
  const found = failures([
    TOKENS,
    file('a.scss', '.a { font-family: var(--font-family-body, "Merriweather Sans", sans-serif); }'),
  ]);
  assert.deepEqual(found, []);
});

test('a fallback of nothing but a generic claims no face, so it claims nothing wrong', () => {
  const found = failures([TOKENS, file('a.scss', '.a { font-family: var(--font-family-body, sans-serif); }')]);
  assert.deepEqual(found, []);
});

test('a fallback that is another family token cannot disagree with anything', () => {
  const found = failures([
    TOKENS,
    file('a.scss', '.a { font-family: var(--font-family-title, var(--font-family-header)); }'),
  ]);
  assert.deepEqual(found, []);
});

test('an alias resolves to the stack it points at', () => {
  const tokens = familyTokens([TOKENS]);
  assert.deepEqual(resolve('--font-family-title', tokens), ['Lato', 'sans-serif']);
  assert.equal(resolve('--font-family-nope', tokens), null);
});

test('a cycle resolves to null rather than hanging', () => {
  const tokens = familyTokens([
    file('t.scss', ':root { --font-family-a: var(--font-family-b); --font-family-b: var(--font-family-a); }'),
  ]);
  assert.equal(resolve('--font-family-a', tokens), null);
});

test('quotes are not part of a family name, and the generics are the CSS ones', () => {
  assert.deepEqual(stack('"Merriweather Sans", \'Open Sans\', sans-serif'), [
    'Merriweather Sans',
    'Open Sans',
    'sans-serif',
  ]);
  assert.ok(GENERICS.has('ui-monospace'));
  assert.ok(!GENERICS.has('Lato'));
});
