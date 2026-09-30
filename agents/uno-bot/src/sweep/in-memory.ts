// The in-memory sweep store — what the Node suite sweeps into.
//
// A real implementation of both halves of the port, held equal to the D1
// records adapter by the conformance suite: upserts and insert-or-ignore keyed
// as the tables are, and copies in and out, so a caller mutating what it wrote
// changes nothing stored.

import {
  mergeFindings,
  type CardSnapshot,
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
/** As the D1 reads order them: by item id. */
const sorted = (list: SweepItemRecord[]): SweepItemRecord[] =>
  list.map(copy).sort((a, b) => a.itemId.localeCompare(b.itemId));

export function createInMemorySweepStore(): InMemorySweepStore {
  const cursors = new Map<string, string>();
  const runs = new Map<string, SweepRunRecord>();
  const items = new Map<string, SweepItemRecord>();
  const failures = new Map<string, { nights: number; lastRunDate: string }>();
  let queue: PendingFinding[] = [];
  const cards = new Map<string, CardSnapshot>();
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
    async handledRuns(runIds) {
      return [...new Set(runIds)].filter((id) => runs.get(id)?.outcome === "handled").sort();
    },
    async addItems(added) {
      for (const item of added) if (!items.has(item.itemId)) items.set(item.itemId, copy(item));
    },
    async itemsOnCard(cardKey) {
      return sorted([...items.values()].filter((i) => i.cardKey === cardKey));
    },
    async itemsForProposal(proposalTs) {
      return sorted([...items.values()].filter((i) => i.proposalTs === proposalTs));
    },
    async itemsForFindings(findingIds) {
      const wanted = new Set(findingIds);
      return sorted([...items.values()].filter((i) => wanted.has(i.findingId)));
    },
    async openItems() {
      return sorted([...items.values()].filter((i) => i.status === "proposed"));
    },
    async markPosted(cardKey, proposalTs, at) {
      for (const [id, item] of items) {
        if (item.cardKey === cardKey) items.set(id, { ...item, proposalTs, postedAt: at });
      }
    },
    async releaseCard(cardKey) {
      for (const [id, item] of items) if (item.cardKey === cardKey && item.proposalTs === null) items.delete(id);
    },
    async updateItem(itemId, patch) {
      const item = items.get(itemId);
      if (item) items.set(itemId, { ...item, ...patch });
    },
    async recordThreadFailure(channel, threadTs, runDate) {
      const key = `${channel}:${threadTs}`;
      const had = failures.get(key);
      const nights = !had ? 1 : had.lastRunDate === runDate ? had.nights : had.nights + 1;
      failures.set(key, { nights, lastRunDate: runDate });
      return nights;
    },
    async failingThreads(channel) {
      return [...failures.keys()].filter((k) => k.startsWith(`${channel}:`)).map((k) => k.slice(channel.length + 1));
    },
    async clearThreadFailure(channel, threadTs) {
      failures.delete(`${channel}:${threadTs}`);
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
    async saveCard(snapshot) {
      cards.set(snapshot.key, copy(snapshot));
    },
    async cardSnapshot(cardKey) {
      const snapshot = cards.get(cardKey);
      return snapshot ? copy(snapshot) : null;
    },
    async dropCard(cardKey) {
      cards.delete(cardKey);
    },
    runs() {
      return [...runs.values()].map(copy);
    },
    items() {
      return [...items.values()].map(copy);
    },
  };
}
