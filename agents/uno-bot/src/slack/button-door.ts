// The button door — a ✅ / ⛔ on a proposal card, resolved.
//
// Gate decides; a door applies. This one builds the button signal, posts the
// verdict's text and runs the confirmed tool, inside the working signal Turn
// owns — because a door that resolves a card runs the tool for as long as any
// turn would, and never goes through Turn.
//
// IT TAKES NAMED DEPENDENCIES, the way the reaction door does
// (`gate/reaction-door.ts`, #592): the Delivery port, ThreadState, the
// confirmed tool, the ephemeral reply and the card re-render. `Env` never
// enters — it is turned into `ButtonDoorDeps` once, in `slack/interactive.ts`.
// What is left there is the envelope: the Slack payload, the Slack client, and
// the 58-field binding record.
//
// So the whole door is exercised in `tests/confirmation-paths.test.ts` on the
// recording Delivery and the in-memory ThreadState. It used to be READ there
// instead — a `readFileSync` and a regex over `interactive.ts` — because a
// door whose one argument was an `Env` was a door a Node test had nothing to
// call (#654).
//
// PURE by design: no `Env`, no Workers global, no fetch — which is what lets
// the Node suite DRIVE it rather than read it.

import type { ThreadState } from "../thread-state/index";
import { whichQuestionOf, withWorkingSignal, type Delivery } from "../turn/index";
import { cardOutcomeOf, otherCardWaits, resolveSignal, type GateRestage, type GateVerdict } from "../gate/index";
import { decidedCardLine, renderGateNote } from "./gate-note";
// The decided card is built beside `notedCardBlocks`, where the Slack
// adapter's `closeCard` builds it too: one builder for every door.
import { decidedCard, type CardMessage } from "./proposal-render";
import type { ChosenAs, ReportItemState, WhichQuestion } from "../thread-state/index";

export type { CardMessage };
import type { OperationOutcome } from "../gate/run-batch";
import { failureReason, settleItem, type ReportStore } from "./decision-cards";

/** One button press, in the facts the envelope already has. */
export interface ButtonRequest {
  channel: string;
  /** The card the button sits on. */
  messageTs: string;
  decision: "confirm" | "cancel";
  /** Who pressed. */
  userId: string;
  /** The card's own answer it was decided by, from the Review pop-up
   *  (`PendingProposal.choices`): the decided item names it. */
  as?: ChosenAs;
  /** The "which one?" question the press was made on, by its ts
   *  (`which-card.ts`): when a win drops the card from that question, the
   *  question is handed back for the caller to redraw where it was pressed,
   *  instead of being redrawn here. */
  fromQuestion?: string;
}

/** Where the door speaks: the verdict's own reply thread, against the person's
 *  original request. */
export interface ButtonDoorTarget {
  channel: string;
  replyTs: string;
  userMsgTs: string;
  userId: string;
}

export interface ButtonDoorDeps {
  /** Per-thread memory — where the staged card is, and the claim that is the
   *  lock on it. */
  threadState: ThreadState;

  /** Who may resolve any card with a confirmer set — Gate's own
   *  `standingConfirmers`, handed through. */
  standingConfirmers?: readonly string[];

  /**
   * Everything the person sees. A factory rather than an instance because
   * where the door speaks is the VERDICT's answer (`post.replyTs`), which is
   * not known until the claim is settled.
   */
  delivery(target: ButtonDoorTarget): Delivery;

  /**
   * Act on a verdict: the confirmed side-effect tool, the acknowledging
   * reaction, the record of what was done.
   *
   * EVERY verdict that has something to post is handed here on a WIN — a press
   * that did not win is answered ephemerally instead, and never reaches this.
   * Answers with each operation's outcome when the run reports them: an item
   * of a decision report says on its card whether its write went through.
   */
  applyVerdict(verdict: GateVerdict): Promise<readonly OperationOutcome[] | void>;

  /** Where a decision report's items stand (`decision-cards.ts`): an item's
   *  decision is recorded there and its message drawn again from it. */
  reports?: ReportStore;

  /** The clock an item's decision is stamped with. Absent, `Date.now`. */
  now?(): number;

  /** A press that did not win is answered where the person is looking. */
  replyEphemeral(text: string): Promise<void>;

  /** After a win, the card is edited to its outcome (`decidedCard`). */
  replaceCard(message: CardMessage): Promise<void>;

  /** Stage a fresh card for what a cut-off run never finished — see
   *  `ReactionDoorDeps.restage`. */
  restage(restage: GateRestage, delivery: Delivery): Promise<void>;
}

/**
 * Slack's proposal-card ✅ / ⛔, pressed.
 *
 * A press that did not win is answered ephemerally via the payload's
 * `response_url`. A win speaks in the thread, like every other door, and
 * then the card itself is replaced so a second press is not invited.
 *
 * @param request the press, as the envelope already parsed it
 * @param deps named door dependencies — never `Env`
 */
export async function runButtonDoor(
  request: ButtonRequest,
  deps: ButtonDoorDeps,
): Promise<WhichQuestion | null> {
  const verdict = await resolveSignal(
    {
      kind: "button",
      messageTs: request.messageTs,
      decision: request.decision,
      userId: request.userId,
    },
    { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers },
  );
  console.log(
    `[interactive] ${request.decision} button on ${request.channel}/${request.messageTs} by=${request.userId} outcome=${verdict.outcome}`,
  );
  return applyPressVerdict(request, verdict, deps);
}

/**
 * A press's verdict, applied: the thread hears a win, the run goes ahead and
 * the card loses its buttons; anything else is answered where the person is
 * looking (`replyEphemeral`).
 *
 * Shared with the Review pop-up's Approve (`review-door.ts`), which is the
 * same press made from a different surface: one path applies both, so the two
 * cannot drift apart on what a win posts or what the card is left saying.
 *
 * A won card is dropped from the open "which one?" question that lists it,
 * after the card is closed (`whichQuestionOf`), and that question redrawn —
 * unless it is the one the press was made on (`fromQuestion`), which comes
 * back for the caller to redraw. Null for everything else.
 */
export async function applyPressVerdict(
  request: ButtonRequest,
  verdict: GateVerdict,
  deps: Omit<ButtonDoorDeps, "threadState" | "standingConfirmers"> & {
    /** The thread's live cards, read after a win for whether another still
     *  waits (`otherCardWaits`), and the open "which one?" question the card
     *  decided is dropped from (`dropFromWhichQuestion`). Absent, the thread
     *  settles idle and no question is redrawn. */
    threadState?: Pick<ThreadState, "getProposalsByThread" | "decideInWhichQuestion">;
    /** The decided card's words and outcome line, changed on the way: the
     *  pop-up's approval with edits says what was approved, and by whom, and
     *  `edited` says the draft's values changed (`decidedCard`). */
    reword?(text: string, note: string): { text: string; note: string; edited?: boolean };
  },
): Promise<WhichQuestion | null> {
  if (verdict.post?.note.kind === "cut-off" && verdict.proposal) {
    await speakCutOff(request, verdict, verdict.proposal, verdict.post, deps);
    return null;
  }

  if (verdict.outcome !== "won") {
    // Expired, already resolved, or a press that lost the race. Never silence.
    // A note about the card's own state — aged out, replaced, waiting on
    // someone else — goes on the card, where the person pressed; anything
    // else is answered aside, and so is an edit Slack would not take.
    const post = verdict.post;
    if (!post) return null;
    if (post.card) {
      const said = await deps
        .delivery({
          channel: request.channel,
          replyTs: post.replyTs,
          userMsgTs: verdict.proposal?.userMsgTs ?? request.messageTs,
          userId: request.userId,
        })
        .postGateNote(post.note, post.card);
      if (said.ok) return null;
    }
    await deps.replyEphemeral(renderGateNote(post.note));
    return null;
  }

  const pending = verdict.proposal;
  const post = verdict.post;
  if (!pending || !post) return null; // a won verdict always carries both
  const door = deps.delivery({
    channel: pending.channel,
    replyTs: post.replyTs,
    userMsgTs: pending.userMsgTs,
    userId: request.userId,
  });
  // The press runs the tool, and the button is not a Turn — so the working
  // signal is raised and settled here, through the same pairing Turn uses.
  let outcomes: readonly OperationOutcome[] | undefined;
  await withWorkingSignal(
    door,
    async (delivery) => {
      await delivery.setWorking({ status: "is working on that…" });
      await delivery.postGateNote(post.note);
      const ran = await deps.applyVerdict(verdict);
      outcomes = Array.isArray(ran) ? ran : undefined;
      return deps.threadState ? otherCardWaits(pending, deps.threadState) : false;
    },
    // What the thread needs afterwards, stated rather than defaulted: this
    // door RESOLVED the card, so the thread waits on nobody — unless another
    // card in it still does (#1319). The argument is required precisely so a
    // door cannot inherit an answer it never thought about (#575).
    (moreLive) => (moreLive ? "waiting-on-person" : "idle"),
  );

  // A stated card's ⛔ is a decision its footer described, not a request to
  // stage it again, so it closes in the card's own words.
  // The pop-up's Reject names itself, and its reason, on the card it closed.
  const rejected = post.note.kind === "resolved" ? post.note.rejected : undefined;
  // One item of a decision report: its state goes on the report's record and
  // the whole message is drawn again from it (`decision-cards.ts`), so the
  // other items keep theirs. Approved says whether the write went through.
  if (pending.item) {
    if (!deps.reports) return null;
    const at = (deps.now ?? Date.now)();
    const failed = outcomes?.find((o) => !o.ok);
    const as = request.as ? { as: request.as } : {};
    const done = reportDone(outcomes);
    const state: ReportItemState =
      request.decision === "cancel"
        ? { kind: "rejected", by: request.userId, ...(rejected?.reason ? { reason: rejected.reason } : {}), ...as }
        : failed
          ? { kind: "failed", by: request.userId, at, reason: failureReason(failed.message), ...as }
          : { kind: "approved", by: request.userId, at, ...as, ...(done ? { done } : {}) };
    const message = await settleItem(deps.reports, pending.item, state, at);
    if (message) await deps.replaceCard(message);
    return null;
  }
  // The outcome every other door closes a card with (`cardOutcomeOf`), and
  // the pop-up's Reject with its reason, which only a press here carries.
  const note = decidedCardLine({ ...cardOutcomeOf(verdict)!, ...(rejected ? { rejected } : {}) });
  const words: { text: string; note: string; edited?: boolean } = deps.reword
    ? deps.reword(pending.proposalText, note)
    : { text: pending.proposalText, note };
  await deps.replaceCard(decidedCard(pending, words.note, words.text, { edited: words.edited === true }));
  // And a "which one?" that lists it stops offering it, after the card.
  const question = deps.threadState ? await whichQuestionOf(pending.proposalTs, deps.threadState) : null;
  if (!question) return null;
  if (question.questionTs === request.fromQuestion) return question;
  await door.redrawWhichCard(question);
  return null;
}

/** A single write may return the actual destination for its report receipt.
 * Other writes keep their draft's receipt; failures never use this field. */
function reportDone(outcomes: readonly OperationOutcome[] | undefined): string | undefined {
  if (outcomes?.length !== 1 || !outcomes[0]!.ok) return;
  try {
    const result = JSON.parse(outcomes[0]!.result) as { report_done?: unknown };
    return typeof result.report_done === "string" ? result.report_done.trim() || undefined : undefined;
  } catch {
    return;
  }
}

/**
 * A press on a card whose approved run never reported back.
 *
 * Not ephemeral, unlike every other press that did not win: what may or may
 * not have run is the thread's business, and the requester may not be the one
 * who pressed. The note goes in the thread, the unfinished operations go on a
 * fresh card below it, and the stuck card loses its buttons — they are what
 * led here, and pressing them again can only land on this same answer.
 */
async function speakCutOff(
  request: ButtonRequest,
  verdict: GateVerdict,
  pending: NonNullable<GateVerdict["proposal"]>,
  post: NonNullable<GateVerdict["post"]>,
  deps: Omit<ButtonDoorDeps, "threadState" | "standingConfirmers">,
): Promise<void> {
  const door = deps.delivery({
    channel: pending.channel,
    replyTs: post.replyTs,
    userMsgTs: pending.userMsgTs,
    userId: request.userId,
  });
  await withWorkingSignal(
    door,
    async (delivery) => {
      // Raised as a win raises it: building the fresh card reads the repo or
      // workflow it lands on, and that can take a moment.
      await delivery.setWorking({ status: "is working on that…" });
      await delivery.postGateNote(post.note);
      if (verdict.restage) await deps.restage(verdict.restage, delivery);
    },
    () => (verdict.restage ? "waiting-on-person" : "idle"),
  );
  await deps.replaceCard(
    decidedCard(pending, ":warning: This run was cut off before it reported back — see the thread for what finished."),
  );
}
