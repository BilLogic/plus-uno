// The in-memory ProposalEventLog — what the Node suite records into.
//
// A real implementation of the port, held equal to the D1 adapter by the
// conformance suite: the first write of an event for a card is kept, copies go
// in and out, and the expiry pass reads "no outcome yet" exactly as the SQL
// does. `turns`, when given, is the usage log whose rows `noteSelfFiledTicket`
// writes — the same database in production, two objects here.

import type { UsageLog } from "./store";
import { OUTCOME_EVENTS, type OverdueProposal, type ProposalEvent, type ProposalEventLog } from "./proposal-events";

export interface InMemoryProposalEventLog extends ProposalEventLog {
  /** Every event, in the order it was first recorded. For tests. */
  events(): ProposalEvent[];
}

const OUTCOMES = new Set(OUTCOME_EVENTS);

const copy = (e: ProposalEvent): ProposalEvent => ({ ...e, tools: [...e.tools] });

export function createInMemoryProposalEventLog(deps: { turns?: UsageLog } = {}): InMemoryProposalEventLog {
  const rows: ProposalEvent[] = [];
  const has = (proposalId: string, event: string) =>
    rows.some((r) => r.proposalId === proposalId && r.event === event);

  const overdue = (now: number): OverdueProposal[] =>
    rows
      .filter((r) => r.event === "staged" && r.ttlMs !== null && r.at + r.ttlMs <= now)
      .filter((r) => !rows.some((o) => o.proposalId === r.proposalId && OUTCOMES.has(o.event)))
      .map((r) => ({ proposalId: r.proposalId, expiredAt: r.at + (r.ttlMs ?? 0) }))
      .sort((a, b) => a.expiredAt - b.expiredAt || a.proposalId.localeCompare(b.proposalId));

  return {
    async record(event) {
      if (has(event.proposalId, event.event)) return;
      // The two inheriting columns, as the D1 insert resolves them.
      const stagedOf = (id: string | null) =>
        id === null ? undefined : rows.find((r) => r.proposalId === id && r.event === "staged");
      rows.push({
        ...copy(event),
        turnId: event.turnId ?? stagedOf(event.originProposalId)?.turnId ?? null,
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
      const due = overdue(now);
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
        });
      }
      return due.length;
    },
    async noteSelfFiledTicket(proposalId, url) {
      const turnId = rows.find((r) => r.proposalId === proposalId && r.event === "staged")?.turnId;
      if (!turnId || !deps.turns) return;
      const turn = await deps.turns.get(turnId);
      if (!turn || turn.selfFiledTicketUrl !== null) return;
      await deps.turns.record({ ...turn, selfFiledTicketUrl: url });
    },
    events() {
      return rows.map(copy);
    },
  };
}
