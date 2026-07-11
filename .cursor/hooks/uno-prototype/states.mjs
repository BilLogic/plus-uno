import {
  EXECUTE_PHRASE,
  FIDELITY_OPTIONS,
  HI_CONFIRM_FIELDS_NO_FIGMA,
  HI_CONFIRM_FIELDS_WITH_FIGMA,
  TOOL_LINKS,
} from './constants.mjs';
import {
  buildFidelityVerification,
  mapFidelityOtherAnswer,
} from './prd-hints.mjs';
import {
  buildChallengePrompt,
  buildFlowVarietyPrompt,
  buildInvokeBriefing,
} from './prompt-templates.mjs';
import {
  isFigJamLink,
  isFigmaDesignLink,
  isNonEmptyText,
  isPrdDocument,
} from './validators.mjs';

/**
 * @typedef {object} ConversationState
 * @property {string} id
 * @property {string} question
 * @property {'choice' | 'text' | 'upload' | 'link' | 'terminal'} type
 * @property {string[]} [options]
 * @property {(value: string, ctx: Record<string, unknown>, attachments?: Array<{ type?: string; file_path?: string }>) => boolean} [validate]
 * @property {(value: string, ctx: Record<string, unknown>) => string | { next: string; patch?: Record<string, unknown> }} [transition]
 * @property {boolean} [terminal]
 */

/** @type {Record<string, ConversationState>} */
export const STATES = {
  prd_check: {
    id: 'prd_check',
    question: 'Do you already have a PRD?',
    type: 'choice',
    options: ['Yes', 'No'],
    transition: (value) => (value === 'Yes' ? 'prd_upload' : 'awaiting_prd_synthesize'),
  },

  prd_upload: {
    id: 'prd_upload',
    question: [
      'Upload or link your PRD (one of):',
      '- PDF',
      '- Notion link',
      '- Google Doc',
      '- Brief',
      '- Other documentation',
    ].join('\n'),
    type: 'upload',
    validate: (value, ctx, attachments) => {
      if (ctx.pendingPrd && /^(yes|yes, use that prd)$/i.test(value.trim())) return true;
      return isPrdDocument(value, attachments);
    },
    transition: (value, ctx) => {
      if (ctx.pendingPrd && /^yes/i.test(value.trim())) {
        return {
          next: 'fidelity_select',
          patch: { prd: ctx.pendingPrd, pendingPrd: undefined },
        };
      }
      if (ctx.pendingPrd && /^no/i.test(value.trim())) {
        return {
          next: 'prd_upload',
          patch: { pendingPrd: undefined, prdHints: undefined },
        };
      }
      return 'fidelity_select';
    },
  },

  awaiting_prd_synthesize: {
    id: 'awaiting_prd_synthesize',
    question: [
      'No PRD yet. Run the UNO Synthesize / Notion workflow first:',
      `- Skill: ${TOOL_LINKS.unoSynthesize}`,
      '- Create and approve a PRD in Notion, then return here with the PRD link or document.',
      '',
      'Prototype generation cannot continue until a PRD is provided.',
    ].join('\n'),
    type: 'terminal',
    terminal: true,
    validate: (value, _ctx, attachments) => isPrdDocument(value, attachments),
    transition: () => 'fidelity_select',
  },

  fidelity_select: {
    id: 'fidelity_select',
    question: 'What fidelity do you want to make?',
    type: 'choice',
    options: FIDELITY_OPTIONS,
    transition: (value, ctx) => transitionFidelityChoice(value, ctx),
  },

  fidelity_other: {
    id: 'fidelity_other',
    question:
      'Which fidelity do you want instead? Describe your target (e.g. low / sketch, mid / validate, user flow, data flow, flow variety, high-fi).',
    type: 'text',
    validate: (value) => isNonEmptyText(value),
    transition: (value, ctx) => {
      const mapped = mapFidelityOtherAnswer(value);
      if (mapped) return mapped;
      return {
        next: 'fidelity_select',
        patch: { fidelityOtherNote: value.trim(), fidelityVerified: false },
      };
    },
  },

  hi_figma_check: {
    id: 'hi_figma_check',
    question: 'Do you already have a Figma file you want to build upon?',
    type: 'choice',
    options: ['Yes', 'No'],
    transition: (value, ctx) => {
      if (value === 'Yes') return 'hi_figma_link';
      return startFieldCollection(ctx, HI_CONFIRM_FIELDS_NO_FIGMA);
    },
  },

  hi_figma_link: {
    id: 'hi_figma_link',
    question: 'Provide the Figma link.',
    type: 'link',
    validate: (value, ctx) => {
      if (ctx.pendingFigmaLink && /^yes/i.test(value.trim())) return true;
      return isFigmaDesignLink(value);
    },
    transition: (value, ctx) => {
      const link = ctx.pendingFigmaLink && /^yes/i.test(value.trim())
        ? ctx.pendingFigmaLink
        : value.trim();
      const next = startFieldCollection(ctx, HI_CONFIRM_FIELDS_WITH_FIGMA);
      return { ...next, patch: { ...next.patch, figmaLink: link, pendingFigmaLink: undefined } };
    },
  },

  hi_confirm_collect: {
    id: 'hi_confirm_collect',
    type: 'text',
    question: '',
    validate: (value) => isNonEmptyText(value),
    transition: (value, ctx) => advanceFieldCollection(value, ctx),
  },

  challenge_question: {
    id: 'challenge_question',
    question: "What's the challenge?",
    type: 'text',
    validate: (value) => isNonEmptyText(value),
    transition: (value) => ({
      next: 'challenge_tool_select',
      patch: { challenge: value.trim(), branch: 'challenge' },
    }),
  },

  challenge_tool_select: {
    id: 'challenge_tool_select',
    question: 'Which external tool should the prompt-spec target?',
    type: 'choice',
    options: ['Claude Design / Figma Make / Stitch', 'v0 / Google AI Studio'],
    transition: (value) => ({
      next: 'challenge_deliver',
      patch: {
        challengeTool:
          value === 'v0 / Google AI Studio' ? 'v0_google_ai_studio' : 'claude_figma_stitch',
      },
    }),
  },

  challenge_deliver: {
    id: 'challenge_deliver',
    question: 'Challenge / Ideation prompt-spec (copy to external tool).',
    type: 'terminal',
    terminal: true,
  },

  user_flow_figjam_link: {
    id: 'user_flow_figjam_link',
    question: 'Provide a FigJam link.',
    type: 'link',
    validate: (value) => isFigJamLink(value),
    transition: (value) => ({
      next: 'invoke_ready',
      patch: {
        figjamLink: value.trim(),
        branch: 'user_flow',
        invokeGoal: 'Prototype user flow and supporting system inside FigJam.',
      },
    }),
  },

  data_flow_figjam_link: {
    id: 'data_flow_figjam_link',
    question: 'Provide a FigJam link.',
    type: 'link',
    validate: (value) => isFigJamLink(value),
    transition: (value) => ({
      next: 'invoke_ready',
      patch: {
        figjamLink: value.trim(),
        branch: 'data_flow',
        invokeGoal: 'Generate a data flow diagram inside FigJam.',
      },
    }),
  },

  flow_variety_deliver: {
    id: 'flow_variety_deliver',
    question: 'Flow Variety prompt-spec (copy to Stitch).',
    type: 'terminal',
    terminal: true,
  },

  invoke_ready: {
    id: 'invoke_ready',
    question: 'Ready to invoke the coding agent.',
    type: 'terminal',
    terminal: true,
  },
};

/**
 * @param {string} value
 * @param {Record<string, unknown>} ctx
 */
function transitionFidelityChoice(value, ctx) {
  const verification = buildFidelityVerification(ctx.prdHints);

  if (verification) {
    if (value === 'Yes, generate high-fi') {
      return { next: 'hi_figma_check', patch: { fidelity: verification.inferred, branch: 'high_fidelity', fidelityVerified: true } };
    }
    if (value === 'Yes, use mid-fi') {
      return { next: 'challenge_question', patch: { fidelity: verification.inferred, branch: 'challenge', fidelityVerified: true } };
    }
    if (value === 'Yes, prototype user flow') {
      return { next: 'user_flow_figjam_link', patch: { fidelity: verification.inferred, branch: 'user_flow', fidelityVerified: true } };
    }
    if (value === 'Yes, map data flow') {
      return { next: 'data_flow_figjam_link', patch: { fidelity: verification.inferred, branch: 'data_flow', fidelityVerified: true } };
    }
    if (value === 'Yes, use flow variety') {
      return { next: 'flow_variety_deliver', patch: { fidelity: verification.inferred, branch: 'flow_variety', fidelityVerified: true } };
    }
    if (/no, generate a different fidelity/i.test(value)) {
      return { next: 'fidelity_other', patch: { fidelityVerified: false } };
    }
  }

  const map = {
    'High-fidelity prototype': 'hi_figma_check',
    'Challenge / Ideation': 'challenge_question',
    'User Flow': 'user_flow_figjam_link',
    'Data Flow': 'data_flow_figjam_link',
    'Flow Variety': 'flow_variety_deliver',
  };
  const next = map[value];
  const patch = { fidelity: value, fidelityVerified: true };
  if (value === 'High-fidelity prototype') patch.branch = 'high_fidelity';
  if (value === 'User Flow') patch.branch = 'user_flow';
  if (value === 'Data Flow') patch.branch = 'data_flow';
  if (value === 'Flow Variety') patch.branch = 'flow_variety';
  if (value === 'Challenge / Ideation') patch.branch = 'challenge';
  return { next, patch };
}

/**
 * @param {Record<string, unknown>} ctx
 * @param {Array<{ key: string; question: string }>} fields
 */
function startFieldCollection(ctx, fields) {
  return {
    next: 'hi_confirm_collect',
    patch: {
      confirmFields: fields,
      fieldIndex: 0,
      collected: {},
    },
  };
}

/**
 * @param {string} value
 * @param {Record<string, unknown>} ctx
 */
function advanceFieldCollection(value, ctx) {
  const fields = /** @type {Array<{ key: string; question: string }>} */ (ctx.confirmFields || []);
  const index = /** @type {number} */ (ctx.fieldIndex ?? 0);
  const collected = /** @type {Record<string, string>} */ ({ ...(ctx.collected || {}) });
  const field = fields[index];
  if (!field) return 'invoke_ready';

  collected[field.key] = value.trim() === 'none' ? '' : value.trim();
  const nextIndex = index + 1;
  if (nextIndex >= fields.length) {
    return { next: 'invoke_ready', patch: { ...collected, collected, fieldIndex: nextIndex } };
  }
  return { next: 'hi_confirm_collect', patch: { collected, fieldIndex: nextIndex } };
}

/**
 * @param {string} stateId
 * @returns {ConversationState | null}
 */
export function getState(stateId) {
  return STATES[stateId] || null;
}

/**
 * @param {ConversationState} state
 * @param {Record<string, unknown>} ctx
 * @returns {string[] | undefined}
 */
export function resolveOptions(state, ctx) {
  if (state.id === 'prd_upload' && ctx.pendingPrd) {
    return ['Yes, use that PRD', 'No, I will provide a different PRD'];
  }

  if (state.id === 'fidelity_select') {
    const verification = buildFidelityVerification(ctx.prdHints);
    if (verification) return verification.options;
    return FIDELITY_OPTIONS;
  }

  if (state.id === 'hi_figma_link' && ctx.pendingFigmaLink) {
    return ['Yes, use that Figma link', 'No, I will provide a different link'];
  }

  return state.options;
}

/**
 * @param {ConversationState} state
 * @param {Record<string, unknown>} ctx
 * @returns {'choice' | 'text' | 'upload' | 'link' | 'terminal'}
 */
export function resolveType(state, ctx) {
  if (state.id === 'prd_upload' && ctx.pendingPrd) return 'choice';
  if (state.id === 'hi_figma_link' && ctx.pendingFigmaLink) return 'choice';
  return state.type;
}

/**
 * @param {ConversationState} state
 * @param {Record<string, unknown>} ctx
 * @returns {string}
 */
export function resolveQuestion(state, ctx) {
  if (state.id === 'prd_upload' && ctx.pendingPrd) {
    return 'I see you already shared PRD content in this conversation. Should I use that as your PRD?';
  }

  if (state.id === 'fidelity_select') {
    const verification = buildFidelityVerification(ctx.prdHints);
    if (verification) return verification.question;
    return state.question;
  }

  if (state.id === 'hi_figma_check' && ctx.prdHints?.mentionsFigma) {
    return 'I see your PRD references Figma. Do you already have a Figma file you want to build upon?';
  }

  if (state.id === 'hi_figma_link' && ctx.pendingFigmaLink) {
    return `I found this Figma link in your PRD:\n${ctx.pendingFigmaLink}\n\nUse this link?`;
  }

  if (state.id === 'hi_confirm_collect') {
    const fields = /** @type {Array<{ key: string; question: string }>} */ (ctx.confirmFields || []);
    const index = /** @type {number} */ (ctx.fieldIndex ?? 0);
    const field = fields[index];
    if (field?.key === 'fidelity' && ctx.fidelity) {
      return `${field.question} (You selected: ${ctx.fidelity})`;
    }
    return field?.question || 'Confirm project settings.';
  }

  if (state.id === 'challenge_deliver') {
    return buildChallengePrompt(ctx);
  }

  if (state.id === 'flow_variety_deliver') {
    return buildFlowVarietyPrompt();
  }

  if (state.id === 'invoke_ready') {
    return [
      'Workflow inputs are complete.',
      `Send \`${EXECUTE_PHRASE}\` to invoke the coding agent with the collected briefing.`,
    ].join('\n');
  }

  return state.question;
}

/**
 * @param {ConversationState} state
 * @param {Record<string, unknown>} ctx
 * @returns {string}
 */
export function formatQuestionMessage(state, ctx) {
  const body = resolveQuestion(state, ctx);
  const options = resolveOptions(state, ctx);
  const type = resolveType(state, ctx);
  const lines = [body, ''];

  if (type === 'choice' && options?.length) {
    for (const option of options) {
      lines.push(`○ ${option}`);
    }
    lines.push('');
  }

  if (state.id === 'fidelity_other') {
    lines.push('(Type your answer in the text box.)', '');
  }

  lines.push(
    'Reply with your answer. Commands: "back", "restart".',
    'To exit without invoking uno-prototype: say "skip PRD upload" or "terminate this process".',
  );

  return lines.join('\n');
}

export { buildInvokeBriefing };
