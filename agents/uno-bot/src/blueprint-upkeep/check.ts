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
// WHAT THE CHECK POSTS. Follow-ups in the offer's thread: today's steps beside
// the idea's, step by step where the idea's rows could be drafted
// (`comparisonText`), and the existing Draw on blueprint ✅ card
// (`./proposal.ts`, requester only) when the draft draws anything. Then the
// offer's own message — the checking line since the press — says the check is
// done. A path that cannot be read, or a check that throws, says the card is
// unaffected and posts nothing else.
//
// WHERE LATER STEPS HOOK IN. The offer's message is the check's status message
// for its whole life (press → checking → done / failed), so a Stop button on
// it and the results' own actions (Add these notes, Update the Roadmap page)
// key off `BlueprintCheckOffer.offerTs` and `.cardTs`; a hand-off with no
// card leaves `cardTs` unset.
//
// PURE: the gate, the store, the path read, the drafter and Slack arrive as
// ports. `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import { ownBlocks, type BlueprintCheckOffer, type PendingProposal, type ThreadState } from "../thread-state/index";
import type { ProposalCard } from "../turn/delivery";
import { GATE_SUBREQUESTS } from "./budget";
import type { PathToday } from "./draft";
import type { ServiceChangeGate, ServiceChangeInput } from "./gate";
import { comparisonText, type Comparison } from "./milestone";
import { proposalOfferCard, stagedProposalOffer, type ProposalDraft, type ProposalDrafter } from "./proposal";

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

export interface BlueprintCheckDeps {
  store: Pick<ThreadState, "getCheckOffer" | "putProposal">;
  /** Today's path holding a cell, or null when it cannot be read. */
  readPath(cellId: string): Promise<PathToday | null>;
  /** The idea's rows on today's path, for the step-by-step comparison and the
   *  Draw on blueprint card; null when nothing could be drafted. */
  draft: ProposalDrafter;
  /** Post a follow-up in the offer's thread. */
  post(offer: BlueprintCheckOffer, text: string): Promise<void>;
  /** Post a ✅ card in the offer's thread, showing the deadline it is staged
   *  with: what posted, with that lifetime, or null when it did not post. */
  postCard(offer: BlueprintCheckOffer, card: ProposalCard): Promise<PostedCard | null>;
  /** Put the staged card, and the cards it retired, on the usage record. */
  recordStaged(proposal: PendingProposal, retired: readonly string[]): Promise<void>;
  /** Edit the offer's message — the checking line since the press — to what
   *  the check came to. */
  settle(offer: BlueprintCheckOffer, outcome: CheckOutcome): Promise<void>;
}

/** A card as posted: its ts and text, its own blocks, and the lifetime it is
 *  staged with — the one its deadline line says. */
export interface PostedCard {
  ts: string;
  text: string;
  blocks?: unknown[];
  ttlMs: number;
}

/** What a check came to, as its status message says it. */
export type CheckOutcome = { kind: "done" } | { kind: "failed"; reason: "unreadable" | "error" };

/**
 * Run one check: read today's path, draft the idea's rows on it, post today's
 * steps beside the idea's and, when the draft draws anything, the Draw on
 * blueprint card; then settle the status message. An offer the store no
 * longer holds is nothing to do.
 *
 * @param offerTs - The offer's message ts, as the job carries it
 * @param deps - The store, the path read, the drafter and Slack
 */
export async function runBlueprintCheck(offerTs: string, deps: BlueprintCheckDeps): Promise<void> {
  const offer = await deps.store.getCheckOffer(offerTs);
  if (!offer) {
    console.warn(`[blueprint-check] ${offerTs}: no offer to check`);
    return;
  }
  let outcome: CheckOutcome;
  try {
    outcome = await check(offer, deps);
  } catch (err) {
    console.error(`[blueprint-check] ${offer.scenario} in ${offer.channel}/${offerTs} failed: ${err instanceof Error ? err.message : String(err)}`);
    outcome = { kind: "failed", reason: "error" };
  }
  await deps.settle(offer, outcome);
}

async function check(offer: BlueprintCheckOffer, deps: BlueprintCheckDeps): Promise<CheckOutcome> {
  const today = await deps.readPath(offer.cellId);
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
  const drafted = await deps.draft(comparison, offer.idea);
  await deps.post(offer, drafted ? comparisonText(today, offer.quote, drafted.changes) : comparison.text);
  if (drafted) await offerDraw(offer, drafted, deps);
  return { kind: "done" };
}

/**
 * The Draw on blueprint ✅ card under the results (`./proposal.ts`): posted
 * in the offer's thread and staged for the requester alone, in its own slot,
 * so it never replaces the PRD's card. Best-effort past the post: the
 * results already stand without it.
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
