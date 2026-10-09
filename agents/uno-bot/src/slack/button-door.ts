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
import { withWorkingSignal, type Delivery } from "../turn/index";
import { resolveSignal, type GateRestage, type GateVerdict } from "../gate/index";
import { renderGateNote, statedCancelledNote } from "./gate-note";
import { escapeSlackText } from "./mrkdwn";
import { notedCardBlocks, proposalCardBlocks } from "./proposal-render";
import { statedCancelOf, type ChosenAs, type PendingProposal, type ReportItemState } from "../thread-state/index";
import type { OperationOutcome } from "../gate/run-batch";
import { failureReason, settleItem, type ReportStore } from "./decision-cards";

/** A card's message as it is edited: the fallback copy, and the blocks. */
export interface CardMessage {
  text: string;
  blocks: unknown[];
}

/**
 * A decided card, as its message is edited: the card as posted — its own
 * blocks when it had any, its text otherwise — with the outcome as its last
 * line and View where it had a button (`notedCardBlocks`), and the outcome
 * in the fallback copy too.
 *
 * @param pending - The card's record
 * @param note - The outcome, mrkdwn
 * @param text - The card's words, when they changed on the way: an approval
 *   with edits says what was approved
 * @param opts.edited - The decision changed the draft's values. Own blocks
 *   show the values they were posted with, so an edited card — or one whose
 *   words changed — is re-rendered from its words instead: a carousel left
 *   showing the draft's values would contradict the edit line beneath it.
 * @param opts.button - View once decided; Review on a card still live
 */
export function decidedCard(
  pending: Pick<PendingProposal, "proposalText" | "proposalBlocks">,
  note: string,
  text: string = pending.proposalText,
  opts: { edited?: boolean; button?: "Review" | "View" } = {},
): CardMessage {
  const button = opts.button ?? "View";
  const stale = opts.edited || text !== pending.proposalText;
  const own = pending.proposalBlocks && !stale ? pending.proposalBlocks : undefined;
  return {
    text: `${text}\n${note}`,
    blocks: notedCardBlocks({ text, ...(own ? { blocks: own } : {}) }, note, button),
  };
}

/**
 * A card back in its live form, as it was posted: its words, its own blocks
 * or its text re-rendered, and Review — no note. What a card sent back with
 * Needs changes returns to when no revision replaces it.
 *
 * @param pending - The card's record
 */
export function liveCard(pending: Pick<PendingProposal, "proposalText" | "proposalBlocks">): CardMessage {
  return { text: pending.proposalText, blocks: pending.proposalBlocks ?? proposalCardBlocks(pending.proposalText) };
}

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
): Promise<void> {
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
  await applyPressVerdict(request, verdict, deps);
}

/**
 * A press's verdict, applied: the thread hears a win, the run goes ahead and
 * the card loses its buttons; anything else is answered where the person is
 * looking (`replyEphemeral`).
 *
 * Shared with the Review pop-up's Approve (`review-door.ts`), which is the
 * same press made from a different surface: one path applies both, so the two
 * cannot drift apart on what a win posts or what the card is left saying.
 */
export async function applyPressVerdict(
  request: ButtonRequest,
  verdict: GateVerdict,
  deps: Omit<ButtonDoorDeps, "threadState" | "standingConfirmers"> & {
    /** The decided card's words and outcome line, changed on the way: the
     *  pop-up's approval with edits says what was approved, and by whom, and
     *  `edited` says the draft's values changed (`decidedCard`). */
    reword?(text: string, note: string): { text: string; note: string; edited?: boolean };
  },
): Promise<void> {
  if (verdict.post?.note.kind === "cut-off" && verdict.proposal) {
    await speakCutOff(request, verdict, verdict.proposal, verdict.post, deps);
    return;
  }

  if (verdict.outcome !== "won") {
    // Expired, already resolved, or a press that lost the race. Never silence.
    // A note about the card's own state — aged out, replaced, waiting on
    // someone else — goes on the card, where the person pressed; anything
    // else is answered aside, and so is an edit Slack would not take.
    const post = verdict.post;
    if (!post) return;
    if (post.card) {
      const said = await deps
        .delivery({
          channel: request.channel,
          replyTs: post.replyTs,
          userMsgTs: verdict.proposal?.userMsgTs ?? request.messageTs,
          userId: request.userId,
        })
        .postGateNote(post.note, post.card);
      if (said.ok) return;
    }
    await deps.replyEphemeral(renderGateNote(post.note));
    return;
  }

  const pending = verdict.proposal;
  const post = verdict.post;
  if (!pending || !post) return; // a won verdict always carries both
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
    },
    // What the thread needs afterwards, stated rather than defaulted: this
    // door RESOLVED the card, so nothing in the thread is waiting on anybody.
    // The argument is required precisely so a door cannot inherit an answer it
    // never thought about (#575).
    () => "idle",
  );

  // A stated card's ⛔ is a decision its footer described, not a request to
  // stage it again, so it closes in the card's own words.
  // The pop-up's Reject names itself, and its reason, on the card it closed.
  const rejected = post.note.kind === "resolved" ? post.note.rejected : undefined;
  // One item of a decision report: its state goes on the report's record and
  // the whole message is drawn again from it (`decision-cards.ts`), so the
  // other items keep theirs. Approved says whether the write went through.
  if (pending.item) {
    if (!deps.reports) return;
    const at = (deps.now ?? Date.now)();
    const failed = outcomes?.find((o) => !o.ok);
    const as = request.as ? { as: request.as } : {};
    const state: ReportItemState =
      request.decision === "cancel"
        ? { kind: "rejected", by: request.userId, ...(rejected?.reason ? { reason: rejected.reason } : {}), ...as }
        : failed
          ? { kind: "failed", by: request.userId, at, reason: failureReason(failed.message), ...as }
          : { kind: "approved", by: request.userId, at, ...as };
    const message = await settleItem(deps.reports, pending.item, state, at);
    if (message) await deps.replaceCard(message);
    return;
  }
  const note =
    request.decision === "confirm"
      ? `:white_check_mark: Approved by <@${request.userId}>`
      : pending.stated
        ? statedCancelledNote({ cancelled: statedCancelOf(pending)! }, request.userId)
        : rejected
          ? `:no_entry: Rejected by <@${request.userId}>${rejected.reason ? `: ${escapeSlackText(rejected.reason)}` : ""}`
          : `:no_entry: Cancelled by <@${request.userId}> — tell me what to change and I'll stage it again.`;
  const words: { text: string; note: string; edited?: boolean } = deps.reword
    ? deps.reword(pending.proposalText, note)
    : { text: pending.proposalText, note };
  await deps.replaceCard(decidedCard(pending, words.note, words.text, { edited: words.edited === true }));
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
