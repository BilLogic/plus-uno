/**
 * Tests for the undefined-token guard.
 *
 * #191's rule: a guard nobody has watched fail is a guard nobody knows works.
 * The first case here is the defect as it actually shipped — six components
 * asking for `--font-weight-light` against a system that defines
 * `--font-weight-normal: 300` — and each of the rest is one way the scanner
 * would report something untrue if it were naive.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  audit,
  corpus,
  definitions,
  isInterpolated,
  ratchetFailures,
  stripComments,
  usages,
} from './undefined-tokens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const file = (p, text) => ({ path: p, text });

test('the shipped defect: a used-and-undefined token is found, and counted as bare', () => {
  const { undefinedTokens } = audit([
    file('tokens.scss', ':root { --font-weight-normal: 300; }'),
    file('Select.scss', '.x { font-weight: var(--font-weight-light); }'),
  ]);
  assert.deepEqual(Object.keys(undefinedTokens), ['--font-weight-light']);
  assert.equal(undefinedTokens['--font-weight-light'].bare, 1);
});

test('a fallback is a different defect from a bare use, and is counted apart', () => {
  const { undefinedTokens } = audit([file('a.scss', '.x { font-size: var(--nope, 14px); }')]);
  assert.equal(undefinedTokens['--nope'].uses, 1);
  assert.equal(undefinedTokens['--nope'].bare, 0, 'the page renders; only the name is fiction');
});

test('a property a component sets on itself in JSX is DEFINED', () => {
  // NumberInput really does this: `style={{ '--bg-color': getBackgroundColor() }}`
  // read back by `background: var(--bg-color)` in its SCSS. A scanner that only
  // read stylesheets would call every one of those undefined.
  const { undefinedTokens } = audit([
    file('N.jsx', "const s = { '--bg-color': colour, };"),
    file('N.scss', '.n { background: var(--bg-color); }'),
  ]);
  assert.deepEqual(undefinedTokens, {});
});

test('a token named only inside a comment is not a finding', () => {
  // SessionManagementSnackbar carries `// 6px based on Figma var(--modal/radius-md)`,
  // which read literally is a finding about a sentence.
  const { undefinedTokens } = audit([
    file('S.scss', '.s { /* var(--ghost) */ color: red; } // and var(--modal/radius-md)\n'),
  ]);
  assert.deepEqual(undefinedTokens, {});
});

test('stripping comments keeps every line number', () => {
  const text = 'a\n/* two\nthree */\nfour // five\nsix\n';
  const stripped = stripComments(text);
  assert.equal(stripped.split('\n').length, text.split('\n').length);
  assert.equal(stripped.split('\n')[4], 'six');
});

test('a `//` inside a URL is not a comment', () => {
  const stripped = stripComments('a: url(https://x.test/y); color: var(--real);');
  assert.match(stripped, /var\(--real\)/);
});

test('a name SCSS interpolation produced is reported apart, never counted', () => {
  const result = audit([file('a.scss', '.x { color: var(--color-); }')]);
  assert.deepEqual(result.undefinedTokens, {});
  assert.deepEqual(result.interpolated, ['--color-']);
  assert.ok(isInterpolated('--color-'));
  assert.ok(!isInterpolated('--color-primary'));
});

test('definitions and usages read the shapes they claim to', () => {
  const files = [file('a.scss', ':root { --a: 1px; }\n.x { padding: var(--a) var(--b, 2px); }')];
  assert.deepEqual([...definitions(files)], ['--a']);
  assert.deepEqual(
    usages(files).map((u) => [u.name, u.bare]),
    [['--a', true], ['--b', false]],
  );
});

/* ------------------------------------------------------------ the ratchet */

const BASE = { tokens: { '--x': { uses: 2, bare: 1 } } };

test('the ratchet passes when the count falls', () => {
  assert.deepEqual(ratchetFailures({ '--x': { uses: 1, bare: 0, files: ['a'] } }, BASE), []);
});

test('a rise fails, and says the baseline may only fall', () => {
  const found = ratchetFailures({ '--x': { uses: 3, bare: 1, files: ['a'] } }, BASE);
  assert.equal(found.length, 1);
  assert.match(found[0], /^ROSE --x — 2 recorded, 3 now/);
});

test('turning a fallback into a bare use fails even though the total is flat', () => {
  const found = ratchetFailures({ '--x': { uses: 2, bare: 2, files: ['a'] } }, BASE);
  assert.equal(found.length, 1);
  assert.match(found[0], /bare recorded, 2 now/);
});

test('a name nobody recorded is always a failure', () => {
  const found = ratchetFailures({ '--y': { uses: 1, bare: 1, files: ['a.scss'] } }, BASE);
  assert.equal(found.length, 2, 'the new name, and --x having gone stale');
  assert.match(found[0], /^NEW  --y/);
});

test('a fixed entry left in the baseline is itself a finding', () => {
  const found = ratchetFailures({}, BASE);
  assert.equal(found.length, 1);
  assert.match(found[0], /^STALE --x/);
});

/* ------------------------------------------------------------- the corpus */

test('the real corpus is walked, and the real baseline matches it', () => {
  const files = corpus(REPO_ROOT, ['design-system/src', '.storybook', 'prototypes']).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
  }));
  assert.ok(files.length > 1300, `${files.length} files — the walk must not narrow silently`);
  const baseline = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'docs/evals/undefined-token-baseline.json'), 'utf8'),
  );
  assert.deepEqual(ratchetFailures(audit(files).undefinedTokens, baseline), []);
});

test('the tokens this pass repointed are gone from the corpus', () => {
  const files = corpus(REPO_ROOT, ['design-system/src']).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
  }));
  const scss = files.filter((f) => /^design-system\/src\/components\/.*\.scss$/.test(f.path));
  const defined = definitions(files);
  const bare = usages(scss).filter((u) => u.bare && !defined.has(u.name) && !isInterpolated(u.name));
  assert.deepEqual(
    bare.map((u) => `${u.name} ${u.file}:${u.line}`),
    [],
    'no shipped component stylesheet may drop a declaration on a token that does not exist',
  );
});
