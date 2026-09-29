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

export function createInMemoryUsageLog(): InMemoryUsageLog {
  const rows = new Map<string, TurnRecord>();
  return {
    async record(turn) {
      rows.set(turn.turnId, copy(turn));
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
