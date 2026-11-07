import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { editedPath, handle } from './post-edit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const finding = (rule, level = 'fail') => ({ rule, level, file: 'prototypes/x/src/App.jsx', line: 3, col: 1, message: 'm', fix: 'f' });

test('editedPath reads Claude Code and Cursor payloads, repo-relative', () => {
  assert.equal(editedPath({ tool_name: 'Edit', tool_input: { file_path: `${ROOT}/prototypes/x/src/App.jsx` } }, ROOT), 'prototypes/x/src/App.jsx');
  assert.equal(editedPath({ tool_name: 'MultiEdit', tool_input: { file_path: 'prototypes/x/a.scss' } }, ROOT), 'prototypes/x/a.scss');
  assert.equal(editedPath({ file_path: `${ROOT}/src/App.jsx`, edits: [] }, ROOT), 'src/App.jsx');
  assert.equal(editedPath({ tool_name: 'Bash', tool_input: { command: 'ls' } }, ROOT), null);
});

test('out of scope: no check, no log, exit 0', () => {
  for (const rel of ['docs/engineering/setup.md', 'design-system/src/components/x/X.jsx', 'scripts/a.mjs', 'prototypes/x/App.test.jsx']) {
    let called = false;
    const out = handle({ tool_input: { file_path: rel } }, { repoRoot: ROOT, check: () => ((called = true), []) });
    assert.deepEqual([out.ran, out.exitCode, called, out.log], [false, 0, false, null], rel);
  }
});

test('in scope with a fail-level escape: exit 2, findings on stderr, a log line by rule', () => {
  const out = handle(
    { session_id: 's1', tool_input: { file_path: 'prototypes/x/src/App.jsx' } },
    { repoRoot: ROOT, check: () => [finding('ds/no-deep-import'), finding('ds/no-deep-import'), finding('ds/no-retired-name', 'warn')], now: () => 't' },
  );
  assert.equal(out.exitCode, 2);
  assert.match(out.stderr, /prototypes\/x\/src\/App\.jsx:3:1  ds\/no-deep-import/);
  assert.doesNotMatch(out.stderr, /no-retired-name/);
  assert.deepEqual(out.log, { time: 't', file: 'prototypes/x/src/App.jsx', session: 's1', fail: 2, warn: 1, by_rule: { 'ds/no-deep-import': 2 } });
});

test('in scope and clean (or warnings only): silent, exit 0, still logged', () => {
  const out = handle({ tool_input: { file_path: 'src/App.jsx' } }, { repoRoot: ROOT, check: () => [finding('ds/no-retired-name', 'warn')], now: () => 't' });
  assert.deepEqual([out.exitCode, out.stderr, out.log.fail], [0, '', 0]);
});

test('DS_USAGE_HOOK=off, or a checker that throws, never blocks', () => {
  const off = handle({ tool_input: { file_path: 'src/App.jsx' } }, { repoRoot: ROOT, env: { DS_USAGE_HOOK: 'off' }, check: () => [finding('ds/no-deep-import')] });
  assert.deepEqual([off.ran, off.exitCode], [false, 0]);
  const broken = handle({ tool_input: { file_path: 'src/App.jsx' } }, { repoRoot: ROOT, check: () => { throw new Error('boom'); } });
  assert.equal(broken.exitCode, 0);
});

test('end to end: a deep import in a prototype comes back to the agent; removing it goes quiet', () => {
  const dir = path.join(ROOT, 'prototypes', `.ds-usage-hook-test-${process.pid}`);
  const file = path.join(dir, 'App.jsx');
  const log = path.join(ROOT, '.local', `ds-usage-hook-test-${process.pid}.jsonl`);
  const run = () =>
    spawnSync(process.execPath, [path.join(ROOT, '.cursor/hooks/ds-usage/post-edit.mjs')], {
      input: JSON.stringify({ session_id: 'e2e', tool_name: 'Write', tool_input: { file_path: file } }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, DS_USAGE_HOOK_LOG: log },
      encoding: 'utf8',
    });
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, "import StatusTag from '@/components/labels/StatusTag';\n");
    const dirty = run();
    assert.equal(dirty.status, 2);
    assert.match(dirty.stderr, /ds\/no-deep-import/);
    fs.writeFileSync(file, "import { StatusTag } from '@/components';\n");
    const clean = run();
    assert.deepEqual([clean.status, clean.stderr], [0, '']);
    assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(log, { force: true });
  }
});
