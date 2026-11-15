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
// Scan loading syntax, skipping comments and treating quoted examples as one
// token. This covers re-exports and lazy imports without flagging inert prose.
function hasVitestImport(source) {
  const tokens = [...source.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*|[^\s]/g)]
    .map((m) => m[0]).filter((t) => !t.startsWith('//') && !t.startsWith('/*'));
  const forbidden = (t = '') => /^['"`](?:vitest(?:\/[^'"`]*)?|@vitest\/[^'"`]+)['"`]$/.test(t);
  for (let i = 0; i < tokens.length; i++) {
    const keyword = tokens[i];
    if (keyword !== 'import' && keyword !== 'export') continue;
    if (tokens[i - 1] === '.') continue;
    if (keyword === 'import' && (forbidden(tokens[i + 1]) ||
        (tokens[i + 1] === '(' && forbidden(tokens[i + 2])))) return true;
    // A declaration's module specifier follows `from`. Stop at its first
    // string or statement boundary, so later code is considered separately.
    if (keyword === 'export' && !['*', '{', 'type'].includes(tokens[i + 1])) continue;
    for (let j = i + 1; j < tokens.length && tokens[j] !== ';'; j++) {
      if (/^['"`]/.test(tokens[j])) break;
      if (tokens[j] === 'from') {
        if (forbidden(tokens[j + 1])) return true;
        break;
      }
    }
  }
  return false;
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return /\.stories\.(js|jsx|ts|tsx)$/.test(e.name) ? [p] : [];
  });

test('stories import nothing from vitest', () => {
  const offenders = walk(path.join(ROOT, 'design-system/src'))
    .filter((f) => hasVitestImport(fs.readFileSync(f, 'utf8')))
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

test('the story import guard covers runner-only loading forms', () => {
  for (const source of [
    "import { expect } from 'vitest';",
    "import\n{ expect }\nfrom 'vitest/browser';",
    "import '@vitest/browser/context';",
    "export { expect } from 'vitest';",
    "export * from '@vitest/browser';",
    "const test = import('vitest');",
    "const test = import(/* runner */ '@vitest/browser/context');",
    'const test = import(`vitest/browser`);',
  ]) assert.equal(hasVitestImport(source), true, source);
});

test('the story import guard permits storybook play assertions and inert text', () => {
  for (const source of [
    "import { expect, within } from 'storybook/test'; export const Demo = { play: () => expect(true).toBe(true) };",
    "// import 'vitest';\nexport const Demo = {};",
    "/* export * from 'vitest'; */ export const Demo = {};",
    'const example = "import(\'vitest\')";',
    "import { VitestIcon } from './vitest-icon';",
  ]) assert.equal(hasVitestImport(source), false, source);
});
