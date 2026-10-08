// The review door — a proposal card's Review pop-up, opened and decided.
//
// Two interactions, one door. Review on the card opens a modal with the whole
// draft; Approve inside it is the Gate's fifth signal (`review`), resolved by
// the same `resolveSignal` as a reaction, the card's own buttons, a typed
// emoji and the model's call, so the confirmer set, standing confirmers, TTL,
// supersession and the one-winner claim are the Gate's and not this file's.
//
// OPEN BEFORE READING. Slack's `trigger_id` lives three seconds, and a cold
// Durable Object read can spend most of that. So the door opens a loading view
// first, with nothing read, and fills it with `views.update` once the Gate has
// looked at the card. A failed open stops there: there is no view to fill.
//
// A WIN IS A PRESS. What follows a won Approve — the gate note in the thread,
// the run under the working signal, the card edited in place — is the button
// door's own `applyPressVerdict`, so the two surfaces cannot drift apart. What
// differs is only where a non-win is answered: in the pop-up, not ephemerally.
//
// Takes named dependencies, as the button door does; `Env` is turned into
// `ReviewDoorDeps` once, in `slack/interactive.ts`. PURE by design: no `Env`,
// no Workers global, no fetch — so `tests/proposal-review.test.ts` drives it.
import type { ThreadState } from "../thread-state/index";
import type { Delivery } from "../turn/index";
import { lookAtProposal, resolveSignal, type GateRestage, type GateVerdict } from "../gate/index";
import { applyPressVerdict, type ButtonDoorTarget } from "./button-door";
import { renderGateNote } from "./gate-note";
import { closedView, draftView, loadingView, noticeView, type ReviewedCard } from "./review-view";

/** Slack's views methods, as the door needs them. */
export interface ReviewViews {
  /** `views.open`: the opened view's id, or null when Slack refused. */
  open(triggerId: string, view: Record<string, unknown>): Promise<string | null>;
  /** `views.update` on a view already open: whether Slack took it. */
  update(viewId: string, view: Record<string, unknown>): Promise<boolean>;
}

export interface ReviewDoorDeps {
  threadState: ThreadState;
  /** Gate's own `standingConfirmers`, handed through. */
  standingConfirmers?: readonly string[];
  views: ReviewViews;
  /** Where a win speaks — see `ButtonDoorDeps.delivery`. */
  delivery(target: ButtonDoorTarget): Delivery;
  /** The confirmed tool and its record — see `ButtonDoorDeps.applyVerdict`. */
  applyVerdict(verdict: GateVerdict): Promise<void>;
  /** The card, edited in place to its outcome (`chat.update`): a view has no
   *  `response_url` for the message it was opened from. */
  updateCard(channel: string, ts: string, text: string, note: string): Promise<void>;
  /** See `ButtonDoorDeps.restage`. */
  restage(restage: GateRestage, delivery: Delivery): Promise<void>;
}

/** Review, pressed on a card. */
export interface ReviewOpenRequest {
  triggerId: string;
  channel: string;
  /** The card the button sits on. */
  messageTs: string;
  userId: string;
}

/** A decision pressed inside the pop-up. */
export interface ReviewDecisionRequest {
  viewId: string;
  /** The card, as the view's `private_metadata` names it. */
  channel: string;
  messageTs: string;
  userId: string;
  decision: "confirm" | "cancel";
}

/** Open the pop-up on a card: loading first, then the draft or why there is
 *  none to decide. */
export async function runReviewOpen(request: ReviewOpenRequest, deps: ReviewDoorDeps): Promise<void> {
  const card: ReviewedCard = { channel: request.channel, ts: request.messageTs };
  const viewId = await deps.views.open(request.triggerId, loadingView(card));
  if (!viewId) {
    console.warn(`[review] views.open refused for ${request.channel}/${request.messageTs}`);
    return;
  }
  const look = await lookAtProposal(request.messageTs, request.userId, {
    threadState: deps.threadState,
    standingConfirmers: deps.standingConfirmers,
  });
  console.log(`[review] opened ${request.channel}/${request.messageTs} by=${request.userId} state=${look.state}`);
  const view =
    look.state === "live"
      ? draftView(card, look.proposal, { mayDecide: look.mayDecide, confirmers: look.confirmers })
      : closedView(card, look);
  await deps.views.update(viewId, view);
}

/** A decision in the pop-up: the Gate's `review` signal, applied as a press. */
export async function runReviewDecision(request: ReviewDecisionRequest, deps: ReviewDoorDeps): Promise<void> {
  const card: ReviewedCard = { channel: request.channel, ts: request.messageTs };
  const verdict = await resolveSignal(
    { kind: "review", messageTs: request.messageTs, decision: request.decision, userId: request.userId },
    { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers },
  );
  console.log(
    `[review] ${request.decision} on ${request.channel}/${request.messageTs} by=${request.userId} outcome=${verdict.outcome}`,
  );

  // Said in the pop-up before the run starts, so the person sees it register
  // at once rather than after a write that can take a while.
  if (verdict.outcome === "won") {
    await deps.views.update(request.viewId, noticeView(card, decidedLine(request.decision)));
  }
  await applyPressVerdict(
    { channel: request.channel, messageTs: request.messageTs, decision: request.decision, userId: request.userId },
    verdict,
    {
      delivery: deps.delivery,
      applyVerdict: deps.applyVerdict,
      restage: deps.restage,
      // A non-win is answered where the person is looking, which is the pop-up.
      replyEphemeral: async (text) => void (await deps.views.update(request.viewId, noticeView(card, text))),
      replaceCard: (text, note) => deps.updateCard(request.channel, request.messageTs, text, note),
    },
  );
  // A cut-off card speaks in the thread, and the pop-up points there.
  if (verdict.post?.note.kind === "cut-off") {
    await deps.views.update(request.viewId, noticeView(card, renderGateNote(verdict.post.note)));
  }
}

function decidedLine(decision: "confirm" | "cancel"): string {
  return decision === "confirm"
    ? "Approved. I'm running it now, and the outcome posts in the thread."
    : "Cancelled. Nothing will run.";
}
