import { GLOBAL_COMMANDS } from './constants.mjs';
import {
  hasPrototypeIntent,
  hasNewPrdIntent,
  isBypassRequest,
} from './intents.mjs';
import { getState, STATES } from './states.mjs';
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
  resolveRepoRoot,
  savePrdCache,
  saveSession,
} from './storage.mjs';
import { isNoPrdAnswer, looksLikePrdContent, parseChoice } from './validators.mjs';

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
 * @param {string} conversationId
 */
function releaseSession(conversationId) {
  clearIntakeQuestion(conversationId);
  clearSession(conversationId);
}

/**
 * @param {Record<string, unknown>} [cachedPrd]
 * @returns {{ stateId: string; history: string[]; context: Record<string, unknown>; status: 'active' }}
 */
function createSession(cachedPrd = null) {
  if (cachedPrd?.prd) {
    // PRD already captured this conversation — the PRD gate is satisfied, so
    // re-enter the reflection at its first question (Step 2 re-runs on a fresh
    // prototype request; a failed review legitimately changes the strategy).
    return {
      stateId: 'reflect_learn',
      history: ['reflect_learn'],
      context: {
        prd: cachedPrd.prd,
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
  savePrdCache(conversationId, { prd: prdText });
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
 * Handoff emitted the moment the brief card is confirmed. The hook releases
 * the session and the agent takes over Step 3 (Plan) → Step 4 (Generate) —
 * never jumping straight to a build. The confirmed reflection answers ride
 * along as the contract: the build's validation loop checks the artifact
 * against them, and prompt-specs embed them as the external tool's self-check.
 * @param {Record<string, unknown>} [context]
 * @returns {string}
 */
function buildHandoffMessage(context = {}) {
  const reflection = /** @type {Record<string, string> | undefined} */ (context.reflection);
  const contractLines = reflection
    ? [
        'The confirmed prototype brief (the contract for everything that follows):',
        reflection.reflect_learn ? `- Goal: ${reflection.reflect_learn}` : '',
        reflection.reflect_artifact ? `- Artifact: ${reflection.reflect_artifact}` : '',
        reflection.reflect_fidelity ? `- Fidelity: ${reflection.reflect_fidelity}` : '',
        reflection.reflect_exclude ? `- Won't include: ${reflection.reflect_exclude}` : '',
      ].filter(Boolean)
    : [];

  return [
    'Step 2 (Prototype Reflection) is complete — the brief is confirmed and the uno-prototype hook will no longer intercept.',
    ...contractLines,
    'NOW load the ONE deliverable doc the confirmed artifact selects — the map is in skills/uno-prototype/SKILL.md § Deliverables & routing (e.g. a user flow → references/deliverables/flow-map.md; a hi-fi build → references/deliverables/coded-build.md). Step 3 (Plan) and Step 4 (Generate) live in that doc: restate this brief at the top of the plan, confirm the plan and touched files before any large edit, then produce the deliverable.',
    'The validation loop\'s objective is this brief: the artifact serves the goal, matches the fidelity dials, and contains nothing from the won\'t-include list — never expand scope just because the PRD lists more.',
  ].join(' ');
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
    clearIntakeQuestion(conversationId);
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
  const session = loadSession(conversationId);

  if (session?.status === 'active') {
    return handleActiveSession(conversationId, session, prompt, attachments);
  }

  // Re-entry: a fresh prototype request when a PRD is already cached skips the
  // PRD gate and hands off to the agent to re-run the reflection workflow.
  if (hasPrototypeIntent(prompt) && cachedPrd) {
    const resumed = createSession(cachedPrd);
    saveSession(conversationId, resumed);
    return presentState(conversationId, resumed);
  }

  if (!hasPrototypeIntent(prompt)) return result(true);

  const newSession = createSession();
  saveSession(conversationId, newSession);
  return presentState(conversationId, newSession);
}

/**
 * Advance the gate with an answer that arrived as a TOOL RESULT rather than a
 * user prompt.
 *
 * The FSM was written for Cursor, where every gate answer is a `beforeSubmitPrompt`
 * submission. In Claude Code the agent is instructed to ask via AskQuestion, and
 * those answers come back as tool results that never fire `UserPromptSubmit` —
 * so the gate could not advance at all, and the user's *next* unrelated message
 * got consumed as the answer instead. This is the entry point the PostToolUse
 * adapter uses to close that gap.
 * @param {{ conversation_id?: string; answer?: string; workspace_roots?: string[] }} input
 * @returns {{ continue: boolean; agent_message?: string }}
 */
export function handleGateAnswer(input) {
  const answer = (input.answer || '').trim();
  const conversationId = input.conversation_id || 'default';
  const repoRoot = resolveRepoRoot(input.workspace_roots);

  if (!answer) return result(true);
  if (!isPrdGateEnabled(repoRoot)) return result(true);

  const session = loadSession(conversationId);
  if (session?.status !== 'active') return result(true);

  return handleActiveSession(conversationId, session, answer, []);
}

/**
 * @param {string} conversationId
 * @param {import('./storage.mjs').SessionState} session
 * @param {string} prompt
 * @param {Array<{ type?: string; file_path?: string }>} attachments
 */
function handleActiveSession(conversationId, session, prompt, attachments) {
  // Dedup: on runtimes where an ask-the-user answer ALSO surfaces as a prompt
  // event (Claude Code / Codex — the typed rather than tapped path), the same
  // answer can reach the FSM twice: once via UserPromptSubmit, once via
  // PostToolUse. Reflection steps validate any non-empty text, so the second
  // arrival would silently advance a second step and store the answer under the
  // wrong id. Same text, same step, within a few seconds → already consumed.
  // Matched on text + recency only: by the time the duplicate arrives the step
  // has already advanced, so comparing against the CURRENT step never matches.
  // A user cannot deliberately answer twice inside the window — they have not
  // seen the next question yet.
  const now = Date.now();
  if (
    session.lastAnswer === prompt &&
    session.lastAnswerAt &&
    now - Date.parse(session.lastAnswerAt) < 5_000
  ) {
    return result(true);
  }
  session.lastAnswer = prompt;
  session.lastAnswerAt = new Date(now).toISOString();

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

  // Every non-terminal state is a strict gate: an invalid or empty reply
  // re-prompts the same step rather than falling through. Terminal states
  // return above, so there is no non-strict path to handle here.
  const effectiveType = state.type;
  const options = state.options;

  let answer = prompt;
  if (effectiveType === 'choice' && options) {
    const choice = parseChoice(prompt, options);
    if (!choice) {
      // Fast path: the designer answered "Do you have a PRD?" by pasting the PRD
      // itself. That input satisfies BOTH gate steps, so consume it as the
      // answer and the document in one move rather than rejecting it as an
      // invalid choice — otherwise the gate re-asks forever (the paste can never
      // parse as Yes/No). Covers the common case where the PRD arrives before
      // the question is formally answered.
      if (state.id === 'prd_check' && looksLikePrdContent(prompt)) {
        storePrdContext(session.context, prompt, conversationId);
        transitionSession(session, 'prd_paste');
        transitionSession(session, 'reflect_learn');
        saveSession(conversationId, session);
        return presentState(conversationId, session);
      }
      // Mirror of the fast path on the "No" branch: natural phrasings like
      // "nope" or "not yet" are unmistakably a no, but `parseChoice` only
      // accepts the literal option label, so they used to be rejected and
      // re-asked forever. `isNoPrdAnswer` was written for exactly this and was
      // never wired in — route it to the guided uno-synthesize exit.
      if (state.id === 'prd_check' && isNoPrdAnswer(prompt)) {
        answer = 'No';
      } else {
        writeIntakeQuestion(conversationId, session, state);
        saveSession(conversationId, session);
        return result(
          true,
          undefined,
          `Invalid choice for the current uno-prototype intake step. ${buildAgentIntakeInstruction(state)}`,
        );
      }
    } else {
      answer = choice;
    }
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

  if (nextStateId === 'build_handoff') {
    releaseSession(conversationId);
    return result(true, undefined, buildHandoffMessage(session.context));
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
    clearIntakeQuestion(conversationId);
    return result(true);
  }

  saveSession(conversationId, session);

  if (state.id === 'build_handoff') {
    releaseSession(conversationId);
    return result(true, undefined, buildHandoffMessage(session.context));
  }

  if (state.terminal) {
    releaseSession(conversationId);
    return result(true);
  }

  writeIntakeQuestion(conversationId, session, state);
  return result(true, undefined, buildAgentIntakeInstruction(state));
}

export { STATES };
