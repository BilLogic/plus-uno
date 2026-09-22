// The look nobody made — a cut-off run told about because the ThreadState
// alarm found it, not because a person came back to it.
//
// A press or reaction on the stuck card, or the next turn in its thread, is
// how a requester hears that an approved run never reported back. When none
// of those comes, the alarm finds the record (`findCutOffExecutions`) and the
// Worker hands its ts here. From here it is the path a look takes, not a copy
// of it: the same take (`takeCutOffExecution`, the one fence two looks share),
// the same verdict (`cutOffVerdict`), the same note, and the same re-staged
// card, built by Turn through the door's `restage` dependency. Nothing is ever
// re-run: the card waits for its own ✅.
//
// NAMED DEPENDENCIES, as the doors take them; `Env` is turned into these once,
// in `slack/cut-off-sweep.ts`. PURE by design — no `Env`, no Workers global —
// so the Node suite drives it on the recording Delivery.

import type { ThreadState } from "../thread-state/index";
import type { Delivery } from "../turn/index";
import { cutOffVerdict, type GateRestage } from "./gate";
import type { ReactionDoorTarget } from "./reaction-door";

export interface CutOffSweepDeps {
  threadState: ThreadState;

  /** Where the note goes: the card's own reply thread. The requester is the
   *  one addressed — nobody else is looking. */
  delivery(target: ReactionDoorTarget): Delivery;

  /** Stage a fresh card for what never came back — the doors' own
   *  dependency (`ReactionDoorDeps.restage`). */
  restage(restage: GateRestage, delivery: Delivery): Promise<void>;
}

/**
 * What one pass came to.
 *
 *   "told"     — the note posted (and the card, when there was anything left).
 *   "taken"    — a look got there first, the run ended, or it is not cut off
 *                after all: nothing to say, and nothing said.
 *   "released" — the note did not post, so the take was undone. The alarm
 *                comes back for it, and a look in the meantime can take it.
 */
export type CutOffSweepOutcome = "told" | "taken" | "released";

export async function tellCutOffRun(
  proposalTs: string,
  deps: CutOffSweepDeps,
): Promise<CutOffSweepOutcome> {
  const execution = await deps.threadState.takeCutOffExecution(proposalTs);
  if (!execution) return "taken";

  const verdict = cutOffVerdict(execution, "confirm");
  const proposal = execution.proposal;
  const post = verdict.post!;
  const delivery = deps.delivery({
    channel: proposal.channel,
    replyTs: post.replyTs,
    userMsgTs: proposal.userMsgTs,
    userId: proposal.requesterUserId,
  });

  const said = await delivery.postGateNote(post.note).catch(() => null);
  if (!said?.ok) {
    // Nobody was told, so nobody may be left untold: undo the take. A card
    // posted after a note that never landed would read as one out of nowhere.
    console.error(`[gate] cut-off note for ${proposalTs} did not post; released for another look`);
    await deps.threadState.releaseCutOffExecution(proposalTs);
    return "released";
  }
  // Once the note is up, this is one attempt, as it is for a look: a card that
  // fails to stage says so itself (`restageExecution`).
  if (verdict.restage) await deps.restage(verdict.restage, delivery);
  return "told";
}
