// A Slack message event, as a `TurnRequest` — the pure half of the Slack
// envelope adapter (#603).
//
// TWO HALVES, and this is the one that fetches nothing: the event and the
// envelope facts become a request here, through the shared request builder
// (`turn/request.ts`). The `Env` half — the vision pass that downloads image
// bytes, the thread read, the dependencies — is `slack/turn-adapter.ts`, which
// this file knows nothing about.
//
// That split is what lets the parity test drive the REAL Slack request builder
// beside the real eval one (`eval/turn-case.ts`, the same split from the other
// side) in the Workers-global-free compile, instead of comparing one builder to
// a hand-written copy of it that can quietly stop matching.

import { parseScope, type ScopedRequest } from "../agent/scope-keywords";
import { buildTurnRequest, type TurnRequest } from "../turn/index";
import type { HistoryTurn, PendingProposal } from "../thread-state/index";
import {
  canvasIdsSharedByMessage,
  canvasIdsSharedIntoConversation,
  messageTextWithCanvasAttachments,
} from "./canvas-reference";
import type { SlackMessageEvent } from "./types";
import type { VisionInputs } from "./vision";

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

/** Nothing visual arrived, so the vision pass never ran. A fresh object each
 *  time: the empty arrays travel onto the request, and no two turns should
 *  share one. */
export function noVision(): VisionInputs {
  return { images: [], notes: [], markers: [] };
}

/** What the message says, once the envelope's two readings of it are applied. */
export interface SlackMessageText {
  /** The question, a leading scope keyword stripped. */
  text: string;
  /** `text` plus a line per non-image attachment — a shared canvas, say. */
  attachmentsText: string;
  /** The scope keyword the asker led with, if any. */
  scoped: ScopedRequest | null;
}

/**
 * The message, read once.
 *
 * A leading scope keyword (`ds:`, `notion:`) is the asker saying where they
 * already know the answer lives: stripped from the question and turned into an
 * instruction, so the model reads a clean question plus a hint about where to
 * start rather than a question with a prefix bolted on.
 *
 * The adapter needs this BEFORE the request, because the vision pass reads the
 * attachment body — so both it and `slackTurnRequest` read it from here rather
 * than each applying the two rules again.
 */
export function slackMessageText(
  event: SlackMessageEvent,
  envelope: Pick<TurnEnvelope, "text">,
): SlackMessageText {
  const scoped = parseScope(envelope.text);
  const text = scoped ? scoped.text : envelope.text;
  return { text, attachmentsText: messageTextWithCanvasAttachments(text, event.files), scoped };
}

/**
 * One Slack message event, as the request a turn takes.
 *
 * The envelope facts (the two ts values, the history, the pending proposal, the
 * PRD) are the caller's; the image BYTES are the caller's too, because Turn is
 * handed inputs and never fetches. What is decided here is what belongs to the
 * envelope: the leading scope keyword, the attachment lines, and which canvases
 * this message and this conversation have shared.
 */
export function slackTurnRequest(
  event: SlackMessageEvent,
  envelope: TurnEnvelope,
  vision: VisionInputs = noVision(),
): TurnRequest {
  const { text, attachmentsText, scoped } = slackMessageText(event, envelope);

  return buildTurnRequest({
    userId: event.user!,
    channel: event.channel,
    conversationTs: envelope.conversationTs,
    ...(envelope.replyTs ? { replyTs: envelope.replyTs } : {}),
    userMsgTs: event.ts,
    threaded: Boolean(event.thread_ts),
    text,
    attachmentsText,
    ...(scoped ? { scopeInstruction: scoped.scope.instruction } : {}),
    images: vision.images,
    ...(vision.historicalImages ? { historicalImages: vision.historicalImages } : {}),
    visionNotes: vision.notes,
    visionMarkers: vision.markers,
    ...(vision.reference ? { visionReference: vision.reference } : {}),
    history: envelope.history,
    pending: envelope.pending,
    currentCanvasIds: canvasIdsSharedByMessage(text, event.files),
    sharedCanvasIds: canvasIdsSharedIntoConversation(text, event.files, envelope.history),
    prd: envelope.prd,
    ...(event.tierOverride ? { tierOverride: event.tierOverride } : {}),
    ...(event.action_token ? { actionToken: event.action_token } : {}),
  });
}

/** Whether this message carries anything the vision pass could attach — the one
 *  question that decides if the (fetching) pass runs at all. A figma.com link
 *  counts: the pass screenshots frames from TEXT, not just from files. */
export function carriesVision(event: SlackMessageEvent, text: string, hasReference: boolean): boolean {
  return (event.files?.length ?? 0) > 0 || /figma\.com/i.test(text) || hasReference;
}
