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
// EDITS KEEP THEMSELVES, AND ARE CHECKED AGAIN ON APPROVE. Text is typed into
// the draft itself and rides its Submit. Edit fields pushes the draft's
// selects (`review-fields.ts`), and each pick is kept as it is made: held to
// the options the view offered, merged into the person's kept picks on the
// card's record (`ThreadState.keepPick`), and the draft redrawn from them —
// so going back from Edit fields loses nothing. Approve reads the kept picks
// off the same record, with what was typed in place, and `reviewEdits` holds
// them all to the guards again, against
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
import { proposalOperations, withArgs, type PendingProposal, type ProposalLookup, type ReviewChoice, type ThreadState } from "../thread-state/index";
import { currentReport, itemText, settleItem } from "./decision-cards";
import type { OperationOutcome } from "../gate/run-batch";
import type { Delivery } from "../turn/index";
import { lookAtProposal, resolveSignal, type GateRestage, type GateVerdict, type ReviewDecision } from "../gate/index";
import { applyPressVerdict, type ButtonDoorTarget } from "./button-door";
import { decidedCard, liveCard, type CardMessage } from "./proposal-render";
import { renderGateNote } from "./gate-note";
import { escapeSlackText } from "./mrkdwn";
import { withEditedFields } from "./proposal-render";
import { issueStepChanges } from "./review-draft-writes";
import { reviewTitle } from "./review-anatomy";
import {
  closedTitle,
  closedView,
  decidedView,
  draftView,
  editLoadingView,
  editView,
  inlineKeysOf,
  loadingView,
  noticeView,
  outcomeView,
  stateView,
  type ReviewedCard,
  type ReviewPick,
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
  type EditableField,
  type ReadOptions,
  type FieldChange,
  type ReviewViewState,
} from "./review-fields";
import type { ProposalOperation } from "../thread-state/index";
import type { NotionDatabaseLinks } from "./review-notion-create";

export type { ReviewViewState } from "./review-fields";
export type { ReviewPick } from "./review-view";

/** Slack's views methods, as the door needs them. */
export interface ReviewViews {
  /** `views.open`: the opened view's id, or null when Slack refused. */
  open(triggerId: string, view: Record<string, unknown>): Promise<string | null>;
  /** `views.push` over the view a click came from: the pushed view's id, or
   *  null when Slack refused. */
  push(triggerId: string, view: Record<string, unknown>): Promise<string | null>;
  /** `views.update` on a view already open: whether Slack took it. With
   *  `hash`, the view as the press found it: Slack refuses the update
   *  (`hash_conflict`) when the view has changed since. */
  update(viewId: string, view: Record<string, unknown>, hash?: string): Promise<boolean>;
}

export interface ReviewDoorDeps {
  threadState: ThreadState;
  /** Gate's own `standingConfirmers`, handed through. */
  standingConfirmers?: readonly string[];
  views: ReviewViews;
  /** Where a win speaks — see `ButtonDoorDeps.delivery`. */
  delivery(target: ButtonDoorTarget): Delivery;
  /** The confirmed tool and its record — see `ButtonDoorDeps.applyVerdict`. */
  applyVerdict(verdict: GateVerdict): Promise<readonly OperationOutcome[] | void>;
  /** The card's message, edited in place to its outcome (`chat.update`): a
   *  view has no `response_url` for the message it was opened from. For an
   *  item of a decision report, the report's whole message, drawn again from
   *  its record. */
  updateCard(channel: string, ts: string, message: CardMessage): Promise<void>;
  /** The clock an item's decision is stamped with. Absent, `Date.now`. */
  now?(): number;
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
  /** Where the Notion databases a create lands in open, for the draft's where
   *  line. Absent, each is named and not linked. */
  notionDatabases?: NotionDatabaseLinks;
}

/** The draft's database links, as `draftView` takes them. */
function databasesOf(deps: Pick<ReviewDoorDeps, "notionDatabases">): { databases?: NotionDatabaseLinks } {
  return deps.notionDatabases ? { databases: deps.notionDatabases } : {};
}

/** Review, pressed on a card — or View, on a card already decided. */
export interface ReviewOpenRequest {
  triggerId: string;
  channel: string;
  /** The card the button sits on, by its proposal key: the card's ts, or an
   *  item's key (`itemProposal`) for an item of a decision report. */
  messageTs: string;
  userId: string;
  /** The card's own text, as the click carries it: the outcome View shows
   *  once the record no longer keeps the decided draft. */
  cardText?: string;
  /** An item of a decision report: its message and its id. View reads its
   *  words off the report's record. */
  item?: { messageTs: string; id: string };
}

/** A decision submitted from the pop-up. */
export interface ReviewDecisionRequest {
  /** The draft the decision was submitted from. */
  viewId: string;
  /** The draft under the view the decision came from, when it came from a
   *  pushed view, so the answer replaces it too. */
  rootViewId?: string;
  /** The card, as the view's `private_metadata` names it: its proposal key. */
  channel: string;
  messageTs: string;
  userId: string;
  /** Approve, Reject (`cancel`) or Needs changes (`revise`). */
  decision: ReviewDecision;
  /** Needs changes' note, Reject's reason. */
  note?: string;
  /** One of the card's own answers (`PendingProposal.choices`), by value:
   *  its verdict decides in place of `decision`, and its args ride the write. */
  choice?: string;
  /** A pop-up state holding field values, as Slack sends one. */
  state?: ReviewViewState;
  /** The fields `state` was offered with, each with its draft value. Present,
   *  Approve reads the card and the options only for what `state` changed. */
  fields?: readonly EditableField[];
}

/** Open the pop-up on a card: loading first, then the draft or why there is
 *  none to decide. A card that closed — decided, answered, noted, withdrawn,
 *  replaced or out of time — is drawn from the draft its record keeps (View),
 *  read-only, under how it closed, who closed it and when (#1362). Only a card
 *  closed before its record kept the draft shows its outcome alone: an item
 *  of a report its words off the report's record, any other card the outcome
 *  its message ends with. */
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
  // The draft a closed card's record keeps, when it keeps one.
  const kept = look.state === "live" ? undefined : look.decided;
  // An item no longer live: its report redrawn, so one whose time ran out is
  // shown closed on its card from now on — and, when nothing was kept, its
  // words read off the report's record.
  const item = request.item && look.state !== "live" ? await reportItem(request.channel, request.item, deps, !kept) : null;
  const view = kept
    ? draftView(card, kept.proposal, { mayDecide: false, confirmers: [], decided: kept })
    : item
    ? decidedView(card, item, look.state === "live" ? undefined : closedTitle(look))
    :
    look.state === "live" && look.proposal.revising
      ? // Sent back with Needs changes: the revised card is the one to decide.
        stateView(
          card,
          "info",
          request.item ? "This proposal is being revised. Its card shows the revised draft once it is ready." : "This proposal is being revised. Decide on the revised card when it posts in the thread.",
          titleOf(look.proposal),
        )
      : look.state === "live"
      ? draftView(
          card,
          look.proposal,
          { mayDecide: look.mayDecide, confirmers: look.confirmers, ...(await itemClosesAt(look.proposal, deps)) },
          { editable: draftValuesOf(look.proposal).size > 0, edits: look.kept, ...databasesOf(deps) },
        )
      : look.state === "gone" && request.cardText
        ? outcomeView(card, request.cardText)
        : closedView(card, look);
  await deps.views.update(viewId, view);
}

/** When a report's item closes undecided — its report's post time plus its
 *  TTL — or nothing for any other card or an unread record. */
async function itemClosesAt(proposal: PendingProposal, deps: ReviewDoorDeps): Promise<{ closesAt?: number }> {
  if (!proposal.item) return {};
  const record = await deps.threadState.getReport(proposal.item.messageTs).catch(() => null);
  const postedAt = Number(proposal.item.messageTs) * 1000;
  return record && Number.isFinite(postedAt) ? { closesAt: postedAt + record.ttlMs } : {};
}

/** An item's words for View, off its report's record, when `words` asks for
 *  them: only for an item closed before its record kept the draft. The
 *  report's message is redrawn first either way, so an item whose time ran
 *  out reads as closed. */
async function reportItem(
  channel: string,
  item: { messageTs: string; id: string },
  deps: ReviewDoorDeps,
  words: boolean,
): Promise<string | null> {
  const now = (deps.now ?? Date.now)();
  const message = await currentReport(deps.threadState, item.messageTs, now).catch(() => null);
  if (message) await deps.updateCard(channel, item.messageTs, message);
  if (!words) return null;
  const record = await deps.threadState.getReport(item.messageTs).catch(() => null);
  return record ? itemText(record, item.id) : null;
}

/** Edit fields, pressed on the draft: the view that holds the fields. */
export interface ReviewPushRequest {
  triggerId: string;
  /** The card, as the draft's `private_metadata` names it. */
  card: ReviewedCard;
  userId: string;
}

/**
 * Edit fields, pressed on the draft: a loading view pushed over it, then
 * filled with the selects and the live options they may take, each holding
 * the value the draft shows: the person's kept pick, or the draft's own.
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
    await deps.views.update(viewId, look.state === "live" ? noticeView(card, CANNOT_EDIT, titleOf(look.proposal)) : closedView(card, look));
    return;
  }
  // What the draft holds in place is edited there, not here.
  const inPlace = inlineKeysOf(look.proposal);
  const fields = (await reviewFields(look.proposal, deps.fieldOptions)).filter((f) => !inPlace.has(f.key));
  await deps.views.update(viewId, editView(card, fields, new Map(Object.entries(look.kept))));
}

/**
 * A pick under Edit fields, kept at once: held to the options the view
 * offered, then merged into the person's kept picks on the card's record
 * (`ThreadState.keepPick`, one transaction per pick, so two quick picks on two
 * fields both survive whichever lands first) and the draft redrawn from the
 * merged set. Nothing to press, so going back loses nothing. A pick back to
 * the draft's own value drops it. A refusal is an alert on Edit fields, which
 * shows the kept values again rather than the refused one; the next pick that
 * passes clears it.
 *
 * The draft is redrawn with the input blocks it already had, so Slack keeps
 * whatever was typed into them. The update names the draft by the root view
 * id the pick carries, with no hash: the record is the truth, and every
 * redraw shows its latest. Approve checks every kept value again against the
 * live card and options, so a pick is never the decision.
 */
export async function keepReviewPick(request: ReviewPick, deps: ReviewDoorDeps): Promise<void> {
  const { card, pick } = request;
  const look = await lookAtProposal(card.ts, request.userId, {
    threadState: deps.threadState,
    standingConfirmers: deps.standingConfirmers,
  });
  const cannot = async (why: Record<string, unknown>) => {
    await deps.views.update(request.viewId, why);
    await deps.views.update(request.rootViewId, why);
  };
  if (look.state !== "live" || !look.mayDecide || look.proposal.revising) {
    await cannot(look.state === "live" ? noticeView(card, CANNOT_EDIT, titleOf(look.proposal)) : closedView(card, look));
    return;
  }
  const drafts = draftValuesOf(look.proposal);
  const fields = fieldsFromBlocks(request.blocks).filter((f) => f.kind === "select");
  const shown = (kept: Readonly<Record<string, string>>) =>
    new Map(fields.map((f) => [f.key, kept[f.key] ?? drafts.get(f.key) ?? f.value] as const));

  // Held as a change from nothing, so a pick is always checked against the
  // options the view offered, whatever it showed before.
  const field = fields.find((f) => f.key === pick.key);
  const checked = field && drafts.has(pick.key) ? checkFieldEdits([{ ...field, value: "" }], stateOf({ [pick.key]: pick.value })) : null;
  if (!checked?.ok) {
    const alert = checked?.alert ?? "That field can't be edited here now. Use Needs changes to ask for a revision.";
    await deps.views.update(request.viewId, editView(card, fields, shown(look.kept), alert));
    return;
  }
  const kept = await deps.threadState
    .keepPick(card.ts, request.userId, pick.key, drafts.get(pick.key) === pick.value ? null : pick.value)
    .catch(() => null);
  if (!kept) {
    await cannot(noticeView(card, CANNOT_EDIT, titleOf(look.proposal)));
    return;
  }
  await deps.views.update(
    request.rootViewId,
    draftView(card, look.proposal, { mayDecide: true, confirmers: look.confirmers }, { edits: kept, editable: true, ...databasesOf(deps) }),
  );
  // An alert from a refused pick goes once a pick passes.
  if (request.blocks.some((b: unknown) => (b as { type?: string }).type === "alert")) {
    await deps.views.update(request.viewId, editView(card, fields, shown(kept)));
  }
  console.log(`[review] pick kept on ${card.channel}/${card.ts} by=${request.userId} fields=${Object.keys(kept).length}`);
}

const CANNOT_EDIT = "This proposal can't be edited from here now.";

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
    await show(stateView(card, "warning", "Needs changes needs a note. Press Review again, choose Needs changes and write what to change."));
    return;
  }

  // One of the card's own answers: held to the card's own list, whose verdict
  // decides and whose args the write carries. A card no longer live gets the
  // Gate's own answer below.
  let own: ReviewChoice | undefined;
  const look = await deps.threadState.getProposalByTs(request.messageTs).catch(() => ({ state: "none" }) as const);
  const live = look?.state === "found" ? look.proposal : undefined;
  // Every answer from here is titled for the card's tool, as this one read
  // found it: live, decided, expired or replaced alike.
  const title = lookupTitle(look);
  const notice = (text: string) => noticeView(card, text, title);
  if (live?.choices?.length && !request.choice) {
    await show(notice("Choose one of this card's answers. Press Review again."));
    return;
  }
  if (request.choice) {
    own = live?.choices?.find((c) => c.value === request.choice);
    if (live && !own) {
      await show(notice("That answer isn't on this card any more, so nothing changed. Press Review again."));
      return;
    }
  }
  const decision: ReviewDecision = own?.verdict ?? request.decision;

  // Only Approve writes, so only Approve's edits are checked and carried: the
  // picks this person kept on the card's record, and what was typed in place.
  const kept = look?.state === "found" ? look.kept?.[request.userId] : undefined;
  const edits =
    decision === "confirm"
      ? await reviewEdits({ ...request, ...(kept ? { kept } : {}), ...(live ? { staged: live } : {}) }, deps)
      : { ok: true as const, edited: [], changes: [] };
  if (!edits.ok) {
    console.log(`[review] edit refused on ${request.channel}/${request.messageTs} by=${request.userId}`);
    await show(edits.view);
    return;
  }
  const operations =
    own?.args && decision === "confirm" && live ? withArgs(edits.operations ?? proposalOperations(live), own.args) : edits.operations;
  const steps = live && edits.operations ? issueStepChanges(proposalOperations(live), edits.operations) : [];
  const verdict = await resolveSignal(
    {
      kind: "review",
      messageTs: request.messageTs,
      decision,
      userId: request.userId,
      ...(note ? { note } : {}),
      ...(operations ? { operations } : {}),
    },
    { ...gateDeps, proposalRead: { ts: request.messageTs, lookup: look } },
  );
  console.log(
    `[review] ${decision}${own ? ` (${own.value})` : ""} on ${request.channel}/${request.messageTs} by=${request.userId} outcome=${verdict.outcome}`,
  );

  if (decision === "revise") {
    await applyRevise(request, card, verdict, deps, title);
    return;
  }

  // Said in the pop-up before the run starts, so the person sees it register
  // at once rather than after a write that can take a while.
  if (verdict.outcome === "won") {
    await show(stateView(card, decision === "confirm" ? "success" : "info", own ? ownLine(own) : decidedLine(decision), titleOf(live ?? verdict.proposal)));
  } else if (verdict.post && verdict.post.note.kind !== "cut-off") {
    // A non-win is answered where the person is looking, which is the pop-up
    // — even a note the button door would edit onto the card.
    await show(notice(renderGateNote(verdict.post.note)));
    return;
  }
  await applyPressVerdict(
    { channel: request.channel, messageTs: request.messageTs, decision, userId: request.userId, ...(own ? { as: { value: own.value, label: own.past ?? own.label, ...(own.decided ? { decided: own.decided } : {}) } } : {}) },
    verdict,
    {
      delivery: deps.delivery,
      applyVerdict: deps.applyVerdict,
      restage: deps.restage,
      // A non-win is answered where the person is looking, which is the pop-up.
      replyEphemeral: async (text) => void (await show(notice(text))),
      // The card records who edited what, above who decided, and from then on
      // says what was approved: the edited values, not the draft's, which is
      // also what View opens.
      // A field's own line, and any step line that names it: a cleared
      // comment leaves an issue follow-up's steps too.
      reword: (text, note) => ({
        text: edits.changes.length ? withEditedFields(text, [...edits.changes, ...steps]) : text,
        note: edits.edited.length ? `${editedNote(request.userId, edits.edited)}\n${note}` : note,
        edited: edits.changes.length > 0,
      }),
      replaceCard: (message) => deps.updateCard(request.channel, verdict.proposal?.item?.messageTs ?? request.messageTs, message),
      reports: deps.threadState,
      threadState: deps.threadState,
      ...(deps.now ? { now: deps.now } : {}),
    },
  );
  // A cut-off card speaks in the thread, and the pop-up points there.
  if (verdict.post?.note.kind === "cut-off") {
    await show(notice(renderGateNote(verdict.post.note)));
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
  title?: string,
): Promise<void> {
  if (verdict.outcome !== "won" || !verdict.revise || !verdict.proposal) {
    if (verdict.post) await showIn(request, deps)(noticeView(card, renderGateNote(verdict.post.note), title));
    return;
  }
  await showIn(request, deps)(
    stateView(
      card,
      "info",
      verdict.proposal.afterNeedsChanges ?? (verdict.proposal.item ? "Sent back with your note. I'm revising the draft, and its card shows the revision once it is ready." : "Sent back with your note. I'm revising the draft, and the new card posts in the thread."),
      titleOf(verdict.proposal),
    ),
  );
  // Live, not decided: nothing is decided until the revision replaces it, and
  // a revision that never comes hands the card back (`startRevision`, Turn's
  // unlock). Review stays, and opens on "being revised" meanwhile.
  const { item } = verdict.proposal;
  const message = item
    ? await settleItem(deps.threadState, item, { kind: "changes-asked", by: request.userId }, (deps.now ?? Date.now)())
    : decidedCard(
        verdict.proposal,
        `Needs changes, asked by <@${request.userId}>. It's being revised, and the new card follows in the thread.`,
        verdict.proposal.proposalText,
        { button: "Review" },
      );
  if (message) await deps.updateCard(request.channel, item?.messageTs ?? request.messageTs, message);
  await deps.revise({ proposal: verdict.proposal, note: verdict.revise.note, userId: request.userId });
}

/**
 * What the revision turn's message says before the note: the asker's own
 * reply as the turn reads it. A card that revises its own way (a Figma
 * comment decision, `figma-comments/revise.ts`) reads the note after it.
 */
export const NEEDS_CHANGES_LEAD = "Needs changes on the proposal card above: ";

/**
 * The card a Needs changes sent back, as its revision turn revises it: the
 * one the note names, not the thread's newest — a report holds one card per
 * item in one thread. Null once it is decided, replaced or closed.
 *
 * @param store - The thread store
 * @param key - The card's key, as the note carries it (`SlackMessageEvent.revises`)
 */
export async function cardSentBack(store: Pick<ThreadState, "getProposalByTs">, key: string): Promise<PendingProposal | null> {
  const look = await store.getProposalByTs(key);
  return look.state === "found" ? look.proposal : null;
}

/** What starting a revision needs: Slack, bound once in `slack/interactive.ts`. */
export interface RevisionDeps {
  threadState: ThreadState;
  /** Post a line in the card's thread: the ts it landed on, or null. */
  postInThread(text: string): Promise<string | null>;
  /** Queue the revision turn on the posted note, as the asker's own reply. */
  queueTurn(noteTs: string): Promise<void>;
  /** Edit the card's message in place (`chat.update`): an item's report
   *  message, or the card's own. */
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
    .postInThread(`<@${userId}> asked for changes: ${escapeSlackText(note)}`)
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
  // An item goes back to open on its report; any other card to how it posted.
  const live = proposal.item
    ? await settleItem(deps.threadState, proposal.item, { kind: "open" }, Date.now()).catch(() => null)
    : liveCard(proposal);
  if (live) await deps.updateCard(live).catch(() => {});
  await deps
    .postInThread(":warning: I couldn't start the revision. Reply here with what to change and I'll revise the draft.")
    .catch(() => null);
}

/** A state's title: the card's own, where the view has the card. */
function titleOf(proposal: PendingProposal | undefined): string | undefined {
  return proposal ? reviewTitle(proposalOperations(proposal)) : undefined;
}

/** The card's title, as one lookup of it found the card: live, kept decided,
 *  or expired or replaced with its batch named. A card with no record left
 *  keeps the generic title: nothing cheap says what it was. */
function lookupTitle(look: ProposalLookup): string | undefined {
  return look.state === "found" ? titleOf(look.proposal) : closedTitle(look);
}

/** What the pop-up says once one of the card's own answers wins: the answer,
 *  then what happens next. */
function ownLine(own: ReviewChoice): string {
  return own.verdict === "confirm"
    ? `${own.label}. I'm running it now. The outcome posts in the thread.`
    : `${own.label}. Nothing will run.`;
}

function decidedLine(decision: "confirm" | "cancel"): string {
  return decision === "confirm"
    ? "Approved. I'm running it now. The outcome posts in the thread."
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
 * The edits arrive as the picks the person kept on the card's record (`kept`)
 * and as a state with the fields it was offered with (`state`, `fields`).
 *
 * A TYPED VALUE IS MEASURED AGAINST THE STAGED ONE (`staged`, the card as the
 * decision read it), never against what its input opened with: a draft
 * redrawn around a refused value opens with that value, and pressing Approve
 * again without touching it must be refused again, not read as no edit.
 *
 * READS ONLY FOR WHAT CHANGED. No edit costs no read beyond the claim's own;
 * otherwise only a select an edit names has its options read again.
 */
export async function reviewEdits(
  request: Pick<ReviewDecisionRequest, "channel" | "messageTs" | "userId" | "state" | "fields"> & {
    kept?: Readonly<Record<string, string>>;
    staged?: PendingProposal;
  },
  deps: Pick<ReviewDoorDeps, "threadState" | "standingConfirmers" | "fieldOptions" | "notionDatabases">,
): Promise<
  | { ok: true; operations?: ProposalOperation[]; edited: string[]; changes: FieldChange[] }
  | { ok: false; view: Record<string, unknown> }
> {
  const saved = request.kept && Object.keys(request.kept).length ? request.kept : undefined;
  if (!saved && !request.state) return { ok: true, edited: [], changes: [] };
  // Kept picks and the fields in place together; a field in place wins.
  const state: ReviewViewState = { ...(saved ? stateOf(saved) : {}), ...(request.state ?? {}) };
  const changed =
    saved || request.fields
      ? new Set([...Object.keys(saved ?? {}), ...(request.fields && request.state ? changedKeys(request.fields, request.state, request.staged) : [])])
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
        {
          edits: saved ?? {},
          ...(request.fields && request.state ? { typed: stateValues(request.fields, request.state) } : {}),
          editable: true,
          alert: { level: "error", text: checked.alert },
          ...databasesOf(deps),
        },
      ),
    };
  }
  return checked.edited.length
    ? { ok: true, operations: checked.operations, edited: checked.edited, changes: checked.changes }
    : { ok: true, edited: [], changes: [] };
}

/** The keys of the fields `state` holds at something other than the staged
 *  value, or, with no card to read it from, the value the pop-up opened with. */
function changedKeys(fields: readonly EditableField[], state: ReviewViewState, staged?: PendingProposal): Set<string> {
  const values = stateValues(fields, state);
  const drafts = staged ? draftValuesOf(staged) : undefined;
  return new Set(fields.filter((f) => values.has(f.key) && values.get(f.key) !== (drafts?.get(f.key) ?? f.value)).map((f) => f.key));
}
