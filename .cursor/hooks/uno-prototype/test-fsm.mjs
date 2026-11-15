#!/usr/bin/env node
/**
 * Tests for the uno-prototype brief-card runner over `intake-steps.json`.
 * Run: node .cursor/hooks/uno-prototype/test-fsm.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cardPath,
  currentStepOf,
  DELIVERABLES,
  DIMENSIONS,
  handleSubmit,
  INTAKE_SPEC,
  isExplicitStart,
  readCard,
  STEPS,
  STEP_IDS,
  writeCard,
} from './engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN_SCRIPT = path.join(__dirname, 'run.mjs');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uno-prototype-card-'));

function run(prompt, sessionId = 'test-session', extra = {}) {
  return handleSubmit({
    prompt,
    session_id: sessionId,
    briefingsDir: tmpDir,
    ...extra,
  });
}

function fillField(sessionId, stepId, value) {
  const card = readCard(sessionId, tmpDir);
  assert.ok(card, `card for ${sessionId} should exist`);
  card[stepId] = value;
  writeCard(sessionId, card, tmpDir);
}

try {
  // 1. Declarative step list structure: 8 steps, 4 questions, 5 dimensions, all deliverables.
  assert.equal(INTAKE_SPEC.totalSteps, 8);
  assert.equal(INTAKE_SPEC.totalQuestions, 4);
  assert.equal(STEPS.length, 8);
  assert.deepEqual(STEP_IDS, [
    'prd_check',
    'prd_paste',
    'reflect_learn',
    'reflect_artifact_open',
    'reflect_fidelity',
    'reflect_artifact',
    'reflect_exclude',
    'reflect_confirm',
  ]);
  assert.deepEqual(
    DIMENSIONS.map((d) => d.id),
    ['Visual', 'Interaction', 'Breadth', 'Depth', 'Data/Content'],
  );
  for (const dim of DIMENSIONS) {
    assert.ok(dim.definition && dim.definition.length > 10, `dimension ${dim.id} has definition`);
  }

  // Q1 asks both goal and audience.
  const q1 = STEPS.find((s) => s.id === 'reflect_learn');
  assert.match(q1.question, /who will see it/i);

  // Hooked path offers every deliverable (including data-flow map, static hi-fi mockup, hi-fi build).
  const artifactStep = STEPS.find((s) => s.id === 'reflect_artifact');
  for (const required of ['data-flow map', 'static hi-fi mockup', 'hi-fi build on the design system']) {
    assert.ok(DELIVERABLES.includes(required), `DELIVERABLES includes ${required}`);
    assert.ok(artifactStep.options.includes(required), `reflect_artifact options includes ${required}`);
  }

  // 2. Explicit start only: plain-words build requests do not trigger the intake.
  assert.equal(isExplicitStart('build a prototype for tutor onboarding'), false);
  assert.equal(isExplicitStart('prototype this PRD for me'), false);
  assert.equal(isExplicitStart('The report says `/uno-prototype` was slow'), true);
  assert.equal(isExplicitStart('The report says "run /uno-prototype first" in §2'), false);
  assert.equal(isExplicitStart('/uno-prototype build the tutor queue'), true);
  assert.equal(isExplicitStart('<command-name>/uno-prototype</command-name>'), true);
  assert.equal(isExplicitStart('skills/uno-prototype'), true);

  const ignored = run('prototype this flow for me', 'no-start');
  assert.equal(ignored.agent_message, undefined);
  assert.equal(readCard('no-start', tmpDir), null);

  // 3. Full step order: prd_check → prd_paste → reflect_learn → reflect_artifact_open →
  //    reflect_fidelity → reflect_artifact → reflect_exclude → reflect_confirm → handoff.
  const s1 = 'full-order';
  const startOut = run('/uno-prototype', s1);
  assert.match(startOut.agent_message || '', /current step = prd_check/);
  assert.match(startOut.agent_message || '', new RegExp(cardPath(s1, tmpDir)));

  const answers = [
    ['prd_check', 'Yes'],
    ['prd_paste', 'https://www.notion.so/plus/PRD-123'],
    ['reflect_learn', 'validate usability with tutors in a study'],
    ['reflect_artifact_open', 'a clean multi-screen mockup of the review queue'],
    ['reflect_fidelity', 'Visual: high, Interaction: low, Breadth: few screens, Depth: low, Data/Content: high'],
    ['reflect_artifact', 'static hi-fi mockup'],
    ['reflect_exclude', 'skip admin settings and bulk export'],
  ];

  for (let i = 0; i < answers.length; i++) {
    const [stepId, val] = answers[i];
    fillField(s1, stepId, val);
    const nextStep = STEPS[i + 1];
    const out = run('next answer', s1);
    assert.match(
      out.agent_message || '',
      new RegExp(`current step = ${nextStep.id}`),
      `expected step ${nextStep.id} after filling ${stepId}`,
    );
    assert.doesNotMatch(out.agent_message || '', /WARNING:/);
  }

  // Fill final step (reflect_confirm) -> handoff and card removed.
  fillField(s1, 'reflect_confirm', 'Confirmed: static hi-fi mockup in Figma on DS components');
  const handoff = run('ship it', s1);
  assert.match(handoff.agent_message || '', /intake complete — brief card confirmed/i);
  assert.match(handoff.agent_message || '', /static hi-fi mockup/);
  assert.equal(readCard(s1, tmpDir), null, 'card is cleaned up on handoff');

  // 4. "back" clears the last filled field; at first step it reports already at first step.
  const sBack = 'back-session';
  run('/uno-prototype', sBack);
  const backAtFirst = run('back', sBack);
  assert.match(backAtFirst.agent_message || '', /Already at the first step/);
  assert.match(backAtFirst.agent_message || '', /current step = prd_check/);

  fillField(sBack, 'prd_check', 'Yes');
  run('continue', sBack);
  fillField(sBack, 'prd_paste', 'Inline PRD');
  const atLearn = run('continue', sBack);
  assert.match(atLearn.agent_message || '', /current step = reflect_learn/);

  const steppedBack = run('back', sBack);
  assert.match(steppedBack.agent_message || '', /current step = prd_paste/);
  assert.equal(readCard(sBack, tmpDir).prd_paste, '');
  assert.equal(readCard(sBack, tmpDir).prd_check, 'Yes');

  // 5. "restart" clears all fields back to prd_check.
  const restarted = run('restart', sBack);
  assert.match(restarted.agent_message || '', /current step = prd_check/);
  assert.equal(currentStepOf(readCard(sBack, tmpDir))?.id, 'prd_check');
  assert.equal(readCard(sBack, tmpDir).prd_check, '');

  // 6. Multi-field warning when the agent fills more than one field in a single turn.
  const sMulti = 'multi-field';
  run('/uno-prototype', sMulti);
  fillField(sMulti, 'prd_check', 'Yes');
  fillField(sMulti, 'prd_paste', 'Inline PRD');
  const multiOut = run('here is everything', sMulti);
  assert.match(multiOut.agent_message || '', /WARNING: More than one field was filled in a turn \(2 fields/);
  assert.match(multiOut.agent_message || '', /current step = reflect_learn/);

  // Out-of-order fill warning (later field filled while earlier is empty).
  const sOrder = 'out-of-order';
  run('/uno-prototype', sOrder);
  fillField(sOrder, 'reflect_learn', 'validate usability');
  const orderOut = run('skipping ahead', sOrder);
  assert.match(orderOut.agent_message || '', /WARNING: A later field/);
  assert.match(orderOut.agent_message || '', /current step = prd_check/);

  // 7. No-PRD exit routes to uno-synthesize and cleans up the card.
  const sNoPrd = 'no-prd';
  run('/uno-prototype', sNoPrd);
  fillField(sNoPrd, 'prd_check', 'No');
  const noPrdOut = run('no prd yet', sNoPrd);
  assert.match(noPrdOut.agent_message || '', /skills\/uno-synthesize/);
  assert.equal(readCard(sNoPrd, tmpDir), null);

  // 8. Machine turns never start or advance the card.
  const sMachine = 'machine-session';
  run('/uno-prototype', sMachine);
  const machineTurn = run('<task-notification>subagent done</task-notification>', sMachine);
  assert.equal(machineTurn.agent_message, undefined);

  // 9. Unified CLI adapter (`run.mjs`) handles Cursor, Claude Code, and Codex stdin/stdout.
  const cursorRaw = execFileSync(
    'node',
    [RUN_SCRIPT],
    {
      input: JSON.stringify({
        prompt: '/uno-prototype',
        conversation_id: 'adapter-cursor',
        briefingsDir: tmpDir,
      }),
      encoding: 'utf8',
    },
  );
  const cursorParsed = JSON.parse(cursorRaw.trim());
  assert.equal(cursorParsed.continue, true);
  assert.match(cursorParsed.agent_message, /current step = prd_check/);

  const claudeRaw = execFileSync(
    'node',
    [RUN_SCRIPT],
    {
      input: JSON.stringify({
        hook_event_name: 'UserPromptSubmit',
        prompt: '/uno-prototype',
        session_id: 'adapter-claude',
        briefingsDir: tmpDir,
      }),
      encoding: 'utf8',
    },
  );
  const claudeParsed = JSON.parse(claudeRaw.trim());
  assert.equal(claudeParsed.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(claudeParsed.hookSpecificOutput.additionalContext, /current step = prd_check/);

  // 10. Cross-file consistency across SKILL.md, intake.md, deliverables, and AGENTS.md.
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const skillText = fs.readFileSync(path.join(repoRoot, 'skills/uno-prototype/SKILL.md'), 'utf8');
  const intakeText = fs.readFileSync(
    path.join(repoRoot, 'skills/uno-prototype/references/intake.md'),
    'utf8',
  );
  const wireframeText = fs.readFileSync(
    path.join(repoRoot, 'skills/uno-prototype/references/deliverables/wireframe.md'),
    'utf8',
  );
  const staticMockupPath = path.join(
    repoRoot,
    'skills/uno-prototype/references/deliverables/static-mockup.md',
  );
  const agentsText = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8');

  assert.match(skillText, /eight steps/i);
  assert.match(skillText, /four questions/i);
  assert.match(intakeText, /eight steps/i);
  assert.match(intakeText, /four questions/i);
  assert.match(skillText, /Static hi-fi mockup, Figma MCP on DS components/);
  assert.match(skillText, /references\/deliverables\/static-mockup\.md/);
  assert.ok(fs.existsSync(staticMockupPath), 'static-mockup.md deliverable reference exists');
  assert.doesNotMatch(
    wireframeText,
    /Write an interactive\/functional-shaped prompt-spec/i,
    'wireframe Route C does not treat static wireframes as interactive',
  );
  assert.match(agentsText, /when the hook points at the brief card/);

  console.log('uno-prototype intake runner tests passed.');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
