#!/usr/bin/env node
/**
 * Smoke tests for the uno-prototype conversation hook FSM.
 * Run: node .cursor/hooks/uno-prototype/test-fsm.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSubmit } from './engine.mjs';
import { ACTIVE_INTAKE_FILE } from './intake-question.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, '..', 'state');
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');

function run(prompt, conversationId = 'test-conv', attachments = []) {
  return handleSubmit({
    prompt,
    conversation_id: conversationId,
    attachments,
    workspace_roots: [path.join(__dirname, '..', '..', '..')],
  });
}

function cleanup(conversationId = 'test-conv') {
  const safe = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  for (const dir of [STATE_DIR, BRIEFING_DIR]) {
    const stateFile = path.join(STATE_DIR, `${safe}.json`);
    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
    const briefingFile = path.join(BRIEFING_DIR, `${safe}.md`);
    if (fs.existsSync(briefingFile)) fs.unlinkSync(briefingFile);
  }
  if (fs.existsSync(ACTIVE_INTAKE_FILE)) fs.unlinkSync(ACTIVE_INTAKE_FILE);
  const activeBriefing = path.join(BRIEFING_DIR, 'active-prototype-briefing.md');
  if (fs.existsSync(activeBriefing)) fs.unlinkSync(activeBriefing);
}

function readIntake() {
  return JSON.parse(fs.readFileSync(ACTIVE_INTAKE_FILE, 'utf8'));
}

cleanup();

// Non-prototype prompts pass through
assert.equal(run('help me fix this button style').continue, true);

// Prototype intent always starts at PRD check — even with inline PRD in the same message
const inlinePrd =
  'prototype this student dashboard\n\nPRD: Student Dashboard\nAcceptance criteria: join session in one click\nUser flows: view schedule\nDeliverables: high-fidelity desktop interface';
const start = run(inlinePrd);
assert.equal(start.continue, true);
assert.match(start.agent_message || '', /AskQuestion|intake/i);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
let intake = readIntake();
assert.equal(intake.stateId, 'prd_check');
assert.equal(intake.question, 'Do you already have a PRD?');
assert.equal(intake.oneQuestionOnly, true);
assert.equal(intake.neverSkipStep, true);

// Bypass exits workflow
const bypass = run('terminate this process', 'test-conv');
assert.equal(bypass.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// PRD + fidelity verification path (high-fi in PRD still asks fidelity verification)
cleanup('hifi-conv');
run('prototype this student dashboard', 'hifi-conv');
run('Yes', 'hifi-conv');
const hiFiPrd = [
  'PRD: Student Dashboard',
  'Acceptance criteria: join session in one click',
  'User flows: view upcoming sessions',
  'Deliverables: Produce a high-fidelity desktop interface using the Plus Design System.',
].join('\n');
run(hiFiPrd, 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'fidelity_select');
assert.match(intake.question, /high-fidelity/i);
assert.deepEqual(
  intake.options.map((o) => o.label),
  ['Yes, generate high-fi', 'No, generate a different fidelity'],
);

// Reject inferred fidelity → text step for alternative
run('No, generate a different fidelity', 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'fidelity_other');
assert.equal(intake.allowTextInput, true);

run('user flow', 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'user_flow_figjam_link');

// Challenge branch includes tool selection before deliverable
cleanup('branch-conv');
run('prototype this tutor dashboard', 'branch-conv');
run('Yes', 'branch-conv');
run('https://notion.so/acme/prd-123', 'branch-conv');
run('Challenge / Ideation', 'branch-conv');
intake = readIntake();
assert.equal(intake.stateId, 'challenge_question');

run('Tutors cannot find student history quickly', 'branch-conv');
intake = readIntake();
assert.equal(intake.stateId, 'challenge_tool_select');
assert.match(intake.question, /external tool/i);

const challenge = run('v0 / Google AI Studio', 'branch-conv');
assert.equal(challenge.continue, false);
assert.match(challenge.user_message, /Challenge \/ Ideation prompt-spec/i);
assert.match(challenge.user_message, /v0/i);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

cleanup();
cleanup('hifi-conv');
cleanup('branch-conv');

console.log('All uno-prototype FSM smoke tests passed.');
