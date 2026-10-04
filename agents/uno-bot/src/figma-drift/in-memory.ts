// The drift store in memory, for the Node suite: the queue the end-of-day
// sweep fills, the file marks, the threads' ask records and the live asks.
// Production keeps the same four in HARNESS_KV (`./env.ts`).
//
// PURE: no `Env`, no Workers global.

import type { FileDriftFinding, FileDriftSink } from "./finding";
import type { AskRecord, DriftStore, IntakeMark, LiveAsk } from "./run";

export interface InMemoryDriftStore extends DriftStore, FileDriftSink {
  /** Every intake mark, by group. */
  marks(): Map<string, IntakeMark>;
}

export function createInMemoryDriftStore(): InMemoryDriftStore {
  let queue: FileDriftFinding[] = [];
  const marks = new Map<string, IntakeMark>();
  const records = new Map<string, AskRecord>();
  const live = new Map<string, LiveAsk>();
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  const liveKey = (a: Pick<LiveAsk, "channel" | "threadTs" | "ts">) => `${a.channel}:${a.threadTs}:${a.ts}`;
  const byAge = (list: LiveAsk[]) => list.sort((a, b) => a.askedAt - b.askedAt).map(clone);
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
    async liveAsks() {
      return byAge([...live.values()]);
    },
    async liveAsksIn(channel, threadTs) {
      return byAge([...live.values()].filter((a) => a.channel === channel && a.threadTs === threadTs));
    },
    async saveLiveAsk(ask) {
      live.set(liveKey(ask), clone(ask));
    },
    async dropLiveAsk(ask) {
      live.delete(liveKey(ask));
    },
    marks: () => marks,
  };
}
