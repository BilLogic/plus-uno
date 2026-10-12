// Whom a posted message notifies: the user mentions in the places Slack
// notifies from — the message's top-level `text`, and its section and
// rich_text blocks. A card's subtitle is not one of them, so a mention there
// is left out on purpose.

const MENTION = /<@([A-Z0-9]+)(?:\|[^>]*)?>/g;

function mentionsIn(text: string): string[] {
  return [...text.matchAll(MENTION)].map((m) => m[1]!);
}

function blockTexts(block: Record<string, any>): string[] {
  if (block.type === "section") {
    return [block.text?.text ?? "", ...((block.fields ?? []) as Array<{ text?: string }>).map((f) => f.text ?? "")];
  }
  if (block.type === "rich_text") {
    const users: string[] = [];
    const walk = (node: Record<string, any>) => {
      if (node.type === "user" && typeof node.user_id === "string") users.push(`<@${node.user_id}>`);
      for (const child of (node.elements ?? []) as Record<string, any>[]) walk(child);
    };
    walk(block);
    return users;
  }
  return [];
}

/**
 * Each user a message notifies, once, in the order first mentioned: from its
 * `text` and from its section and rich_text blocks.
 *
 * @param message - The posted message
 */
export function notified(message: { text: string; blocks?: unknown[] }): string[] {
  const texts = [message.text, ...((message.blocks ?? []) as Record<string, any>[]).flatMap(blockTexts)];
  return [...new Set(texts.flatMap(mentionsIn))];
}

/** How many times a user is mentioned in the message's blocks that notify. */
export function mentionCount(message: { blocks?: unknown[] }, user: string): number {
  return ((message.blocks ?? []) as Record<string, any>[]).flatMap(blockTexts).flatMap(mentionsIn).filter((u) => u === user).length;
}
