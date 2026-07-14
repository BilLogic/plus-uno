import {
  CHALLENGE_OPTIONS,
  DEFAULT_DESIGN_SYSTEM,
  EXECUTE_PHRASE,
  FIDELITY_LEVEL_OPTIONS,
  HI_CONFIRM_TABLE_ROWS,
  LOW_FI_OPTIONS,
  PRD_CHECK_QUESTION,
  PRD_PASTE_MESSAGE,
  TOOL_LINKS,
} from './constants.mjs';
import {
  buildFidelityVerification,
  extractPrdSettings,
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
    question: PRD_CHECK_QUESTION,
    type: 'choice',
    options: ['Yes', 'No'],
    transition: (value) => (value === 'Yes' ? 'prd_paste' : 'awaiting_prd_synthesize'),
  },

  prd_paste: {
    id: 'prd_paste',
    question: PRD_PASTE_MESSAGE,
    type: 'upload',
    validate: (value, _ctx, attachments) =>
      isNonEmptyText(value) || (Array.isArray(attachments) && attachments.length > 0),
    transition: () => 'fidelity_select',
  },

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

  fidelity_select: {
    id: 'fidelity_select',
    question: 'What fidelity do you want to make?',
    type: 'choice',
    options: FIDELITY_LEVEL_OPTIONS,
    transition: (value, ctx) => transitionFidelityChoice(value, ctx),
  },

  fidelity_level_pick: {
    id: 'fidelity_level_pick',
    question: 'Which fidelity do you want?',
    type: 'choice',
    options: FIDELITY_LEVEL_OPTIONS,
    transition: (value) => transitionFidelityLevel(value),
  },

  low_fi_working_through: {
    id: 'low_fi_working_through',
    question: 'What are you working through?',
    type: 'choice',
    options: LOW_FI_OPTIONS,
    transition: (value) => transitionLowFiChoice(value),
  },

  hi_figma_check: {
    id: 'hi_figma_check',
    question: 'Do you already have a Figma file you want to build upon?',
    type: 'choice',
    options: ['Yes', 'No'],
    transition: (value, ctx) => {
      if (value === 'Yes') return 'hi_figma_link';
      return startConfirmTable(ctx);
    },
  },

  hi_figma_link: {
    id: 'hi_figma_link',
    question: 'Provide the Figma link.',
    type: 'link',
    validate: (value) => isFigmaDesignLink(value),
    transition: (value, ctx) => {
      const next = startConfirmTable(ctx);
      return { ...next, patch: { ...next.patch, figmaLink: value.trim() } };
    },
  },

  hi_confirm_table: {
    id: 'hi_confirm_table',
    question: 'Review your project settings before continuing.',
    type: 'choice',
    options: ['Confirm and continue', 'Edit project settings'],
    validate: (value, ctx) => {
      if (value !== 'Confirm and continue') return true;
      return allConfirmFieldsPopulated(ctx);
    },
    transition: (value, ctx) => {
      if (value === 'Confirm and continue') {
        const collected = getConfirmCollected(ctx);
        return {
          next: 'invoke_ready',
          patch: {
            ...collected,
            designSystem: DEFAULT_DESIGN_SYSTEM,
            collected: undefined,
          },
        };
      }
      return 'hi_settings_edit';
    },
  },

  hi_settings_edit: {
    id: 'hi_settings_edit',
    question: [
      'Reply with updated values using these labels (one per line):',
      'Project name: ...',
      'Scope: ...',
      'Fidelity: ...',
      'Required screens: ...',
    ].join('\n'),
    type: 'text',
    validate: (value) => isNonEmptyText(value),
    transition: (value, ctx) => {
      const collected = parseSettingsEdit(value, ctx);
      return { next: 'hi_confirm_table', patch: { collected, ...collected } };
    },
  },

  challenge_question: {
    id: 'challenge_question',
    question: "What's the challenge?",
    type: 'choice',
    options: CHALLENGE_OPTIONS,
    transition: (value) => {
      if (value === 'Other') {
        return { next: 'challenge_other' };
      }
      return {
        next: 'challenge_deliver',
        patch: {
          branch: 'challenge',
          challengeTool:
            value === 'Functional / working UI' ? 'v0_google_ai_studio' : 'claude_figma_stitch',
        },
      };
    },
  },

  challenge_other: {
    id: 'challenge_other',
    question: "Describe what you're trying to get out of this prototype.",
    type: 'text',
    validate: (value) => isNonEmptyText(value),
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
      return { next: 'fidelity_level_pick', patch: { fidelityVerified: false } };
    }
  }

  return transitionFidelityLevel(value);
}

/**
 * @param {string} value
 */
function transitionFidelityLevel(value) {
  if (value === 'Hi-fi') {
    return {
      next: 'hi_figma_check',
      patch: { fidelity: 'High-fidelity prototype', branch: 'high_fidelity', fidelityVerified: true },
    };
  }
  if (value === 'Mid-fi') {
    return {
      next: 'challenge_question',
      patch: { fidelity: 'Mid-fi', branch: 'challenge', fidelityVerified: true },
    };
  }
  if (value === 'Low-fi') {
    return {
      next: 'low_fi_working_through',
      patch: { fidelity: 'Low-fi', branch: 'low_fidelity', fidelityVerified: true },
    };
  }
  return { next: 'fidelity_level_pick', patch: { fidelityVerified: false } };
}

/**
 * @param {string} value
 */
function transitionLowFiChoice(value) {
  if (value === 'User flow & system') {
    return { next: 'user_flow_figjam_link', patch: { branch: 'user_flow' } };
  }
  if (value === 'Data flow') {
    return { next: 'data_flow_figjam_link', patch: { branch: 'data_flow' } };
  }
  if (value === 'Flow variety') {
    return { next: 'flow_variety_deliver', patch: { branch: 'flow_variety' } };
  }
  return { next: 'low_fi_working_through' };
}

/**
 * @param {Record<string, unknown>} ctx
 */
function getConfirmCollected(ctx) {
  const fromCollected = /** @type {Record<string, string>} */ (ctx.collected || {});
  return {
    projectName: fromCollected.projectName || /** @type {string} */ (ctx.projectName || ''),
    scope: fromCollected.scope || /** @type {string} */ (ctx.scope || ''),
    fidelity: fromCollected.fidelity || /** @type {string} */ (ctx.fidelity || ''),
    requiredScreens:
      fromCollected.requiredScreens || /** @type {string} */ (ctx.requiredScreens || ''),
  };
}

/**
 * @param {Record<string, unknown>} ctx
 */
function allConfirmFieldsPopulated(ctx) {
  const collected = getConfirmCollected(ctx);
  return HI_CONFIRM_TABLE_ROWS.every(({ key }) => Boolean(collected[key]?.trim()));
}

/**
 * @param {Record<string, unknown>} ctx
 * @returns {string}
 */
export function buildConfirmTable(ctx) {
  const collected = getConfirmCollected(ctx);
  const rows = HI_CONFIRM_TABLE_ROWS.map(({ key, label }) => {
    const value = collected[key]?.trim() || '(not set)';
    return `| ${label} | ${value} |`;
  });

  return [
    '| Field | Value |',
    '| --- | --- |',
    ...rows,
    '',
    '_Design system: Plus Design System (always applied — not configurable)_',
  ].join('\n');
}

/**
 * @param {string} value
 * @param {Record<string, unknown>} ctx
 */
function parseSettingsEdit(value, ctx) {
  const updated = getConfirmCollected(ctx);
  const labelToKey = Object.fromEntries(
    HI_CONFIRM_TABLE_ROWS.map(({ key, label }) => [label.toLowerCase(), key]),
  );

  for (const line of value.split('\n')) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;
    const key = labelToKey[match[1].trim().toLowerCase()];
    if (key) updated[key] = match[2].trim();
  }

  return updated;
}

/**
 * @param {Record<string, unknown>} ctx
 */
function startConfirmTable(ctx) {
  const fromPrd = extractPrdSettings(/** @type {string} */ (ctx.prd || ''));
  const collected = {
    projectName: fromPrd.projectName || '',
    scope: fromPrd.scope || '',
    fidelity: /** @type {string} */ (ctx.fidelity || ''),
    requiredScreens: fromPrd.requiredScreens || '',
  };

  return {
    next: 'hi_confirm_table',
    patch: {
      collected,
      designSystem: DEFAULT_DESIGN_SYSTEM,
    },
  };
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
  if (state.id === 'fidelity_select') {
    const verification = buildFidelityVerification(ctx.prdHints);
    if (verification) return verification.options;
    return FIDELITY_LEVEL_OPTIONS;
  }

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
 * @param {Record<string, unknown>} ctx
 * @param {string} question
 * @returns {string}
 */
function prefixResumedPrd(ctx, question) {
  if (!ctx.prdResumed) return question;
  return ['I already have your PRD from this conversation.', '', question].join('\n');
}

/**
 * @param {ConversationState} state
 * @param {Record<string, unknown>} ctx
 * @returns {string}
 */
export function resolveQuestion(state, ctx) {
  if (state.id === 'fidelity_select') {
    const verification = buildFidelityVerification(ctx.prdHints);
    if (verification) {
      return prefixResumedPrd(ctx, verification.question);
    }
    return prefixResumedPrd(ctx, state.question);
  }

  if (state.id === 'hi_confirm_table') {
    return [
      'Review your project settings before continuing.',
      '',
      buildConfirmTable(ctx),
    ].join('\n');
  }

  if (state.id === 'hi_settings_edit') {
    return state.question;
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

  if (state.id === 'challenge_other') {
    lines.push('(Type your answer in the text box.)', '');
  }

  lines.push(
    'Reply with your answer. Commands: "back", "restart".',
    'To exit without invoking uno-prototype: say "skip PRD upload" or "terminate this process".',
  );

  return lines.join('\n');
}

export { buildInvokeBriefing };
