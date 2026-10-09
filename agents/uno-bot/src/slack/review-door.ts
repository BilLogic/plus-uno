// The review door — a proposal card's Review pop-up, opened and decided.
//
// Review on the card opens a modal with the whole draft. Its decision —
// Approve, Needs changes or Reject, chosen above the footer and sent with its
// Submit — is the Gate's fifth signal (`review`), resolved by
// the same `resolveSignal` as a reaction, a typed emoji and the model's call,
// so the confirmer set, standing confirmers, TTL, supersession and the
// one-winner claim are the Gate's and not this file's. Reject is a ⛔ with a
// reason. Needs changes claims nothing: it locks the card as being revised,
// pending for the revision turn that replaces it.
//
// OPEN BEFORE READING. Slack's `trigger_id` lives three seconds, and a cold
// Durable Object read can spend most of that. So the door opens (or pushes) a
// loading view first, with nothing read, and fills it with `views.update`
// once the Gate has looked at the card. A failed open stops there.
//
// EDITS ARE SAVED ON THE DRAFT, AND CHECKED AGAIN ON APPROVE. Edit fields
// pushes the draft's fields (`review-fields.ts`); Save edits holds what
// changed to the draft's own guards, writes the values that differ from the
// draft into the draft view's `private_metadata`, and redraws it. Approve
// reads them back and `reviewEdits` holds them to the guards again, against
// the card and the database's options as they stand then. A refusal redraws
// the draft around an alert and leaves the card decidable; a pass hands the
// Gate the edited batch, so what was checked is what runs.
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
import { applyPressVerdict, decidedCard, liveCard, type ButtonDoorTarget, type CardMessage } from "./button-door";
import { renderGateNote } from "./gate-note";
import { escapeSlackText } from "./mrkdwn";
import { withEditedFields } from "./proposal-render";
import {
  closedView,
  decidedView,
  draftView,
  editLoadingView,
  editView,
  loadingView,
  noticeView,
  reviewMetadata,
  METADATA_MAX_CHARS,
  type ReviewedCard,
} from "./review-view";
import {
  checkEdits,
  checkFieldEdits,
  draftValuesOf,
  editedNote,
  fieldsFromBlocks,
  reviewFields,
  stateOf,
  stateValues,
  FIELD_BLOCK_PREFIX,
  type EditableField,
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
  /** `views.push` over the view a click came from: the pushed view's id, or
   *  null when Slack refused. */
  push(triggerId: string, view: Record<string, unknown>): Promise<string | null>;
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
  updateCard(channel: string, ts: string, message: CardMessage): Promise<void>;
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
  /** A select's live options, read from the target database when Edit fields
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

/** A decision submitted from the pop-up. */
export interface ReviewDecisionRequest {
  /** The draft the decision was submitted from. */
  viewId: string;
  /** The draft under the view the decision came from, when it came from a
   *  pushed view, so the answer replaces it too. */
  rootViewId?: string;
  /** The card, as the view's `private_metadata` names it. */
  channel: string;
  messageTs: string;
  userId: string;
  /** Approve, Reject (`cancel`) or Needs changes (`revise`). */
  decision: ReviewDecision;
  /** Needs changes' note, Reject's reason. */
  note?: string;
  /** The edits Save edits kept on the draft (field key → value). Approve
   *  checks them again before the claim. */
  edits?: Readonly<Record<string, string>>;
  /** A pop-up state holding field values, as Slack sends one. */
  state?: ReviewViewState;
  /** The fields `state` was offered with, each with its draft value. Present,
   *  Approve reads the card and the options only for what `state` changed. */
  fields?: readonly EditableField[];
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
    look.state === "live" && look.proposal.revising
      ? // Sent back with Needs changes: the revised card is the one to decide.
        noticeView(card, "This proposal is being revised. Decide on the revised card when it posts in the thread.")
      : look.state === "live"
      ? draftView(
          card,
          look.proposal,
          { mayDecide: look.mayDecide, confirmers: look.confirmers },
          { editable: draftValuesOf(look.proposal).size > 0 },
        )
      : look.state === "gone" && request.cardText
        ? decidedView(card, request.cardText)
        : closedView(card, look);
  await deps.views.update(viewId, view);
}

/** Edit fields, pressed on the draft: the view that holds the fields. */
export interface ReviewPushRequest {
  triggerId: string;
  /** The card, as the draft's `private_metadata` names it, with its saved
   *  edits. */
  card: ReviewedCard;
  userId: string;
}

/**
 * Edit fields, pressed on the draft: a loading view pushed over it, then
 * filled with the fields and the live options their selects may take, each
 * holding the value the draft shows.
 */
export async function runReviewPush(request: ReviewPushRequest, deps: ReviewDoorDeps): Promise<void> {
  const { card } = request;
  const where = `${card.channel}/${card.ts}`;
  const viewId = await deps.views.push(request.triggerId, editLoadingView(card));
  if (!viewId) {
    console.warn(`[review] views.push refused for edit on ${where}`);
    return;
  }
  const look = await lookAtProposal(card.ts, request.userId, {
    threadState: deps.threadState,
    standingConfirmers: deps.standingConfirmers,
  });
  if (look.state !== "live" || !look.mayDecide || look.proposal.revising) {
    await deps.views.update(viewId, look.state === "live" ? noticeView(card, "This proposal can't be edited from here now.") : closedView(card, look));
    return;
  }
  const fields = await reviewFields(look.proposal, deps.fieldOptions);
  await deps.views.update(viewId, editView(card, fields, new Map(Object.entries(card.edits ?? {}))));
}

/** Save edits, submitted from the Edit fields view. */
export interface ReviewSaveRequest {
  /** The draft under the Edit fields view. */
  rootViewId: string;
  /** The card, as the Edit fields view's `private_metadata` names it, with the
   *  edits the draft held when it was pushed. */
  card: ReviewedCard;
  userId: string;
  /** The Edit fields view's blocks, as the submit carries them. */
  blocks: readonly unknown[];
  state?: ReviewViewState;
}

/** What a view_submission is answered with; null is an empty ack, which closes
 *  the pushed view onto the one under it. */
export type ReviewAck = { response_action: "errors"; errors: Record<string, string> } | null;

/**
 * Save edits: the changed fields held to the draft's guards, then the values
 * that differ from the draft written into the draft view and its
 * `private_metadata`, where Approve finds them. Answered inside the submit's
 * ack, so a refusal is Slack's own error under the field and a pass closes
 * this view onto the redrawn draft.
 *
 * The guards run on what the view offered, with nothing read; Approve checks
 * every saved value again against the live card and options, so a save is
 * never the decision.
 */
export async function saveReviewEdits(request: ReviewSaveRequest, deps: ReviewDoorDeps): Promise<ReviewAck> {
  const { card } = request;
  const fields = fieldsFromBlocks(request.blocks);
  const checked = checkFieldEdits(fields, request.state);
  if (!checked.ok) return { response_action: "errors", errors: { [`${FIELD_BLOCK_PREFIX}${checked.key}`]: checked.alert } };

  const look = await lookAtProposal(card.ts, request.userId, {
    threadState: deps.threadState,
    standingConfirmers: deps.standingConfirmers,
  });
  if (look.state !== "live" || !look.mayDecide || look.proposal.revising) {
    await deps.views.update(request.rootViewId, look.state === "live" ? noticeView(card, "This proposal can't be edited from here now.") : closedView(card, look));
    return null;
  }
  const drafts = draftValuesOf(look.proposal);
  const values = new Map(Object.entries(card.edits ?? {}));
  for (const [key, value] of stateValues(fields, request.state)) values.set(key, value);
  const edits: Record<string, string> = {};
  for (const [key, value] of values) if (drafts.has(key) && drafts.get(key) !== value) edits[key] = value;

  // Slack caps `private_metadata`; edits past it cannot ride to Approve.
  if (reviewMetadata({ channel: card.channel, ts: card.ts, edits }).length > METADATA_MAX_CHARS) {
    const longest = Object.keys(edits).sort((a, b) => edits[b]!.length - edits[a]!.length)[0]!;
    const blockId = fields.some((f) => f.key === longest) ? `${FIELD_BLOCK_PREFIX}${longest}` : `${FIELD_BLOCK_PREFIX}${fields[0]!.key}`;
    return {
      response_action: "errors",
      errors: { [blockId]: "These edits are too long to carry to Approve together. Shorten this one, or ask for changes instead." },
    };
  }
  await deps.views.update(
    request.rootViewId,
    draftView(card, look.proposal, { mayDecide: true, confirmers: look.confirmers }, { edits, editable: true }),
  );
  console.log(`[review] edits saved on ${card.channel}/${card.ts} by=${request.userId} fields=${Object.keys(edits).length}`);
  return null;
}

/** A decision from the pop-up: the Gate's `review` signal, applied as a press —
 *  or, for Needs changes, handed to a revision. */
export async function runReviewDecision(request: ReviewDecisionRequest, deps: ReviewDoorDeps): Promise<void> {
  const card: ReviewedCard = { channel: request.channel, ts: request.messageTs };
  const note = request.note?.trim() ?? "";
  const gateDeps = { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers };
  const show = showIn(request, deps);

  // Needs changes with nothing to change: Submit requires a note for it, so
  // only a blank one gets here. uno-bot never guesses at a revision.
  if (request.decision === "revise" && !note) {
    await show(noticeView(card, ":warning: Needs changes needs a note. Press Review again, choose Needs changes and write what to change."));
    return;
  }

  // Only Approve writes, so only Approve's edits are checked and carried.
  const edits =
    request.decision === "confirm" ? await reviewEdits(request, deps) : { ok: true as const, edited: [], changes: [] };
  if (!edits.ok) {
    console.log(`[review] edit refused on ${request.channel}/${request.messageTs} by=${request.userId}`);
    await show(edits.view);
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
    await show(noticeView(card, decidedLine(request.decision)));
  } else if (verdict.post && verdict.post.note.kind !== "cut-off") {
    // A non-win is answered where the person is looking, which is the pop-up
    // — even a note the button door would edit onto the card.
    await show(noticeView(card, renderGateNote(verdict.post.note)));
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
      replyEphemeral: async (text) => void (await show(noticeView(card, text))),
      // The card records who edited what, above who decided, and from then on
      // says what was approved: the edited values, not the draft's, which is
      // also what View opens.
      reword: (text, note) => ({
        text: edits.changes.length ? withEditedFields(text, edits.changes) : text,
        note: edits.edited.length ? `${editedNote(request.userId, edits.edited)}\n${note}` : note,
        edited: edits.changes.length > 0,
      }),
      replaceCard: (message) => deps.updateCard(request.channel, request.messageTs, message),
    },
  );
  // A cut-off card speaks in the thread, and the pop-up points there.
  if (verdict.post?.note.kind === "cut-off") {
    await show(noticeView(card, renderGateNote(verdict.post.note)));
  }
}

/** Show a view where the decision was made, and on the draft under it, so
 *  closing the pushed view lands on the same answer. */
function showIn(request: Pick<ReviewDecisionRequest, "viewId" | "rootViewId">, deps: Pick<ReviewDoorDeps, "views">) {
  return async (view: Record<string, unknown>): Promise<void> => {
    await deps.views.update(request.viewId, view);
    if (request.rootViewId && request.rootViewId !== request.viewId) await deps.views.update(request.rootViewId, view);
  };
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
    if (verdict.post) await showIn(request, deps)(noticeView(card, renderGateNote(verdict.post.note)));
    return;
  }
  await showIn(request, deps)(
    noticeView(card, "Sent back with your note. I'm revising the draft, and the new card posts in the thread."),
  );
  // Live, not decided: nothing is decided until the revision replaces it, and
  // a revision that never comes hands the card back (`startRevision`, Turn's
  // unlock). Review stays, and opens on "being revised" meanwhile.
  await deps.updateCard(
    request.channel,
    request.messageTs,
    decidedCard(
      verdict.proposal,
      `:pencil2: Needs changes, asked by <@${request.userId}>. It's being revised, and the new card follows in the thread.`,
      verdict.proposal.proposalText,
      { button: "Review" },
    ),
  );
  await deps.revise({ proposal: verdict.proposal, note: verdict.revise.note, userId: request.userId });
}

/** What starting a revision needs: Slack, bound once in `slack/interactive.ts`. */
export interface RevisionDeps {
  threadState: ThreadState;
  /** Post a line in the card's thread: the ts it landed on, or null. */
  postInThread(text: string): Promise<string | null>;
  /** Queue the revision turn on the posted note, as the asker's own reply. */
  queueTurn(noteTs: string): Promise<void>;
  /** Edit the card in place (`chat.update`). */
  updateCard(message: CardMessage): Promise<void>;
}

/**
 * Needs changes, handed to uno-bot: the note goes into the card's thread as a
 * line naming who asked, and the revision turn is queued on that line. The
 * card is still pending, so the turn sees it and its revision replaces it.
 *
 * A revision that cannot start — the note did not post, or the turn could not
 * be queued — would leave the card locked with nothing to unlock it, so the
 * mark is lifted, the card goes back to its live form, and the thread is told
 * to ask again.
 */
export async function startRevision(
  request: { proposal: PendingProposal; note: string; userId: string },
  deps: RevisionDeps,
): Promise<void> {
  const { proposal, note, userId } = request;
  const where = `${proposal.channel}/${proposal.proposalTs}`;
  const noteTs = await deps
    .postInThread(`:pencil2: <@${userId}> asked for changes: ${escapeSlackText(note)}`)
    .catch(() => null);
  if (noteTs) {
    try {
      await deps.queueTurn(noteTs);
      return;
    } catch (err) {
      console.error(`[review] revision turn not queued on ${where}: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    console.error(`[review] needs-changes note did not post on ${where}`);
  }
  await deps.threadState.clearRevising(proposal.proposalTs).catch(() => {});
  await deps.updateCard(liveCard(proposal)).catch(() => {});
  await deps
    .postInThread(":warning: I couldn't start the revision. Reply here with what to change and I'll revise the draft.")
    .catch(() => null);
}

function decidedLine(decision: "confirm" | "cancel"): string {
  return decision === "confirm"
    ? "Approved. I'm running it now, and the outcome posts in the thread."
    : "Rejected. Nothing will run.";
}

/**
 * The pop-up's edits to the card, checked against the card as it stands and
 * the database's options as they stand: the batch to run and the fields that
 * changed, or the draft redrawn around the alert that refuses them.
 *
 * Checked BEFORE the Gate's claim, because the claim consumes the card and a
 * refused edit has to leave it decidable. A card that is no longer live, or a
 * person who may not decide it, gets no check here: the claim refuses them in
 * its own words. A card is identified by its ts and never rewritten under it,
 * so what is checked here is what the claim wins.
 *
 * The seam every decision that writes from the pop-up reads its edits through.
 * The edits arrive as Save edits kept them (`edits`) or as a state with the
 * fields it was offered with (`state`, `fields`).
 *
 * READS ONLY FOR WHAT CHANGED. No edit costs no read beyond the claim's own;
 * otherwise only a select an edit names has its options read again.
 */
export async function reviewEdits(
  request: Pick<ReviewDecisionRequest, "channel" | "messageTs" | "userId" | "state" | "fields" | "edits">,
  deps: Pick<ReviewDoorDeps, "threadState" | "standingConfirmers" | "fieldOptions">,
): Promise<
  | { ok: true; operations?: ProposalOperation[]; edited: string[]; changes: FieldChange[] }
  | { ok: false; view: Record<string, unknown> }
> {
  const saved = request.edits && Object.keys(request.edits).length ? request.edits : undefined;
  const state = saved ? stateOf(saved) : request.state;
  if (!state) return { ok: true, edited: [], changes: [] };
  const changed = saved
    ? new Set(Object.keys(saved))
    : request.fields
      ? changedKeys(request.fields, state)
      : undefined;
  if (changed && !changed.size) return { ok: true, edited: [], changes: [] };
  const look = await lookAtProposal(request.messageTs, request.userId, {
    threadState: deps.threadState,
    standingConfirmers: deps.standingConfirmers,
  });
  if (look.state !== "live" || !look.mayDecide) return { ok: true, edited: [], changes: [] };
  const fields = await reviewFields(look.proposal, deps.fieldOptions, changed);
  const checked = checkEdits(look.proposal, fields, state);
  if (!checked.ok) {
    const card: ReviewedCard = { channel: request.channel, ts: request.messageTs };
    return {
      ok: false,
      view: draftView(
        card,
        look.proposal,
        { mayDecide: true, confirmers: look.confirmers },
        { edits: saved ?? {}, editable: true, alert: { level: "error", text: checked.alert } },
      ),
    };
  }
  return checked.edited.length
    ? { ok: true, operations: checked.operations, edited: checked.edited, changes: checked.changes }
    : { ok: true, edited: [], changes: [] };
}

/** The keys of the fields `state` holds at something other than the value the
 *  pop-up opened with. */
function changedKeys(fields: readonly EditableField[], state: ReviewViewState): Set<string> {
  const values = stateValues(fields, state);
  return new Set(fields.filter((f) => values.has(f.key) && values.get(f.key) !== f.value).map((f) => f.key));
}
