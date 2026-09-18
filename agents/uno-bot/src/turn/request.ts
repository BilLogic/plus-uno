// One request builder, for every caller of Turn (#603).
//
// A caller knows envelope FACTS — who, where, what was said, what came with it,
// what the conversation already holds. It should not also have to know the
// turn's own conventions about them: which surface a channel id means, that an
// absent history is the empty one, that an optional field is ABSENT rather than
// `undefined` when it has nothing to say. Those rules live here, once, so the
// two adapters cannot each keep their own copy of them and drift.
//
// WHY ABSENT RATHER THAN EMPTY. `TurnRequest`'s optional fields are read with a
// fallback (`attachmentsText ?? text`, `currentCanvasIds?.length`), so an empty
// string, an empty array and an absent field all mean the same thing to the
// turn — but they are three different objects to a test comparing two requests.
// Normalising here is what lets the parity test compare the Slack builder's
// request to the eval builder's field for field and mean it.
//
// PURE, like the rest of the module: no `Env`, no fetch, no Slack client.

import type { AgentImage, HistoricalImages } from "../agent/provider-conversation";
import type { ModelTier } from "../agent/routing";
import type { HistoryTurn, PendingProposal, VisionReference } from "../thread-state/index";
import type { TurnRequest, TurnSurface } from "./turn";

/**
 * The envelope facts a caller resolves, before any of the turn's conventions
 * are applied to them.
 *
 * Every field the turn reads with a fallback is optional here; the required
 * ones are the facts no caller can be without.
 */
export interface TurnFacts {
  userId: string;
  channel: string;
  conversationTs: string;
  replyTs?: string;
  userMsgTs: string;
  threaded: boolean;
  text: string;
  /** The body including attachment lines, when it differs from `text`. */
  attachmentsText?: string;
  scopeInstruction?: string;
  images?: AgentImage[];
  historicalImages?: HistoricalImages;
  visionNotes?: string[];
  visionMarkers?: string[];
  visionReference?: VisionReference;
  history?: HistoryTurn[];
  pending?: PendingProposal | null;
  currentCanvasIds?: string[];
  sharedCanvasIds?: string[];
  prd?: { id?: string; url?: string } | null;
  tierOverride?: ModelTier;
  actionToken?: string;
}

/**
 * Which surface a channel id is.
 *
 * THE ONE STATEMENT OF THE RULE, and since #595 the only one: an app DM (`D…`)
 * is the assistant surface, everything else is a channel — and an app DM and
 * the assistant panel are the same conversation.
 *
 * Every reader reads it from here rather than testing the prefix itself. There
 * were five that did: the Slack Delivery adapter's title gate
 * (`slack/delivery-adapter.ts` § `isAssistantThread`), the stop control's key
 * and card resolution (`slack/session-stop.ts`), which channels the event
 * envelope engages on at all (`slack/events.ts`), the ADR-020 own-visibility
 * search gate (`tools/slack-search.ts`) and the cancel-key fallback
 * (`agent/run-agent.ts`). A rule with one statement and five copies is a rule
 * that can be changed in one place and still be wrong in five.
 */
export function turnSurfaceOf(channel: string): TurnSurface {
  return channel.startsWith("D") ? "assistant" : "channel";
}

/** Envelope facts, as the request a turn takes. */
export function buildTurnRequest(facts: TurnFacts): TurnRequest {
  const attachmentsText =
    facts.attachmentsText && facts.attachmentsText !== facts.text ? facts.attachmentsText : undefined;

  return {
    userId: facts.userId,
    channel: facts.channel,
    conversationTs: facts.conversationTs,
    ...(facts.replyTs ? { replyTs: facts.replyTs } : {}),
    userMsgTs: facts.userMsgTs,
    surface: turnSurfaceOf(facts.channel),
    threaded: facts.threaded,
    text: facts.text,
    ...(attachmentsText ? { attachmentsText } : {}),
    ...(facts.scopeInstruction ? { scopeInstruction: facts.scopeInstruction } : {}),
    images: facts.images ?? [],
    ...(facts.historicalImages ? { historicalImages: facts.historicalImages } : {}),
    ...(facts.visionNotes?.length ? { visionNotes: facts.visionNotes } : {}),
    ...(facts.visionMarkers?.length ? { visionMarkers: facts.visionMarkers } : {}),
    ...(facts.visionReference ? { visionReference: facts.visionReference } : {}),
    history: facts.history ?? [],
    pending: facts.pending ?? null,
    ...(facts.currentCanvasIds?.length ? { currentCanvasIds: facts.currentCanvasIds } : {}),
    ...(facts.sharedCanvasIds?.length ? { sharedCanvasIds: facts.sharedCanvasIds } : {}),
    prd: facts.prd ?? null,
    ...(facts.tierOverride ? { tierOverride: facts.tierOverride } : {}),
    ...(facts.actionToken ? { actionToken: facts.actionToken } : {}),
  };
}
