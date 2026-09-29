// The D1 ProposalEventLog — production's `proposal_events` table
// (migrations/usage/0003_proposal_events.sql).
//
// As `./d1.ts`: every statement prepared with bound parameters, never
// assembled from values, and charged to the meter before it is sent
// (`chargeD1Query`). The database is taken by name, typed as the calls this
// file makes, so the Node suite compiles it; the workerd conformance run is
// what exercises it against a real (local) D1.

import { chargeD1Query } from "../net";
import {
  OUTCOME_EVENTS,
  type OverdueProposal,
  type ProposalEvent,
  type ProposalEventKind,
  type ProposalEventLog,
  type ProposalEventVia,
} from "./proposal-events";
import type { TeamRole } from "./roles";

/** The slice of `D1Database` this adapter uses. */
export interface ProposalEventDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ meta?: { changes?: number } }>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
}

/** Column order; the one mapping from event to row. */
const COLUMNS = [
  "proposal_id",
  "event",
  "at",
  "via",
  "channel_id",
  "test_traffic",
  "origin_proposal_id",
  "turn_id",
  "requester_id",
  "tools",
  "ttl_ms",
  "requester_role",
  "aimed_at_role",
  "thread_started_at",
  "ticket_url",
  "actor_id",
  "confirmed_by_other",
] as const;

type Row = Record<(typeof COLUMNS)[number], unknown>;

const STAGED_OF = (column: string) =>
  `(SELECT ${column} FROM proposal_events WHERE proposal_id = ? AND event = 'staged')`;

/**
 * Each column's placeholder. Three inherit when written null: `turn_id` and
 * `channel_id` from a re-staged card's original, and `test_traffic` from the
 * card's own staged row (or its original's), false when there is none — see
 * `ProposalEvent.testTraffic`. Each subquery takes its own bound id.
 */
const PLACEHOLDER: Partial<Record<(typeof COLUMNS)[number], string>> = {
  turn_id: `COALESCE(?, ${STAGED_OF("turn_id")})`,
  channel_id: `COALESCE(?, ${STAGED_OF("channel_id")})`,
  test_traffic: `COALESCE(?, ${STAGED_OF("test_traffic")}, 0)`,
};

// The first write of an event for a card is the one kept: a retried alarm or a
// second path recording the same staging changes nothing.
const INSERT =
  `INSERT INTO proposal_events (${COLUMNS.join(", ")}) ` +
  `VALUES (${COLUMNS.map((c) => PLACEHOLDER[c] ?? "?").join(", ")}) ` +
  `ON CONFLICT (proposal_id, event) DO NOTHING`;

// `rowid` breaks a tie in time by the order the rows were written.
const EVENTS_OF = `SELECT ${COLUMNS.join(", ")} FROM proposal_events WHERE proposal_id = ? ORDER BY at, rowid`;

/**
 * Staged cards past their lifetime, with no outcome recorded — and no sign
 * elsewhere in the database that the card RAN: an ask's own card whose batch
 * completed has `task_completed` on its staging turn's row (`turns.proposal_id`
 * is that card), so a ✅ whose `confirmed` write was lost is not read as aged
 * out. A re-staged card is not checked that way: the turn row names the ask's
 * root card, whichever of its cards ran. The outcome list is the module's
 * constant, spelled into the SQL once at load — never a value from a caller.
 */
const OVERDUE_FROM =
  `FROM proposal_events s WHERE s.event = 'staged' AND s.ttl_ms IS NOT NULL AND s.at + s.ttl_ms <= ? ` +
  `AND NOT EXISTS (SELECT 1 FROM proposal_events o WHERE o.proposal_id = s.proposal_id ` +
  `AND o.event IN (${OUTCOME_EVENTS.map((e) => `'${e}'`).join(", ")})) ` +
  `AND NOT (s.origin_proposal_id IS NULL AND EXISTS (SELECT 1 FROM turns t ` +
  `WHERE t.proposal_id = s.proposal_id AND t.resolution = 'task_completed'))`;

const OVERDUE = `SELECT s.proposal_id AS proposal_id, s.at + s.ttl_ms AS expired_at ${OVERDUE_FROM} ORDER BY expired_at, proposal_id`;

const EXPIRE =
  `INSERT INTO proposal_events (proposal_id, event, at, via, channel_id, test_traffic) ` +
  `SELECT s.proposal_id, 'expired', s.at + s.ttl_ms, 'end-of-day', s.channel_id, s.test_traffic ${OVERDUE_FROM} ` +
  `ON CONFLICT (proposal_id, event) DO NOTHING`;

// The card's staged row keeps the ticket, whether or not the turn row exists
// yet (`ticketFor` is how that turn picks it up).
const NOTE_TICKET_ON_CARD =
  `UPDATE proposal_events SET ticket_url = ? WHERE proposal_id = ? AND event = 'staged' AND ticket_url IS NULL`;

const TICKET_FOR = `SELECT ticket_url FROM proposal_events WHERE proposal_id = ? AND event = 'staged'`;

// The staging turn's row, found through the staged event; a row that already
// names a ticket keeps it.
const NOTE_TICKET =
  `UPDATE turns SET self_filed_ticket_url = ? WHERE self_filed_ticket_url IS NULL AND turn_id = ` +
  `(SELECT turn_id FROM proposal_events WHERE proposal_id = ? AND event = 'staged')`;

const boolOrNull = (b: boolean | null): number | null => (b === null ? null : b ? 1 : 0);

function toRow(e: ProposalEvent): unknown[] {
  // The inheriting columns bind their value, then the id their subquery reads.
  const inheritFrom = e.originProposalId ?? e.proposalId;
  const row: Record<(typeof COLUMNS)[number], unknown[]> = mapRow(e);
  row.turn_id = [e.turnId, e.originProposalId];
  row.channel_id = [e.channelId, e.originProposalId];
  row.test_traffic = [boolOrNull(e.testTraffic), inheritFrom];
  return COLUMNS.flatMap((c) => row[c]);
}

function mapRow(e: ProposalEvent): Record<(typeof COLUMNS)[number], unknown[]> {
  const row: Row = {
    proposal_id: e.proposalId,
    event: e.event,
    at: e.at,
    via: e.via,
    channel_id: e.channelId,
    test_traffic: boolOrNull(e.testTraffic),
    origin_proposal_id: e.originProposalId,
    turn_id: e.turnId,
    requester_id: e.requesterId,
    tools: JSON.stringify(e.tools),
    ttl_ms: e.ttlMs,
    requester_role: e.requesterRole,
    aimed_at_role: e.aimedAtRole,
    thread_started_at: e.threadStartedAt,
    ticket_url: e.ticketUrl,
    actor_id: e.actorId,
    confirmed_by_other: boolOrNull(e.confirmedByOther),
  };
  return Object.fromEntries(COLUMNS.map((c) => [c, [row[c]]])) as Record<(typeof COLUMNS)[number], unknown[]>;
}

const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));
const roleOrNull = (v: unknown): TeamRole | null => (v == null ? null : (String(v) as TeamRole));
const list = (v: unknown): string[] => {
  const parsed: unknown = JSON.parse(String(v ?? "[]"));
  return Array.isArray(parsed) ? parsed.map(String) : [];
};

function fromRow(row: Row): ProposalEvent {
  return {
    proposalId: String(row.proposal_id),
    event: String(row.event) as ProposalEventKind,
    at: Number(row.at),
    via: String(row.via) as ProposalEventVia,
    channelId: strOrNull(row.channel_id),
    testTraffic: Number(row.test_traffic) === 1,
    originProposalId: strOrNull(row.origin_proposal_id),
    turnId: strOrNull(row.turn_id),
    requesterId: strOrNull(row.requester_id),
    tools: list(row.tools),
    ttlMs: numOrNull(row.ttl_ms),
    requesterRole: roleOrNull(row.requester_role),
    aimedAtRole: roleOrNull(row.aimed_at_role),
    threadStartedAt: numOrNull(row.thread_started_at),
    ticketUrl: strOrNull(row.ticket_url),
    actorId: strOrNull(row.actor_id),
    confirmedByOther: row.confirmed_by_other == null ? null : Number(row.confirmed_by_other) === 1,
  };
}

export function createD1ProposalEventLog(deps: { db: ProposalEventDatabase }): ProposalEventLog {
  const { db } = deps;
  return {
    async record(event) {
      chargeD1Query();
      await db.prepare(INSERT).bind(...toRow(event)).run();
    },
    async eventsOf(proposalId) {
      chargeD1Query();
      const { results } = await db.prepare(EVENTS_OF).bind(proposalId).all<Row>();
      return results.map(fromRow);
    },
    async overdue(now) {
      chargeD1Query();
      const { results } = await db
        .prepare(OVERDUE)
        .bind(now)
        .all<{ proposal_id: unknown; expired_at: unknown }>();
      return results.map(
        (r): OverdueProposal => ({ proposalId: String(r.proposal_id), expiredAt: Number(r.expired_at) }),
      );
    },
    async expireOverdue(now) {
      chargeD1Query();
      const result = await db.prepare(EXPIRE).bind(now).run();
      return result.meta?.changes ?? 0;
    },
    async noteSelfFiledTicket(proposalId, url) {
      chargeD1Query();
      await db.prepare(NOTE_TICKET_ON_CARD).bind(url, proposalId).run();
      chargeD1Query();
      await db.prepare(NOTE_TICKET).bind(url, proposalId).run();
    },
    async ticketFor(proposalId) {
      chargeD1Query();
      const { results } = await db.prepare(TICKET_FOR).bind(proposalId).all<{ ticket_url: unknown }>();
      return strOrNull(results[0]?.ticket_url);
    },
  };
}
