// The blueprint check: an idea set beside today's blueprint when someone asks
// for it, never in front of their card (#1321).
//
// TWO HALVES, IN TWO PLACES.
//   • The OFFER, in the turn. A staged PRD's card posts first; then the quick
//     service-change judgement (`serviceChangeJudgement`: the gate's judgment
//     and search, nothing else) decides whether the idea touches today's
//     blueprint. It does → the turn posts an offer naming the scenario with a
//     Check it button, and keeps what the check will need under the offer's
//     ts (`ThreadState.putCheckOffer`). It does not, or the judgement failed
//     → nothing more is posted.
//   • The CHECK, as a runner job (`runBlueprintCheck`). Check it (anyone in
//     the thread: the check only reads) claims the thread's one check of the
//     scenario and queues this job on a runner of its own
//     (`blueprintCheckRunnerKey`), never the thread's: the thread's turns are
//     not serialized behind it, and it spends a 50-subrequest budget of its
//     own — the path read (5), the draft (≤2), the posts and the Draw on
//     blueprint card's staging, about fifteen at the worst.
//
// WHAT THE CHECK POSTS. Once its results are ready, and only if its run still
// holds the thread's record (`ThreadState.stepCheck` to done), the offer's
// own message — the checking line since the press — says the check is done,
// losing Stop; then follow-ups in the offer's thread: today's steps beside the
// idea's, step by step where the idea's rows could be drafted
// (`comparisonText`), and the existing Draw on blueprint ✅ card
// (`./proposal.ts`, requester only) when the draft draws anything. A draft
// that did not finish — the model failed, or was cut off at its ceiling —
// still posts the results, in the idea's own words, and the message says no
// proposal was drafted, with Check again: the card is never silently absent.
// The offer is kept marked undrafted, and Check again on a marked offer
// drafts only: it posts no second results, and the card follows the ones
// already up (which stay in the idea's own words) when the draft draws.
// A path that cannot be read, a check that throws or one past
// `CHECK_DEADLINE_MS` says it didn't finish, with Try again, and posts
// nothing else.
//
// STOP (#1322). A stopped run posts nothing: Stop marks the record, which the
// job reads before it starts and steps against before it posts, and aborts
// the model call in flight through `stopRunningCheck`. Stop's own door edits
// the message; the job never does for a stopped run. The offer's message is
// the check's status message for its whole life (press → checking → done /
// failed / stopped), so every button on it keys off
// `BlueprintCheckOffer.offerTs`.
//
// WHAT THE RESULTS OFFER (#1323). The results post with the one action that
// fits the card as it stands when they arrive (`cardNow`), found by the card's
// matter (`BlueprintCheckOffer.cardKey`), never its ts, so an edit made while
// the check ran is the card they act on:
//   • still waiting → Add these notes to the card: a revision of the matter's
//     current card with the results as a "Compared with today's blueprint"
//     section (`prdWithNotes`);
//   • approved → Update the Roadmap page: a `notion_update` on the page the
//     ✅ created that appends that section and nothing else
//     (`pageUpdateWithNotes`);
//   • cancelled, expired, or no card at all (a hand-off) → no action.
// The results' words are kept on the offer, so the button carries its ts and
// nothing else, and the press reads the card's state again: it may have moved
// since the results went up.
//
// PURE: the gate, the store, the path read, the drafter and Slack arrive as
// ports. `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import { cardExpiresAt } from "../card-expiry";
import {
  isTurnCard,
  ownBlocks,
  proposalOperations,
  type BlueprintCheckOffer,
  type PendingProposal,
  type ProposalOperation,
  type ThreadRef,
  type ThreadState,
} from "../thread-state/index";
import type { ProposalCard } from "../turn/delivery";
import { GATE_SUBREQUESTS } from "./budget";
import type { PathToday } from "./draft";
import type { ServiceChangeGate, ServiceChangeInput } from "./gate";
import { comparisonText, type Comparison } from "./milestone";
import { CheckPastDeadline, proposalOfferCard, stagedProposalOffer, type ProposalDraft, type ProposalDrafter } from "./proposal";

/** External subrequests the judgement spends in a turn: the gate's judgment
 *  and its search. The offer's own post is the turn's delivery. */
export const JUDGEMENT_SUBREQUESTS = GATE_SUBREQUESTS;

/** Where an idea touches today's blueprint: what the offer names and the check
 *  starts from. */
export interface CheckMatch {
  scenario: string;
  path: string;
  /** The cell the gate matched: the handle the check's path read starts from. */
  cellId: string;
  /** The idea's sentence that shows the change, in its own words. */
  quote: string;
}

/** The quick judgement a milestone runs after its card: a match, or null for
 *  "post nothing more" — not a service change, no confident match, a failed
 *  or cut-off judgement, or no budget for it. */
export type ServiceChangeJudgement = (idea: ServiceChangeInput) => Promise<CheckMatch | null>;

export interface JudgementDeps {
  gate: ServiceChangeGate;
  /** Whether the turn has `JUDGEMENT_SUBREQUESTS` left beside its delivery. */
  affordable(): boolean;
}

/**
 * The judgement over the gate. Fails quiet past a budget stop: an error is
 * no offer, and the card already stands.
 *
 * @param deps - The gate and the budget
 */
export function serviceChangeJudgement(deps: JudgementDeps): ServiceChangeJudgement {
  return async (idea) => {
    try {
      if (!deps.affordable()) return null;
      const gated = await deps.gate(idea);
      if (!gated.pass) {
        console.log(`[blueprint-check] no offer (${gated.reason})`);
        return null;
      }
      const { scenario, path, cellId } = gated.match;
      return { scenario, path, cellId, quote: gated.quote };
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[blueprint-check] judgement skipped: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };
}

/**
 * The runner a check runs on: one per offer, never the thread's
 * (`conversationKey`), so the thread's turns never wait behind it.
 *
 * @param channel - The offer's channel
 * @param offerTs - The offer's message ts
 */
export function blueprintCheckRunnerKey(channel: string, offerTs: string): string {
  return `${channel}:blueprint-check:${offerTs}`;
}

/** The heading the results go under, on the card or on the page. */
export const NOTES_HEADING = "Compared with today's blueprint";

/** What the results offer to do with themselves. */
export type ResultsAction = "add-notes" | "update-page";

/** The results as they post: their words, the action that fits the card now
 *  (none for a closed card or no card), and when its button stops answering. */
export interface CheckResults {
  text: string;
  action: ResultsAction | null;
  expiresAt: number;
}

/** Where the matter of an offer's card stands. */
export type CardNow =
  /** A card of the matter still waits: the current one, edits and all. */
  | { kind: "waiting"; card: PendingProposal }
  /** The matter's PRD was approved and created this page. */
  | { kind: "approved"; pageUrl: string }
  /** Cancelled, expired, no longer a PRD, or never a card. */
  | { kind: "closed" };

export interface CardNowDeps {
  store: Pick<ThreadState, "getProposalsByThread">;
  /** The Roadmap page a matter's ✅ created, or null (`MatterPages.pageOf`). */
  createdPage(channel: string, matter: string): Promise<string | null>;
}

/**
 * Where the matter of the card an offer was posted under stands now: the
 * live turn card in the offer's reply thread with the card's matter key
 * (a revision keeps it), else the page its ✅ created, else closed.
 *
 * @param offer - The offer, with the card and its matter
 * @param deps - The store and the created pages
 */
export async function cardNow(offer: BlueprintCheckOffer, deps: CardNowDeps): Promise<CardNow> {
  if (!offer.cardTs) return { kind: "closed" };
  const live = await deps.store.getProposalsByThread({ channel: offer.channel, thread: offer.replyTs ?? offer.threadTs });
  // A card staged before turn cards had keys holds the thread's slot, unkeyed.
  const card = live.find((p) => isTurnCard(p) && p.supersedeKey === offer.cardKey);
  if (card) return prdOf(card) ? { kind: "waiting", card } : { kind: "closed" };
  const pageUrl = offer.cardKey ? await deps.createdPage(offer.channel, offer.cardKey) : null;
  return pageUrl ? { kind: "approved", pageUrl } : { kind: "closed" };
}

/** The action a card's state offers, or none. */
export function actionFor(now: CardNow): ResultsAction | null {
  return now.kind === "waiting" ? "add-notes" : now.kind === "approved" ? "update-page" : null;
}

/** The index of a batch's PRD, or -1. */
function prdIndex(operations: readonly ProposalOperation[]): number {
  return operations.findIndex((op) => op.toolName === "notion_create" && String(op.input.surface ?? "").toLowerCase() === "prd");
}

const prdOf = (card: PendingProposal) => prdIndex(proposalOperations(card)) >= 0;

/** The section the notes are, as a PRD and an append both take it. */
const notesSection = (notes: string) => ({ heading: NOTES_HEADING, body: notes });

/**
 * A waiting card's batch with the notes in: its PRD's sections plus the
 * notes as their last, replacing an earlier set of notes so a second press
 * never doubles them. Everything else the card held is kept as it was.
 *
 * @param card - The matter's current card
 * @param notes - The results' words
 */
export function prdWithNotes(card: PendingProposal, notes: string): ProposalOperation[] {
  const operations = proposalOperations(card);
  const at = prdIndex(operations);
  return operations.map((op, i) => {
    if (i !== at) return op;
    const sections = Array.isArray(op.input.sections) ? (op.input.sections as Array<{ heading?: unknown }>) : [];
    const kept = sections.filter((s) => String(s?.heading ?? "").trim() !== NOTES_HEADING);
    return { ...op, input: { ...op.input, sections: [...kept, notesSection(notes)] } };
  });
}

/**
 * The `notion_update` that puts the notes on the page an approved PRD
 * created: one section appended at the end, and nothing else — no property,
 * no block replaced.
 *
 * @param pageUrl - The created page
 * @param notes - The results' words
 */
export function pageUpdateWithNotes(pageUrl: string, notes: string): ProposalOperation[] {
  return [{ toolName: "notion_update", input: { page_url: pageUrl, append: { sections: [notesSection(notes)] } } }];
}

/**
 * The thread a check's record is kept under (`ThreadState.claimCheck`): the
 * offer's conversation, so every offer of the same scenario in the thread —
 * a PRD card's or a hand-off's — shares it.
 *
 * @param offer - The offer
 */
export function checkRefOf(offer: Pick<BlueprintCheckOffer, "channel" | "threadTs">): ThreadRef {
  return { channel: offer.channel, thread: offer.threadTs };
}

/** How long a check may run before it is stopped and said to have failed.
 *  Under the record's lease (`CHECK_LEASE_MS`), so a check still running is
 *  never taken for a killed one. */
export const CHECK_DEADLINE_MS = 5 * 60 * 1000;

// ── Stopping a check in flight ──────────────────────────────────────────────
//
// Stop (`slack/blueprint-check.ts`) marks the run stopped in the thread's
// record, and the record is what decides: a job that finds its run stopped
// posts nothing, whenever it looks. To also abort the model call in flight,
// the Stop door asks the check's own runner (`blueprintCheckRunnerKey`, the
// AgentRunner's `/cancel`), and the runner calls `stopRunningCheck` — the
// same Durable Object instance, so the same isolate as the job, which
// registered its controller here when it started. No poll, and no subrequest
// from the job.

const inFlight = new Map<string, AbortController>();

/**
 * Abort a run's check if it is running here: true when it was.
 *
 * @param run - The run its press claimed (`CheckRecord.run`)
 */
export function stopRunningCheck(run: string): boolean {
  const running = inFlight.get(run);
  running?.abort();
  return running !== undefined;
}

/** A queued check, as its job carries it: the offer, and the run its press
 *  claimed. */
export interface BlueprintCheckJob {
  offerTs: string;
  run: string;
}

export interface BlueprintCheckDeps {
  store: Pick<ThreadState, "getCheckOffer" | "putCheckOffer" | "putProposal" | "getProposalsByThread" | "getCheck" | "stepCheck">;
  /** Today's path holding a cell, or null when it cannot be read. */
  readPath(cellId: string): Promise<PathToday | null>;
  /** The idea's rows on today's path, for the step-by-step comparison and the
   *  Draw on blueprint card, or why there are none (`NoProposal`): nothing to
   *  draw, a draft that did not finish, or a path with no scenario. */
  draft: ProposalDrafter;
  /** The Roadmap page a matter's ✅ created, or null (`MatterPages.pageOf`). */
  createdPage(channel: string, matter: string): Promise<string | null>;
  /** Post the results as a follow-up in the offer's thread, with their action. */
  postResults(offer: BlueprintCheckOffer, results: CheckResults): Promise<void>;
  /** Post a ✅ card in the offer's thread, showing the deadline it is staged
   *  with: what posted, with that lifetime, or null when it did not post. */
  postCard(offer: BlueprintCheckOffer, card: ProposalCard): Promise<PostedCard | null>;
  /** Put the staged card, and the cards it retired, on the usage record. */
  recordStaged(proposal: PendingProposal, retired: readonly string[]): Promise<void>;
  /** Edit the offer's message — the checking line since the press — to what
   *  the check came to. */
  settle(offer: BlueprintCheckOffer, outcome: CheckOutcome): Promise<void>;
  now?(): number;
  /** The check's deadline; `CHECK_DEADLINE_MS` without it. */
  deadlineMs?: number;
}

/** A card as posted: its ts and text, its own blocks, and the lifetime it is
 *  staged with — the one its deadline line says. */
export interface PostedCard {
  ts: string;
  text: string;
  blocks?: unknown[];
  ttlMs: number;
}

/** What a check came to, as its status message says it. A stopped check is
 *  not here: Stop says that itself. `undrafted`: the results stand, but the
 *  idea's rows could not be drafted (`NoProposal` `unfinished`), so there is
 *  no Draw on blueprint card and the message says so, with Check again. */
export type CheckOutcome =
  | { kind: "done" }
  | { kind: "undrafted" }
  | { kind: "failed"; reason: "unreadable" | "error" | "timed-out" };

/**
 * Run one check: read today's path, draft the idea's rows on it, post today's
 * steps beside the idea's and, when the draft draws anything, the Draw on
 * blueprint card. Nothing posts unless the run still holds the thread's
 * record, running, when the results are ready; the run is then done, and the
 * status message loses Stop before the results go up. A stopped run posts
 * nothing and leaves the message to Stop; a failed one, or one past its
 * deadline, says so on the message. An offer the store no longer holds, or a
 * run that is not running when its job starts, is nothing to do.
 *
 * @param job - The offer's message ts and the run, as the job carries them
 * @param deps - The store, the path read, the drafter and Slack
 */
export async function runBlueprintCheck(job: BlueprintCheckJob, deps: BlueprintCheckDeps): Promise<void> {
  const offer = await deps.store.getCheckOffer(job.offerTs);
  if (!offer) {
    console.warn(`[blueprint-check] ${job.offerTs}: no offer to check`);
    return;
  }
  const ref = checkRefOf(offer);
  const held = await deps.store.getCheck(ref, offer.scenario);
  if (!held || held.run !== job.run || held.state !== "running") {
    console.log(`[blueprint-check] ${offer.scenario} in ${offer.channel}/${job.offerTs}: run ${job.run} is ${held?.run === job.run ? held.state : "not the thread's"}; nothing to do`);
    return;
  }
  const stop = new AbortController();
  inFlight.set(job.run, stop);
  // The deadline is a timer of the job's own, cleared when the check ends —
  // not `AbortSignal.timeout`, whose timer nothing clears and which Node does
  // not wait on: a check held only by its deadline let the process exit
  // before the deadline fired.
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(new CheckPastDeadline()), deps.deadlineMs ?? CHECK_DEADLINE_MS);
  const signal = AbortSignal.any([stop.signal, deadline.signal]);
  let outcome: CheckOutcome | "stopped";
  try {
    outcome = await check(offer, job.run, signal, deps);
  } catch (err) {
    if (stop.signal.aborted) outcome = "stopped";
    else if (signal.aborted) outcome = { kind: "failed", reason: "timed-out" };
    else {
      console.error(`[blueprint-check] ${offer.scenario} in ${offer.channel}/${job.offerTs} failed: ${err instanceof Error ? err.message : String(err)}`);
      outcome = { kind: "failed", reason: "error" };
    }
  } finally {
    clearTimeout(timer);
    inFlight.delete(job.run);
  }
  if (outcome === "stopped" || outcome.kind !== "failed") return;
  // Said on the message only while the run still holds the record, so a Stop
  // that won the race keeps its own words there.
  if (await deps.store.stepCheck(ref, offer.scenario, job.run, "failed")) await deps.settle(offer, outcome);
}

async function check(offer: BlueprintCheckOffer, run: string, signal: AbortSignal, deps: BlueprintCheckDeps): Promise<CheckOutcome | "stopped"> {
  const today = await untilAborted(deps.readPath(offer.cellId), signal);
  if (!today) return { kind: "failed", reason: "unreadable" };
  const comparison: Comparison = {
    milestone: offer.milestone,
    scenario: offer.scenario,
    path: offer.path,
    cellId: offer.cellId,
    quote: offer.quote,
    today,
    text: comparisonText(today, offer.quote),
  };
  // The drafter fails quiet, an abort included, so the signal is read again.
  const result = await untilAborted(deps.draft(comparison, offer.idea, signal), signal);
  signal.throwIfAborted();
  // No second try mends a path read without its scenario.
  if (result === "no-scenario") return { kind: "failed", reason: "unreadable" };
  const proposal = typeof result === "string" ? null : result;
  const outcome: CheckOutcome = result === "unfinished" ? { kind: "undrafted" } : { kind: "done" };
  // Done before anything posts: a Stop that landed first wins, and one that
  // lands after finds the check finished. Then Stop leaves the message.
  if (!(await deps.store.stepCheck(checkRefOf(offer), offer.scenario, run, "done"))) return "stopped";
  await deps.settle(offer, outcome);
  // A redraft (`BlueprintCheckOffer.undrafted`) posts no second results: the
  // first stand in the thread, so it only drafts, and marks or clears.
  const marked = outcome.kind === "undrafted" ? { ...offer, undrafted: true as const } : withoutMark(offer);
  if (offer.undrafted) {
    if (marked.undrafted !== offer.undrafted) await deps.store.putCheckOffer(marked);
  } else {
    await postResults(marked, proposal ? comparisonText(today, offer.quote, [...proposal.changes, ...proposal.removed]) : comparison.text, deps);
  }
  // The check is done and its results stand: a card that fails to go up
  // under them is logged, never the check's failure — that would step a done
  // run to failed and offer a Try again that posts the results twice.
  if (proposal) {
    await offerDraw(offer, proposal, deps).catch((err: unknown) => {
      console.error(`[blueprint-check] ${offer.scenario}: the Draw on blueprint card was not staged: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
  return outcome;
}

/** The offer with no undrafted mark. */
function withoutMark(offer: BlueprintCheckOffer): BlueprintCheckOffer {
  const { undrafted: _mark, ...rest } = offer;
  return rest;
}

/** `work`, or a rejection as soon as `signal` aborts: for a step whose own
 *  calls take no signal (the path read). */
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/**
 * The results, with the action the card's state offers now and a deadline
 * from now; then kept on the offer, so a press finds their words, along with
 * an undrafted mark, so Check again drafts and posts no second results.
 */
async function postResults(offer: BlueprintCheckOffer, text: string, deps: BlueprintCheckDeps): Promise<void> {
  const action = actionFor(await cardNow(offer, deps));
  const expiresAt = cardExpiresAt((deps.now ?? Date.now)());
  await deps.postResults(offer, { text, action, expiresAt });
  if (action) await deps.store.putCheckOffer({ ...offer, results: { text, expiresAt } });
  else if (offer.undrafted) await deps.store.putCheckOffer(offer);
}

/**
 * The Draw on blueprint ✅ card under the results (`./proposal.ts`): posted
 * in the offer's thread and staged for the requester alone, in its own slot,
 * so it never replaces the PRD's card. Best-effort: the results already
 * stand without it, so its caller logs a throw rather than fail the check.
 */
async function offerDraw(offer: BlueprintCheckOffer, draft: ProposalDraft, deps: BlueprintCheckDeps): Promise<void> {
  const posted = await deps.postCard(offer, proposalOfferCard(draft));
  if (!posted) {
    console.warn(`[blueprint-check] ${offer.scenario}: the Draw on blueprint card did not post`);
    return;
  }
  const proposal: PendingProposal = {
    ttlMs: posted.ttlMs,
    ...stagedProposalOffer(draft, {
      channel: offer.channel,
      threadTs: offer.threadTs,
      ...(offer.replyTs ? { replyTs: offer.replyTs } : {}),
      userMsgTs: offer.userMsgTs,
      requesterUserId: offer.requesterUserId,
      proposalTs: posted.ts,
      proposalText: posted.text,
    }),
    ...ownBlocks(posted),
  };
  const { retired } = await deps.store.putProposal(proposal);
  await deps.recordStaged(proposal, retired);
}
