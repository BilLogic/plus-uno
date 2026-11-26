// An ADR's status line and its frontmatter must say the same thing.
//
// The pass that prompted this found ADRs whose body said "Superseded" while the
// frontmatter still said `active`, so anything reading the frontmatter (the
// index, an agent filtering for live decisions) took a retired decision as
// standing. Each rule is proven by a fixture tree that breaks it; the committed
// ADRs are the last test.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { run, summary } from './check-adr-status.mjs';

/** A throwaway repo holding the ADRs the test names. */
function repo(adrs = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'adr-status-'));
  for (const [name, body] of Object.entries(adrs)) {
    mkdirSync(path.join(root, 'docs/adr'), { recursive: true });
    writeFileSync(path.join(root, 'docs/adr', name), body);
  }
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

const adr = (status, body = '') => `---\nsummary: A decision\nstatus: ${status}\n---\n\n# ADR-099: A decision\n\n${body}\n`;
const messages = (root) => run({ repoRoot: root }).map((finding) => finding.message);

test('an active ADR with an active status line passes', () => {
  const r = repo({ '099-a.md': adr('active', '- **Status**: Active') });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('a body that says superseded under `status: active` fails', () => {
  const r = repo({ '099-a.md': adr('active', '- **Status**: Superseded by ADR-013 (2026-07-07)') });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /099-a\.md/);
    assert.match(found[0], /status: superseded/);
  } finally {
    r.done();
  }
});

test('a superseded banner counts as the body saying so', () => {
  const r = repo({ '099-a.md': adr('active', '> **Superseded by [ADR-037](037-x.md), 2026-11-03.**') });
  try {
    assert.equal(messages(r.root).length, 1);
  } finally {
    r.done();
  }
});

test('`status: superseded` that names an ADR passes', () => {
  const r = repo({ '099-a.md': adr('superseded', '- **Status**: Superseded by ADR-013 (2026-07-07)') });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('`status: superseded` that names a linked document or a path passes', () => {
  const r = repo({
    '099-a.md': adr('superseded', '- **Status**: Superseded by [ADR-047](047-x.md) (2026-11-13)'),
    '098-b.md': adr('superseded', '- **Status**: Superseded by the tier contract in `AGENTS.md` § The loading contract'),
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('`status: superseded` that names nothing fails', () => {
  const r = repo({ '099-a.md': adr('superseded', '- **Status**: Superseded') });
  try {
    const found = messages(r.root);
    assert.equal(found.length, 1);
    assert.match(found[0], /099-a\.md/);
    assert.match(found[0], /names? what supersedes/);
  } finally {
    r.done();
  }
});

test('`status: superseded` with a vague "by" and no reference fails', () => {
  const r = repo({ '099-a.md': adr('superseded', '- **Status**: Superseded by later work') });
  try {
    assert.equal(messages(r.root).length, 1);
  } finally {
    r.done();
  }
});

test('a partial supersession stays active-with-correction, and a dated "Superseded (date) by" counts as naming', () => {
  const r = repo({
    '099-a.md': adr('active-with-correction', '> **Superseded for motion** by [ADR-041](041-x.md) (2026-11-12).'),
    '098-b.md': adr('superseded', '> **Superseded (2026-11-26) by [ADR-053](053-x.md).**'),
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('a partial supersession ("Superseded for motion") is not flagged under any live status', () => {
  const r = repo({
    '099-a.md': adr('active', '- **Status**: Superseded for motion by [ADR-041](041-x.md)'),
    '098-b.md': adr('active-with-correction', '> **Superseded in part by [ADR-041](041-x.md).**'),
  });
  try {
    assert.deepEqual(messages(r.root), []);
  } finally {
    r.done();
  }
});

test('overview.md and the missing folder are out of scope', () => {
  const r = repo({ 'overview.md': '# Architecture decisions\n\nSuperseded is a status.\n' });
  const empty = repo();
  try {
    assert.deepEqual(messages(r.root), []);
    assert.deepEqual(messages(empty.root), []);
    assert.match(summary({ repoRoot: r.root }), /^0 ADR/);
  } finally {
    r.done();
    empty.done();
  }
});

test('the committed ADRs agree with their status lines', () => {
  const found = run().map((finding) => finding.message);
  assert.deepEqual(found, [], found.join('\n'));
});
