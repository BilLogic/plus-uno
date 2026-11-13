/**
 * A story file loads in the real Storybook build, where vitest's modules do not
 * exist. A top-level import of one fails the CSF file's load, its stories drop out
 * of the index, and every docs page that embeds them errors ("Invalid value passed
 * to the 'of' prop"). That is what Foundations > Motion > Transitions did on every
 * deploy preview.
 *
 * The rule: a story imports nothing from `vitest` or `@vitest/*`. Assertions use
 * `storybook/test`; what a page cannot do to itself goes through a runner command
 * (`design-system/src/storybook-docs/lib/test-viewport.js`).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VITEST_IMPORT = /^\s*(?:import\s[^;]*?from|import)\s+['"](vitest(?:\/[^'"]*)?|@vitest\/[^'"]*)['"]/m;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return /\.stories\.(js|jsx|ts|tsx)$/.test(e.name) ? [p] : [];
  });

test('stories import nothing from vitest', () => {
  const offenders = walk(path.join(ROOT, 'design-system/src'))
    .filter((f) => VITEST_IMPORT.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ROOT, f));
  assert.deepEqual(offenders, []);
});

// Storybook's indexer links an MDX page to a stories file only by a relative
// import; an `@/` alias import leaves the file out of `storiesImports`, so
// `<Canvas of={X.Story}>` fails in the built page.
test('MDX pages import stories files by relative path', () => {
  const walkMdx = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === 'node_modules' ? [] : walkMdx(p);
      return e.name.endsWith('.mdx') ? [p] : [];
    });
  const bad = walkMdx(path.join(ROOT, 'design-system/src')).filter((f) =>
    /^\s*import\s+\*\s+as\s+\w+\s+from\s+['"]@\/[^'"]*\.stories(\.\w+)?['"]/m.test(fs.readFileSync(f, 'utf8')),
  );
  assert.deepEqual(bad.map((f) => path.relative(ROOT, f)), []);
});
