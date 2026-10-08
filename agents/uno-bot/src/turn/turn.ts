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
// AND THE CARD GOES OVER THAT SEAM AS DATA (#623). `buildCard` below decides
// which card a staged proposal gets, what verb names it, which caveats a person
// must see and which batch the ✅ runs; `Delivery.card` is the hand-over, and
// `slack/proposal-render.ts` decides how all of that reads. The turn stores and
// remembers what the adapter reports posting. The turn's own words are still
// its own — a clarifying question, the backstop lines, the cancelled-that
// bounce — and those go through `postNote` as before. What is gone is the turn
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
// and what lets the eval route (#499) be the second caller rather than a
// second pipeline.
//
// PURE by design: no `Env`, no Workers type, no fetch — which is what lets the
// Node suite DRIVE it rather than read it. (Not a compile property: the test
// compile is a glob over `src/**` and types the Workers globals beside the Node
// ones, so it would compile this file either way — `tsconfig.test.json`.)

import { judgeAbsence, absenceRepairInstruction, type AbsenceContext } from "../agent/absence";
import {
  judgeConfidence,
  needsRepair,
  repairInstruction,
  retrievalRanIn,
  type ConfidenceVerdict,
} from "../agent/confidence";
import { buildContextBlock, compactHistory } from "../agent/context-state";
import { correctionDirective, looksLikeCorrection } from "../agent/correction";
import type { AgentResult, TurnSpend } from "../agent/loop";
import { bounceLogLine, proposalWasAddressed } from "../agent/pending-notice";
import type { AgentImage, HistoricalImages } from "../agent/provider-conversation";
import { routeRequest } from "../agent/routing";
import type { ModelTier } from "../agent/routing";
import {
  cutOffVerdict,
  resolveSignal,
  type GateRestage,
  type GateVerdict,
  type OperationOutcome,
} from "../gate/index";
import { collectStrings } from "../agent/tool-input";
import { gateWordsFor, taskCardFor } from "../agent/tool-table";
import type { ToolProgressEvent } from "../agent/tool-progress";
import { relayRecipientId } from "../tools/relayed-dm-render";
import { describeIssueUpdate, issueUpdateFromInput, type IssueUpdate } from "../tools/github-issue-update-render";
import {
  MAX_HISTORY_TURNS,
  inheritedTerms,
  cardConfirmers,
  mayConfirm,
  ownWords,
  proposalOperations,
  proposalReplyThread,
  proposalTtlMs,
  slotKeyOf,
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
import { cardList, readCardTable, withoutRepeatedRows, type CardTable } from "./card-table";
import { intakeChannelInstruction, intakeConfirmers, type IntakeThread } from "./intake-channel";
import {
  asSweepRevision,
  holdsInsert,
  INSERT_CARD_REFUSAL,
  replacedBlocks,
  sweepCardInstruction,
  sweepCardPick,
  sweepTag,
} from "../sweep/cards";
import { DRIFT_KEY } from "../figma-drift/finding";
import { sweepShareCard, SWEEP_SHARE_KEY } from "../sweep/share";
import {
  withWorkingSignal,
  type CardAsk,
  type CardCaveat,
  type CardField,
  type CardRevision,
  type CardRow,
  type CardTarget,
  type Delivery,
  type DeliveryFailureStage,
  type InterimKind,
  type IssueTarget,
  type ProposalCard,
  type TurnSettlement,
} from "./delivery";

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
 * acknowledgement there is. The Worker draws no third distinction: an app DM and
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
  /** The proposal staged in this conversation and still awaiting a decision. */
  pending: PendingProposal | null;
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
   *  it keeps the card table a lookup qualified for and tells the model so
   *  (`turn/card-table.ts`). Returns the text the model reads. */
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

export interface TurnJudgement {
  text: string;
  verdict: string;
}

/**
 * Where a finished turn is recorded, and the facts about its caller the
 * test-traffic rule reads (`usage/record.ts`).
 */
export interface TurnUsage {
  log: UsageLog;
  /** `debug` for anything reached through a debug or health route — the eval
   *  transport among them — which is test traffic by definition. */
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

/** The role map for a staged card; a read that fails reads as no map, so
 *  every role is unknown and the card is staged all the same. */
async function teamRolesOf(usage: TurnUsage): Promise<TeamRoles> {
  // The roles only label a usage record, which never costs the turn its
  // reply: any failure here, a budget stop included, records no roles.
  try {
    return (await usage.teamRoles?.()) ?? {};
  } catch {
    return {};
  }
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
    /** The plain list of the card table beneath the draft, when one is
     *  attached — absent otherwise, and the judge is asked as before. */
    cardTableList?: string;
  }): Promise<TurnJudgement>;

  /** Clarify-vs-act: what this tool call still needs before it may be staged,
   *  or null when it is actionable. */
  preflight(
    toolName: string,
    input: Record<string, unknown>,
    ctx: { prd: { id?: string; url?: string } | null; implementPrdUrl?: string },
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
    /** The `notion_archive` target: page title and parent database. */
    notionTarget(input: Record<string, unknown>): Promise<CardTarget | undefined>;
    /** A render of the Figma node a `prototype_scaffold` implements, or null
     *  where there is no node or the render failed. Best-effort by contract. */
    designPreviewImage(input: Record<string, unknown>): Promise<string | null>;
    /** The listed repo a `github_issue_create` files into (or a
     *  `github_issue_update` writes to), resolved from its
     *  `repo` input as the executor will resolve it, and that repo's
     *  visibility — so the card names where the issue will actually land and
     *  who can read it. */
    issueTarget(input: Record<string, unknown>): Promise<IssueTarget>;
    /** Where a `github_workflow_run` would run: the listed repo its `repo`
     *  resolves to and that repo's default branch — the only ref a run goes
     *  to — or null when the repo is off the list. `branch` is null when the
     *  default branch could not be read, and the card says so. */
    workflowTarget(input: Record<string, unknown>): Promise<{ repo: string; branch: string | null } | null>;
  };

  /**
   * Told when a cut-off run is re-staged as a fresh card (`restageExecution`),
   * so a record kept against the old card's ts can follow it — the sweep's
   * items do (`sweep/outcomes.ts`). Best-effort; absent, nothing follows.
   */
  onRestaged?(from: PendingProposal, to: PendingProposal): Promise<void>;

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

  /** Structured state + progressive summarisation (`CONTEXT_STATE`). Flagged
   *  off in production; see the header of `agent/context-state.ts`. */
  contextState?: boolean;

  now?(): number;
}

// ── The turn ─────────────────────────────────────────────────────────────────

/**
 * What the turn leaves the thread needing — the one place the mapping lives.
 *
 * `active` was the settle at every exit, and it is honest at only some of them:
 * it reports the thread as ready, and a thread holding a card behind ✅ / ⛔ is
 * not ready, whatever the turn itself managed to do (#575).
 *
 * TWO REASONS TO WAIT, and the second is a fact about the THREAD rather than
 * about this turn:
 *   - the turn itself asked for something — `staged` put a card up, `asked`
 *     asked a clarifying question instead of acting;
 *   - a card is live in this reply thread and this turn did not consume it.
 *
 * WHICH DEVIATES FROM #575's LETTER, deliberately, and the issue is being
 * updated to match. It listed `failed` and `reacted` as `active` outright; the
 * consequence is that a turn that fails — or acknowledges with a 🙏 — while an
 * earlier card is still pending would OVERWRITE that thread's `suspended` with
 * `active`, which is the same claim case three of the ticket exists to stop.
 * The thread does not stop waiting because a later turn went wrong. `resolved`
 * is the one ending that consumed the card, so it is the one exempt from the
 * live-card rule.
 *
 * ONE KNOWN IMPRECISION, in the safe direction. `cardLive` is the card the
 * thread held when the turn BEGAN, and one exit retires a card without
 * replacing it: the staging branch supersedes the pending card and then Slack
 * refuses the new one (`disposition: "failed"`). That thread settles
 * `suspended` with nothing live, until the next turn in it settles again.
 * Pinning it exactly would need the turn to report the retirement on its
 * outcome — a field set at one exit — and a false "still waiting" after a
 * visible failure is cheaper than a false "nothing to do" over a live card.
 *
 * The switch is exhaustive on purpose: a further disposition leaves it without
 * a return on that arm and `tsc` refuses the build, which is the only kind of
 * reminder that survives a year.
 */
export function settlementOf(settle: {
  disposition: TurnDisposition;
  /** Whether a proposal card in this thread is still awaiting a decision. */
  cardLive: boolean;
}): TurnSettlement {
  switch (settle.disposition) {
    // The turn asked for something itself, so the card need not be read: a
    // store that failed to record the card cannot turn the ask into a
    // "nothing to do".
    case "staged":
    case "asked":
      return "waiting-on-person";
    // The thread decides. An answer, a bare 🙏, a failure and a turn stopped
    // before its answer landed all leave a live card exactly as they found it.
    // A stop settles like the rest of them for the reason the whole ticket
    // turns on: the person pressed a button and the indicator has to come down
    // — and it has to come down saying the same thing the stop handler says,
    // which computes this same card-based arm (`slack/session-stop.ts`).
    case "answered":
    case "reacted":
    case "failed":
    case "stopped":
      return settle.cardLive ? "waiting-on-person" : "idle";
    // The one ending that consumed the card — the claim IS the resolution.
    case "resolved":
      return "idle";
  }
}

/**
 * One turn, with the working signal guaranteed down when it ends.
 *
 * The turn leaves by ten doors — an answer, a clarifying ask, a staged card,
 * a card Slack refused, four flavours of gate resolution, a stop pressed
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
  // thread root, so channel behaviour is unchanged.
  //
  // It costs no read of its own: the adapter's read at the top of the request
  // is where it came from. It is also the card as of the turn's START, which
  // every exit but one leaves untouched — see `settlementOf`.
  const turnThread = cardThreadOf(request);
  const cardLive = request.pending
    ? proposalReplyThread(request.pending) === turnThread
    : false;

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
        throw err;
      }),
    (outcome) => settlementOf({ disposition: outcome.disposition, cardLive }),
  );

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

/** What a card this turn stages is recorded with (`usage/proposal-events.ts`). */
interface StagingFacts {
  /** This turn's row — the staged event's join to `turns`. */
  turnId: string;
  testTraffic: boolean;
  /** Whether the card may name its channel: `turns`' rule for DMs. */
  channelStored: boolean;
  /** The turn's clock. */
  now: () => number;
}

/**
 * An ask whose row will never hold its text — a DM, a group DM, a conversation
 * of unknown type — labelled in the turn: the one moment its text exists.
 * A channel ask (labelled at the end of the day), test traffic (greetings
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
    postAnswer: (text, cardTable) => noted(delivery.postAnswer(text, cardTable)),
    postNote: (text, tag) => noted(delivery.postNote(text, tag)),
    postGateNote: (note) => noted(delivery.postGateNote(note)),
    card: (proposal) => noted(delivery.card(proposal)),
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
        ...(request.pending ? {} : { wholeDm: true as const }),
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
            : "Cancelled.",
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
  // A file-drift card (`figma-drift/`) holds one intake per file and is read
  // the same way: "drop 2" leaves a file out.
  if (request.pending?.sweepRun || request.pending?.supersedeKey === DRIFT_KEY) {
    const kept = sweepCardPick(request.text, proposalOperations(request.pending).length);
    if (kept) return dropFromSweepCard(request, deps, memory, kept, cardThread, staging);
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
  if (request.pending?.sweepRun) modelBlocks.push(sweepCardInstruction());

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
  const priorAssistantTurn = [...request.history].reverse().find((t) => t.role === "assistant");
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
    const block = buildContextBlock(request.history, request.text);
    if (block) modelBlocks.push(block);
  }
  const modelText = modelBlocks.join("\n\n");

  // Progressive summarisation, same flag. Replaces the dropped middle of a long
  // conversation with a COUNT rather than deleting it silently — a model told
  // the record is partial can say so; a model handed a gap reasons across it.
  const historyForModel = deps.contextState
    ? compactHistory(request.history, { keepRecent: 12, maxChars: 12_000 }).turns
    : request.history;

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

  // The checklist: one task card per lookup that has words for one on its tool
  // table row. The loop reports every call it runs through the lookup path; a
  // reaction, a Worker-only call and anything gated have no card, and that is
  // the table's answer, not a list kept here. Fire-and-forget like the
  // narration, for the same reason: a courtesy must not wait in front of work.
  const showToolProgress = (event: ToolProgressEvent): void => {
    if (taskCardFor(event.name)) delivery.toolProgress(event);
  };

  // Clarify-vs-act, bound to this thread once: the loop asks it mid-turn (so a
  // refusal reaches the model), and the block below asks it again on whatever
  // the loop finally staged (so a refusal the model could not fix reaches the
  // person). One check, one wording, both sides.
  const prd = request.prd ?? null;
  const preflightCall = (
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<{ ask: string } | null> => {
    const prdUrl = implementPrdUrlFor(toolName, input, prd);
    return deps.preflight(toolName, input, {
      prd,
      ...(prdUrl ? { implementPrdUrl: prdUrl } : {}),
    });
  };

  // The card table: the last lookup this turn that qualified for one. Kept as
  // each result comes back rather than read off the run afterwards, because
  // the model has to be TOLD whether a table was attached while it can still
  // write its prose around it — a summary over a table, the plain list without.
  let cardTable: CardTable | undefined;
  const reviseLookupResult = (name: string, args: Record<string, unknown>, text: string): string => {
    const reading = readCardTable(name, args, text);
    if (reading.table) cardTable = reading.table;
    return reading.result;
  };

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
    await delivery.postFailure("agent", err);
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
      ...(cardTable ? { cardTable } : {}),
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
    await delivery.postNote(ask.ask);
    await memory.remember(ask.ask);
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
  // and reading it as a confirmation would run the plan nobody saw.
  if (
    request.pending &&
    stableStringify(proposalOperations(request.pending)) ===
      stableStringify(result.operations)
  ) {
    console.log(
      `[gate] identical re-stage of ${result.toolName} while pending — treating as confirm`,
    );
    const verdict = await resolveSignal(
      {
        kind: "model",
        pending: request.pending,
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

  // Gate idempotency (b): the person JUST cancelled this same action, and the
  // store's outcome note is authoritative — the live thread only shows the
  // narrative text. Don't re-card a cancelled action; require an explicit
  // revival. The window is the last few turns, so one clarifying exchange
  // clears it. Best-effort: a store hiccup must not block a legitimate proposal.
  try {
    const stored = await threadState.readHistory(ref);
    const justCancelled = stored
      .slice(-3)
      .some(
        (t) =>
          t.role === "assistant" &&
          t.content.includes(`(Cancelled the proposed ${result.toolName}`),
      );
    if (justCancelled) {
      const bounce =
        `You cancelled that ${verbFor(result.toolName)} a moment ago, so I'm not re-proposing it on my own. ` +
        `Changed your mind? Say so explicitly and I'll stage it again — or tell me what you'd like instead.`;
      await delivery.postNote(bounce);
      await memory.remember(bounce);
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

  // The card this one revises. Every pending card, except a keyed one
  // (`supersedeKey`) the batch does not touch: that is some other ask made in
  // the thread — filing an issue under a sweep card, say — and stages as its
  // own card beside it (`proposalSlot`), inheriting none of its terms. A sweep
  // card is touched by a batch replacing one of its blocks; any other keyed
  // card by a batch aiming one of its tools at the same target — the weekly
  // card's own intake, not a separate issue filed or commented on beside it.
  const replaced =
    request.pending && slotKeyOf(request.pending) && !touchesCard(result.operations, request.pending) ? null : request.pending;

  // A keyed card that revises only its own way (the weekly DS precedence
  // card, through `drop N`) is not revised by a turn at all: the batch is
  // refused with the card's note, rather than staged as a near-copy that
  // stays live beside it — two live cards could both run.
  if (replaced?.refuseRevision) {
    await delivery.postNote(replaced.refuseRevision);
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

  // A sweep card that adds an answer is revised by `drop N` alone: the model
  // has no `insert` to restage it with, so a worded revision would lose the
  // added text rather than keep it byte for byte.
  if (replaced?.sweepRun && holdsInsert(proposalOperations(replaced))) {
    await delivery.postNote(INSERT_CARD_REFUSAL, sweepTag("note"));
    await memory.remember(INSERT_CARD_REFUSAL);
    return { disposition: "asked", posted: INSERT_CARD_REFUSAL, wrote: memory.wrote(), telemetry };
  }

  // A sweep card's revision drops fixes and does nothing else: each of its
  // operations must be one of the card's own, as it was. Anything else — a fix
  // rewritten, a stamp changed, one added — is refused and the card stays.
  if (replaced?.sweepRun && !isSubsetOf(result.operations, proposalOperations(replaced))) {
    const refusal =
      ":warning: That would change a fix on this sweep card rather than drop one, so the card stays as it is. " +
      "Reply with the number of a fix to drop it, or ⛔ the card and ask me for the change you want.";
    await delivery.postNote(refusal, sweepTag("note"));
    await memory.remember(refusal);
    return { disposition: "asked", posted: refusal, wrote: memory.wrote(), telemetry };
  }
  // And it keeps the card's deadline, read before the card is retired.
  const sweepLeftMs = replaced?.sweepRun ? await timeLeftOn(replaced, threadState, staging.now()) : undefined;
  if (sweepLeftMs !== undefined && sweepLeftMs <= 0) {
    await delivery.postNote(CARD_CLOSED, sweepTag("note"));
    await memory.remember(CARD_CLOSED);
    return { disposition: "asked", posted: CARD_CLOSED, wrote: memory.wrote(), telemetry };
  }

  // A different proposal is already pending: retire it, because the card about
  // to go up replaces it. RETIRE, never claim (#583): a claim DELETES, and the
  // record deleted here is the one a late ✅ needs in order to be told its card
  // was replaced. With the delete in place the by-ts lookup answered "none",
  // Gate fell through to the thread's newest card, and the person got "it is
  // not on the proposal I am holding" — true of a reaction that missed, and the
  // wrong thing to say to someone whose card was revised out from under them.
  // Observed live in `#uno-bot-sandbox` against r332.
  //
  // Here rather than after the card posts, even though `putProposal` retires
  // the thread's pending card too: this closes the seconds the revision spends
  // being written, during which the old card would otherwise still execute the
  // input the person just pushed back on.
  const retiredAhead =
    replaced && (await threadState.retireProposal(replaced.proposalTs)).retired ? [replaced.proposalTs] : [];
  // On the record only when a retire took a live card out of reach — not one
  // a ✅ claimed meanwhile, which has its own outcome — and at once, so a card
  // whose revision then fails to post is not later read as aged out.
  const recordSuperseded = (retired: readonly string[]) =>
    recordProposalEvents(
      deps.usage.proposalEvents,
      supersededEvents(retired, staging.now(), "revision"),
      deps.usage.writeTimeoutMs,
    );
  await recordSuperseded(retiredAhead);

  const built = await buildCard(
    result,
    deps,
    implementPrdUrlFor(result.toolName, result.input, prd),
    request.surface === "assistant",
  );
  // A revision of a sweep card is still one, so replies under it are read by
  // the sweep's rule.
  const card = replaced?.sweepRun ? asSweepRevision(built) : built;
  // Anything the batch's plan needs posted BEFORE the card — because the card
  // holds the ✅/⛔ buttons and has to be the last message in the thread — is
  // the adapter's to send, since it is Slack's message limits that decide
  // whether there is anything to send at all (#623).
  const posted = await delivery.card(card);
  if (!posted.ok || !posted.ts) {
    console.error(`[turn] proposal card was not staged (${result.toolName})`);
    return {
      disposition: "failed",
      failure: { stage: "delivery" },
      wrote: memory.wrote(),
      telemetry,
    };
  }

  // Persisted the moment the card posts: it is reactable instantly, and a quick
  // ✅ that lands before the proposal is saved would look up nothing and be
  // silently lost. Save first so the confirmation always finds it.
  const proposal: PendingProposal = {
    // The WHOLE batch, untruncated: what the card renders is a rendering, and
    // what a later ✅ executes is this list.
    operations: result.operations,
    toolName: result.toolName,
    input: result.input,
    channel: request.channel,
    threadTs: request.conversationTs,
    ...(request.replyTs ? { replyTs: request.replyTs } : {}),
    userMsgTs: request.userMsgTs,
    proposalTs: posted.ts,
    // What the adapter actually posted, never a copy rendered here: the button
    // door re-renders the resolved card from this field, so a second rendering
    // that drifted would repaint the card with words it never had (#623).
    proposalText: posted.text,
    requesterUserId: request.userId,
    ...(prd?.id ? { notionPrdId: prd.id } : {}),
    ...(prd?.url ? { notionPrdUrl: prd.url } : {}),
    // A revision is held to the terms of the card it replaces — its lifetime
    // and who may confirm it. A fresh card has none and gets the defaults.
    ...inheritedTerms(replaced),
    // A revision of a keyed card stays in the card's slot.
    ...(replaced?.supersedeKey ? { supersedeKey: replaced.supersedeKey } : {}),
    // A revision of a sweep card stays a sweep card, in the sweep's slot, so
    // its items are still recorded (`sweep/outcomes.ts`); it keeps the card's
    // deadline, and its outcome joins the row the Worker's staging wrote.
    ...(replaced?.sweepRun
      ? {
          sweepRun: replaced.sweepRun,
          supersedeKey: replaced.supersedeKey ?? SWEEP_KEY,
          ttlMs: sweepLeftMs,
          originProposalTs: stagingCardOf(replaced),
        }
      : {}),
    // In #uno-bot the poster and the thread's repliers confirm, and a revision
    // adds whoever staged it (`turn/intake-channel.ts`).
    ...(request.intakeChannel
      ? { confirmers: intakeConfirmers(request.intakeChannel, request.pending, request.userId) }
      : {}),
  };
  const { retired: retiredByStaging } = await threadState.putProposal(proposal);
  // On the record as soon as it is stored, so a ✅ that lands before the turn
  // finishes finds the staged row and the turn id it joins to; a ticket that
  // ✅ files waits on that row until the turn writes its own (`runTurn`).
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
  // A proposal is still a completed conversational turn. An agent_view DM has
  // no Slack thread to rebuild, so preserving this exchange in the store is the
  // only way its image pointer reaches the immediate follow-up.
  await memory.remember(posted.text);

  return {
    disposition: "staged",
    posted: posted.text,
    staged: { proposal, card },
    wrote: memory.wrote(),
    telemetry,
  };
}

/** What a revision of a sweep card that has closed meanwhile is told. */
const CARD_CLOSED = "That card is no longer open, so it stays as it was.";

/**
 * How long a live card has left before its deadline — its staging time plus
 * its own lifetime — or 0 once it is no longer live. A sweep card's revision
 * lives for this rather than a fresh lifetime.
 */
async function timeLeftOn(
  card: PendingProposal,
  threadState: TurnDeps["threadState"],
  now: number,
): Promise<number> {
  const live = await threadState.getProposalByTs(card.proposalTs);
  return live.state === "found" ? Math.max(0, live.createdAt + proposalTtlMs(card) - now) : 0;
}

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
    return settleVerdict(verdict, { deps, memory, note: "Cancelled.", telemetry });
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
  const card = asSweepRevision(
    await buildCard(
      { kind: "proposal", operations, toolName: first.toolName, input: first.input },
      deps,
      undefined,
      request.surface === "assistant",
    ),
  );
  const posted = await delivery.card(card);
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
    requesterUserId: request.userId,
    ...inheritedTerms(pending),
    ttlMs: leftMs,
    ...(pending.sweepRun ? { sweepRun: pending.sweepRun } : {}),
    supersedeKey: pending.supersedeKey ?? SWEEP_KEY,
    // The same card minus some items, so a drift card's own gate words stay
    // (`figma-drift/copy.ts` `driftCardWords`); a sweep card has none.
    ...ownWords(pending),
    // The Worker staged the card this revises: its usage row is the root
    // every later outcome joins to.
    originProposalTs: stagingCardOf(pending),
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

/**
 * What a person outside a card's confirmer set is told when their message
 * would have revised it. Names who can, since that is who to ask; only a Slack
 * user id is mentioned.
 */
export function revisionRefusal(confirmers: readonly string[], userId: string): string {
  const id = /^[UW][A-Z0-9]{2,20}$/;
  const to = id.test(userId) ? `<@${userId}> ` : "";
  const who = confirmers.filter((c) => id.test(c)).map((c) => `<@${c}>`);
  const names = who.length <= 1 ? who.join("") : `${who.slice(0, -1).join(", ")} or ${who[who.length - 1]}`;
  return who.length
    ? `:warning: ${to}Only ${names} can change this proposal, so it stays as it is — ask one of them if it needs a change.`
    : `:warning: ${to}Nobody here can change this proposal, so it stays as it is.`;
}

// ── The gate path ────────────────────────────────────────────────────────────

/**
 * Apply one Gate verdict, and be the turn's outcome.
 *
 * Both of the turn's gate doors — the typed emoji and the model's own
 * `proposal_resolve` — end here, which is what makes a lost race read the same
 * on each: the verdict's own note is posted, `applyVerdict` executes nothing
 * unless the claim was won, and the record says what the person was told.
 *
 * WHAT THE RECORD REMEMBERS is what the adapter reports posting, not a second
 * rendering of the note made here — the turn has none, and the conversation's
 * memory is read by the model on the next turn, so a copy that drifted would
 * make the bot remember a line nobody saw (#623).
 *
 * `note` is what the RECORD should say when that differs from what was posted
 * ("(confirmed — executing the proposal)" beside "Got it — kicking that
 * off."), and it applies only to a verdict that won: on a lost race the
 * conversation should remember what the person actually read.
 */
async function settleVerdict(
  verdict: GateVerdict,
  ctx: {
    deps: TurnDeps;
    memory: ThreadMemory;
    telemetry: TurnTelemetry;
    note?: string;
    /** A line after the verdict's note and before any re-staged card. */
    aside?: string;
  },
): Promise<TurnOutcome> {
  const said = verdict.post
    ? await ctx.deps.delivery.postGateNote(verdict.post.note)
    : undefined;
  const posted = said?.text;
  const executed = await ctx.deps.applyVerdict(verdict);
  const remembered = (verdict.outcome === "won" ? ctx.note : undefined) ?? posted;
  if (remembered) await ctx.memory.remember(remembered);
  if (ctx.aside) {
    await ctx.deps.delivery.postNote(ctx.aside);
    await ctx.memory.remember(ctx.aside);
  }
  // A cut-off run's leftovers go back on a card of their own, after the note
  // that explains them — the card holds the buttons, so it comes last.
  const staged = verdict.restage
    ? await restageExecution(verdict.restage, {
        ...ctx.deps,
        proposalEvents: ctx.deps.usage.proposalEvents,
      })
    : null;
  if (staged) await ctx.memory.remember(staged.proposal.proposalText);
  return {
    disposition: staged ? "staged" : "resolved",
    ...(staged ? { posted: staged.proposal.proposalText, staged } : posted ? { posted } : {}),
    wrote: ctx.memory.wrote(),
    telemetry: ctx.telemetry,
    ...(executed ? { executed } : {}),
  };
}

/**
 * Put what a cut-off run never finished in front of a person again, as a fresh
 * card — the one way anything of it runs a second time.
 *
 * The card is built exactly as a staged proposal's is, reads included (the
 * repo an intake lands in and whether it is public, a workflow's branch), so
 * the person approves what will actually run rather than a copy of the old
 * card. It keeps the original's requester, thread, PRD and terms (lifetime and
 * confirmer set — the same `ProposalTerms` a revision inherits), and gets a ts
 * and a fresh run of that lifetime; staging it retires any card still live in
 * that reply thread, as every staging does (`ThreadState.putProposal`).
 *
 * Exported because two doors outside Turn — the reaction and the button on the
 * stuck card — are later looks too, and a card is Turn's to build. Their
 * envelopes bind this with the same card reads a turn gets.
 *
 * @returns the staged card, or null when Slack refused it — said out loud, as
 *          every failed staging is
 */
export async function restageExecution(
  restage: GateRestage,
  deps: Pick<TurnDeps, "threadState" | "delivery" | "cards" | "onRestaged"> & {
    /** Where the fresh card's staging is recorded. */
    proposalEvents: ProposalEventLog;
  },
): Promise<{ proposal: PendingProposal; card: ProposalCard } | null> {
  const original = restage.proposal;
  const first = restage.operations[0]!;
  // A group DM's share card is rebuilt as one, so a re-staged card still
  // quotes the exact note its ✅ posts (`sweep/share.ts`).
  const built =
    original.supersedeKey === SWEEP_SHARE_KEY
      ? sweepShareCard(restage.operations)
      : await buildCard(
          { kind: "proposal", operations: restage.operations, toolName: first.toolName, input: first.input },
          deps,
          implementPrdUrlFor(first.toolName, first.input, {
            ...(original.notionPrdId ? { id: original.notionPrdId } : {}),
            ...(original.notionPrdUrl ? { url: original.notionPrdUrl } : {}),
          }),
          // The card's DM caveats follow the surface, and a DM channel is the one
          // the proposal record can still name.
          original.channel.startsWith("D"),
        );
  // The warning rides the card, not only the note before it: a note that
  // failed to post must not leave a card that reads like any other.
  const card: ProposalCard = { ...built, caveats: [{ kind: "cut-off-rerun" }, ...built.caveats] };
  const posted = await deps.delivery.card(card);
  if (!posted.ok || !posted.ts) {
    console.error(`[turn] re-staged card was not posted (${first.toolName})`);
    await deps.delivery.postFailure("delivery");
    return null;
  }
  // A cancel run is not carried over: part of the original may already have
  // happened, and a ⛔ on the fresh card must run nothing a second time. Nor
  // is a group DM's share: only the card people were shown offers one
  // (`sweep/share.ts`). Nor are a stated card's own words: the fresh card is
  // an ordinary one, with a ⚠️ and a ⛔ that runs nothing, so "Intake only"
  // would misstate it.
  const { onCancel: _onCancel, sweepShare: _sweepShare, stated: _stated, ...kept } = original;
  const proposal: PendingProposal = {
    ...kept,
    operations: restage.operations,
    toolName: first.toolName,
    input: first.input,
    proposalTs: posted.ts,
    proposalText: posted.text,
    // The ask's own card, carried across however many re-stagings.
    originProposalTs: stagingCardOf(original),
  };
  const { retired } = await deps.threadState.putProposal(proposal);
  // The fresh card is the ask's card's successor on the record: through
  // `originProposalTs` it takes that card's turn, channel and test-traffic
  // flag, so a ticket its ✅ files still finds the turn that asked for it.
  await recordProposalEvents(deps.proposalEvents, [
    ...supersededEvents(retired, Date.now(), "restage"),
    stagedEvent({
      proposal,
      at: Date.now(),
      via: "restage",
      channelStored: false,
    }),
  ]);
  await deps.onRestaged?.(original, proposal).catch((err: unknown) => {
    console.error(`[turn] re-staged card's records not moved: ${err instanceof Error ? err.message : String(err)}`);
  });
  return { proposal, card };
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
  /** The card table this turn's lookups left, to post beneath the answer. */
  cardTable?: CardTable;
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

  // A reaction and no words. The model answered a pure acknowledgement
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
  // D9 (one woven confidence clause) was only ever checked INSIDE the judge,
  // which skips anything under 1500 chars — and almost every blueprint answer
  // is a few hundred. This runs on the body that will actually SHIP, because
  // the cap truncates after the judge has scored and can amputate a clause from
  // a reply already logged as verdict=pass.
  const retrievalRan = retrievalRanIn(run.tools);
  const servedFromCache = run.receipt?.cached === true;
  let verdict: ConfidenceVerdict = { kind: "exempt" };
  try {
    verdict = judgeConfidence(deps.deliveredBody(draft), { retrievalRan, servedFromCache });
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
        console.log(`[absence] unscoped claim over ${run.absence.visibility} — forcing repair`);
      }
    } catch (err) {
      console.warn(
        `[absence] pre-check failed: ${err instanceof Error ? err.message : String(err)} — no escalation`,
      );
    }
  }

  // ONE judge call carries both repairs when both fire. Sent as two sibling
  // instructions they compete and the model does one.
  const extra = [repairInstruction(verdict) ?? undefined, absenceRepair]
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
        : {}),
    ...(extra ? { extraInstruction: extra } : {}),
    // The reader gets the prose AND the table beneath it, so the judge grades
    // both: a draft that summarises and points at the table has answered.
    ...(ctx.cardTable ? { cardTableList: cardList(ctx.cardTable) } : {}),
  });
  telemetry.judge = reviewed.verdict;

  // Re-validation, not a second repair round. A judge revision can itself end
  // in a trailing label, which the strip then DELETES without putting anything
  // back — turning "wrong shape" into "no signal at all" in the one reply we
  // had already noticed was wrong. Logged so that outcome is countable; looping
  // here would cost another model call per turn and could land in the same
  // place anyway.
  try {
    const finalVerdict = judgeConfidence(deps.deliveredBody(reviewed.text), {
      retrievalRan,
      servedFromCache,
    });
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

  // Rows the model typed out as well as the table come out here, after the
  // judge (whose revision could type them too) and before the one call every
  // Delivery shares, so Slack, the recording Delivery and the thread's memory
  // all get the same prose. A rule that must hold on every provider lives in
  // code, not in the persona.
  let prose = reviewed.text;
  if (ctx.cardTable) {
    const stripped = withoutRepeatedRows(prose, ctx.cardTable);
    if (stripped.removed) console.log(`[card-table] removed ${stripped.removed} repeated row line(s) from the prose`);
    prose = stripped.text;
  }

  // The table rides with the answer; what comes back as `posted.text` is then
  // the prose and its plain list, which is what the thread remembers below.
  const posted = await delivery.postAnswer(prose, ctx.cardTable);

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
    await delivery.postFailure("delivery");
    return {
      disposition: "failed",
      failure: { stage: "delivery" },
      wrote: ctx.memory.wrote(),
      telemetry,
    };
  }

  // Record what was actually POSTED (capped, placeholder and all), not the raw
  // text.
  await ctx.memory.rememberAssistant(posted.text);

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

/**
 * The PRD url an `implement` runs against: the thread-root notification, or the
 * link the designer pasted into the call.
 *
 * Read twice — by the clarify gate and by the card preview — and derived rather
 * than held, so the mid-turn check and the staged card cannot disagree about
 * which PRD this is.
 */
function implementPrdUrlFor(
  toolName: string,
  input: Record<string, unknown>,
  prd: { id?: string; url?: string } | null,
): string | undefined {
  if (toolName !== "component_implement") return undefined;
  const pasted = typeof input.notion_prd_url === "string" ? input.notion_prd_url.trim() : "";
  return prd?.url ?? (pasted || undefined);
}

// ── Cards ────────────────────────────────────────────────────────────────────

/**
 * The card for one staged Proposal: what a person is being asked to approve, as
 * DATA.
 *
 * It used to be a Slack string — `formatProposal` and `withOperationPlan`
 * called from here, plus a list of follow-up messages handed back to be posted
 * — and so the turn owned an `:warning:`, a confirm footer and Slack's
 * message-size limits (#623). What it owns now is the decisions: which card
 * this is, which verb names it, which caveats a person must see, and the WHOLE
 * batch the one ✅ runs. `slack/proposal-render.ts` § `renderProposalCard`
 * decides how all of that reads, and `Delivery.card` reports back what
 * it actually posted.
 *
 * The card is still the SOURCE OF TRUTH for what a ✅ runs: `operations` is the
 * batch untruncated, which is what lets the adapter group and never summarise
 * it away.
 */
async function buildCard(
  result: Extract<AgentResult, { kind: "proposal" }>,
  deps: Pick<TurnDeps, "cards">,
  implementPrdUrl: string | undefined,
  fromDm: boolean,
): Promise<ProposalCard> {
  const card = await cardOf(result, deps, implementPrdUrl, fromDm);
  // Who wrote the opening line, for the eval envelope: the model when its own
  // reply leads, the Worker for everything else — its ask, its PRD line, or a
  // lead that is only its "I could not stage …" note.
  const modelLed = !card.ask && !!result.replyText && card.lead === result.previewText;
  return card.ask || card.lead ? { ...card, leadBy: modelLed ? "model" : "worker" } : card;
}

/** The card itself, before who-wrote-the-lead is marked. */
async function cardOf(
  result: Extract<AgentResult, { kind: "proposal" }>,
  deps: Pick<TurnDeps, "cards">,
  implementPrdUrl: string | undefined,
  fromDm: boolean,
): Promise<ProposalCard> {
  const { toolName, input, operations } = result;
  const card: ProposalCard = {
    kind: toolName === "notion_update" ? "revision" : "confirm",
    verb: verbFor(toolName),
    ...(result.previewText ? { lead: result.previewText } : {}),
    fields: cardFieldsOf(input),
    caveats: caveatsFor(toolName, input, result.previewText),
    operations: result.operations,
  };

  // THE ASK, when the model staged an intake and wrote no line of its own
  // beside it: the card leads with where it goes and whether to file, so the
  // requester is never handed a card and silence. Read off the model's reply,
  // not the preview — a Worker "I could not stage …" note is not a reply.
  // Absent `replyText` is a card no model turn produced (a restage, a sweep
  // revision), and those get none. Only the intake cards get one, and only
  // when the WHOLE batch is one tool on one target — a mixed batch has no one
  // line that is true of it, and every other card's heading and footer
  // already say what the ✅ does.
  const silent = result.replyText === "";
  const sameTool = operations.every((op) => op.toolName === toolName);
  const ask = (made: CardAsk | null): { ask?: CardAsk } => (silent && sameTool && made ? { ask: made } : {});

  if (toolName === "github_issue_create") {
    // THE REPO AND WHO CAN READ IT: an intake on a public repo is readable by
    // anyone the moment it is filed, and the card is the one place a person
    // reads the body before it goes out — so the heading names the repo the
    // Worker files into, and the caveat says whether it is public. A redirect
    // ("put it on plus-uno instead") is a new card, naming the new repo.
    const { repo, visibility } = await deps.cards.issueTarget(input);
    return {
      ...card,
      verb: `${card.verb} on ${repo}`,
      ...ask(silent && sameTool && (await oneRepo(operations, repo, deps)) ? { kind: "file-issue", repo } : null),
      caveats: [{ kind: "repo-visibility", repo, visibility, ...(fromDm ? { fromDm: true as const } : {}) }],
    };
  }
  if (toolName === "github_issue_update") {
    const { updates, ...update } = await issueUpdateCardOf(operations, deps, fromDm);
    return { ...card, ...update, ...ask(updateAskOf(updates)) };
  }
  if (toolName === "notion_create") {
    // THE SURFACE, named the way the issue card names its repo: an intake is
    // a GitHub issue or a Roadmap card, and a requester redirects by surface
    // ("put it on the Roadmap instead") — so the heading says which this is.
    const verb = NOTION_SURFACE_VERBS[surfaceOf(input)];
    return {
      ...card,
      ...(verb ? { verb } : {}),
      ...ask(operations.every((op) => surfaceOf(op.input) === "intake") ? { kind: "roadmap-intake" } : null),
    };
  }

  if (toolName === "github_workflow_run") {
    // What the ✅ starts, in full: the repo, the workflow, and the branch it
    // runs on — always the default one, named rather than left to a guess,
    // and a failed read of it said plainly rather than papered over.
    const target = await deps.cards.workflowTarget(input);
    return target
      ? {
          ...card,
          fields: cardFieldsOf({
            repo: target.repo,
            workflow: input.workflow,
            branch:
              target.branch ??
              "couldn't read the default branch — it will run on whatever GitHub's default is",
          }),
        }
      : card;
  }

  if (toolName === "prototype_scaffold") {
    // The Figma render, when one can be fetched — a URL on the card, not a
    // block: what Slack does with an image is the adapter's.
    const previewImageUrl = await deps.cards.designPreviewImage(input);
    return previewImageUrl ? { ...card, previewImageUrl } : card;
  }
  if (toolName === "component_implement") {
    // Show which PRD this implement is tied to, so the requester can see it.
    return implementPrdUrl
      ? { ...card, lead: `Using the PRD for this change: ${implementPrdUrl}` }
      : card;
  }
  if (toolName === "notion_update") {
    // The conversational card: the diff leads, and there is no ⚠️ preamble —
    // the lead, the named page and the `current → new` lines speak for
    // themselves. The read behind it is a named client's.
    return { ...card, revision: await deps.cards.notionRevision(input), fields: [] };
  }
  if (toolName === "notion_archive") {
    const target = await deps.cards.notionTarget(input);
    return target ? { ...card, target } : card;
  }
  if (toolName === "dm_relay") return { ...card, fields: relayFieldsOf(result.operations) };
  return card;
}

/** A `notion_create` card's heading, by the `surface` it files on. A surface
 *  not listed keeps the row's own verb. */
const NOTION_SURFACE_VERBS: Readonly<Record<string, string>> = {
  prd: "create this card on the Roadmap board",
  intake: "create this card on the Roadmap board",
  decision: "log this decision in the Decisions DB",
};

function surfaceOf(input: Record<string, unknown>): string {
  return String(input.surface ?? "").trim().toLowerCase();
}

/** Every issue create in the batch files on `repo` — each read through the
 *  same `issueTarget` the heading's repo was, so a batch across two repos is
 *  never announced as filing on one. */
async function oneRepo(
  operations: ReadonlyArray<ProposalOperation>,
  repo: string,
  deps: Pick<TurnDeps, "cards">,
): Promise<boolean> {
  for (const op of operations.slice(1)) {
    if ((await deps.cards.issueTarget(op.input)).repo !== repo) return false;
  }
  return true;
}

/** One issue follow-up, as the ask reads it: the target, and what happens —
 *  `null` where the input did not read, which is a case for no line at all. */
type UpdateAskPart = { target: string; verb: "add" | "close" | "update" } | null;

/**
 * The ask for a batch of issue follow-ups. `add this to` is true only of a
 * comment alone, `close` only of a close alone; anything else — a relabel, a
 * reopen, a comment and a close together — is an `update`. An update that did
 * not read gets no line: a wrong line is worse than none.
 */
function updateAskOf(parts: readonly UpdateAskPart[]): CardAsk | null {
  if (!parts.length || parts.some((p) => p === null)) return null;
  const read = parts as ReadonlyArray<NonNullable<UpdateAskPart>>;
  const verbs = new Set(read.map((p) => p.verb));
  return { kind: "update-issue", verb: verbs.size === 1 ? read[0]!.verb : "update", issues: read.map((p) => p.target) };
}

function updateVerbOf(update: IssueUpdate): "add" | "close" | "update" {
  const relabels = update.addLabels.length + update.removeLabels.length > 0;
  if (update.comment && !update.state && !relabels) return "add";
  if (!update.comment && update.state?.startsWith("closed") && !relabels) return "close";
  return "update";
}

/**
 * An issue follow-up's card: per issue, `repo#number`, what will happen to it
 * in the order it runs, and any comment verbatim — read through the same
 * `issueUpdateFromInput` the executor runs, so the card says what the ✅ does.
 * Preflight refuses an input that reading rejects before staging, so every
 * operation here reads.
 *
 * The repo shown is the resolver's entry, read through `issueTarget` as the
 * intake card reads it — the list's spelling, never the model's — and each
 * repo a comment lands on gets the visibility notice.
 */
async function issueUpdateCardOf(
  operations: ReadonlyArray<ProposalOperation>,
  deps: Pick<TurnDeps, "cards">,
  fromDm: boolean,
): Promise<Pick<ProposalCard, "fields" | "caveats"> & { updates: UpdateAskPart[] }> {
  const updates = operations.filter((op) => op.toolName === "github_issue_update");
  const notices = new Map<string, CardCaveat>();
  const perIssue: Array<{ target: string; fields: CardField[] }> = [];
  const asks: UpdateAskPart[] = [];
  for (const op of updates) {
    const { repo, visibility } = await deps.cards.issueTarget(op.input);
    const read = issueUpdateFromInput(op.input);
    if (!read.ok) {
      perIssue.push({ target: `${repo}#${String(op.input.issue_number ?? "?")}`, fields: cardFieldsOf(op.input) });
      asks.push(null);
      continue;
    }
    if (read.update.comment && !notices.has(repo)) {
      notices.set(repo, { kind: "repo-visibility", repo, visibility, write: "comment", ...(fromDm ? { fromDm: true as const } : {}) });
    }
    asks.push({ target: `${repo}#${read.update.issue}`, verb: updateVerbOf(read.update) });
    perIssue.push({
      target: `${repo}#${read.update.issue}`,
      fields: [
        { label: "operations", value: describeIssueUpdate(read.update).join(" · ") },
        ...(read.update.comment ? [{ label: "comment", value: read.update.comment }] : []),
      ],
    });
  }
  const fields: CardField[] =
    perIssue.length === 1
      ? [{ label: "issue", value: perIssue[0]!.target }, ...perIssue[0]!.fields]
      : perIssue.map((u) => ({ label: u.target, under: u.fields.map((field) => ({ field })) }));
  return { fields, caveats: [...notices.values()], updates: asks };
}

/**
 * A relayed DM's card: who will be DM'd, and the text they will read.
 *
 * The fields are built from EVERY relay in the batch, not the first operation's
 * input, because each recipient is an operation of its own and the ✅ is
 * consent to each of them. A recipient reads as the mention Slack would ping —
 * the check that the name resolved to the right person is made by looking at
 * it. One text shared by every recipient is shown once; texts that differ are
 * shown per recipient, verbatim.
 */
function relayFieldsOf(operations: ReadonlyArray<ProposalOperation>): CardField[] {
  const relays = operations.filter((op) => op.toolName === "dm_relay");
  const mention = (op: ProposalOperation): string => {
    const id = relayRecipientId(op.input.recipient);
    return id ? `<@${id}>` : String(op.input.recipient ?? "");
  };
  const textOf = (op: ProposalOperation): string =>
    typeof op.input.text === "string" ? op.input.text : "";
  if (new Set(relays.map(textOf)).size > 1) {
    return [
      {
        label: "messages",
        under: relays.map((op) => ({ field: { label: mention(op), value: textOf(op) } })),
      },
    ];
  }
  const recipients = relays.map(mention);
  return [
    recipients.length === 1
      ? { label: "recipient", value: recipients[0]! }
      : { label: "recipients", value: recipients.join(", ") },
    { label: "text", value: textOf(relays[0]!) },
  ];
}

/**
 * What one ✅ does, in the gated row's own words.
 *
 * Read from `agent/tool-table.ts` — import-free, and the ONE place these words
 * live since the two switches in the renderer went (#598). The fallback is the
 * bare tool name, which is what a switch arm nobody added used to print at a
 * designer; it is unreachable for anything the Gate can stage, because a gated
 * row carries its `verb` or does not compile.
 */
function verbFor(toolName: string): string {
  return gateWordsFor(toolName)?.verb ?? toolName;
}

/**
 * The staged input as the card's labelled fields, nesting exactly as the input
 * nests.
 *
 * Labels are the input's OWN keys: turning `page_url` into `Page link` is
 * presentation and belongs in the adapter. A value that is absent, null or
 * empty is dropped rather than shown as a blank — the card is read by
 * designers, not machines (user decision, 2026-07-12).
 */
function cardFieldsOf(input: Record<string, unknown>): CardField[] {
  return Object.entries(input)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => cardFieldOf(k, v));
}

function cardFieldOf(label: string, value: unknown): CardField {
  if (Array.isArray(value)) {
    // A list of scalars becomes bullets; a list with any structure in it
    // becomes the sub-fields of each item, in order, so nothing is flattened
    // into a JSON blob on the way past.
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return { label, under: value.map((item) => ({ item: String(item) })) };
    }
    const under: CardRow[] = [];
    for (const item of value) {
      if (item !== null && typeof item === "object") {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          under.push({ field: cardFieldOf(k, v) });
        }
        continue;
      }
      under.push({ item: String(item) });
    }
    return { label, under };
  }
  if (value !== null && typeof value === "object") {
    return {
      label,
      under: Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        field: cardFieldOf(k, v),
      })),
    };
  }
  return { label, value: String(value) };
}

/**
 * What a person must be told about this staged input before they press ✅.
 *
 * A JUDGEMENT, which is why it is here and not in the renderer: the caveats
 * are reached by READING the staged input, and the renderer only knows how each
 * one reads.
 *
 * THE MISSING-CONTEXT GATE (todo 070): the model is told to name a brief's open
 * questions before staging and does so inconsistently. If nothing staged
 * mentions a gap, say so ON the card — the ✅ then knowingly accepts a gap-free
 * reading of the brief instead of silently inheriting one. It covers PRD-shaped
 * `notion_create` as well as `prototype_scaffold` since 2026-08-22: eval P3
 * regressed 3/3 → 2/3 the moment AGENT.md rule 4 started steering a
 * build-from-this-brief ask toward staging the PRD card, because the flag
 * existed for one tool and the model reached for the other. A gate that depends
 * on which tool the model picked is not a gate.
 *
 * THE BUNDLE AUDIT is "stage, but flag gaps loudly" (Bill, 2026-07-16): a
 * share-out stages immediately with whatever is in hand, and the CARD carries
 * the audit — so ✅ is informed consent to post without the missing pieces, and
 * a weaker model provider cannot silently skip the disclosure. The bundle
 * contract for prototype share-outs is a Loom walkthrough, a live preview and a
 * Decisions DB link (`skills/uno-publish/references/method.md`).
 *
 * The repo-visibility caveat is `buildCard`'s, because naming the repo and
 * its visibility takes a read through `deps.cards`.
 */
function caveatsFor(
  toolName: string,
  input: Record<string, unknown>,
  previewText: string | undefined,
): CardCaveat[] {
  if (toolName === "shareout_post") {
    const summary = typeof input.summary === "string" ? input.summary : "";
    if (!/prototype|prototypes|scaffold/i.test(summary)) return [];
    const haystack = collectStrings(input).join("\n");
    const missing: string[] = [];
    if (!/https?:\/\/[^\s]*loom\.com/i.test(haystack)) missing.push("Loom walkthrough");
    if (!/https?:\/\/[^\s]*(netlify\.app|workers\.dev)/i.test(haystack)) {
      missing.push("live preview");
    }
    if (!/https?:\/\/[^\s]*(notion\.so|notion\.site|app\.notion\.com)/i.test(haystack)) {
      missing.push("Decisions DB link");
    }
    return missing.length ? [{ kind: "bundle-incomplete", missing }] : [];
  }
  const gapGated =
    toolName === "prototype_scaffold" ||
    (toolName === "notion_create" && input.surface === "prd");
  if (!gapGated) return [];
  const staged = [
    previewText ?? "",
    typeof input.notes === "string" ? input.notes : "",
    JSON.stringify(input.sections ?? ""),
    typeof input.summary === "string" ? input.summary : "",
  ]
    .join(" ")
    .toLowerCase();
  return /(open question|gap|ambiguit|unspecified|undecided|to confirm|tbd)/.test(staged)
    ? []
    : [{ kind: "no-open-questions" }];
}

// ── Small pure helpers ───────────────────────────────────────────────────────

/** Every operation in `revised` is one of `original`'s, byte for byte. */
function isSubsetOf(revised: readonly ProposalOperation[], original: readonly ProposalOperation[]): boolean {
  const kept = new Set(original.map(stableStringify));
  return revised.length > 0 && revised.every((op) => kept.has(stableStringify(op)));
}

/** Whether a batch replaces any block the card replaces. */
function touchesBlocksOf(operations: readonly ProposalOperation[], card: PendingProposal): boolean {
  const theirs = replacedBlocks(proposalOperations(card));
  return [...replacedBlocks(operations)].some((b) => theirs.has(b));
}

/**
 * Whether a batch touches a keyed card: for a sweep card, replaces one of its
 * blocks; for any other, aims one of its tools at the same target.
 */
function touchesCard(operations: readonly ProposalOperation[], card: PendingProposal): boolean {
  if (card.sweepRun) return touchesBlocksOf(operations, card);
  const theirs = proposalOperations(card);
  return operations.some((op) => theirs.some((own) => sameTarget(op, own)));
}

/**
 * Whether two operations use the same tool on the same target: an issue update
 * on the same `issue_number`, an issue create under the same title. Any other
 * tool is matched by the tool alone.
 */
function sameTarget(a: ProposalOperation, b: ProposalOperation): boolean {
  if (a.toolName !== b.toolName) return false;
  if (a.toolName === "github_issue_update") return String(a.input.issue_number) === String(b.input.issue_number);
  if (a.toolName === "github_issue_create") {
    const title = (op: ProposalOperation) => String(op.input.title ?? "").trim().toLowerCase();
    return title(a) === title(b);
  }
  return true;
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
