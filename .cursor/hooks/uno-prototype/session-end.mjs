#!/usr/bin/env node
import { clearSession } from './storage.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    process.exit(0);
  }

  try {
    const input = JSON.parse(raw);
    const conversationId = input.session_id || input.conversation_id;
    if (conversationId) {
      clearSession(conversationId);
    }
  } catch {
    // fire-and-forget cleanup
  }

  process.exit(0);
}

main();
