#!/usr/bin/env node
/**
 * Tests for the DS write-back gate across Cursor, Claude Code and Codex.
 * Run: node .cursor/hooks/uno-writeback/test-gate.mjs
 * State and briefings live in a temp dir (UNO_WRITEBACK_HOOKS_DIR), never the repo's.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(__dirname, 'run.mjs');
const ROOT = path.join(__dirname, '..', '..', '..');
const SESSION = 'wb-test';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uno-writeback-'));
const GATE_FILE = path.join(tmp, 'briefings', 'active-writeback-gate.json');
const PASS_FILE = path.join(tmp, 'briefings', 'writeback-audit-pass.json');
const STATE_FILE = path.join(tmp, 'state', `writeback-${SESSION}.json`);

function spawnRunner(input, args = []) {
  return spawnSync('node', [RUNNER, ...args], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, UNO_WRITEBACK_HOOKS_DIR: tmp },
  });
}

const cursor = (prompt) =>
  spawnRunner({ prompt, conversation_id: SESSION, workspace_roots: [ROOT], hook_event_name: 'beforeSubmitPrompt' });
const claude = (prompt) =>
  spawnRunner({ prompt, session_id: SESSION, cwd: ROOT, hook_event_name: 'UserPromptSubmit' });
const context = (r) => JSON.parse(r.stdout).hookSpecificOutput.additionalContext;

try {
  // No write-back intent: Claude/Codex silent; Cursor continues.
  const quiet = claude('help me tweak this card');
  assert.equal(quiet.status, 0);
  assert.equal(quiet.stdout, '');
  assert.equal(fs.existsSync(GATE_FILE), false);
  assert.deepEqual(JSON.parse(cursor('help me tweak this card').stdout), { continue: true });

  // Intent: briefing, gate file, keyed on session_id (not 'default').
  const start = claude('write back to figma in Test-Roundtrip');
  assert.match(context(start), /write-back gate/i);
  assert.equal(fs.existsSync(GATE_FILE), true);
  assert.equal(fs.existsSync(STATE_FILE), true);
  assert.equal(JSON.parse(fs.readFileSync(GATE_FILE, 'utf8')).conversationId, SESSION);

  // Forbidden capture while active: Claude gets context, never a block.
  const guarded = claude('use generate_figma_design to capture the page');
  assert.equal(guarded.status, 0);
  assert.equal(JSON.parse(guarded.stdout).decision, undefined);
  assert.match(context(guarded), /Blocked.*terminate writeback/s);

  // Cursor keeps its block (exit 2).
  const blocked = cursor('use generate_figma_design to capture the page');
  assert.equal(blocked.status, 2);
  assert.equal(JSON.parse(blocked.stdout).continue, false);
  assert.match(JSON.parse(blocked.stdout).user_message, /Blocked/);

  // Session end clears this session's state and gate files; leaves another session's.
  fs.writeFileSync(PASS_FILE, JSON.stringify({ conversationId: 'someone-else' }));
  const other = spawnRunner({ session_id: 'other', hook_event_name: 'SessionEnd' });
  assert.equal(other.status, 0);
  assert.equal(fs.existsSync(GATE_FILE), true);
  const end = spawnRunner({ session_id: SESSION, hook_event_name: 'SessionEnd' });
  assert.equal(end.status, 0);
  assert.equal(fs.existsSync(STATE_FILE), false);
  assert.equal(fs.existsSync(GATE_FILE), false);
  assert.equal(fs.existsSync(PASS_FILE), true, 'pass file of another session stays');

  // Cursor sessionEnd (flag) clears too.
  cursor('write back to figma in Test-Roundtrip');
  assert.equal(fs.existsSync(STATE_FILE), true);
  spawnRunner({ conversation_id: SESSION }, ['--session-end']);
  assert.equal(fs.existsSync(STATE_FILE), false);

  // Terminate phrase clears the gate.
  claude('write back to figma in Test-Roundtrip');
  assert.equal(claude('terminate writeback').stdout, '');
  assert.equal(fs.existsSync(GATE_FILE), false);

  // Garbage and empty stdin fail open.
  for (const input of ['', 'not json']) {
    const r = spawnRunner(input);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
  }
  console.log('All uno-writeback gate tests passed.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
