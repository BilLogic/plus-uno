// Taking a drawn proposal off the blueprint: offered, never silent.
//
// A proposal (`./proposal.ts`) is a `proposed` variant path beside today's,
// and its record (`./proposal-records.ts`) keeps the path and its cells. Two
// things offer its removal, and both offer it the same way:
//
//   • "remove it" from the requester, in the proposal's own thread
//     (`isRemoveRequest`, `offerRequestedRemoval`);
//   • the morning check, once, for a proposal no Roadmap card was linked to
//     within 30 days (`offerAgedRemovals`). A linked proposal is never
//     offered: its card's shipping promotes it.
//
// THE OFFER IS A ✅ CARD, NOT AN INLINE YES. Deleting rows is a blueprint
// write, and every blueprint write the Worker makes goes through the Gate
// (ADR-034): one atomic claim, the requester as the card's only confirmer
// (`exclusiveConfirmers`), its staging and decision in the proposal events,
// and an answer in the thread whatever happens. An inline "yes" would be a
// second door onto the blueprint with none of that. So the reply that asks is
// answered with a card, and only its ✅ deletes; ⛔, silence past the card's
// window, or anyone else's ✅ keeps the proposal.
//
// THE DELETE. Bill's ruling (2026-10-15): uno-bot may delete, so withdrawing
// removes the rows rather than marking them `deprecated`. The card's one
// operation, `blueprint_withdraw`, deletes each cell (`delete_cell`) and then
// the path (`delete_path`), the order a failed proposal write takes itself
// back in (`../blueprint-write/write.ts`). Each delete RPC records and
// archives itself as `uno-bot` in `authoring_changes`. The record is marked
// withdrawn, not deleted, so neither the thread nor the check offers it again.
//
// PURE: the records, Slack and the staging arrive as ports.

import type { ProposalCard } from "../turn/delivery";
import type { PendingProposal, StatedCardWords } from "../thread-state/index";
import { authoringCall, authoringCallCost, type WriterDeps } from "../blueprint-write/index";
import { rethrowIfBudget } from "../net";
import type { DrawnProposal, ProposalRecords } from "./proposal-records";

/** The removal card's one operation. */
export const WITHDRAW_TOOL = "blueprint_withdraw" as const;
/** How old an unlinked proposal is before its removal is offered. */
export const OFFER_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
/** Offers one morning makes at most; the rest wait for the next. */
export const OFFERS_PER_RUN = 8;
/** What one offer spends at most: the card's post and its staging in thread
 *  state (2 subrequests); its claim, a release, and its proposal events (D1). */
export const OFFER_SUBREQUESTS = 2;
export const OFFER_D1_QUERIES = 4;
/** The card's slot in its thread is `blueprint-withdraw:<proposal ts>`. */
export const WITHDRAW_SLOT_PREFIX = "blueprint-withdraw:";

/** Why the removal is offered: the requester asked, or the check found it aged. */
export type WithdrawalReason = "asked" | "aged";

/**
 * How long each card can be decided. An ask is answered while the person is
 * there; an offer nobody asked for waits out a weekend.
 */
export const WITHDRAWAL_CARD_TTL_MS: Record<WithdrawalReason, number> = {
  asked: 24 * 60 * 60 * 1000,
  aged: 4 * 24 * 60 * 60 * 1000,
};

const WORDS: Record<WithdrawalReason, StatedCardWords> = {
  asked: {
    cancelled: "Kept, nothing removed from the blueprint",
    expired: `That card closed after ${WITHDRAWAL_CARD_TTL_MS.asked / 3_600_000} h with no decision, so the proposal stays on the blueprint.`,
  },
  aged: {
    cancelled: "Kept on the blueprint, and not offered again",
    expired: `That card closed after ${WITHDRAWAL_CARD_TTL_MS.aged / 86_400_000} days with no decision, so the proposal stays on the blueprint and is not offered again.`,
  },
};

// ── The request ──────────────────────────────────────────────────────────────

/**
 * A short, explicit ask to take the proposal down — "remove it", "please
 * delete the proposal", "withdraw this from the blueprint". Anything longer or
 * vaguer is the turn's, so "remove the second bullet" is never read as one.
 *
 * @param text - The message, bot mentions already stripped
 */
export function isRemoveRequest(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!]+$/, "").trim();
  const verb = "(?:remove|delete|withdraw|drop|take down)";
  const object = "(?:it|this|that|the proposal|this proposal|that proposal|the proposed path|the path)";
  const where = "(?:from|off) the blueprint";
  const ask = new RegExp(
    `^(?:(?:please|pls|can you|could you)\\s+)?(?:${verb}\\s+${object}(?:\\s+${where})?|${verb}\\s+${where}|take ${object} (?:down|off the blueprint))(?:,?\\s+please)?\\??$`,
  );
  return ask.test(t);
}

// ── The card ─────────────────────────────────────────────────────────────────

/** What the removal card's operation carries: ids only, from the record. */
export interface Withdrawal {
  proposalTs: string;
  pathId: string;
  cellIds: string[];
  reason: WithdrawalReason;
}

const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const cells = (n: number) => `${n} ${n === 1 ? "cell" : "cells"}`;

/**
 * The removal card: what it deletes, and who decides.
 *
 * @param p - The drawn proposal
 * @param reason - Asked for, or offered by the check
 * @param link - The proposal's first cell in the blueprint app, when there is one
 */
export function withdrawalCard(p: DrawnProposal, reason: WithdrawalReason, link?: string): ProposalCard {
  const where = link ? `<${link}|the proposed path>` : "the proposed path";
  const lead = [
    reason === "asked"
      ? "*Remove this proposal from the blueprint?*"
      : `*Remove this proposal from the blueprint?* It was drawn here on ${day(p.writtenAt)} and no Roadmap card has been linked to it in 30 days.`,
    `Deletes ${where} drawn in this thread and its ${cells(p.cellIds.length)}, as uno-bot. Today's path is not touched.`,
    reason === "asked"
      ? `Only <@${p.requesterId}> can approve; Reject, or no answer in ${WITHDRAWAL_CARD_TTL_MS.asked / 3_600_000} h, keeps it.`
      : `Only <@${p.requesterId}> can approve; Reject, or no answer in ${WITHDRAWAL_CARD_TTL_MS.aged / 86_400_000} days, keeps it, and it is not offered again.`,
  ].join("\n");
  const input: Withdrawal = { proposalTs: p.proposalTs, pathId: p.pathId, cellIds: [...p.cellIds], reason };
  return {
    kind: "stated",
    verb: "remove this proposal from the blueprint",
    lead,
    footer: "",
    fields: [],
    caveats: [],
    operations: [{ toolName: WITHDRAW_TOOL, input: { ...input } }],
  };
}

/** The card's slot in its thread: one per proposal. */
export function withdrawSlotKey(proposalTs: string): string {
  return `${WITHDRAW_SLOT_PREFIX}${proposalTs}`;
}

/**
 * The removal card as staged once posted: its one operation, the requester
 * as its only confirmer, its own slot in the proposal's thread.
 *
 * @param p - The drawn proposal
 * @param reason - Asked for, or offered by the check
 * @param posted - The card's message ts and its text
 */
export function stagedWithdrawal(p: DrawnProposal, reason: WithdrawalReason, posted: { ts: string; text: string }): PendingProposal {
  const operation = withdrawalCard(p, reason).operations![0]!;
  return {
    operations: [operation],
    toolName: operation.toolName,
    input: operation.input,
    channel: p.channel,
    threadTs: p.threadTs,
    replyTs: p.replyTs,
    userMsgTs: p.replyTs,
    proposalTs: posted.ts,
    proposalText: posted.text,
    requesterUserId: p.requesterId,
    ttlMs: WITHDRAWAL_CARD_TTL_MS[reason],
    confirmers: [p.requesterId],
    exclusiveConfirmers: true,
    supersedeKey: withdrawSlotKey(p.proposalTs),
    stated: WORDS[reason],
  };
}

/**
 * A staged operation's input, read back — or why it is not one.
 *
 * @param input - The operation's input as stored on the card
 */
export function readWithdrawal(input: Record<string, unknown>): Withdrawal | { error: string } {
  const { proposalTs, pathId, cellIds, reason } = input;
  if (typeof proposalTs !== "string" || !proposalTs) return { error: "the removal names no proposal" };
  if (typeof pathId !== "string" || !pathId) return { error: "the removal names no path" };
  if (!Array.isArray(cellIds) || !cellIds.every((c) => typeof c === "string" && c)) return { error: "the removal's cells are not ids" };
  if (reason !== "asked" && reason !== "aged") return { error: "the removal gives no reason" };
  return { proposalTs, pathId, cellIds: [...cellIds] as string[], reason };
}

// ── The delete ───────────────────────────────────────────────────────────────

/** Blueprint calls a removal costs: each cell's deletion, then the path's. */
export function withdrawalWriteCalls(w: Pick<Withdrawal, "cellIds">): number {
  return w.cellIds.length * authoringCallCost("delete_cell") + authoringCallCost("delete_path");
}

export type WithdrawalResult =
  | { ok: true; deletedCells: number; notDeleted: string[] }
  | { ok: false; reason: string; deletedCells: number; notDeleted: string[] };

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Delete a proposal's cells, then its path. A cell that will not go — one a
 * person deleted already, say — is named and does not stop the rest; the
 * proposal is withdrawn once its path is gone.
 *
 * @param w - The removal
 * @param deps - The RPC
 */
export async function withdrawProposal(w: Withdrawal, deps: WriterDeps): Promise<WithdrawalResult> {
  let deletedCells = 0;
  const notDeleted: string[] = [];
  for (const cellId of w.cellIds) {
    try {
      await authoringCall(deps, "delete_cell", { cell_id: cellId });
      deletedCells += 1;
    } catch (err) {
      rethrowIfBudget(err);
      notDeleted.push(`cell ${cellId} (${message(err)})`);
    }
  }
  try {
    await authoringCall(deps, "delete_path", { path_id: w.pathId });
  } catch (err) {
    rethrowIfBudget(err);
    return { ok: false, reason: `deleting the path ${w.pathId} failed: ${message(err)}`, deletedCells, notDeleted };
  }
  return { ok: true, deletedCells, notDeleted };
}

/**
 * Why a won removal card must not delete, from its record as it stands at the
 * press; null when it may. Already withdrawn, or — for the check's offer —
 * linked to a Roadmap card since it was posted.
 *
 * @param w - The removal
 * @param standing - The record's marks; null when there is no record to read
 */
export function withdrawalRefusal(
  w: Withdrawal,
  standing: { proposal: Pick<DrawnProposal, "cardId">; withdrawnAt: number | null } | null,
): string | null {
  if (!standing) return null;
  if (standing.withdrawnAt !== null) return "this proposal was already removed from the blueprint";
  if (w.reason === "aged" && standing.proposal.cardId !== null) {
    return "this proposal was linked to a Roadmap card since the offer, so it stays on the blueprint";
  }
  return null;
}

// ── The two doors ────────────────────────────────────────────────────────────

export interface OfferDeps {
  records: ProposalRecords;
  /** Post the card under the proposal's thread; its ts and text, or null when
   *  Slack refused it. */
  postCard(p: DrawnProposal, card: ProposalCard): Promise<{ ts: string; text: string } | null>;
  /** Stage a posted card at the Gate. */
  stage(proposal: PendingProposal): Promise<void>;
  /** The proposal's first cell in the blueprint app, for the card's link. */
  linkOf?(p: DrawnProposal): string | undefined;
}

/**
 * A message in a thread that may ask to remove its proposal: a card for each
 * proposal the sender drew there and has not withdrawn. False — the turn
 * answers it — when the text is not a removal ask, or the sender drew nothing
 * standing there.
 *
 * @param deps - The records, the post and the staging
 * @param msg - The message: where, who, and its text with mentions stripped
 */
export async function offerRequestedRemoval(
  deps: OfferDeps,
  msg: { channel: string; threadTs: string; user: string; text: string },
): Promise<boolean> {
  if (!isRemoveRequest(msg.text)) return false;
  const theirs = (await deps.records.standingInThread(msg.channel, msg.threadTs)).filter((p) => p.requesterId === msg.user);
  if (!theirs.length) return false;
  for (const p of theirs) {
    const posted = await deps.postCard(p, withdrawalCard(p, "asked", deps.linkOf?.(p)));
    if (posted) await deps.stage(stagedWithdrawal(p, "asked", posted));
  }
  return true;
}

export interface AgedDeps extends OfferDeps {
  now(): number;
  /** The alarm's headroom; unbounded when absent. */
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
}

/**
 * The morning check: each unlinked proposal past 30 days, offered for
 * removal once, in its own thread, to the person who drew it. The claim is
 * taken before the post and given back if the post fails, so an offer is
 * never made twice and never lost.
 *
 * @param deps - The records, the post, the staging, the clock and the meter
 * @param opts - `dryRun` posts and marks nothing
 */
export async function offerAgedRemovals(deps: AgedDeps, opts: { dryRun?: boolean } = {}): Promise<{ offered: number; summary: string }> {
  const due = await deps.records.dueForOffer(deps.now() - OFFER_AFTER_MS, OFFERS_PER_RUN);
  if (!due.length) return { offered: 0, summary: "no proposal is due a removal offer" };
  if (opts.dryRun) return { offered: 0, summary: `would offer the removal of ${due.length} proposal(s)` };
  let offered = 0;
  let held = 0;
  for (const p of due) {
    const room = deps.meter?.headroom();
    if (room && (room.subrequests < OFFER_SUBREQUESTS || room.d1Queries < OFFER_D1_QUERIES)) {
      held = due.length - offered;
      break;
    }
    if (!(await deps.records.claimOffer(p.proposalTs, deps.now()))) continue;
    let posted: { ts: string; text: string } | null = null;
    try {
      posted = await deps.postCard(p, withdrawalCard(p, "aged", deps.linkOf?.(p)));
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[proposal-cleanup] offer for ${p.proposalTs} not posted: ${message(err)}`);
    }
    if (!posted) {
      await deps.records.releaseOffer(p.proposalTs);
      continue;
    }
    await deps.stage(stagedWithdrawal(p, "aged", posted));
    offered += 1;
  }
  return {
    offered,
    summary: `offered the removal of ${offered} proposal(s)${held ? `; ${held} wait for the next morning` : ""}`,
  };
}
