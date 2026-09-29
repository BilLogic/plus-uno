// The in-memory ProposalEventLog — what the Node suite records into.
//
// A real implementation of the port, held equal to the D1 adapter by the
// conformance suite: the first write of an event for a card is kept, copies go
// in and out, and the expiry pass reads "no outcome yet" exactly as the SQL
// does. `turns`, when given, is the usage log whose rows `noteSelfFiledTicket`
// writes, and `completed` answers whether an ask's own card has
// `task_completed` on its staging turn — the same database in production,
// separate objects here.

import type { UsageLog } from "./store";
import { OUTCOME_EVENTS, type OverdueProposal, type ProposalEvent, type ProposalEventLog } from "./proposal-events";

export interface InMemoryProposalEventLog extends ProposalEventLog {
  /** Every event, in the order it was first recorded. For tests. */
  events(): ProposalEvent[];
}

const OUTCOMES = new Set(OUTCOME_EVENTS);

const copy = (e: ProposalEvent): ProposalEvent => ({ ...e, tools: [...e.tools] });

export function createInMemoryProposalEventLog(
  deps: { turns?: UsageLog; completed?: (proposalId: string) => Promise<boolean> } = {},
): InMemoryProposalEventLog {
  const rows: ProposalEvent[] = [];
  const has = (proposalId: string, event: string) =>
    rows.some((r) => r.proposalId === proposalId && r.event === event);

  const overdue = async (now: number): Promise<OverdueProposal[]> => {
    const due: OverdueProposal[] = [];
    for (const r of rows) {
      if (r.event !== "staged" || r.ttlMs === null || r.at + r.ttlMs > now) continue;
      if (rows.some((o) => o.proposalId === r.proposalId && OUTCOMES.has(o.event))) continue;
      // The D1 query's evidence that the card ran (see `OVERDUE_FROM` there).
      if (r.originProposalId === null && (await deps.completed?.(r.proposalId))) continue;
      due.push({ proposalId: r.proposalId, expiredAt: r.at + r.ttlMs });
    }
    return due.sort((a, b) => a.expiredAt - b.expiredAt || a.proposalId.localeCompare(b.proposalId));
  };

  return {
    async record(event) {
      if (has(event.proposalId, event.event)) return;
      // The inheriting columns, as the D1 insert resolves them.
      const stagedOf = (id: string | null) =>
        id === null ? undefined : rows.find((r) => r.proposalId === id && r.event === "staged");
      rows.push({
        ...copy(event),
        turnId: event.turnId ?? stagedOf(event.originProposalId)?.turnId ?? null,
        channelId: event.channelId ?? stagedOf(event.originProposalId)?.channelId ?? null,
        testTraffic:
          event.testTraffic ?? stagedOf(event.originProposalId ?? event.proposalId)?.testTraffic ?? false,
      });
    },
    async eventsOf(proposalId) {
      return rows
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.proposalId === proposalId)
        .sort((a, b) => a.r.at - b.r.at || a.i - b.i)
        .map(({ r }) => copy(r));
    },
    async overdue(now) {
      return overdue(now);
    },
    async expireOverdue(now) {
      const due = await overdue(now);
      for (const { proposalId, expiredAt } of due) {
        const staged = rows.find((r) => r.proposalId === proposalId && r.event === "staged")!;
        rows.push({
          ...copy(staged),
          event: "expired",
          at: expiredAt,
          via: "end-of-day",
          originProposalId: null,
          turnId: null,
          requesterId: null,
          tools: [],
          ttlMs: null,
          requesterRole: null,
          aimedAtRole: null,
          threadStartedAt: null,
          ticketUrl: null,
        });
      }
      return due.length;
    },
    async noteSelfFiledTicket(proposalId, url) {
      const staged = rows.find((r) => r.proposalId === proposalId && r.event === "staged");
      if (staged && staged.ticketUrl === null) staged.ticketUrl = url;
      const turnId = staged?.turnId;
      if (!turnId || !deps.turns) return;
      const turn = await deps.turns.get(turnId);
      if (!turn || turn.selfFiledTicketUrl !== null) return;
      await deps.turns.record({ ...turn, selfFiledTicketUrl: url });
    },
    async ticketFor(proposalId) {
      return rows.find((r) => r.proposalId === proposalId && r.event === "staged")?.ticketUrl ?? null;
    },
    events() {
      return rows.map(copy);
    },
  };
}
