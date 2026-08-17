// What a failure MESSAGE says. Pure — no Slack, no env — so the wording is
// unit-testable and reviewable in a diff.
//
// WHY THIS EXISTS
// ---------------
// Every failure path in this Worker said one of two things: ":x: Something went
// wrong on my end" or ":warning: I hit an internal error on that one". Both are
// dead ends. The person cannot tell whether the question was even read, whether
// anything was created, whether retrying is pointless or the obvious next move.
// So they either retype the whole question or give up, and neither tells us
// anything.
//
// The playbook's rule (§ error handling) is three parts, and all three are
// things the RELAY already knows at the point of the throw:
//
//   PROGRESS  — how far it got. The stage IS the progress: a context-load
//               failure means the question was never read; a delivery failure
//               means the answer exists and Slack refused it.
//   BLOCKER   — what stopped it, in the user's terms. Not the stack trace: the
//               category. Capacity is the one category worth naming outright,
//               because "try again in a minute" is correct for it and wrong for
//               everything else.
//   NEXT STEP — one concrete thing to do. Never "try again" alone; that is the
//               same dead end with more words.
//
// The one rule the wording holds to everywhere: SAY WHETHER ANYTHING CHANGED.
// A failure mid-turn is exactly when someone wonders whether a card got filed.
// Reads cannot change anything, and writes never execute without a ✅, so the
// honest answer is always "nothing was created or changed" — and it is worth
// the line every time.

/** Where in a turn the failure happened. Ordered by how far the turn got. */
export type FailureStage =
  /** Loading thread history / the pending proposal / the PRD. The question was
   *  never read, so nothing about it was even attempted. */
  | "context"
  /** The model call or the tool loop. Reads may have run; no write can have. */
  | "agent"
  /** The answer exists and Slack refused to take it. */
  | "delivery"
  /** Anywhere else — the backstop. Least is known here, so it promises least. */
  | "internal";

export interface FailureInput {
  stage: FailureStage;
  /** A 429 / quota / overloaded / 5xx class error. Changes the next step from
   *  "tell us" to "wait", which is the one case where waiting is right. */
  capacity?: boolean;
  /** Where to report it. Rendered as a channel mention when it looks like an
   *  id, otherwise verbatim. */
  alertChannel?: string;
}

const PROGRESS: Record<FailureStage, string> = {
  context: "I didn't get as far as reading your question — the lookup of this thread's history failed first.",
  agent: "I read your question and started working, but the run stopped partway.",
  delivery: "I finished the answer, and then Slack wouldn't accept the message.",
  internal: "I stopped partway through this one.",
};

const NEXT_STEP: Record<FailureStage, string> = {
  // Nothing was consumed, so a plain resend is genuinely the right move.
  context: "Send it again — this one usually clears on its own.",
  // A rerun costs a full turn, so give the cheaper option first: narrowing
  // often avoids whatever blew up (a huge read, a slow source).
  agent: "Ask again, and narrow it if you can — a tighter question takes a different path through the same sources.",
  // The answer existed. Asking for it shorter is the fix that actually works,
  // because the usual cause is a body Slack rejected.
  delivery: "Ask me for it again, or ask for the short version — the long one is what Slack choked on.",
  internal: "Try again — and if it happens twice, it's not you.",
};

/**
 * Build the user-facing failure message: progress, blocker, next step, and the
 * standing "nothing changed" reassurance.
 *
 * Deliberately NOT a stack trace and not an error code. The code goes to the
 * log where it is useful; here it would be noise the reader cannot act on.
 */
export function buildFailureMessage(input: FailureInput): string {
  const { stage, capacity } = input;
  const where = input.alertChannel ? ` in ${renderChannel(input.alertChannel)}` : "";

  // Capacity is a genuinely different failure and deserves its own shape: the
  // blocker is temporary and external, the next step is to wait, and telling
  // someone to "flag it" for a quota outage wastes their time and ours.
  if (capacity) {
    return [
      ":warning: I'm temporarily over capacity, so I couldn't finish that one.",
      `${PROGRESS[stage]} The model is rate-limited right now — that's on the provider, not on your question.`,
      "Nothing was created or changed. Give it a couple of minutes and ask again; I've already flagged the outage to the team.",
    ].join("\n");
  }

  return [
    `:x: ${PROGRESS[stage]}`,
    "Nothing was created or changed — reads can't change anything, and I never write without your :white_check_mark: first.",
    `*Next:* ${NEXT_STEP[stage]} If it repeats, say so${where} and someone will look at the logs.`,
  ].join("\n");
}

/** `C0ARJ2A3A69` → `<#C0ARJ2A3A69>`; anything else passes through so a plain
 *  "#uno-bot" in config still reads correctly. */
function renderChannel(channel: string): string {
  return /^[CGD][A-Z0-9]{6,}$/.test(channel) ? `<#${channel}>` : channel;
}
