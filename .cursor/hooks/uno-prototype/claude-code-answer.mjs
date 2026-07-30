#!/usr/bin/env node
/**
 * Claude Code PostToolUse adapter — feeds AskUserQuestion answers into the gate FSM.
 *
 * Companion to claude-code-run.mjs (UserPromptSubmit). That hook can only see
 * what the user TYPES; the gate's questions are asked with AskUserQuestion, whose
 * answers arrive as tool results and fire no prompt event. Without this adapter
 * the FSM never advanced on an answer, and the user's next message — whatever it
 * was about — got consumed as the answer to the pending step.
 *
 * Claude Code stdin:  { session_id, cwd, tool_name, tool_input, tool_response, ... }
 * Claude Code stdout: { hookSpecificOutput: { hookEventName, additionalContext } }
 */
import { handleGateAnswer } from './engine.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Pull the chosen option text out of an AskUserQuestion result. The shape has
 * changed across versions, so probe the known carriers rather than trusting one:
 * an `answers` map, a list of {question, answer} records, or a bare string.
 * Multi-select answers are joined — the reflection steps accept free text.
 * @param {unknown} response
 * @returns {string}
 */
function extractAnswer(response) {
  if (!response) return '';
  if (typeof response === 'string') return response;

  const r = /** @type {Record<string, unknown>} */ (response);

  if (r.answers && typeof r.answers === 'object') {
    const values = Object.values(/** @type {Record<string, unknown>} */ (r.answers))
      .filter((v) => typeof v === 'string');
    if (values.length) return values.join(', ');
  }

  for (const key of ['choices', 'responses', 'results']) {
    const list = r[key];
    if (Array.isArray(list)) {
      const values = list
        .map((item) =>
          typeof item === 'string'
            ? item
            : /** @type {Record<string, unknown>} */ (item || {}).answer ||
              /** @type {Record<string, unknown>} */ (item || {}).value ||
              '',
        )
        .filter((v) => typeof v === 'string' && v.trim());
      if (values.length) return values.join(', ');
    }
  }

  if (typeof r.answer === 'string') return r.answer;
  if (typeof r.text === 'string') return r.text;
  return '';
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  // Only AskUserQuestion carries gate answers; ignore every other tool.
  if (!/^askuserquestion$/i.test(String(input.tool_name || ''))) process.exit(0);

  const answer = extractAnswer(input.tool_response);
  if (!answer) process.exit(0);

  const output = handleGateAnswer({
    conversation_id: input.session_id || 'default',
    answer,
    workspace_roots: input.cwd ? [input.cwd] : [],
  });

  if (output.agent_message) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: output.agent_message,
        },
      }),
    );
  }
  process.exit(0);
}

main().catch((error) => {
  // Fail open: a broken adapter must never wedge the turn.
  console.error(`uno-prototype answer-hook error: ${error.message}`);
  process.exit(0);
});
