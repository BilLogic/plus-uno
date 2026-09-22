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
import { renderGateNote } from "./gate-note";

/** One button press, in the facts the envelope already has. */
export interface ButtonRequest {
  channel: string;
  /** The card the button sits on. */
  messageTs: string;
  decision: "confirm" | "cancel";
  /** Who pressed. */
  userId: string;
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
   */
  applyVerdict(verdict: GateVerdict): Promise<void>;

  /** A press that did not win is answered where the person is looking. */
  replyEphemeral(text: string): Promise<void>;

  /** After a win, the card is re-rendered without its buttons. */
  replaceCard(proposalText: string, note: string): Promise<void>;

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
    { threadState: deps.threadState },
  );
  console.log(
    `[interactive] ${request.decision} button on ${request.channel}/${request.messageTs} by=${request.userId} outcome=${verdict.outcome}`,
  );

  if (verdict.post?.note.kind === "cut-off" && verdict.proposal) {
    await speakCutOff(request, verdict, verdict.proposal, verdict.post, deps);
    return;
  }

  if (verdict.outcome !== "won") {
    // Expired, already resolved, or a press that lost the race. Never silence.
    if (verdict.post) await deps.replyEphemeral(renderGateNote(verdict.post.note));
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
  await withWorkingSignal(
    door,
    async (delivery) => {
      await delivery.setWorking({ status: "is working on that…" });
      await delivery.postGateNote(post.note);
      await deps.applyVerdict(verdict);
    },
    // What the thread needs afterwards, stated rather than defaulted: this
    // door RESOLVED the card, so nothing in the thread is waiting on anybody.
    // The argument is required precisely so a door cannot inherit an answer it
    // never thought about (#575).
    () => "idle",
  );

  const note =
    request.decision === "confirm"
      ? `:white_check_mark: Approved by <@${request.userId}>`
      : `:no_entry: Cancelled by <@${request.userId}> — tell me what to change and I'll stage it again.`;
  await deps.replaceCard(pending.proposalText, note);
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
  deps: ButtonDoorDeps,
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
    pending.proposalText,
    ":warning: This run was cut off before it reported back — see the thread for what finished.",
  );
}
