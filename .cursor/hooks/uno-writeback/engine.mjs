import {
  hasWritebackIntent,
  isAuditCompletePhrase,
  isTerminateWriteback,
} from './intents.mjs';
import {
  buildAgentGateInstruction,
  clearSession,
  hasAuditPass,
  isWritebackGateEnabled,
  loadSession,
  resolveRepoRoot,
  saveSession,
  writeGateBriefing,
} from './storage.mjs';

/**
 * @typedef {object} HookInput
 * @property {string} [prompt]
 * @property {string} [conversation_id]
 * @property {string[]} [workspace_roots]
 */

/**
 * @param {boolean} continueSubmit
 * @param {string} [userMessage]
 * @param {string} [agentMessage]
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
 * @param {HookInput} input
 */
export function handleSubmit(input) {
  const prompt = (input.prompt || '').trim();
  const conversationId = input.conversation_id || 'default';
  const repoRoot = resolveRepoRoot(input.workspace_roots);

  if (!prompt) return result(true);

  if (!isWritebackGateEnabled(repoRoot)) return result(true);

  if (isTerminateWriteback(prompt)) {
    clearSession(conversationId);
    return result(true);
  }

  const session = loadSession(conversationId);

  if (session?.status === 'active') {
    if (isForbiddenCaptureIntent(prompt)) {
      return result(
        false,
        [
          'Blocked: generate_figma_design / screenshot capture cannot be the final write-back deliverable.',
          'Use registry component instances per design-system/figma/component-alignment.md.',
          'To cancel: terminate writeback',
        ].join('\n'),
      );
    }

    if (hasAuditPass(conversationId) && isAuditCompletePhrase(prompt)) {
      clearSession(conversationId);
      return result(
        true,
        undefined,
        'DS write-back gate cleared. The manifest passed validate + audit.',
      );
    }

    return result(true, undefined, buildAgentGateInstruction());
  }

  if (!hasWritebackIntent(prompt)) return result(true);

  const nextSession = {
    status: 'active',
    startedAt: new Date().toISOString(),
    triggerPrompt: prompt,
    updatedAt: new Date().toISOString(),
  };
  saveSession(conversationId, nextSession);
  writeGateBriefing(conversationId, prompt);

  return result(
    true,
    undefined,
    [
      buildAgentGateInstruction(),
      'User requested Figma write-back. Follow active-writeback-gate.json before touching the Figma canvas.',
    ].join(' '),
  );
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
function isForbiddenCaptureIntent(prompt) {
  return /generate_figma_design|html-to-design|screenshot import/i.test(prompt);
}
