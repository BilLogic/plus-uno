#!/usr/bin/env node
/**
 * Tests for the Claude Code adapter of the DS write-back gate.
 * Run: node .cursor/hooks/uno-writeback/test-claude-adapter.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADAPTER = path.join(__dirname, 'claude.mjs');
const ROOT = path.join(__dirname, '..', '..', '..');
const GATE_FILE = path.join(__dirname, '..', 'briefings', 'active-writeback-gate.json');
const PASS_FILE = path.join(__dirname, '..', 'briefings', 'writeback-audit-pass.json');
const SESSION = 'claude-wb-test';
const STATE_FILE = path.join(__dirname, '..', 'state', `writeback-${SESSION}.json`);

function run(prompt) {
  return spawnSync('node', [ADAPTER], {
    input: JSON.stringify({
      session_id: SESSION,
      cwd: ROOT,
      hook_event_name: 'UserPromptSubmit',
      prompt,
    }),
    encoding: 'utf8',
  });
}

function cleanup() {
  for (const f of [GATE_FILE, PASS_FILE, STATE_FILE]) if (fs.existsSync(f)) fs.unlinkSync(f);
}

cleanup();

// No gate file, ordinary prompt: no output, exit 0, no gate file created.
const quiet = run('help me tweak this card');
assert.equal(quiet.status, 0);
assert.equal(quiet.stdout, '');
assert.equal(fs.existsSync(GATE_FILE), false);

// Write-back prompt: gate file written, briefing returned as additionalContext.
const start = run('write back to figma in Test-Roundtrip');
assert.equal(start.status, 0);
const started = JSON.parse(start.stdout);
assert.equal(started.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
assert.match(started.hookSpecificOutput.additionalContext, /write-back gate/i);
assert.equal(fs.existsSync(GATE_FILE), true);

// Gate active: the briefing rides along on the next prompt too.
const next = run('continue');
assert.match(JSON.parse(next.stdout).hookSpecificOutput.additionalContext, /write-back gate/i);

// Capture as the deliverable is blocked in Claude's block shape.
const blocked = JSON.parse(run('use generate_figma_design to capture the page').stdout);
assert.equal(blocked.decision, 'block');
assert.match(blocked.reason, /Blocked/i);

// Bypass clears the gate and goes quiet.
const bypass = run('terminate writeback');
assert.equal(bypass.status, 0);
assert.equal(bypass.stdout, '');
assert.equal(fs.existsSync(GATE_FILE), false);

// Garbage and empty stdin fail open.
for (const input of ['', 'not json']) {
  const r = spawnSync('node', [ADAPTER], { input, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
}

cleanup();
console.log('All uno-writeback Claude adapter tests passed.');
