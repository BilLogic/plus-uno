// What a failure MESSAGE says, and its blocks. Pure — no Slack call, no env —
// so the wording is unit-testable and reviewable in a diff.
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
//   NEXT STEP — one concrete thing to do. "Try again" comes with what makes
//               the retry different, never alone.
//
// The shape: the progress as one bold line, the next step under
// it, what did not change as a ⚠️ line, and a Try again button that asks the
// question again as the person's own message (`slack/try-again.ts`).
//
// The one rule the wording holds to everywhere: SAY WHETHER ANYTHING CHANGED.
// A failure mid-turn is exactly when someone wonders whether a card got filed.
// Reads cannot change anything, and writes never execute without a ✅, so the
// honest answer is always "nothing was created or changed" — and it is worth
// the line every time.

import { signed } from "../turn/warning-line";

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
  context: "I didn't get as far as reading your question.",
  agent: "I read your question and started working, but the run stopped partway.",
  delivery: "I finished the answer, and then Slack wouldn't accept the message.",
  internal: "I stopped partway through this one.",
};

const NEXT_STEP: Record<FailureStage, string> = {
  // Nothing was consumed, so a plain resend is genuinely the right move.
  context: "Try again; this one usually clears on its own.",
  // A rerun costs a full turn, so give the cheaper option with it: narrowing
  // often avoids whatever blew up (a huge read, a slow source).
  agent: "Try again, and narrow the question if you can.",
  // The answer existed. Asking for it shorter is the fix that actually works,
  // because the usual cause is a body Slack rejected.
  delivery: "Try again, or ask for the short version.",
  internal: "Try again.",
};

/** What a failure says it left alone. Every failure has the same answer:
 *  reads change nothing, and a write never runs before its card is approved. */
export const NOTHING_CHANGED = "Nothing was created or changed.";

/** The Try again button's action id; `slack/interactive.ts` routes it to
 *  `slack/try-again.ts`. */
export const TRY_AGAIN_ACTION_ID = "uno_try_again";

/** The longest value Slack takes on a button. A question longer than this is
 *  not offered again: the button would be refused, and the failure with it. */
export const MAX_BUTTON_VALUE = 2000;

/** A failure as Slack posts it: the notification copy and the blocks. */
export interface FailureMessage {
  text: string;
  blocks: Array<Record<string, unknown>>;
}

/**
 * The failure message: one bold line saying how far it got, one next step, a
 * ⚠️ line saying nothing changed, and Try again when the question can be
 * asked again.
 *
 * Deliberately NOT a stack trace and not an error code. The code goes to the
 * log where it is useful; here it would be noise the reader cannot act on.
 *
 * @param input.ask - The question, when it can be asked again. Offered as the
 *   Try again button's value, so only when it fits one.
 */
export function failureMessage(input: FailureInput & { ask?: string }): FailureMessage {
  const { stage, capacity } = input;
  const where = input.alertChannel ? ` in ${renderChannel(input.alertChannel)}` : "";

  // Capacity is a genuinely different failure and deserves its own words: the
  // blocker is temporary and external, the next step is to wait, and telling
  // someone to "flag it" for a quota outage wastes their time and ours.
  const lead = capacity ? "I'm over capacity right now, so I couldn't finish that one." : PROGRESS[stage];
  const next = capacity
    ? "Give it a couple of minutes, then try again; the team already knows."
    : `${NEXT_STEP[stage]} If it happens twice, say so${where} and someone will look at the logs.`;
  const warning = signed(NOTHING_CHANGED);

  const head = `:x: *${lead}*\n${next}`;
  const ask = input.ask?.trim() ? input.ask : undefined;
  const retry = ask && ask.length <= MAX_BUTTON_VALUE ? ask : undefined;
  return {
    text: `${head}\n${warning}`,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: head } },
      { type: "context", elements: [{ type: "mrkdwn", text: warning }] },
      ...(retry
        ? [
            {
              type: "actions",
              block_id: "uno_failure_actions",
              elements: [
                {
                  type: "button",
                  action_id: TRY_AGAIN_ACTION_ID,
                  text: { type: "plain_text", text: "Try again" },
                  value: retry,
                },
              ],
            },
          ]
        : []),
    ],
  };
}

/** The failure's notification copy alone — what a caller with no blocks to
 *  post, and the copy guard, read. */
export function buildFailureMessage(input: FailureInput): string {
  return failureMessage(input).text;
}

/** `C0ARJ2A3A69` → `<#C0ARJ2A3A69>`; anything else passes through so a plain
 *  "#uno-bot" in config still reads correctly. */
function renderChannel(channel: string): string {
  return /^[CGD][A-Z0-9]{6,}$/.test(channel) ? `<#${channel}>` : channel;
}
