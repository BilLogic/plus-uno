#!/usr/bin/env node
/**
 * Smoke tests for the uno-prototype conversation hook FSM.
 * Run: node .cursor/hooks/uno-prototype/test-fsm.mjs
 *
 * Contract: the hook enforces the PRD gate (prd_check → prd_paste) AND Step 2
 * reflection (reflect_learn → reflect_artifact_open → reflect_artifact →
 * reflect_fidelity → reflect_exclude → reflect_confirm), one question per
 * turn. Q2 is two beats (open-ended, then recommendation); reflect_confirm
 * assembles the stored answers into the brief card (the contract). Only after
 * the brief is confirmed does it hand off at build_handoff, where the agent
 * runs Step 3 (Plan) → Step 4 (Generate). The agent composes the PRD-specific
 * options; the FSM guarantees the sequence is asked, in order, never skipped.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSubmit } from './engine.mjs';
import { ACTIVE_INTAKE_FILE, buildAgentIntakeInstruction } from './intake-question.mjs';
import { STATES } from './states.mjs';

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

// Full flow: prd_check → prd_paste → reflection gates (Q2 in two beats) →
// brief confirm → build_handoff.
cleanup('handoff-conv');
const entry = run('prototype this student dashboard', 'handoff-conv');
// Cold-start framing: first question ships with the one-line flow map + progress.
assert.match(entry.agent_message || '', /shape of the whole intake/i);
assert.match(entry.agent_message || '', /progressLabel/i);
assert.equal(readIntake().progressLabel, 'PRD gate · 1 of 2');
run('Yes', 'handoff-conv');
intake = readIntake();
assert.equal(intake.stateId, 'prd_paste');
assert.match(intake.question, /Paste a PRD link or text/i);
assert.equal(intake.progressLabel, 'PRD gate · 2 of 2');
const hiFiPrd = [
  'PRD: Student Dashboard',
  'Acceptance criteria: join session in one click',
  'User flows: view upcoming sessions',
  'Deliverables: Produce a high-fidelity desktop interface using the Plus Design System.',
].join('\n');
// PRD lands → the hook now ENFORCES Step 2 reflection Q1 (not a bare handoff).
const afterPrd = run(hiFiPrd, 'handoff-conv');
assert.equal(afterPrd.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
const learn = readIntake();
assert.equal(learn.stateId, 'reflect_learn');
assert.equal(learn.type, 'reflection');
assert.equal(learn.stepIndex, 1);
assert.equal(learn.stepTotal, 4);
assert.equal(learn.multiSelect, true);
assert.match(learn.question, /trying to achieve/i);
assert.match(learn.guidance || '', /PRD evidence/i);
// Agent is told: PRD received, do Step 1 Understand, then ask ONE reflection question.
assert.match(afterPrd.agent_message || '', /PRD received/i);
assert.match(afterPrd.agent_message || '', /Step 1/i);
assert.match(afterPrd.agent_message || '', /reflection step 1 of 4/i);
// The revise affordance is surfaced, not hidden.
assert.match(afterPrd.agent_message || '', /say "back"/i);
// Even though the PRD says "high-fidelity", the hook never asks a fidelity picker here.
assert.doesNotMatch(afterPrd.agent_message || '', /What fidelity do you want/i);

// Q1 answered → Q2 beat 1: open-ended, designer's words first, no recommendation.
const afterQ1 = run('validate usability, evaluate visual direction', 'handoff-conv');
assert.equal(afterQ1.continue, true);
const artifactOpen = readIntake();
assert.equal(artifactOpen.stateId, 'reflect_artifact_open');
assert.equal(artifactOpen.stepIndex, 2);
assert.equal(artifactOpen.openEnded, true);
assert.match(afterQ1.agent_message || '', /OPEN-ENDED beat/i);
// Anti-anchoring: the open beat must forbid a recommendation AND an options
// menu. Asserted on meaning, not on one phrasing — the wording changed once
// already when the instructions were made runtime-neutral.
assert.match(afterQ1.agent_message || '', /no (options|recommendation)|not? present a recommendation/i);
assert.match(afterQ1.agent_message || '', /own words/i);

// Q2 beat 1 answered → Q2 beat 2: the recommendation, single-select
run('something clickable I can put in front of students', 'handoff-conv');
const artifact = readIntake();
assert.equal(artifact.stateId, 'reflect_artifact');
assert.equal(artifact.stepIndex, 2);
assert.equal(artifact.multiSelect, false);
assert.equal(artifact.openEnded, false);

// Q2 answered → Q3 (fidelity) — scale-line rendering, PRD-anchored, no bare confirm
run('interactive prototype', 'handoff-conv');
const fidelity = readIntake();
assert.equal(fidelity.stateId, 'reflect_fidelity');
assert.equal(fidelity.stepIndex, 3);
assert.match(fidelity.guidance || '', /low↔high scale/i);
assert.match(fidelity.guidance || '', /RESTATE/);

// Q3 answered → Q4 (exclusions)
run('mid visual, real interactions', 'handoff-conv');
const exclude = readIntake();
assert.equal(exclude.stateId, 'reflect_exclude');
assert.equal(exclude.stepIndex, 4);

// Q4 answered → brief confirm: the card carries all stored answers (the contract).
const afterQ4 = run('skip onboarding and settings', 'handoff-conv');
assert.equal(afterQ4.continue, true);
const confirm = readIntake();
assert.equal(confirm.stateId, 'reflect_confirm');
assert.equal(confirm.confirm, true);
assert.match(afterQ4.agent_message || '', /brief card/i);
assert.equal(confirm.reflection.reflect_learn, 'validate usability, evaluate visual direction');
assert.equal(confirm.reflection.reflect_artifact, 'interactive prototype');
assert.equal(confirm.reflection.reflect_fidelity, 'mid visual, real interactions');
assert.equal(confirm.reflection.reflect_exclude, 'skip onboarding and settings');

// Brief confirmed → build_handoff: hook releases, contract rides along.
const built = run('ship it', 'handoff-conv');
assert.equal(built.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);
assert.match(built.agent_message || '', /brief is confirmed/i);
assert.match(built.agent_message || '', /Goal: validate usability/i);
assert.match(built.agent_message || '', /Won't include: skip onboarding/i);
assert.match(built.agent_message || '', /Step 3/i);
assert.match(built.agent_message || '', /Step 4/i);
// The validation loop's objective is the brief.
assert.match(built.agent_message || '', /validation loop/i);

// After handoff the hook does not intercept normal follow-up messages
const afterHandoff = run('now build it', 'handoff-conv');
assert.equal(afterHandoff.continue, true);
assert.equal(afterHandoff.user_message, undefined);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);

// Re-entry in the same conversation reuses the cached PRD and RE-RUNS reflection
// from Q1 (a revision may change the strategy) — no re-upload of the PRD.
const reentry = run('prototype this student dashboard again', 'handoff-conv');
assert.equal(reentry.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
const reentryIntake = readIntake();
assert.equal(reentryIntake.stateId, 'reflect_learn');
assert.equal(reentryIntake.stepIndex, 1);
assert.equal(Boolean(reentryIntake.prdResumed), true);
assert.match(reentry.agent_message || '', /reflection step 1 of 4/i);

// Explicit "new PRD" intent clears the cache and restarts at the PRD check
run('upload a new PRD', 'handoff-conv');
const newPrdIntakeAfterClear = readIntake();
assert.equal(newPrdIntakeAfterClear.stateId, 'prd_check');
assert.equal(Boolean(newPrdIntakeAfterClear.prdResumed), false);

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

// "Yes" at PRD check → paste step, then any non-empty link/text opens reflection Q1
cleanup('yes-conv');
run('prototype this tutor inbox', 'yes-conv');
run('Yes', 'yes-conv');
intake = readIntake();
assert.equal(intake.stateId, 'prd_paste');
assert.match(intake.question, /Paste a PRD link or text/i);
const yesReflect = run('https://notion.so/acme/just-a-link', 'yes-conv');
assert.equal(yesReflect.continue, true);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true);
assert.equal(readIntake().stateId, 'reflect_learn');
assert.match(yesReflect.agent_message || '', /PRD received/i);

// A blank turn never advances the reflection — the step stays put (no skip)
const emptyReflect = run('   ', 'yes-conv');
assert.equal(emptyReflect.continue, true);
assert.equal(readIntake().stateId, 'reflect_learn');

cleanup();
cleanup('nl-conv');
cleanup('handoff-conv');
cleanup('noprd-conv');
cleanup('yes-conv');
cleanup('terminate-proto-conv');
cleanup('quit-conv');

console.log('All uno-prototype FSM smoke tests passed.');

// ---------------------------------------------------------------------------
// Portability: no injected instruction may name a runtime-specific tool.
// The intake used to ship "AskQuestion with questions.length === 1" — Claude
// Code's API shape — to every model, leaving runtimes without that tool no
// good option. The contract is one-question-per-message; the rendering is the
// runtime's business.
// ---------------------------------------------------------------------------
{
  const TOOL_NAMES = /AskQuestion|AskUserQuestion|questions\.length|questions array/i;
  for (const [id, state] of Object.entries(STATES)) {
    const text = buildAgentIntakeInstruction(state);
    assert.ok(
      !TOOL_NAMES.test(text),
      `injected instruction for "${id}" names a runtime-specific tool — state the contract instead`,
    );
  }
}

console.log('Portability guard passed — no runtime tool names in injected instructions.');
