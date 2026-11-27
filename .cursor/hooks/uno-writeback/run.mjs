#!/usr/bin/env node
/**
 * One entry point for the DS write-back gate on Cursor (`beforeSubmitPrompt` /
 * `sessionEnd`), Claude Code and Codex (`UserPromptSubmit`, Claude `SessionEnd`).
 * Cursor blocks with exit 2; Claude Code and Codex get the reason as
 * `additionalContext`, so a prompt is never erased.
 */
import { endSession, handleSubmit } from './engine.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function context(text) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text },
    }),
  );
}

let cursorRuntime = true;

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

  cursorRuntime = !isClaudeOrCodex;

  if (
    process.argv.includes('--session-end') ||
    input.hook_event_name === 'SessionEnd' ||
    (!('prompt' in input) && sessionId)
  ) {
    if (sessionId) endSession(sessionId);
    process.exit(0);
  }

  if (isClaudeOrCodex) {
    const output = handleSubmit({
      prompt: input.prompt,
      conversation_id: input.session_id,
      workspace_roots: input.cwd ? [input.cwd] : undefined,
    });
    const text = output.continue ? output.agent_message : output.user_message;
    if (text) context(text);
    process.exit(0);
  }

  const output = handleSubmit(input);
  console.log(JSON.stringify(output));
  process.exit(output.continue ? 0 : 2);
}

main().catch((error) => {
  // Cursor keeps its long-standing behavior: a hook error blocks with its message.
  // Claude Code and Codex fail open.
  if (!cursorRuntime) process.exit(0);
  const message = `uno-writeback hook error: ${error.message}`;
  console.log(JSON.stringify({ continue: false, user_message: message }));
  process.exit(2);
});
