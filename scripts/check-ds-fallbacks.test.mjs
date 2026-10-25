/**
 * `check:ds-fallbacks` — no `--ds-*` token written with a fallback.
 *
 * The measurement is driven on strings; the gate on a fixture tree, with a
 * fallback planted, because a check only ever run against a clean repo is a
 * check nobody has watched fail.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { MIN_FILES, dsFallbacks, run } from './check-ds-fallbacks.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

/** A fixture tree is far under the floor; its findings are read without that one. */
const FLOOR = /files searched, fewer than/;
const planted = (root) => messagesOf(run, root).filter((message) => !FLOOR.test(message));

const file = (text) => [{ path: 'a.scss', text }];

test('a literal fallback on a --ds- token is found, with its line', () => {
  const found = dsFallbacks(file('.a {}\n.b { color: var(--ds-text, #172b4d); }\n'));
  assert.deepEqual(found, [{ file: 'a.scss', line: 2, token: '--ds-text' }]);
});

test('a color function, a keyword and a nested var() are all fallbacks', () => {
  const found = dsFallbacks(
    file(
      [
        '.a { background: var(--ds-surface, rgba(255, 255, 255, 1)); }',
        '.b { color: var( --ds-text-subtle , white); }',
        '.c { border-color: var(--ds-border, var(--color-outline-variant)); }',
      ].join('\n'),
    ),
  );
  assert.deepEqual(found.map((f) => f.token), ['--ds-surface', '--ds-text-subtle', '--ds-border']);
});

test('a fallback written across lines is found, on the line its var( opens', () => {
  const found = dsFallbacks(
    file('.a {\n  color: var(--ds-text);\n  border-color: var(\n    --ds-border,\n    #000\n  );\n}\n'),
  );
  assert.deepEqual(found, [{ file: 'a.scss', line: 3, token: '--ds-border' }]);
});

test('a bare --ds- token, and a --color- token with a fallback, are not findings here', () => {
  // The legacy set's fallbacks are `check:color-fallbacks`' record, not this rule.
  const found = dsFallbacks(
    file('.a { color: var(--ds-text); border-color: var(--color-primary, #0472a8); }\n'),
  );
  assert.deepEqual(found, []);
});

test('a --ds- token used as the FALLBACK of a legacy token is not a --ds- fallback', () => {
  assert.deepEqual(dsFallbacks(file('.a { color: var(--color-x, var(--ds-text)); }\n')), []);
});

test('a planted fallback in a fixture tree fails the check, and the generated files are not read', () => {
  const { root, done } = policyTree(
    {
      'design-system/src/tokens/color/_semantic.scss': ':root { --ds-text: var(--palette-neutral-1000, #000); }\n',
      'design-system/src/a.scss': '.a { color: var(--ds-text); }\n.b { outline-color: var(--ds-border-focused, #147b84); }\n',
      'prototypes/p.jsx': "const s = { color: 'var(--ds-link, blue)' };\n",
    },
    { git: true },
  );
  try {
    const found = planted(root);
    assert.deepEqual(found, [
      'design-system/src/a.scss:2 writes --ds-border-focused with a fallback.',
      'prototypes/p.jsx:1 writes --ds-link with a fallback.',
    ]);
  } finally {
    done();
  }
});

test('a tree with no fallback on any --ds- token is clean', () => {
  const { root, done } = policyTree(
    { 'design-system/src/a.scss': '.a { color: var(--ds-text); }\n' },
    { git: true },
  );
  try {
    assert.deepEqual(planted(root), []);
  } finally {
    done();
  }
});

test('a tree under the file floor is a finding, not a clean sweep', () => {
  const { root, done } = policyTree({ 'design-system/src/a.scss': '.a {}\n' }, { git: true });
  try {
    const [first] = messagesOf(run, root);
    assert.equal(first, `1 files searched, fewer than the ${MIN_FILES} this was measured over.`);
  } finally {
    done();
  }
});
