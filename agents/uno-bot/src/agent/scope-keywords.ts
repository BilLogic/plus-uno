// Leading scope keywords: `blueprint:` `ds:` `notion:` `slack:` `github:`.
//
// WHAT THEY ARE FOR
// -----------------
// The agent picks its own sources, and usually picks well. The case it cannot
// win is the one where the ASKER already knows where the answer lives. "does
// Badge exist" is a design-system question; the agent may still sweep Notion
// and Slack first, spend four lookups and a slow turn, and arrive at the answer
// it would have got from one read. `ds: does Badge exist` says so up front.
//
// This is a HINT, not a filter. It is expressed as an instruction in the prompt
// rather than by removing tools, for one reason: a hard filter turns a wrong
// guess into a wrong answer. Someone who types `notion:` about something that
// only exists in the blueprint should get the blueprint answer plus a note that
// it wasn't in Notion — not "I couldn't find it".
//
// LEADING ONLY, and that is load-bearing. Scanning anywhere in the message
// would fire on ordinary prose ("check the blueprint: it's stale", any pasted
// URL, a code snippet with a `github:` field). The prefix is a deliberate act
// at the start of a message; a colon in the middle of a sentence is not.
//
// Pure and import-free, so it can be tested without the Workers type graph.

export type ScopeName = "blueprint" | "ds" | "notion" | "slack" | "github";

export interface Scope {
  name: ScopeName;
  /** Shown back to the user's own words in logs; also the label in the note. */
  label: string;
  /** Appended to the prompt. Says WHERE to start and — every one of them —
   *  what to do when the answer is not there, because a scope that silently
   *  becomes a filter is the failure mode this design is avoiding. */
  instruction: string;
}

const NOT_THERE =
  "If the answer is not there, say so plainly and then check elsewhere anyway — " +
  "the scope is where I think it lives, not a rule about where you may look.";

export const SCOPES: Record<ScopeName, Scope> = {
  blueprint: {
    name: "blueprint",
    label: "service blueprint",
    instruction:
      `Start in the service blueprint — most of it is the record of how the service works TODAY, ` +
      `but paths whose name starts \`Planned:\` (decided, scheduled, unshipped) or \`Prototype:\` ` +
      `(exploratory, may never ship) carry future state. Report those as future, never as today, ` +
      `and never say a scenario has no future state without searching that scenario for one. ` +
      `Use blueprint_search first and answer from what it holds. ${NOT_THERE}`,
  },
  ds: {
    name: "ds",
    label: "design system",
    instruction:
      `Start in the design system — components, tokens, Storybook, and the design-system docs. ` +
      `A component either exists there or it does not; do not infer existence from a Notion card ` +
      `describing one that is planned. ${NOT_THERE}`,
  },
  notion: {
    name: "notion",
    label: "Notion",
    instruction:
      `Start in Notion — PRDs, Roadmap cards, the Decisions DB, the team and app directories. ` +
      `Notion is the record of what is PLANNED and written down, not of what is built. ${NOT_THERE}`,
  },
  slack: {
    name: "slack",
    label: "Slack history",
    instruction:
      `Start in Slack history — search the conversation record rather than the written documentation. ` +
      `Remember that a Slack message is what someone SAID, not a decision of record: if you find one, ` +
      `say who said it and when, and flag that it was never written down. ${NOT_THERE}`,
  },
  github: {
    name: "github",
    label: "GitHub",
    instruction:
      `Start in GitHub — the code, the repo docs, and what has actually shipped. ` +
      `Code is evidence of what is built; a plan is not. ${NOT_THERE}`,
  },
};

export interface ScopedRequest {
  scope: Scope;
  /** The question with the keyword removed. Never empty — see parseScope. */
  text: string;
}

// Anchored at the start. `\s*` before the colon is deliberate: people type
// "ds :" as often as "ds:". At least one character must follow, or there is no
// question to scope — see below.
const SCOPE_RE = new RegExp(`^\\s*(${Object.keys(SCOPES).join("|")})\\s*:\\s*(.*)$`, "is");

/**
 * Split a leading scope keyword off a message.
 *
 * Returns null when there is no keyword, and ALSO when the keyword is all there
 * is (`notion:` alone). A bare keyword is not a scoped empty question — it is
 * most likely someone about to paste, or a Notion URL that lost its `https://`.
 * Treating it as a scope would send an empty question to the model; leaving it
 * alone sends the literal text, which at worst gets a "what about Notion?".
 */
export function parseScope(userText: string): ScopedRequest | null {
  const m = SCOPE_RE.exec(userText);
  if (!m) return null;
  const name = (m[1] ?? "").toLowerCase() as ScopeName;
  const rest = (m[2] ?? "").trim();
  const scope = SCOPES[name];
  if (!scope || !rest) return null;
  return { scope, text: rest };
}
