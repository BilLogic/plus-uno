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
  const prdCacheFile = path.join(STATE_DIR, 'prd-cache', `${safe}.json`);
  if (fs.existsSync(prdCacheFile)) fs.unlinkSync(prdCacheFile);
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

// Natural phrasings trigger intake (regression: "prototype a X" used to slip through)
for (const phrase of [
  'prototype a student attendance dashboard',
  'make a hi-fi prototype of the tutor inbox',
  'spin up a prototype for the parent portal',
]) {
  cleanup('nl-conv');
  const nl = run(phrase, 'nl-conv');
  assert.equal(nl.continue, true, `expected intake for: ${phrase}`);
  assert.match(nl.agent_message || '', /intake/i);
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
  const entryIntake = readIntake();
  assert.equal(entryIntake.stateId, 'prd_check');
  assert.equal(entryIntake.type, 'choice');
  assert.equal(entryIntake.question, 'Do you have a PRD?');
  assert.deepEqual(
    entryIntake.options.map((o) => o.label),
    ['Yes', 'No'],
  );
}
cleanup('nl-conv');

// Review/critique phrasings never trigger the build gate
assert.equal(run('review this prototype').continue, true);

// Inline PRD in the first message still starts at the PRD check choice (no skip)
const inlinePrd =
  'prototype this student dashboard\n\nPRD: Student Dashboard\nAcceptance criteria: join session in one click\nUser flows: view schedule\nDeliverables: high-fidelity desktop interface';
const start = run(inlinePrd);
assert.equal(start.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
const inlineIntake = readIntake();
assert.equal(inlineIntake.stateId, 'prd_check');
assert.equal(inlineIntake.question, 'Do you have a PRD?');
let intake;

// Bypass exits workflow
const bypass = run('terminate this process', 'test-conv');
assert.equal(bypass.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// Natural "terminate prototyping" phrasing also exits
cleanup('terminate-proto-conv');
run('prototype this tutor inbox', 'terminate-proto-conv');
const terminateProto = run('terminate this prototyping process', 'terminate-proto-conv');
assert.equal(terminateProto.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// "quit" exits workflow (per entry message)
cleanup('quit-conv');
run('prototype this tutor inbox', 'quit-conv');
const quitBypass = run('quit', 'quit-conv');
assert.equal(quitBypass.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// PRD + fidelity verification path (high-fi in PRD still asks fidelity verification)
cleanup('hifi-conv');
run('prototype this student dashboard', 'hifi-conv');
run('Yes', 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'prd_paste');
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

// Reject inferred fidelity → hi / mid / low choice (not free text)
run('No, generate a different fidelity', 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'fidelity_level_pick');
assert.deepEqual(
  intake.options.map((o) => o.label),
  ['Hi-fi', 'Mid-fi', 'Low-fi'],
);

run('Low-fi', 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'low_fi_working_through');
assert.deepEqual(
  intake.options.map((o) => o.label),
  ['User flow & system', 'Data flow', 'Flow variety'],
);

run('User flow & system', 'hifi-conv');
intake = readIntake();
assert.equal(intake.stateId, 'user_flow_figjam_link');

// High-fi table verification (no per-field questions; design system is implicit)
cleanup('table-conv');
run('prototype this student dashboard', 'table-conv');
run('Yes', 'table-conv');
const tablePrd = [
  'PRD: Student Dashboard',
  'Scope: Desktop-first student dashboard with header, welcome, sessions, homework, messages, and weekly progress.',
  'Acceptance criteria: join session in one click',
  'User flows: view upcoming sessions',
  'Required screens: Student Dashboard — single desktop screen at 1440px',
  'Deliverables: Produce a high-fidelity desktop interface.',
].join('\n');
run(tablePrd, 'table-conv');
run('Yes, generate high-fi', 'table-conv');
run('No', 'table-conv');
intake = readIntake();
assert.equal(intake.stateId, 'hi_confirm_table');
assert.equal(intake.type, 'confirmation_table');
assert.match(intake.table, /Project name/);
assert.match(intake.table, /Student Dashboard/);
assert.match(intake.table, /Required screens/);
assert.doesNotMatch(intake.table, /Which design system/i);
assert.equal(intake.designSystemConfigurable, false);

const confirmed = run('Confirm and continue', 'table-conv');
assert.equal(confirmed.continue, true);
assert.match(confirmed.agent_message || '', /briefing confirmed/i);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);
assert.equal(fs.existsSync(path.join(BRIEFING_DIR, 'table-conv.md')), true);

// After confirmation the hook does not intercept normal messages
const afterConfirm = run('please start building the dashboard', 'table-conv');
assert.equal(afterConfirm.continue, true);
assert.equal(afterConfirm.user_message, undefined);

const execute = run('uno-prototype:execute', 'table-conv');
assert.equal(execute.continue, true);

// Challenge branch: one choice maps directly to the tool prompt-spec
cleanup('branch-conv');
run('prototype this tutor dashboard', 'branch-conv');
run('Yes', 'branch-conv');
run('https://notion.so/acme/prd-123', 'branch-conv');
run('Mid-fi', 'branch-conv');
intake = readIntake();
assert.equal(intake.stateId, 'challenge_question');
assert.equal(intake.question, "What's the challenge?");
assert.deepEqual(
  intake.options.map((o) => o.label),
  ['Validate layout & interaction', 'Functional / working UI', 'Other'],
);

const challenge = run('Functional / working UI', 'branch-conv');
assert.equal(challenge.continue, true);
assert.match(challenge.agent_message || '', /functional \/ working UI/i);
assert.match(challenge.agent_message || '', /v0/i);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// Follow-up fidelity switch reuses cached PRD and skips re-upload
const afterChallenge = run('I want to switch to another fidelity', 'branch-conv');
assert.equal(afterChallenge.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
const switchIntake = readIntake();
assert.equal(switchIntake.stateId, 'fidelity_select');
assert.equal(switchIntake.prdResumed, true);
assert.match(switchIntake.question, /already have your PRD/i);

// Prototype re-entry in the same conversation also skips PRD upload when cached
cleanup('reentry-conv');
run('prototype this tutor dashboard', 'reentry-conv');
run('Yes', 'reentry-conv');
run('https://notion.so/acme/prd-123', 'reentry-conv');
run('Mid-fi', 'reentry-conv');
run('Validate layout & interaction', 'reentry-conv');
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);
const reentry = run('prototype this tutor dashboard', 'reentry-conv');
assert.equal(reentry.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
const reentryIntake = readIntake();
assert.equal(reentryIntake.stateId, 'fidelity_select');
assert.equal(reentryIntake.prdResumed, true);

// Explicit "new PRD" intent clears cache and restarts at PRD check
run('upload a new PRD', 'reentry-conv');
const newPrdIntakeAfterClear = readIntake();
assert.equal(newPrdIntakeAfterClear.stateId, 'prd_check');
assert.equal(Boolean(newPrdIntakeAfterClear.prdResumed), false);

// Challenge "Other" free text is handed to the agent (FSM exits)
cleanup('challenge-other-conv');
run('prototype this tutor dashboard', 'challenge-other-conv');
run('Yes', 'challenge-other-conv');
run('https://notion.so/acme/prd-999', 'challenge-other-conv');
run('Mid-fi', 'challenge-other-conv');
run('Other', 'challenge-other-conv');
intake = readIntake();
assert.equal(intake.stateId, 'challenge_other');
assert.equal(intake.allowTextInput, true);
const otherChallenge = run('I want to brainstorm the onboarding narrative', 'challenge-other-conv');
assert.equal(otherChallenge.continue, true);
assert.equal(otherChallenge.user_message, undefined);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// Challenge free text without selecting Other still hands off to the agent
cleanup('challenge-free-conv');
run('prototype this tutor dashboard', 'challenge-free-conv');
run('Yes', 'challenge-free-conv');
run('https://notion.so/acme/prd-888', 'challenge-free-conv');
run('Mid-fi', 'challenge-free-conv');
const freeChallenge = run('I want to brainstorm the onboarding narrative', 'challenge-free-conv');
assert.equal(freeChallenge.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// High-fi Figma "Yes" accepts a link and proceeds to the verify table
cleanup('figma-conv');
run('prototype this student dashboard', 'figma-conv');
run('Yes', 'figma-conv');
const figmaPrd = [
  'PRD: Student Dashboard',
  'Scope: Desktop-first student dashboard.',
  'Acceptance criteria: join session in one click',
  'Required screens: Student Dashboard — single desktop screen at 1440px',
  'Deliverables: Produce a high-fidelity desktop interface.',
].join('\n');
run(figmaPrd, 'figma-conv');
run('Yes, generate high-fi', 'figma-conv');
let figmaIntake = readIntake();
assert.equal(figmaIntake.stateId, 'hi_figma_check');
run('Yes', 'figma-conv');
figmaIntake = readIntake();
assert.equal(figmaIntake.stateId, 'hi_figma_link');
run('https://figma.com/design/abc123/Student-Dashboard', 'figma-conv');
figmaIntake = readIntake();
assert.equal(figmaIntake.stateId, 'hi_confirm_table');

// "No" at the PRD check step → terminate workflow and recommend uno-synthesize
cleanup('noprd-conv');
run('prototype this parent portal', 'noprd-conv');
intake = readIntake();
assert.equal(intake.stateId, 'prd_check');
const noPrd = run('No', 'noprd-conv');
assert.equal(noPrd.continue, true);
assert.match(noPrd.agent_message || '', /uno-synthesize/i);
assert.match(noPrd.agent_message || '', /uno-bot/i);
assert.match(noPrd.agent_message || '', /stopping the uno-prototype workflow/i);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);
// Session is terminated — a follow-up message passes through untouched
const afterNo = run('hello there', 'noprd-conv');
assert.equal(afterNo.continue, true);
assert.equal(afterNo.user_message, undefined);

// "Yes" at PRD check → paste step, then any non-empty link/text advances to fidelity
cleanup('yes-conv');
run('prototype this tutor inbox', 'yes-conv');
run('Yes', 'yes-conv');
intake = readIntake();
assert.equal(intake.stateId, 'prd_paste');
assert.match(intake.question, /Paste a PRD link or text/i);
run('https://notion.so/acme/just-a-link', 'yes-conv');
const yesIntake = readIntake();
assert.equal(yesIntake.stateId, 'fidelity_select');

// Flexible mid-fi step: off-topic replies pass through to normal conversation
cleanup('flex-conv');
run('prototype this tutor dashboard', 'flex-conv');
run('Yes', 'flex-conv');
run('https://notion.so/acme/prd-123', 'flex-conv');
run('Mid-fi', 'flex-conv');
intake = readIntake();
assert.equal(intake.stateId, 'challenge_question');
const flexReply = run('I want to switch to another fidelity', 'flex-conv');
assert.equal(flexReply.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
const flexSwitchIntake = readIntake();
assert.equal(flexSwitchIntake.stateId, 'fidelity_select');
assert.equal(flexSwitchIntake.prdResumed, true);

cleanup();
cleanup('nl-conv');
cleanup('hifi-conv');
cleanup('table-conv');
cleanup('branch-conv');
cleanup('challenge-other-conv');
cleanup('challenge-free-conv');
cleanup('figma-conv');
cleanup('noprd-conv');
cleanup('yes-conv');
cleanup('flex-conv');
cleanup('reentry-conv');
cleanup('terminate-proto-conv');

console.log('All uno-prototype FSM smoke tests passed.');
