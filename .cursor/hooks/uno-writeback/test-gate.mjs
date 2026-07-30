#!/usr/bin/env node
/**
 * Smoke tests for the DS write-back gate.
 * Run: node .cursor/hooks/uno-writeback/test-gate.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSubmit } from './engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');
const STATE_DIR = path.join(__dirname, '..', 'state');
const GATE_FILE = path.join(BRIEFING_DIR, 'active-writeback-gate.json');
const PASS_FILE = path.join(BRIEFING_DIR, 'writeback-audit-pass.json');

function run(prompt, conversationId = 'wb-test') {
  return handleSubmit({
    prompt,
    conversation_id: conversationId,
    workspace_roots: [path.join(__dirname, '..', '..', '..')],
  });
}

function cleanup(conversationId = 'wb-test') {
  const safe = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const stateFile = path.join(STATE_DIR, `writeback-${safe}.json`);
  if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  if (fs.existsSync(GATE_FILE)) fs.unlinkSync(GATE_FILE);
  if (fs.existsSync(PASS_FILE)) fs.unlinkSync(PASS_FILE);
}

cleanup();

assert.equal(run('help me tweak this card').continue, true);

const start = run('write back to figma in Test-Roundtrip', 'wb-test');
assert.equal(start.continue, true);
assert.match(start.agent_message || '', /write-back gate/i);
assert.equal(fs.existsSync(GATE_FILE), true);

const blocked = run('use generate_figma_design to capture the page', 'wb-test');
assert.equal(blocked.continue, false);
assert.match(blocked.user_message || '', /Blocked/i);

const bypass = run('terminate writeback', 'wb-test');
assert.equal(bypass.continue, true);
assert.equal(fs.existsSync(GATE_FILE), false);

cleanup();
console.log('All uno-writeback gate smoke tests passed.');
