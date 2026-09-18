// The link validator, one fixture repo per pass (#612).
//
// It was `validate-doc-links.sh` and it has never had a test — which is the
// defect twice over, because the shell version silently no-opped for weeks on
// machines without `rg` and nothing noticed (#504). A guard nobody has watched
// fail is a guard nobody knows works (#191), so each of the seven passes below
// is proven by a tree that breaks it, and the exclusions are proven by a tree
// that breaks the rule in a place the pass is supposed to leave alone.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { run, summary } from './check-doc-links.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The indexes passes 5 and 6 require. Every fixture gets them, empty. */
const INDEXES = [
  'design-system/guidelines/index-manifest.json',
  'design-system/guidelines/components/components-index.json',
  'skills/uno-research/references/foundations-index.json',
  'skills/uno-research/references/patterns-index.json',
  'design-system/figma/component-registry.json',
  'design-system/figma/token-registry.json',
];

/** The root files passes 1–4 read by name, whether or not a test cares. */
const ROOT_FILES = ['AGENTS.md', 'CONTEXT.md', 'SETUP.md', 'README.md'];

/**
 * A throwaway repo shaped enough for all seven passes to run on it: the four
 * root files, the six indexes, and pass 6's own script — which resolves the
 * tree from its own location, so the fixture gets a copy rather than borrowing
 * this repo's and answering about the wrong estate. A test's `files` override
 * any of them.
 *
 * `git init`, because pass 3 asks git which markdown files exist rather than
 * walking the disk: untracked-but-not-ignored counts, so a fixture needs no
 * commit.
 */
function repo(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'doc-links-'));
  const write = (rel, body) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  };
  for (const rel of ROOT_FILES) write(rel, `# ${rel}\n`);
  for (const rel of INDEXES) write(rel, '{}\n');
  for (const [rel, body] of Object.entries(files)) write(rel, body);
  mkdirSync(path.join(root, 'scripts'), { recursive: true });
  copyFileSync(
    path.join(REPO_ROOT, 'scripts/validate-index-paths.mjs'),
    path.join(root, 'scripts/validate-index-paths.mjs'),
  );
  spawnSync('git', ['init', '-q'], { cwd: root });
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

const messages = (root) => run({ repoRoot: root }).map((finding) => finding.message);

// ── the clean tree ──────────────────────────────────────────────────────────

test('a tree with nothing wrong reports nothing, and says which passes ran', () => {
  const r = repo({
    'docs/conventions/a.md': 'See [b](./b.md).\n',
    'docs/conventions/b.md': '# B\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
    const lines = summary({ repoRoot: r.root }).split('\n');
    assert.equal(lines[0], 'all validation checks passed');
    assert.equal(lines.filter((line) => line.startsWith('[check]')).length, 7);
  } finally {
    r.done();
  }
});

// ── 1. relative markdown links ──────────────────────────────────────────────

test('a relative link to a file that is not there fails, and names what it resolved to', () => {
  const r = repo({ 'docs/conventions/a.md': 'See [gone](./gone.md).\n' });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /^\[missing\] docs\/conventions\/a\.md -> \.\/gone\.md/);
    assert.match(found[0], /resolved: docs\/conventions\/gone\.md/);
  } finally {
    r.done();
  }
});

test('http, mailto and anchor-only targets are not repo paths', () => {
  const r = repo({
    'docs/conventions/a.md': 'See [x](https://example.com/gone.md), [y](mailto:a@b.c), [z](#top).\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('a transcript is a record of what an agent said, so its links are not resolved', () => {
  const r = repo({ 'skills/uno-maintain/transcripts/run.md': 'It read [x](./nowhere.md).\n' });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test("the generated bundle's links are its sources, already checked at their own paths", () => {
  const r = repo({ 'agents/uno-bot/harness-bundle.md': 'See [x](./nowhere.md).\n' });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

// ── 2. backticked rooted paths ──────────────────────────────────────────────

test('a backticked repo path that resolves to nothing fails — a pointer is not a link', () => {
  const r = repo({ 'docs/conventions/a.md': 'Read `docs/conventions/retired.md` first.\n' });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /docs\/conventions\/a\.md -> `docs\/conventions\/retired\.md`/);
  } finally {
    r.done();
  }
});

test('a glob, a placeholder and a line reference are not claims that a file exists', () => {
  const r = repo({
    'docs/conventions/a.md':
      'Sweep `docs/**/*.md`, name it `docs/plans/YYYY-MM-DD-001.md`, and see `AGENTS.md:42`.\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('an ADR names the path a decision retired, and is not asked to resolve it', () => {
  const r = repo({ 'docs/adr/001-a-move.md': 'It used to live at `docs/conventions/old.md`.\n' });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

// ── 3. backticked bare filenames ────────────────────────────────────────────

test('a backticked bare filename that names no file anywhere fails', () => {
  const r = repo({ 'docs/conventions/a.md': 'The rule is in `figma-workspace.md`.\n' });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /`figma-workspace\.md` \(no file of that name exists\)/);
  } finally {
    r.done();
  }
});

test('a bare filename that exists somewhere passes — the rule is deliberately weak', () => {
  const r = repo({
    'docs/conventions/a.md': 'The rule is in `figma.md`.\n',
    'docs/connectors/figma.md': '# Figma\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

// ── 4. the skills table ─────────────────────────────────────────────────────

test('a skills-table row pointing at a skill with no SKILL.md fails', () => {
  const r = repo({
    'AGENTS.md': '| `/uno-review` | skills/uno-review |\n',
    'skills/uno-review/references/method.md': '# Method\n',
  });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /AGENTS\.md -> skills\/uno-review\/SKILL\.md/);
  } finally {
    r.done();
  }
});

// ── 5. the JSON indexes ─────────────────────────────────────────────────────

test('a required index that is not there fails, and one that does not parse fails', () => {
  const r = repo({ 'skills/uno-research/references/patterns-index.json': '{ oops\n' });
  rmSync(path.join(r.root, 'design-system/guidelines/index-manifest.json'));
  try {
    const found = messages(r.root);
    assert.ok(found.some((m) => /required index: design-system\/guidelines\/index-manifest\.json/.test(m)));
    assert.ok(found.some((m) => /invalid JSON: skills\/uno-research\/references\/patterns-index\.json/.test(m)));
  } finally {
    r.done();
  }
});

// ── 6. the paths inside them ────────────────────────────────────────────────

test('a dead path INSIDE an index fails, and the finding carries the line that names it', () => {
  const r = repo({
    'design-system/guidelines/index-manifest.json': '{"a": {"path": "design-system/src/gone.jsx"}}\n',
  });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /^validate-index-paths\n/);
    assert.match(found[0], /\[dead-path\].*design-system\/src\/gone\.jsx/);
  } finally {
    r.done();
  }
});

// ── 7. retired path shapes ──────────────────────────────────────────────────

test('a retired path shape surviving in an active file fails, and is counted', () => {
  const r = repo({ 'docs/conventions/a.md': 'Filed under docs/project/notes.\n' });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /\[stale\] 1 references to old path pattern: docs\/project\//);
  } finally {
    r.done();
  }
});

test('history keeps the words it was written in: a plan and an ADR are not active files', () => {
  const r = repo({
    'docs/plans/2026-01-01-001.md': 'Filed under docs/project/notes.\n',
    'docs/adr/001-a-move.md': 'It used to live under docs/project/notes.\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

// ── the committed trees ────────────────────────────────────────────────────

test('the committed trees have no broken links', () => {
  const found = run().map((finding) => finding.message);
  assert.deepEqual(found, [], found.join('\n'));
});
