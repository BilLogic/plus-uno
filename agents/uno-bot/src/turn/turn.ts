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
// store, the agent loop, the judge, preflight, the gate's resolver, the two
// Notion card clients, the antecedent read. `Env` never enters — it is turned
// into `TurnDeps` once, in `slack/turn-adapter.ts`.
//
// SO THE CALLER IS NOT SLACK. A request carries who, where, the text, the
// images as BYTES already decoded, and the pending proposal; nothing in here
// downloads a file, reads a Slack thread, or knows a channel id from a room
// number. That is what lets `tests/turn.test.ts` drive a whole turn on the
// recording Delivery, the in-memory ThreadState and the fake ModelProvider —
// and what lets the eval route (#499) be the second caller rather than a
// second pipeline.
//
// PURE by design: no `Env`, no Workers type, no fetch, so
// `tsconfig.test.json` compiles this file.

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
import type { AgentResult } from "../agent/loop";
import { bounceLogLine, proposalWasAddressed } from "../agent/pending-notice";
import type { AgentImage, HistoricalImages } from "../agent/provider-conversation";
import { routeRequest } from "../agent/routing";
import type { ModelTier } from "../agent/tiers";
import { resolveSignal, type GateVerdict } from "../gate/index";
import { ANTECEDENT_LIMIT, formatAntecedent, needsAntecedent } from "../slack/antecedent";
import {
  formatNotionUpdateProposal,
  formatProposal,
  proposalVerb,
  withOperationPlan,
} from "../slack/proposal-render";
import { renderDeliveredBody } from "../slack/render";
import type { AssistantContext } from "../slack/types";
import type { VisionReference } from "../slack/vision-reference";
import {
  MAX_HISTORY_TURNS,
  proposalOperations,
  type HistoryTurn,
  type PendingProposal,
  type ThreadRef,
  type ThreadState,
} from "../thread-state/index";
import {
  withWorkingSignal,
  type Delivery,
  type DeliveryFailureStage,
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

// ── The request ──────────────────────────────────────────────────────────────

/**
 * Where the turn is happening, as far as the turn's own decisions care.
 *
 * `assistant` is the app DM under agent_view — the surface that has a status
 * line, a titled thread and a streamed reply, which is why it does NOT also get
 * a 👀. A `channel` has none of those, so the reaction is the only
 * acknowledgement there is. The Worker draws no third distinction: an app DM and
 * the assistant panel are the same conversation (`isAssistantThread`).
 */
export type TurnSurface = "channel" | "assistant";

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
  | "failed";

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
  onInterim(text: string): void;
  /** The same clarify-vs-act check Turn runs after the loop returns, with this
   *  thread's PRD already bound, so the loop can put a refusal to the model as
   *  the call's own result instead of the person seeing the first one. */
  preflight?(toolName: string, input: Record<string, unknown>): Promise<{ ask: string } | null>;
}

/** What one agent turn reported back, beside its result. */
export interface TurnAgentRun {
  result: AgentResult;
  /** Read-only tools that ran. */
  tools: string[];
  references: string[];
  receipt?: HistoryTurn["retrieval"];
  /** Set only when a search this turn came back EMPTY. */
  absence?: AbsenceContext;
}

export interface TurnJudgement {
  text: string;
  verdict: string;
}

export interface TurnDeps {
  /** Per-thread memory. Turn reads the panel context and the outcome notes, and
   *  owns the history append and its compaction. */
  threadState: ThreadState;

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
   */
  applyVerdict(verdict: GateVerdict): Promise<void>;

  /** The card bodies that need a read of their own. */
  cards: {
    /** The `notion_update` diff: linked card, `current → new` per field. */
    notionUpdateBody(input: Record<string, unknown>): Promise<string>;
    /** The `notion_archive` target line: page title and parent database. */
    notionArchiveTargetNote(input: Record<string, unknown>): Promise<string | undefined>;
    /** The `prototype_scaffold` card, with a Figma preview when one renders. */
    implementDesignCard(
      input: Record<string, unknown>,
      requesterUserId: string,
      previewText?: string,
    ): Promise<ProposalCard>;
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

  /** Structured state + progressive summarisation (`CONTEXT_STATE`). Flagged
   *  off in production; see the header of `agent/context-state.ts`. */
  contextState?: boolean;

  now?(): number;
}

// ── The turn ─────────────────────────────────────────────────────────────────

/**
 * What the turn leaves the thread needing — the one place the mapping lives.
 *
 * `active` was honest for none of the three endings that genuinely wait on a
 * person, and a surface that claims a blocked thread is idle is how a staged
 * card sits unclicked: it says the agent is done and nothing says the person
 * is not (#575).
 *
 * Three of the six dispositions wait:
 *   - `staged` — a card is up behind ✅ / ⛔ and nothing happens until it is
 *     clicked.
 *   - `asked` — the turn asked a clarifying question instead of acting.
 *   - `answered` WITH a card still live in the thread. This is the case that
 *     makes the mapping a function of the thread and not of the disposition
 *     alone: ask something unrelated while a card is pending, and the turn
 *     ends perfectly well with the thread still blocked.
 *
 * The other three do not. `resolved` and `reacted` finished the job; `failed`
 * is the person choosing whether to retry, which is not the agent waiting on
 * an input it asked for. A turn that THREW never reaches here at all and its
 * default says the same thing (`withWorkingSignal`).
 *
 * The switch is exhaustive on purpose: a seventh disposition leaves it without
 * a return on that arm and `tsc` refuses the build, which is the only kind of
 * reminder that survives a year.
 */
export function settlementOf(settle: {
  disposition: TurnDisposition;
  /** Whether a proposal card in this thread is still awaiting a decision. */
  cardLive: boolean;
}): TurnSettlement {
  switch (settle.disposition) {
    case "staged":
    case "asked":
      return "waiting-on-person";
    case "answered":
      return settle.cardLive ? "waiting-on-person" : "idle";
    case "resolved":
    case "reacted":
    case "failed":
      return "idle";
  }
}

/**
 * One turn, with the working signal guaranteed down when it ends.
 *
 * The turn leaves by nine doors — an answer, a clarifying ask, a staged card,
 * a card Slack refused, four flavours of gate resolution, a dead model — and a
 * signal cleared at nine sites is a signal the tenth door forgets. So the set
 * stays where it belongs (beside the work it describes) and the clear is a
 * `finally` around the whole thing: `withWorkingSignal` watches the Delivery
 * the turn is handed and takes down whatever the turn raised, whichever door
 * it left by.
 */
export async function runTurn(request: TurnRequest, deps: TurnDeps): Promise<TurnOutcome> {
  // The card the thread was holding when this turn began. It is still holding
  // it at an `answered` exit, because every exit that retires a card reports a
  // different disposition — a claim is `resolved`, a revision is `staged` (the
  // store retires the predecessor in the same reply thread, #579). So this is
  // the live-card fact the mapping needs, and it costs no second read: the
  // adapter's `getProposalByThread` at the top of the request is where it came
  // from.
  const cardLive = Boolean(request.pending);
  return withWorkingSignal(
    deps.delivery,
    (delivery) => turnBody(request, { ...deps, delivery }),
    (outcome) => settlementOf({ disposition: outcome.disposition, cardLive }),
  );
}

async function turnBody(request: TurnRequest, deps: TurnDeps): Promise<TurnOutcome> {
  const { delivery, threadState } = deps;
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
  if (request.pending) {
    const verdict = await resolveSignal(
      {
        kind: "typed",
        channel: request.channel,
        thread: request.conversationTs,
        text: request.text,
        userId: request.userId,
      },
      { threadState },
    );
    // A verdict with no decision means the message was not a gate emoji — it
    // is language, and language goes to the model. Anything else the gate has
    // already settled, win or lost race.
    if (verdict.decision) {
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
  if (!trivial) await delivery.beginProgress(PROGRESS_LABEL);

  // Interim updates: long runs are legal (streaming plus MCP can take several
  // minutes). Two complementary signals — the model's own between-tool
  // narration as it works, and a generic note that backstops runs which have
  // produced none yet.
  let interimPosted = false;
  const postInterim = (text: string): void => {
    interimPosted = true;
    interimCount++;
    delivery.postInterim(text);
  };
  const backstopAt = Math.abs(
    parseInt(request.userMsgTs.replace(".", "").slice(-6), 10) || 0,
  ) % BACKSTOP_LINES.length;
  const backstop = setTimeout(() => {
    if (interimPosted) return;
    postInterim(BACKSTOP_LINES[backstopAt] ?? BACKSTOP_LINES[0]!);
  }, INTERIM_BACKSTOP_MS);

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
      onInterim: postInterim,
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
    });
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
      },
      { threadState },
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
      },
      { threadState },
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
        `:leftwards_arrow_with_hook: You cancelled that ${proposalVerb(result.toolName)} a moment ago, so I'm not re-proposing it on my own. ` +
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

  // A different proposal is already pending: supersede it. Only the record's
  // removal is wanted here — the claim boolean belongs to the resolver, which
  // is the path that must not double-execute.
  if (request.pending) await threadState.claimProposal(request.pending.proposalTs);

  const { card, planFollowUp } = await buildCard(
    result,
    request,
    deps,
    implementPrdUrlFor(result.toolName, result.input, prd),
  );
  // Before the card, never after: the card holds the ✅/⛔ buttons, so it has to
  // be the last message in the thread — a plan posted under it would leave the
  // decision above the thing being decided.
  for (const message of planFollowUp) await delivery.postNote(message);
  const posted = await delivery.stageProposal(card);
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
    proposalText: card.text,
    requesterUserId: request.userId,
    ...(prd?.id ? { notionPrdId: prd.id } : {}),
    ...(prd?.url ? { notionPrdUrl: prd.url } : {}),
  };
  await threadState.putProposal(proposal);
  // A proposal is still a completed conversational turn. An agent_view DM has
  // no Slack thread to rebuild, so preserving this exchange in the store is the
  // only way its image pointer reaches the immediate follow-up.
  await memory.remember(card.text);

  return {
    disposition: "staged",
    posted: card.text,
    staged: { proposal, card },
    wrote: memory.wrote(),
    telemetry,
  };
}

// ── The gate path ────────────────────────────────────────────────────────────

/**
 * Apply one Gate verdict, and be the turn's outcome.
 *
 * Both of the turn's gate doors — the typed emoji and the model's own
 * `proposal_resolve` — end here, which is what makes a lost race read the same
 * on each: the verdict's own text is posted, `applyVerdict` executes nothing
 * unless the claim was won, and the record says what the person was told.
 *
 * `note` is what the RECORD should say when that differs from what was posted
 * ("(confirmed — executing the proposal)" beside "Got it — kicking that
 * off."), and it applies only to a verdict that won: on a lost race the
 * conversation should remember what the person actually read.
 */
async function settleVerdict(
  verdict: GateVerdict,
  ctx: { deps: TurnDeps; memory: ThreadMemory; telemetry: TurnTelemetry; note?: string },
): Promise<TurnOutcome> {
  const posted = verdict.post?.text;
  if (posted) await ctx.deps.delivery.postNote(posted);
  await ctx.deps.applyVerdict(verdict);
  const remembered = (verdict.outcome === "won" ? ctx.note : undefined) ?? posted;
  if (remembered) await ctx.memory.remember(remembered);
  return {
    disposition: "resolved",
    ...(posted ? { posted } : {}),
    wrote: ctx.memory.wrote(),
    telemetry: ctx.telemetry,
  };
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
    verdict = judgeConfidence(renderDeliveredBody(draft), { retrievalRan, servedFromCache });
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
      if (judgeAbsence(renderDeliveredBody(draft)) === "unscoped") {
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
  });
  telemetry.judge = reviewed.verdict;

  // Re-validation, not a second repair round. A judge revision can itself end
  // in a trailing label, which the strip then DELETES without putting anything
  // back — turning "wrong shape" into "no signal at all" in the one reply we
  // had already noticed was wrong. Logged so that outcome is countable; looping
  // here would cost another model call per turn and could land in the same
  // place anyway.
  try {
    const finalVerdict = judgeConfidence(renderDeliveredBody(reviewed.text), {
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

  const posted = await delivery.postAnswer(reviewed.text);

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
 * The card for one staged Proposal — the batch, as the person reads it before
 * pressing ✅ — and, where the batch is too big for one message, the follow-up
 * that carries the full plan.
 *
 * The card is the SOURCE OF TRUTH for what a ✅ runs: it gets the first
 * operation's real body and then every operation of the batch, grouped by what
 * it touches and labelled by kind. Nothing is summarised away — past Slack's
 * limits the groups collapse and the complete list moves to `followUp`, which
 * the caller posts BEFORE the card so the buttons stay last.
 */
async function buildCard(
  result: Extract<AgentResult, { kind: "proposal" }>,
  request: TurnRequest,
  deps: TurnDeps,
  implementPrdUrl: string | undefined,
): Promise<{ card: ProposalCard; planFollowUp: string[] }> {
  const card = await buildFirstOperationCard(result, request, deps, implementPrdUrl);
  const plan = withOperationPlan(card.text, result.operations);
  return { card: { ...card, text: plan.text }, planFollowUp: plan.followUp ?? [] };
}

/** The card body for the batch's FIRST operation — which per-tool formatter it
 *  gets is the turn's decision, and the two bodies that need a Notion read and
 *  the one that needs a Figma render arrive as named clients. */
async function buildFirstOperationCard(
  result: Extract<AgentResult, { kind: "proposal" }>,
  request: TurnRequest,
  deps: TurnDeps,
  implementPrdUrl: string | undefined,
): Promise<ProposalCard> {
  if (result.toolName === "prototype_scaffold") {
    return deps.cards.implementDesignCard(result.input, request.userId, result.previewText);
  }
  if (result.toolName === "component_implement") {
    // Show which PRD this implement is tied to, so the requester can see it.
    const preview = implementPrdUrl
      ? `Using the PRD for this change: ${implementPrdUrl}`
      : result.previewText;
    return { text: formatProposal(result.toolName, result.input, request.userId, preview) };
  }
  if (result.toolName === "notion_update") {
    // Conversational card: warm lead, linked card, `current → new` diff. No ⚠️
    // preamble — the lead, the named card and the diff speak for themselves.
    const body = await deps.cards.notionUpdateBody(result.input);
    return { text: formatNotionUpdateProposal(result.previewText, body) };
  }
  if (result.toolName === "notion_archive") {
    const targetNote = await deps.cards.notionArchiveTargetNote(result.input);
    return {
      text: formatProposal(
        result.toolName,
        result.input,
        request.userId,
        result.previewText,
        targetNote,
      ),
    };
  }
  return {
    text: formatProposal(result.toolName, result.input, request.userId, result.previewText),
  };
}

// ── Small pure helpers ───────────────────────────────────────────────────────

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
