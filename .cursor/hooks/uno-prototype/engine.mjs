import { GLOBAL_COMMANDS, EXECUTE_PHRASE } from './constants.mjs';
import {
  hasPrototypeIntent,
  isBypassRequest,
  isExecuteRequest,
  hasPrdSignal,
} from './intents.mjs';
import { extractPrdHints } from './prd-hints.mjs';
import {
  buildInvokeBriefing,
  formatQuestionMessage,
  getState,
  resolveOptions,
  resolveType,
  STATES,
} from './states.mjs';
import {
  buildAgentIntakeInstruction,
  clearIntakeQuestion,
  writeIntakeQuestion,
} from './intake-question.mjs';
import {
  clearBriefing,
  clearSession,
  isPrdGateEnabled,
  loadSession,
  readBriefing,
  resolveRepoRoot,
  saveSession,
  writeBriefing,
} from './storage.mjs';
import { parseChoice } from './validators.mjs';

/**
 * @typedef {object} HookInput
 * @property {string} [prompt]
 * @property {string} [conversation_id]
 * @property {Array<{ type?: string; file_path?: string }>} [attachments]
 * @property {string[]} [workspace_roots]
 */

/**
 * @param {boolean} continueSubmit
 * @param {string} [userMessage]
 * @param {string} [agentMessage]
 * @returns {{ continue: boolean; user_message?: string; agent_message?: string }}
 */
function result(continueSubmit, userMessage, agentMessage) {
  if (continueSubmit) {
    /** @type {{ continue: true; agent_message?: string }} */
    const out = { continue: true };
    if (agentMessage) out.agent_message = agentMessage;
    return out;
  }
  return { continue: false, user_message: userMessage };
}

/**
 * @param {string} [initialPrompt]
 * @returns {{ stateId: string; history: string[]; context: Record<string, unknown>; status: 'active' }}
 */
function createSession(initialPrompt = '') {
  /** @type {Record<string, unknown>} */
  const context = {};

  if (initialPrompt && hasPrdSignal(initialPrompt)) {
    context.pendingPrd = initialPrompt.trim();
    context.prdHints = extractPrdHints(initialPrompt);
  }

  return {
    stateId: 'prd_check',
    history: ['prd_check'],
    context,
    status: 'active',
  };
}

/**
 * @param {import('./storage.mjs').SessionState} session
 * @param {string} nextStateId
 * @param {Record<string, unknown>} [patch]
 */
function transitionSession(session, nextStateId, patch = {}) {
  session.stateId = nextStateId;
  session.history.push(nextStateId);
  session.context = { ...session.context, ...patch };
  session.status = 'active';
}

/**
 * @param {Record<string, unknown>} context
 * @param {string} prdText
 */
function storePrdContext(context, prdText) {
  context.prd = prdText;
  context.prdHints = extractPrdHints(prdText);

  const designLinks = /** @type {string[]} */ (context.prdHints?.figmaLinks || []).filter((link) =>
    /figma\.com\/(design|file)/i.test(link),
  );
  if (designLinks.length > 0) {
    context.pendingFigmaLink = designLinks[0];
  }
}

/**
 * @param {import('./storage.mjs').SessionState} session
 */
function goBack(session) {
  if (session.history.length <= 1) return false;
  session.history.pop();
  session.stateId = session.history[session.history.length - 1];
  return true;
}

/**
 * @param {string} conversationId
 * @param {import('./storage.mjs').SessionState} session
 */
function prepareInvoke(conversationId, session) {
  const briefing = buildInvokeBriefing(session.context);
  writeBriefing(conversationId, briefing);
  session.status = 'awaiting_execute';
  session.stateId = 'invoke_ready';
  saveSession(conversationId, session);
}

/**
 * @param {HookInput} input
 * @returns {{ continue: boolean; user_message?: string }}
 */
export function handleSubmit(input) {
  const prompt = (input.prompt || '').trim();
  const conversationId = input.conversation_id || 'default';
  const attachments = input.attachments || [];
  const repoRoot = resolveRepoRoot(input.workspace_roots);

  if (!prompt) return result(true);

  if (!isPrdGateEnabled(repoRoot)) return result(true);

  if (isBypassRequest(prompt)) {
    clearSession(conversationId);
    clearBriefing(conversationId);
    clearIntakeQuestion();
    return result(true);
  }

  const session = loadSession(conversationId);

  if (isExecuteRequest(prompt)) {
    if (session?.status === 'awaiting_execute' && readBriefing(conversationId)) {
      clearSession(conversationId);
      return result(true);
    }
    return result(
      false,
      [
        'No completed uno-prototype workflow is waiting for execution.',
        'Start a prototype workflow first, or say "terminate this process" to exit.',
      ].join('\n'),
    );
  }

  if (session?.status === 'active' || session?.status === 'awaiting_execute') {
    return handleActiveSession(conversationId, session, prompt, attachments);
  }

  if (!hasPrototypeIntent(prompt)) return result(true);

  const newSession = createSession(prompt);
  saveSession(conversationId, newSession);
  return presentState(conversationId, newSession);
}

/**
 * @param {string} conversationId
 * @param {import('./storage.mjs').SessionState} session
 * @param {string} prompt
 * @param {Array<{ type?: string; file_path?: string }>} attachments
 */
function handleActiveSession(conversationId, session, prompt, attachments) {
  if (GLOBAL_COMMANDS.restart.test(prompt)) {
    const restarted = createSession();
    saveSession(conversationId, restarted);
    return presentState(conversationId, restarted);
  }

  if (GLOBAL_COMMANDS.back.test(prompt)) {
    if (!goBack(session)) {
      return result(false, 'Already at the first step. Say "restart" to begin again.');
    }
    saveSession(conversationId, session);
    return presentState(conversationId, session);
  }

  const state = getState(session.stateId);
  if (!state) {
    clearSession(conversationId);
    return result(true);
  }

  if (session.status === 'awaiting_execute') {
    return result(
      false,
      [
        'Workflow inputs are complete.',
        `Send \`${EXECUTE_PHRASE}\` to invoke the coding agent.`,
        'To exit without invoking uno-prototype: say "terminate this process".',
      ].join('\n'),
    );
  }

  if (state.id === 'awaiting_prd_synthesize' && hasPrdSignal(prompt, attachments)) {
    storePrdContext(session.context, prompt.trim());
    transitionSession(session, 'fidelity_select');
    saveSession(conversationId, session);
    return presentState(conversationId, session);
  }

  if (state.id === 'awaiting_prd_synthesize') {
    return presentState(conversationId, session);
  }

  if (state.terminal && state.id !== 'awaiting_prd_synthesize') {
    if (state.id === 'challenge_deliver' || state.id === 'flow_variety_deliver') {
      clearIntakeQuestion();
      clearSession(conversationId);
      return result(
        false,
        [
          formatQuestionMessage(state, session.context),
          '',
          'Workflow complete. The coding agent does not generate this artifact.',
          'Say "terminate this process" or start a new message without prototype intent to continue.',
        ].join('\n'),
      );
    }
  }

  const effectiveType = resolveType(state, session.context);
  const options = resolveOptions(state, session.context);

  let answer = prompt;
  if (effectiveType === 'choice' && options) {
    const choice = parseChoice(prompt, options);
    if (!choice) {
      writeIntakeQuestion(conversationId, session, state);
      saveSession(conversationId, session);
      return result(
        true,
        undefined,
        `Invalid choice for the current uno-prototype intake step. ${buildAgentIntakeInstruction(state)}`,
      );
    }
    answer = choice;
  }

  if (state.id === 'hi_figma_link' && session.context.pendingFigmaLink && /^no/i.test(answer)) {
    transitionSession(session, 'hi_figma_link', { pendingFigmaLink: undefined });
    saveSession(conversationId, session);
    return presentState(conversationId, session);
  }

  if (state.validate && !state.validate(answer, session.context, attachments)) {
    writeIntakeQuestion(conversationId, session, state);
    saveSession(conversationId, session);
    return result(
      true,
      undefined,
      `Input validation failed for the current uno-prototype intake step. ${buildAgentIntakeInstruction(state)}`,
    );
  }

  if (state.id === 'prd_upload') {
    if (session.context.pendingPrd && /^yes/i.test(answer)) {
      storePrdContext(session.context, session.context.pendingPrd);
      session.context.pendingPrd = undefined;
    } else if (!session.context.pendingPrd || !/^yes/i.test(answer)) {
      storePrdContext(session.context, answer);
      session.context.pendingPrd = undefined;
    }
  }

  if (!state.transition) {
    return presentState(conversationId, session);
  }

  const transitionResult = state.transition(answer, session.context);
  let nextStateId;
  let patch = {};

  if (typeof transitionResult === 'string') {
    nextStateId = transitionResult;
  } else {
    nextStateId = transitionResult.next;
    patch = transitionResult.patch || {};
  }

  transitionSession(session, nextStateId, patch);

  const nextState = getState(nextStateId);
  if (!nextState) {
    clearSession(conversationId);
    return result(true);
  }

  if (nextStateId === 'invoke_ready') {
    prepareInvoke(conversationId, session);
    return presentState(conversationId, session);
  }

  if (nextState.terminal && (nextStateId === 'challenge_deliver' || nextStateId === 'flow_variety_deliver')) {
    clearIntakeQuestion();
    saveSession(conversationId, session);
    return result(
      false,
      [
        formatQuestionMessage(nextState, session.context),
        '',
        'Workflow complete. The coding agent does not generate this artifact.',
        'Say "terminate this process" to exit the workflow.',
      ].join('\n'),
    );
  }

  saveSession(conversationId, session);
  return presentState(conversationId, session);
}

/**
 * @param {string} conversationId
 * @param {import('./storage.mjs').SessionState} session
 */
function presentState(conversationId, session) {
  const state = getState(session.stateId);
  if (!state) {
    clearSession(conversationId);
    clearIntakeQuestion();
    return result(true);
  }

  saveSession(conversationId, session);

  if (state.terminal) {
    clearIntakeQuestion();
    return result(false, formatQuestionMessage(state, session.context));
  }

  writeIntakeQuestion(conversationId, session, state);
  return result(true, undefined, buildAgentIntakeInstruction(state));
}

export { STATES };
