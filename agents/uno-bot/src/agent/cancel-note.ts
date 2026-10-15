// The note a ⛔ leaves in the conversation, and the one question the turn asks
// of it: was THIS action just cancelled?
//
// A cancelled card is not re-proposed on the model's own say-so (`turn/turn.ts`,
// gate idempotency). But a card whose verb names a different target — a
// share-out's place, an intake's repo — is a different card, and a redirect
// ("post it here instead") has to get one. So the note records that target,
// and only the same tool on the same target is held back. A note written
// before targets were recorded holds back the tool, as it always did.
//
// And "just" has to be true. In a DM every top-level message is one
// conversation, so the last few turns can be hours old: live on r631 a cancel
// from 22:53 bounced the first ask of the next morning as "a moment ago". The
// note carries when it was recorded (`HistoryTurn.at`), and only a cancel
// inside `RECENT_CANCEL_MS` holds anything back. A note with no time predates
// the stamp, so it is hours old by now and holds nothing back.

import { shareoutChannelRef } from "../tools/share-out-render";

/** How long a ⛔ holds the same card back. A cancel and the model's own
 *  re-proposal land within one exchange, minutes apart; half an hour covers a
 *  slow reply, and stops well short of a card's own hour-long life. */
export const RECENT_CANCEL_MS = 30 * 60_000;

const NOTE_RE = /\(Cancelled the proposed ([a-z_]+)(?: for ([^—)]+?))? — /;

/** The target a tool's card names on its verb, as it compares: a share-out's
 *  place (a named channel by its id or lower-case name), an intake's repo by
 *  name. `null` for a tool whose card names none. */
function targetOf(toolName: string, input: Record<string, unknown>): string | null {
  if (toolName === "shareout_post") {
    if (input.place === "channel") {
      const ref = shareoutChannelRef(input.channel);
      return `place channel ${ref ? ("id" in ref ? ref.id : `#${ref.name}`) : "unnamed"}`;
    }
    return `place ${input.place === "here" ? "here" : "feedback_channel"}`;
  }
  if (toolName === "github_issue_create") {
    const repo = typeof input.repo === "string" ? input.repo.trim().toLowerCase().split("/").pop() : "";
    return `repo ${repo || "default"}`;
  }
  return null;
}

/** What the conversation remembers of a ⛔: the tool and, when its card named
 *  one, the target. `context-state.ts` reads the tool back from the same note. */
export function cancelNote(toolName: string, input: Record<string, unknown>): string {
  const target = targetOf(toolName, input);
  return `(Cancelled the proposed ${toolName}${target ? ` for ${target}` : ""} — nothing was done.)`;
}

/** Whether `content` is a ⛔ note for this tool on this target. */
export function cancelledSame(content: string, toolName: string, input: Record<string, unknown>): boolean {
  const note = NOTE_RE.exec(content);
  if (!note || note[1] !== toolName) return false;
  return note[2] === undefined || note[2] === targetOf(toolName, input);
}

/** Whether `turn` is a ⛔ note for this tool on this target, recorded within
 *  `RECENT_CANCEL_MS` of `now`. */
export function cancelledRecently(
  turn: { role: string; content: string; at?: number },
  toolName: string,
  input: Record<string, unknown>,
  now: number,
): boolean {
  if (turn.role !== "assistant" || turn.at === undefined || now - turn.at > RECENT_CANCEL_MS) return false;
  return cancelledSame(turn.content, toolName, input);
}
