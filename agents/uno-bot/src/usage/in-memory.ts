// The in-memory UsageLog — what Turn's Node tests record into.
//
// A real implementation of the port, held equal to the D1 adapter by the
// conformance suite: an upsert keyed on the turn id, and copies in and out, so a
// caller that mutates a record after writing it changes nothing stored — which
// is what a database does too.

import type { TurnRecord, UsageLog } from "./store";

export interface InMemoryUsageLog extends UsageLog {
  /** Every row, in the order each turn id was first written. For tests. */
  records(): TurnRecord[];
}

const copy = (r: TurnRecord): TurnRecord => ({
  ...r,
  toolsCalled: [...r.toolsCalled],
  sourcesCited: [...r.sourcesCited],
});

/**
 * What an upsert leaves when a row already exists — the D1 adapter's
 * `ON CONFLICT` clause, stated for a map. The turn's own columns take the new
 * values; the category columns are the classifier's: a null leaves the stored
 * label, and a row already classified, or already purged, never gets its text
 * back.
 */
export function mergeOnRetry(stored: TurnRecord | undefined, incoming: TurnRecord): TurnRecord {
  if (!stored) return copy(incoming);
  return {
    ...copy(incoming),
    requestText: stored.classifiedAt === null && stored.requestText !== null ? incoming.requestText : null,
    subType: incoming.subType ?? stored.subType,
    painCategory: incoming.painCategory ?? stored.painCategory,
    classifiedAt: incoming.classifiedAt ?? stored.classifiedAt,
    // A ticket another writer put on the row (`noteSelfFiledTicket`) survives
    // a rewrite that names none.
    selfFiledTicketUrl: incoming.selfFiledTicketUrl ?? stored.selfFiledTicketUrl,
  };
}

export function createInMemoryUsageLog(): InMemoryUsageLog {
  const rows = new Map<string, TurnRecord>();
  return {
    async record(turn) {
      rows.set(turn.turnId, mergeOnRetry(rows.get(turn.turnId), turn));
    },
    async get(turnId) {
      const row = rows.get(turnId);
      return row ? copy(row) : null;
    },
    records() {
      return [...rows.values()].map(copy);
    },
  };
}
