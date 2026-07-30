import {
  PRD_CHECK_QUESTION,
  PRD_PASTE_MESSAGE,
  REFLECTION_STEPS,
  REFLECTION_STEP_TOTAL,
  TOOL_LINKS,
} from './constants.mjs';
import { isNonEmptyText } from './validators.mjs';

/**
 * @typedef {object} ConversationState
 * @property {string} id
 * @property {string} question
 * @property {'choice' | 'text' | 'upload' | 'link' | 'reflection' | 'terminal'} type
 * @property {string[]} [options]
 * @property {string} [guidance] — reflection presentation rules passed to the agent
 * @property {boolean} [multiSelect] — reflection: several options may co-apply
 * @property {boolean} [openEnded] — reflection: ask free-text first, no recommendation yet
 * @property {boolean} [confirm] — reflection: assemble the brief card and confirm the contract
 * @property {string} [progressLabel] — where this step sits in the intake (shown to the designer)
 * @property {number} [stepIndex] — reflection: 1-based position in Step 2
 * @property {number} [stepTotal] — reflection: total Step 2 questions
 * @property {(value: string, ctx: Record<string, unknown>, attachments?: Array<{ type?: string; file_path?: string }>) => boolean} [validate]
 * @property {(value: string, ctx: Record<string, unknown>) => string | { next: string; patch?: Record<string, unknown> }} [transition]
 * @property {boolean} [terminal]
 */

/**
 * Build a Step 2 reflection gate state from its config in constants.mjs. Any
 * non-empty answer (the user's AskQuestion selection) advances to `nextId` and
 * is stored under `context.reflection[id]` — the confirm gate and the build
 * handoff assemble the brief card (the contract) from those stored answers.
 * The agent composes the PRD-specific options; the FSM guarantees the sequence.
 * @param {string} id
 * @param {string} nextId
 * @returns {ConversationState}
 */
function reflectionState(id, nextId) {
  const cfg = REFLECTION_STEPS[id];
  return {
    id,
    type: 'reflection',
    question: cfg.question,
    guidance: cfg.guidance,
    multiSelect: cfg.multiSelect,
    openEnded: Boolean(cfg.openEnded),
    confirm: Boolean(cfg.confirm),
    progressLabel: cfg.progressLabel,
    stepIndex: cfg.stepIndex,
    stepTotal: REFLECTION_STEP_TOTAL,
    validate: (value) => isNonEmptyText(value),
    transition: (value, ctx) => ({
      next: nextId,
      patch: { reflection: { ...(ctx.reflection || {}), [id]: value } },
    }),
  };
}

/**
 * The hook enforces the PRD gate (prd_check → prd_paste) AND Step 2
 * reflection (reflect_learn → reflect_artifact_open → reflect_artifact →
 * reflect_fidelity → reflect_exclude → reflect_confirm), one question per
 * turn. Q2 (artifact) is two beats — an open-ended capture then the
 * recommendation — so the sequence has six states but still four numbered
 * questions plus one brief-card confirmation (the contract). Only after the
 * contract is confirmed does it hand off at build_handoff, where the agent
 * runs Step 3 (Plan) → Step 4 (Generate). Fidelity is reasoned through inside
 * reflect_fidelity; the Figma-file question still lives in the agent's Step 4
 * high-fi branch.
 * @type {Record<string, ConversationState>}
 */
export const STATES = {
  prd_check: {
    id: 'prd_check',
    question: PRD_CHECK_QUESTION,
    type: 'choice',
    options: ['Yes', 'No'],
    progressLabel: 'PRD gate · 1 of 2',
    transition: (value) => (value === 'Yes' ? 'prd_paste' : 'awaiting_prd_synthesize'),
  },

  prd_paste: {
    id: 'prd_paste',
    question: PRD_PASTE_MESSAGE,
    type: 'upload',
    progressLabel: 'PRD gate · 2 of 2',
    validate: (value, _ctx, attachments) =>
      isNonEmptyText(value) || (Array.isArray(attachments) && attachments.length > 0),
    transition: () => 'reflect_learn',
  },

  // Step 2 (Prototype Reflection) — four numbered questions across five states
  // (Q2 is asked open-ended first, then as a recommendation), then the
  // brief-card confirmation, one per turn.
  reflect_learn: reflectionState('reflect_learn', 'reflect_artifact_open'),
  reflect_artifact_open: reflectionState('reflect_artifact_open', 'reflect_artifact'),
  reflect_artifact: reflectionState('reflect_artifact', 'reflect_fidelity'),
  reflect_fidelity: reflectionState('reflect_fidelity', 'reflect_exclude'),
  reflect_exclude: reflectionState('reflect_exclude', 'reflect_confirm'),
  reflect_confirm: reflectionState('reflect_confirm', 'build_handoff'),

  awaiting_prd_synthesize: {
    id: 'awaiting_prd_synthesize',
    question: [
      'No PRD yet — stopping the uno-prototype workflow.',
      '',
      'A PRD is required to prototype. Create one first, then start uno-prototype again:',
      `- UNO Synthesize (in-IDE): ${TOOL_LINKS.unoSynthesize}`,
      `- uno-bot (in Slack): message ${TOOL_LINKS.unoBot} to synthesize one`,
    ].join('\n'),
    type: 'terminal',
    terminal: true,
  },

  // Sole exit of the gate. Reached only after all four reflection questions
  // are answered (Q2 across its two beats) AND the brief card is confirmed.
  // The hook stops intercepting and the agent runs Step 3 (Plan) → Step 4
  // (Generate) from SKILL.md, with the confirmed brief as the contract.
  build_handoff: {
    id: 'build_handoff',
    question: 'Reflection complete — starting the build workflow.',
    type: 'terminal',
    terminal: true,
  },
};

/**
 * @param {string} stateId
 * @returns {ConversationState | null}
 */
export function getState(stateId) {
  return STATES[stateId] || null;
}

/**
 * @param {ConversationState} state
 * @returns {string[] | undefined}
 */
export function resolveOptions(state) {
  return state.options;
}

/**
 * @param {ConversationState} state
 * @returns {'choice' | 'text' | 'upload' | 'link' | 'terminal'}
 */
export function resolveType(state) {
  return state.type;
}

/**
 * @param {ConversationState} state
 * @returns {string}
 */
export function resolveQuestion(state) {
  return state.question;
}
