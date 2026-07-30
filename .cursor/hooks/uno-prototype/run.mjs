#!/usr/bin/env node
import { handleSubmit } from './engine.mjs';

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
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const output = handleSubmit(input);
  console.log(JSON.stringify(output));
  process.exit(output.continue ? 0 : 2);
}

main().catch((error) => {
  const message = `uno-prototype hook error: ${error.message}`;
  console.log(JSON.stringify({ continue: false, user_message: message }));
  process.exit(2);
});
