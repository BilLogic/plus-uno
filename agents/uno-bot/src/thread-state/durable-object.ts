// The Durable Object ThreadState adapter — production's store.
//
// It is a thin translation and nothing else: every method calls the Durable
// Object method of the same name on the stub (`src/thread-state.ts`, which
// extends `DurableObject` so its methods are callable as RPC). No URL, no
// query string, no JSON body, no status-code branch. A renamed or re-signed
// method is a TYPE error here, which is the whole reason the contract moved
// off hand-encoded routes: the old client's `/proposals/by-thread` could be
// renamed on one side and fail only at runtime, in the one code path whose
// failure mode is a thread going silent.
//
// ── THE CHARGE (ADR-022) ─────────────────────────────────────────────────────
// A Durable Object stub call is a real subrequest against the free plan's
// internal (Cloudflare-services) budget, and it never goes through `fetch()`,
// so `net.ts`'s meter cannot see it. It is charged here, once per hop, in
// `hop()` — the ONE place in this module where a stub call happens, which is
// exactly where the old client's `call()` charged it. Every method below spends
// exactly one hop, so the internal counter rises by exactly one per method
// call. Nothing else in the Worker may reach this namespace.
//
// ── THE KEYING SEAM ─────────────────────────────────────────────────────────
// The Durable Object id is computed in here and nowhere else: today one global
// instance per workspace, `idFromName("uno-bot")`, the same key the old client
// used, so this adapter reads the state the routes have been writing since the
// DO shipped. No caller has ever to build an id, and when the per-thread
// AgentRunner keying joins the module it changes one function in this file.
//
// ── THE CLOCK ───────────────────────────────────────────────────────────────
// `deps.now` is stamped onto every hop rather than read inside the Durable
// Object, so the conformance suite can advance a 20-minute lease without
// sleeping for twenty minutes. Production passes `Date.now`.

import { charge } from "../net";
import type { AssistantContext } from "../slack/types";
import type { ThreadState as ThreadStateDurableObject } from "../thread-state";
import type {
  Execution,
  HistoryTurn,
  PendingProposal,
  ProposalLookup,
  RunClaim,
  ThreadRef,
  ThreadState,
  ThreadStateDeps,
} from "./store";

/** One global ThreadState instance per workspace. Never leaves this file. */
const DO_INSTANCE_NAME = "uno-bot";

export interface DurableObjectThreadStateDeps extends ThreadStateDeps {
  /** The `THREAD_STATE` binding. Named, not `Env` — a test constructs this and
   *  a clock and nothing else. */
  namespace: DurableObjectNamespace<ThreadStateDurableObject>;
  /**
   * Which instance to key. Production NEVER passes this: the default is the
   * single global instance the routes have always used, and the whole point of
   * the keying seam is that a caller cannot choose. It exists so the
   * conformance suite gets a genuinely EMPTY store per test — the alternative
   * is a reset method on the production class, which is a worse thing to own.
   */
  instance?: string;
}

export function createDurableObjectThreadState(
  deps: DurableObjectThreadStateDeps,
): ThreadState {
  const now = deps.now ?? Date.now;
  const instance = deps.instance ?? DO_INSTANCE_NAME;

  /** One Durable Object hop: charge it, then hand back the stub. Called exactly
   *  once per interface method, so the internal subrequest counter and the
   *  number of hops are the same number (ADR-022). */
  function hop(): DurableObjectStub<ThreadStateDurableObject> {
    charge(1, "thread-state");
    return deps.namespace.get(deps.namespace.idFromName(instance));
  }

  return {
    // ----- history -----

    readHistory(ref: ThreadRef): Promise<HistoryTurn[]> {
      return hop().readHistory(ref, now());
    },

    appendHistory(ref: ThreadRef, turn: HistoryTurn): Promise<{ length: number }> {
      return hop().appendHistory(ref, turn, now());
    },

    compactHistory(
      ref: ThreadRef,
      opts: { keepRecent: number },
    ): Promise<{ turns: HistoryTurn[]; dropped: number }> {
      return hop().compactHistory(ref, opts.keepRecent, now());
    },

    // ----- proposals -----

    putProposal(proposal: PendingProposal): Promise<void> {
      return hop().putProposal(proposal, now());
    },

    // Retire, as distinct from claim: the record stays readable so a ✅ on the
    // replaced card can be told it was replaced (#583).
    retireProposal(proposalTs: string): Promise<void> {
      return hop().retireProposal(proposalTs);
    },

    getProposalByTs(proposalTs: string): Promise<ProposalLookup> {
      return hop().getProposalByTs(proposalTs, now());
    },

    getProposalByThread(ref: ThreadRef): Promise<PendingProposal | null> {
      return hop().getProposalByThread(ref, now());
    },

    getProposalsByChannel(channel: string): Promise<PendingProposal[]> {
      return hop().getProposalsByChannel(channel, now());
    },

    // The delete IS the claim, and it is the Durable Object's input gate that
    // makes it one: of two racing resolvers exactly one hop returns true.
    claimProposal(proposalTs: string): Promise<boolean> {
      return hop().claimProposal(proposalTs);
    },

    // ----- executions -----

    beginExecution(proposal: PendingProposal): Promise<void> {
      return hop().beginExecution(proposal, now());
    },

    settleOperation(proposalTs: string, index: number, ok: boolean): Promise<{ taken: boolean }> {
      return hop().settleOperation(proposalTs, index, ok);
    },

    endExecution(proposalTs: string): Promise<void> {
      return hop().endExecution(proposalTs);
    },

    // A take, like the claim: the Durable Object's input gate is what lets
    // exactly one of two looks at a stuck card come away with it.
    takeCutOffExecution(proposalTs: string): Promise<Execution | null> {
      return hop().takeCutOffExecution(proposalTs, now());
    },

    takeCutOffExecutionInThread(ref: ThreadRef): Promise<Execution | null> {
      return hop().takeCutOffExecutionInThread(ref, now());
    },

    findCutOffExecutions(): Promise<Execution[]> {
      return hop().findCutOffExecutions(now());
    },

    releaseCutOffExecution(proposalTs: string): Promise<void> {
      return hop().releaseCutOffExecution(proposalTs);
    },

    // ----- assistant context -----

    getAssistantContext(ref: ThreadRef): Promise<AssistantContext | null> {
      return hop().getAssistantContext(ref, now());
    },

    putAssistantContext(ref: ThreadRef, context: AssistantContext): Promise<void> {
      return hop().putAssistantContext(ref, context, now());
    },

    // ----- cancel -----

    requestCancel(ref: ThreadRef): Promise<void> {
      return hop().requestCancel(ref, now());
    },

    consumeCancel(ref: ThreadRef, since?: number): Promise<boolean> {
      return hop().consumeCancel(ref, now(), since);
    },

    cancelForUser(
      userId: string,
    ): Promise<{ cancelled: boolean; channel?: string; thread?: string }> {
      return hop().cancelForUser(userId, now());
    },

    setActiveRun(userId: string, ref: ThreadRef): Promise<void> {
      return hop().setActiveRun(userId, ref, now());
    },

    // ----- event dedup + the run lease -----

    checkAndRecordEvent(eventId: string): Promise<{ seen: boolean }> {
      return hop().checkAndRecordEvent(eventId, now());
    },

    claimRun(eventId: string): Promise<RunClaim> {
      return hop().claimRun(eventId, now());
    },

    markRunDone(eventId: string): Promise<void> {
      return hop().markRunDone(eventId, now());
    },
  };
}
