// What each message shortcut ASKS — pure data, no imports.
//
// Split from shortcuts.ts so it is unit-testable: the runtime half imports
// api.ts and events.ts, which drag in the Workers type graph and cannot compile
// under the node-only test config. Every bug worth catching here is in the
// WORDING, so the wording is what got extracted.
//
// The manifest carries only the menu label and callback_id; these strings are
// the actual behaviour, kept in code so they are reviewable in a diff.

export interface ShortcutSpec {
  /** Thread title in the Messages-tab timeline. */
  title: string;
  /** The line posted before the work starts. Confirms WHICH message was picked. */
  anchor: (link: string) => string;
  /** The question actually asked of the agent. */
  ask: (link: string) => string;
}

export const SHORTCUTS: Record<string, ShortcutSpec> = {
  // Default effort: the transcript is already in the prompt, so there is
  // nothing to dig for. The instruction not to restate the thread matters —
  // the person was there, they just did not read 40 messages.
  catchup: {
    title: "Catch-up",
    anchor: (l) => `Catching you up on this thread: ${l}`,
    ask: (l) =>
      `Read this thread and catch me up: ${l}\n\n` +
      `Give me: what was DECIDED, what is still OPEN, who owns each open item, and anything waiting on me. ` +
      `Do NOT restate the thread message by message — I was there, I just have not read it. ` +
      `If something is ambiguous, say so rather than resolving it yourself.`,
  },

  // Exists BECAUSE /grind cannot be typed in a thread. Without it, escalating
  // from inside a conversation is impossible.
  grind: {
    title: "Second look",
    anchor: (l) => `Taking another run at this: ${l}`,
    ask: (l) =>
      `Think harder about this and redo it properly: ${l}\n\n` +
      `Assume the previous answer was thin. Check the claims against the sources rather than restating them, ` +
      `and say explicitly where you now disagree with what was said before.`,
  },

  // Two sources of truth, and the conflict rule is the point: blueprint = today,
  // Roadmap = planned, disagreements surfaced and never blended.
  verify: {
    title: "Still true?",
    anchor: (l) => `Checking whether this still holds: ${l}`,
    ask: (l) =>
      `Check whether the claim in this message is STILL TRUE: ${l}\n\n` +
      `Check both sources of truth: the blueprint for how the service works today, and Notion project ` +
      `documentation (PRDs, Roadmap cards, Help Center) for what is planned or written down. ` +
      `If they disagree, SURFACE the conflict — a WIP card means it is changing, a shipped card that ` +
      `disagrees means the doc is likely stale. Never blend them. ` +
      `If you cannot verify it, say which part you could not check and why, rather than implying it holds.`,
  },

  // The question the Decisions DB exists to answer. Ordered sources: recorded
  // beats remembered.
  where_decided: {
    title: "Where decided?",
    anchor: (l) => `Looking for where this was decided: ${l}`,
    ask: (l) =>
      `Find where the decision in this message was made: ${l}\n\n` +
      `Look in this ORDER and say which one answered: (1) the Notion Decisions DB, ` +
      `(2) Notion project documentation — PRDs and Roadmap cards, (3) Slack history. ` +
      `A recorded decision beats a remembered one, so do not lead with a Slack message if a record exists. ` +
      `Report when, by whom, and where it is recorded. ` +
      `If it was decided in Slack and never written down, SAY THAT — it is the useful finding, not a failure — ` +
      `and offer to file it. If there is no record anywhere, say there is none. Never construct a plausible origin.`,
  },

  // The value is attribution, not words: an @-mention produces a correct answer
  // credited to a bot; this produces one credited to the person.
  draft: {
    title: "Draft reply",
    anchor: (l) => `Drafting a reply for you: ${l}`,
    ask: (l) =>
      `Help me reply to this message: ${l}\n\n` +
      `Write it in MY voice, as something I will paste and send myself — so match how I already write ` +
      `(sentence length, greeting or none, emoji or none, how blunt I am). Do not make me sound more formal than I am. ` +
      `Put the draft in a fenced code block so it copies cleanly, and list any sources BELOW it so the draft stays paste-ready. ` +
      `Do NOT post it anywhere: this one is mine to send.`,
  },
};
