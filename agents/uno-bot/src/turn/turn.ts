// Turn — one request in, one outcome out.
//
// Everything a turn DECIDES between "a person said something" and "the person
// has been answered" lives here: which tier to route to, what the model reads,
// whether a typed ✅ resolves the card that is already staged, whether the
// draft survives its own judges, what gets posted, what gets staged, and what
// the conversation now remembers. It was one 716-line function in
// `slack/events.ts`, reachable only by a real Slack event, and so none of it
// was tested.
//
// THE TWO SEAMS. Mid-turn effects — the 👀, the working signal, the
// narration, the proposal card — go out through the `Delivery` port
// (`delivery.ts`), which has a Slack adapter and a recording one. Everything
// else the turn needs arrives as a NAMED dependency (`TurnDeps`): the thread
// store, the agent loop, the judge, preflight, the gate's resolver, the three
// card reads, the antecedent read. `Env` never enters — it is turned into
// `TurnDeps` once, in `turn/env-deps.ts`, which is the ONE builder both
// callers go through (#603).
//
// AND THE CARD GOES OVER THAT SEAM AS DATA (#623): which card, and how it
// reads, is `card-staging.ts`'s account. The turn stores and remembers what
// the adapter reports posting. The turn's own words are still its own — a
// clarifying question, the backstop lines, the cancelled-that bounce — and
// those go through `postNote` as before. What is gone is the turn
// spelling Slack mrkdwn for the two things a person ACTS on: the card, and a
// gate verdict. The antecedent window and the body the judges score used to
// import Slack too; they live on `TurnDeps` and `./antecedent` now, so this
// file names no Slack module.
//
// SO THE CALLER IS NOT SLACK. A request carries who, where, the text, the
// images as BYTES already decoded, and the pending proposal; nothing in here
// downloads a file, reads a Slack thread, or knows a channel id from a room
// number. That is what lets `tests/turn.test.ts` drive a whole turn on the
// recording Delivery, the in-memory ThreadState and the fake ModelProvider —
// and what lets a second caller reuse it rather than build a second pipeline.
//
// THIS FILE IS THE LOOP. What the turn hands off changes for reasons of its
// own, so each has a module of its own: building a card into its matter's slot
// (`card-staging.ts`, shared with the button and re-staging doors), the
// blueprint check offer a milestone is followed by (`check-offer.ts`), and what
// the turn leaves the thread needing, the gate verdict included
// (`settlement.ts`).
//
// PURE by design: no `Env`, no Workers type, no fetch — which is what lets the
// Node suite DRIVE it rather than read it. (Not a compile property: the test
// compile is a glob over `src/**` and types the Workers globals beside the Node
// ones, so it would compile this file either way — `tsconfig.test.json`.)

import { judgeAbsence, absenceRepairInstruction, type AbsenceContext } from "../agent/absence";
import {
  blueprintLookupRanIn,
  disclaimCarried,
  judgeConfidence,
  needsRepair,
  repairInstruction,
  retrievalRanIn,
  type ConfidenceVerdict,
} from "../agent/confidence";
import { buildContextBlock, compactHistory, withStaleCancelsSettled } from "../agent/context-state";
import { cardHeadline } from "../agent/card-identity";
import { correctionDirective, looksLikeCorrection } from "../agent/correction";
import type { AgentResult, TurnSpend } from "../agent/loop";
import { bounceLogLine, proposalWasAddressed } from "../agent/pending-notice";
import type { AgentImage, HistoricalImages } from "../agent/provider-conversation";
import { routeRequest } from "../agent/routing";
import type { ModelTier } from "../agent/routing";
import {
  awaitingDecision,
  cutOffVerdict,
  resolveSignal,
  revisionRefusal,
  whichCardNote,
  type GateVerdict,
  type OperationOutcome,
} from "../gate/index";
import { taskCardFor } from "../agent/tool-table";
import type { ToolProgressEvent } from "../agent/tool-progress";
import {
  MAX_HISTORY_TURNS,
  inheritedTerms,
  ownBlocks,
  cardConfirmers,
  mayConfirm,
  ownWords,
  proposalOperations,
  stagingCardOf,
  SWEEP_KEY,
  type AssistantContext,
  type HistoryTurn,
  type PendingProposal,
  type ProposalOperation,
  type ThreadRef,
  type ThreadState,
  type VisionReference,
} from "../thread-state/index";
import {
  buildTurnRecord,
  isTestTraffic,
  quietly,
  recordProposalEvents,
  storesChannel,
  stagedEvent,
  supersededEvents,
  turnIdOf,
  type ProposalEventLog,
  withAskLabel,
  type SubType,
  type TurnOrigin,
  type TurnRecord,
  type UsageLog,
  type TeamRoles,
} from "../usage/index";
import { BUILD } from "../version";
import { ANTECEDENT_LIMIT, formatAntecedent, needsAntecedent } from "./antecedent";
import { cardThreadOf } from "./request";
import { cardMatter, correctedCard } from "./card-matter";
import {
  buildCard,
  cardConversationOf,
  cardOriginOf,
  cardWindow,
  stageTurnCard,
  teamRolesOf,
  timeLeftOn,
  verbFor,
  type StagingFacts,
} from "./card-staging";
import { offerCheck } from "./check-offer";
import { cardLiveIn, liveCardsOf, moreLiveIn, settlementOf, settleVerdict } from "./settlement";
import { judgedList, presentedProse, presenter, proseBudgetRepair, type Presenter } from "./presentation";
import { figmaAnswerCopy } from "./figma-answer-copy";
import { breadcrumbsInProse } from "../integrations/blueprint-link";
import { intakeChannelInstruction, type IntakeThread } from "./intake-channel";
import {
  asSweepRevision,
  FIX_INSERT_REFUSAL,
  FIX_REVIEW_INSTEAD,
  FIX_SCOPE_REFUSAL,
  holdsInsert,
  keepsToFix,
  INSERT_CARD_REFUSAL,
  keptFixes,
  sweepCardInstruction,
  sweepCardPick,
  sweepTag,
} from "../sweep/cards";
import { answersLegacyDriftCard, LEGACY_DRIFT_KEY } from "../figma-drift/finding";
import { LEGACY_DRIFT_REPLY } from "../figma-drift/copy";
import {
  withWorkingSignal,
  type CardRevision,
  type CardTarget,
  type Delivery,
  type DeliveryFailureStage,
  type InterimKind,
  type IssueTarget,
  type ProposalCard,
} from "./delivery";
import { cancelledRecently, RECENT_CANCEL_MS } from "../agent/cancel-note";
import { handOffMilestone, prdMilestone } from "../blueprint-upkeep/milestone";
import type { ServiceChangeJudgement } from "../blueprint-upkeep/check";

// ── Policy ───────────────────────────────────────────────────────────────────

/**
 * When a stored conversation is compacted, and to what.
 *
 * The store caps a conversation at `MAX_HISTORY_TURNS` and enforces the cap by
 * dropping the OLDEST turn on every append — which loses the opening turn, the
 * goal of the whole conversation, first and silently. Compacting two turns
 * short of the cap keeps it on purpose: `compactHistory` holds the opening turn
 * plus `HISTORY_KEEP_RECENT` recent ones and reports what it dropped, so the
 * turn can say how much of the record went.
 */
export const HISTORY_COMPACT_AT = MAX_HISTORY_TURNS - 2;
export const HISTORY_KEEP_RECENT = 24;

/** How long a turn goes without saying anything before it says something. ⏳
 *  alone left people typing "any thing???" at the 8-minute mark. */
export const INTERIM_BACKSTOP_MS = 75_000;

/** Varied so heavy days don't read as the same canned line five times over
 *  (tone feedback, 2026-07-10). Picked by the message ts — stable per run,
 *  different across runs. */
export const BACKSTOP_LINES = [
  "Still on it — this one needs a longer dig. The full answer will land right here.",
  "Still digging — there's more to check than usual. Answer coming in this thread.",
  "Taking my time on this one so it's right. I'll post the full answer here.",
];

const PROGRESS_LABEL = "Reading the question and this thread";

/** The longest a usage-record write may hold the end of a turn. The answer is
 *  already in front of the person by then; this bounds how long the invocation
 *  lingers on a slow database before the record is given up as lost. */
export const USAGE_WRITE_TIMEOUT_MS = 1_000;

/**
 * The longest an ask's in-turn classification may hold the end of a turn.
 * The answer is already out; what waits is the thread's next job. NOT
 * MEASURED: a flash-lite one-shot at the chill tier's `low` thinking, with a
 * few hundred tokens in and a dozen out, is expected around 1–2 s at p50 on
 * Vertex, so 4 s is meant to cover the tail without holding a follow-up long.
 * Past it the row is written unlabelled, as a failed call is. Read the
 * `[usage] … not classified: timed out` lines to tune it.
 */
export const ASK_CLASSIFY_TIMEOUT_MS = 4_000;

// ── The request ──────────────────────────────────────────────────────────────

/**
 * Where the turn is happening, as far as the turn's own decisions care.
 *
 * `assistant` is the app DM under agent_view — the surface that has a status
 * line, a titled thread and a streamed reply, which is why it does NOT also get
 * a 👀. A `channel` has none of those, so the reaction is the only
 * acknowledgment there is. The Worker draws no third distinction: an app DM and
 * the assistant panel are the same conversation. Which channel id is which
 * surface is `request.ts` § `turnSurfaceOf` — the one statement of the rule,
 * read by both callers and by `slack/assistant.ts`.
 */
export type TurnSurface = "channel" | "assistant";

/**
 * What kind of conversation an ask was made in, as Slack types it: a public
 * `channel`, a private `group`, a group DM (`mpim`) or the app DM (`im`).
 *
 * NOT the surface. `surface` says where the answer is delivered, and a group
 * DM is delivered like a channel; this says whose conversation it is, which is
 * what the usage record's privacy rules read (`usage/record.ts`). Unknown when
 * the event did not say — an `app_mention` carries no `channel_type` — and
 * unknown is treated as private.
 */
export const CONVERSATION_TYPES = ["channel", "group", "mpim", "im"] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

/** A value as a `ConversationType`, or undefined when it is not one. */
export function asConversationType(value: unknown): ConversationType | undefined {
  return CONVERSATION_TYPES.find((t) => t === value);
}

export interface TurnRequest {
  // ----- who -----
  /** Slack user id of the person whose turn this is. */
  userId: string;

  // ----- where -----
  channel: string;
  /** The CONVERSATION key — history, the cancel flag, the runner's ordering.
   *  In a threadless DM this is the constant `"dm"`, never a ts to post with. */
  conversationTs: string;
  /** A real ts to reply under, or undefined to post at channel level. */
  replyTs?: string;
  /** The person's own message, which is what a reaction lands on. */
  userMsgTs: string;
  surface: TurnSurface;
  /** Whose conversation this is, when known (`conversationTypeOf`). */
  conversationType?: ConversationType;
  /** True when the message arrived inside an existing thread. A turn that
   *  OPENED its thread is the one allowed to title it, and the antecedent
   *  window only ever opens for a top-level channel @mention. */
  threaded: boolean;

  // ----- what was said -----
  /** The question, bot mentions and any leading scope keyword stripped. */
  text: string;
  /** `text` plus a line per attachment that is not an image — a shared canvas,
   *  say. What the model and the record should read as the message body. */
  attachmentsText?: string;
  /** The instruction a leading scope keyword (`ds:`, `notion:`) turned into:
   *  where to START, never a filter. */
  scopeInstruction?: string;
  /** Set when the message is in #uno-bot, where the team reports problems
   *  with uno-bot and asks for changes to it: who has posted in its thread,
   *  which is who may confirm the card it stages (`turn/intake-channel.ts`). */
  intakeChannel?: IntakeThread;

  // ----- what came with it -----
  /** Decoded image bytes for this turn. The adapter downloads; Turn never
   *  fetches. */
  images: AgentImage[];
  /** Image bytes rehydrated for the immediately previous user turn, anchored
   *  there rather than moved onto this ask. */
  historicalImages?: HistoricalImages;
  /** Model-visible notes about what could not be attached ("2 more images
   *  omitted", "figma screenshot unavailable"). */
  visionNotes?: string[];
  /** Plain-text markers for the stored user turn. Base64 never reaches the
   *  store — only these and the pointer below. */
  visionMarkers?: string[];
  /** The re-fetchable pointer persisted for one follow-up turn. */
  visionReference?: VisionReference;

  // ----- what the conversation already holds -----
  /** The conversation as the model should read it, oldest turn first. */
  history: HistoryTurn[];
  /** The proposal staged in this conversation and still awaiting a decision:
   *  the reply thread's newest, or the card a Needs changes sent back. */
  pending: PendingProposal | null;
  /** Every card live in the reply thread, newest first
   *  (`ThreadState.getProposalsByThread`), filled by the caller beside
   *  `pending`. Absent, `pending` is the only one (`liveCardsOf`). */
  liveCards?: PendingProposal[];
  /** Canvas ids shared on THIS message — persisted on the user turn. */
  currentCanvasIds?: string[];
  /** Canvas ids shared anywhere in this conversation — the authorization fact
   *  the canvas read tool checks. */
  sharedCanvasIds?: string[];
  /** The Notion PRD resolved from the thread root, if any. */
  prd?: { id?: string; url?: string } | null;

  // ----- dials -----
  /** Explicit tier from `/grind`, `/chill` or the "think harder" shortcut.
   *  Beats every routing heuristic. */
  tierOverride?: ModelTier;
  /** Slack's per-event token for bot-token search. Opaque, never logged. */
  actionToken?: string;
}

// ── The outcome ──────────────────────────────────────────────────────────────

/** What the turn ended up being. */
export type TurnDisposition =
  | "answered"
  | "reacted"
  | "asked"
  | "resolved"
  | "staged"
  | "failed"
  /** Stop was pressed before the answer was delivered, so it was not delivered.
   *  The turn posts nothing, because the door that took the press has already
   *  confirmed it — one press, one stop message. Which door says it where is
   *  set out at the exit itself, in `turnBody` (#589). */
  | "stopped";

export interface TurnTelemetry {
  tier: ModelTier;
  route: string;
  /** True when routing read the turn as trivial, which is what lets it skip
   *  the panel-context read and the antecedent window. */
  trivial: boolean;
  /** True when the turn was read as the person correcting the previous reply. */
  correction: boolean;
  /** Read-only tools the loop ran, in order. */
  tools: string[];
  /** References `read_reference` served. */
  references: string[];
  /** The confidence pre-check's verdict on the delivered body. */
  confidence?: ConfidenceVerdict["kind"];
  /** The draft judge's verdict, when it ran. */
  judge?: string;
  /** How many interim lines the person saw. */
  interim: number;
  /** What the model run ran on and spent, when one ran to its end. */
  spend?: TurnSpend;
}

export interface TurnOutcome {
  disposition: TurnDisposition;
  /** The last thing the turn put in front of the person. */
  posted?: string;
  /** Set when the turn ended in a visible failure instead of an answer. */
  failure?: { stage: DeliveryFailureStage };
  /** The card now awaiting a ✅, when the loop asked for one. */
  staged?: { proposal: PendingProposal; card: ProposalCard };
  /** What thread memory was told: the turns appended, and how many older ones
   *  compaction dropped. */
  wrote: { turns: HistoryTurn[]; compacted: number };
  telemetry: TurnTelemetry;
  /** What a ✅ taken during this turn ran, operation by operation, when the
   *  executor reported it. */
  executed?: OperationOutcome[];
}

// ── The dependencies ─────────────────────────────────────────────────────────

/** One agent turn, as Turn asks for it. The tier is decided HERE and travels
 *  as an opaque name; the provider maps it to a model and its dials. */
export interface TurnAgentRequest {
  tier: ModelTier;
  routeReason: string;
  /** What the model reads: the question first, everything advisory after it. */
  userText: string;
  history: HistoryTurn[];
  images?: AgentImage[];
  historicalImages?: HistoricalImages;
  pending: PendingProposal | null;
  /** Every card waiting in the reply thread, newest first: what the model's
   *  pending-proposal context lists, each by the id a revision names it by. */
  liveCards: PendingProposal[];
  currentSender: { userId: string };
  assistantContext?: string;
  /** True when this turn is a correction — forces a fresh blueprint read and
   *  turns on the judge's correction gate. */
  correction: boolean;
  /** When the turn began, so a stop flag raised before it cannot claim it. See
   *  `agent/loop.ts` `cancelSince`. */
  cancelSince?: number;
  onInterim(text: string): void;
  /** Where each lookup is in its life — the checklist's feed. Turn filters it
   *  to the calls that get a task card and hands those to Delivery. */
  onToolProgress(event: ToolProgressEvent): void;
  /** Turn's last word on each lookup's result before the model reads it — how
   *  the presentation step records what the turn fetched, answers `present`
   *  and tells the model what rides beneath its answer
   *  (`turn/presentation.ts`). Returns the text the model reads. */
  reviseLookupResult(name: string, args: Record<string, unknown>, text: string): string;
  /** The same clarify-vs-act check Turn runs after the loop returns, with this
   *  thread's PRD already bound, so the loop can put a refusal to the model as
   *  the call's own result instead of the person seeing the first one. */
  preflight?(toolName: string, input: Record<string, unknown>): Promise<{ ask: string } | null>;
}

/**
 * What one agent turn reported back, beside its result.
 *
 * Every field below is part of what the run RETURNS (#625). They used to be
 * collected by the caller from an ambient scope it had to remember to open —
 * and an adapter that forgot got empty tools, a false "nothing was fetched" and
 * a different confidence verdict two checks below, with nothing failing. The
 * shape is the same; what changed is that it can no longer arrive hollow.
 */
export interface TurnAgentRun {
  result: AgentResult;
  /** Ungated tools that ran, in call order. */
  tools: string[];
  references: string[];
  receipt?: HistoryTurn["retrieval"];
  /** Set only when a search this turn came back EMPTY. */
  absence?: AbsenceContext;
  /** What the run ran on and spent (`agent/run-agent.ts` `AgentRun.spend`). */
  spend?: TurnSpend;
}

export interface TurnJudgment {
  text: string;
  verdict: string;
}

/**
 * Where a finished turn is recorded, and the facts about its caller the
 * test-traffic rule reads (`usage/record.ts`).
 */
export interface TurnUsage {
  log: UsageLog;
  /** `debug` for anything reached through a debug or health route, which is
   *  test traffic by definition. */
  origin: TurnOrigin;
  /** `TEST_CHANNEL_IDS`, parsed: #uno-bot-sandbox. */
  testChannelIds: readonly string[];
  /** Where the cards this turn stages, and the one a revision replaces, are
   *  recorded (`usage/proposal-events.ts`). */
  proposalEvents: ProposalEventLog;
  /** Overrides `USAGE_WRITE_TIMEOUT_MS`; a test's way to not wait it out. */
  writeTimeoutMs?: number;
  /**
   * Label one ask with its corpus Sub-type — one short `chill` call
   * (`usage/categories.ts` `classifyAsks`). Asked, as the turn finishes, only
   * for a real ask whose row keeps no text for the end-of-day classifier to
   * read (a DM, a group DM, an unknown conversation). Absent, those asks are
   * recorded unlabelled.
   */
  classifyAsk?(text: string): Promise<SubType | null>;
  /** Overrides `ASK_CLASSIFY_TIMEOUT_MS`. */
  classifyTimeoutMs?: number;
  /** The stored Slack-id → role map a staged card's roles are read from
   *  (`usage/roles.ts`). Absent, every role reads unknown. */
  teamRoles?(): Promise<TeamRoles>;
}

/** Where a card's action was asked, and who asked it — what a card read needs
 *  when the answer depends on the asker, as a share-out to a named channel's
 *  does. */
export interface CardAsked {
  channel: string;
  requestedBy?: string;
}

export interface TurnDeps {
  /** Per-thread memory. Turn reads the panel context and the outcome notes, and
   *  owns the history append and its compaction. */
  threadState: ThreadState;

  /** Who may resolve any card with a confirmer set — Gate's own
   *  `standingConfirmers`, handed through. */
  standingConfirmers?: readonly string[];

  /** Everything the person sees while the turn runs, and the answer. */
  delivery: Delivery;

  /** The agent loop, behind a `ModelProvider`. */
  runAgent(request: TurnAgentRequest): Promise<TurnAgentRun>;

  /** Pre-send self-verification against the condensed rubric. Fails open by
   *  contract: on any error the original draft ships. */
  reviewDraft(args: {
    userText: string;
    draft: string;
    correction: boolean;
    priorAssistantText?: string;
    toolsUsedThisTurn: string[];
    forceReason?: string;
    extraInstruction?: string;
    /** The plain list of the result table beneath the draft, when one is
     *  attached — absent otherwise, and the judge is asked as before. */
    tableList?: string;
    /** The draft is over its prose budget: shorten it, at any length the
     *  judge reads. */
    shorten?: boolean;
  }): Promise<TurnJudgment>;

  /** Clarify-vs-act: what this tool call still needs before it may be staged,
   *  or null when it is actionable. */
  preflight(
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<{ ask: string } | null>;

  /**
   * Act on a verdict Gate has already won: the confirmed side-effect tool, the
   * acknowledging reaction, the record of what was done.
   *
   * The DECISION half is not a dependency — `resolveSignal` is pure and the
   * turn calls it directly with `threadState`. Only the execution needs `Env`,
   * which is why this one line is a port and the gate is not.
   *
   * Answers with what the batch ran, when it ran one — the usage record reads
   * it for a ticket the bot filed on itself.
   */
  applyVerdict(verdict: GateVerdict): Promise<OperationOutcome[] | void>;

  /** The usage record this turn leaves as it finishes. */
  usage: TurnUsage;

  /**
   * The parts of a card that need a read of their own.
   *
   * Each hands back a STRUCTURE, not a line: the read is theirs — Turn may not
   * call Notion or Figma itself — and the words are the adapter's (#623). They
   * used to hand back Slack mrkdwn, and a whole rendered card in the Figma
   * case, which is how the turn ended up splicing text.
   */
  cards: {
    /** The `notion_update` diff: the page, and `current → new` per field. */
    notionRevision(input: Record<string, unknown>): Promise<CardRevision>;
    /** What a later `notion_update` operation of the batch replaces, by its
     *  input path, for Review's Before: served from a read the turn already
     *  made, and read fresh only where `mayRead`. `read` says a fresh read was
     *  spent. */
    notionBefore(
      input: Record<string, unknown>,
      opts: { mayRead: boolean },
    ): Promise<{ before: Record<string, string>; read: boolean }>;
    /** The `notion_archive` target: page title and parent database. */
    notionTarget(input: Record<string, unknown>): Promise<CardTarget | undefined>;
    /** The listed repo a `github_issue_create` files into (or a
     *  `github_issue_update` writes to), resolved from its
     *  `repo` input as the executor will resolve it, and that repo's
     *  visibility — so the card names where the issue will actually land and
     *  who can read it. */
    issueTarget(input: Record<string, unknown>): Promise<IssueTarget>;
    /** The repo an issue's `repo` input names, resolved as the executor
     *  resolves it — absent is the default repo — with no read: what two
     *  cards' issue targets are compared on (`agent/card-identity.ts`
     *  `sameWriteTarget`). An input off the list is returned as given. */
    issueRepo(repo: unknown): string;
    /** Where a `github_workflow_run` would run: the listed repo its `repo`
     *  resolves to and that repo's default branch — the only ref a run goes
     *  to — or null when the repo is off the list. `branch` is null when the
     *  default branch could not be read, and the card says so. */
    workflowTarget(input: Record<string, unknown>): Promise<{ repo: string; branch: string | null } | null>;
    /** Where a `shareout_post` asked in `at.channel` by `at.requestedBy`
     *  would post, named as the card says it — "#plus-design-feedback",
     *  "this DM", "this thread", or a named channel's `<#C…|name>` — from the
     *  executor's own decision (`tools/share-for-feedback.ts`
     *  `decideShareoutPlace`), so the card names the place a ✅ posts to. */
    shareoutWhere(input: Record<string, unknown>, at: CardAsked): Promise<string>;
  };

  /**
   * Told when a cut-off run is re-staged as a fresh card (`restageExecution`),
   * so a record kept against the old card's ts can follow it — the sweep's
   * items do (`sweep/outcomes.ts`). Best-effort; absent, nothing follows.
   */
  onRestaged?(from: PendingProposal, to: PendingProposal): Promise<void>;

  /**
   * The items of a decision report, as a revision turn changes them. Absent,
   * every revision posts as its own card.
   */
  reportItems?: {
    /**
     * A revision of one item, ready to go in place of its card: what Review
     * shows, the fields its proposal is staged with, and `place`, which puts
     * it in the report's message under the same number, open — called once it
     * is staged. Null when the report has no such item, and the revision
     * posts as its own card.
     */
    revise(
      item: { messageTs: string; id: string },
      card: ProposalCard,
    ): Promise<{
      text: string;
      staged: Pick<PendingProposal, "proposalTs" | "userMsgTs" | "supersedeKey" | "item">;
      place(): Promise<void>;
    } | null>;
    /** Put an item sent back for changes back to open on the report's
     *  message, when its turn staged no revision. Best-effort. */
    reopen(item: { messageTs: string; id: string }): Promise<void>;
  };

  /**
   * One page of the conversation before this message, for the antecedent
   * window — already reduced to author and text, newest last.
   *
   * Only ever called for a top-level channel @mention with a dangling pronoun,
   * and the limit is the window's own (`ANTECEDENT_LIMIT`). Turn formats what
   * comes back; the read is the adapter's.
   */
  readAntecedent(
    channel: string,
    beforeTs: string,
    limit: number,
  ): Promise<Array<{ author: string; text: string }>>;

  /** One line naming the surface the person has open in the panel, or null. */
  describeAssistantContext(context: AssistantContext | null): string | null;

  /**
   * The body the judges score: how this surface will actually deliver the draft.
   *
   * Slack strips trailing confidence labels and substitutes an empty-answer
   * placeholder (`slack/render.ts` `renderDeliveredBody`). A recording is the
   * identity, because a turn test is asserting the draft, not Slack's copy.
   * Injected so this file never imports a Slack module (#623).
   *
   * @param text the model's draft, before posting
   */
  deliveredBody(text: string): string;

  /**
   * Every value a lookup's filter can take, as its source offers them — the
   * Roadmap board's Design Statuses — or null where none are known. Read only
   * after a chart across lookups is drawn on that field, so the chart can name
   * the values no lookup counted. Absent, none are known.
   */
  lookupOptions?(lookup: string, field: string): Promise<readonly string[] | null>;

  /** Structured state + progressive summarization (`CONTEXT_STATE`). Flagged
   *  off in production; see the header of `agent/context-state.ts`. */
  contextState?: boolean;

  /**
   * The quick service-change judgement a milestone is followed by — a PRD's
   * card, or a reply handing a build to the IDE (`blueprint-upkeep/check.ts`):
   * where the idea touches today's blueprint, or null for "offer nothing".
   * Absent, no milestone is followed by an offer.
   */
  serviceChangeJudgement?: ServiceChangeJudgement;

  now?(): number;
}

// ── The turn ─────────────────────────────────────────────────────────────────

/**
 * One turn, with the working signal guaranteed down when it ends.
 *
 * The turn leaves by ten doors — an answer, a clarifying ask, a staged card,
 * a card Slack refused, four flavors of gate resolution, a stop pressed
 * before the answer landed, a dead model — and a signal cleared at ten sites
 * is a signal the eleventh door forgets. So the set
 * stays where it belongs (beside the work it describes) and the clear is a
 * `finally` around the whole thing: `withWorkingSignal` watches the Delivery
 * the turn is handed and takes down whatever the turn raised, whichever door
 * it left by.
 */
export async function runTurn(request: TurnRequest, deps: TurnDeps): Promise<TurnOutcome> {
  // The card THIS REPLY THREAD was holding when the turn began — and the grain
  // is the whole of it.
  //
  // `pending` is read on the reply thread (`cardThreadOf`), not the
  // conversation, which in an unthreaded DM is the constant `"dm"` shared by
  // every ask. The comparison stays as the guard on that: settling by
  // conversation would let a card staged under ask A suspend the unrelated
  // thread of ask B, and a ✅ on A settles A's thread only — leaving B
  // suspended with nothing in it to click. In a channel `replyTs` IS the
  // thread root, so channel behavior is unchanged.
  //
  // It costs no read of its own: the adapter's read at the top of the request
  // is where it came from. It is also the card as of the turn's START, which
  // every exit but one leaves untouched — see `settlementOf`.
  const turnThread = cardThreadOf(request);
  const cardLive = cardLiveIn(request, turnThread);
  const moreLive = moreLiveIn(request, turnThread);

  // The usage record's clock: when the turn began, and when the person was
  // first shown something — an answer, a card, a note — as Delivery accepted it.
  const clock = (): number => deps.now?.() ?? Date.now();
  const startedAt = clock();
  let firstAnswerAt: number | null = null;
  const delivery = watchFirstAnswer(deps.delivery, () => {
    firstAnswerAt ??= clock();
  });

  // What a card this turn stages is recorded with, known before it runs: the
  // row it joins to, and the test-traffic rule as it reads for a staging turn.
  const staging: StagingFacts = {
    turnId: turnIdOf(request.channel, request.userMsgTs, startedAt),
    channelStored: storesChannel(request.surface, request.conversationType),
    now: clock,
    testTraffic: isTestTraffic({
      origin: deps.usage.origin,
      channel: request.channel,
      testChannelIds: deps.usage.testChannelIds,
      disposition: "staged",
      question: request.text,
    }),
  };

  const outcome = await withWorkingSignal(
    delivery,
    (watched) =>
      turnBody(request, { ...deps, delivery: watched }, staging).catch(async (err: unknown) => {
        // A throw past every exit of the body reaches the outermost catch
        // (`slack/events.ts`), which posts the "internal" failure and holds no
        // Delivery to close anything with. Settle the checklist here first, or
        // it sits open above that failure, still claiming a step is running.
        // Settling twice is a no-op, so an exit that already did is safe.
        await watched.endProgress("error").catch(() => {});
        await unlockRevision(request, cardLive, deps);
        throw err;
      }),
    (outcome) => settlementOf({ disposition: outcome.disposition, cardLive, moreLive }),
  );

  if (outcome.disposition !== "staged") await unlockRevision(request, cardLive, deps);

  // Written AFTER the working signal is down and the answer is out, so the
  // record — and a DM ask's classification — costs the person nothing they
  // can see.
  const record = buildTurnRecord({
    build: BUILD,
    origin: deps.usage.origin,
    testChannelIds: deps.usage.testChannelIds,
    requesterId: request.userId,
    surface: request.surface,
    ...(request.conversationType ? { conversationType: request.conversationType } : {}),
    inThread: request.threaded,
    channel: request.channel,
    askTs: request.userMsgTs,
    question: request.text,
    startedAt,
    firstAnswerAt,
    tier: outcome.telemetry.tier,
    routeReason: outcome.telemetry.route,
    ...(outcome.telemetry.spend ? { spend: outcome.telemetry.spend } : {}),
    toolsCalled: outcome.telemetry.tools,
    referencesRead: outcome.telemetry.references,
    ...(outcome.posted !== undefined ? { posted: outcome.posted } : {}),
    disposition: outcome.disposition,
    ...(outcome.staged ? { proposalId: outcome.staged.proposal.proposalTs } : {}),
    ...(outcome.executed ? { executed: outcome.executed } : {}),
  });
  // A ticket a reaction or button ✅ on this turn's card filed before this row
  // existed was kept on the card's staged row; it lands here.
  if (outcome.staged && record.selfFiledTicketUrl === null) {
    const staged = outcome.staged.proposal.proposalTs;
    await quietly(`self-filed ticket for ${staged}`, async () => {
      record.selfFiledTicketUrl = await deps.usage.proposalEvents.ticketFor(staged);
    }, deps.usage.writeTimeoutMs);
  }
  await recordTurn(await labelInTurn(record, request.text, deps.usage, clock), deps.usage);
  return outcome;
}

/**
 * A card sent back with Needs changes stays locked until its revision
 * replaces it (`ThreadState.markRevising`). The revision is the asker's turn
 * in the card's thread; one that ends without staging it — it failed, or
 * answered instead — unlocks the card, or nothing could ever decide it, and
 * edits it back to its live form, so it stops saying it is being revised.
 */
async function unlockRevision(
  request: TurnRequest,
  cardLive: boolean,
  deps: Pick<TurnDeps, "threadState" | "delivery" | "reportItems">,
): Promise<void> {
  const pending = request.pending;
  if (!cardLive || !pending?.revising || pending.revising.userId !== request.userId) return;
  // An item that revises its own way (a Figma comment decision,
  // `figma-comments/revise.ts`) is never revised by a turn: its lock is its
  // own revision's, which lifts it, so a turn answering beside it leaves it.
  if (pending.item && pending.refuseRevision) return;
  try {
    await deps.threadState.clearRevising(pending.proposalTs);
  } catch (err) {
    console.warn(`[turn] revising mark on ${pending.proposalTs} not cleared: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }
  // An item's card is in its report's message, which its key is not: the
  // report redraws it open.
  if (pending.item) {
    await deps.reportItems?.reopen(pending.item).catch((err: unknown) => {
      console.warn(`[turn] item ${pending.item!.id} of ${pending.item!.messageTs} not reopened: ${err instanceof Error ? err.message : String(err)}`);
    });
    return;
  }
  await deps.delivery
    .reopenCard({
      ts: pending.proposalTs,
      text: pending.proposalText,
      ...(pending.proposalBlocks ? { blocks: pending.proposalBlocks } : {}),
    })
    .catch(() => {});
}

/**
 * An ask whose row will never hold its text — a DM, a group DM, a conversation
 * of unknown type — labeled in the turn: the one moment its text exists.
 * A channel ask (labeled at the end of the day), test traffic (greetings
 * included) and a caller with no classifier are left as they are. A call that
 * fails or outlasts its timeout leaves the row unlabelled and is logged
 * without the model's words — it never fails the turn.
 */
async function labelInTurn(
  record: TurnRecord,
  text: string,
  usage: TurnUsage,
  clock: () => number,
): Promise<TurnRecord> {
  if (record.requestText !== null || record.testTraffic || !usage.classifyAsk) return record;
  try {
    const subType = await withTimeout(
      usage.classifyAsk(text),
      usage.classifyTimeoutMs ?? ASK_CLASSIFY_TIMEOUT_MS,
    );
    return withAskLabel(record, subType, clock());
  } catch (err) {
    console.error(
      `[usage] turn ${record.turnId} not classified: ${err instanceof Error ? err.message : String(err)}`,
    );
    return record;
  }
}

/**
 * Delivery, with a note taken the first time the person is shown something
 * that answers them: the answer, a card, a clarifying note, a gate verdict.
 * Not a reaction, an interim line or a failure — none of those answers.
 */
function watchFirstAnswer(delivery: Delivery, onFirst: () => void): Delivery {
  const noted = async <R extends { ok: boolean }>(post: Promise<R>): Promise<R> => {
    const result = await post;
    if (result.ok) onFirst();
    return result;
  };
  return {
    ...delivery,
    postAnswer: (text, presentation) => noted(delivery.postAnswer(text, presentation)),
    postNote: (text, tag) => noted(delivery.postNote(text, tag)),
    postGateNote: (note, card) => noted(delivery.postGateNote(note, card)),
    card: (proposal, lead) => noted(delivery.card(proposal, lead)),
  };
}

/**
 * Write the turn's usage record, and never let it cost the turn.
 *
 * A write that throws or outlasts its timeout is logged and dropped: the
 * record is instrumentation, and instrumentation must not break or slow the
 * thing it measures.
 */
async function recordTurn(record: TurnRecord, usage: TurnUsage): Promise<void> {
  try {
    await withTimeout(usage.log.record(record), usage.writeTimeoutMs ?? USAGE_WRITE_TIMEOUT_MS);
  } catch (err) {
    console.error(
      `[usage] turn ${record.turnId} not recorded: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** `work`, or a rejection once `timeoutMs` has passed — whichever is first. */
async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function turnBody(request: TurnRequest, deps: TurnDeps, staging: StagingFacts): Promise<TurnOutcome> {
  const { delivery, threadState } = deps;

  // When this turn began, which is what scopes a stop press to it. Taken HERE
  // rather than in the loop: the gather between this line and the first model
  // call does real work over real seconds, and a press during it is a real
  // press. A flag older than this line belongs to a turn that has already
  // ended (`agent/loop.ts` `stopPressed`, `thread-state/store.ts`).
  const startedAt = deps.now?.() ?? Date.now();
  const ref: ThreadRef = { channel: request.channel, thread: request.conversationTs };
  const bodyText = request.attachmentsText ?? request.text;
  const modelBase = [bodyText, ...(request.visionNotes ?? [])].join("\n");
  const historyText = [bodyText, ...(request.visionMarkers ?? [])].join("\n");
  /** The pointer and canvas ids that ride the stored user turn. */
  const userTurnExtras: Pick<HistoryTurn, "ts" | "vision" | "sharedCanvasIds"> = {
    ts: request.userMsgTs,
    ...(request.visionReference ? { vision: request.visionReference } : {}),
    ...(request.currentCanvasIds?.length ? { sharedCanvasIds: request.currentCanvasIds } : {}),
  };

  let interimCount = 0;
  const memory = threadMemory(threadState, ref, historyText, userTurnExtras);

    // ── Acknowledge ────────────────────────────────────────────────────────────
  //
  // ONE reaction, and only where nothing else says "I'm on it". The assistant
  // surface has a working signal, a titled thread and a streamed reply — three
  // signals; adding 👀 ⏳ ✅ on top made four, on a message the person can
  // already see is being handled. A channel has none of those.
  if (request.surface !== "assistant") await delivery.react("eyes");

  // ── The one deterministic text path: a typed gate emoji, alone ─────────────
  //
  // A message that is nothing but ✅ / 👍 / ⛔ / ❌ is the reaction, typed. It
  // resolves the card exactly as the reaction would, through the same claim.
  //
  // Everything else typed goes to the model — including "yes", "go ahead",
  // "sounds good", "ok". Until 2026-08-22 two phrase lists resolved some of
  // those with no model call, and the two lists were the source of every
  // incident on this path. What keeps the model path safe is no longer a
  // vocabulary but the structural rule further down: if the model answers an
  // approval by re-invoking the same tool with the same input, that IS the
  // confirmation.
  //
  // A line whose conversation spans more than its own thread — an unthreaded
  // DM line — sits in no card's thread, so it may answer across the whole DM:
  // one live card there is the card it means, several get asked about.
  const cardThread = cardThreadOf(request);
  const outsideAnyCard = cardThread !== request.conversationTs;
  if (request.pending || outsideAnyCard) {
    const verdict = await resolveSignal(
      {
        kind: "typed",
        channel: request.channel,
        thread: cardThread,
        text: request.text,
        userId: request.userId,
        ...(request.pending ? { cardTs: request.pending.proposalTs } : { wholeDm: true as const }),
      },
      { threadState, standingConfirmers: deps.standingConfirmers },
    );
    // A verdict with no decision means the message was not a gate emoji — it
    // is language, and language goes to the model; so is a gate emoji with no
    // card anywhere to answer and nothing to say. Anything else the gate has
    // already settled, win or lost race.
    const nothingToSettle = verdict.outcome === "none" && !verdict.post;
    if (verdict.decision && !nothingToSettle) {
      return settleVerdict(verdict, {
        deps,
        memory,
        note:
          verdict.decision === "confirm"
            ? "(confirmed — executing the proposal)"
            : "Canceled.",
        telemetry: {
          tier: "chill",
          route: "typed-gate-emoji",
          trivial: true,
          correction: false,
          tools: [],
          references: [],
          interim: 0,
        },
      });
    }
  }

  // ── "drop 2" / "keep 1 and 3" on a sweep card ──────────────────────────────
  //
  // Read by index, with no model call: the revision is the card's own
  // operations minus the dropped ones, byte for byte, so there is nothing for
  // a model to reproduce. Anything else said under the card still goes to the
  // model, and its revision is still held to the subset rule below.
  // A sweep report item decides in Review; legacy reports keep typed picks.
  if (request.pending?.sweepRun && !request.pending.item) {
    const kept = sweepCardPick(request.text, proposalOperations(request.pending).length);
    if (kept) return dropFromSweepCard(request, deps, memory, kept, cardThread, staging);
  }

  // A file-drift card from before the shared card (`figma-drift/`) still asks
  // for `drop N`, `skip` or "yes" in its footer. Those words decide nothing
  // now, so they get one line pointing at Review, never a model revision.
  if (request.pending?.supersedeKey === LEGACY_DRIFT_KEY && answersLegacyDriftCard(request.text)) {
    await delivery.postNote(LEGACY_DRIFT_REPLY);
    await memory.remember(LEGACY_DRIFT_REPLY);
    return {
      disposition: "asked",
      posted: LEGACY_DRIFT_REPLY,
      wrote: memory.wrote(),
      telemetry: { tier: "chill", route: "legacy-drift-reply", trivial: true, correction: false, tools: [], references: [], interim: 0 },
    };
  }

  // ── A cut-off run in this thread ───────────────────────────────────────────
  //
  // A card approved here whose run never reported back (`ThreadState`'s
  // `Execution`) is answered on the next turn in its thread, before anything
  // else: the person is owed the note about what may not have run, and a card
  // for what never came back, whatever they wrote. The turn ends there — the
  // card is the reply, and a model turn after it could only stage a second one
  // over it. Only a thread holding no live card can have one: a card consumed
  // by the claim is what a cut-off leaves behind.
  if (!request.pending) {
    const cutOff = await threadState
      .takeCutOffExecutionInThread({ channel: request.channel, thread: cardThread })
      .catch(() => null);
    if (cutOff) {
      const verdict = cutOffVerdict(cutOff, "confirm");
      return settleVerdict(verdict, {
        deps,
        memory,
        // Whatever they wrote went unanswered, and they should know it did
        // rather than read the note as the answer.
        aside: verdict.restage
          ? "I haven't answered your message yet — ask again once you've sorted the card below."
          : "I haven't answered your message yet — ask it again and I'll pick it up.",
        telemetry: {
          tier: "chill",
          route: "cut-off-run",
          trivial: true,
          correction: false,
          tools: [],
          references: [],
          interim: 0,
        },
      });
    }
  }

  // ── Route first, then gather ───────────────────────────────────────────────
  //
  // The reverse order meant a "thanks" in a long thread paid for the
  // panel-context read before anything knew the turn was trivial. Routing is a
  // pure string check — no I/O — so putting it first costs nothing. The tier is
  // decided HERE, once, and travels to the provider as an opaque name.
  const { tier, reason: route } = routeRequest({
    userText: request.text,
    hasPending: request.pending !== null,
    override: request.tierOverride,
  });
  const trivial = tier === "chill";
  console.log(`[route] tier=${tier} why=${route} ctx=${trivial ? "skipped" : "gathered"}`);

  const telemetry: TurnTelemetry = {
    tier,
    route,
    trivial,
    correction: false,
    tools: [],
    references: [],
    interim: 0,
  };

  // The panel surface the person currently has open. Advisory grounding for
  // deictic asks — never assumed to be the subject otherwise. Best-effort: a
  // failed read degrades to none.
  const assistantContext =
    !trivial && request.surface === "assistant"
      ? deps.describeAssistantContext(
          await threadState.getAssistantContext(ref).catch(() => null),
        )
      : null;

  // ── What the model actually reads, assembled ───────────────────────────────
  //
  // Order matters and is deliberate: the QUESTION first, everything advisory
  // after it. A prompt that opens with three system blocks and buries the ask at
  // the bottom is a prompt whose answer is about the blocks.
  const modelBlocks: string[] = [modelBase];

  if (request.scopeInstruction) {
    modelBlocks.push(`(system: SCOPE — ${request.scopeInstruction})`);
  }

  if (request.intakeChannel) {
    modelBlocks.push(intakeChannelInstruction({ senderId: request.userId, isReply: request.threaded }));
  }

  // A reply under a sweep card is most often someone dropping an item from it.
  // A sweep report's fix is decided in its Review alone: nothing to drop.
  if (request.pending?.sweepRun && !request.pending.item) modelBlocks.push(sweepCardInstruction());

  // The antecedent window: what "this" points at. Only for a top-level channel
  // @mention with a dangling pronoun, and only ever ONE page of the
  // conversation the message came from.
  if (
    !request.threaded &&
    request.surface === "channel" &&
    !trivial &&
    needsAntecedent(request.text)
  ) {
    const before = await deps
      .readAntecedent(request.channel, request.userMsgTs, ANTECEDENT_LIMIT)
      .catch(() => []);
    const block = formatAntecedent(before);
    if (block) modelBlocks.push(block);
    console.log(`[antecedent] used=${before.length} injected=${block ? "yes" : "no"}`);
  }

  // The correction directive, injected for ONE turn only and naming the query
  // the previous turn ran so it cannot be reissued verbatim and called a
  // re-check.
  //
  // A correction needs something to correct. Without a previous assistant turn
  // the directive would tell the model to treat "your own earlier claim" as
  // unverified when there is no earlier claim, and the judge gate would demand
  // a reply cite a fetch or concede an error it never made — unsatisfiable by
  // construction. The text patterns lean broad on purpose; this is the guard
  // that keeps that safe.
  // A ⛔ note past `RECENT_CANCEL_MS` is history, not "just now": the model is
  // not shown it, and only the store keeps it. One about another thread's card
  // is shown as a past fact, so the model neither declines on it nor reads that
  // card as still waiting (`agent/context-state.ts`). Not behind the state
  // flag: it is about what any turn's model reads.
  const shownHistory = withStaleCancelsSettled(request.history, startedAt, RECENT_CANCEL_MS, cardThread);
  const priorAssistantTurn = [...shownHistory].reverse().find((t) => t.role === "assistant");
  // Receipts are attached to the USER turn of the exchange they describe, so
  // the search is by receipt, not by role.
  const priorReceipt = [...request.history].reverse().find((t) => t.retrieval)?.retrieval;
  const correction = looksLikeCorrection(request.text) && Boolean(priorAssistantTurn);
  telemetry.correction = correction;
  if (correction) {
    modelBlocks.push(correctionDirective(priorReceipt?.query));
    console.log(
      `[correction] detected prior_query=${priorReceipt?.query ?? "(none)"} receipt=${priorReceipt ? "yes" : "no"}`,
    );
  }

  if (deps.contextState) {
    const block = buildContextBlock(shownHistory, request.text);
    if (block) modelBlocks.push(block);
  }
  const modelText = modelBlocks.join("\n\n");

  // Progressive summarization, same flag. Replaces the dropped middle of a long
  // conversation with a COUNT rather than deleting it silently — a model told
  // the record is partial can say so; a model handed a gap reasons across it.
  const historyForModel = deps.contextState
    ? compactHistory(shownHistory, { keepRecent: 12, maxChars: 12_000 }).turns
    : shownHistory;

  // ── The working signals ────────────────────────────────────────────────────
  //
  // A status says "working"; a stream carries content. The two were conflated
  // once and the client rendered an empty bubble for a whole run.
  if (!trivial || request.images.length > 0) {
    await delivery.setWorking({
      status: "is thinking…",
      // Only a thread THIS turn opened gets a title: re-titling a thread the
      // person is continuing would overwrite their topic with a follow-up.
      ...(request.threaded ? {} : { titleFrom: request.text }),
    });
  }
  // The ask rides along for the checklist's heading. Unlike the session title
  // above it goes on every substantive turn: it titles this turn's checklist,
  // not the thread.
  if (!trivial) await delivery.beginProgress(PROGRESS_LABEL, request.text);

  // Interim updates: long runs are legal (streaming plus MCP can take several
  // minutes). Two complementary signals — the model's own between-tool
  // narration as it works, and a generic note that backstops runs which have
  // produced none yet.
  let interimPosted = false;
  const postInterim = (text: string, kind?: InterimKind): void => {
    interimPosted = true;
    interimCount++;
    delivery.postInterim(text, kind);
  };
  const backstopAt = Math.abs(
    parseInt(request.userMsgTs.replace(".", "").slice(-6), 10) || 0,
  ) % BACKSTOP_LINES.length;
  const backstop = setTimeout(() => {
    if (interimPosted) return;
    postInterim(BACKSTOP_LINES[backstopAt] ?? BACKSTOP_LINES[0]!, "backstop");
  }, INTERIM_BACKSTOP_MS);

  // The presentation step: every lookup's result passes through it as it
  // comes back, rather than being read off the run afterwards, because the
  // model has to be TOLD what rides beneath its answer while it can still write
  // its prose around it — a summary over a table, the plain list without.
  const presenting = presenter({ now: () => deps.now?.() ?? Date.now() });

  // The checklist: one task card per lookup that has words for one on its tool
  // table row. The loop reports every call it runs through the lookup path; a
  // reaction, a Worker-only call and anything gated have no card, and that is
  // the table's answer, not a list kept here. Fire-and-forget like the
  // narration, for the same reason: a courtesy must not wait in front of work.
  // A finished card's links are also the presentation step's, for the
  // Sources box beneath the answer.
  const showToolProgress = (event: ToolProgressEvent): void => {
    // A lookup refused before it ran never reaches `reviseLookupResult`, so
    // the presentation step hears of it here: a budget refusal is a ⚠️ line.
    if (event.phase === "refused") presenting.refused(event.name, event.reason);
    if (!taskCardFor(event.name)) return;
    delivery.toolProgress(event);
    if (event.phase === "finished" && event.sources) presenting.sourcesRead(event.sources);
  };

  // Clarify-vs-act, bound to this thread once: the loop asks it mid-turn (so a
  // refusal reaches the model), and the block below asks it again on whatever
  // the loop finally staged (so a refusal the model could not fix reaches the
  // person). One check, one wording, both sides.
  const preflightCall = (
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<{ ask: string } | null> => deps.preflight(toolName, input);

  const reviseLookupResult = (name: string, args: Record<string, unknown>, text: string): string =>
    presenting.revise(name, args, text);

  let run: TurnAgentRun;
  try {
    run = await deps.runAgent({
      tier,
      routeReason: route,
      userText: modelText,
      history: historyForModel,
      ...(request.images.length > 0 ? { images: request.images } : {}),
      ...(request.historicalImages ? { historicalImages: request.historicalImages } : {}),
      pending: request.pending,
      liveCards: liveCardsOf(request),
      currentSender: { userId: request.userId },
      ...(assistantContext ? { assistantContext } : {}),
      correction,
      preflight: preflightCall,
      onInterim: (text) => postInterim(text),
      onToolProgress: showToolProgress,
      reviseLookupResult,
      cancelSince: startedAt,
    });
  } catch (err) {
    console.error(`[agent] failed: ${err instanceof Error ? err.message : String(err)}`);
    // Close the progress surface before the failure message, or the checklist
    // sits open above it forever, still claiming a step is in progress.
    await delivery.endProgress("error");
    await delivery.postFailure("agent", err, request.text);
    telemetry.interim = interimCount;
    return {
      disposition: "failed",
      failure: { stage: "agent" },
      wrote: memory.wrote(),
      telemetry,
    };
  } finally {
    clearTimeout(backstop);
  }
  telemetry.tools = run.tools;
  telemetry.references = run.references;
  telemetry.interim = interimCount;
  if (run.spend) telemetry.spend = run.spend;

  const result = run.result;

  // ── A reply ────────────────────────────────────────────────────────────────
  //
  // The progress surface is NOT closed here: the answer closes it, so the
  // checklist and the reply are one message rather than a checklist with a
  // second message beside it. Every other exit below closes it itself, because
  // nothing that follows them would.
  if (result.kind === "text") {
    // The model read a decision and could not say which card it was for: the
    // person is asked, a button per card, in place of the model's own words —
    // which could only have asked the same thing without the buttons (#1319).
    const waiting = result.askWhich ? awaitingDecision(liveCardsOf(request)) : [];
    if (result.askWhich && waiting.length > 1) {
      await delivery.endProgress("complete");
      const said = await delivery.postGateNote(whichCardNote(result.askWhich, waiting));
      await memory.remember(said.text);
      return { disposition: "asked", posted: said.text, wrote: memory.wrote(), telemetry };
    }
    // An answer the loop synthesized once its round-trips ran out rests on
    // fewer lookups than it wanted: a ⚠️ line says so.
    if (result.cutShort) presenting.budgetSpent();
    return finishTextTurn(result.text, {
      request,
      deps,
      ref,
      run,
      modelText,
      priorAssistantText: priorAssistantTurn?.content,
      correction,
      telemetry,
      memory,
      presenting,
      staging,
    });
  }

  // ── A stop, pressed before the answer was delivered ────────────────────────
  //
  // The one exit that posts NOTHING AT ALL. Whichever door took the press has
  // already put the line in THIS thread, naming who pressed — Slack's
  // in-thread control directly (`slack/session-stop.ts`), `/stop` and the
  // Home-tab button off the conversation `cancelForUser` reports
  // (`slack/commands.ts`, `slack/interactive.ts`). A line from here would be
  // the second stop message for one press, which with the answer arriving
  // under it is the failure #589 was filed on.
  //
  // The progress surface still closes, and it closes COMPLETE rather than
  // error: the turn ended the way it was asked to. The exchange is remembered
  // in both halves, as the reaction-only turn remembers it, so the next turn in
  // the thread reads a question that went unanswered rather than a gap.
  if (result.kind === "stopped") {
    await delivery.endProgress("complete");
    await memory.remember("(stopped — the answer was not delivered)");
    return { disposition: "stopped", wrote: memory.wrote(), telemetry };
  }

  // Everything past here posts its own message (a proposal card, a clarifying
  // question, a resolution note) rather than an answer, so the progress surface
  // has nothing left to carry — close it now or it stays open above whatever
  // lands.
  await delivery.endProgress("complete");

  // ── A resolution the model itself decided ──────────────────────────────────
  if (result.kind === "resolved") {
    // The loop already validated the call against the thread's pending state;
    // Gate claims and says what to run.
    const verdict = await resolveSignal(
      {
        kind: "model",
        pending: result.pending,
        decision: result.decision,
        ...(result.messageToUser ? { messageToUser: result.messageToUser } : {}),
        userId: request.userId,
      },
      { threadState, standingConfirmers: deps.standingConfirmers },
    );
    return settleVerdict(verdict, { deps, memory, telemetry });
  }

  // ── A new side-effect proposal ─────────────────────────────────────────────

  // Clarify-vs-act (D3): if the tool call is missing what it needs, ask instead
  // of staging — so gating never depends on the model remembering to ask (a
  // component is never implemented PRD-less). The model has already had its one
  // go at fixing this call inside the loop, so a refusal here is the ask.
  const ask = await preflightCall(result.toolName, result.input);
  if (ask) {
    const said = await delivery.postNote(ask.ask);
    await memory.remember(said.ok ? said.text : ask.ask);
    return {
      disposition: "asked",
      posted: ask.ask,
      wrote: memory.wrote(),
      telemetry,
    };
  }

  // Gate idempotency (a): the model re-issued the SAME proposal while one is
  // pending. That is what a model does when it reads "go ahead" and reaches for
  // the tool again instead of `proposal_resolve` (2026-07-10). The honest
  // reading is simple — the proposal is pending, the person just replied, and
  // the model wants to do the same thing with the same input. That is a
  // confirmation, so execute it through the same claim the reaction and button
  // paths use: no duplicate card, no bounce, and no vocabulary needed to guess
  // what "go ahead" means.
  //
  // The comparison is the WHOLE batch, not its first operation: a re-stage that
  // agrees on operation one and differs on operation three is a different plan,
  // and reading it as a confirmation would run the plan nobody saw. Any live
  // card in the thread may be the one it repeats — byte for byte names exactly
  // one card, so there is no guessing which.
  const liveCards = liveCardsOf(request);
  const repeated = liveCards.find(
    (card) => stableStringify(proposalOperations(card)) === stableStringify(result.operations),
  );
  if (repeated) {
    console.log(
      `[gate] identical re-stage of ${result.toolName} while pending — treating as confirm`,
    );
    const verdict = await resolveSignal(
      {
        kind: "model",
        pending: repeated,
        decision: "confirm",
        ...(result.previewText ? { messageToUser: result.previewText } : {}),
        userId: request.userId,
      },
      { threadState, standingConfirmers: deps.standingConfirmers },
    );
    return settleVerdict(verdict, {
      deps,
      memory,
      ...(result.previewText ? {} : { note: "(confirmed — executing the proposal)" }),
      telemetry,
    });
  }

  // The thread's memory as it stands before this turn: read once, for the
  // cancel check and for which card the previous turn staged.
  const stored = await threadState.readHistory(ref).catch((err: unknown) => {
    console.warn(`[turn] history read failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  });

  // Gate idempotency (b): the person JUST cancelled this same action (the same
  // tool on the same target in this same reply thread, or the very same card
  // from another; a redirect is a new card, and so is another ask in another
  // DM thread, `agent/cancel-note.ts`),
  // and the store's outcome note is authoritative — the live thread only shows the
  // narrative text. Don't re-card a cancelled action; require an explicit
  // revival. The window is the last few turns AND the last half hour
  // (`RECENT_CANCEL_MS`), so one clarifying exchange clears it, and so does a
  // night: in a DM the last few turns can be hours old. Best-effort: a store hiccup must not block a legitimate proposal.
  try {
    const justCancelled = (stored ?? [])
      .slice(-3)
      .some((t) => cancelledRecently(t, result, deps.now?.() ?? Date.now(), cardThread));
    if (justCancelled) {
      const bounce =
        `You canceled that ${verbFor(result.toolName)} a moment ago, so I'm not re-proposing it on my own. ` +
        `Changed your mind? Say so explicitly and I'll stage it again — or tell me what you'd like instead.`;
      const said = await delivery.postNote(bounce);
      await memory.remember(said.ok ? said.text : bounce);
      return {
        disposition: "asked",
        posted: bounce,
        wrote: memory.wrote(),
        telemetry,
      };
    }
  } catch (err) {
    console.warn(
      `[turn] recent-cancel check failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Revision or separate proposal (`turn/card-matter.ts`): the waiting card
  // this one supersedes, or none — a different matter, staged in a slot of its
  // own beside the waiting cards and inheriting none of their terms.
  const matter = await cardMatter(
    {
      live: liveCards,
      pending: request.pending,
      operations: result.operations,
      ...(result.revises ? { named: result.revises } : {}),
      userId: request.userId,
      repoOf: deps.cards.issueRepo,
    },
    threadState,
  );
  // A revision named for one card that writes another card's page or issue
  // is staged as neither (`cardMatter`): both cards keep waiting, and the
  // person — and the model, from the thread's memory — is told which two.
  if (matter.kind === "aimed-elsewhere") {
    const said = await delivery.postGateNote({
      kind: "aimed-elsewhere",
      named: cardHeadline(matter.named),
      other: cardHeadline(matter.other),
    });
    await memory.remember(said.text);
    return { disposition: "asked", posted: said.text, wrote: memory.wrote(), telemetry };
  }
  const replaced = matter.kind === "revision" ? matter.of : null;
  // Read off the live cards before this one stages: the card the previous
  // turn staged, when this one undoes the call it was staged under (usage
  // record). It is only recorded: a card the correction leaves behind still
  // waits, for the person to decide.
  const corrected = correctedCard({
    matter,
    live: liveCards,
    operations: result.operations,
    previousAsk: [...(stored ?? [])].reverse().find((t) => t.role === "user")?.ts,
    repoOf: deps.cards.issueRepo,
  });
  const corrects = corrected?.proposalTs;

  // A keyed card that revises only its own way (a weekly DS precedence card,
  // decided as it stands in its Review) is not revised by a turn at all: the batch is
  // refused with the card's note, rather than staged as a near-copy that
  // stays live beside it — two live cards could both run.
  if (replaced?.refuseRevision) {
    // Tagged as the sweep's own note under a sweep fix, so it leaves the
    // thread the team's.
    await delivery.postNote(replaced.refuseRevision, replaced.sweepRun ? sweepTag("note") : undefined);
    await memory.remember(replaced.refuseRevision);
    return { disposition: "asked", posted: replaced.refuseRevision, wrote: memory.wrote(), telemetry };
  }

  // A card that names its confirmers is revised only by one of them. A
  // revision keeps the card's confirmer set, so one staged by anyone else could
  // never run — and staging it would still retire the card its owners can
  // confirm. So it is refused, and the card stays live exactly as it was.
  // #uno-bot is the exception: there a reply joins the confirmer set
  // (`intake-channel.ts`).
  if (replaced && !request.intakeChannel && !mayConfirm(replaced, request.userId, deps.standingConfirmers)) {
    const refusal = revisionRefusal(cardConfirmers(replaced, deps.standingConfirmers) ?? [], request.userId);
    await delivery.postNote(refusal, replaced.sweepRun ? sweepTag("note") : undefined);
    await memory.remember(refusal);
    return { disposition: "asked", posted: refusal, wrote: memory.wrote(), telemetry };
  }

  // A sweep card that adds an answer is never revised in words: the model
  // has no `insert` to restage it with, so a worded revision would lose the
  // added text rather than keep it byte for byte. The refusal points at
  // Review: reject it there, then say what it should say.
  if (replaced?.sweepRun && holdsInsert(proposalOperations(replaced))) {
    const refusal = replaced.item ? FIX_INSERT_REFUSAL : INSERT_CARD_REFUSAL;
    await delivery.postNote(refusal, sweepTag("note"));
    await memory.remember(refusal);
    return { disposition: "asked", posted: refusal, wrote: memory.wrote(), telemetry };
  }

  // One fix of a sweep report is revised from its own Review — Needs changes
  // sends it back to this person's turn — and only within its own edit: its
  // own blocks, on the stamps the sweep read, narrowed or reworded. A reply
  // in the thread that would change one is pointed at Review.
  if (replaced?.sweepRun && replaced.item && replaced.revising?.userId !== request.userId) {
    await delivery.postNote(FIX_REVIEW_INSTEAD, sweepTag("note"));
    await memory.remember(FIX_REVIEW_INSTEAD);
    return { disposition: "asked", posted: FIX_REVIEW_INSTEAD, wrote: memory.wrote(), telemetry };
  }
  if (replaced?.sweepRun && replaced.item && !keepsToFix(result.operations, proposalOperations(replaced))) {
    await delivery.postNote(FIX_SCOPE_REFUSAL, sweepTag("note"));
    await memory.remember(FIX_SCOPE_REFUSAL);
    return { disposition: "asked", posted: FIX_SCOPE_REFUSAL, wrote: memory.wrote(), telemetry };
  }

  // A sweep card's revision drops fixes and does nothing else: each of its
  // operations must be one of the card's own, as it was. Anything else — a fix
  // rewritten, a stamp changed, one added — is refused and the card stays.
  if (replaced?.sweepRun && !replaced.item && !isSubsetOf(result.operations, proposalOperations(replaced))) {
    const refusal =
      ":warning: That would change a fix on this sweep card rather than drop one, so the card stays as it is. " +
      "Reply with the number of a fix to drop it, or ⛔ the card and ask me for the change you want.";
    await delivery.postNote(refusal, sweepTag("note"));
    await memory.remember(refusal);
    return { disposition: "asked", posted: refusal, wrote: memory.wrote(), telemetry };
  }
  // What the card being replaced had left, read once, before it is retired:
  // a revision that never stages gives the card back for that long. A sweep
  // card's revision keeps it as its deadline; an item of a report keeps its
  // window too: its revision lives as long as the item had left, as the
  // report's own revisions do.
  const replacedLeftMs = replaced ? await timeLeftOn(replaced, threadState, staging.now()) : undefined;
  const sweepLeftMs = replaced?.sweepRun ? replacedLeftMs : undefined;
  const itemLeftMs = replaced?.item ? replacedLeftMs : undefined;
  if (itemLeftMs !== undefined && itemLeftMs <= 0) {
    await delivery.postNote(CARD_CLOSED);
    await memory.remember(CARD_CLOSED);
    return { disposition: "asked", posted: CARD_CLOSED, wrote: memory.wrote(), telemetry };
  }
  if (sweepLeftMs !== undefined && sweepLeftMs <= 0) {
    await delivery.postNote(CARD_CLOSED, sweepTag("note"));
    await memory.remember(CARD_CLOSED);
    return { disposition: "asked", posted: CARD_CLOSED, wrote: memory.wrote(), telemetry };
  }

  // Built, posted and stored into its matter's slot (`stageTurnCard`).
  const staged = await stageTurnCard(result, {
    request,
    deps,
    staging,
    matter,
    replaced,
    liveCards,
    corrects,
    replacedLeftMs,
    sweepLeftMs,
    itemLeftMs,
  });
  // An answer-only surface declined the card on purpose: the person is told
  // what it would have done instead, so the turn answered, and nothing stages.
  if (staged.kind === "declined") {
    await memory.remember(staged.remembered);
    return { disposition: "answered", posted: staged.text, wrote: memory.wrote(), telemetry };
  }
  if (staged.kind === "failed") {
    return { disposition: "failed", failure: { stage: "delivery" }, wrote: memory.wrote(), telemetry };
  }
  const { proposal, shown, remembered } = staged;
  // A staged PRD is a milestone. Nothing of the blueprint runs in front of
  // its card (#1321): the quick judgement waits until the card is up, and the
  // check itself is a job someone asks for (`offerCheck`).
  const milestone = staged.inPlace
    ? null
    : (prdMilestone(result.operations) ?? handOffMilestone(result.previewText ?? "", request.text, run.references));
  // The card is up and stored, so the person can review it while the quick
  // judgement decides whether to offer the blueprint check under it.
  const offered = milestone
    ? await offerCheck(
        milestone,
        {
          ...cardOriginOf(request),
          ...cardConversationOf(request),
          cardTs: proposal.proposalTs,
          ...(proposal.supersedeKey ? { cardKey: proposal.supersedeKey } : {}),
        },
        { ...deps, delivery },
        staging.now(),
      )
    : null;
  // A proposal is still a completed conversational turn. An agent_view DM has
  // no Slack thread to rebuild, so preserving this exchange in the store is the
  // only way its image pointer reaches the immediate follow-up.
  await memory.remember([remembered, offered?.text].filter(Boolean).join("\n\n"));

  return {
    disposition: "staged",
    posted: staged.text,
    staged: { proposal, card: shown },
    wrote: memory.wrote(),
    telemetry,
  };
}

/** What a revision of a sweep card that has closed meanwhile is told. */
const CARD_CLOSED = "That card is no longer open, so it stays as it was.";

/**
 * Stage a sweep card without the fixes a "drop N" left out — or, with none
 * left, cancel it through the gate as a typed ⛔ would. Held to the card's
 * confirmer set, like any revision, and to its deadline: the revision lives
 * only as long as the card it replaces had left, so dropping again and again
 * never extends a card.
 */
async function dropFromSweepCard(
  request: TurnRequest,
  deps: TurnDeps,
  memory: ThreadMemory,
  kept: number[],
  cardThread: string,
  staging: StagingFacts,
): Promise<TurnOutcome> {
  const { delivery, threadState } = deps;
  const pending = request.pending!;
  const telemetry: TurnTelemetry = {
    tier: "chill",
    route: "sweep-drop",
    trivial: true,
    correction: false,
    tools: [],
    references: [],
    interim: 0,
  };
  if (!request.intakeChannel && !mayConfirm(pending, request.userId, deps.standingConfirmers)) {
    const refusal = revisionRefusal(cardConfirmers(pending, deps.standingConfirmers) ?? [], request.userId);
    await delivery.postNote(refusal, sweepTag("note"));
    await memory.remember(refusal);
    return { disposition: "asked", posted: refusal, wrote: memory.wrote(), telemetry };
  }
  if (!kept.length) {
    const verdict = await resolveSignal(
      { kind: "typed", channel: request.channel, thread: cardThread, text: "⛔", userId: request.userId },
      { threadState, standingConfirmers: deps.standingConfirmers },
    );
    return settleVerdict(verdict, { deps, memory, note: "Canceled.", telemetry });
  }
  const all = proposalOperations(pending);
  const operations = kept.map((i) => all[i]!);
  const first = operations[0]!;
  // The card's own deadline, read before it is retired: what the revision
  // inherits in place of a fresh lifetime.
  const leftMs = await timeLeftOn(pending, threadState, staging.now());
  if (leftMs <= 0) {
    await delivery.postNote(CARD_CLOSED, sweepTag("note"));
    await memory.remember(CARD_CLOSED);
    return { disposition: "asked", posted: CARD_CLOSED, wrote: memory.wrote(), telemetry };
  }
  const retiredAhead = (await threadState.retireProposal(pending.proposalTs)).retired ? [pending.proposalTs] : [];
  const recordSuperseded = (retired: readonly string[]) =>
    recordProposalEvents(
      deps.usage.proposalEvents,
      supersededEvents(retired, staging.now(), "revision"),
      deps.usage.writeTimeoutMs,
    );
  await recordSuperseded(retiredAhead);
  // The fixes left, renumbered, so the revision is a carousel as its card
  // was. Only fixes staged one per operation can be picked by the same index;
  // anything else revises to the text card.
  const fixes = pending.fixes?.items.length === all.length ? keptFixes(pending.fixes, kept) : undefined;
  const built = asSweepRevision(
    await buildCard(
      { kind: "proposal", operations, toolName: first.toolName, input: first.input },
      deps,
      request.surface === "assistant",
      { channel: request.channel, requestedBy: pending.requesterUserId },
    ),
  );
  // It says the deadline it keeps: what was left of the card's.
  const window = cardWindow(staging.now(), leftMs);
  const card: ProposalCard = { ...(fixes ? { ...built, fixes } : built), expiresAt: window.expiresAt };
  const posted = await delivery.card(card);
  // Declined on an answer-only surface, as a fresh card is (`PostResult.declined`).
  if (posted.declined) {
    await memory.remember(posted.text);
    return { disposition: "answered", posted: posted.text, wrote: memory.wrote(), telemetry };
  }
  if (!posted.ok || !posted.ts) {
    console.error("[turn] sweep card revision was not staged");
    return { disposition: "failed", failure: { stage: "delivery" }, wrote: memory.wrote(), telemetry };
  }
  const proposal: PendingProposal = {
    operations,
    toolName: first.toolName,
    input: first.input,
    channel: request.channel,
    threadTs: request.conversationTs,
    ...(request.replyTs ? { replyTs: request.replyTs } : {}),
    userMsgTs: request.userMsgTs,
    proposalTs: posted.ts,
    proposalText: posted.text,
    ...ownBlocks(posted),
    requesterUserId: request.userId,
    ...inheritedTerms(pending),
    ttlMs: window.ttlMs,
    ...(pending.sweepRun ? { sweepRun: pending.sweepRun } : {}),
    ...(fixes ? { fixes } : {}),
    supersedeKey: pending.supersedeKey ?? SWEEP_KEY,
    ...ownWords(pending),
    // The Worker staged the card this revises: its usage row is the root
    // every later outcome joins to.
    originProposalTs: stagingCardOf(pending),
    revisesProposalTs: pending.proposalTs,
  };
  const { retired: retiredByStaging } = await threadState.putProposal(proposal);
  await recordSuperseded(retiredByStaging);
  await recordProposalEvents(
    deps.usage.proposalEvents,
    [
      stagedEvent({
        proposal,
        at: staging.now(),
        via: "turn",
        channelStored: staging.channelStored,
        turnId: staging.turnId,
        testTraffic: staging.testTraffic,
        askText: request.text,
        roles: await teamRolesOf(deps.usage),
      }),
    ],
    deps.usage.writeTimeoutMs,
  );
  await memory.remember(posted.text);
  return { disposition: "staged", posted: posted.text, staged: { proposal, card }, wrote: memory.wrote(), telemetry };
}

// ── The reply path ───────────────────────────────────────────────────────────

interface TextTurnCtx {
  request: TurnRequest;
  deps: TurnDeps;
  ref: ThreadRef;
  run: TurnAgentRun;
  modelText: string;
  priorAssistantText?: string;
  correction: boolean;
  telemetry: TurnTelemetry;
  memory: ThreadMemory;
  /** The turn's presentation step: what its lookups left to post beneath the
   *  answer, read once the pre-checks below have added their ⚠️ lines. */
  presenting: Presenter;
  /** What a card the reply carries an offer for is recorded with. */
  staging: StagingFacts;
}

/**
 * Everything between "the model produced words" and "the person has them": the
 * reaction-only turn, the two deterministic pre-checks, the judge, the post, and
 * the memory.
 */
async function finishTextTurn(draft: string, ctx: TextTurnCtx): Promise<TurnOutcome> {
  const { request, deps, ref, run, telemetry } = ctx;
  const { delivery, threadState } = deps;
  const bodyText = request.attachmentsText ?? request.text;
  const historyText = [bodyText, ...(request.visionMarkers ?? [])].join("\n");

  // A reaction and no words. The model answered a pure acknowledgment
  // ("thanks", "got it") with slack_react and ended its turn without text. An
  // empty reply after a reaction is a finished turn, not a failure — the only
  // thing the Worker has to know about that shape.
  const reactedOnly =
    run.tools.includes("slack_react") &&
    (!draft.trim() || draft.trim() === "(empty response)");
  if (reactedOnly) {
    console.log("[route] reaction-only turn (model chose an emoji, no reply)");
    // This exit posts no answer, so nothing downstream closes the progress
    // surface into one — and a plan stream left open renders as a checklist
    // still working on a turn that is over.
    await delivery.endProgress("complete");
    await ctx.memory.remember("(reacted — no reply)");
    return {
      disposition: "reacted",
      wrote: ctx.memory.wrote(),
      telemetry,
    };
  }

  // The deterministic half of the pre-send check, ahead of the judge.
  //
  // D9 (sureness said in prose when it is lower than a live read earns) was
  // only ever checked INSIDE the judge, which skips anything under its length
  // floor — and almost every blueprint answer is a few hundred characters.
  // This runs on the body that will actually SHIP, because the cap truncates
  // after the judge has scored and can amputate a clause from a reply already
  // logged as verdict=pass.
  const retrievalRan = retrievalRanIn(run.tools);
  const blueprintLookupRan = blueprintLookupRanIn(run.tools);
  const servedFromCache = run.receipt?.cached === true;
  const readFailed = ctx.presenting.readFailed();
  let verdict: ConfidenceVerdict = { kind: "exempt" };
  try {
    verdict = judgeConfidence(deps.deliveredBody(draft), {
      retrievalRan,
      blueprintLookupRan,
      servedFromCache,
      readFailed,
    });
  } catch (err) {
    // Fail open, in the same direction as the judge itself: a missing
    // confidence clause is a smaller harm than a dropped answer.
    console.warn(
      `[confidence] pre-check failed: ${err instanceof Error ? err.message : String(err)} — no escalation`,
    );
  }
  telemetry.confidence = verdict.kind;

  // The absence pre-check, beside it and for the same reason: a search came
  // back empty and the draft may be claiming the WORLD is empty. Only runs when
  // a search actually returned nothing this turn, so an absolute is not flagged
  // on a turn where it is simply true.
  let absenceRepair: string | undefined;
  if (run.absence) {
    try {
      if (judgeAbsence(deps.deliveredBody(draft)) === "unscoped") {
        absenceRepair = absenceRepairInstruction(run.absence);
        // The repair rewrites the claim; the ⚠️ line keeps the scope in front
        // of the reader whatever the rewrite says.
        ctx.presenting.absenceFired(run.absence);
        console.log(`[absence] unscoped claim over ${run.absence.visibility} — forcing repair`);
      }
    } catch (err) {
      console.warn(
        `[absence] pre-check failed: ${err instanceof Error ? err.message : String(err)} — no escalation`,
      );
    }
  }

  // A chart across lookups names the values its source offers that no lookup
  // counted. Read here, once a chart needs it, so no other turn pays for it;
  // a failed read leaves the chart as drawn, with nothing named.
  for (const { lookup, field } of ctx.presenting.chartedAcross()) {
    try {
      const options = await deps.lookupOptions?.(lookup, field);
      if (options?.length) ctx.presenting.optionsOffered(lookup, field, options);
    } catch (err) {
      console.warn(`[chart] ${lookup} ${field} options unread: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Everything that rides beneath the answer is known from here on: the
  // lookups' table and ⚠️ lines, and the absence check's line above.
  const presentation = ctx.presenting.presentation();

  // A draft over its prose budget beside a table (`turn/prose-budget.ts`) is
  // shortened to its takeaway by the same judge call, at any length the judge
  // reads; `presentedProse` is the backstop when the shortening misses.
  const walkRepair = proseBudgetRepair(draft, presentation);
  if (walkRepair) console.log("[prose-budget] draft walks its table: asking the judge to shorten it");

  // ONE judge call carries every repair that fires. Sent as sibling
  // instructions they compete and the model does one.
  const extra = [repairInstruction(verdict) ?? undefined, absenceRepair, walkRepair]
    .filter(Boolean)
    .join("\n\n");

  const reviewed = await deps.reviewDraft({
    userText: ctx.modelText,
    draft,
    correction: ctx.correction,
    ...(ctx.correction && ctx.priorAssistantText
      ? { priorAssistantText: ctx.priorAssistantText }
      : {}),
    toolsUsedThisTurn: run.tools,
    // Both bypass the judge's length floor and tell it exactly what to repair.
    ...(needsRepair(verdict)
      ? { forceReason: verdict.kind }
      : absenceRepair
        ? { forceReason: "absence-scope" }
        : walkRepair
          ? { forceReason: "table-walk" }
          : {}),
    ...(walkRepair ? { shorten: true } : {}),
    ...(extra ? { extraInstruction: extra } : {}),
    // The reader gets the prose AND the table beneath it, so the judge grades
    // both: a draft that summarizes and points at the table has answered.
    ...(judgedList(presentation) ? { tableList: judgedList(presentation) } : {}),
  });
  telemetry.judge = reviewed.verdict;

  // Re-validation, not a second repair round. A judge revision can itself end
  // in a trailing label, which the strip then DELETES without putting anything
  // back — turning "wrong shape" into "no signal at all" in the one reply we
  // had already noticed was wrong. Logged so that outcome is countable; looping
  // here would cost another model call per turn and could land in the same
  // place anyway. The one exception is a carried answer: a blueprint grounding
  // no lookup of this turn stood on never ships, so code says what it rests
  // on when the judge errs or passes it as it was.
  let answer = reviewed.text;
  try {
    const finalVerdict = judgeConfidence(deps.deliveredBody(reviewed.text), {
      retrievalRan,
      blueprintLookupRan,
      servedFromCache,
      readFailed,
    });
    if (finalVerdict.kind === "carried") {
      answer = disclaimCarried(answer, ctx.priorAssistantText ? "my earlier answer" : "what I already know");
      console.log("[confidence] carried answer left as it was by the judge: disclaimed in code");
    }
    console.log(
      `[confidence] pre=${verdict.kind} post=${finalVerdict.kind} ` +
        `retrieval=${retrievalRan ? "yes" : "no"} cached=${servedFromCache ? "yes" : "no"} ` +
        `judge=${reviewed.verdict}`,
    );
  } catch (err) {
    console.warn(
      `[confidence] post-check failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Rows the model typed out as well as the table come out here, and list
  // items past the first 3 when the prose is still over budget, after the
  // judge (whose revision could type them too) and before the one call every
  // Delivery shares, so Slack, the recording Delivery and the thread's memory
  // all get the same prose. A rule that must hold on every provider lives in
  // code, not in the persona.
  const stripped = presentedProse(answer, presentation);
  if (stripped.removed) console.log(`[result-table] removed ${stripped.removed} repeated row line(s) from the prose`);
  if (stripped.trimmed) console.log(`[result-table] trimmed ${stripped.trimmed} list item(s) past the first 3; prose over budget`);
  // A blueprint place carried from an earlier answer keeps that answer's
  // form; the reader gets the breadcrumb either way.
  const answered = breadcrumbsInProse(figmaAnswerCopy(stripped.text, presentation?.sources));
  // The table rides with the answer; what comes back as `posted.text` is then
  // the prose and its plain list, which is what the thread remembers below.
  const posted = await delivery.postAnswer(answered, presentation);

  // The receipt rides the USER turn, keyed by the user message's ts. It
  // describes the TURN, not the message, and the user ts is the only id this
  // path has — the assistant message's ts is not reported back, so there is no
  // key to merge on. The user message is in the same Slack thread history is
  // rebuilt from, so the merge lands either way.
  await ctx.memory.rememberUser({
    ...(run.receipt ? { retrieval: run.receipt } : {}),
    // The names only. The text was this turn's tool result and ends with it;
    // the next turn sees a one-line stub per name (#423).
    ...(run.references.length ? { references: run.references } : {}),
  });

  if (!posted.ok) {
    // Never post a completion signal for a reply that was never delivered.
    console.error("[turn] reply delivery failed after retry");
    await delivery.postFailure("delivery", undefined, request.text);
    return {
      disposition: "failed",
      failure: { stage: "delivery" },
      wrote: ctx.memory.wrote(),
      telemetry,
    };
  }

  // A build handed to the IDE is a milestone (#1324): the reply posts as
  // written, and the same Check it offer a PRD's card gets follows it once the
  // stream has stopped. There is no card, so the offer names none and its
  // check has none to add notes to.
  const handOff = handOffMilestone(answered, request.text, run.references);
  const offered = handOff
    ? await offerCheck(
        handOff,
        { ...cardOriginOf(request), ...cardConversationOf(request) },
        { ...deps, delivery },
        ctx.staging.now(),
      )
    : null;

  // Record what was actually POSTED (capped, placeholder and all), not the raw
  // text.
  await ctx.memory.rememberAssistant(offered ? `${posted.text}\n\n${offered.text}` : posted.text);

  // A card was staged at turn start and this turn neither resolved it (that
  // would be kind:"resolved") nor said anything about it. The approval has
  // evaporated silently — the 2026-07-10 failure. Log-only on purpose: a
  // visible "I still have X staged" belongs on a measured rate, not a guess.
  if (request.pending && !proposalWasAddressed(posted.text, request.pending.toolName)) {
    console.warn(bounceLogLine(request.pending.toolName, historyText, posted.text));
  }

  // No ✅ on success: the reply that just landed IS the completion signal, and a
  // checkmark next to it is a second one saying the same thing. ✅ still means
  // something specific here — it is how a human CONFIRMS a proposal — so
  // spending it on "I answered" also blunts the gate.
  return {
    disposition: "answered",
    posted: posted.text,
    wrote: ctx.memory.wrote(),
    telemetry,
  };
}

// ── Thread memory ─────────────────────────────────────────────────

interface ThreadMemory {
  /** Append the user half. Extra fields — the retrieval receipt, the reference
   *  names — ride it, because they describe the TURN and the user message's ts
   *  is the only key this path has. */
  rememberUser(extra?: Partial<HistoryTurn>): Promise<void>;
  /** Append the assistant half, and compact if the store has reached its cap. */
  rememberAssistant(text: string): Promise<void>;
  /** Both halves, in order. */
  remember(assistantText: string): Promise<void>;
  /** What has been written so far, and what compaction dropped. */
  wrote(): { turns: HistoryTurn[]; compacted: number };
}

/**
 * The turn's memory, as one object with the pairing invariant inside it.
 *
 * The invariant: a user turn is stored WITH its assistant turn. That used to be
 * six hand-written pairs on six exit paths in `slack/events.ts`, and a missed
 * half is a corrupted memory — the reply path in particular writes the two
 * halves at different moments, because the assistant half records what Slack
 * actually accepted. Sequential, never parallel, so the two land in order.
 */
function threadMemory(
  threadState: ThreadState,
  ref: ThreadRef,
  userText: string,
  userExtras: Pick<HistoryTurn, "ts" | "vision" | "sharedCanvasIds">,
): ThreadMemory {
  const turns: HistoryTurn[] = [];
  let compacted = 0;

  const compactIfFull = async (length: number): Promise<void> => {
    if (length < HISTORY_COMPACT_AT) return;
    const result = await threadState
      .compactHistory(ref, { keepRecent: HISTORY_KEEP_RECENT })
      .catch(() => ({ dropped: 0 }));
    compacted = result.dropped;
    if (compacted > 0) console.log(`[turn] history compacted: dropped ${compacted} turn(s)`);
  };

  const memory: ThreadMemory = {
    async rememberUser(extra = {}) {
      const turn: HistoryTurn = { role: "user", content: userText, ...userExtras, ...extra };
      await threadState.appendHistory(ref, turn);
      turns.push(turn);
    },
    async rememberAssistant(text) {
      const turn: HistoryTurn = { role: "assistant", content: text };
      const { length } = await threadState.appendHistory(ref, turn);
      turns.push(turn);
      await compactIfFull(length);
    },
    async remember(assistantText) {
      await memory.rememberUser();
      await memory.rememberAssistant(assistantText);
    },
    wrote() {
      return { turns, compacted };
    },
  };
  return memory;
}

// ── Small pure helpers ───────────────────────────────────────────────────────

/** Every operation in `revised` is one of `original`'s, byte for byte. */
function isSubsetOf(revised: readonly ProposalOperation[], original: readonly ProposalOperation[]): boolean {
  const kept = new Set(original.map(stableStringify));
  return revised.length > 0 && revised.every((op) => kept.has(stableStringify(op)));
}

/** Key-order-independent JSON compare, so two generations of the same tool
 *  input register as identical even if the model emitted fields in a different
 *  order. */
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v !== null && typeof v === "object") {
    return `{${Object.entries(v as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${JSON.stringify(k)}:${stableStringify(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}
