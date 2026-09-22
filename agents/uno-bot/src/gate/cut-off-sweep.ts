// The look nobody made — a cut-off run told about because the ThreadState
// alarm found it, not because a person came back to it.
//
// A press or reaction on the stuck card, or the next turn in its thread, is
// how a requester hears that an approved run never reported back. When none
// of those comes, the alarm finds the record (`findCutOffExecutions`) and the
// Worker hands its ts here. From here it is the path a look takes, not a copy
// of it: the same take (`takeCutOffExecution`, the one fence two looks share),
// the same verdict (`cutOffVerdict`), the same note, and the same re-staged
// card, built by Turn through the door's `restage` dependency, inside the same
// working signal. Nothing is ever re-run: the card waits for its own ✅.
//
// NAMED DEPENDENCIES, as the doors take them; `Env` is turned into these once,
// in `slack/cut-off-sweep.ts`. PURE by design — no `Env`, no Workers global —
// so the Node suite drives it on the recording Delivery.

import type { ThreadState } from "../thread-state/index";
import { withWorkingSignal, type Delivery } from "../turn/index";
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
 *   "owed"     — the note did not post. The record stays taken — the fence
 *                never re-opens — and the alarm's next pass tells it again.
 *   "given-up" — the note failed its last attempt (`CUT_OFF_NOTE_ATTEMPTS`).
 */
export type CutOffSweepOutcome = "told" | "taken" | "owed" | "given-up";

export async function tellCutOffRun(
  proposalTs: string,
  deps: CutOffSweepDeps,
): Promise<CutOffSweepOutcome> {
  const execution = await deps.threadState.takeCutOffExecution(proposalTs);
  if (!execution) return "taken";

  const verdict = cutOffVerdict(execution, "confirm");
  const proposal = execution.proposal;
  const post = verdict.post!;
  // Nobody asked, so the requester is pinged — in a channel thread, where the
  // note is otherwise one line among many. A DM is already theirs.
  const note =
    post.note.kind === "cut-off" && !proposal.channel.startsWith("D")
      ? { ...post.note, mention: proposal.requesterUserId }
      : post.note;
  const door = deps.delivery({
    channel: proposal.channel,
    replyTs: post.replyTs,
    userMsgTs: proposal.userMsgTs,
    userId: proposal.requesterUserId,
  });

  return withWorkingSignal(
    door,
    async (delivery): Promise<CutOffSweepOutcome> => {
      // Raised as the looks raise it: building the fresh card reads the repo
      // or workflow it lands on.
      await delivery.setWorking({ status: "is working on that…" });
      const said = await delivery.postGateNote(note).catch(() => null);
      const posted = !!said?.ok;
      // A failed note is tried again from the record, never re-opened: undoing
      // the take would let a run that is only slow resume the very work the
      // card is about to offer. Each attempt can land a duplicate — Slack may
      // accept a post the adapter then reads as failed (`postNote` maps a
      // throw to `ok: false`) — so the attempt cap is also the bound on those.
      const report = await deps.threadState.reportCutOffNote(proposalTs, posted);
      if (!posted) {
        if (report === "given-up") {
          console.error(`[gate] cut-off note for ${proposalTs} failed its last attempt; giving up`);
          return "given-up";
        }
        console.warn(`[gate] cut-off note for ${proposalTs} did not post; the alarm will try again`);
        return "owed";
      }
      // Once the note is up, this is one attempt, as it is for a look: a card
      // that fails to stage says so itself (`restageExecution`).
      if (verdict.restage) await deps.restage(verdict.restage, delivery);
      return "told";
    },
    (outcome) => (outcome === "told" && verdict.restage ? "waiting-on-person" : "idle"),
  );
}
