// The in-memory ThreadState adapter — the fake the rest of the refactor tests
// against (the loop, Turn and Gate all need a thread store, and none of them
// needs a Durable Object to be interesting).
//
// It is a real implementation of the interface, not a stub: every TTL, the
// history cap, the freshest-proposal scan, the one-shot cancel and the run
// lease behave as production behaves, because a fake that is merely close is
// worse than no fake — the tests pass and the Durable Object still breaks. The
// conformance suite is what holds the two together.
//
// NO WORKERS GLOBALS, deliberately: no `Request`, no `Response`, no
// `DurableObjectStorage`, no `Env`, no `fetch`. That is what lets
// `tsconfig.test.json` compile this file under plain Node — the same constraint
// `src/integrations/blueprint-schema.ts` explains for the same reason.
//
// Not durable, and not meant to be: one store per process, cleared when it is
// dropped. Each conformance test builds a fresh one.

import {
  CANCEL_TTL_MS,
  EVENT_DEDUP_TTL_MS,
  EXECUTION_CUTOFF_MS,
  HISTORY_TTL_MS,
  MAX_HISTORY_TURNS,
  PROPOSAL_TTL_MS,
  RUN_LEASE_MS,
  proposalReplyThread,
  type Execution,
  type HistoryTurn,
  type PendingProposal,
  type ProposalLookup,
  type RunClaim,
  type ThreadRef,
  type ThreadState,
  type ThreadStateDeps,
} from "./store";
import type { AssistantContext } from "../slack/types";

interface HistoryRecord {
  turns: HistoryTurn[];
  updatedAt: number;
}

interface ProposalRecord {
  proposal: PendingProposal;
  createdAt: number;
  /** The ts of the card that replaced this one, when a later turn staged a
   *  revision in the same conversation. Set once and never cleared. */
  supersededBy?: string;
  /** Retired ahead of the revision that is replacing it (#583), before that
   *  card exists to be named. Readable, and out of reach of every lookup that
   *  can lead to an execution. */
  retired?: boolean;
}

interface AssistantContextRecord {
  context: AssistantContext;
  updatedAt: number;
}

interface ActiveRunRecord {
  channel: string;
  thread: string;
  at: number;
}

interface EventRecord {
  seenAt: number;
  /** "running" = an agent turn holds the lease; "done" = handled. */
  status: "running" | "done";
}

const threadKey = (ref: ThreadRef): string => `${ref.channel}:${ref.thread}`;

export function createInMemoryThreadState(deps: ThreadStateDeps = {}): ThreadState {
  const now = deps.now ?? Date.now;

  const history = new Map<string, HistoryRecord>();
  const proposals = new Map<string, ProposalRecord>();
  const assistantContext = new Map<string, AssistantContextRecord>();
  const cancels = new Map<string, { at: number }>();
  const activeRuns = new Map<string, ActiveRunRecord>();
  const events = new Map<string, EventRecord>();
  const executions = new Map<string, Execution>();

  /** Take an execution if it has been cut off; drop it if it has aged out;
   *  leave it alone if it may still be running. */
  function takeIfCutOff(ts: string): Execution | null {
    const rec = executions.get(ts);
    if (!rec || rec.takenAt !== undefined) return null;
    const age = now() - rec.startedAt;
    if (age <= EXECUTION_CUTOFF_MS) return null;
    if (age > PROPOSAL_TTL_MS) {
      executions.delete(ts);
      return null;
    }
    // Marked, not deleted: a run that is only slow reads the mark at its next
    // operation and stops (the fence, on `settleOperation`).
    rec.takenAt = now();
    return { ...rec, settled: [...rec.settled] };
  }

  /** Live turns for a conversation, evicting the record if it has aged out.
   *  Expiry is applied on READ (as the Durable Object does) rather than by a
   *  sweep, so a store with no alarm answers identically. */
  function liveHistory(ref: ThreadRef): HistoryRecord | undefined {
    const key = threadKey(ref);
    const rec = history.get(key);
    if (!rec) return undefined;
    if (now() - rec.updatedAt > HISTORY_TTL_MS) {
      history.delete(key);
      return undefined;
    }
    return rec;
  }

  /** Is the card that retired another one still around to be looked at? Its own
   *  retirement does not matter: a chain still ends in a live newest card. */
  function successorIsLive(ts: string): boolean {
    const rec = proposals.get(ts);
    return !!rec && now() - rec.createdAt <= PROPOSAL_TTL_MS;
  }

  return {
    // ----- history -----

    async readHistory(ref) {
      return liveHistory(ref)?.turns ?? [];
    },

    async appendHistory(ref, turn) {
      const prev = liveHistory(ref)?.turns ?? [];
      const turns = [...prev, turn].slice(-MAX_HISTORY_TURNS);
      history.set(threadKey(ref), { turns, updatedAt: now() });
      return { length: turns.length };
    },

    async compactHistory(ref, { keepRecent }) {
      const turns = liveHistory(ref)?.turns ?? [];
      // Nothing to gain once the tail is the whole conversation (or all but the
      // opening turn, which is kept either way).
      if (turns.length <= keepRecent + 1) return { turns, dropped: 0 };
      const kept = [turns[0]!, ...turns.slice(-keepRecent)];
      const dropped = turns.length - kept.length;
      history.set(threadKey(ref), { turns: kept, updatedAt: now() });
      return { turns: kept, dropped };
    },

    // ----- proposals -----

    async putProposal(proposal) {
      // The revised card retires the one it replaces, per REPLY THREAD — the
      // grain, and why a DM needs it, are in `putProposal`'s contract. Only
      // LIVE records are touched: an aged-out card is already answered by
      // "expired".
      const thread = proposalReplyThread(proposal);
      for (const rec of proposals.values()) {
        if (rec.proposal.proposalTs === proposal.proposalTs) continue;
        // A record already stamped with a successor is settled. One only
        // RETIRED still wants this ts — that is the caller who retired it
        // ahead of staging this very card.
        if (rec.supersededBy) continue;
        if (now() - rec.createdAt > PROPOSAL_TTL_MS) continue;
        if (rec.proposal.channel !== proposal.channel) continue;
        if (proposalReplyThread(rec.proposal) !== thread) continue;
        rec.supersededBy = proposal.proposalTs;
      }
      // Retire first, then write — a choice, not an accident: the new card is
      // the one a racing ✅ has to be able to find, so it is the last thing to
      // land.
      proposals.set(proposal.proposalTs, { proposal, createdAt: now() });
    },

    // Retire without consuming — the counterpart to the claim, and why the two
    // are different methods is on the interface (#583).
    async retireProposal(proposalTs) {
      const rec = proposals.get(proposalTs);
      if (rec) rec.retired = true;
    },

    async getProposalByTs(proposalTs): Promise<ProposalLookup> {
      const rec = proposals.get(proposalTs);
      if (!rec) return { state: "none" };
      // A live successor beats the TTL — the ordering, and the third card it
      // stops the person from asking for, are in `ProposalLookup`.
      if (rec.supersededBy && successorIsLive(rec.supersededBy)) return { state: "superseded" };
      if (now() - rec.createdAt > PROPOSAL_TTL_MS) {
        proposals.delete(proposalTs);
        return { state: "expired" };
      }
      if (rec.supersededBy || rec.retired) return { state: "superseded" };
      return { state: "found", proposal: rec.proposal, createdAt: rec.createdAt };
    },

    async getProposalByThread(ref) {
      // Scans the staged set, as the Durable Object does: proposals expire
      // after an hour, so the live cardinality stays small.
      let best: ProposalRecord | null = null;
      for (const rec of proposals.values()) {
        if (now() - rec.createdAt > PROPOSAL_TTL_MS) continue;
        if (rec.supersededBy || rec.retired) continue; // retired, so never the thread's live card
        if (rec.proposal.channel !== ref.channel) continue;
        if (proposalReplyThread(rec.proposal) !== ref.thread) continue; // keyed on the card's thread
        if (!best || rec.createdAt > best.createdAt) best = rec;
      }
      return best?.proposal ?? null;
    },

    async getProposalsByChannel(channel) {
      return [...proposals.values()]
        .filter((rec) => now() - rec.createdAt <= PROPOSAL_TTL_MS)
        .filter((rec) => !rec.supersededBy && !rec.retired)
        .filter((rec) => rec.proposal.channel === channel)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((rec) => rec.proposal);
    },

    // The delete IS the claim — see the interface. Nothing is awaited between
    // the read and the delete, so two concurrent callers cannot both win.
    //
    // A RETIRED or superseded record is refused rather than deleted (#583): two
    // doors reach the claim with a proposal they are holding in memory instead
    // of one they just looked up, and the lookups alone therefore left a
    // replaced card executable. The reason this is the store's job, and the
    // per-message run lease that makes the race reachable, are on the
    // interface.
    async claimProposal(proposalTs) {
      const rec = proposals.get(proposalTs);
      if (!rec || rec.retired || rec.supersededBy) return false;
      return proposals.delete(proposalTs);
    },

    // ----- executions -----

    async beginExecution(proposal) {
      executions.set(proposal.proposalTs, { proposal, startedAt: now(), settled: [] });
    },

    async settleOperation(proposalTs, index, ok) {
      const rec = executions.get(proposalTs);
      if (!rec) return { taken: false };
      if (rec.takenAt !== undefined) return { taken: true };
      if (!rec.settled.some((s) => s.index === index)) rec.settled = [...rec.settled, { index, ok }];
      return { taken: false };
    },

    async endExecution(proposalTs) {
      executions.delete(proposalTs);
    },

    async takeCutOffExecution(proposalTs) {
      return takeIfCutOff(proposalTs);
    },

    async takeCutOffExecutionInThread(ref) {
      let best: Execution | null = null;
      for (const rec of executions.values()) {
        if (rec.proposal.channel !== ref.channel) continue;
        if (proposalReplyThread(rec.proposal) !== ref.thread) continue;
        if (rec.takenAt !== undefined) continue;
        const age = now() - rec.startedAt;
        if (age <= EXECUTION_CUTOFF_MS || age > PROPOSAL_TTL_MS) continue;
        if (!best || rec.startedAt > best.startedAt) best = rec;
      }
      return best ? takeIfCutOff(best.proposal.proposalTs) : null;
    },

    async findCutOffExecutions() {
      const found: Execution[] = [];
      for (const rec of executions.values()) {
        if (rec.takenAt !== undefined) continue;
        const age = now() - rec.startedAt;
        if (age <= EXECUTION_CUTOFF_MS || age > PROPOSAL_TTL_MS) continue;
        found.push({ ...rec, settled: [...rec.settled] });
      }
      return found.sort((a, b) => a.startedAt - b.startedAt);
    },

    async releaseCutOffExecution(proposalTs) {
      const rec = executions.get(proposalTs);
      if (rec) delete rec.takenAt;
    },

    // ----- assistant context -----

    async getAssistantContext(ref) {
      const key = threadKey(ref);
      const rec = assistantContext.get(key);
      if (!rec) return null;
      if (now() - rec.updatedAt > HISTORY_TTL_MS) {
        assistantContext.delete(key);
        return null;
      }
      return rec.context;
    },

    async putAssistantContext(ref, context) {
      assistantContext.set(threadKey(ref), { context, updatedAt: now() });
    },

    // ----- cancel -----

    async requestCancel(ref) {
      cancels.set(threadKey(ref), { at: now() });
    },

    async consumeCancel(ref, since) {
      const key = threadKey(ref);
      const rec = cancels.get(key);
      if (!rec) return false;
      // Consumed whether or not it counts: neither a stale flag nor one raised
      // before this turn began may survive to abort the next question.
      cancels.delete(key);
      if (since !== undefined && rec.at < since) return false;
      return now() - rec.at < CANCEL_TTL_MS;
    },

    async cancelForUser(userId) {
      const rec = activeRuns.get(userId);
      if (!rec || now() - rec.at > CANCEL_TTL_MS) return { cancelled: false };
      cancels.set(threadKey(rec), { at: now() });
      return { cancelled: true, channel: rec.channel, thread: rec.thread };
    },

    async setActiveRun(userId, ref) {
      activeRuns.set(userId, { channel: ref.channel, thread: ref.thread, at: now() });
    },

    // ----- event dedup + the run lease -----

    async checkAndRecordEvent(eventId) {
      const existing = events.get(eventId);
      if (existing && now() - existing.seenAt < EVENT_DEDUP_TTL_MS) {
        if (existing.status === "done") return { seen: true };
        if (now() - existing.seenAt < RUN_LEASE_MS) return { seen: true };
        // a stale lease is no longer evidence the event was handled
      }
      events.set(eventId, { seenAt: now(), status: "done" });
      return { seen: false };
    },

    async claimRun(eventId): Promise<RunClaim> {
      const existing = events.get(eventId);
      if (existing && now() - existing.seenAt < EVENT_DEDUP_TTL_MS) {
        if (existing.status === "done") return "done";
        if (now() - existing.seenAt < RUN_LEASE_MS) return "running";
        // Stale "running" lease → the owner was killed mid-run; reclaim.
      }
      events.set(eventId, { seenAt: now(), status: "running" });
      return "claimed";
    },

    async markRunDone(eventId) {
      const existing = events.get(eventId);
      events.set(eventId, { seenAt: existing?.seenAt ?? now(), status: "done" });
    },
  };
}
