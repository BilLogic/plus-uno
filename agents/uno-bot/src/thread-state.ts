// Durable Object: per-workspace store for
//   (a) conversation history per Slack thread
//   (b) pending tool-call proposals awaiting ✅ confirmation
//   (c) processed Slack event_id dedup (defeats Slack retry double-delivery)
//   (d) latest assistant-panel context per thread (what surface the user has open)
//
// Single instance per workspace. Which instance, and the `idFromName` that
// picks it, is decided in `src/thread-state/durable-object.ts` — the keying
// seam — and nowhere else; no caller and not this class computes an id.
//
// Storage keys: `hist:{channel}:{thread}`, `prop:{ts}`, `event:{event_id}`,
// `actx:{channel}:{thread}`, `cancel:{channel}:{thread}`, `run:{user}`.
//
// ── THE CONTRACT IS THIS CLASS'S OWN SIGNATURE (#493, #494) ─────────────────
//
// Every public method below is Durable Object RPC and its signature IS the
// `src/thread-state` interface: `readHistory`, `appendHistory`,
// `compactHistory`, `putProposal`, `getProposalByTs`, `getProposalByThread`,
// `claimProposal`, `get/putAssistantContext`, `requestCancel`,
// `consumeCancel`, `cancelForUser`, `setActiveRun`, `checkAndRecordEvent`,
// `claimRun`, `markRunDone`. A rename is a type error rather than a runtime
// 404, which is the whole point.
//
// There is NO `fetch()` and no route table. Until #494 this class carried a
// second door — thirteen hand-encoded URL strings matched out of a path and
// parsed back out of query parameters, with `src/thread-state-client.ts`
// building the same strings on the other side. Both are deleted: every caller
// now reaches this state through the module, and the only thing that reads or
// writes these keys is the RPC surface below. The record shapes are unchanged,
// so the state the routes wrote is the state the methods read.
//
// WHY EVERY RPC METHOD TAKES `at: number`. Timings are owned by
// `src/thread-state/store.ts`, and so is the clock: `ThreadStateDeps.now` is
// what makes a 20-minute lease testable without a 20-minute sleep. The adapter
// stamps each hop with its own `now()`, and this class never reads the wall
// clock on a caller's path. In production that value IS `Date.now()`, one stub
// hop away. The GC alarm below is the one exception — it is nobody's caller, so
// it reads the clock itself.

import { DurableObject } from "cloudflare:workers";

import type { Env } from "./types";
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
} from "./thread-state/store";
import type { AssistantContext } from "./slack/types";

interface HistoryRecord {
  turns: HistoryTurn[];
  updatedAt: number;
}

interface ProposalRecord {
  payload: unknown;
  createdAt: number;
  /** The ts of the card that replaced this one, when a later turn staged a
   *  revision in the same conversation (#573). Absent on every record written
   *  before it shipped, which reads as "not superseded" — the right answer. */
  supersededBy?: string;
  /** Retired ahead of the revision that is replacing it (#583), before that
   *  card exists to be named. Readable, and out of reach of every lookup that
   *  can lead to an execution. */
  retired?: boolean;
}

// Latest assistant-panel context (what surface the user has open) per thread.
// Written on assistant_thread_started / _context_changed, read by the next
// message. Stored opaque (the Slack AssistantContext shape) — the client types it.
interface AssistantContextRecord {
  context: unknown;
  updatedAt: number;
}

interface EventRecord {
  seenAt: number;
  /** "running" = agent turn in flight (lease); "done" = handled. Absent on legacy records = done. */
  status?: "running" | "done";
}

// How often the storage-GC alarm runs. Expired records are already ignored on
// read (TTL checks), but the DO is a single instance whose storage otherwise
// only grows — event: records in particular are write-once-per-message and were
// never deleted. A daily sweep keeps storage bounded (review 2026-07-12).
const GC_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Extends the `cloudflare:workers` base class — that is what makes the public
// methods below callable as Durable Object RPC (compatibility_date 2026-05-01).
export class ThreadState extends DurableObject<Env> {
  private storage: DurableObjectStorage;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.storage = state.storage;
  }

  // Ensure a GC alarm is scheduled. Cheap (one storage read) and idempotent —
  // called after every write so an idle-then-active DO always has a pending sweep.
  private async ensureGcAlarm(): Promise<void> {
    const existing = await this.storage.getAlarm();
    if (existing === null) {
      await this.storage.setAlarm(Date.now() + GC_INTERVAL_MS);
    }
  }

  // Delete expired records by their own TTL, then reschedule if anything remains.
  // Keys: event:{id} (EVENT_DEDUP_TTL_MS), hist:{…} (HISTORY_TTL_MS),
  // prop:{ts} (PROPOSAL_TTL_MS). Runs at most once a day.
  async alarm(): Promise<void> {
    const now = Date.now();
    let remaining = 0;

    const events = await this.storage.list<EventRecord>({ prefix: "event:" });
    for (const [key, rec] of events) {
      if (now - rec.seenAt > EVENT_DEDUP_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    const hist = await this.storage.list<HistoryRecord>({ prefix: "hist:" });
    for (const [key, rec] of hist) {
      if (now - rec.updatedAt > HISTORY_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    const props = await this.storage.list<ProposalRecord>({ prefix: "prop:" });
    for (const [key, rec] of props) {
      if (now - rec.createdAt > PROPOSAL_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    // Active-run pointers: one key per user, overwritten each turn, so this is
    // a bounded set rather than a leak — but a pointer older than its TTL can
    // never do anything except be ignored, so drop it rather than keep the
    // record of who talked to the bot last week.
    const runs = await this.storage.list<{ at: number }>({ prefix: "run:" });
    for (const [key, rec] of runs) {
      if (now - rec.at > CANCEL_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    const actx = await this.storage.list<AssistantContextRecord>({ prefix: "actx:" });
    for (const [key, rec] of actx) {
      if (now - rec.updatedAt > HISTORY_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }

    if (remaining > 0) await this.storage.setAlarm(now + GC_INTERVAL_MS);
  }

  // ══ The ThreadState RPC surface ════════════════════════════════════════════
  //
  // One method per interface method, same names, same arguments, plus the
  // caller's `at` (see the header). These are the methods
  // `createDurableObjectThreadState` calls, and the only door into this state.

  // ----- history -----

  /** Live turns for a conversation, evicting the record if it has aged out.
   *  Expiry is applied on READ rather than by the GC alarm, so a fresh Durable
   *  Object with no alarm scheduled answers identically. */
  private async liveTurns(ref: ThreadRef, at: number): Promise<HistoryTurn[]> {
    const key = historyKey(ref.channel, ref.thread);
    const rec = await this.storage.get<HistoryRecord>(key);
    if (!rec) return [];
    if (at - rec.updatedAt > HISTORY_TTL_MS) {
      await this.storage.delete(key);
      return [];
    }
    return rec.turns;
  }

  async readHistory(ref: ThreadRef, at: number): Promise<HistoryTurn[]> {
    return this.liveTurns(ref, at);
  }

  async appendHistory(
    ref: ThreadRef,
    turn: HistoryTurn,
    at: number,
  ): Promise<{ length: number }> {
    const prev = await this.liveTurns(ref, at);
    const turns = [...prev, turn].slice(-MAX_HISTORY_TURNS);
    await this.storage.put<HistoryRecord>(historyKey(ref.channel, ref.thread), {
      turns,
      updatedAt: at,
    });
    await this.ensureGcAlarm();
    return { length: turns.length };
  }

  async compactHistory(
    ref: ThreadRef,
    keepRecent: number,
    at: number,
  ): Promise<{ turns: HistoryTurn[]; dropped: number }> {
    const turns = await this.liveTurns(ref, at);
    // Nothing to gain once the tail is the whole conversation (or all but the
    // opening turn, which is kept either way).
    if (turns.length <= keepRecent + 1) return { turns, dropped: 0 };
    const kept = [turns[0]!, ...turns.slice(-keepRecent)];
    await this.storage.put<HistoryRecord>(historyKey(ref.channel, ref.thread), {
      turns: kept,
      updatedAt: at,
    });
    return { turns: kept, dropped: turns.length - kept.length };
  }

  // ----- proposals -----

  // Staging retires whatever was still pending in the same REPLY THREAD (#573):
  // a person who answers a card with feedback gets a revised card, and a ✅ on
  // the old one used to execute the very input they were pushing back on. The
  // retired record is kept rather than deleted so a late ✅ can be told it was
  // replaced. Why the grain is the reply thread rather than the conversation
  // key — and why that is what keeps two unrelated DM asks apart — is in
  // `thread-state/store.ts` on `putProposal`. One scan of the staged set, as
  // `getProposalByThread` does: live cardinality is small because proposals
  // expire after an hour.
  //
  // Retire first, then write — a choice, not an accident: the new card is the
  // one a racing ✅ has to be able to find, so it is the last thing to land.
  async putProposal(proposal: PendingProposal, at: number): Promise<void> {
    const thread = proposalReplyThread(proposal);
    const all = await this.storage.list<ProposalRecord>({ prefix: "prop:" });
    for (const [key, rec] of all) {
      if (key === proposalKey(proposal.proposalTs)) continue;
      // A record already stamped with a successor is settled. One only RETIRED
      // still wants this ts — that is the caller who retired it ahead of
      // staging this very card (#583).
      if (rec.supersededBy) continue;
      if (at - rec.createdAt > PROPOSAL_TTL_MS) continue; // already "expired"
      const pending = rec.payload as PendingProposal | null;
      if (!pending || pending.channel !== proposal.channel) continue;
      if (proposalReplyThread(pending) !== thread) continue;
      await this.storage.put<ProposalRecord>(key, {
        ...rec,
        supersededBy: proposal.proposalTs,
      });
    }
    await this.storage.put<ProposalRecord>(proposalKey(proposal.proposalTs), {
      payload: proposal,
      createdAt: at,
    });
    await this.ensureGcAlarm();
  }

  // Retire without consuming — the counterpart to the claim, and why the two
  // are different methods is on the interface (#583). A missing record is a
  // no-op: there is nothing left that could be acted on.
  async retireProposal(proposalTs: string): Promise<void> {
    const key = proposalKey(proposalTs);
    const rec = await this.storage.get<ProposalRecord>(key);
    if (!rec) return;
    await this.storage.put<ProposalRecord>(key, { ...rec, retired: true });
  }

  // Is the card that retired another one still around to be looked at? Its own
  // retirement does not matter: a chain still ends in a live newest card.
  private async successorIsLive(ts: string, at: number): Promise<boolean> {
    const rec = await this.storage.get<ProposalRecord>(proposalKey(ts));
    return !!rec && at - rec.createdAt <= PROPOSAL_TTL_MS;
  }

  // "expired", "superseded" and "none" are different answers on purpose: the
  // gate has to tell the requester their delayed ✅ hit an aged-out card, or a
  // card a revision replaced, rather than ignore it. A live successor beats the
  // TTL — the ordering, and the third card it stops the person from asking
  // for, are on `ProposalLookup` in `thread-state/store.ts`.
  async getProposalByTs(proposalTs: string, at: number): Promise<ProposalLookup> {
    const rec = await this.storage.get<ProposalRecord>(proposalKey(proposalTs));
    if (!rec) return { state: "none" };
    if (rec.supersededBy && (await this.successorIsLive(rec.supersededBy, at))) {
      return { state: "superseded" };
    }
    if (at - rec.createdAt > PROPOSAL_TTL_MS) {
      await this.storage.delete(proposalKey(proposalTs));
      return { state: "expired" };
    }
    if (rec.supersededBy || rec.retired) return { state: "superseded" };
    return {
      state: "found",
      proposal: rec.payload as PendingProposal,
      createdAt: rec.createdAt,
    };
  }

  // Scans the staged set: proposals expire after an hour, so live cardinality
  // stays small.
  async getProposalByThread(ref: ThreadRef, at: number): Promise<PendingProposal | null> {
    const all = await this.storage.list<ProposalRecord>({ prefix: "prop:" });
    let best: ProposalRecord | null = null;
    for (const rec of all.values()) {
      if (at - rec.createdAt > PROPOSAL_TTL_MS) continue;
      if (rec.supersededBy || rec.retired) continue; // retired, so never the thread's live card
      const proposal = rec.payload as PendingProposal | null;
      if (!proposal || proposal.channel !== ref.channel || proposal.threadTs !== ref.thread) continue;
      if (!best || rec.createdAt > best.createdAt) best = rec;
    }
    return (best?.payload as PendingProposal | undefined) ?? null;
  }

  // The delete IS the claim. A Durable Object handles one event at a time, so of
  // two racing resolvers exactly one sees `true` — which is the whole
  // double-execution guard, because `notion_create` is not idempotent.
  async claimProposal(proposalTs: string): Promise<boolean> {
    return this.storage.delete(proposalKey(proposalTs));
  }

  // ----- assistant context -----

  async getAssistantContext(ref: ThreadRef, at: number): Promise<AssistantContext | null> {
    const key = assistantContextKey(ref.channel, ref.thread);
    const rec = await this.storage.get<AssistantContextRecord>(key);
    if (!rec) return null;
    if (at - rec.updatedAt > HISTORY_TTL_MS) {
      await this.storage.delete(key);
      return null;
    }
    return rec.context as AssistantContext;
  }

  async putAssistantContext(
    ref: ThreadRef,
    context: AssistantContext,
    at: number,
  ): Promise<void> {
    await this.storage.put<AssistantContextRecord>(
      assistantContextKey(ref.channel, ref.thread),
      { context, updatedAt: at },
    );
    await this.ensureGcAlarm();
  }

  // ----- cancel -----

  async requestCancel(ref: ThreadRef, at: number): Promise<void> {
    await this.storage.put(cancelKey(ref.channel, ref.thread), { at });
  }

  /** Reads AND clears the flag — one /stop cancels one turn. A stale flag is
   *  consumed too: leaving it set would abort the next question instead. */
  async consumeCancel(ref: ThreadRef, at: number): Promise<boolean> {
    const key = cancelKey(ref.channel, ref.thread);
    const rec = await this.storage.get<{ at: number }>(key);
    if (!rec) return false;
    await this.storage.delete(key);
    return at - rec.at < CANCEL_TTL_MS;
  }

  async cancelForUser(
    userId: string,
    at: number,
  ): Promise<{ cancelled: boolean; channel?: string }> {
    const rec = await this.storage.get<{ channel: string; thread: string; at: number }>(
      activeRunKey(userId),
    );
    if (!rec || at - rec.at > CANCEL_TTL_MS) return { cancelled: false };
    await this.storage.put(cancelKey(rec.channel, rec.thread), { at });
    return { cancelled: true, channel: rec.channel };
  }

  async setActiveRun(userId: string, ref: ThreadRef, at: number): Promise<void> {
    await this.storage.put(activeRunKey(userId), {
      channel: ref.channel,
      thread: ref.thread,
      at,
    });
  }

  // ----- event dedup + the run lease -----
  //
  // One record, two questions: `checkAndRecordEvent` asks "have I seen this?"
  // and `claimRun` asks "may I run it?". See the interface for why a stale
  // "running" lease is reclaimed rather than trusted (the 2026-07-10 incident).

  async checkAndRecordEvent(eventId: string, at: number): Promise<{ seen: boolean }> {
    const key = eventKey(eventId);
    const existing = await this.storage.get<EventRecord>(key);
    if (existing && at - existing.seenAt < EVENT_DEDUP_TTL_MS) {
      const status = existing.status ?? "done"; // legacy records = one-shot
      if (status === "done") return { seen: true };
      if (at - existing.seenAt < RUN_LEASE_MS) return { seen: true };
      // a stale lease is no longer evidence the event was handled
    }
    await this.storage.put<EventRecord>(key, { seenAt: at, status: "done" });
    await this.ensureGcAlarm();
    return { seen: false };
  }

  async claimRun(eventId: string, at: number): Promise<RunClaim> {
    const key = eventKey(eventId);
    const existing = await this.storage.get<EventRecord>(key);
    if (existing && at - existing.seenAt < EVENT_DEDUP_TTL_MS) {
      const status = existing.status ?? "done";
      if (status === "done") return "done";
      if (at - existing.seenAt < RUN_LEASE_MS) return "running";
      // Stale "running" lease → the owner was killed mid-run; reclaim.
    }
    await this.storage.put<EventRecord>(key, { seenAt: at, status: "running" });
    await this.ensureGcAlarm();
    return "claimed";
  }

  async markRunDone(eventId: string, at: number): Promise<void> {
    const key = eventKey(eventId);
    const existing = await this.storage.get<EventRecord>(key);
    await this.storage.put<EventRecord>(key, {
      seenAt: existing?.seenAt ?? at,
      status: "done",
    });
  }
}

function historyKey(channel: string, thread: string): string {
  return `hist:${channel}:${thread}`;
}

function proposalKey(ts: string): string {
  return `prop:${ts}`;
}

function eventKey(eventId: string): string {
  return `event:${eventId}`;
}

// Cancel flags expire fast on purpose: a stale one would abort the NEXT
// question, which reads as the bot ignoring you. (The duration itself now lives
// in src/thread-state/store.ts with every other TTL this class honours.)
function cancelKey(channel: string, thread: string): string {
  return `cancel:${channel}:${thread}`;
}

// Same TTL as a cancel flag — see setActiveRun.
function activeRunKey(user: string): string {
  return `run:${user}`;
}

function assistantContextKey(channel: string, thread: string): string {
  return `actx:${channel}:${thread}`;
}
