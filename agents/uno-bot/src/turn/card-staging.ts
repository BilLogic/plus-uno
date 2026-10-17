// Card staging — building a card for a batch and putting it into its matter's
// slot.
//
// Three doors stage a card, and they must stage the same card: a turn whose
// model proposed a batch (`runTurn`), a button that asked for one with no
// model in the loop (`stageFromButton`), and a cut-off run put back in front
// of a person (`restageExecution`). Each reads the same parts — the card the
// batch gets (`buildCard`), what each page says now (`batchBefore`), the
// deadline it says and the lifetime it keeps (`cardWindow`), and the record of
// what Slack took, in its slot (`stagedTurnCard`) — so a card looks and lives
// the same whichever door put it up.
//
// AND THE CARD IS DATA (#623). `buildCard` decides which card a staged
// proposal gets, what verb names it, which caveats a person must see and which
// batch the ✅ runs; `Delivery.card` is the hand-over, and
// `slack/proposal-render.ts` decides how all of that reads. Nothing here
// spells Slack mrkdwn, and the reads a card needs — a page's diff, an issue's
// repo — arrive as `TurnDeps.cards`, never a client of their own.
//
// Its own module because it changes for its own reasons: a new card kind, a
// new caveat or a new staging door edits this file and leaves the turn loop
// (`turn.ts`), the blueprint check offer (`check-offer.ts`) and settlement
// (`settlement.ts`) alone. Which waiting card a new card replaces is
// `card-matter.ts`'s; this module stages into the slot that call names.
//
// PURE as the turn is: no `Env`, no Workers type, no fetch.

import type { AgentResult } from "../agent/loop";
import { cardHeadline } from "../agent/card-identity";
import { collectStrings } from "../agent/tool-input";
import { gateWordsFor } from "../agent/tool-table";
import { cardExpiresAt } from "../card-expiry";
import type { GateRestage } from "../gate/index";
import { sweepShareCard, SWEEP_SHARE_KEY } from "../sweep/share";
import {
  inheritedTerms,
  ownBlocks,
  proposalTtlMs,
  stagingCardOf,
  turnCardKey,
  type PendingProposal,
  type ProposalOperation,
} from "../thread-state/index";
import { describeIssueUpdate, issueUpdateFromInput, type IssueUpdate } from "../tools/github-issue-update-render";
import { relayRecipientId } from "../tools/relayed-dm-render";
import {
  recordProposalEvents,
  stagedEvent,
  storesChannel,
  supersededEvents,
  type ProposalEventLog,
  type StagedAs,
} from "../usage/index";
import type {
  CardAsk,
  CardCaveat,
  CardField,
  CardRevision,
  CardRow,
  PostResult,
  ProposalCard,
} from "./delivery";
import type { CardAsked, TurnDeps, TurnRequest, TurnUsage } from "./turn";

/**
 * The thread a card is staged in and the ask it answers — what every card
 * Turn stages, and every Check it offer, keeps of where it came from.
 */
export type CardOrigin = Pick<PendingProposal, "channel" | "threadTs" | "replyTs" | "userMsgTs" | "requesterUserId">;

/**
 * The conversation a card stages in, as the usage record reads it: where it
 * is answered and whose conversation it is (`usage/record.ts` `storesChannel`).
 */
export type CardConversation = Pick<TurnRequest, "surface" | "conversationType">;

/** A request's card origin: its reply thread and its asker. */
export function cardOriginOf(request: TurnRequest): CardOrigin {
  return {
    channel: request.channel,
    threadTs: request.conversationTs,
    ...(request.replyTs ? { replyTs: request.replyTs } : {}),
    userMsgTs: request.userMsgTs,
    requesterUserId: request.userId,
  };
}

/** A request's conversation, as `CardConversation`. */
export function cardConversationOf(request: TurnRequest): CardConversation {
  return {
    surface: request.surface,
    ...(request.conversationType ? { conversationType: request.conversationType } : {}),
  };
}

/**
 * The record of a card Turn staged, a turn's and a button's alike: the batch,
 * where it came from, what Slack took, and its slot.
 *
 * Its slot is its matter (`turnCardKey`): a revision is staged into the slot
 * of the card it supersedes, and a separate proposal opens one of its own,
 * named by this card, so it posts beside the waiting cards and retires none.
 * A revision of a card staged before slots were keyed stays in the thread's
 * slot, which retires that card.
 */
export function stagedTurnCard(card: {
  operations: ProposalOperation[];
  toolName: string;
  input: PendingProposal["input"];
  origin: CardOrigin;
  posted: PostResult & { ts: string };
  ttlMs: number;
  before: { before?: Record<string, string> };
  /** The card this one revises, when it revises one. */
  replaced: PendingProposal | null | undefined;
  stagedAs: StagedAs;
}): PendingProposal {
  const { origin, posted, replaced } = card;
  return {
    // The WHOLE batch, untruncated: what the card renders is a rendering, and
    // what a later ✅ executes is this list.
    operations: card.operations,
    toolName: card.toolName,
    input: card.input,
    channel: origin.channel,
    threadTs: origin.threadTs,
    ...(origin.replyTs ? { replyTs: origin.replyTs } : {}),
    userMsgTs: origin.userMsgTs,
    proposalTs: posted.ts,
    // What the adapter actually posted — or, for an item revised in place,
    // what the report's port spelled for its Review — never a copy rendered
    // here: the button door re-renders the resolved card from this field, so
    // a second rendering that drifted would repaint the card with words it
    // never had (#623).
    proposalText: posted.text,
    ...ownBlocks(posted),
    requesterUserId: origin.requesterUserId,
    ttlMs: card.ttlMs,
    ...card.before,
    // A revision is held to the terms of the card it replaces — who may
    // confirm it. A fresh card has none and gets the defaults.
    ...inheritedTerms(replaced),
    // And names it, for the usage record's "approved with edits".
    ...(replaced ? { revisesProposalTs: replaced.proposalTs } : {}),
    stagedAs: card.stagedAs,
    ...(replaced
      ? replaced.supersedeKey
        ? { supersedeKey: replaced.supersedeKey }
        : {}
      : { supersedeKey: turnCardKey(posted.ts) }),
  };
}

/**
 * The deadline a card says and the lifetime it is staged with, from ONE
 * reading of the clock (#1316), so the deadline shown is the one enforced.
 * The store counts `ttlMs` from its own clock a hop later: the card lives
 * those milliseconds past what it says, and never a weekend past it, as
 * stamping the rule from the store's clock would when the hop crosses
 * Saturday 00:00 ET.
 *
 * @param stagedAt - The clock as the card goes up
 * @param leftMs - The lifetime the card keeps — what is left of the window a
 *   revision keeps; absent, the one rule's (`cardExpiresAt`)
 */
export function cardWindow(stagedAt: number, leftMs?: number): { expiresAt: number; ttlMs: number } {
  const expiresAt = leftMs === undefined ? cardExpiresAt(stagedAt) : stagedAt + leftMs;
  return { expiresAt, ttlMs: expiresAt - stagedAt };
}

/** Fresh page reads a batch may spend on Before beyond the card's own read.
 *  Each is a page and its blocks, so the bound keeps a long batch from eating
 *  the subrequests its card still needs; a read the turn already made is
 *  free and not counted. */
export const BEFORE_READS_PER_BATCH = 3;

/**
 * Each value the batch replaces, as the pages say now, keyed `<op>.<path>`
 * (`PendingProposal.before`). The first operation's comes off the card's own
 * read; every later `notion_update` is read on its own, up to
 * `BEFORE_READS_PER_BATCH` fresh reads. An operation past the bound keeps
 * what a cached read finds, and Review says what was not captured.
 */
export async function batchBefore(
  operations: readonly ProposalOperation[],
  revision: CardRevision | undefined,
  cards: TurnDeps["cards"],
): Promise<{ before?: Record<string, string> }> {
  const found: Array<[string, string]> = Object.entries(revision?.before ?? {}).map(([path, value]) => [`0.${path}`, value]);
  let reads = 0;
  for (const [i, op] of operations.entries()) {
    if (op.toolName !== "notion_update" || (i === 0 && revision)) continue;
    const mayRead = reads < BEFORE_READS_PER_BATCH;
    const got = await cards.notionBefore(op.input, { mayRead });
    if (got.read) reads += 1;
    for (const [path, value] of Object.entries(got.before)) found.push([`${i}.${path}`, value]);
  }
  if (operations.length > 1) console.log(`[turn] before: ${reads} fresh page read(s) for ${operations.length} operations`);
  return found.length ? { before: Object.fromEntries(found) } : {};
}

/**
 * How long a live card has left before its deadline — its staging time plus
 * its own lifetime — or 0 once it is no longer live. A sweep card's revision
 * lives for this rather than a fresh lifetime.
 */
export async function timeLeftOn(
  card: PendingProposal,
  threadState: TurnDeps["threadState"],
  now: number,
): Promise<number> {
  const live = await threadState.getProposalByTs(card.proposalTs);
  return live.state === "found" ? Math.max(0, live.createdAt + proposalTtlMs(card) - now) : 0;
}

/**
 * Put what a cut-off run never finished in front of a person again, as a fresh
 * card — the one way anything of it runs a second time.
 *
 * The card is built exactly as a staged proposal's is, reads included (the
 * repo an intake lands in and whether it is public, a workflow's branch), so
 * the person approves what will actually run rather than a copy of the old
 * card. It keeps the original's requester, thread, PRD and confirmer set, and
 * gets a ts and a window of its own: a re-staging is a fresh staging, so it
 * lives by the one rule from the turn's clock, never the window the stuck
 * card was staged with days before; staging it retires any card still live in
 * that reply thread, as every staging does (`ThreadState.putProposal`).
 *
 * Exported because two doors outside Turn — the reaction and the button on the
 * stuck card — are later looks too, and a card is Turn's to build. Their
 * envelopes bind this with the same card reads a turn gets.
 *
 * @returns the staged card, or null when Slack refused it — said out loud, as
 *          every failed staging is
 */
export async function restageExecution(
  restage: GateRestage,
  deps: Pick<TurnDeps, "threadState" | "delivery" | "cards" | "onRestaged" | "now"> & {
    /** Where the fresh card's staging is recorded. */
    proposalEvents: ProposalEventLog;
  },
): Promise<{ proposal: PendingProposal; card: ProposalCard } | null> {
  const original = restage.proposal;
  const first = restage.operations[0]!;
  // A group DM's share card is rebuilt as one, so a re-staged card still
  // quotes the exact note its ✅ posts (`sweep/share.ts`).
  const built =
    original.supersedeKey === SWEEP_SHARE_KEY
      ? sweepShareCard(restage.operations)
      : await buildCard(
          { kind: "proposal", operations: restage.operations, toolName: first.toolName, input: first.input },
          deps,
          // The card's DM caveats follow the surface, and a DM channel is the one
          // the proposal record can still name.
          original.channel.startsWith("D"),
          { channel: original.channel, requestedBy: original.requesterUserId },
        );
  // The warning rides the card, not only the note before it: a note that
  // failed to post must not leave a card that reads like any other.
  const before = await batchBefore(restage.operations, built.revision, deps.cards);
  // A fresh card, on a fresh window: the one rule's, from now — said on the
  // card, and stored. Every card carries a ttlMs now, so the stuck card's
  // would keep a window that may have run from a Friday.
  const now = deps.now ?? Date.now;
  const window = cardWindow(now());
  const card: ProposalCard = {
    ...built,
    caveats: [{ kind: "cut-off-rerun" }, ...built.caveats],
    expiresAt: window.expiresAt,
  };
  const posted = await deps.delivery.card(card);
  // Declined on an answer-only surface: nothing re-staged, and nothing failed.
  if (posted.declined) return null;
  if (!posted.ok || !posted.ts) {
    console.error(`[turn] re-staged card was not posted (${first.toolName})`);
    await deps.delivery.postFailure("delivery");
    return null;
  }
  // A group DM's share is not carried over: only the card people were shown
  // offers one (`sweep/share.ts`). Nor are a stated card's own words: the
  // fresh card is an ordinary one, with a ⚠️, and the gate's shared lines fit
  // it. Nor are a sweep card's fixes: the fresh card holds
  // what never ran, so they no longer line up with its operations. Nor are
  // the old card's blocks: the fresh card went up with its own.
  // Nor is its Before: it was keyed on the old batch's operations, so the
  // fresh one is read for the batch that will run. Nor are a stated card's
  // facts, for the same reason as its words: Review shows the fresh card's
  // text, cut-off warning and all.
  const { sweepShare: _sweepShare, stated: _stated, fixes: _fixes, proposalBlocks: _blocks, before: _before, facts: _facts, ...kept } = original;
  const proposal: PendingProposal = {
    ...kept,
    operations: restage.operations,
    toolName: first.toolName,
    input: first.input,
    proposalTs: posted.ts,
    proposalText: posted.text,
    ...ownBlocks(posted),
    ...before,
    ttlMs: window.ttlMs,
    // The ask's own card, carried across however many re-stagings.
    originProposalTs: stagingCardOf(original),
  };
  const { retired } = await deps.threadState.putProposal(proposal);
  // The fresh card is the ask's card's successor on the record: through
  // `originProposalTs` it takes that card's turn, channel and test-traffic
  // flag, so a ticket its ✅ files still finds the turn that asked for it.
  await recordProposalEvents(deps.proposalEvents, [
    ...supersededEvents(retired, now(), "restage"),
    stagedEvent({
      proposal,
      at: now(),
      via: "restage",
      channelStored: false,
    }),
  ]);
  await deps.onRestaged?.(original, proposal).catch((err: unknown) => {
    console.error(`[turn] re-staged card's records not moved: ${err instanceof Error ? err.message : String(err)}`);
  });
  return { proposal, card };
}

/**
 * What a button asks Turn to stage (#1323), with no model in the loop: the
 * batch is already decided, and Turn builds and stages the card for it.
 */
export type ButtonStaging = (
  /** A revision of a waiting card: staged in its slot, held to its confirmer
   *  set, and superseding it, as a turn's revision is. */
  | { kind: "revision"; of: PendingProposal; operations: ProposalOperation[] }
  /** A separate proposal in a thread: a slot of its own, retiring nothing. */
  | { kind: "separate"; thread: CardOrigin; operations: ProposalOperation[] }
) & {
  /** The conversation the card stages in, as the turn that began the matter
   *  had it: whether the card is a DM's, and whether the usage record may
   *  name the channel. */
  conversation: CardConversation;
};

/**
 * Stage a card a button asked for — a check's notes added to the card, or
 * the page an approved PRD created updated with them (`slack/blueprint-check.ts`).
 * The card is built exactly as a staged proposal's is, reads included, and
 * gets the one rule's deadline from now. A revision retires the card it
 * replaces first, says so just above the new card, and keeps its matter's
 * slot and its confirmers; a separate proposal opens a slot of its own.
 *
 * Exported because a button is a door outside Turn, and a card is Turn's to
 * build. The envelope binds this with the card reads a turn gets.
 *
 * @returns the staged card, or null when the card to revise is no longer
 *          live, or Slack refused the new one — said out loud, as every
 *          failed staging is
 */
export async function stageFromButton(
  ask: ButtonStaging,
  deps: Pick<TurnDeps, "threadState" | "delivery" | "cards" | "now"> & {
    /** Where the card's staging is recorded, and how long a write may take. */
    usage: Pick<TurnUsage, "proposalEvents" | "writeTimeoutMs">;
  },
): Promise<PendingProposal | null> {
  const { proposalEvents, writeTimeoutMs } = deps.usage;
  const origin: CardOrigin = ask.kind === "revision" ? ask.of : ask.thread;
  const replaced = ask.kind === "revision" ? ask.of : null;
  const first = ask.operations[0]!;
  // One reading of the clock: the card's deadline and its record.
  const at = deps.now?.() ?? Date.now();
  // What the card being replaced had left, read before it is retired, so a
  // revision that never stages gives it back for that long — as a turn's does.
  const replacedLeftMs = replaced ? await timeLeftOn(replaced, deps.threadState, at) : undefined;
  // Out of reach before the revision is written, as a turn's revision is: the
  // old card must not run while its replacement is being built.
  const retiredAhead = replaced ? await deps.threadState.retireProposal(replaced.proposalTs) : null;
  if (retiredAhead && !retiredAhead.retired) return null;
  // Superseded on the record only once its revision stages; a card that
  // cannot be put back is out of reach after all, and recorded so.
  const recordReplaced = () =>
    replaced
      ? recordProposalEvents(proposalEvents, supersededEvents([replaced.proposalTs], at, "revision"), writeTimeoutMs)
      : Promise.resolve();
  const giveBackReplaced = async (): Promise<void> => {
    if (!replaced) return;
    try {
      await deps.threadState.putProposal({ ...replaced, ttlMs: replacedLeftMs });
    } catch (err) {
      console.error(`[turn] ${replaced.proposalTs} not given back: ${err instanceof Error ? err.message : String(err)}`);
      await recordReplaced();
    }
  };
  const built = await buildCard(
    { kind: "proposal", operations: ask.operations, toolName: first.toolName, input: first.input },
    deps,
    ask.conversation.surface === "assistant",
    { channel: origin.channel, requestedBy: origin.requesterUserId },
  );
  const before = await batchBefore(ask.operations, built.revision, deps.cards);
  const window = cardWindow(at);
  const posted = await deps.delivery.card(
    { ...built, expiresAt: window.expiresAt },
    replaced ? { kind: "revised", replaced: cardHeadline(replaced) } : undefined,
  );
  if (posted.declined) {
    await giveBackReplaced();
    return null;
  }
  if (!posted.ok || !posted.ts) {
    console.error(`[turn] card from a button was not posted (${first.toolName})`);
    await giveBackReplaced();
    await deps.delivery.postFailure("delivery");
    return null;
  }
  const proposal: PendingProposal = {
    ...stagedTurnCard({
      operations: ask.operations,
      toolName: first.toolName,
      input: first.input,
      origin,
      posted: { ...posted, ts: posted.ts },
      ttlMs: window.ttlMs,
      before,
      replaced,
      stagedAs: ask.kind,
    }),
    // The notes go on the same PRD: a revision keeps the page its card names.
    ...(replaced?.notionPrdId ? { notionPrdId: replaced.notionPrdId } : {}),
    ...(replaced?.notionPrdUrl ? { notionPrdUrl: replaced.notionPrdUrl } : {}),
  };
  const { retired } = await deps.threadState.putProposal(proposal);
  await recordReplaced();
  await recordProposalEvents(
    proposalEvents,
    [
      ...supersededEvents(retired, at, "revision"),
      stagedEvent({
        proposal,
        at,
        via: "worker",
        // Named on the record by the turns' own rule: a DM or a group DM
        // names no channel.
        channelStored: storesChannel(ask.conversation.surface, ask.conversation.conversationType),
        stagedAs: ask.kind,
      }),
    ],
    writeTimeoutMs,
  );
  return proposal;
}

// ── Cards ────────────────────────────────────────────────────────────────────

/**
 * The card for one staged Proposal: what a person is being asked to approve, as
 * DATA.
 *
 * It used to be a Slack string — `formatProposal` and `withOperationPlan`
 * called from here, plus a list of follow-up messages handed back to be posted
 * — and so the turn owned an `:warning:`, a confirm footer and Slack's
 * message-size limits (#623). What it owns now is the decisions: which card
 * this is, which verb names it, which caveats a person must see, and the WHOLE
 * batch the one ✅ runs. `slack/proposal-render.ts` § `renderProposalCard`
 * decides how all of that reads, and `Delivery.card` reports back what
 * it actually posted.
 *
 * The card is still the SOURCE OF TRUTH for what a ✅ runs: `operations` is the
 * batch untruncated, which is what lets the adapter group and never summarize
 * it away.
 */
export async function buildCard(
  result: Extract<AgentResult, { kind: "proposal" }>,
  deps: Pick<TurnDeps, "cards">,
  fromDm: boolean,
  at: CardAsked,
): Promise<ProposalCard> {
  const card = await cardOf(result, deps, fromDm, at);
  // Who wrote the opening line (no reader since the eval envelope went): the model when its own
  // reply leads, the Worker for everything else — its ask, its PRD line, or a
  // lead that is only its "I could not stage …" note.
  const modelLed = !card.ask && !!result.replyText && card.lead === result.previewText;
  return card.ask || card.lead ? { ...card, leadBy: modelLed ? "model" : "worker" } : card;
}

/** Where each share-out in a batch posts, from the executor's own rule, so the
 *  plan groups it there (`ProposalCard.places`). Nothing for a single
 *  operation, which has no plan, or a batch with no share-out. */
async function shareoutPlacesOf(
  operations: ProposalOperation[],
  deps: Pick<TurnDeps, "cards">,
  at: CardAsked,
): Promise<{ places?: Array<string | null> }> {
  if (operations.length <= 1 || !operations.some((op) => op.toolName === "shareout_post")) return {};
  const places: Array<string | null> = [];
  for (const op of operations) places.push(op.toolName === "shareout_post" ? await deps.cards.shareoutWhere(op.input, at) : null);
  return { places };
}

/** The card itself, before who-wrote-the-lead is marked. */
async function cardOf(
  result: Extract<AgentResult, { kind: "proposal" }>,
  deps: Pick<TurnDeps, "cards">,
  fromDm: boolean,
  at: CardAsked,
): Promise<ProposalCard> {
  const { toolName, input, operations } = result;
  const card: ProposalCard = {
    kind: toolName === "notion_update" ? "revision" : "confirm",
    verb: verbFor(toolName),
    ...(result.previewText ? { lead: result.previewText } : {}),
    fields: cardFieldsOf(input),
    caveats: caveatsFor(toolName, input, result.previewText),
    operations: result.operations,
    ...(await shareoutPlacesOf(operations, deps, at)),
  };

  // THE ASK, when the model staged an intake and wrote no line of its own
  // beside it: the card leads with where it goes and whether to file, so the
  // requester is never handed a card and silence. Read off the model's reply,
  // not the preview — a Worker "I could not stage …" note is not a reply.
  // Absent `replyText` is a card no model turn produced (a restage, a sweep
  // revision), and those get none. Only the intake cards get one, and only
  // when the WHOLE batch is one tool on one target — a mixed batch has no one
  // line that is true of it, and every other card's heading and footer
  // already say what the ✅ does.
  const silent = result.replyText === "";
  const sameTool = operations.every((op) => op.toolName === toolName);
  const ask = (made: CardAsk | null): { ask?: CardAsk } => (silent && sameTool && made ? { ask: made } : {});

  if (toolName === "shareout_post") {
    // THE PLACE, named the way the issue card names its repo: a share-out
    // posts to #plus-design-feedback, stays in the asking conversation, or
    // posts in a channel the asker named, and the heading says which — read
    // from the executor's own decision, so the card never names one place
    // while the ✅ posts to another. A batch that posts to two places names
    // neither on the verb; its plan's group headings name each.
    const where = new Set(card.places?.filter((p): p is string => p !== null) ?? [await deps.cards.shareoutWhere(input, at)]);
    return where.size === 1 ? { ...card, verb: `${card.verb} in ${[...where][0]}` } : card;
  }
  if (toolName === "github_issue_create") {
    // THE REPO AND WHO CAN READ IT: an intake on a public repo is readable by
    // anyone the moment it is filed, and the card is the one place a person
    // reads the body before it goes out — so the heading names the repo the
    // Worker files into, and the caveat says whether it is public. A redirect
    // ("put it on plus-uno instead") is a new card, naming the new repo.
    const { repo, visibility } = await deps.cards.issueTarget(input);
    return {
      ...card,
      verb: `${card.verb} on ${repo}`,
      ...ask(silent && sameTool && (await oneRepo(operations, repo, deps)) ? { kind: "file-issue", repo } : null),
      caveats: [{ kind: "repo-visibility", repo, visibility, ...(fromDm ? { fromDm: true as const } : {}) }],
    };
  }
  if (toolName === "github_issue_update") {
    const { updates, ...update } = await issueUpdateCardOf(operations, deps, fromDm);
    return { ...card, ...update, ...ask(updateAskOf(updates)) };
  }
  if (toolName === "notion_create") {
    // THE SURFACE, named the way the issue card names its repo: an intake is
    // a GitHub issue or a Roadmap card, and a requester redirects by surface
    // ("put it on the Roadmap instead") — so the heading says which this is.
    const verb = NOTION_SURFACE_VERBS[surfaceOf(input)];
    return {
      ...card,
      ...(verb ? { verb } : {}),
      ...ask(operations.every((op) => surfaceOf(op.input) === "intake") ? { kind: "roadmap-intake" } : null),
    };
  }

  if (toolName === "github_workflow_run") {
    // What the ✅ starts, in full: the repo, the workflow, and the branch it
    // runs on — always the default one, named rather than left to a guess,
    // and a failed read of it said plainly rather than papered over.
    const target = await deps.cards.workflowTarget(input);
    return target
      ? {
          ...card,
          fields: cardFieldsOf({
            repo: target.repo,
            workflow: input.workflow,
            branch:
              target.branch ??
              "couldn't read the default branch — it will run on whatever GitHub's default is",
          }),
        }
      : card;
  }

  if (toolName === "notion_update") {
    // The conversational card: the diff leads, and there is no ⚠️ preamble —
    // the lead, the named page and the `current → new` lines speak for
    // themselves. The read behind it is a named client's.
    return { ...card, revision: await deps.cards.notionRevision(input), fields: [] };
  }
  if (toolName === "notion_archive") {
    const target = await deps.cards.notionTarget(input);
    return target ? { ...card, target } : card;
  }
  if (toolName === "dm_relay") return { ...card, fields: relayFieldsOf(result.operations) };
  return card;
}

/** A `notion_create` card's heading, by the `surface` it files on. A surface
 *  not listed keeps the row's own verb. */
const NOTION_SURFACE_VERBS: Readonly<Record<string, string>> = {
  prd: "create this card on the Roadmap board",
  intake: "create this card on the Roadmap board",
  decision: "log this decision in the Decisions DB",
};

function surfaceOf(input: Record<string, unknown>): string {
  return String(input.surface ?? "").trim().toLowerCase();
}

/** Every issue create in the batch files on `repo` — each read through the
 *  same `issueTarget` the heading's repo was, so a batch across two repos is
 *  never announced as filing on one. */
async function oneRepo(
  operations: ReadonlyArray<ProposalOperation>,
  repo: string,
  deps: Pick<TurnDeps, "cards">,
): Promise<boolean> {
  for (const op of operations.slice(1)) {
    if ((await deps.cards.issueTarget(op.input)).repo !== repo) return false;
  }
  return true;
}

/** One issue follow-up, as the ask reads it: the target, and what happens —
 *  `null` where the input did not read, which is a case for no line at all. */
type UpdateAskPart = { target: string; verb: "add" | "close" | "update" } | null;

/**
 * The ask for a batch of issue follow-ups. `add this to` is true only of a
 * comment alone, `close` only of a close alone; anything else — a relabel, a
 * reopen, a comment and a close together — is an `update`. An update that did
 * not read gets no line: a wrong line is worse than none.
 */
function updateAskOf(parts: readonly UpdateAskPart[]): CardAsk | null {
  if (!parts.length || parts.some((p) => p === null)) return null;
  const read = parts as ReadonlyArray<NonNullable<UpdateAskPart>>;
  const verbs = new Set(read.map((p) => p.verb));
  return { kind: "update-issue", verb: verbs.size === 1 ? read[0]!.verb : "update", issues: read.map((p) => p.target) };
}

function updateVerbOf(update: IssueUpdate): "add" | "close" | "update" {
  const relabels = update.addLabels.length + update.removeLabels.length > 0;
  if (update.comment && !update.state && !relabels) return "add";
  if (!update.comment && update.state?.startsWith("closed") && !relabels) return "close";
  return "update";
}

/**
 * An issue follow-up's card: per issue, `repo#number`, what will happen to it
 * in the order it runs, and any comment verbatim — read through the same
 * `issueUpdateFromInput` the executor runs, so the card says what the ✅ does.
 * Preflight refuses an input that reading rejects before staging, so every
 * operation here reads.
 *
 * The repo shown is the resolver's entry, read through `issueTarget` as the
 * intake card reads it — the list's spelling, never the model's — and each
 * repo a comment lands on gets the visibility notice.
 */
async function issueUpdateCardOf(
  operations: ReadonlyArray<ProposalOperation>,
  deps: Pick<TurnDeps, "cards">,
  fromDm: boolean,
): Promise<Pick<ProposalCard, "fields" | "caveats"> & { updates: UpdateAskPart[] }> {
  const updates = operations.filter((op) => op.toolName === "github_issue_update");
  const notices = new Map<string, CardCaveat>();
  const perIssue: Array<{ target: string; fields: CardField[] }> = [];
  const asks: UpdateAskPart[] = [];
  for (const op of updates) {
    const { repo, visibility } = await deps.cards.issueTarget(op.input);
    const read = issueUpdateFromInput(op.input);
    if (!read.ok) {
      perIssue.push({ target: `${repo}#${String(op.input.issue_number ?? "?")}`, fields: cardFieldsOf(op.input) });
      asks.push(null);
      continue;
    }
    if (read.update.comment && !notices.has(repo)) {
      notices.set(repo, { kind: "repo-visibility", repo, visibility, write: "comment", ...(fromDm ? { fromDm: true as const } : {}) });
    }
    asks.push({ target: `${repo}#${read.update.issue}`, verb: updateVerbOf(read.update) });
    perIssue.push({
      target: `${repo}#${read.update.issue}`,
      fields: [
        { label: "operations", value: describeIssueUpdate(read.update).join(" · ") },
        ...(read.update.comment ? [{ label: "comment", value: read.update.comment }] : []),
      ],
    });
  }
  const fields: CardField[] =
    perIssue.length === 1
      ? [{ label: "issue", value: perIssue[0]!.target }, ...perIssue[0]!.fields]
      : perIssue.map((u) => ({ label: u.target, under: u.fields.map((field) => ({ field })) }));
  return { fields, caveats: [...notices.values()], updates: asks };
}

/**
 * A relayed DM's card: who will be DM'd, and the text they will read.
 *
 * The fields are built from EVERY relay in the batch, not the first operation's
 * input, because each recipient is an operation of its own and the ✅ is
 * consent to each of them. A recipient reads as the mention Slack would ping —
 * the check that the name resolved to the right person is made by looking at
 * it. One text shared by every recipient is shown once; texts that differ are
 * shown per recipient, verbatim.
 */
function relayFieldsOf(operations: ReadonlyArray<ProposalOperation>): CardField[] {
  const relays = operations.filter((op) => op.toolName === "dm_relay");
  const mention = (op: ProposalOperation): string => {
    const id = relayRecipientId(op.input.recipient);
    return id ? `<@${id}>` : String(op.input.recipient ?? "");
  };
  const textOf = (op: ProposalOperation): string =>
    typeof op.input.text === "string" ? op.input.text : "";
  if (new Set(relays.map(textOf)).size > 1) {
    return [
      {
        label: "messages",
        under: relays.map((op) => ({ field: { label: mention(op), value: textOf(op) } })),
      },
    ];
  }
  const recipients = relays.map(mention);
  return [
    recipients.length === 1
      ? { label: "recipient", value: recipients[0]! }
      : { label: "recipients", value: recipients.join(", ") },
    { label: "text", value: textOf(relays[0]!) },
  ];
}

/**
 * What one ✅ does, in the gated row's own words.
 *
 * Read from `agent/tool-table.ts` — import-free, and the ONE place these words
 * live since the two switches in the renderer went (#598). The fallback is the
 * bare tool name, which is what a switch arm nobody added used to print at a
 * designer; it is unreachable for anything the Gate can stage, because a gated
 * row carries its `verb` or does not compile.
 */
export function verbFor(toolName: string): string {
  return gateWordsFor(toolName)?.verb ?? toolName;
}

/**
 * The staged input as the card's labeled fields, nesting exactly as the input
 * nests.
 *
 * Labels are the input's OWN keys: turning `page_url` into `Page link` is
 * presentation and belongs in the adapter. A value that is absent, null or
 * empty is dropped rather than shown as a blank — the card is read by
 * designers, not machines (user decision, 2026-07-12).
 */
function cardFieldsOf(input: Record<string, unknown>): CardField[] {
  return Object.entries(input)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => cardFieldOf(k, v));
}

function cardFieldOf(label: string, value: unknown): CardField {
  if (Array.isArray(value)) {
    // A list of scalars becomes bullets; a list with any structure in it
    // becomes the sub-fields of each item, in order, so nothing is flattened
    // into a JSON blob on the way past.
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return { label, under: value.map((item) => ({ item: String(item) })) };
    }
    const under: CardRow[] = [];
    for (const item of value) {
      if (item !== null && typeof item === "object") {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          under.push({ field: cardFieldOf(k, v) });
        }
        continue;
      }
      under.push({ item: String(item) });
    }
    return { label, under };
  }
  if (value !== null && typeof value === "object") {
    return {
      label,
      under: Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        field: cardFieldOf(k, v),
      })),
    };
  }
  return { label, value: String(value) };
}

/**
 * What a person must be told about this staged input before they press ✅.
 *
 * A JUDGMENT, which is why it is here and not in the renderer: the caveats
 * are reached by READING the staged input, and the renderer only knows how each
 * one reads.
 *
 * THE MISSING-CONTEXT GATE: the model is told to name a brief's open
 * questions before staging and does so inconsistently. If nothing staged
 * mentions a gap, say so ON the card — the ✅ then knowingly accepts a gap-free
 * reading of the brief instead of silently inheriting one. It covers PRD-shaped
 * `notion_create`: a PRD card is where a build-from-this-brief ask is staged.
 *
 * THE BUNDLE AUDIT is "stage, but flag gaps loudly" (Bill, 2026-07-16): a
 * share-out stages immediately with whatever is in hand, and the CARD carries
 * the audit — so ✅ is informed consent to post without the missing pieces, and
 * a weaker model provider cannot silently skip the disclosure. The bundle
 * contract for prototype share-outs is a Loom walkthrough, a live preview and a
 * Decisions DB link (`skills/uno-publish/references/method.md`).
 *
 * The repo-visibility caveat is `buildCard`'s, because naming the repo and
 * its visibility takes a read through `deps.cards`.
 */
function caveatsFor(
  toolName: string,
  input: Record<string, unknown>,
  previewText: string | undefined,
): CardCaveat[] {
  if (toolName === "shareout_post") {
    const summary = typeof input.summary === "string" ? input.summary : "";
    if (!/prototype|prototypes|scaffold/i.test(summary)) return [];
    const haystack = collectStrings(input).join("\n");
    const missing: string[] = [];
    if (!/https?:\/\/[^\s]*loom\.com/i.test(haystack)) missing.push("Loom walkthrough");
    if (!/https?:\/\/[^\s]*(netlify\.app|workers\.dev)/i.test(haystack)) {
      missing.push("live preview");
    }
    if (!/https?:\/\/[^\s]*(notion\.so|notion\.site|app\.notion\.com)/i.test(haystack)) {
      missing.push("Decisions DB link");
    }
    return missing.length ? [{ kind: "bundle-incomplete", missing }] : [];
  }
  if (!(toolName === "notion_create" && input.surface === "prd")) return [];
  const staged = [
    previewText ?? "",
    typeof input.notes === "string" ? input.notes : "",
    JSON.stringify(input.sections ?? ""),
    typeof input.summary === "string" ? input.summary : "",
  ]
    .join(" ")
    .toLowerCase();
  return /(open question|gap|ambiguit|unspecified|undecided|to confirm|tbd)/.test(staged)
    ? []
    : [{ kind: "no-open-questions" }];
}
