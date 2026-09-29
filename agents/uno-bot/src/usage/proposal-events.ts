// A proposal's history on the usage record: staged, then confirmed, cancelled,
// superseded or expired — and refused_stale when a confirmed write found its
// page had moved (ADR-029). One row per event, in `proposal_events`, keyed to
// the card's ts (`turns.proposal_id` on the staging turn).
//
// WHAT IT IS FOR. The article's trust metric — every write gated, no wrong
// writes, stale writes refused — and ticket kickoff: who asked for a card, who
// they had asked first, how long the thread took to reach a staged card and a
// ✅, and whether someone other than the asker confirmed it.
//
// WHERE EVENTS ARE WRITTEN. Never inside Gate, which stays pure. A verdict's
// event is recorded by the executor every door hands its verdict to
// (`agent/resolve-proposal.ts`); staging and supersession by whoever stages
// (Turn, the cut-off re-stage, the Figma library job); expiry by the
// end-of-day pass. A failed write is logged and dropped and never changes how
// the proposal resolves (`recordProposalEvents`).
//
// THE SAME SHAPE AS UsageLog. A port, an in-memory adapter and a D1 adapter,
// held equal by one conformance suite (`tests/helpers/proposal-events-conformance.ts`).
// This file is PURE: no `Env`, no Workers global.

import type { GateVerdict } from "../gate/gate";
import type { OperationOutcome } from "../gate/run-batch";
import { proposalOperations, proposalTtlMs, type PendingProposal } from "../thread-state/index";
import { askedAtOf } from "./record";
import { aimedAtOf, roleOf, type TeamRole } from "./roles";

export type ProposalEventKind =
  | "staged"
  | "confirmed"
  | "cancelled"
  | "superseded"
  | "expired"
  | "refused_stale";

/** The events after which a card is no longer waiting on anyone — what the
 *  expiry pass reads as "has an outcome". A refused stale write follows a ✅,
 *  so it is not one of them. Both adapters read this list. */
export const OUTCOME_EVENTS: readonly ProposalEventKind[] = ["confirmed", "cancelled", "superseded", "expired"];

/**
 * How an event happened. For a verdict, the door it came through: `reaction`,
 * `button`, `typed` or `model`. Otherwise who did it: `turn`, `restage` or
 * `worker` staged it, a `revision` replaced it, the `end-of-day` pass aged it
 * out, the `executor` refused a stale write.
 */
export type ProposalEventVia =
  | "reaction"
  | "button"
  | "typed"
  | "model"
  | "turn"
  | "restage"
  | "worker"
  | "revision"
  | "end-of-day"
  | "executor";

/** One thing that happened to one card, as `proposal_events` holds it. Field
 *  names are camelCase here and snake_case in SQL; `./proposal-events-d1.ts`
 *  is the one place they are mapped. Columns an event does not use are null. */
export interface ProposalEvent {
  /** The card's ts. */
  proposalId: string;
  event: ProposalEventKind;
  /** When it happened, epoch ms. An expiry is dated to the moment the card
   *  aged out, not to the pass that noticed. */
  at: number;
  via: ProposalEventVia;
  channelId: string | null;

  // ── staged ──
  /** The staging turn, when a turn staged it — the join to `turns`. */
  turnId: string | null;
  requesterId: string | null;
  /** The tools the batch runs, in order. */
  tools: string[];
  /** How long the card stayed confirmable — what the expiry pass measures. */
  ttlMs: number | null;
  requesterRole: TeamRole | null;
  /** The role of the person the ask named, when it named someone on the map. */
  aimedAtRole: TeamRole | null;
  /** When the thread the card was staged in began, epoch ms: the thread's root
   *  message, which is the ask itself when the ask opened the thread. */
  threadStartedAt: number | null;

  // ── confirmed and cancelled ──
  /** Who decided. */
  actorId: string | null;
  /** Confirmed only: true when the confirmer was not the requester. */
  confirmedByOther: boolean | null;
}

/** A card that aged out untouched, as the expiry pass finds it. */
export interface OverdueProposal {
  proposalId: string;
  /** When it aged out: staged at, plus its lifetime. */
  expiredAt: number;
}

/**
 * Where proposal events are written.
 *
 * `record` keeps the FIRST write of an event for a card and ignores the rest,
 * so a retried alarm, or two paths recording the same staging, leave one row.
 */
export interface ProposalEventLog {
  record(event: ProposalEvent): Promise<void>;
  /** Every event of one card, oldest first. */
  eventsOf(proposalId: string): Promise<ProposalEvent[]>;
  /** Staged cards past their lifetime with no outcome yet — what `expireOverdue`
   *  would record, read without writing (the sweep's dry run). */
  overdue(now: number): Promise<OverdueProposal[]>;
  /** Record `expired` for every overdue card, in one statement. Answers how
   *  many it recorded; a second pass over the same cards records none. */
  expireOverdue(now: number): Promise<number>;
  /**
   * Put a ticket the bot filed on itself on the row of the turn that STAGED
   * the card — for a ✅ that landed on a reaction or a button, which no turn
   * runs, so no turn row would otherwise carry it. A turn row that already
   * names a ticket keeps it.
   */
  noteSelfFiledTicket(proposalId: string, url: string): Promise<void>;
}

// ── Building events ──────────────────────────────────────────────────────────

const EMPTY: Omit<ProposalEvent, "proposalId" | "event" | "at" | "via"> = {
  channelId: null,
  turnId: null,
  requesterId: null,
  tools: [],
  ttlMs: null,
  requesterRole: null,
  aimedAtRole: null,
  threadStartedAt: null,
  actorId: null,
  confirmedByOther: null,
};

/** A bare event: the four columns every row has, and the channel. */
export function proposalEvent(
  proposal: Pick<PendingProposal, "proposalTs" | "channel">,
  event: ProposalEventKind,
  at: number,
  via: ProposalEventVia,
): ProposalEvent {
  return { ...EMPTY, proposalId: proposal.proposalTs, event, at, via, channelId: proposal.channel };
}

/**
 * The staged event, with what ticket kickoff reads: who asked and their role,
 * the role of whoever the ask named, and when the thread began.
 *
 * Dated by the card's own ts, which is when Slack took it; `at` is only for a
 * card whose ts is not a Slack one (an eval conversation's). `askText` is read
 * for the person it names and never kept; with no text (a card the Worker
 * staged itself, or a re-stage) nobody was named.
 */
export function stagedEvent(input: {
  proposal: PendingProposal;
  /** When a card with no Slack ts was staged, epoch ms. */
  at: number;
  via: "turn" | "restage" | "worker";
  turnId?: string;
  askText?: string;
  roles?: Readonly<Record<string, TeamRole>>;
}): ProposalEvent {
  const { proposal } = input;
  const requester = proposal.requesterUserId || null;
  const aimedAt = input.askText ? aimedAtOf(input.askText, proposal.requesterUserId) : null;
  // The thread's root ts: the reply thread the card went up in. In a channel
  // that IS the root message; in a DM each ask has its own thread since the
  // agent_view migration. A root that is not a Slack ts dates nothing.
  const root = proposal.replyTs ?? proposal.userMsgTs;
  const rootAt = askedAtOf(root, Number.NaN);
  return {
    ...proposalEvent(proposal, "staged", askedAtOf(proposal.proposalTs, input.at), input.via),
    turnId: input.turnId ?? null,
    requesterId: requester,
    tools: proposalOperations(proposal).map((op) => op.toolName),
    ttlMs: proposalTtlMs(proposal),
    requesterRole: roleOf(requester, input.roles),
    aimedAtRole: roleOf(aimedAt, input.roles),
    threadStartedAt: Number.isFinite(rootAt) ? rootAt : null,
  };
}

/**
 * What a verdict records: `confirmed` or `cancelled` for one that won its
 * claim, and nothing for any other — a lost race, a latecomer and a signal on
 * a replaced or aged-out card change nothing about the card, whose own
 * outcome is recorded where it happened.
 */
export function verdictEvents(verdict: GateVerdict, at: number): ProposalEvent[] {
  const proposal = verdict.proposal;
  if (verdict.outcome !== "won" || !proposal || !verdict.decision) return [];
  const actor = verdict.by?.userId ?? null;
  const confirmed = verdict.decision === "confirm";
  return [
    {
      ...proposalEvent(proposal, confirmed ? "confirmed" : "cancelled", at, verdict.by?.door ?? "model"),
      actorId: actor,
      // Unknown, not "no", when the signal named nobody.
      confirmedByOther: confirmed && actor !== null ? actor !== proposal.requesterUserId : null,
    },
  ];
}

/**
 * What an executed batch records: ONE `refused_stale` when any operation
 * refused to write because what it was about to overwrite had moved since it
 * was read (ADR-029) — one per resolution, not per operation.
 */
export function executionEvents(
  proposal: Pick<PendingProposal, "proposalTs" | "channel">,
  outcomes: readonly OperationOutcome[],
  at: number,
): ProposalEvent[] {
  return outcomes.some(refusedStale) ? [proposalEvent(proposal, "refused_stale", at, "executor")] : [];
}

/** Whether an operation's own result says a stamp had moved (`staleStamps` on
 *  a `notion_update` result, `integrations/notion.ts`). */
function refusedStale(outcome: OperationOutcome): boolean {
  try {
    const { staleStamps } = JSON.parse(outcome.result) as { staleStamps?: unknown };
    return typeof staleStamps === "number" && staleStamps > 0;
  } catch {
    return false;
  }
}

// ── Writing them ─────────────────────────────────────────────────────────────

/** The longest a proposal-event write may hold the path it sits on. */
export const PROPOSAL_EVENT_TIMEOUT_MS = 1_000;

/**
 * Write events, and never let it cost the proposal: a write that throws or
 * outlasts its timeout is logged and dropped. Never rejects.
 */
export async function recordProposalEvents(
  log: ProposalEventLog,
  events: readonly ProposalEvent[],
  timeoutMs: number = PROPOSAL_EVENT_TIMEOUT_MS,
): Promise<void> {
  for (const event of events) {
    await quietly(`${event.event} on ${event.proposalId}`, () => log.record(event), timeoutMs);
  }
}

/** Run one usage write under a timeout, logging and swallowing its failure. */
export async function quietly(
  what: string,
  write: () => Promise<unknown>,
  timeoutMs: number = PROPOSAL_EVENT_TIMEOUT_MS,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      write(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
  } catch (err) {
    console.error(`[usage] proposal event ${what} not recorded: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * The end-of-day expiry pass: `expired` for every card that aged out with no
 * outcome recorded. Under a dry run it reads what it would record and writes
 * nothing. A failure propagates, so the runner can keep the job for a retry —
 * the pass is idempotent.
 */
export async function runProposalExpiry(
  log: ProposalEventLog,
  now: number,
  opts: { dryRun: boolean },
): Promise<{ expired: number; summary: string }> {
  if (opts.dryRun) {
    const due = (await log.overdue(now)).length;
    return { expired: 0, summary: `${due} proposal(s) would be recorded expired (dry run)` };
  }
  const expired = await log.expireOverdue(now);
  return { expired, summary: `${expired} proposal(s) recorded expired` };
}
