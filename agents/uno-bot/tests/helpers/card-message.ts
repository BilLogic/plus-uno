// A decided card's message, read back as the two things a door test asserts:
// the card's words, and the outcome line edited onto it.
import type { CardMessage } from "../../src/slack/button-door";

/**
 * The card's words and its last line, off the message a door edited it to:
 * the note is the last context line, and the words are the fallback copy
 * without it.
 */
export function cardWords(message: CardMessage): { text: string; note: string } {
  const lines = (message.blocks as Array<{ type?: string; elements?: Array<{ text?: string }> }>).filter(
    (b) => b.type === "context",
  );
  const note = lines[lines.length - 1]?.elements?.[0]?.text ?? "";
  const text = message.text.endsWith(`\n${note}`) ? message.text.slice(0, -note.length - 1) : message.text;
  return { text, note };
}
