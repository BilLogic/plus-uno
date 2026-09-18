// The forcing function, proven by notes that break it (#612).
//
// `docs/knowledge/` became sediment because nothing asked the question. This
// check is the asking, and until now nobody had watched it fail — a guard
// nobody has watched fail is a guard nobody knows works (#191). Each rule below
// is proven by a fixture tree that breaks it, not by the committed folder
// passing; the committed folder is the last test, and it only says the estate
// is currently clean.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { run, summary } from './check-knowledge-disposition.mjs';

/** A throwaway repo holding whatever files the test says exist. */
function repo(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'disposition-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

/** A note with frontmatter, behind the house Tier marker the corpus tolerates. */
const note = (meta) =>
  `<!-- Tier: 2 (on demand) -->\n---\n${Object.entries(meta)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')}\n---\n\nWhat was learned.\n`;

const messages = (root) => run({ repoRoot: root }).map((finding) => finding.message);

test('a note dispositioned to a rule that resolves passes', () => {
  const r = repo({
    'docs/knowledge/lesson.md': note({
      disposition: 'rule',
      'disposition-target': 'docs/conventions/writing.md',
    }),
    'docs/conventions/writing.md': '# Writing\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('a note with no disposition fails, and is told the four outcomes', () => {
  const r = repo({ 'docs/knowledge/undecided.md': '# A thing I learned\n' });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /docs\/knowledge\/undecided\.md/);
    assert.match(found[0], /no disposition/);
    assert.match(found[0], /Deleting is the fourth outcome/);
  } finally {
    r.done();
  }
});

test('a disposition outside the three fails and names the three', () => {
  const r = repo({ 'docs/knowledge/lesson.md': note({ disposition: 'later' }) });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /disposition: later/);
    assert.match(found[0], /rule \| adr \| archive/);
  } finally {
    r.done();
  }
});

test('`rule` with no target fails: a disposition names where the content landed', () => {
  const r = repo({ 'docs/knowledge/lesson.md': note({ disposition: 'rule' }) });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /needs a disposition-target/);
  } finally {
    r.done();
  }
});

test('a target that does not resolve fails — the cheapest way to fake a decision', () => {
  const r = repo({
    'docs/knowledge/lesson.md': note({
      disposition: 'adr',
      'disposition-target': 'docs/adr/999-never-written.md',
    }),
  });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /docs\/adr\/999-never-written\.md does not resolve/);
  } finally {
    r.done();
  }
});

test('`disposition: archive` on a note still sitting outside archive/ fails', () => {
  const r = repo({ 'docs/knowledge/lesson.md': note({ disposition: 'archive' }) });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /archiving is a destination, not a label/);
  } finally {
    r.done();
  }
});

test('archive/ is out of scope, and so are the two files that govern the folder', () => {
  const r = repo({
    'docs/knowledge/archive/old.md': '# Superseded\n',
    'docs/knowledge/INDEX.md': '# The contract\n',
    'docs/knowledge/changelog.md': '# The ledger\n',
  });
  try {
    assert.deepEqual(messages(r.root), []);
    assert.match(summary({ repoRoot: r.root }), /^0 in-scope file\(s\)/);
  } finally {
    r.done();
  }
});

test('a missing folder is a legitimate state, not a finding', () => {
  const r = repo({ 'README.md': '# Nothing to decide\n' });
  try {
    assert.deepEqual(messages(r.root), []);
    assert.match(summary({ repoRoot: r.root }), /does not exist/);
  } finally {
    r.done();
  }
});

test('the committed folder is dispositioned', () => {
  const found = run().map((finding) => finding.message);
  assert.deepEqual(found, [], found.join('\n'));
});
