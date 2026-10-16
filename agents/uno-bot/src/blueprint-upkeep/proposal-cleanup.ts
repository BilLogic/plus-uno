// Taking a drawn proposal off the blueprint: offered, never silent.
//
// A proposal (`./proposal.ts`) is a `proposed` variant path beside today's,
// and its record (`./proposal-records.ts`) keeps the path and its cells. Two
// things offer its removal, and both offer it the same way:
//
//   • "remove it" from the requester, in the proposal's own thread
//     (`isRemoveRequest`, `offerRequestedRemoval`);
//   • the morning check, once, for a proposal no Roadmap card was linked to
//     within 30 days. A post nobody asked for rides the morning sweep's
//     message (`../sweep/sections.ts`): the check hands each offer to it as a
//     section whose place is the proposal's own thread
//     (`handOverAgedRemovals`, `removalOfferSection`). A linked proposal is
//     never offered: its card's shipping promotes it.
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
// ONCE, NEVER SILENT. The offer is claimed in the record only once its card
// is up and staged: a morning message that never went up, or a card shown
// but not staged, uses nothing, and the next morning offers it again. A
// staged card claims it, so no later morning offers it twice.
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
import type { PendingProposal, ReportItem, StatedCardWords } from "../thread-state/index";
import { itemProposal } from "../slack/decision-cards";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import { authoringCall, authoringCallCost, type WriterDeps } from "../blueprint-write/index";
import { rethrowIfBudget } from "../net";
import type { DrawnProposal, ProposalRecords } from "./proposal-records";
import { CARD_WINDOW_WORDS } from "../card-expiry";

/** The removal card's one operation. */
export const WITHDRAW_TOOL = "blueprint_withdraw" as const;
/** How old an unlinked proposal is before its removal is offered. */
export const OFFER_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
/** Offers one morning makes at most; the rest wait for the next. */
export const OFFERS_PER_RUN = 8;
/** D1 queries one shown offer spends once the message is up: its staging's
 *  proposal events and its claim. */
export const OFFER_D1_QUERIES = 4;
/** The removal offers' section on the sweep's morning post. */
export const REMOVAL_OFFER_SECTION = "blueprint-proposal-offers";
/** The card's slot in its thread is `blueprint-withdraw:<proposal ts>`. */
export const WITHDRAW_SLOT_PREFIX = "blueprint-withdraw:";

/** Why the removal is offered: the requester asked, or the check found it aged. */
export type WithdrawalReason = "asked" | "aged";

const WORDS: Record<WithdrawalReason, StatedCardWords> = {
  asked: {
    cancelled: "Kept, nothing removed from the blueprint",
    expired: `That card closed after ${CARD_WINDOW_WORDS} with no decision, so the proposal stays on the blueprint.`,
  },
  aged: {
    cancelled: "Kept on the blueprint, and not offered again",
    expired: `That card closed after ${CARD_WINDOW_WORDS} with no decision, so the proposal stays on the blueprint and is not offered again.`,
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
      ? `Only <@${p.requesterId}> can approve; Reject, or no answer in ${CARD_WINDOW_WORDS}, keeps it.`
      : `Only <@${p.requesterId}> can approve; Reject, or no answer in ${CARD_WINDOW_WORDS}, keeps it, and it is not offered again.`,
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

/** What a morning hands the sweep's post for one proposal's thread. */
export interface RemovalHanded {
  proposals: DrawnProposal[];
}

/** The place an offer goes: the proposal's own thread. */
const placeOf = (p: DrawnProposal) => ({ channel: p.channel, threadTs: p.replyTs });

/**
 * The morning check's hand-over: each unlinked proposal past 30 days, not yet
 * offered, to the sweep's message in its own thread. Claims nothing: the
 * section claims each offer once its card is staged.
 *
 * @param deps - The records, the clock, the morning's hand-off (absent on a rehearsal) and its date
 * @param opts - `dryRun` hands nothing over
 */
export async function handOverAgedRemovals(
  deps: { records: Pick<ProposalRecords, "dueForOffer">; now(): number; handOff?: SectionHandOff<RemovalHanded>; date: string },
  opts: { dryRun?: boolean } = {},
): Promise<{ handed: number; summary: string }> {
  const due = await deps.records.dueForOffer(deps.now() - OFFER_AFTER_MS, OFFERS_PER_RUN);
  if (!due.length) return { handed: 0, summary: "no proposal is due a removal offer" };
  if (opts.dryRun || !deps.handOff) return { handed: 0, summary: `would offer the removal of ${due.length} proposal(s)` };
  const byThread = new Map<string, DrawnProposal[]>();
  for (const p of due) byThread.set(`${p.channel}:${p.replyTs}`, [...(byThread.get(`${p.channel}:${p.replyTs}`) ?? []), p]);
  for (const proposals of byThread.values()) await deps.handOff.put(deps.date, placeOf(proposals[0]!), { proposals });
  return { handed: due.length, summary: `handed the removal offer of ${due.length} proposal(s) to the morning post` };
}

/** The report item an offer takes: one per proposal. */
export function withdrawalItemId(p: Pick<DrawnProposal, "proposalTs">): string {
  return `withdraw-${p.proposalTs}`;
}

/**
 * The check's offer as one card of the morning message.
 *
 * @param p - The drawn proposal
 * @param link - Where the proposal opens in the blueprint app
 */
export function withdrawalItem(p: DrawnProposal, link: string): ReportItem {
  return {
    id: withdrawalItemId(p),
    title: "Remove this proposal from the blueprint?",
    subtitle: `drawn ${day(p.writtenAt)} · no Roadmap card linked in 30 days`,
    owners: [{ slack: p.requesterId }],
    body: `Deletes the proposed path and its ${cells(p.cellIds.length)}; today's path is not touched`,
    open: { label: "Blueprint", url: link },
    done: "removed from the blueprint as uno-bot.",
    detail: withdrawalCard(p, "aged", link).lead ?? "",
  };
}

/**
 * The check's offer as staged once the morning message is up: the removal
 * card's one operation and confirmer, keyed by its item on that message.
 *
 * @param p - The drawn proposal
 * @param messageTs - The morning message
 * @param text - What the card says
 */
export function stagedAgedOffer(p: DrawnProposal, messageTs: string, text: string): PendingProposal {
  const staged = stagedWithdrawal(p, "aged", { ts: messageTs, text });
  return { ...staged, ...itemProposal(messageTs, withdrawalItemId(p)), supersedeKey: staged.supersedeKey };
}

export interface RemovalSectionDeps {
  records: Pick<ProposalRecords, "claimOffer">;
  /** Stage a shown card at the Gate. */
  stage(proposal: PendingProposal): Promise<void>;
  /** Where a proposal opens in the blueprint app. */
  linkOf(p: DrawnProposal): string;
  now(): number;
}

/**
 * The removal offers as a section of the morning message in each proposal's
 * own thread: each card staged once the message is up, then its offer
 * claimed. A card not staged, or a message that never went up, claims
 * nothing, so the next morning offers it again.
 *
 * @param deps - The records' claim, the staging, the link and the clock
 * @param handOff - The morning run's hand-off
 * @param date - The morning's date
 */
export function removalOfferSection(deps: RemovalSectionDeps, handOff: SectionHandOff<RemovalHanded>, date: string): SweepSection {
  return handedSection<RemovalHanded>({
    source: REMOVAL_OFFER_SECTION,
    date,
    handOff,
    cardsOf(value) {
      return {
        cards: value.proposals.map((p) => ({ person: p.requesterId, item: withdrawalItem(p, deps.linkOf(p)) })),
        says: (ids) =>
          ids.length === 1
            ? "the proposal drawn here has had no Roadmap card linked in 30 days: remove it from the blueprint?"
            : `${ids.length} proposals drawn here have had no Roadmap card linked in 30 days: remove them from the blueprint?`,
        cost: (shown) => ({ subrequests: 0, d1Queries: shown.length * OFFER_D1_QUERIES }),
      };
    },
    async posted(value, _place, shown, report, progress) {
      for (const p of value.proposals) {
        const id = withdrawalItemId(p);
        if (!shown.includes(id) || progress.done.has(id)) continue;
        const item = withdrawalItem(p, deps.linkOf(p));
        try {
          await deps.stage(stagedAgedOffer(p, report.ts, item.detail ?? item.body));
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[proposal-cleanup] offer for ${p.proposalTs} shown but not staged — offered again next morning: ${message(err)}`);
          await progress.mark(id, false);
          continue;
        }
        // Claimed once staged: the card is live, and no later morning offers it.
        await deps.records.claimOffer(p.proposalTs, deps.now());
        await progress.mark(id, true);
      }
    },
    async notPosted(value, _place, why) {
      console.error(`[proposal-cleanup] the morning message did not carry ${value.proposals.length} removal offer(s) (${why}) — offered again next morning`);
    },
  });
}
