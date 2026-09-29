// The in-memory sweep store — what the Node suite sweeps into.
//
// A real implementation of both halves of the port, held equal to the D1
// records adapter by the conformance suite: upserts and insert-or-ignore keyed
// as the tables are, and copies in and out, so a caller mutating what it wrote
// changes nothing stored.

import {
  mergeFindings,
  type PendingFinding,
  type SweepItemRecord,
  type SweepRunRecord,
  type SweepStore,
} from "./store";

export interface InMemorySweepStore extends SweepStore {
  /** Every run row, in first-write order. For tests. */
  runs(): SweepRunRecord[];
  /** Every item row, in first-write order. For tests. */
  items(): SweepItemRecord[];
}

const copy = <T>(v: T): T => structuredClone(v);

export function createInMemorySweepStore(): InMemorySweepStore {
  const cursors = new Map<string, string>();
  const runs = new Map<string, SweepRunRecord>();
  const items = new Map<string, SweepItemRecord>();
  let queue: PendingFinding[] = [];
  return {
    async cursor(channel) {
      return cursors.get(channel) ?? null;
    },
    async saveCursor(channel, ts) {
      cursors.set(channel, ts);
    },
    async recordRun(run) {
      runs.set(run.runId, copy(run));
    },
    async getRun(runId) {
      const run = runs.get(runId);
      return run ? copy(run) : null;
    },
    async addItems(added) {
      for (const item of added) if (!items.has(item.itemId)) items.set(item.itemId, copy(item));
    },
    async itemsOnCard(cardKey) {
      return [...items.values()].filter((i) => i.cardKey === cardKey).map(copy);
    },
    async itemsForProposal(proposalTs) {
      return [...items.values()].filter((i) => i.proposalTs === proposalTs).map(copy);
    },
    async itemsInThread(channel, threadTs) {
      return [...items.values()].filter((i) => i.channel === channel && i.threadTs === threadTs).map(copy);
    },
    async updateItem(itemId, patch) {
      const item = items.get(itemId);
      if (item) items.set(itemId, { ...item, ...patch });
    },
    async pendingFindings() {
      return copy(queue);
    },
    async addFindings(added) {
      queue = mergeFindings(queue, copy(added));
    },
    async removeFindings(ids) {
      const gone = new Set(ids);
      queue = queue.filter((f) => !gone.has(f.id));
    },
    runs() {
      return [...runs.values()].map(copy);
    },
    items() {
      return [...items.values()].map(copy);
    },
  };
}
