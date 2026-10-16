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
import type { OutageStore } from "../turn/capacity-outage";
import type {
  BlueprintCheckOffer,
  CutOffNoteReport,
  DecidedMark,
  DecisionReportRecord,
  Execution,
  FiledIssue,
  FilingClaim,
  HistoryTurn,
  PendingProposal,
  ProposalLookup,
  ReportChange,
  RunClaim,
  StagingReport,
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

    putProposal(proposal: PendingProposal): Promise<StagingReport> {
      return hop().putProposal(proposal, now());
    },

    // Retire, as distinct from claim: the record stays readable so a ✅ on the
    // replaced card can be told it was replaced (#583).
    retireProposal(proposalTs: string): Promise<{ retired: boolean }> {
      return hop().retireProposal(proposalTs, now());
    },

    // Needs changes' lock: one hop, so of two racing presses one marks it.
    markRevising(proposalTs: string, userId: string): Promise<"marked" | "already" | "gone"> {
      return hop().markRevising(proposalTs, userId, now());
    },

    clearRevising(proposalTs: string): Promise<void> {
      return hop().clearRevising(proposalTs);
    },

    // A pick kept on the Review pop-up: one hop, one transaction, so two quick
    // picks merge rather than race.
    keepPick(proposalTs: string, userId: string, key: string, value: string | null): Promise<Record<string, string> | null> {
      return hop().keepPick(proposalTs, userId, key, value, now());
    },

    getProposalByTs(proposalTs: string): Promise<ProposalLookup> {
      return hop().getProposalByTs(proposalTs, now());
    },

    getProposalByThread(ref: ThreadRef): Promise<PendingProposal | null> {
      return hop().getProposalByThread(ref, now());
    },

    getProposalsByThread(ref: ThreadRef): Promise<PendingProposal[]> {
      return hop().getProposalsByThread(ref, now());
    },

    getProposalsByChannel(channel: string): Promise<PendingProposal[]> {
      return hop().getProposalsByChannel(channel, now());
    },

    // The delete IS the claim, in one transaction with the read before it: of
    // racing resolvers exactly one hop returns true. What was decided rides
    // the same hop, so keeping the decided card for View costs nothing extra.
    claimProposal(proposalTs: string, decided?: DecidedMark): Promise<boolean> {
      return hop().claimProposal(proposalTs, now(), decided);
    },

    // ----- decision reports -----

    putReport(report: DecisionReportRecord): Promise<void> {
      return hop().putReport(report, now());
    },

    getReport(messageTs: string): Promise<DecisionReportRecord | null> {
      return hop().getReport(messageTs, now());
    },

    updateReport(messageTs: string, change: ReportChange): Promise<DecisionReportRecord | null> {
      return hop().updateReport(messageTs, change, now());
    },

    prepareReportExpiry(messageTs) {
      return hop().prepareReportExpiry(messageTs, now());
    },

    acknowledgeReportExpiry(messageTs, revision) {
      return hop().acknowledgeReportExpiry(messageTs, revision, now());
    },

    prepareCardExpiry(proposalTs) {
      return hop().prepareCardExpiry(proposalTs, now());
    },

    acknowledgeCardExpiry(proposalTs) {
      return hop().acknowledgeCardExpiry(proposalTs);
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

    // A take, like the claim, is one transaction: exactly one of two looks at
    // a stuck card comes away with it.
    takeCutOffExecution(proposalTs: string): Promise<Execution | null> {
      return hop().takeCutOffExecution(proposalTs, now());
    },

    takeCutOffExecutionInThread(ref: ThreadRef): Promise<Execution | null> {
      return hop().takeCutOffExecutionInThread(ref, now());
    },

    findCutOffExecutions(): Promise<Execution[]> {
      return hop().findCutOffExecutions(now());
    },

    reportCutOffNote(proposalTs: string, posted: boolean): Promise<CutOffNoteReport> {
      return hop().reportCutOffNote(proposalTs, posted);
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

    // ----- one filing per key -----

    // One hop, one transaction, so of two racing callers one files.
    claimFiling(key: string): Promise<FilingClaim> {
      return hop().claimFiling(key, now());
    },

    settleFiling(key: string, issue: FiledIssue | null): Promise<void> {
      return hop().settleFiling(key, issue, now());
    },

    // ----- one comparison per scenario per thread -----

    claimComparison(ref: ThreadRef, scenario: string): Promise<boolean> {
      return hop().claimComparison(ref, scenario, now());
    },

    // ----- the blueprint check's offers -----

    putCheckOffer(offer: BlueprintCheckOffer): Promise<void> {
      return hop().putCheckOffer(offer, now());
    },

    getCheckOffer(offerTs: string): Promise<BlueprintCheckOffer | null> {
      return hop().getCheckOffer(offerTs, now());
    },
  };
}

/**
 * The capacity outage's record on the same single instance: one hop per call,
 * charged like every other. Its own adapter rather than three more methods on
 * `ThreadState`, because it is not thread memory; it lives in this object
 * only because this is the workspace's one serialized store.
 *
 * @param deps - The binding, and an instance for the conformance suite
 */
export function createDurableObjectOutageStore(deps: {
  namespace: DurableObjectNamespace<ThreadStateDurableObject>;
  instance?: string;
}): OutageStore {
  const instance = deps.instance ?? DO_INSTANCE_NAME;
  function hop(): DurableObjectStub<ThreadStateDurableObject> {
    charge(1, "thread-state");
    return deps.namespace.get(deps.namespace.idFromName(instance));
  }
  return {
    failed: (at) => hop().capacityFailed(at),
    succeeded: (at) => hop().capacitySucceeded(at),
    release: (told) => hop().capacityRelease(told),
  };
}
