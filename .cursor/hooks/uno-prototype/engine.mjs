import { GLOBAL_COMMANDS, EXECUTE_PHRASE, STRICT_GATE_STATE_IDS } from './constants.mjs';
import {
  hasPrototypeIntent,
  hasFidelitySwitchIntent,
  hasNewPrdIntent,
  isBypassRequest,
  isExecuteRequest,
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
  clearPrdCache,
  clearSession,
  isPrdGateEnabled,
  loadPrdCache,
  loadSession,
  readBriefing,
  resolveRepoRoot,
  savePrdCache,
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
 * @param {string} stateId
 * @returns {boolean}
 */
function isStrictGateState(stateId) {
  return STRICT_GATE_STATE_IDS.has(stateId);
}

/**
 * @param {string} conversationId
 */
function releaseSession(conversationId) {
  clearIntakeQuestion();
  clearSession(conversationId);
}

/**
 * @param {Record<string, unknown>} [cachedPrd]
 * @returns {{ stateId: string; history: string[]; context: Record<string, unknown>; status: 'active' }}
 */
function createSession(cachedPrd = null) {
  if (cachedPrd?.prd) {
    return {
      stateId: 'fidelity_select',
      history: ['fidelity_select'],
      context: {
        prd: cachedPrd.prd,
        prdHints: cachedPrd.prdHints || extractPrdHints(/** @type {string} */ (cachedPrd.prd)),
        prdResumed: true,
      },
      status: 'active',
    };
  }

  return {
    stateId: 'prd_check',
    history: ['prd_check'],
    context: {},
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
 * @param {string} conversationId
 */
function storePrdContext(context, prdText, conversationId) {
  context.prd = prdText;
  context.prdHints = extractPrdHints(prdText);
  savePrdCache(conversationId, { prd: prdText, prdHints: context.prdHints });
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
 * @param {import('./states.mjs').ConversationState} state
 * @param {Record<string, unknown>} context
 * @returns {string}
 */
function terminalAgentMessage(state, context) {
  return [
    formatQuestionMessage(state, context),
    '',
    'Workflow complete. Continue the conversation normally — the hook will no longer intercept.',
  ].join('\n');
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

  if (hasNewPrdIntent(prompt)) {
    clearPrdCache(conversationId);
    clearBriefing(conversationId);
    clearSession(conversationId);
    const fresh = createSession();
    saveSession(conversationId, fresh);
    return presentState(conversationId, fresh);
  }

  const cachedPrd = loadPrdCache(conversationId);
  const wantsReentry =
    hasFidelitySwitchIntent(prompt) || (hasPrototypeIntent(prompt) && Boolean(cachedPrd));

  const session = loadSession(conversationId);

  if (isExecuteRequest(prompt)) {
    if (readBriefing(conversationId)) {
      clearSession(conversationId);
      clearIntakeQuestion();
      return result(true);
    }
    return result(
      true,
      undefined,
      [
        'No completed uno-prototype workflow is waiting for execution.',
        'Start a prototype workflow first, or say "terminate this process" to exit.',
      ].join('\n'),
    );
  }

  if (session?.status === 'awaiting_execute') {
    return result(true);
  }

  if (session?.status === 'active' || session?.status === 'awaiting_execute') {
    return handleActiveSession(conversationId, session, prompt, attachments);
  }

  if (wantsReentry && cachedPrd) {
    const resumed = createSession(cachedPrd);
    saveSession(conversationId, resumed);
    return presentState(conversationId, resumed);
  }

  if (hasFidelitySwitchIntent(prompt) && !cachedPrd) {
    return result(true);
  }

  if (!hasPrototypeIntent(prompt)) return result(true);

  const newSession = createSession();
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
  if (hasFidelitySwitchIntent(prompt)) {
    const atFidelityStep =
      session.stateId === 'fidelity_select' || session.stateId === 'fidelity_level_pick';
    if (!atFidelityStep) {
      const cached = loadPrdCache(conversationId) || (session.context?.prd ? {
        prd: session.context.prd,
        prdHints: session.context.prdHints,
      } : null);
      if (cached) {
        const resumed = createSession(cached);
        saveSession(conversationId, resumed);
        return presentState(conversationId, resumed);
      }
    }
  }

  if (GLOBAL_COMMANDS.restart.test(prompt)) {
    const cached = loadPrdCache(conversationId);
    const restarted = createSession(cached);
    saveSession(conversationId, restarted);
    return presentState(conversationId, restarted);
  }

  if (GLOBAL_COMMANDS.back.test(prompt)) {
    if (!goBack(session)) {
      return result(
        true,
        undefined,
        'Already at the first step. Say "restart" to begin again.',
      );
    }
    saveSession(conversationId, session);
    return presentState(conversationId, session);
  }

  const state = getState(session.stateId);
  if (!state) {
    clearSession(conversationId);
    return result(true);
  }

  if (state.terminal) {
    releaseSession(conversationId);
    return result(true);
  }

  const strict = isStrictGateState(state.id);
  const effectiveType = resolveType(state, session.context);
  const options = resolveOptions(state, session.context);

  let answer = prompt;
  if (effectiveType === 'choice' && options) {
    const choice = parseChoice(prompt, options);
    if (!choice) {
      if (!strict) {
        releaseSession(conversationId);
        return result(true);
      }
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

  if (state.validate && !state.validate(answer, session.context, attachments)) {
    if (!strict) {
      releaseSession(conversationId);
      return result(true);
    }
    writeIntakeQuestion(conversationId, session, state);
    saveSession(conversationId, session);
    return result(
      true,
      undefined,
      `Input validation failed for the current uno-prototype intake step. ${buildAgentIntakeInstruction(state)}`,
    );
  }

  if (state.id === 'challenge_other') {
    session.context.challengeOtherNote = answer.trim();
    session.context.challengeTool = 'custom';
    session.context.branch = 'challenge';
    releaseSession(conversationId);
    return result(true);
  }

  if (state.id === 'prd_paste') {
    storePrdContext(session.context, answer, conversationId);
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

  if (nextStateId === 'awaiting_prd_synthesize') {
    releaseSession(conversationId);
    return result(true, undefined, nextState.question);
  }

  if (nextStateId === 'invoke_ready') {
    prepareInvoke(conversationId, session);
    clearSession(conversationId);
    clearIntakeQuestion();
    return result(
      true,
      undefined,
      [
        'Prototype briefing confirmed.',
        `Send \`${EXECUTE_PHRASE}\` when you are ready to start the build, or continue in chat.`,
        'The hook will not intercept further messages until you start a new prototype workflow.',
      ].join(' '),
    );
  }

  if (nextState.terminal && (nextStateId === 'challenge_deliver' || nextStateId === 'flow_variety_deliver')) {
    const agentMessage = terminalAgentMessage(nextState, session.context);
    releaseSession(conversationId);
    return result(true, undefined, agentMessage);
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
    const agentMessage = terminalAgentMessage(state, session.context);
    releaseSession(conversationId);
    return result(true, undefined, agentMessage);
  }

  writeIntakeQuestion(conversationId, session, state);
  return result(true, undefined, buildAgentIntakeInstruction(state));
}

export { STATES };
