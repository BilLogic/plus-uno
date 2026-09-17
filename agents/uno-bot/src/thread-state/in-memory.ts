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
  HISTORY_TTL_MS,
  MAX_HISTORY_TURNS,
  PROPOSAL_TTL_MS,
  RUN_LEASE_MS,
  proposalReplyThread,
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
        if (rec.proposal.channel !== ref.channel || rec.proposal.threadTs !== ref.thread) continue;
        if (!best || rec.createdAt > best.createdAt) best = rec;
      }
      return best?.proposal ?? null;
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

    async consumeCancel(ref) {
      const key = threadKey(ref);
      const rec = cancels.get(key);
      if (!rec) return false;
      // Consumed whether or not it was fresh: a stale flag must not survive to
      // abort the next question either.
      cancels.delete(key);
      return now() - rec.at < CANCEL_TTL_MS;
    },

    async cancelForUser(userId) {
      const rec = activeRuns.get(userId);
      if (!rec || now() - rec.at > CANCEL_TTL_MS) return { cancelled: false };
      cancels.set(threadKey(rec), { at: now() });
      return { cancelled: true, channel: rec.channel };
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
