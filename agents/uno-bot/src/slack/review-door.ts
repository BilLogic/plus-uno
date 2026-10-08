// The review door — a proposal card's Review pop-up, opened and decided.
//
// Two interactions, one door. Review on the card opens a modal with the whole
// draft; each of its three decisions — Approve, Needs changes, Reject — is the
// Gate's fifth signal (`review`), resolved by the same `resolveSignal` as a
// reaction, a typed emoji and the model's call, so the confirmer set, standing
// confirmers, TTL, supersession and the one-winner claim are the Gate's and
// not this file's. Reject is a ⛔ with a reason. Needs changes claims nothing:
// it locks the card as being revised, pending for the revision turn that
// replaces it.
//
// OPEN BEFORE READING. Slack's `trigger_id` lives three seconds, and a cold
// Durable Object read can spend most of that. So the door opens a loading view
// first, with nothing read, and fills it with `views.update` once the Gate has
// looked at the card. A failed open stops there: there is no view to fill.
//
// EDITS ARE CHECKED BEFORE THE CLAIM. A confirmer's pop-up offers the draft's
// fields (`review-fields.ts`); Approve carries them as the view's state, and
// `reviewEdits` holds them to the draft's own guards against the card and the
// database's options as they stand now. A refusal redraws the pop-up around
// an alert and leaves the card decidable; a pass hands the Gate the edited
// batch, so what was checked is what runs.
//
// A WIN IS A PRESS. What follows a won Approve — the gate note in the thread,
// the run under the working signal, the card edited in place — is the button
// door's own `applyPressVerdict`, so the two surfaces cannot drift apart. What
// differs is only where a non-win is answered: in the pop-up, not ephemerally.
//
// Takes named dependencies, as the button door does; `Env` is turned into
// `ReviewDoorDeps` once, in `slack/interactive.ts`. PURE by design: no `Env`,
// no Workers global, no fetch — so `tests/proposal-review.test.ts` drives it.
import type { PendingProposal, ThreadState } from "../thread-state/index";
import type { Delivery } from "../turn/index";
import { lookAtProposal, resolveSignal, type GateRestage, type GateVerdict, type ReviewDecision } from "../gate/index";
import { applyPressVerdict, type ButtonDoorTarget } from "./button-door";
import { renderGateNote } from "./gate-note";
import { withEditedFields } from "./proposal-render";
import {
  alertBlock,
  closedView,
  decidedView,
  draftView,
  loadingView,
  noticeView,
  REVIEW_ALERT_BLOCK_ID,
  type ReviewedCard,
} from "./review-view";
import {
  checkEdits,
  checkFieldEdits,
  editedNote,
  fieldInputBlocks,
  fieldsFromBlocks,
  reviewFields,
  stateValues,
  FIELD_BLOCK_PREFIX,
  type ReadOptions,
  type FieldChange,
  type ReviewViewState,
} from "./review-fields";
import type { ProposalOperation } from "../thread-state/index";

export type { ReviewViewState } from "./review-fields";

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
  /**
   * Needs changes, accepted: have uno-bot write the revision from the note, as
   * a turn in the card's thread. The card is still pending when it runs, so the
   * turn revises it and staging the revision supersedes it. Bound in
   * `slack/interactive.ts`, which posts the note into the thread and queues the
   * turn on it.
   */
  revise(request: { proposal: PendingProposal; note: string; userId: string }): Promise<void>;
  /** A select's live options, read from the target database when the pop-up
   *  opens and again on Approve. Absent, no select is offered. */
  fieldOptions?: ReadOptions;
}

/** Review, pressed on a card — or View, on a card already decided. */
export interface ReviewOpenRequest {
  triggerId: string;
  channel: string;
  /** The card the button sits on. */
  messageTs: string;
  userId: string;
  /** The card's own text, as the click carries it: what View shows once the
   *  record is gone. */
  cardText?: string;
}

/** A decision pressed inside the pop-up. */
export interface ReviewDecisionRequest {
  viewId: string;
  /** The card, as the view's `private_metadata` names it. */
  channel: string;
  messageTs: string;
  userId: string;
  /** Approve, Reject (`cancel`) or Needs changes (`revise`). */
  decision: ReviewDecision;
  /** What the note input held: Needs changes' note, Reject's reason. */
  note?: string;
  /** The pop-up's state from the press (`view.state.values`): the fields as
   *  the person left them. Absent, the card runs as staged. */
  state?: ReviewViewState;
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
      ? draftView(
          card,
          look.proposal,
          { mayDecide: look.mayDecide, confirmers: look.confirmers },
          // Only a confirmer is offered fields, so only theirs costs a read.
          look.mayDecide ? { fields: await reviewFields(look.proposal, deps.fieldOptions) } : undefined,
        )
      : look.state === "gone" && request.cardText
        ? decidedView(card, request.cardText)
        : closedView(card, look);
  await deps.views.update(viewId, view);
}

/** A decision in the pop-up: the Gate's `review` signal, applied as a press —
 *  or, for Needs changes, handed to a revision. */
export async function runReviewDecision(request: ReviewDecisionRequest, deps: ReviewDoorDeps): Promise<void> {
  const card: ReviewedCard = { channel: request.channel, ts: request.messageTs };
  const note = request.note?.trim() ?? "";
  const gateDeps = { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers };

  // Needs changes with nothing to change is refused where it was pressed: the
  // draft again, decisions, fields and values all kept, saying what is
  // missing. uno-bot never guesses at a revision.
  if (request.decision === "revise" && !note) {
    const look = await lookAtProposal(request.messageTs, request.userId, gateDeps);
    let view: Record<string, unknown>;
    if (look.state === "live") {
      const fields = look.mayDecide ? await reviewFields(look.proposal, deps.fieldOptions) : [];
      view = draftView(
        card,
        look.proposal,
        { mayDecide: look.mayDecide, confirmers: look.confirmers },
        { fields, values: stateValues(fields, request.state) },
        { noteNeeded: true },
      );
    } else {
      view = closedView(card, look);
    }
    await deps.views.update(request.viewId, view);
    return;
  }

  // Only Approve writes, so only Approve's edits are checked and carried.
  const edits =
    request.decision === "confirm" ? await reviewEdits(request, deps) : { ok: true as const, edited: [], changes: [] };
  if (!edits.ok) {
    console.log(`[review] edit refused on ${request.channel}/${request.messageTs} by=${request.userId}`);
    await deps.views.update(request.viewId, edits.view);
    return;
  }
  const verdict = await resolveSignal(
    {
      kind: "review",
      messageTs: request.messageTs,
      decision: request.decision,
      userId: request.userId,
      ...(note ? { note } : {}),
      ...(edits.operations ? { operations: edits.operations } : {}),
    },
    gateDeps,
  );
  console.log(
    `[review] ${request.decision} on ${request.channel}/${request.messageTs} by=${request.userId} outcome=${verdict.outcome}`,
  );

  if (request.decision === "revise") {
    await applyRevise(request, card, verdict, deps);
    return;
  }

  // Said in the pop-up before the run starts, so the person sees it register
  // at once rather than after a write that can take a while.
  if (verdict.outcome === "won") {
    await deps.views.update(request.viewId, noticeView(card, decidedLine(request.decision)));
  } else if (verdict.post && verdict.post.note.kind !== "cut-off") {
    // A non-win is answered where the person is looking, which is the pop-up
    // — even a note the button door would edit onto the card.
    await deps.views.update(request.viewId, noticeView(card, renderGateNote(verdict.post.note)));
    return;
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
      // The card records who edited what, above who decided, and from then on
      // says what was approved: the edited values, not the draft's, which is
      // also what View opens.
      replaceCard: (text, note) =>
        deps.updateCard(
          request.channel,
          request.messageTs,
          edits.changes.length ? withEditedFields(text, edits.changes) : text,
          edits.edited.length ? `${editedNote(request.userId, edits.edited)}\n${note}` : note,
        ),
    },
  );
  // A cut-off card speaks in the thread, and the pop-up points there.
  if (verdict.post?.note.kind === "cut-off") {
    await deps.views.update(request.viewId, noticeView(card, renderGateNote(verdict.post.note)));
  }
}

/**
 * Needs changes, as the Gate answered it. Accepted, the pop-up says so in one
 * line, the card is edited in place to who asked — and offers View — and the
 * revision is handed off. Anything else is the Gate's own answer, in the pop-up.
 */
async function applyRevise(
  request: ReviewDecisionRequest,
  card: ReviewedCard,
  verdict: GateVerdict,
  deps: ReviewDoorDeps,
): Promise<void> {
  if (verdict.outcome !== "won" || !verdict.revise || !verdict.proposal) {
    if (verdict.post) await deps.views.update(request.viewId, noticeView(card, renderGateNote(verdict.post.note)));
    return;
  }
  await deps.views.update(
    request.viewId,
    noticeView(card, "Sent back with your note. I'm revising the draft, and the new card posts in the thread."),
  );
  await deps.updateCard(
    request.channel,
    request.messageTs,
    verdict.proposal.proposalText,
    `:pencil2: Needs changes, asked by <@${request.userId}>. The revised draft follows in the thread.`,
  );
  await deps.revise({ proposal: verdict.proposal, note: verdict.revise.note, userId: request.userId });
}

function decidedLine(decision: "confirm" | "cancel"): string {
  return decision === "confirm"
    ? "Approved. I'm running it now, and the outcome posts in the thread."
    : "Rejected. Nothing will run.";
}

/**
 * The pop-up's edits to the card, checked against the card as it stands and
 * the database's options as they stand: the batch to run and the fields that
 * changed, or the pop-up redrawn around the alert that refuses them.
 *
 * Checked BEFORE the Gate's claim, because the claim consumes the card and a
 * refused edit has to leave it decidable. A card that is no longer live, or a
 * person who may not decide it, gets no check here: the claim refuses them in
 * its own words. A card is identified by its ts and never rewritten under it,
 * so what is checked here is what the claim wins.
 *
 * The seam every decision that writes from the pop-up reads its edits through.
 */
export async function reviewEdits(
  request: Pick<ReviewDecisionRequest, "channel" | "messageTs" | "userId" | "state">,
  deps: Pick<ReviewDoorDeps, "threadState" | "standingConfirmers" | "fieldOptions">,
): Promise<
  | { ok: true; operations?: ProposalOperation[]; edited: string[]; changes: FieldChange[] }
  | { ok: false; view: Record<string, unknown> }
> {
  if (!request.state) return { ok: true, edited: [], changes: [] };
  const look = await lookAtProposal(request.messageTs, request.userId, {
    threadState: deps.threadState,
    standingConfirmers: deps.standingConfirmers,
  });
  if (look.state !== "live" || !look.mayDecide) return { ok: true, edited: [], changes: [] };
  const fields = await reviewFields(look.proposal, deps.fieldOptions);
  const checked = checkEdits(look.proposal, fields, request.state);
  if (!checked.ok) {
    const card: ReviewedCard = { channel: request.channel, ts: request.messageTs };
    return {
      ok: false,
      view: draftView(
        card,
        look.proposal,
        { mayDecide: true, confirmers: look.confirmers },
        { fields, values: stateValues(fields, request.state), alert: { level: "error", text: checked.alert } },
      ),
    };
  }
  return checked.edited.length
    ? { ok: true, operations: checked.operations, edited: checked.edited, changes: checked.changes }
    : { ok: true, edited: [], changes: [] };
}

/**
 * The pop-up's Check edits, answered: the submitted view, redrawn with the
 * person's values kept and one alert saying whether the edits pass.
 *
 * Built from the submitted view alone, inside the submit's ack, so nothing is
 * read: a select can only hold an option the view offered, and the text
 * checks need nothing but the text. Approve checks again against the live
 * card and options, so this answer is advice, never a decision.
 *
 * @param view - The `view` a view_submission payload carries
 * @returns What `response_action: "update"` takes
 */
export function checkedEditsView(view: Record<string, unknown>): Record<string, unknown> {
  const blocks = (Array.isArray(view.blocks) ? view.blocks : []).filter(
    (b) => (b as { block_id?: string }).block_id !== REVIEW_ALERT_BLOCK_ID,
  );
  const fields = fieldsFromBlocks(blocks);
  const state = (view.state as { values?: ReviewViewState } | undefined)?.values;
  const checked = checkFieldEdits(fields, state);
  const values = stateValues(fields, state);
  const alert = checked.ok
    ? alertBlock("success", checked.edited.length ? "Your edits pass the checks. Approve to write them." : "Nothing is edited yet.")
    : alertBlock("error", checked.alert);
  const redrawn = blocks.map((block) => {
    const id = (block as { block_id?: string }).block_id ?? "";
    if (!id.startsWith(FIELD_BLOCK_PREFIX)) return block;
    const field = fields.find((f) => `${FIELD_BLOCK_PREFIX}${f.key}` === id);
    return field ? fieldInputBlocks([field], values)[0] : block;
  });
  const out: Record<string, unknown> = {};
  for (const key of ["type", "callback_id", "title", "close", "submit", "private_metadata"]) {
    if (view[key] !== undefined) out[key] = view[key];
  }
  out.blocks = [alert, ...redrawn];
  return out;
}
