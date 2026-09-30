// The commitment store in memory, for the Node suite — both halves. The
// records half is held equal to the D1 adapter by the conformance suite.
//
// PURE: no `Env`, no Workers global.

import { LIVE_STATES, type CommitmentRecord, type CommitmentStore, type CommitmentText } from "./store";

export interface InMemoryCommitmentStore extends CommitmentStore {
  /** Every row, by id — what a test reads back. */
  readonly rows: Map<string, CommitmentRecord>;
  /** Every text, with the time it is kept until. */
  readonly texts: Map<string, { text: CommitmentText; until: number }>;
}

export function createInMemoryCommitmentStore(): InMemoryCommitmentStore {
  const rows = new Map<string, CommitmentRecord>();
  const texts = new Map<string, { text: CommitmentText; until: number }>();
  const copy = (r: CommitmentRecord | undefined): CommitmentRecord | null => (r ? { ...r } : null);
  return {
    rows,
    texts,
    async addCommitments(added) {
      for (const r of added) if (!rows.has(r.id)) rows.set(r.id, { ...r });
    },
    async get(id) {
      return copy(rows.get(id));
    },
    async nextDue(now, runDate, skip = []) {
      const due = [...rows.values()]
        .filter((r) => LIVE_STATES.includes(r.state) && r.dueAt <= now && r.checkedOn !== runDate && !skip.includes(r.promiserId))
        .sort((a, b) => a.dueAt - b.dueAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      return copy(due[0]);
    },
    async remindedOn(runDate) {
      const counts: Record<string, number> = {};
      for (const r of rows.values()) if (r.remindedOn === runDate) counts[r.promiserId] = (counts[r.promiserId] ?? 0) + 1;
      return counts;
    },
    async liveInThread(channel, threadTs, promiserId) {
      const live = [...rows.values()]
        .filter(
          (r) =>
            r.kind === "thread_promise" &&
            r.channel === channel &&
            r.threadTs === threadTs &&
            r.promiserId === promiserId &&
            LIVE_STATES.includes(r.state),
        )
        .sort((a, b) => a.promisedAt - b.promisedAt);
      return copy(live[0]);
    },
    async byReminderTs(ts) {
      return copy([...rows.values()].find((r) => r.nudgeTs === ts) ?? [...rows.values()].find((r) => r.followupTs === ts));
    },
    async update(id, patch) {
      const row = rows.get(id);
      if (!row) return;
      const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      rows.set(id, { ...row, ...defined });
    },
    async latestAnswers(channel, limit) {
      const seen = (r: CommitmentRecord) => r.kind === "thread_promise" && (r.channelKind === "public" || r.channel === channel);
      const newest = (a: CommitmentRecord, b: CommitmentRecord) =>
        (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
      const of = (state: CommitmentRecord["state"]) =>
        [...rows.values()].filter((r) => r.state === state && seen(r)).sort(newest).slice(0, Math.max(0, limit));
      return [...of("done"), ...of("not_promise")].sort(newest).map((r) => ({ ...r }));
    },
    async text(id) {
      const kept = texts.get(id);
      return kept ? structuredClone(kept.text) : null;
    },
    async saveText(id, text, until) {
      texts.set(id, { text: structuredClone(text), until });
    },
  };
}
