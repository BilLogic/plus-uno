import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveOptions, resolveQuestion, resolveType, buildConfirmTable } from './states.mjs';

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
    verificationMode: Boolean(session.context?.prdHints && state.id === 'fidelity_select'),
    prdResumed: Boolean(session.context?.prdResumed),
  };

  if (effectiveType === 'choice' && options?.length) {
    payload.options = options.map((label, index) => ({
      id: String(index + 1),
      label,
    }));
  }

  if (state.id === 'challenge_other') {
    payload.allowTextInput = true;
    payload.textInputPrompt = resolveQuestion(state, session.context);
  }

  if (state.id === 'hi_confirm_table') {
    payload.type = 'confirmation_table';
    payload.table = buildConfirmTable(session.context);
    payload.designSystemDefault = 'Plus Design System';
    payload.designSystemConfigurable = false;
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
  const lines = [
    'uno-prototype intake is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
    'ONE QUESTION PER TURN: render exactly one intake step this message — never batch PRD + fidelity + Figma (or any later steps) into one AskQuestion call or one reply.',
    'NEVER SKIP A STEP: even when the PRD, user message, or prior context already answers the current step, still ask it as verification — do not auto-advance, auto-select, or improvise the remaining workflow.',
  ];

  const effectiveType = state.type;

  if (state.id === 'hi_confirm_table') {
    lines.push(
      'Show the verification table from the `table` field in this message — do NOT ask project name, scope, fidelity, or required screens one-by-one.',
      'Use AskQuestion with a `questions` array of length 1 — the prompt plus the two confirm/edit options from the JSON file.',
      'Do NOT add a design system row or question — Plus Design System is always applied.',
      'Do NOT load method.md, do NOT start building.',
    );
    return lines.join(' ');
  }

  if (
    effectiveType === 'choice' ||
    state.id === 'prd_check' ||
    state.id === 'fidelity_select' ||
    state.id === 'fidelity_level_pick' ||
    state.id === 'low_fi_working_through' ||
    state.id === 'challenge_question' ||
    state.id === 'hi_figma_link'
  ) {
    lines.push(
      'Use AskQuestion with a `questions` array of length 1 only — one prompt, one set of options from the JSON file.',
      'Forbidden: multiple entries in `questions`, combining steps, tables of later steps, or paraphrasing several hook states at once.',
      'If the question is verification-style (PRD already hints at an answer), still ask it — do not auto-select.',
      'Do NOT mention later steps (Figma confirm, playground, synthesize).',
      'Do NOT load method.md, do NOT start building, do NOT show multi-step checklists.',
    );
  } else {
    lines.push(
      'Ask exactly one plain-text question using the `question` field in that file — no bullet lists of upcoming steps.',
      'Do NOT preview or list later workflow steps.',
    );
  }

  return lines.join(' ');
}
