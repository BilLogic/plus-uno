#!/usr/bin/env node
/**
 * Claude Code parity adapter for the uno-prototype gate.
 *
 * The gate FSM lives in engine.mjs and was written for Cursor's
 * `beforeSubmitPrompt` hook (see run.mjs). Claude Code fires a `UserPromptSubmit`
 * hook with a different stdin/stdout contract, so this adapter maps between the
 * two while reusing the exact same engine — the PRD gate and the Step 2
 * reflection gate behave identically in both IDEs, and both write the same
 * `.cursor/hooks/briefings/active-intake-question.json` the SKILL reads.
 *
 * Claude Code stdin:  { prompt, session_id, cwd, hook_event_name, ... }
 * Claude Code stdout: { hookSpecificOutput: { hookEventName, additionalContext } }
 *                     or { decision: "block", reason } to stop the turn.
 */
import { handleSubmit } from './engine.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/** @param {string} context */
function emitContext(context) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: context,
      },
    }),
  );
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

  const output = handleSubmit({
    prompt: input.prompt || '',
    conversation_id: input.session_id || 'default',
    workspace_roots: input.cwd ? [input.cwd] : [],
    attachments: [],
  });

  // The gate never hard-blocks the user prompt — it injects the intake/reflection
  // instruction as context (same as Cursor's agent_message) and lets the turn
  // proceed. active-intake-question.json has already been written by the engine.
  if (output.agent_message) {
    emitContext(output.agent_message);
  } else if (!output.continue && output.user_message) {
    console.log(JSON.stringify({ decision: 'block', reason: output.user_message }));
  }
  process.exit(0);
}

main().catch((error) => {
  // Fail open: never wedge the user's prompt on an adapter error.
  console.error(`uno-prototype claude-code hook error: ${error.message}`);
  process.exit(0);
});
