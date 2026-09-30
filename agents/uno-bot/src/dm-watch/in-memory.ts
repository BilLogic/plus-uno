// The in-memory DM watch records, for the Node suite. Held equal to the D1
// adapter by `tests/helpers/dm-watch-records-conformance.ts`.

import { LIVE_STATES } from "../commitments/store";
import type { DmReadPosition, DmCommitmentRecord, DmWatchFeature, DmWatchRecords, DmWatchSwitch } from "./store";

export type InMemoryDmWatchRecords = DmWatchRecords & {
  /** Every row, for a test to inspect. */
  rows(): DmCommitmentRecord[];
};

export function createInMemoryDmWatchRecords(): InMemoryDmWatchRecords {
  const switches = new Map<string, Map<DmWatchFeature, DmWatchSwitch>>();
  const rows = new Map<string, DmCommitmentRecord>();
  const read = new Map<string, Record<string, DmReadPosition>>();
  const live = (r: DmCommitmentRecord) => LIVE_STATES.includes(r.state);
  return {
    rows: () => [...rows.values()].map((r) => ({ ...r })),
    async switches(userId) {
      return [...(switches.get(userId)?.values() ?? [])]
        .sort((a, b) => a.feature.localeCompare(b.feature))
        .map((s) => ({ ...s }));
    },
    async setSwitch(userId, feature, on, at) {
      const mine = switches.get(userId) ?? new Map<DmWatchFeature, DmWatchSwitch>();
      if (!on) mine.delete(feature);
      else if (!mine.has(feature)) mine.set(feature, { feature, since: at.now, readThrough: at.readThrough });
      if (mine.size) switches.set(userId, mine);
      else switches.delete(userId);
    },
    async watchers() {
      return [...switches.keys()].sort();
    },
    async positions(userId) {
      return Object.fromEntries(Object.entries(read.get(userId) ?? {}).map(([k, v]) => [k, { ...v }]));
    },
    async savePositions(userId, positions) {
      if (Object.keys(positions).length) read.set(userId, { ...(read.get(userId) ?? {}), ...positions });
    },
    async clearPositions(userId) {
      read.delete(userId);
    },
    async addCommitments(add) {
      for (const r of add) if (!rows.has(r.id)) rows.set(r.id, { ...r });
    },
    async get(id) {
      const r = rows.get(id);
      return r ? { ...r, earlierFollowupTs: [...r.earlierFollowupTs] } : null;
    },
    async nextDue(ownerId, now, runDate) {
      const due = [...rows.values()]
        .filter((r) => r.ownerId === ownerId && live(r) && r.dueAt <= now && r.checkedOn !== runDate)
        .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id));
      return due[0] ? { ...due[0] } : null;
    },
    async remindedCount(ownerId, runDate) {
      return [...rows.values()].filter((r) => r.ownerId === ownerId && r.remindedOn === runDate).length;
    },
    async byReminderTs(channel, ts) {
      const mine = [...rows.values()].filter((x) => x.reminderChannel === channel);
      const r = mine.find((x) => x.nudgeTs === ts || x.followupTs === ts || x.earlierFollowupTs.includes(ts));
      return r ? { ...r } : null;
    },
    async update(id, patch) {
      const r = rows.get(id);
      if (!r) return;
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) (r as unknown as Record<string, unknown>)[k] = v;
    },
    async lapseLive(ownerId, kinds, now) {
      for (const r of rows.values()) {
        if (r.ownerId === ownerId && kinds.includes(r.kind) && live(r)) {
          r.state = "lapsed";
          r.resolvedAt = now;
        }
      }
    },
  };
}
