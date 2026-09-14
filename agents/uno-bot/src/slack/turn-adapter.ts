// The Slack envelope adapter: a Slack message event becomes a `TurnRequest`,
// `Env` becomes `TurnDeps`, and `runTurn` does the rest.
//
// This is what is left of a 716-line `handleUserMessage`. Everything it used to
// decide — routing, the model's context, the judges, the cards, the history —
// is `turn/turn.ts` now; everything it used to reach for directly is a port or
// a named client built here. What genuinely belongs to the envelope stays:
// resolving file uploads to image BYTES (Turn is handed inputs and never
// fetches), reading the Slack thread the bot's memory is rebuilt from, and the
// two ts values a Slack conversation carries (`slack/events.ts`).
//
// `Env` enters here and stops here.

import { buildProviderConversation } from "../agent/provider-conversation";
import { preflight } from "../agent/preflight";
import { executeVerdict } from "../agent/resolve-proposal";
import { reviewDraft } from "../agent/draft-judge";
import { runAgent, withTurnScope } from "../agent/run-agent";
import { parseScope } from "../agent/scope-keywords";
import { threadStateFor } from "../thread-state/production";
import type { HistoryTurn, PendingProposal } from "../thread-state/index";
import type { Env } from "../types";
import { runTurn, type TurnDeps, type TurnOutcome, type TurnRequest } from "../turn/index";
import { conversationsHistoryBefore } from "./api";
import { formatAssistantContext, isAssistantThread } from "./assistant";
import {
  canvasIdsSharedByMessage,
  canvasIdsSharedIntoConversation,
  messageTextWithCanvasAttachments,
} from "./canvas-reference";
import { buildNotionArchiveTargetNote, buildNotionUpdateBody } from "./notion-card";
import { buildImplementDesignProposal } from "./proposal-figma";
import { slackDelivery } from "./slack-delivery";
import type { SlackMessageEvent } from "./types";
import { collectVisionInputs } from "./vision";
import { selectPreviousVisionReference } from "./vision-reference";

/** What the envelope already worked out, and Turn should not work out again. */
export interface TurnEnvelope {
  /** The conversation key — a DM's whole channel, or a thread root. */
  conversationTs: string;
  /** A real ts to reply under, or undefined for channel-level. */
  replyTs?: string;
  /** The message text with bot mentions stripped. */
  text: string;
  /** The conversation as the bot remembers it, rebuilt from the Slack thread. */
  history: HistoryTurn[];
  /** The proposal staged in this conversation, if one is awaiting a decision. */
  pending: PendingProposal | null;
  /** The Notion PRD carried on the thread root, if any. */
  prd: { id?: string; url?: string } | null;
}

/**
 * One Slack user message, as a turn.
 *
 * The envelope facts it takes (the two ts values, the history, the pending
 * proposal, the PRD) are resolved by the caller, which owns the run lease and
 * the fail-visibly wrapper around all of it.
 */
export async function runSlackTurn(
  env: Env,
  event: SlackMessageEvent,
  envelope: TurnEnvelope,
): Promise<TurnOutcome> {
  const channel = event.channel;
  const userId = event.user!;

  // A leading scope keyword (`ds:`, `notion:`) — the asker saying where they
  // already know the answer lives. Stripped from the question and turned into
  // an instruction, so the model reads a clean question plus a hint about where
  // to start rather than a question with a prefix bolted on.
  const scoped = parseScope(envelope.text);
  const text = scoped ? scoped.text : envelope.text;
  if (scoped) console.log(`[scope] ${scoped.scope.name}`);

  const attachmentsText = messageTextWithCanvasAttachments(text, event.files);

  // Vision: pasted images and a linked Figma frame become image BYTES on this
  // turn. Guarded inside — a failure degrades to text-only — and skipped
  // entirely when the message carries nothing visual, which is every turn where
  // the collection would have fetched nothing anyway. A figma.com link counts:
  // the pass screenshots frames from TEXT, not just from files.
  const carriesFiles =
    (event.files?.length ?? 0) > 0 ||
    /figma\.com/i.test(text) ||
    Boolean(selectPreviousVisionReference(envelope.history, false));
  const vision = carriesFiles
    ? await collectVisionInputs(env, event, attachmentsText, envelope.history)
    : { images: [], notes: [], markers: [] };

  const request: TurnRequest = {
    userId,
    channel,
    conversationTs: envelope.conversationTs,
    ...(envelope.replyTs ? { replyTs: envelope.replyTs } : {}),
    userMsgTs: event.ts,
    surface: isAssistantThread(channel) ? "assistant" : "channel",
    threaded: Boolean(event.thread_ts),
    text,
    attachmentsText,
    ...(scoped ? { scopeInstruction: scoped.scope.instruction } : {}),
    images: vision.images,
    ...("historicalImages" in vision && vision.historicalImages
      ? { historicalImages: vision.historicalImages }
      : {}),
    ...(vision.notes.length ? { visionNotes: vision.notes } : {}),
    ...(vision.markers.length ? { visionMarkers: vision.markers } : {}),
    ...("reference" in vision && vision.reference ? { visionReference: vision.reference } : {}),
    history: envelope.history,
    pending: envelope.pending,
    currentCanvasIds: canvasIdsSharedByMessage(text, event.files),
    sharedCanvasIds: canvasIdsSharedIntoConversation(text, event.files, envelope.history),
    prd: envelope.prd,
    ...(event.tierOverride ? { tierOverride: event.tierOverride } : {}),
    ...(event.action_token ? { actionToken: event.action_token } : {}),
  };

  return runTurn(request, turnDeps(env, event, request, envelope));
}

/**
 * `Env`, once, as the dependencies a turn actually reads.
 *
 * Every entry is either a port with two adapters (the thread store, Delivery)
 * or one named client. The turn never sees the 58-field `Env`, which is what
 * lets a test build a recording Delivery, an in-memory store and a fake model
 * and nothing else.
 */
function turnDeps(
  env: Env,
  event: SlackMessageEvent,
  request: TurnRequest,
  envelope: TurnEnvelope,
): TurnDeps {
  // The tool-side Slack context: where a tool's own posts go, which
  // conversation `/stop` is keyed on, and the per-event facts a tool may use.
  const slack = {
    channel: request.channel,
    // A real ts, not the conversation key: tool-side posts still thread off the
    // user's message.
    threadTs: event.thread_ts ?? event.ts,
    // …and the conversation key separately, because that is what cancel reads.
    conversationTs: request.conversationTs,
    userMsgTs: request.userMsgTs,
    requestedBy: request.userId,
    // Bot-token search needs the triggering event's action_token; it exists
    // only for this turn, so it rides the context rather than any store.
    ...(event.action_token ? { actionToken: event.action_token } : {}),
    sharedCanvasIds: request.sharedCanvasIds ?? [],
    ...(envelope.prd?.id ? { notionPrdId: envelope.prd.id } : {}),
    ...(envelope.prd?.url ? { notionPrdUrl: envelope.prd.url } : {}),
  };

  return {
    threadState: threadStateFor(env),

    delivery: slackDelivery(env, {
      channel: request.channel,
      ...(request.replyTs ? { replyTs: request.replyTs } : {}),
      userMsgTs: request.userMsgTs,
      userId: request.userId,
      ...(event.team ? { team: event.team } : {}),
      ...(event.footerHint ? { footerHint: event.footerHint } : {}),
    }),

    async runAgent(req) {
      // The per-turn scope the tool ledger, the retrieval receipt and the
      // absence signal cross on — read several frames above the loop, which is
      // why it is a scope rather than a return value (`agent/run-agent.ts`).
      const run = await withTurnScope({ correction: req.correction }, () =>
        runAgent({
          env,
          // Routing already happened, in Turn: the tier travels as an opaque
          // name so nothing routes a second time on a different string.
          tier: req.tier,
          routeReason: req.routeReason,
          userText: req.userText,
          ...(event.tierOverride ? { tierOverride: event.tierOverride } : {}),
          ...(req.images?.length ? { images: req.images } : {}),
          history: req.history,
          conversation: buildProviderConversation(
            req.history,
            req.userText,
            req.images ?? [],
            req.historicalImages,
          ),
          slack,
          currentSender: req.currentSender,
          pending: req.pending,
          ...(req.assistantContext ? { assistantContext: req.assistantContext } : {}),
          onInterim: req.onInterim,
        }),
      );
      return {
        result: run.result,
        tools: run.tools,
        references: run.references,
        ...(run.receipt ? { receipt: run.receipt } : {}),
        ...(run.absence ? { absence: run.absence } : {}),
      };
    },

    reviewDraft: (args) => reviewDraft(env, args),

    preflight: (toolName, input, ctx) =>
      preflight(toolName, input, {
        env,
        prd: ctx.prd,
        ...(ctx.implementPrdUrl ? { implementPrdUrl: ctx.implementPrdUrl } : {}),
      }),

    applyVerdict: (verdict) => executeVerdict(env, verdict),

    cards: {
      notionUpdateBody: (input) => buildNotionUpdateBody(env, input),
      notionArchiveTargetNote: (input) => buildNotionArchiveTargetNote(env, input),
      implementDesignCard: (input, requesterUserId, previewText) =>
        buildImplementDesignProposal(env, input, requesterUserId, previewText),
    },

    async readAntecedent(channel, beforeTs, limit) {
      const before = await conversationsHistoryBefore(env, channel, beforeTs, limit);
      return before
        .filter((m) => !m.subtype && (m.text ?? "").trim())
        .map((m) => ({ author: m.user ? `<@${m.user}>` : "someone", text: m.text ?? "" }));
    },

    describeAssistantContext: (context) => formatAssistantContext(context),

    // Phase 5 — structured state, drift detection and progressive
    // summarisation. FLAGGED OFF by default; see the header of
    // `agent/context-state.ts` for why this one does not get to ship on.
    contextState: env.CONTEXT_STATE === "on",
  };
}
