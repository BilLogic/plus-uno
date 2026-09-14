/**
 * Tests for the corpus — the harness's one reader of repo files.
 *
 * Every assertion below is made against `__fixtures__/corpus/`, a root this
 * test owns, never against the live tree. That is #469's rule: a checker that
 * takes a root can be tested on a corpus nobody else edits, and a fixture
 * planted in the real tree is a document every other sweep then has to read.
 * The one case a tracked fixture cannot carry — `node_modules/`, `dist/` and
 * `coverage/` are gitignored repo-wide — is built in a temp directory.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IGNORED_DIRS, documents, frontmatter, links, mdxSections } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '__fixtures__/corpus');

// ── documents: the walk ──────────────────────────────────────────────────────

test('documents lists the markdown under a directory, recursively and sorted', () => {
  assert.deepEqual(documents('docs', { root: FIXTURES }), [
    'docs/brackets.md',
    'docs/folded.md',
    'docs/nested/deep.md',
    'docs/plain.md',
    'docs/unterminated.md',
  ]);
});

test('documents leaves a non-markdown file out of the default extension set', () => {
  const found = documents('docs', { root: FIXTURES });
  assert.ok(!found.includes('docs/notes.txt'), '.txt is not a document by default');
  assert.ok(
    documents('docs', { root: FIXTURES, ext: null }).includes('docs/notes.txt'),
    'ext: null is every file — the shape the stylesheet walkers need',
  );
  assert.deepEqual(documents('.', { root: FIXTURES, ext: ['.mdx'] }), ['page.mdx']);
});

test('documents takes a glob as readily as a directory', () => {
  assert.deepEqual(documents('docs/**/*.md', { root: FIXTURES }), [
    'docs/brackets.md',
    'docs/folded.md',
    'docs/nested/deep.md',
    'docs/plain.md',
    'docs/unterminated.md',
  ]);
  assert.deepEqual(documents('docs/*.md', { root: FIXTURES }), [
    'docs/brackets.md',
    'docs/folded.md',
    'docs/plain.md',
    'docs/unterminated.md',
  ]);
  assert.deepEqual(documents('docs/nested/*.md', { root: FIXTURES }), ['docs/nested/deep.md']);
});

test('documents on a file is that file, and on a path that is not there is nothing', () => {
  assert.deepEqual(documents('docs/plain.md', { root: FIXTURES }), ['docs/plain.md']);
  assert.deepEqual(documents('docs/notes.txt', { root: FIXTURES }), []);
  assert.deepEqual(documents('docs/gone.md', { root: FIXTURES }), []);
});

test('documents skips the ignored directories, and the list is one exported constant', () => {
  // The names the private walkers each carried: node_modules and .git
  // everywhere, then the build outputs that check-docs-dead-selectors names.
  for (const dir of ['node_modules', '.git', '.claude', 'dist', 'storybook-static', 'coverage', '.test-build']) {
    assert.ok(IGNORED_DIRS.has(dir), `${dir} belongs to the one ignore list`);
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-ignore-'));
  try {
    const plant = (rel) => {
      fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), '# doc\n');
    };
    plant('kept.md');
    plant('docs/kept.md');
    for (const dir of IGNORED_DIRS) plant(`${dir}/buried.md`);
    plant('.hidden/buried.md');
    plant('docs/node_modules/buried.md');

    assert.deepEqual(documents('.', { root }), ['docs/kept.md', 'kept.md']);
    assert.ok(
      documents('.', { root, skipDotDirs: false }).includes('.hidden/buried.md'),
      'a caller that wants dot-directories can ask; the ignore list still holds',
    );
    assert.ok(
      !documents('.', { root, skipDotDirs: false }).includes('.git/buried.md'),
      '.git is on the ignore list, not merely a dot-directory',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── frontmatter ──────────────────────────────────────────────────────────────

test('frontmatter of a file with none is all body and no meta', () => {
  const { meta, body } = frontmatter(path.join(FIXTURES, 'docs/plain.md'));
  assert.deepEqual(meta, {});
  assert.ok(body.startsWith('# Plain page\n'));
});

test('frontmatter reads a fenced block, and the blank lines after the fence belong to the fence', () => {
  const { meta, body } = frontmatter('---\nsummary: x\nembodiment: ide\n---\n\n# Doc\n\nBody.\n');
  assert.deepEqual(meta, { summary: 'x', embodiment: 'ide' });
  assert.equal(body, '# Doc\n\nBody.\n');
});

test('frontmatter treats an unterminated block as content, not a guess at where it closes', () => {
  const text = fs.readFileSync(path.join(FIXTURES, 'docs/unterminated.md'), 'utf8');
  assert.deepEqual(frontmatter(text), { meta: {}, body: text });
});

test('frontmatter folds a `>` block, reads a `|` block, and unquotes a quoted value', () => {
  const { meta, body } = frontmatter(path.join(FIXTURES, 'docs/folded.md'));
  assert.equal(meta.embodiment, 'ide');
  assert.equal(meta.summary, 'A quoted summary', 'the quotes are YAML syntax, not text');
  assert.equal(meta.description, 'Folded across three lines of YAML.');
  assert.equal(meta.block, 'Literal one Literal two');
  assert.equal(body, '# Folded\n\nBody starts here.\n');
});

test('frontmatter refuses an unquoted flow sequence, naming the key and the fix', () => {
  assert.throws(
    () => frontmatter(path.join(FIXTURES, 'docs/brackets.md')),
    (err) => {
      assert.match(err.message, /argument-hint/, 'the error names the key');
      assert.match(err.message, /\[/, 'and the character YAML would reinterpret');
      assert.match(err.message, /[Qq]uote/, 'and says to quote the value');
      return true;
    },
  );
});

test('frontmatter takes a path or the text itself, and reads them the same', () => {
  const abs = path.join(FIXTURES, 'docs/nested/deep.md');
  assert.deepEqual(frontmatter(abs), frontmatter(fs.readFileSync(abs, 'utf8')));
  assert.equal(frontmatter(abs).meta.embodiment, 'all');
});

// ── links ────────────────────────────────────────────────────────────────────

test('links finds the markdown links and leaves the backticked paths alone', () => {
  const found = links(path.join(FIXTURES, 'docs/plain.md'));
  assert.deepEqual(found, [
    { text: 'the folded doc', target: 'folded.md' },
    { text: 'the deep one', target: 'nested/deep.md' },
    { text: 'site', target: 'https://example.com/x' },
  ]);
  assert.ok(
    !found.some((l) => l.target === 'target.md'),
    'a whole link inside a code span is a doc teaching Markdown, not a link this repo owns',
  );
  assert.ok(
    !found.some((l) => l.target === 'notes/plain.md'),
    'a backticked path is a pointer, not a link — the pointer regex is its own check',
  );
});

test('links keeps the house style intact: [`path.md`](path.md)', () => {
  assert.deepEqual(links('See [`docs/x.md`](docs/x.md).'), [
    { text: '`docs/x.md`', target: 'docs/x.md' },
  ]);
});

// ── mdxSections ──────────────────────────────────────────────────────────────

test('mdxSections is the heading outline, and a fenced heading is not a section', () => {
  assert.deepEqual(mdxSections(path.join(FIXTURES, 'page.mdx')), [
    { depth: 1, title: 'Page title' },
    { depth: 2, title: 'Real section' },
    { depth: 3, title: 'Nested section' },
  ]);
});

test('mdxSections reads past the frontmatter rather than through it', () => {
  assert.deepEqual(mdxSections('---\ntitle: "x"\n# not a heading: a YAML comment\n---\n\n## Only one\n'), [
    { depth: 2, title: 'Only one' },
  ]);
});
