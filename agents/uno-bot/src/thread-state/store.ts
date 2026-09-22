// ThreadState — the Worker's per-thread memory, as ONE typed interface.
//
// Everything a Slack turn remembers between invocations is here: the
// conversation history, the pending proposal awaiting a ✅, the assistant-panel
// context, the /stop flag, which thread a person's run is in, the processed
// event ids, and the run lease that decides whether an alarm retry re-runs a
// turn or drops it.
//
// WHY AN INTERFACE. Today every one of these operations is a hand-written URL
// string on both sides of a Durable Object hop (`/proposals/by-thread`,
// `mode: "run"`, `mark: "done"`), parsed back out of query parameters and JSON
// bodies. A renamed route is not a type error — it is a 404 at runtime, in the
// one code path whose failure mode is a thread going silent. With the contract
// stated once, the Durable Object adapter (#493) and the in-memory adapter
// below are checked against it, and the conformance suite proves they answer
// identically.
//
// WHAT IS *NOT* HERE. No `Env`: the interface takes named dependencies (see
// `ThreadStateDeps`), so a test constructs a clock and nothing else. No Workers
// globals in this module or the in-memory adapter either — that is what lets
// `tsconfig.test.json` compile them under plain Node, the same constraint
// `src/integrations/blueprint-schema.ts` documents for the same reason. The
// subrequest charge for a Durable Object hop (ADR-022) belongs to the Durable
// Object adapter, at the only place a stub call happens.
//
// THE KEYING SEAM. Every method takes the channel/thread (or the user, or the
// event id) it acts on, exactly where the current client does, and never a
// Durable Object id. The two keying schemes in production — one global
// ThreadState instance, one AgentRunner instance per thread — are therefore
// invisible from out here, and #493/#494 can settle them inside the module
// without touching a caller's signature.

import type { AssistantContext } from "../slack/types";
import type { VisionReference } from "../slack/vision-reference";

export type { AssistantContext, VisionReference };

// ── Timings ──────────────────────────────────────────────────────────────────
//
// Every TTL and lease the module honours, owned here rather than split across
// the Durable Object and its scheduler. `RUN_LEASE_MS` and `DEFER_RETRY_MS` are
// two halves of one rule — how long a lease is trusted, and how often a
// deferred job comes back to test it — and lived in two files (thread-state.ts
// and agent-runner.ts) where "why did a killed run come back two minutes
// later?" could not be answered from either one. The production copies are
// deleted as #493/#494 move their callers onto this module.

/** Turns kept per conversation. Raised 2026-07-09 — the team prefers thorough
 *  over fast (user decision). */
export const MAX_HISTORY_TURNS = 50;

/** How long a conversation is remembered. */
export const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** How long a staged proposal stays confirmable. 60 min, not 15: the gate waits
 *  on a HUMAN, and live 2026-07-10 a designer's delayed ✅ landed on an expired
 *  card and nothing happened. An hour tolerates meetings; the gate — not the
 *  clock — is still the safety. */
export const PROPOSAL_TTL_MS = 60 * 60 * 1000;

/** How long a processed event id is remembered. 24h, not 10 min: agent runs can
 *  legally exceed ten minutes (streaming + MCP; live run 2026-07-10: 11 min),
 *  after which Slack's duplicate delivery passed dedup and re-ran the ENTIRE
 *  turn. One tiny record per user message — keep them a day. */
export const EVENT_DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

/** How long a "running" lease is trusted before the turn is presumed dead and
 *  reclaimed. The longest healthy run seen live is ~11 min; a legitimate run
 *  past this window gets double-run, so keep headroom above real runs. */
export const RUN_LEASE_MS = 20 * 60 * 1000;

/** How often a DEFERRED job comes back to re-test a lease it could not claim.
 *  The job is kept, never deleted — deleting it is how killed runs used to go
 *  permanently silent. Cost: one cheap alarm firing per interval. */
export const DEFER_RETRY_MS = 2 * 60 * 1000;

/** How long a cancel flag and an active-run pointer live. Short on purpose: a
 *  stale flag would abort the NEXT question the person asks, which reads as the
 *  bot ignoring them — worse than a stop that missed. */
export const CANCEL_TTL_MS = 5 * 60_000;

/** The conversation key of an unthreaded DM: every loose line of one DM
 *  resolves to it, so the whole DM is one conversation (see `ThreadRef`). The
 *  one statement of it — the Slack door, the stop door and the relay all key
 *  a DM's history by this. */
export const DM_CONVERSATION = "dm";

// ── Records ──────────────────────────────────────────────────────────────────

/** Where a conversation lives. `thread` is the CONVERSATION key, which in a
 *  threadless DM is the constant `"dm"` rather than a message ts — so every
 *  line of that DM resolves to one conversation. It is never a `thread_ts` to
 *  post with (see `PendingProposal.replyTs`). */
export interface ThreadRef {
  readonly channel: string;
  readonly thread: string;
}

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
  /** Slack ts of the message this turn was delivered as, when known — the merge
   *  key for `retrieval`, since history is normally rebuilt from the raw Slack
   *  thread and a receipt recorded only in the store would otherwise be
   *  invisible. */
  ts?: string;
  /** Names of the references `read_reference` served on this turn. The TEXT is
   *  deliberately not persisted (#423): a later turn sees a one-line stub per
   *  name and a re-read is one baked-map lookup. */
  references?: string[];
  /** What this turn retrieved — tool, query, and the shape of what came back.
   *  Rows are deliberately NOT persisted. It exists so the next turn has
   *  something to check the previous turn's prose against, and knows which
   *  query must not be reissued verbatim. */
  retrieval?: {
    tool: string;
    query: string;
    path?: string;
    count: number;
    scenarios: string[];
    /** Rows came from the short-lived cache, not a read made this turn — the
     *  confidence pre-check needs to tell a fetch from a cache hit. */
    cached?: boolean;
  };
  /** Re-fetchable pointers for one follow-up turn. Image bytes never enter the
   *  store; the next turn rehydrates through Slack or Figma. */
  vision?: VisionReference;
  /** Canvas ids explicitly shared on this user turn. Content stays in Slack;
   *  the pointer preserves the conversation-scoped authorization fact. */
  sharedCanvasIds?: string[];
}

/** One write inside a Proposal: the tool to run and the arguments to run it
 *  with. A batch is an ordered list of these. */
export interface ProposalOperation {
  toolName: string;
  input: Record<string, unknown>;
}

/** A batch of tool calls staged behind ONE ✅ gate. */
export interface PendingProposal {
  /**
   * The batch, in the order the model asked for it.
   *
   * Optional because a record staged before the batch shipped has no such
   * field, and a proposal pending at deploy time must still resolve: every
   * reader goes through `proposalOperations`, which reads an old record as a
   * one-operation batch. `toolName`/`input` below stay populated with the
   * FIRST operation for one release, so a reader that has not moved across
   * yet — the eval scripts' `r.toolName`, the card's tool routing, the
   * pending-notice vocabulary — keeps working unchanged.
   */
  operations?: ProposalOperation[];
  toolName: string;
  input: Record<string, unknown>;
  channel: string;
  /** The conversation key — see `ThreadRef.thread`. **Never post with this.** */
  threadTs: string;
  /**
   * A REAL message ts to reply under — `e.thread_ts ?? e.ts`, the value the
   * proposal card itself was posted with.
   *
   * Live 2026-08-22: `resolveProposal` posted with `thread_ts: threadTs`, which
   * in a DM is the constant `"dm"`; Slack rejects that, the result was never
   * checked, and an approved write said nothing at all on the bot's primary
   * surface — the "approved, then silence" failure the gate exists to prevent.
   * Optional so proposals staged before it shipped still resolve.
   */
  replyTs?: string;
  userMsgTs: string;
  proposalTs: string;
  proposalText: string;
  /** Who asked. Kept for the record; anyone in the thread may confirm (lock removed 2026-07-14, see gate/reaction-door.ts). */
  requesterUserId: string;
  /** Notion PRD resolved at proposal time, carried so it survives the
   *  proposal→confirm round trip and reaches the executor. */
  notionPrdId?: string;
  notionPrdUrl?: string;
}

/**
 * The reply thread a card was posted under — the grain supersession works at.
 *
 * `replyTs` is the real ts the card went out with; `threadTs` is the fallback
 * for records staged before it existed. Both adapters compare proposals with
 * this, so "same thread" means one thing in the module. See `putProposal`.
 */
export function proposalReplyThread(
  proposal: Pick<PendingProposal, "replyTs" | "threadTs">,
): string {
  return proposal.replyTs ?? proposal.threadTs;
}

/**
 * The operations of a proposal, however it was stored.
 *
 * The one reader of the expand–contract pair above: a record written since the
 * batch shipped answers with its list, and one written before it answers as a
 * batch of one. Nothing downstream has to know which it read.
 */
export function proposalOperations(
  proposal: Pick<PendingProposal, "operations" | "toolName" | "input">,
): ProposalOperation[] {
  if (proposal.operations?.length) return proposal.operations;
  return [{ toolName: proposal.toolName, input: proposal.input }];
}

/**
 * Why "expired" and "none" are different answers: the gate must tell the
 * requester their delayed ✅/❌ hit an aged-out card, rather than ignore it
 * silently (live 2026-07-10).
 *
 * "superseded" is the same argument one step further (#573). A card the person
 * answered with feedback is replaced by a revised one, and a ✅ on the old card
 * used to run the very input they were pushing back on. It is deliberately NOT
 * folded into "expired": a card replaced two seconds ago and one that aged out
 * an hour ago are different things to say — the first has a live successor in
 * the thread to send the person to, the second has nothing.
 *
 * WHICH ANSWER WINS THE TIE. A card that was replaced AND has since aged out
 * reads as "superseded" while its successor is still live, and only then. The
 * expired wording ends "ask me again and I'll set the same thing up fresh",
 * which in front of a live card asks for a THIRD one — and the storage GC runs
 * at most daily, so the record would keep giving that answer for hours. Once
 * the successor is gone too, there is nothing to look at and the TTL owns the
 * record again, delete included.
 *
 * The successor's ts is deliberately NOT on this answer. Nothing outside the
 * store has a use for it that the thread's own newest card does not answer
 * better, and a chain (A replaced by B, B replaced by C) would hand out a
 * pointer to a card that is itself retired.
 *
 * A card RETIRED by `retireProposal` and not yet replaced reads as
 * "superseded" too, for its remaining hour (#583): the revision it is making
 * way for is seconds behind it, and that is what the person is being sent to.
 * Past the TTL it reads as "expired" like any other aged-out card — with no
 * successor recorded there is nothing in the thread for the replaced wording
 * to point at.
 */
export type ProposalLookup =
  | { state: "found"; proposal: PendingProposal; createdAt: number }
  /** Retired by a newer card staged in the same reply thread, or retired ahead
   *  of one by `retireProposal` — in which case it reads this way from the
   *  moment of retirement, and for the rest of its hour if the revision it made
   *  way for never lands. */
  | { state: "superseded" }
  | { state: "expired" }
  | { state: "none" };

/**
 * The answer to "may I run this turn?".
 *
 *   "claimed" — this caller owns the turn: run it, then `markRunDone`.
 *   "running" — a fresh lease is held elsewhere (an alarm retry racing a live
 *               run, or a run killed less than `RUN_LEASE_MS` ago): DEFER —
 *               keep the job and come back in `DEFER_RETRY_MS`. Never delete
 *               it; that is how turns go silent.
 *   "done"    — already handled: drop the job.
 */
export type RunClaim = "claimed" | "running" | "done";

/** What a store is built from. A clock, and — in the Durable Object adapter —
 *  its namespace. Never `Env`. */
export interface ThreadStateDeps {
  /** Injected so every TTL and lease in the module is testable without
   *  sleeping. Defaults to `Date.now` in production. */
  now?: () => number;
}

// ── The interface ────────────────────────────────────────────────────────────

export interface ThreadState {
  // ----- history -----

  /** The conversation, oldest turn first. An unknown or aged-out thread reads
   *  as `[]` — absence and expiry are the same answer to a caller. */
  readHistory(ref: ThreadRef): Promise<HistoryTurn[]>;

  /** Append one turn, capped at `MAX_HISTORY_TURNS` (oldest dropped). Returns
   *  the stored length. Callers record a user turn WITH its assistant turn: a
   *  missed half is a corrupted memory. The one exception is a message the bot
   *  opens a conversation with and no one asked for there: a relayed DM is
   *  recorded alone, as an assistant turn in the recipient's DM, because the
   *  request behind it lives in the requester's conversation, not this one. */
  appendHistory(ref: ThreadRef, turn: HistoryTurn): Promise<{ length: number }>;

  /**
   * Shrink the stored conversation to its opening turn plus the most recent
   * `keepRecent`, and report how many turns that dropped.
   *
   * The opening turn survives because it is the goal; the tail survives because
   * it is the thread. This is the STORAGE-level trim — the prose that tells the
   * model the record is partial is a separate, pure decision
   * (`agent/context-state.ts` `compactHistory`), so that a store never invents
   * conversation.
   */
  compactHistory(
    ref: ThreadRef,
    opts: { keepRecent: number },
  ): Promise<{ turns: HistoryTurn[]; dropped: number }>;

  // ----- proposals -----

  /**
   * Stage a proposal under its own `proposalTs`, retiring any proposal still
   * pending in the SAME REPLY THREAD.
   *
   * THIS RETIREMENT IS THE BACKSTOP, and it lives in the store because staging
   * is what supersedes: a turn that stages nothing leaves a pending card alone,
   * and there is exactly one way to stage, so every revision retires its
   * predecessor whether or not its caller remembered to. A caller that knows a
   * revision is coming may retire EARLIER, through `retireProposal`, and gains
   * the seconds the revision spends being written; this pass then finds that
   * record already retired and stamps it with the successor. Either way a
   * retired card is kept rather than deleted — a late ✅ on it has to be told it
   * was replaced, rather than get the silence a missing record buys (#573).
   *
   * THE GRAIN IS THE REPLY THREAD (`replyTs`), not the conversation key, and
   * the difference is a DM. `threadTs` is the CONVERSATION key, which in an
   * unthreaded DM is the constant `"dm"` — every ask on that surface shares it,
   * so retiring by conversation would let one ask retire an unrelated one, and
   * answer a ✅ on it with "that was replaced" when it was nothing of the kind.
   * In a channel `replyTs` IS the thread root, so channel behaviour is
   * unchanged; in a DM each ask has its own thread since the agent_view
   * migration, so a revision still retires the card it revises.
   *
   * A card a caller already retired through `retireProposal` is stamped with
   * this one's ts as it passes, which is what gives the tie-break above its
   * successor to check.
   *
   * `replyTs` is optional (it post-dates records staged before 2026-08-22), and
   * a record without one falls back to the conversation key. Safe on both
   * surfaces: in a channel the two are the same value anyway, and in a DM the
   * fallback only ever compares a pre-migration record, which had no per-ask
   * thread to be told apart by in the first place.
   */
  putProposal(proposal: PendingProposal): Promise<void>;

  /**
   * Retire a card because a revision is about to take its place — keeping the
   * record readable so a ✅ on it can be told it was replaced.
   *
   * TWO RETIREMENTS, TWO METHODS (#583). Until this existed, the staging path
   * retired the card it was revising by CLAIMING it, and a claim deletes. So on
   * the one path supersession was written for, the predecessor was already
   * gone: `getProposalByTs` answered "none", Gate fell through to the by-thread
   * lookup, and the person was told their ✅ "is not on the proposal I am
   * holding" instead of that their card had been replaced. Observed live in
   * `#uno-bot-sandbox` against r332. Consuming a card because someone approved
   * it is a different event from retiring one because a revision replaced it,
   * and they no longer share a mechanism: `claimProposal` consumes, this
   * retires.
   *
   * WHY BEFORE THE NEW CARD RATHER THAN AFTER. `putProposal` retires whatever
   * is still pending in the reply thread, so a caller that stages could leave
   * this out entirely — at the cost of the seconds a model spends generating
   * the revision, during which the old card is still live and still carries the
   * input the person just pushed back on. A caller retires the moment it knows
   * a revision is coming, and `putProposal` then stamps the successor's ts on
   * the record it finds already retired.
   *
   * A retired card is out of reach of everything that can lead to an execution:
   * it is no longer the thread's live card, `getProposalByTs` reports
   * "superseded" rather than "found", and `claimProposal` refuses it outright —
   * which is the #573 guarantee, unchanged. Retiring an unknown or
   * already-retired ts is a no-op.
   *
   * THE COST, WHEN THE REVISION NEVER ARRIVES. One exit retires a card and then
   * fails to post its replacement (`disposition: "failed"`), leaving a retired
   * record with no successor. A ✅ on it is told to confirm on the thread's
   * newest card when there is none, for the hour until its TTL turns the answer
   * back into "expired". That is the better of the two available wrongs — the
   * claim-and-delete it replaces answered "already resolved, another
   * confirmation got there first", which invents a second person — and it is
   * bounded, so it is accepted rather than fixed.
   */
  retireProposal(proposalTs: string): Promise<void>;

  /** Look one up by the ts of its card. */
  getProposalByTs(proposalTs: string): Promise<ProposalLookup>;

  /**
   * The freshest live proposal in a REPLY THREAD — the lookup a typed "yes
   * please" needs, which carries no card ts.
   *
   * `ref.thread` is the thread the card was posted in (`proposalReplyThread`),
   * NOT the conversation key the rest of this interface takes. A DM is why:
   * every unthreaded ask there shares the conversation `"dm"`, so a card keyed
   * on it was every ask's pending card — a second ask read the first ask's
   * card as its own, retired it as a revision, and a ✅ on it then answered
   * "replaced" for good. History stays on the conversation; the card belongs
   * to its thread. In a channel the two are the same value.
   */
  getProposalByThread(ref: ThreadRef): Promise<PendingProposal | null>;

  /**
   * Every live proposal in a CHANNEL, whatever thread or conversation it was
   * staged from, newest first — retired, superseded and aged-out cards left out.
   *
   * The one reader is a gate emoji typed as an unthreaded DM line: it sits in
   * no card's thread, so it answers the DM's only card, and asks which when
   * there are several rather than guess. The whole channel, not the `"dm"`
   * conversation: a card staged from a reply inside a DM thread is filed under
   * that thread, and missing it would let the ✅ run the other card unasked.
   */
  getProposalsByChannel(channel: string): Promise<PendingProposal[]>;

  /**
   * Take exclusive ownership of a proposal, or report that someone else has it.
   *
   * **The delete IS the claim.** A store handles one claim at a time, so of two
   * racing resolvers exactly one gets `true`. That is the whole
   * double-execution guard: a person who reacts ✅ and then, unsure it
   * registered, also types "go ahead" runs two independent handlers, and
   * `notion_create` is not idempotent — two cards, no error, nothing downstream
   * to catch it.
   *
   * **A RETIRED CARD IS REFUSED**, `false`, record untouched. Review of #583
   * found the hole this closes: two doors reach the claim without a lookup in
   * front of them — Gate's `model` branch claims the proposal the agent loop
   * validated in memory, and Turn's identical-re-stage branch claims
   * `request.pending` — so excluding retired cards from the two LOOKUPS left
   * them reachable. The run lease is per MESSAGE (`msg:<channel>:<ts>`), not
   * per thread, so two messages in one thread run at once: turn two reads card
   * A while turn one is writing its revision, turn one retires A, and turn
   * two's `proposal_resolve` used to execute the input the person had just
   * pushed back on. Before `retireProposal` existed the delete closed that race
   * by construction; refusing here is what keeps it closed now, and keeps THE
   * STORE the one place a card stops being executable. Nothing legitimate
   * claims a retired or superseded card: every door that could is answering
   * about a card the thread has already moved past.
   *
   * Callers that only want the record gone ignore the boolean.
   *
   * **Fails CLOSED**, unlike the event methods below: the actions behind this
   * gate are the irreversible ones. A missed execution is visible — the person
   * sees nothing happened and asks again — while a double execution is silent
   * and has to be undone by hand.
   */
  claimProposal(proposalTs: string): Promise<boolean>;

  // ----- assistant context -----

  /** The surface the person has open in the assistant panel, or null. */
  getAssistantContext(ref: ThreadRef): Promise<AssistantContext | null>;

  /** Recorded on assistant_thread_started / _context_changed, because the
   *  message events that follow carry no context of their own. */
  putAssistantContext(ref: ThreadRef, context: AssistantContext): Promise<void>;

  // ----- cancel (the /stop command and the Home-tab Stop button) -----

  /** Raise the flag. A flag, not a signal: a running turn cannot be
   *  interrupted, so the loop reads this at the top of every iteration and
   *  again before it delivers an answer, then returns early — cancellation
   *  lands at a tool boundary rather than mid-write. */
  requestCancel(ref: ThreadRef): Promise<void>;

  /**
   * Read AND clear the flag: one press stops one turn, and the turn that
   * consumes it is the one that goes quiet — the loop reads several times per
   * turn now, and only the first read can see a given press. A flag older than
   * `CANCEL_TTL_MS` reports false and is cleared.
   *
   * `since` is when the reading turn began. A flag raised BEFORE that belongs
   * to an earlier turn, so it reports false — and is cleared all the same, so
   * it cannot claim the turn after this one either. Slack's in-thread stop
   * control is why this exists: it cannot tell which of a DM's two conversation
   * keys holds the run, so it raises both and one is always left standing
   * (`slack/session-stop.ts`). Omitted, every flag counts.
   */
  consumeCancel(ref: ThreadRef, since?: number): Promise<boolean>;

  /**
   * Cancel whatever this person has running, wherever it is — resolving the
   * conversation and raising the flag in ONE hop, because the Slack interaction
   * that calls this has three seconds to ack and has nothing to do with the
   * lookup except cancel it. `cancelled: false` means there was nothing to
   * stop.
   *
   * It reports the conversation it cancelled — `channel` AND `thread` — because
   * the two doors that call this owe the run's own thread a line, and neither
   * can name that thread from its payload: `/stop` arrives with a channel and
   * no reliable thread, the Home-tab button with a person and nowhere at all.
   * `thread` is the CONVERSATION KEY, so for an unthreaded DM it is the
   * constant `"dm"` rather than a timestamp — a caller posting with it must
   * check (`slack/stop-doors.ts` `stopPostTarget`).
   */
  cancelForUser(
    userId: string,
  ): Promise<{ cancelled: boolean; channel?: string; thread?: string }>;

  /**
   * Record which conversation this person's turn is running in.
   *
   * `/stop` and the Home-tab button each know HALF of what a cancel needs: the
   * command arrives with a channel and no reliable person, the button with a
   * person and no channel at all — App Home is not anywhere. This is the
   * missing half. One record per person, overwritten every turn; not a history.
   */
  setActiveRun(userId: string, ref: ThreadRef): Promise<void>;

  // ----- event dedup -----

  /**
   * One-shot dedup: records the event id and reports whether it had already
   * been seen inside `EVENT_DEDUP_TTL_MS`. Slack retries delivery on timeout or
   * a non-200, so the same `event_id` can arrive twice.
   */
  checkAndRecordEvent(eventId: string): Promise<{ seen: boolean }>;

  // ----- the run lease -----

  /**
   * Lease-mode dedup for the per-message agent turn. Same record as
   * `checkAndRecordEvent`, different question: not "have I seen this?" but "may
   * I run it?".
   *
   * A "running" record older than `RUN_LEASE_MS` means the owning invocation
   * was hard-killed mid-run — live 2026-07-10, a deploy restarted the Durable
   * Object and every alarm retry then skipped on the stuck marker until the
   * thread went permanently silent. Stale leases are reclaimed: the caller is
   * told "claimed" and re-runs the turn.
   */
  claimRun(eventId: string): Promise<RunClaim>;

  /** Release the lease. Best-effort by contract: a missed mark self-heals when
   *  the lease goes stale, at the cost of one re-run. */
  markRunDone(eventId: string): Promise<void>;
}
