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
//
// And "that" has to be the same matter. The same DM is why: live on r675 a PRD
// card rejected in one thread bounced an unrelated PRD asked minutes later as a
// new top-level message, because both read the one `"dm"` history. A card
// belongs to its reply thread, as the card store already has it, so the note
// carries that thread (`HistoryTurn.cardThread`) and holds back a card staged
// in the same one, or the very same card staged from another.

import { channelRefText, shareoutChannelRef } from "../tools/share-out-render";
import {
  canonicalJson,
  proposalOperations,
  proposalReplyThread,
  type HistoryTurn,
  type PendingProposal,
  type ProposalOperation,
  type ThreadRef,
} from "../thread-state/index";

/** How long a ⛔ holds the same card back. A cancel and the model's own
 *  re-proposal land within one exchange, minutes apart; half an hour covers a
 *  slow reply, and stops well short of a card's own life of 24 weekday hours
 *  (`card-expiry.ts`). */
export const RECENT_CANCEL_MS = 30 * 60_000;

// Either spelling: the note is written "Canceled" now, and a thread's stored
// history still holds notes written "Cancelled".
const NOTE_RE = /\(Cancell?ed the proposed ([a-z_]+)(?: for ([^—)]+?))? — /;

/** The target a tool's card names on its verb, as it compares: a share-out's
 *  place (a named channel by its id or lower-case name), an intake's repo by
 *  name. `null` for a tool whose card names none. */
function targetOf(toolName: string, input: Record<string, unknown>): string | null {
  if (toolName === "shareout_post") {
    if (input.place === "channel") {
      const ref = shareoutChannelRef(input.channel);
      return `place channel ${ref ? channelRefText(ref) : "unnamed"}`;
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
  return `(Canceled the proposed ${toolName}${target ? ` for ${target}` : ""} — nothing was done.)`;
}

/** Whether `content` is a ⛔ note for this tool on this target. */
export function cancelledSame(content: string, toolName: string, input: Record<string, unknown>): boolean {
  const note = NOTE_RE.exec(content);
  if (!note || note[1] !== toolName) return false;
  return note[2] === undefined || note[2] === targetOf(toolName, input);
}

/** A batch as one short, stable string: every operation's tool and input, keys
 *  in any order reading the same (`canonicalJson`), through FNV-1a — the hash
 *  `gemini/cache.ts` keys its cache with. It only has to tell one card from
 *  another; a collision costs one bounce the person can answer. */
export function proposalFingerprint(operations: readonly ProposalOperation[]): string {
  const text = canonicalJson(operations.map(({ toolName, input }) => ({ toolName, input })));
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Whether a ⛔ note is about another thread's card than `cardThread`. A note
 *  written before notes named their card's thread is about none in
 *  particular, and so about this one, as it always was. The model's half,
 *  `context-state.ts` § `withStaleCancelsSettled`, makes the same comparison and
 *  must agree with this one. */
function canceledElsewhere(turn: { cardThread?: string }, cardThread: string): boolean {
  return turn.cardThread !== undefined && turn.cardThread !== cardThread;
}

/**
 * Whether `turn` is a ⛔ note that holds `proposed` back: recorded within
 * `RECENT_CANCEL_MS` of `now`, and about the same matter.
 *
 * In the card's own thread (`cardThread`, the turn's reply thread) the matter
 * is the tool on its target, as it always was. From another thread it is the
 * same proposal only: a DM line typed in the composer opens a thread of its
 * own, so the model re-staging the canceled card from there, byte for byte, is
 * still the re-proposal this guard exists for, while any other card is a new
 * matter (`HistoryTurn.cardFingerprint`). A note with no fingerprint holds
 * nothing back from another thread.
 */
export function cancelledRecently(
  turn: Pick<HistoryTurn, "role" | "content" | "at" | "cardThread" | "cardFingerprint">,
  proposed: { toolName: string; input: Record<string, unknown>; operations: readonly ProposalOperation[] },
  now: number,
  cardThread: string,
): boolean {
  if (turn.role !== "assistant" || turn.at === undefined || now - turn.at > RECENT_CANCEL_MS) return false;
  if (!cancelledSame(turn.content, proposed.toolName, proposed.input)) return false;
  if (!canceledElsewhere(turn, cardThread)) return true;
  return turn.cardFingerprint !== undefined && turn.cardFingerprint === proposalFingerprint(proposed.operations);
}

/** Where a ⛔ is remembered (`cancelNoteWrites`). */
export interface CancelNoteWrite {
  /** The note, stamped with when, the card's reply thread and its fingerprint. */
  turn: HistoryTurn;
  /** The conversation the card was staged from. */
  conversation: ThreadRef;
  /** The card's own thread, when that is a conversation of its own; null
   *  when it is the same one. */
  cardThread: ThreadRef | null;
}

/**
 * Where a ⛔ is remembered, and what.
 *
 * The conversation the card was staged from always gets the note — that
 * history is what the next turn there reads. In a channel that is the card's
 * thread too, and one write is the whole of it. In a DM it is not: a card
 * staged from a top-level line is kept under the shared `"dm"` conversation
 * but lives in a thread of its own, and a reply typed in that thread is a
 * conversation of its own (`slack/events.ts` § `conversationTs`). So the thread
 * gets the note as well, or the one re-ask the guard exists for would never
 * find it.
 *
 * @param pending - The card that was ⛔'d.
 * @param at - When, in epoch ms.
 */
export function cancelNoteWrites(
  pending: Pick<PendingProposal, "operations" | "toolName" | "input" | "channel" | "threadTs" | "replyTs">,
  at: number,
): CancelNoteWrite {
  const cardThread = proposalReplyThread(pending);
  return {
    turn: {
      role: "assistant",
      content: cancelNote(pending.toolName, pending.input),
      at,
      cardThread,
      cardFingerprint: proposalFingerprint(proposalOperations(pending)),
    },
    conversation: { channel: pending.channel, thread: pending.threadTs },
    cardThread: cardThread === pending.threadTs ? null : { channel: pending.channel, thread: cardThread },
  };
}
