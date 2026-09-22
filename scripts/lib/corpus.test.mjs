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

import {
  IGNORED_DIRS,
  directories,
  documents,
  frontmatter,
  links,
  mdxSections,
  stripLinks,
  text,
} from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '__fixtures__/corpus');

// ── documents: the walk ──────────────────────────────────────────────────────

test('documents lists the markdown under a directory, recursively and sorted', () => {
  assert.deepEqual(documents('docs', { root: FIXTURES }), [
    'docs/brackets.md',
    'docs/folded.md',
    'docs/nested/deep.md',
    'docs/plain.md',
    'docs/structured.md',
    'docs/tiered.md',
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
    'docs/structured.md',
    'docs/tiered.md',
    'docs/unterminated.md',
  ]);
  assert.deepEqual(documents('docs/*.md', { root: FIXTURES }), [
    'docs/brackets.md',
    'docs/folded.md',
    'docs/plain.md',
    'docs/structured.md',
    'docs/tiered.md',
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

// ── text: what a file says ───────────────────────────────────────────────────

test('text reads a file against the root it is given, not the working directory', () => {
  assert.equal(text('docs/plain.md', { root: FIXTURES }), fs.readFileSync(path.join(FIXTURES, 'docs/plain.md'), 'utf8'));
  assert.equal(text(path.join(FIXTURES, 'docs/plain.md')), text('docs/plain.md', { root: FIXTURES }));
});

test('text reads whatever a caller listed, document or stylesheet', () => {
  // `ext: null` is the shape a stylesheet walker asks `documents` for, and the
  // read that follows it is this one — the pairing #620 exists to keep honest.
  const found = documents('docs', { root: FIXTURES, ext: ['.txt'] });
  assert.deepEqual(found, ['docs/notes.txt']);
  assert.ok(text(found[0], { root: FIXTURES }).length > 0);
});

test('text THROWS for a path that is not there, rather than echoing its own name', () => {
  // The difference from `frontmatter`'s forgiving path-or-text read: a caller
  // holding a path it means to read wants the failure, not the string back.
  assert.throws(() => text('docs/absent.md', { root: FIXTURES }), /ENOENT/);
  assert.throws(() => text(undefined), /takes a path/);
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
  assert.deepEqual(frontmatter(text), { meta: {}, body: text, raw: null });
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

// ── documents: strict, the mode a guard needs ────────────────────────────────

test('strict THROWS on a directory it cannot read, rather than sweeping fewer files', () => {
  // The forgiving walk returns what it got and the caller reports a number it
  // did not earn. A guard must stop instead: an unreadable directory is the
  // sweep failing to see what it is about to vouch for (#429).
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-strict-'));
  const dir = path.join(root, 'docs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.md'), '# a\n');
  fs.chmodSync(dir, 0o000);
  try {
    // Running as root defeats the permission bit; skip rather than assert a
    // guarantee the environment is not providing.
    let readable = true;
    try {
      fs.readdirSync(dir);
    } catch {
      readable = false;
    }
    if (readable) return;
    assert.deepEqual(documents('docs', { root }), [], 'the forgiving walk swallows it');
    assert.throws(
      () => documents('docs', { root, strict: true }),
      (err) => err.code === 'EACCES',
    );
  } finally {
    fs.chmodSync(dir, 0o755);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an absent glob prefix answers empty under strict, as an absent path does', () => {
  // A sweep names roots that not every tree has — `agents/**/*.md` against a
  // fixture root with no agents/ — and strict is about a directory that exists
  // and cannot be read, not about one that is not there. The literal branch
  // always said so; the glob branch used to throw.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-absent-glob-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/a.md'), '# a\n');
  try {
    assert.deepEqual(documents('agents/**/*.md', { root, strict: true }), []);
    assert.deepEqual(documents('agents/**/*.md', { root }), []);
    // Present, so still walked — the guard skips nothing it could have read.
    assert.deepEqual(documents('docs/**/*.md', { root, strict: true }), ['docs/a.md']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a broken symlink costs only itself, in both modes', () => {
  // The other half. `withFileTypes` describes the LINK, so a walk that trusted
  // the dirent would return a dangling one as a document with no file behind
  // it; the walk stats it instead, and an ENOENT skips that entry and nothing
  // else.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-symlink-'));
  const dir = path.join(root, 'docs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a-first.md'), '# a\n');
  fs.symlinkSync(path.join(root, 'nothing-here'), path.join(dir, 'b-broken.md'));
  fs.writeFileSync(path.join(dir, 'c-last.md'), '# c\n');
  try {
    const expected = ['docs/a-first.md', 'docs/c-last.md'];
    assert.deepEqual(documents('docs', { root, strict: true }), expected);
    assert.deepEqual(documents('docs', { root }), expected);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a symlinked directory is walked like a real one, by documents and directories', () => {
  // What lets a test build its root under mkdtemp and LINK the trees it only
  // reads: a fixture root for check:doc-identifiers links design-system/src
  // rather than copying 1,500 files, and the walk must see through the link.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-linkdir-'));
  const real = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-linkdir-target-'));
  fs.mkdirSync(path.join(real, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(real, 'top.md'), '# top\n');
  fs.writeFileSync(path.join(real, 'nested/deep.md'), '# deep\n');
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs/own.md'), '# own\n');
  fs.symlinkSync(real, path.join(root, 'docs/linked'));
  try {
    const expected = ['docs/linked/nested/deep.md', 'docs/linked/top.md', 'docs/own.md'];
    assert.deepEqual(documents('docs', { root }), expected);
    assert.deepEqual(documents('docs', { root, strict: true }), expected);
    assert.deepEqual(directories('docs', { root }), ['docs/linked', 'docs/linked/nested']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(real, { recursive: true, force: true });
  }
});

test('skipEntry skips a name whether it is a file or a directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-skipentry-'));
  try {
    fs.mkdirSync(path.join(root, '__planted'), { recursive: true });
    fs.writeFileSync(path.join(root, '__planted/buried.md'), '# buried\n');
    fs.writeFileSync(path.join(root, '__fixture.md'), '# fixture\n');
    fs.writeFileSync(path.join(root, 'real.md'), '# real\n');
    assert.deepEqual(documents('.', { root, skipEntry: (n) => n.startsWith('__') }), ['real.md']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── directories ──────────────────────────────────────────────────────────────

test('directories lists the folders, recursively or one level, under the same ignore rules', () => {
  assert.deepEqual(directories('.', { root: FIXTURES }), ['docs', 'docs/nested']);
  assert.deepEqual(directories('.', { root: FIXTURES, recursive: false }), ['docs']);
  assert.deepEqual(directories('docs', { root: FIXTURES }), ['docs/nested']);
  assert.deepEqual(directories('gone', { root: FIXTURES }), [], 'an absent target is nothing');

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-dirs-'));
  try {
    for (const rel of ['kept', 'kept/deeper', 'node_modules', '.hidden']) {
      fs.mkdirSync(path.join(root, rel), { recursive: true });
    }
    assert.deepEqual(directories('.', { root }), ['kept', 'kept/deeper']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── frontmatter: the two readings a caller can ask for ───────────────────────

test('allowLeadingComment lets the fence open below the house Tier marker', () => {
  const abs = path.join(FIXTURES, 'docs/tiered.md');
  assert.deepEqual(frontmatter(abs).meta, {}, 'anchored at byte 0, there is no frontmatter');
  const { meta, raw } = frontmatter(abs, { allowLeadingComment: true });
  assert.equal(meta.disposition, 'rule');
  assert.equal(meta['disposition-target'], 'docs/engineering/coding.md');
  assert.equal(raw, 'disposition: rule\ndisposition-target: docs/engineering/coding.md');
});

test('structured reads a block sequence and a nested mapping, comments and all', () => {
  const abs = path.join(FIXTURES, 'docs/structured.md');
  assert.equal(frontmatter(abs).meta.trigger_types, '', 'without asking, an empty scalar');
  const { meta } = frontmatter(abs, { structured: true });
  assert.deepEqual(meta.trigger_types, ['github_cron', 'github_dispatch']);
  assert.deepEqual(meta.references_when, {
    isNewComponent: 'references/new-component-scaffolding.md',
  });
  assert.equal(meta.model_default, 'claude-sonnet-4-6', 'the scalars still read as scalars');
});

test('a `#` in an ordinary scalar is content, not a comment', () => {
  // docs/connectors/slack.md names a channel: `summary: … #plus-universal …`.
  // Comment-stripping belongs to the sequence items that carry comments, and
  // nowhere else, or that summary loses half its text.
  assert.equal(
    frontmatter('---\nsummary: Universal is #plus-universal here\n---\n').meta.summary,
    'Universal is #plus-universal here',
  );
});

test('raw is the block verbatim — what a generator re-emits without re-finding the fence', () => {
  const { raw } = frontmatter('---\nname: uno-x\nargument-hint: "[a] [b]"\n---\n\nBody.\n');
  assert.equal(raw, 'name: uno-x\nargument-hint: "[a] [b]"');
});

// ── stripLinks ───────────────────────────────────────────────────────────────

test('stripLinks reduces a link to its text, leaving the prose word count alone', () => {
  assert.equal(
    stripLinks('See [the folded doc](folded.md) and [site](https://example.com/x).'),
    'See the folded doc and site.',
  );
  assert.equal(stripLinks('An [empty]() label stays'), 'An empty label stays');
  assert.equal(
    stripLinks('`[label](url)` in a code span is stripped too, not blanked'),
    '`label` in a code span is stripped too, not blanked',
  );
  assert.equal(stripLinks('no links here'), 'no links here');
});
