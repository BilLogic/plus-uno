import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLOW_MAP } from './constants.mjs';
import { resolveOptions, resolveQuestion, resolveType } from './states.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');

export const ACTIVE_INTAKE_FILE = path.join(BRIEFING_DIR, 'active-intake-question.json');

/**
 * @param {import('./states.mjs').ConversationState} state
 * @param {Record<string, unknown>} ctx
 */
export function buildIntakePayload(conversationId, session, state) {
  const effectiveType = resolveType(state, session.context);
  const options = resolveOptions(state, session.context);

  /** @type {Record<string, unknown>} */
  const payload = {
    mode: 'uno-prototype-intake',
    conversationId,
    stateId: state.id,
    type: effectiveType,
    question: resolveQuestion(state, session.context),
    strictFlow: true,
    oneQuestionOnly: true,
    neverSkipStep: true,
    prdResumed: Boolean(session.context?.prdResumed),
  };

  if (state.progressLabel) payload.progressLabel = state.progressLabel;

  if (effectiveType === 'choice' && options?.length) {
    payload.options = options.map((label, index) => ({
      id: String(index + 1),
      label,
    }));
  }

  if (effectiveType === 'reflection') {
    payload.multiSelect = Boolean(state.multiSelect);
    payload.openEnded = Boolean(state.openEnded);
    payload.confirm = Boolean(state.confirm);
    payload.stepIndex = state.stepIndex;
    payload.stepTotal = state.stepTotal;
    payload.guidance = state.guidance;
    // The confirm gate assembles the brief card from the stored answers.
    if (state.confirm && session.context?.reflection) {
      payload.reflection = session.context.reflection;
    }
  }

  return payload;
}

/**
 * @param {string} conversationId
 * @param {import('./storage.mjs').SessionState} session
 * @param {import('./states.mjs').ConversationState} state
 */
export function writeIntakeQuestion(conversationId, session, state) {
  fs.mkdirSync(BRIEFING_DIR, { recursive: true });
  const payload = buildIntakePayload(conversationId, session, state);
  fs.writeFileSync(ACTIVE_INTAKE_FILE, JSON.stringify(payload, null, 2));
}

export function clearIntakeQuestion() {
  if (fs.existsSync(ACTIVE_INTAKE_FILE)) fs.unlinkSync(ACTIVE_INTAKE_FILE);
}

/**
 * @param {import('./states.mjs').ConversationState} state
 * @returns {string}
 */
export function buildAgentIntakeInstruction(state) {
  const effectiveType = state.type;

  const reviseNote =
    'Mention once, briefly, that the designer can say "back" to revise an earlier answer — we are shaping this together, nothing is locked until the brief is confirmed.';

  if (effectiveType === 'reflection') {
    if (state.confirm) {
      return [
        'uno-prototype Step 2 (Prototype Reflection) gate is active — final beat: confirm the brief. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
        'Assemble the stored answers (the `reflection` field in that JSON) into ONE compact brief card per the `guidance` field, then ask EXACTLY one AskQuestion (questions.length === 1) to confirm it.',
        'This card is the contract the build will be validated against — restate content in the confirm option label; never offer a content-free "looks good".',
        reviseNote,
        'Do NOT load method.md or start building until the brief is confirmed.',
      ].join(' ');
    }

    if (state.openEnded) {
      return [
        'uno-prototype Step 2 (Prototype Reflection) gate is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
        `This is reflection step ${state.stepIndex} of ${state.stepTotal}, OPEN-ENDED beat: ask the one question from the JSON in plain text or as a single AskQuestion with free-form entry expected — do NOT present a recommendation or an options menu this turn; the designer speaks first, in their own words.`,
        'Never batch reflection questions; never skip ahead to Step 3/4 or start building.',
        reviseNote,
        'Follow the `guidance` field in that JSON. Do NOT load method.md.',
      ].join(' ');
    }

    return [
      'uno-prototype Step 2 (Prototype Reflection) gate is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
      `This is reflection step ${state.stepIndex} of ${state.stepTotal}: ask EXACTLY this one question via AskQuestion (questions.length === 1). Never batch the four reflection questions; never skip ahead to Step 3/4 or start building.`,
      state.stepIndex === 1
        ? 'PRD received — before asking, if you have not already, do Step 1 (Understand): summarize the PRD and recommend nothing yet, then ask this question.'
        : '',
      'Compose PRD-specific options: lead with the recommended choice labeled "(Recommended)", then 1–2 alternatives; rely on the built-in Other. One line of reasoning per option, each anchored in the PRD — this is reflecting WITH the designer, not deciding for them.',
      state.multiSelect
        ? 'Set multiSelect: true — several goals may co-apply.'
        : 'Single-select — this confirms your recommendation.',
      `Show the \`progressLabel\` from the JSON with the question so the designer knows where they are. ${reviseNote}`,
      'Follow the `guidance` field in that JSON for what to present before/with the question. Do NOT load method.md or start building.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  const lines = [
    'uno-prototype PRD-gate intake is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
    'ONE QUESTION PER TURN: render exactly one PRD-gate step this message — never batch steps into one AskQuestion call or one reply.',
    'NEVER SKIP A STEP: even when the user message already contains a PRD, still ask the current step as verification — do not auto-advance.',
  ];

  if (state.id === 'prd_check') {
    lines.push(
      `Before asking, show the designer the shape of the whole intake in one line — "${FLOW_MAP}" — and say a PRD (Notion link, local .md, or pasted text with flows + acceptance criteria) is the one required input. Then ask the question.`,
    );
  }

  if (effectiveType === 'choice') {
    lines.push(
      'Use AskQuestion with a `questions` array of length 1 only — one prompt, one set of options from the JSON file.',
      'Show the `progressLabel` from the JSON with the question.',
      'Forbidden: multiple entries in `questions`, combining steps, or previewing later steps beyond the one-line flow map.',
      'Do NOT load method.md, do NOT start building.',
    );
  } else {
    lines.push(
      'Ask exactly one plain-text question using the `question` field in that file, and show the `progressLabel` from the JSON with it.',
      'Do NOT preview or list later workflow steps.',
    );
  }

  return lines.join(' ');
}
