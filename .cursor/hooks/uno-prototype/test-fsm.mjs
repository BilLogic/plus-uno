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
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleGateAnswer, handleSubmit } from './engine.mjs';
import { hasPrototypeIntent, isMachineTurn } from './intents.mjs';
import {
  ACTIVE_INTAKE_FILE,
  buildAgentIntakeInstruction,
  isIntakeQuestionApplicable,
} from './intake-question.mjs';
import { INTAKE_TTL_MS, isStale } from './constants.mjs';
import { STATES } from './states.mjs';
import { clearSession } from './storage.mjs';

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

// Meta-discussion about the skill/hook itself never triggers the build gate
// (regression: a bare "uno-prototype" substring used to match regardless of
// context, so a sentence about fixing the gate's own triggering re-triggered
// the gate it was describing).
for (const phrase of [
  'make sure uno-prototype only starts the prd gate when truly starting a new project',
  'fix the uno-prototype hook so it stops over-triggering',
  'debug why the uno-prototype gate fired on this message',
  'update the prd gate logic in intents.mjs',
]) {
  cleanup('meta-conv');
  const meta = run(phrase, 'meta-conv');
  assert.equal(meta.continue, true, `expected pass-through for: ${phrase}`);
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, `expected no intake for: ${phrase}`);
}
cleanup('meta-conv');

// Continuing/updating an ALREADY-EXISTING prototype never triggers the build
// gate — only starting something new does.
for (const phrase of [
  'continue working on the onboarding prototype',
  'update the existing parent portal prototype',
  'fix the tutor inbox prototype',
  'iterate on this prototype',
]) {
  cleanup('continue-conv');
  const cont = run(phrase, 'continue-conv');
  assert.equal(cont.continue, true, `expected pass-through for: ${phrase}`);
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, `expected no intake for: ${phrase}`);
}
cleanup('continue-conv');

// A genuinely new build request still triggers, even when it shares
// vocabulary ("prototype") with the continuation phrasings above.
run('build a new prototype for the parent portal', 'new-conv');
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true, 'expected intake for a genuinely new build request');
cleanup('new-conv');

// The meta and maintenance exclusions never outrank a genuine build request.
// An explicit invocation wins outright, and a maintenance verb only excludes a
// prompt when no build intent comes before it — "prototype X and update the
// prototype copy" is a new build that mentions later upkeep.
for (const phrase of [
  '/uno-prototype build the tutor dashboard, then polish the prototype',
  'prototype the session recap screen and update the prototype copy',
  'create a prototype for the onboarding flow and continue the prototype tomorrow',
  'make a hi-fi prototype of the tutor signup to fix the hook-up flow',
  'skills/uno-prototype build the parent portal',
  '@skills/uno-prototype build the parent portal',
  'uno-prototype: parent portal',
  'use the uno-prototype skill to build the tutor inbox',
  'run uno-prototype on the session recap',
  'use `skills/uno-prototype` to build the parent portal',
]) {
  assert.equal(hasPrototypeIntent(phrase), true, `expected the gate for: ${phrase}`);
}

// Talking about the skill, or quoting a prompt inside a report, is not a
// request to build — the live miss was a review report quoting example
// prompts, which walked a whole intake.
for (const phrase of [
  'fixing the uno-prototype hook regex',
  'why did the uno-prototype gate fire',
  'Finding: the exclusion now wins over an explicit call, so "/uno-prototype build the tutor dashboard, then polish the prototype" no longer fires.',
  'Finding: `prototype the session recap screen and update the prototype copy` stopped firing after the change.',
  'Review report:\n> create a prototype for the onboarding flow and continue the prototype tomorrow\nThis used to fire the gate.',
  'Report:\n```\n/uno-prototype build the tutor dashboard\n```\nquoted from the PR description',
  'edit skills/uno-prototype/SKILL.md so the gate wording is shorter',
  'fix the hook so it stops over-triggering',
]) {
  assert.equal(hasPrototypeIntent(phrase), false, `expected no gate for: ${phrase}`);
}

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

// ---------------------------------------------------------------------------
// Only the person's own chat turns reach the gate. UserPromptSubmit also fires
// for machine-written turns — a background agent's <task-notification>, a
// <system-reminder>, a message relayed from another session — and the hook
// once walked a whole reflection on those, then "confirmed" a brief built
// from them. Such a turn neither starts the gate nor answers a step.
// ---------------------------------------------------------------------------
const PRD_TEXT = 'PRD: Student Dashboard\nAcceptance criteria: join in one click\nUser flows: view sessions';

/** Walk a conversation from its first prompt to reflection step 1. */
function startReflection(conversationId) {
  cleanup(conversationId);
  run('prototype this student dashboard', conversationId);
  run('Yes', conversationId);
  run(PRD_TEXT, conversationId);
  assert.equal(readIntake().stateId, 'reflect_learn');
}

{
  const MACHINE_TURNS = [
    '<task-notification>\n<task-id>a1</task-id>\n<status>completed</status>\n<result>prototype this student dashboard next</result>\n</task-notification>',
    '<system-reminder>prototype a tutor inbox</system-reminder>',
    '<cross-session-message from="other">make a hi-fi prototype of the parent portal</cross-session-message>',
    '<teammate-message teammate_id="impl">build a prototype for the onboarding flow</teammate-message>',
  ];

  for (const turn of MACHINE_TURNS) {
    cleanup('machine-start');
    const out = run(turn, 'machine-start');
    assert.equal(out.agent_message, undefined, `a machine turn started the gate: ${turn.slice(0, 40)}`);
    assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);
  }
  cleanup('machine-start');

  startReflection('machine-advance');
  for (const turn of MACHINE_TURNS) {
    const out = run(turn, 'machine-advance');
    assert.equal(out.agent_message, undefined, `a machine turn answered a step: ${turn.slice(0, 40)}`);
    assert.equal(readIntake().stateId, 'reflect_learn');
  }
  // The person's own answer still advances.
  run('validate usability', 'machine-advance');
  assert.equal(readIntake().stateId, 'reflect_artifact_open');
  cleanup('machine-advance');
}

console.log('Machine-turn guard passed — only human turns start or answer the gate.');

// ---------------------------------------------------------------------------
// A briefing binds only the session that wrote it. The briefing is one fixed
// path shared by every session in the checkout, so a session whose own state
// says "mid-intake" must still find ITS briefing on disk before a turn is read
// as an answer — otherwise it advances, and overwrites, another session's gate.
// ---------------------------------------------------------------------------
{
  startReflection('scope-b');
  cleanup('scope-a');
  run('prototype a tutor inbox', 'scope-a');
  const owned = readIntake();
  assert.equal(owned.conversationId, 'scope-a');
  assert.equal(owned.stateId, 'prd_check');

  const elsewhere = run('validate usability', 'scope-b');
  assert.equal(elsewhere.agent_message, undefined, 'a session advanced on a briefing it does not own');
  assert.deepEqual(readIntake(), owned, "another session's briefing was overwritten");

  // Ending the other session leaves this one's briefing in place.
  clearSession('scope-b');
  assert.deepEqual(readIntake(), owned, "ending one session deleted another session's briefing");

  cleanup('scope-a');
  cleanup('scope-b');
}

// The Claude Code adapters bind nothing without a session id: there is no
// session to scope the briefing to, and a shared "default" id is how unrelated
// sessions used to land on one gate.
{
  const adapter = path.join(__dirname, 'claude-code-run.mjs');
  cleanup('default');
  const noId = spawnSync(process.execPath, [adapter], {
    input: JSON.stringify({ prompt: 'prototype this student dashboard', cwd: path.join(__dirname, '..', '..', '..') }),
    encoding: 'utf8',
  });
  assert.equal(noId.status, 0);
  assert.equal(noId.stdout.trim(), '', 'the adapter opened a gate with no session id');
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false);
  cleanup('default');
}

console.log('Session-scope guard passed — a briefing binds only the session that wrote it.');

// ---------------------------------------------------------------------------
// A stale briefing never binds. A briefing left behind — the session crashed,
// the worktree was recycled, the designer walked away — must not read the
// next prompt as an answer, even in the session that wrote it.
// ---------------------------------------------------------------------------
{
  const backdate = (mutate) => {
    const payload = readIntake();
    mutate(payload);
    fs.writeFileSync(ACTIVE_INTAKE_FILE, JSON.stringify(payload, null, 2));
  };

  startReflection('ttl-conv');
  backdate((p) => {
    p.writtenAt = new Date(Date.now() - INTAKE_TTL_MS - 60_000).toISOString();
  });
  const stale = run('validate usability', 'ttl-conv');
  assert.equal(stale.agent_message, undefined, 'a stale briefing read a prompt as an answer');
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, 'a stale briefing was left in place');

  // A briefing with no timestamp predates the TTL and is stale too.
  startReflection('ttl-conv');
  backdate((p) => {
    delete p.writtenAt;
  });
  assert.equal(run('validate usability', 'ttl-conv').agent_message, undefined);

  // A fresh one still binds.
  startReflection('ttl-conv');
  assert.match(run('validate usability', 'ttl-conv').agent_message || '', /reflection step 2/i);
  cleanup('ttl-conv');
}

console.log('TTL guard passed — a stale briefing never binds.');

// ---------------------------------------------------------------------------
// Injected envelopes, session binding and the TTL, case by case: the real
// hand-back shape, answer-shaped person turns, a missing session id, and one
// staleness rule for session state and briefing alike.
// ---------------------------------------------------------------------------
// Only the person's own turns reach the gate. A subagent hand-back, a task
// notification or any other injected message is not an answer, and quoting an
// invocation inside one does not start an intake (the live miss walked a whole
// reflection on hand-backs and confirmed a brief built from them).
// The shape Claude Code delivers a subagent hand-back in: a prose first line,
// then the envelope.
const HAND_BACK =
  'Another Claude session sent a message:\n<agent-message from="agent-a0ef">q1 a, q2 b, go ahead</agent-message>';
const TASK_NOTIFICATION =
  '<task-notification>\n<task-id>a1b2</task-id>\n<status>completed</status>\n<result>Done. Next: /uno-prototype build the tutor dashboard</result>\n</task-notification>';
for (const machine of [
  TASK_NOTIFICATION,
  '<system-reminder>The briefing file changed.</system-reminder>',
  '<ci-monitor-event>check "test" failed on #42</ci-monitor-event>',
  '<cross-session-message from="session-b">prototype a tutor inbox</cross-session-message>',
  '[Artifact comment sent to Claude] prototype this card',
  HAND_BACK,
  'Results are in.\n<task-notification>\n<status>completed</status>\n</task-notification>',
  'Stop hook feedback:\nprototype the lint fix',
  '[SYSTEM NOTIFICATION] prototype a new header',
  '  <agent-message from="agent-x">Yes</agent-message>',
]) {
  assert.equal(isMachineTurn(machine), true, `expected a machine turn: ${machine.slice(0, 40)}`);
}
for (const person of [
  'q1 a, q2 b, go ahead',
  'Yes',
  '/uno-prototype build the parent portal',
  '<command-name>/uno-prototype</command-name>\n<command-args>parent portal</command-args>',
  '<div> in the header looks off, prototype a fix',
  '<my-widget> renders twice on the dashboard',
  'sent a test in sandbox, check the row',
]) {
  assert.equal(isMachineTurn(person), false, `expected a person turn: ${person}`);
}

// Answer-shaped person turns never START a gate, and with no session in this
// conversation they confirm nothing.
cleanup('machine-conv');
for (const phrase of ['q1 a, q2 b, go ahead', 'sent a test in sandbox, check the row']) {
  assert.equal(run(phrase, 'machine-conv').agent_message, undefined, `no gate for: ${phrase}`);
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, `no intake for: ${phrase}`);
}

// No session id, no gate: there is no shared fallback state to start or advance.
assert.equal(handleSubmit({ prompt: '/uno-prototype build the parent portal' }).agent_message, undefined);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, 'no session id starts nothing');
assert.equal(handleGateAnswer({ answer: 'Yes' }).agent_message, undefined);

assert.equal(run(TASK_NOTIFICATION, 'machine-conv').agent_message, undefined);
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, 'a hand-back must not start an intake');
run('/uno-prototype build the parent portal', 'machine-conv');
run('Yes', 'machine-conv');
run('https://notion.so/acme/parent-portal-prd', 'machine-conv');
assert.equal(readIntake().stateId, 'reflect_learn');
const notified = run(TASK_NOTIFICATION, 'machine-conv');
assert.equal(notified.agent_message, undefined, 'a notification gets no intake context');
assert.equal(readIntake().stateId, 'reflect_learn', 'a notification never advances the gate');
assert.equal(run(HAND_BACK, 'machine-conv').agent_message, undefined, 'a hand-back gets no intake context');
assert.equal(readIntake().stateId, 'reflect_learn', 'a hand-back never advances the gate');

// Another session's intake does not bind this one: its answers-shaped turn
// passes through, gets no context, and leaves the owner's briefing alone.
for (const phrase of ['q1 a, q2 b, go ahead', 'sent a test in sandbox, check the row']) {
  assert.equal(run(phrase, 'idle-conv').agent_message, undefined, `no context for: ${phrase}`);
}
assert.equal(readIntake().conversationId, 'machine-conv');
assert.equal(readIntake().stateId, 'reflect_learn');
clearSession('idle-conv');
assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), true, "one session's cleanup keeps another's briefing");

// The briefing binds only its own session, and only while fresh.
{
  const now = Date.parse('2026-10-12T12:00:00Z');
  const fresh = { conversationId: 'a', writtenAt: new Date(now - 60_000).toISOString() };
  const old = { conversationId: 'a', writtenAt: new Date(now - INTAKE_TTL_MS - 1).toISOString() };
  assert.equal(isIntakeQuestionApplicable(fresh, 'a', now), true);
  assert.equal(isIntakeQuestionApplicable(fresh, 'b', now), false, 'another session');
  assert.equal(isIntakeQuestionApplicable(old, 'a', now), false, 'older than the TTL');
  assert.equal(isIntakeQuestionApplicable({ conversationId: 'a' }, 'a', now), false, 'no timestamp');
  assert.equal(isIntakeQuestionApplicable(null, 'a', now), false);
  // One staleness rule for briefings and session state alike.
  assert.equal(isStale('not a date', now), true, 'unparsable');
  assert.equal(isStale(undefined, now), true, 'missing');
  assert.equal(isStale(fresh.writtenAt, now), false);
}

// An intake idle past the TTL is abandoned: its own session's next turn is not
// consumed as an answer, and any hook run prunes the stale briefing.
{
  const stale = new Date(Date.now() - INTAKE_TTL_MS - 60_000).toISOString();
  const stateFile = path.join(STATE_DIR, 'machine-conv.json');
  fs.writeFileSync(stateFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(stateFile, 'utf8')), updatedAt: stale }));
  fs.writeFileSync(ACTIVE_INTAKE_FILE, JSON.stringify({ ...readIntake(), writtenAt: stale }));
  assert.equal(run('help me fix this button style', 'idle-conv').agent_message, undefined);
  assert.equal(fs.existsSync(ACTIVE_INTAKE_FILE), false, 'a stale briefing is pruned');
  assert.equal(run('validate usability', 'machine-conv').agent_message, undefined);

  // An unparsable session timestamp is stale too, not live forever.
  cleanup('garbled-conv');
  run('/uno-prototype build the parent portal', 'garbled-conv');
  const garbled = path.join(STATE_DIR, 'garbled-conv.json');
  fs.writeFileSync(garbled, JSON.stringify({ ...JSON.parse(fs.readFileSync(garbled, 'utf8')), updatedAt: 'garbage' }));
  assert.equal(run('Yes', 'garbled-conv').agent_message, undefined, 'a garbled session is released');
  cleanup('garbled-conv');
}
cleanup('machine-conv');
cleanup('idle-conv');

console.log('Envelope and binding cases passed.');
