// The pointer sweep, mutation-tested: each rule is proven by a router that
// breaks it, not by the committed router passing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sweep, pointersIn, triggersIn } from './check-pointers.mjs';

/** A throwaway repo: a router plus whatever files the test says exist. */
function repo(router, files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'pointers-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  writeFileSync(path.join(root, 'AGENTS.md'), router);
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test('a pointer to a file that exists resolves', () => {
  const r = repo('Load `docs/a.md` first.', { 'docs/a.md': '# A' });
  try { assert.deepEqual(sweep(r.root).failures, []); } finally { r.done(); }
});

test('a pointer to a missing file fails and names it', () => {
  const r = repo('Load `docs/gone.md` first.', { 'docs/here.md': '# H' });
  try {
    const { failures } = sweep(r.root);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /docs\/gone\.md/);
    assert.match(failures[0], /does not resolve/);
  } finally { r.done(); }
});

test('a section pointer checks the heading, case-insensitively, and stops where the sentence resumes', () => {
  const r = repo('See `docs/t.md` § Non-negotiable rules is the law (ratified).', { 'docs/t.md': '# T\n\n## Non-Negotiable Rules\n' });
  try { assert.deepEqual(sweep(r.root).failures, []); } finally { r.done(); }
});

test('a section pointer to a renamed heading fails', () => {
  const r = repo('See `docs/t.md` § Imports.', { 'docs/t.md': '# T\n\n## Exports\n' });
  try {
    const { failures } = sweep(r.root);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /§ Imports/);
  } finally { r.done(); }
});

test('a bare filename names a shape, not a place, and is skipped', () => {
  const r = repo('A skill loads its own `SKILL.md` and `references/method.md`.', { 'docs/x.md': '' });
  try { assert.deepEqual(pointersIn('`SKILL.md` and `references/method.md`', r.root), []); } finally { r.done(); }
});

test('a conditional pointer ("when `path` exists") is not required to resolve', () => {
  const r = repo('When `.cursor/hooks/briefings/gate.json` exists, follow it.', { '.cursor/keep': '' });
  try { assert.deepEqual(sweep(r.root).failures, []); } finally { r.done(); }
});

test('a Progressive loading trigger that leads with filler fails', () => {
  const router = '## Progressive loading\n\n| Trigger | Load |\n|---|---|\n| Any DS task | `docs/a.md` |\n| Building UI | `docs/a.md` |\n';
  const r = repo(router, { 'docs/a.md': '' });
  try {
    const { failures, triggers } = sweep(r.root);
    assert.equal(triggers, 2);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /"Any DS task" leads with "any"/);
  } finally { r.done(); }
});

test('triggers are read only from the Progressive loading table', () => {
  assert.deepEqual(triggersIn('## Other\n\n| Any x | y |\n'), []);
});

test('the committed router passes', () => {
  const { failures } = sweep();
  assert.deepEqual(failures, [], failures.join('\n'));
});
