// The drift store in memory, for the Node suite: the queue the end-of-day
// sweep fills, the file marks and the threads' ask records. Production keeps
// the same three in HARNESS_KV (`./env.ts`).
//
// PURE: no `Env`, no Workers global.

import type { FileDriftFinding, FileDriftSink } from "./finding";
import type { AskRecord, DriftStore, IntakeMark } from "./run";

export interface InMemoryDriftStore extends DriftStore, FileDriftSink {
  /** Every intake mark, by group. */
  marks(): Map<string, IntakeMark>;
}

export function createInMemoryDriftStore(): InMemoryDriftStore {
  let queue: FileDriftFinding[] = [];
  const marks = new Map<string, IntakeMark>();
  const records = new Map<string, AskRecord>();
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  return {
    async add(findings) {
      const byId = new Map(queue.map((f) => [f.id, f] as const));
      for (const f of findings) byId.set(f.id, clone(f));
      queue = [...byId.values()];
    },
    async pending() {
      return clone(queue);
    },
    async remove(ids) {
      const drop = new Set(ids);
      queue = queue.filter((f) => !drop.has(f.id));
    },
    async intakeMark(group) {
      return marks.has(group) ? clone(marks.get(group)!) : null;
    },
    async setIntakeMark(group, mark) {
      marks.set(group, clone(mark));
    },
    async clearIntakeMark(group) {
      marks.delete(group);
    },
    async asked(channel, threadTs) {
      return clone(records.get(`${channel}:${threadTs}`) ?? {});
    },
    async saveAsked(channel, threadTs, record) {
      records.set(`${channel}:${threadTs}`, clone(record));
    },
    marks: () => marks,
  };
}
