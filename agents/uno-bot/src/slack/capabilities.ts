// What le goat tells people it can do: the one place the Home view and the
// assistant welcome both read, so the two never drift apart. AGENT.md's
// "My lane" is the model's own statement of the same lane; this file is the
// user-visible surface of it.

import type { Env } from "../types";

/** The IDE agents a hand-off prompt is written for, by product name. */
export const HAND_OFF_TARGETS = ["Claude Code", "Cursor", "Codex", "Antigravity"] as const;

/** What I can do, one card each: a title and a body of at most 200
 *  characters, the most a card's body holds. `icon` is a Slack icon name. */
export const CAPABILITIES = [
  {
    icon: "book",
    title: "Answer, grounded",
    body: "Roadmap card status, owner and pillar, how a product flow works, design-system components and tokens, and any linked Notion, Figma or Slack doc. Cited, live.",
  },
  {
    icon: "edit",
    title: "Create, with your approval",
    body: "Draft a PRD, file or update a card, start a component build or prototype, share work for feedback. Nothing is written until someone approves it.",
  },
  {
    icon: "code",
    title: "Hand off to code",
    body: `Anything that needs real code, I write as a ready-to-paste prompt for your IDE agent: ${HAND_OFF_TARGETS.slice(0, -1).join(", ")} or ${HAND_OFF_TARGETS[HAND_OFF_TARGETS.length - 1]}.`,
  },
] as const;

/** The assistant panel's first message: fixed copy, one breath. */
export const WELCOME_TEXT =
  "Hey — I'm le goat :goat:. Ask me about Roadmap cards, how a product flow works, " +
  "or design-system components — or drop a Notion/Figma link and I'll dig in. " +
  "Anything I'd create or change in Notion or GitHub waits for your approval first.";

/** The harness repo's web address, from the repo the Worker is configured for. */
export function repoUrl(env: Pick<Env, "GITHUB_REPO">): string {
  return `https://github.com/${env.GITHUB_REPO.trim()}`;
}
