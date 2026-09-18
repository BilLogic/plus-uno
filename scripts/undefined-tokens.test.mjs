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

import { openRatchet } from './lib/ratchet.mjs';
import {
  EXTERNAL,
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

/* --------------------------------------------- the wording of a verdict */

/*
 * WHAT MOVED OUT OF HERE IN #600. Which names are new, which counts rose and
 * which entries have gone stale is `scripts/lib/ratchet.mjs`'s, and the whole
 * invariant is asserted once, against all twelve live records, in
 * `scripts/lib/ratchet-conformance.mjs`. What is still this module's is what a
 * verdict SAYS — and the last case below drives the real record through the
 * real ratchet, which is the assertion that the two still fit.
 */

const FOUND = { '--x': { uses: 3, bare: 2, files: ['a.scss'] } };

test('nothing moved is nothing said', () => {
  assert.deepEqual(ratchetFailures(FOUND, {}), []);
});

test('a rise says which count moved, and that the baseline may only fall', () => {
  const found = ratchetFailures(FOUND, {
    failures: [{ kind: 'rose', key: '--x', field: 'uses', count: 3, recorded: 2 }],
  });
  assert.deepEqual(found.length, 1);
  assert.match(found[0], /^ROSE --x — 2 recorded, 3 now/);
});

test('a bare use is worded as its own regression, not as a count', () => {
  // The total can stay flat while a fallback becomes a bare use, which drops
  // the whole declaration. The two fields ratchet separately for that reason.
  const found = ratchetFailures(FOUND, {
    failures: [{ kind: 'rose', key: '--x', field: 'bare', count: 2, recorded: 1 }],
  });
  assert.match(found[0], /bare recorded, 2 now/);
});

test('a fall is not worded at all — this record is shrink-only', () => {
  const found = ratchetFailures(FOUND, {
    failures: [{ kind: 'fell', key: '--x', field: 'uses', count: 1, recorded: 2 }],
  });
  assert.deepEqual(found, []);
});

test('a new name is worded with the first file it appears in', () => {
  const found = ratchetFailures(FOUND, { failures: [{ kind: 'new', key: '--x', count: 3 }] });
  assert.equal(found.length, 1);
  assert.match(found[0], /^NEW  --x — used 3x \(2 bare\) and defined nowhere\. First: a\.scss$/);
});

test('a fixed entry left in the record is itself a finding', () => {
  const found = ratchetFailures(FOUND, { stale: [{ key: '--gone', recorded: 2 }] });
  assert.equal(found.length, 1);
  assert.match(found[0], /^STALE --gone/);
});

/* ------------------------------------------------------------- the corpus */

test('the real corpus is walked, and the real baseline matches it', () => {
  const files = corpus(REPO_ROOT, ['design-system/src', '.storybook', 'prototypes']).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
  }));
  assert.ok(files.length > 1300, `${files.length} files — the walk must not narrow silently`);
  // Through the real ratchet, on the shape the record declares: the measured
  // side is `{ name: { uses, bare } }` and nothing else, which is also what
  // `--update` writes back.
  const { undefinedTokens } = audit(files);
  const entries = openRatchet({ file: 'docs/evals/undefined-token-baseline.json', set: 'tokens', repoRoot: REPO_ROOT });
  const side = Object.fromEntries(
    Object.entries(undefinedTokens).map(([name, entry]) => [name, { uses: entry.uses, bare: entry.bare }]),
  );
  assert.deepEqual(
    ratchetFailures(undefinedTokens, { failures: entries.failures(side), stale: entries.stale(side) }),
    [],
  );
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

test('an externally-defined property is not a finding', () => {
  // `--spacing` is Tailwind v4's own theme variable, read by a vendored shadcn
  // component. Reporting it would send a reader to "fix" it into a design
  // token, which would break the component.
  const { undefinedTokens } = audit([file('alert.tsx', 'const c = "calc(var(--spacing)*4)";')]);
  assert.deepEqual(undefinedTokens, {});
  assert.ok(EXTERNAL.has('--spacing'));
});

test('only five bare uses remain, and each is a token the system does not have', () => {
  const files = corpus(REPO_ROOT, ['design-system/src', '.storybook', 'prototypes']).map((rel) => ({
    path: rel,
    text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'),
  }));
  const defined = definitions(files);
  const bare = usages(files)
    .filter((u) => u.bare && !defined.has(u.name) && !isInterpolated(u.name) && !EXTERNAL.has(u.name))
    .map((u) => u.name)
    .sort();
  // The design system has no min-size and no width tokens at all. Pointing
  // these anywhere would be inventing a value, so they are recorded rather
  // than guessed — and this asserts the list has not quietly grown.
  assert.deepEqual([...new Set(bare)], [
    '--size-button-min-height-md',
    '--size-button-min-width-md',
    '--size-modal-min-height-md',
    '--size-modal-min-height-sm',
    '--size-modal-width-sm',
  ]);
});
