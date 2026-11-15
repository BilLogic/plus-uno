#!/usr/bin/env node
/**
 * Unified input adapter for Cursor (`beforeSubmitPrompt` / `sessionEnd`),
 * Claude Code (`UserPromptSubmit` / `SessionEnd`), and Codex (`UserPromptSubmit`).
 */
import { handleSubmit, removeCard } from './engine.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
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

  const sessionId = input.session_id || input.conversation_id;
  const isClaudeOrCodex =
    input.hook_event_name === 'UserPromptSubmit' ||
    input.hook_event_name === 'SessionEnd' ||
    Boolean(input.session_id && !input.conversation_id);

  // SessionEnd cleanup (Cursor sessionEnd or Claude Code SessionEnd).
  if (
    process.argv.includes('--session-end') ||
    input.hook_event_name === 'SessionEnd' ||
    (!('prompt' in input) && sessionId)
  ) {
    if (sessionId) removeCard(sessionId);
    process.exit(0);
  }

  const output = handleSubmit(input);

  if (isClaudeOrCodex) {
    if (output.agent_message) {
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'UserPromptSubmit',
            additionalContext: output.agent_message,
          },
        }),
      );
    }
    process.exit(0);
  }

  console.log(JSON.stringify(output));
  process.exit(0);
}

main().catch(() => {
  // Fail open so an unexpected hook error never blocks a prompt.
  process.exit(0);
});
