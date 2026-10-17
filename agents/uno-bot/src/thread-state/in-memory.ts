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
  RUN_LEASE_MS,
  afterFailedNote,
  cutOffTakeable,
  ownTtl,
  ownWords,
  ownText,
  ownOperations,
  cardExpiryOwed,
  cardExpiriesToTake,
  replacedByOf,
  decidedLive,
  expiredCardEdit,
  REPORT_GRACE_MS,
  changedReport,
  expiredReport,
  reportItemLook,
  type ReportExpiryRecord,
  claimedFiling,
  claimedCheck,
  liveCheck,
  steppedCheck,
  type CheckRecord,
  comparisonKey,
  CHECK_OFFER_KEEP_MS,
  type CheckOfferRecord,
  decidedInQuestion,
  type WhichCardPointer,
  type WhichQuestionRecord,
  decidedNoteOf,
  decidedOf,
  decidedPayload,
  type DecidedNote,
  proposalReplyThread,
  proposalSlot,
  proposalTtlMs,
  stampedTtl,
  newestCardFirst,
  cardOrder,
  withLiveMark,
  type DecisionReportRecord,
  type Execution,
  type FilingRecord,
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
  /** Picks kept on the card's Review pop-up, by user id (`keepPick`). */
  kept?: Record<string, Record<string, string>>;
  /** Claimed with what was decided: `proposal` is the decided card, kept for
   *  View for `DECIDED_TTL_MS` from `decidedAt`, and out of reach of every
   *  other lookup. */
  decided?: DecidedNote;
  decidedAt?: number;
  /** The card's message says it expired (`acknowledgeCardExpiry`). */
  expiryShown?: true;
  /** When it was last taken for its edit (`takeCardExpiries`). */
  expiryHandedOffAt?: number;
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
  const reports = new Map<string, ReportExpiryRecord>();
  /** A report's record while it lasts: its items' TTL, then the grace. */
  const liveReport = (messageTs: string) => {
    const rec = reports.get(messageTs);
    if (rec && now() - rec.createdAt > rec.report.ttlMs + REPORT_GRACE_MS) reports.delete(messageTs);
    return reports.get(messageTs) ?? null;
  };
  const assistantContext = new Map<string, AssistantContextRecord>();
  const cancels = new Map<string, { at: number }>();
  const activeRuns = new Map<string, ActiveRunRecord>();
  const events = new Map<string, EventRecord>();
  const filings = new Map<string, FilingRecord>();
  /** Each thread's check of a scenario, by `comparisonKey` (#1322). */
  const checks = new Map<string, CheckRecord>();
  /** Each Check it offer, by its message ts, with when it was put. */
  const checkOffers = new Map<string, CheckOfferRecord>();
  /** Each open "which one?" question, by its message ts, and each card it
   *  lists, pointing at it. */
  const whichQuestions = new Map<string, WhichQuestionRecord>();
  const whichCards = new Map<string, WhichCardPointer>();
  const executions = new Map<string, Execution>();

  /** Take an execution if it has been cut off; drop it if it has aged out;
   *  leave it alone if it may still be running. */
  function takeIfCutOff(ts: string): Execution | null {
    const rec = executions.get(ts);
    if (!rec) return null;
    if (now() - rec.startedAt > proposalTtlMs(rec.proposal)) {
      executions.delete(ts);
      return null;
    }
    if (!cutOffTakeable(rec, now())) return null;
    const taken = { ...rec, settled: [...rec.settled] };
    // Marked, not deleted: a run that is only slow reads the mark at its next
    // operation and stops (the fence, on `settleOperation`).
    rec.takenAt ??= now();
    delete rec.noteOwed;
    return taken;
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
    return !!rec && !rec.decided && now() - rec.createdAt <= proposalTtlMs(rec.proposal);
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

    async putProposal(staged) {
      const proposal = stampedTtl(staged, now());
      // The revised card retires the one it replaces, per REPLY THREAD — the
      // grain, and why a DM needs it, are in `putProposal`'s contract. Only
      // LIVE records are touched: an aged-out card is already answered by
      // "expired".
      const slot = proposalSlot(proposal);
      const retired: string[] = [];
      for (const rec of proposals.values()) {
        if (rec.proposal.proposalTs === proposal.proposalTs) continue;
        // A record already stamped with a successor is settled. One only
        // RETIRED still wants this ts — that is the caller who retired it
        // ahead of staging this very card.
        if (rec.supersededBy || rec.decided) continue;
        if (now() - rec.createdAt > proposalTtlMs(rec.proposal)) continue;
        if (rec.proposal.channel !== proposal.channel) continue;
        if (proposalSlot(rec.proposal) !== slot) continue;
        rec.supersededBy = proposal.proposalTs;
        // Reported only if this staging is what took it out of reach.
        if (!rec.retired) retired.push(rec.proposal.proposalTs);
      }
      // Retire first, then write — a choice, not an accident: the new card is
      // the one a racing ✅ has to be able to find, so it is the last thing to
      // land.
      proposals.set(proposal.proposalTs, { proposal, createdAt: now() });
      if (proposal.item) {
        const rec = reports.get(proposal.item.messageTs);
        if (rec) reports.set(proposal.item.messageTs, { ...rec, deadlines: { ...rec.deadlines, [proposal.item.id]: now() + proposalTtlMs(proposal) + 1 } });
      }
      return { retired };
    },

    // Retire without consuming — the counterpart to the claim, and why the two
    // are different methods is on the interface (#583).
    async retireProposal(proposalTs) {
      const rec = proposals.get(proposalTs);
      if (!rec || rec.decided || rec.retired || rec.supersededBy) return { retired: false };
      if (now() - rec.createdAt > proposalTtlMs(rec.proposal)) return { retired: false };
      rec.retired = true;
      delete rec.kept;
      return { retired: true };
    },

    async markRevising(proposalTs, userId) {
      const rec = proposals.get(proposalTs);
      if (!rec || rec.decided || rec.retired || rec.supersededBy) return "gone";
      if (now() - rec.createdAt > proposalTtlMs(rec.proposal)) return "gone";
      if (withLiveMark(rec.proposal, now()).revising) return "already";
      rec.proposal = { ...rec.proposal, revising: { userId, at: now() } };
      return "marked";
    },

    async clearRevising(proposalTs) {
      const rec = proposals.get(proposalTs);
      if (!rec?.proposal.revising) return;
      const { revising: _, ...rest } = rec.proposal;
      rec.proposal = rest;
    },

    async keepPick(proposalTs, userId, key, value) {
      const rec = proposals.get(proposalTs);
      if (!rec || rec.decided || rec.retired || rec.supersededBy) return null;
      if (now() - rec.createdAt > proposalTtlMs(rec.proposal)) return null;
      const mine = { ...(rec.kept?.[userId] ?? {}) };
      if (value === null) delete mine[key];
      else mine[key] = value;
      rec.kept = { ...(rec.kept ?? {}), [userId]: mine };
      return { ...mine };
    },

    async getProposalByTs(proposalTs): Promise<ProposalLookup> {
      const rec = proposals.get(proposalTs);
      if (!rec) return { state: "none" };
      // Decided: kept for View for its own lifetime from the decision, then
      // gone as a claimed card is.
      if (rec.decided) {
        if (!decidedLive(rec, rec.proposal, now())) {
          proposals.delete(proposalTs);
          return { state: "none" };
        }
        return { state: "none", decided: structuredClone(decidedOf(rec.proposal, rec.decided)) };
      }
      // A live successor beats the TTL — the ordering, and the third card it
      // stops the person from asking for, are in `ProposalLookup`.
      if (rec.supersededBy && successorIsLive(rec.supersededBy)) {
        const replacedBy = await replacedByOf(
          rec.supersededBy,
          (ts) => proposals.get(ts),
          (next) => !next.decided && !next.retired && now() - next.createdAt <= proposalTtlMs(next.proposal),
          (next) => next.proposal,
        );
        return { state: "superseded", ...ownWords(rec.proposal), ...ownText(rec.proposal), ...ownOperations(rec.proposal), ...structuredClone(replacedBy) };
      }
      if (now() - rec.createdAt > proposalTtlMs(rec.proposal)) {
        // Kept while its expiry edit is owed, so the edit still finds it.
        if (!cardExpiryOwed(rec, rec.proposal, now())) proposals.delete(proposalTs);
        return { state: "expired", ...ownTtl(rec.proposal), ...ownWords(rec.proposal), ...ownText(rec.proposal), ...ownOperations(rec.proposal) };
      }
      if (rec.supersededBy || rec.retired) {
        // A replacement that no longer waits is still named (story 18).
        const replacedBy = rec.supersededBy
          ? await replacedByOf(
              rec.supersededBy,
              (ts) => proposals.get(ts),
              (next) => !next.decided && !next.retired && now() - next.createdAt <= proposalTtlMs(next.proposal),
              (next) => next.proposal,
            )
          : {};
        return { state: "superseded", ...ownWords(rec.proposal), ...ownText(rec.proposal), ...ownOperations(rec.proposal), ...structuredClone(replacedBy) };
      }
      return { state: "found", proposal: withLiveMark(rec.proposal, now()), createdAt: rec.createdAt, ...(rec.kept ? { kept: structuredClone(rec.kept) } : {}) };
    },

    async getProposalByThread(ref) {
      // Scans the staged set, as the Durable Object does: proposals expire
      // by their TTL, so the live cardinality stays small.
      let best: ProposalRecord | null = null;
      for (const rec of proposals.values()) {
        if (now() - rec.createdAt > proposalTtlMs(rec.proposal)) continue;
        if (rec.supersededBy || rec.retired || rec.decided) continue; // retired or decided, so never the thread's live card
        if (rec.proposal.channel !== ref.channel) continue;
        if (proposalReplyThread(rec.proposal) !== ref.thread) continue; // keyed on the card's thread
        if (!best || newestCardFirst(cardOrder(rec), cardOrder(best)) < 0) best = rec;
      }
      return best ? withLiveMark(best.proposal, now()) : null;
    },

    async getProposalsByThread(ref) {
      return [...proposals.values()]
        .filter((rec) => now() - rec.createdAt <= proposalTtlMs(rec.proposal))
        .filter((rec) => !rec.supersededBy && !rec.retired && !rec.decided)
        .filter((rec) => rec.proposal.channel === ref.channel && proposalReplyThread(rec.proposal) === ref.thread)
        .sort((a, b) => newestCardFirst(cardOrder(a), cardOrder(b)))
        .map((rec) => withLiveMark(rec.proposal, now()));
    },

    async getProposalsByChannel(channel) {
      return [...proposals.values()]
        .filter((rec) => now() - rec.createdAt <= proposalTtlMs(rec.proposal))
        .filter((rec) => !rec.supersededBy && !rec.retired && !rec.decided)
        .filter((rec) => rec.proposal.channel === channel)
        .sort((a, b) => newestCardFirst(cardOrder(a), cardOrder(b)))
        .map((rec) => withLiveMark(rec.proposal, now()));
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
    //
    // Won with what was decided, the record stays as the decided card, for
    // View, for its own lifetime from now (`claimProposal` on the interface).
    async claimProposal(proposalTs, decided) {
      const rec = proposals.get(proposalTs);
      // A card being revised is refused too: its revision is on the way.
      if (!rec || rec.decided || rec.retired || rec.supersededBy || withLiveMark(rec.proposal, now()).revising) return false;
      if (!decided) return proposals.delete(proposalTs);
      proposals.set(proposalTs, {
        proposal: decidedPayload(rec.proposal, structuredClone(decided)),
        createdAt: rec.createdAt,
        decided: decidedNoteOf(decided),
        decidedAt: now(),
      });
      return true;
    },

    // ----- decision reports -----

    async putReport(report) {
      reports.set(report.messageTs, { report: structuredClone(report), createdAt: now() });
    },

    async getReport(messageTs) {
      return structuredClone(liveReport(messageTs)?.report ?? null);
    },

    async updateReport(messageTs, change) {
      const rec = liveReport(messageTs);
      const next = rec ? changedReport(rec.report, change) : null;
      if (!rec || !next) return null;
      if (next !== rec.report) reports.set(messageTs, { ...rec, report: next, revision: (rec.revision ?? 0) + 1 });
      return structuredClone(next);
    },

    async prepareReportExpiry(messageTs) {
      const rec = liveReport(messageTs);
      if (!rec) return null;
      const next = expiredReport(rec, reportItemLook((key) => {
        const proposal = proposals.get(key);
        return proposal && !proposal.decided ? { createdAt: proposal.createdAt, ttlMs: proposalTtlMs(proposal.proposal) } : undefined;
      }, (key) => executions.has(key)), now());
      reports.set(messageTs, next);
      return next.expiryPending ? structuredClone({ report: next.report, revision: next.revision ?? 0 }) : null;
    },

    async acknowledgeReportExpiry(messageTs, revision) {
      const rec = liveReport(messageTs);
      if (rec && (rec.revision ?? 0) === revision) reports.set(messageTs, { ...rec, expiryPending: false });
    },

    async prepareCardExpiry(proposalTs) {
      const rec = proposals.get(proposalTs);
      return rec && cardExpiryOwed(rec, rec.proposal, now()) ? structuredClone(expiredCardEdit(rec.proposal)) : null;
    },

    async acknowledgeCardExpiry(proposalTs) {
      const rec = proposals.get(proposalTs);
      if (rec) rec.expiryShown = true;
    },

    async takeCardExpiries(limit) {
      const at = now();
      const taken = cardExpiriesToTake([...proposals.values()].map((rec) => ({ rec, proposal: rec.proposal })), at, limit);
      for (const { rec } of taken) rec.expiryHandedOffAt = at;
      return taken.map(({ proposal }) => structuredClone(proposal));
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
      if (executions.get(proposalTs)?.takenAt === undefined) executions.delete(proposalTs);
    },

    async takeCutOffExecution(proposalTs) {
      return takeIfCutOff(proposalTs);
    },

    async takeCutOffExecutionInThread(ref) {
      let best: Execution | null = null;
      for (const rec of executions.values()) {
        if (rec.proposal.channel !== ref.channel) continue;
        if (proposalReplyThread(rec.proposal) !== ref.thread) continue;
        if (!cutOffTakeable(rec, now())) continue;
        if (!best || rec.startedAt > best.startedAt) best = rec;
      }
      return best ? takeIfCutOff(best.proposal.proposalTs) : null;
    },

    async findCutOffExecutions() {
      const found: Execution[] = [];
      for (const rec of executions.values()) {
        if (!cutOffTakeable(rec, now())) continue;
        found.push({ ...rec, settled: [...rec.settled] });
      }
      return found.sort((a, b) => a.startedAt - b.startedAt);
    },

    async reportCutOffNote(proposalTs, posted) {
      const rec = executions.get(proposalTs);
      if (!rec || rec.takenAt === undefined || posted) return "told";
      const { record, report } = afterFailedNote(rec);
      executions.set(proposalTs, record);
      return report;
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

    async claimFiling(key) {
      const { claim, store } = claimedFiling(filings.get(key), now());
      if (store) filings.set(key, store);
      return claim;
    },

    async settleFiling(key, issue) {
      if (issue) filings.set(key, { at: now(), issue });
      else filings.delete(key);
    },

    async claimCheck(ref, scenario, start) {
      const key = comparisonKey(ref, scenario);
      const { claim, store } = claimedCheck(checks.get(key), now(), start, crypto.randomUUID());
      if (store) checks.set(key, store);
      return structuredClone(claim);
    },

    async getCheck(ref, scenario) {
      const live = liveCheck(checks.get(comparisonKey(ref, scenario)), now());
      return live ? structuredClone(live) : null;
    },

    async stepCheck(ref, scenario, run, to) {
      const key = comparisonKey(ref, scenario);
      const stepped = steppedCheck(checks.get(key), now(), run, to);
      if (stepped) checks.set(key, stepped);
      return stepped !== null;
    },

    async putCheckOffer(offer) {
      checkOffers.set(offer.offerTs, { offer: structuredClone(offer), at: now() });
    },

    async getCheckOffer(offerTs) {
      const rec = checkOffers.get(offerTs);
      if (!rec) return null;
      if (now() - rec.at > CHECK_OFFER_KEEP_MS) {
        checkOffers.delete(offerTs);
        return null;
      }
      return structuredClone(rec.offer);
    },

    async putWhichQuestion(question) {
      const at = now();
      whichQuestions.set(question.questionTs, { question: structuredClone(question), at });
      for (const card of question.cards) whichCards.set(card.ts, { questionTs: question.questionTs, at });
    },

    async decideInWhichQuestion(cardTs) {
      const pointer = whichCards.get(cardTs);
      if (!pointer) return null;
      const rec = whichQuestions.get(pointer.questionTs);
      const { question, keep } = decidedInQuestion(rec, cardTs, now());
      // The card is decided, or its question is gone: its pointer is spent.
      whichCards.delete(cardTs);
      if (keep) whichQuestions.set(pointer.questionTs, keep);
      else {
        whichQuestions.delete(pointer.questionTs);
        for (const card of rec?.question.cards ?? []) {
          if (whichCards.get(card.ts)?.questionTs === pointer.questionTs) whichCards.delete(card.ts);
        }
      }
      return question ? structuredClone(question) : null;
    },
  };
}
