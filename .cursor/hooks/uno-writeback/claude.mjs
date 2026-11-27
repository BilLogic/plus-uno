#!/usr/bin/env node
/**
 * Claude Code adapter for the DS write-back gate (`UserPromptSubmit`).
 * Claude sends `{ session_id, cwd, prompt }` on stdin; the engine speaks
 * Cursor's shape, so map in and out. Same engine, same gate file. Output
 * follows `uno-prototype/run.mjs`: `additionalContext` carries the briefing,
 * a blocked prompt returns `decision: "block"`, and silence means inert.
 */
import { handleSubmit } from './engine.mjs';

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const output = handleSubmit({
    prompt: input.prompt,
    conversation_id: input.session_id,
    workspace_roots: input.cwd ? [input.cwd] : undefined,
  });

  if (!output.continue) {
    console.log(JSON.stringify({ decision: 'block', reason: output.user_message }));
  } else if (output.agent_message) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: output.agent_message,
        },
      }),
    );
  }
}

// Fail open: an unexpected hook error never blocks a prompt.
main().catch(() => {});
