// Slack interactivity endpoint — block_actions, shortcuts, view submissions.
//
// WHY THIS EXISTS
// ---------------
// The app has had `interactivity.is_enabled: true` pointing at
// https://plus-uno.netlify.app/.netlify/functions/slack-interactivity since
// before this Worker owned the Slack surface. That function does not exist —
// confirmed 404 — and no netlify.toml redirect reaches one. It went unnoticed
// because nothing dispatched: every Block Kit button in App Home is a plain
// `url` button with no action_id, so Slack had nothing to deliver.
//
// That made it dead config rather than a live break, right up until the moment
// someone shipped an action button. This route is what makes shipping one safe.
//
// SHAPE
// -----
// Slack posts `payload=<url-encoded JSON>` as a form body and expects a 200
// within 3 seconds. Same raw-bytes signature rule as /slack/events — the
// signature covers the exact body, and the scheme is body-agnostic.
//
// Anything slower than the ack goes through `response_url` (valid 30 min, 5
// uses) or a normal chat.postMessage, never by holding the response open.

import type { Env } from "../types";
import { runMessageShortcut } from "./shortcuts";
import { threadStateFor } from "../thread-state/production";
import { PREVIEW_UNDER_WAIT_UNTIL, restageFor } from "../turn/env-deps";
import { conversationsOpen, deleteMessage, postMessage, postToResponseUrl, updateMessage, viewsOpen, viewsPush, viewsUpdate } from "./api";
import { executeVerdict, runVerdict } from "../agent/resolve-proposal";
import { REVIEW_ACTION_ID } from "./proposal-render";
import { DECISION_REVIEW_ACTION_PREFIX, reviewPressOf } from "./decision-cards";
import {
  NEEDS_CHANGES_LEAD,
  runReviewDecision,
  runReviewOpen,
  runReviewPush,
  saveReviewEdits,
  startRevision,
  type ReviewDoorDeps,
  type ReviewViewState,
} from "./review-door";
import {
  REVIEW_CALLBACK_ID,
  REVIEW_EDIT_ACTION_ID,
  REVIEW_EDIT_CALLBACK_ID,
  draftSubmitOf,
  noticeView,
  reviewedCardOf,
} from "./review-view";
import type { OptionSource } from "./review-fields";
import { databaseOptions } from "../integrations/notion";
import { proposalReplyThread, type PendingProposal } from "../thread-state/index";
import { conversationKey, enqueueAgentJob, replyHandlerAt } from "./events";
import type { SlackMessageEvent } from "./types";
import { isPrecedenceCard } from "../ds-precedence/dispute";
import { disputeOnEnv } from "../tools/ds-precedence-intake";
import { runHomeStopDoor, type HomeStopDoorDeps } from "./stop-doors";
import { slackDelivery } from "./slack-delivery";
import { standingConfirmersOf } from "./standing-confirmers";
import { runButtonDoor, type ButtonDoorDeps, type CardMessage } from "./button-door";
import { DM_WATCH_ACTION_ID, saveDmWatchAction } from "../dm-watch/index";
import { setDmWatchOnEnv } from "../dm-watch/env";
import { publishHomeView } from "./home";
import { TRY_ASKING_ACTION_PREFIX, runTryAskingDoor } from "./try-asking";
import { runTryAgainDoor } from "./try-again";
import { TRY_AGAIN_ACTION_ID } from "./failure-message";
import { handleReminderButton } from "./gate";
import { REMINDER_ACTION_PREFIX, type ReminderOutcome } from "../commitments/copy";
import { tapReply } from "../commitments/press";
import { FEEDBACK_ACTION_ID, FEEDBACK_VIEW_CALLBACK_ID, feedbackAckFor, type FeedbackViewState } from "./feedback";
import { runFeedbackReason, runFeedbackTap, type FeedbackDoorDeps } from "./feedback-door";
import { answerFeedbackLogFor } from "../usage/feedback-env";

/** The subset of Slack's interaction envelope this Worker acts on. */
interface InteractionPayload {
  type: string;
  response_url?: string;
  user?: { id?: string };
  channel?: { id?: string };
  message?: { ts?: string; thread_ts?: string; text?: string };
  actions?: Array<{ action_id?: string; value?: string; selected_options?: { value?: string }[] }>;
  callback_id?: string;
  /** A click's one-use, three-second key to `views.open`. */
  trigger_id?: string;
  /** Set when the click was inside a modal rather than on a message, and on a
   *  modal's submit. `state.values` holds its inputs as the person left them. */
  view?: {
    id?: string;
    /** The first view in a stack: the draft, under a view pushed over it. */
    root_view_id?: string;
    private_metadata?: string;
    callback_id?: string;
    state?: { values?: ReviewViewState };
  } & Record<
    string,
    unknown
  >;
}

export function parseInteraction(rawBody: string): InteractionPayload | null {
  const encoded = new URLSearchParams(rawBody).get("payload");
  if (!encoded) return null;
  try {
    return JSON.parse(encoded) as InteractionPayload;
  } catch {
    return null;
  }
}

/**
 * Handle one interaction. Returns the body to ack with.
 *
 * Unknown interaction types ack 200 and log rather than erroring: Slack retries
 * a non-2xx, and an unrecognised payload is a deploy-order problem (manifest
 * ahead of Worker), not something a retry fixes.
 */
export function handleInteraction(
  env: Env,
  payload: InteractionPayload,
  ctx: ExecutionContext,
): Response | Promise<Response> {
  switch (payload.type) {
    // Message shortcut — the context-menu entry on a message. Slack wants a 200
    // within 3000ms and does not retry a timeout, so every slow step (permalink,
    // conversations.open, the anchor post, the enqueue) runs after the ack.
    case "message_action": {
      const callbackId = payload.callback_id ?? "";
      const userId = payload.user?.id;
      const channelId = payload.channel?.id;
      const messageTs = payload.message?.ts;
      if (!callbackId || !userId || !channelId || !messageTs) {
        console.error(`[interactive] message_action missing fields (${callbackId || "no callback_id"})`);
        return new Response("", { status: 200 });
      }
      console.log(`[shortcut] ${callbackId} from ${userId} on ${channelId}/${messageTs}`);
      ctx.waitUntil(runMessageShortcut(env, { callbackId, userId, channelId, messageTs }));
      return new Response("", { status: 200 });
    }
    case "block_actions": {
      const actionId = payload.actions?.[0]?.action_id ?? "(none)";
      // Slack sends an interaction for URL buttons too, when they carry an
      // action_id. Those are navigation, already handled by the browser — ack
      // and do nothing rather than treating them as commands.
      console.log(`[interactive] block_actions ${actionId} from ${payload.user?.id ?? "?"}`);
      ctx.waitUntil(dispatchAction(env, actionId, payload).catch((err) => {
        console.error(`[interactive] ${actionId} failed: ${err instanceof Error ? err.message : String(err)}`);
      }));
      return new Response("", { status: 200 });
    }
    // A modal sent: one of the Review pop-up's views, or the feedback pop-up.
    // Each is answered in the ack itself, inside Slack's three seconds, and
    // anything slower runs after it.
    case "view_submission": {
      const callbackId = payload.view?.callback_id;
      if (callbackId === FEEDBACK_VIEW_CALLBACK_ID && payload.user?.id) {
        const view = payload.view as FeedbackViewState;
        const userId = payload.user.id;
        const ack = feedbackAckFor(view);
        ctx.waitUntil(runFeedbackReason({ userId, view }, feedbackDoorDeps(env)).catch((err) => {
          console.error(`[interactive] feedback reason failed: ${err instanceof Error ? err.message : String(err)}`);
        }));
        return ack ? Response.json(ack) : new Response("", { status: 200 });
      }
      return submitReview(env, payload, ctx);
    }
    default:
      console.log(`[interactive] unhandled type: ${payload.type}`);
      return new Response("", { status: 200 });
  }
}

/** One place that says which action_id does what. An action rendered anywhere
 *  — the Home tab, an answer footer, a proposal card — must appear here, or
 *  clicking it is a no-op that logs nothing anyone will read. */
async function dispatchAction(env: Env, actionId: string, payload: InteractionPayload): Promise<void> {
  if (actionId === "uno_stop_run") return stopRun(env, payload);
  if (actionId.startsWith(TRY_ASKING_ACTION_PREFIX)) return tryAsking(env, payload);
  if (actionId === TRY_AGAIN_ACTION_ID) return tryAgain(env, payload);
  if (actionId === "uno_delete_answer") return deleteAnswer(env, payload);
  if (actionId === "uno_proposal_confirm") return resolveFromButton(env, payload, "confirm");
  if (actionId === "uno_proposal_cancel") return resolveFromButton(env, payload, "cancel");
  if (actionId === REVIEW_ACTION_ID) return openReview(env, payload);
  if (actionId.startsWith(DECISION_REVIEW_ACTION_PREFIX)) return openReview(env, payload, actionId);
  if (actionId === REVIEW_EDIT_ACTION_ID) return editInReview(env, payload);
  if (actionId === DM_WATCH_ACTION_ID) return saveDmWatch(env, payload);
  if (actionId === FEEDBACK_ACTION_ID) return feedbackFromButton(env, payload);
  if (actionId.startsWith(REMINDER_ACTION_PREFIX)) return answerFromButton(env, payload, actionId);
  // No silent catch-all. This used to fall through to the feedback handler,
  // which meant an action_id nobody had wired reached a function that ignored
  // it — a dead button that looked alive. Say so in the log instead.
  console.warn(`[interactive] no handler for action_id=${actionId}`);
}

// A button under a reminder (commitment, card follow-up, DM ask). It is the
// reaction it is labelled with, tapped: the action id carries the glyph's Slack
// name, and the reminder doors do the rest (`handleReminderButton`). A tap
// that changed nothing tells the tapper why, to them alone: a button that
// does nothing reads as broken.
async function answerFromButton(env: Env, payload: InteractionPayload, actionId: string): Promise<void> {
  const channel = payload.channel?.id;
  const messageTs = payload.message?.ts;
  const userId = payload.user?.id;
  const glyph = payload.actions?.[0]?.value || actionId.slice(REMINDER_ACTION_PREFIX.length);
  if (!channel || !messageTs || !userId || !glyph) return;
  let outcome: ReminderOutcome | "error";
  try {
    outcome = await handleReminderButton(env, { channel, messageTs, glyph, userId });
  } catch (err) {
    // A budget stop included: the tapper hears it failed, not that it was ignored.
    console.error(`[interactive] reminder ${glyph} on ${channel}/${messageTs} failed: ${err instanceof Error ? err.message : String(err)}`);
    outcome = "error";
  }
  const line = tapReply(outcome);
  console.log(`[interactive] reminder ${glyph} on ${channel}/${messageTs} by=${userId} outcome=${JSON.stringify(outcome)}`);
  if (line) await replyEphemeral(payload, line);
}

// ✅ Approve / ⛔ Cancel on a proposal card (2026-08-22).
//
// The Slack envelope for the button door: a button payload becomes a press,
// `Env` becomes the door's named dependencies, and `runButtonDoor` does the
// rest (`button-door.ts`). See that file for why the press raises the working
// signal Turn owns.
//
// `Env` enters here and stops here.
async function resolveFromButton(
  env: Env,
  payload: InteractionPayload,
  decision: "confirm" | "cancel",
): Promise<void> {
  const channel = payload.channel?.id;
  const ts = payload.message?.ts;
  const userId = payload.user?.id ?? "someone";
  if (!channel || !ts) return;
  await runButtonDoor({ channel, messageTs: ts, decision, userId }, buttonDoorDeps(env, payload));
}

/**
 * `Env`, once, as the dependencies the button door actually reads.
 *
 * The Delivery factory speaks on the verdict's reply thread, which is not
 * known until the claim is settled — same reason the reaction door takes a
 * factory rather than an instance.
 */
function buttonDoorDeps(env: Env, payload: InteractionPayload): ButtonDoorDeps {
  const threadState = threadStateFor(env);
  return {
    threadState,
    standingConfirmers: standingConfirmersOf(env),
    delivery: (target) => slackDelivery(env, target),
    applyVerdict: (verdict) => executeVerdict(env, verdict),
    replyEphemeral: (text) => replyEphemeral(payload, text),
    replaceCard: (message) => replaceCard(payload, message),
    // This door runs inside `waitUntil`, so a re-staged card's preview waits
    // only briefly for the Figma rate budget.
    restage: restageFor(env, threadState, PREVIEW_UNDER_WAIT_UNTIL),
  };
}

// Review on a proposal card, and a decision inside the pop-up it opens.
//
// The Slack envelope for the review door (`review-door.ts`): a card click
// carries the card in `message`, a click in the pop-up carries it in the
// view's `private_metadata`, and `Env` becomes the door's named dependencies.
// The block_actions ack has already gone by the time this runs, inside
// `waitUntil` — the door opens its loading view first so the trigger, which
// lives three seconds from the click, is spent before anything is read.
//
// `Env` enters here and stops here.
async function openReview(env: Env, payload: InteractionPayload, itemAction?: string): Promise<void> {
  const triggerId = payload.trigger_id;
  const channel = payload.channel?.id;
  const ts = payload.message?.ts;
  const userId = payload.user?.id;
  if (!triggerId || !channel || !ts || !userId) return;
  // An item of a decision report: its own proposal, which a press names by
  // its message and its id.
  const press = itemAction ? reviewPressOf(itemAction, ts) : null;
  const cardText = press ? undefined : payload.message?.text;
  await runReviewOpen(
    {
      triggerId,
      channel,
      messageTs: press?.key ?? ts,
      userId,
      ...(cardText ? { cardText } : {}),
      ...(press ? { item: press.item } : {}),
    },
    reviewDoorDeps(env),
  );
}

/** Edit fields, pressed on the draft: the fields, pushed over it on the
 *  click's trigger. */
async function editInReview(env: Env, payload: InteractionPayload): Promise<void> {
  const triggerId = payload.trigger_id;
  const card = reviewedCardOf(payload.view?.private_metadata);
  const userId = payload.user?.id;
  if (!triggerId || !card || !userId) return;
  await runReviewPush({ triggerId, card, userId }, reviewDoorDeps(env));
}

/**
 * A Review view's submit: the draft's Submit, which decides it, or Save
 * edits. A decision is acked at once with a line that says it is under way,
 * and the door answers in the same view once the Gate has (`showIn`). Save
 * edits is answered in the ack: Slack's error under a refused field, or an
 * empty ack that closes the view onto the redrawn draft.
 */
async function submitReview(env: Env, payload: InteractionPayload, ctx: ExecutionContext): Promise<Response> {
  const view = payload.view;
  const callbackId = view?.callback_id;
  const card = reviewedCardOf(view?.private_metadata);
  const userId = payload.user?.id;
  const viewId = view?.id;
  const known = [REVIEW_CALLBACK_ID, REVIEW_EDIT_CALLBACK_ID];
  if (!view || !callbackId || !known.includes(callbackId) || !card || !userId || !viewId) {
    console.log(`[interactive] unhandled view_submission ${callbackId ?? "(none)"}`);
    return new Response("", { status: 200 });
  }
  const rootViewId = view.root_view_id && view.root_view_id !== viewId ? view.root_view_id : undefined;
  const deps = reviewDoorDeps(env);

  if (callbackId === REVIEW_EDIT_CALLBACK_ID) {
    if (!rootViewId) return new Response("", { status: 200 });
    const blocks = Array.isArray(view.blocks) ? view.blocks : [];
    const ack = await saveReviewEdits({ rootViewId, card, userId, blocks, ...(view.state?.values ? { state: view.state.values } : {}) }, deps);
    return ack ? Response.json(ack) : new Response("", { status: 200 });
  }

  const submitted = draftSubmitOf(view.state);
  if (!submitted.ok) return Response.json({ response_action: "errors", errors: submitted.errors });
  const { decision, note } = submitted;
  const underWay = { confirm: "Approving…", revise: "Sending your note…", cancel: "Rejecting…" }[decision];
  ctx.waitUntil(
    runReviewDecision(
      {
        viewId,
        ...(rootViewId ? { rootViewId } : {}),
        channel: card.channel,
        messageTs: card.ts,
        userId,
        decision,
        ...(note ? { note } : {}),
        // Only the draft carries saved edits, and only Approve writes them.
        ...(decision === "confirm" && card.edits ? { edits: card.edits } : {}),
      },
      deps,
    ).catch((err) => {
      console.error(`[interactive] review ${decision} failed: ${err instanceof Error ? err.message : String(err)}`);
    }),
  );
  return Response.json({ response_action: "update", view: noticeView(card, underWay) });
}

/**
 * Needs changes, handed to uno-bot (`startRevision`): the note posts in the
 * card's thread, and a turn is queued on that line as the confirmer's own
 * reply — the same synthetic message the shortcuts and slash commands build,
 * so history, the pending card it revises, the supersession and the
 * visible-failure backstops all run unchanged.
 */
async function reviseFromReview(
  env: Env,
  request: { proposal: PendingProposal; note: string; userId: string },
): Promise<void> {
  const { proposal, note, userId } = request;
  // A weekly DS precedence card is not redrafted: its Needs changes is a
  // dispute, written on the week's intake (`ds-precedence/dispute.ts`).
  if (isPrecedenceCard(proposal)) return disputeOnEnv(env, request);
  const thread = proposalReplyThread(proposal);
  await startRevision(request, {
    threadState: threadStateFor(env),
    postInThread: async (text) => (await postMessage(env, { channel: proposal.channel, thread_ts: thread, text }))?.ts ?? null,
    queueTurn: async (noteTs) => {
      const event: SlackMessageEvent = {
        type: "message",
        channel: proposal.channel,
        user: userId,
        text: `${NEEDS_CHANGES_LEAD}${note}`,
        ts: noteTs,
        thread_ts: thread,
      };
      // A Figma comment decision revises its own way: its handler takes the
      // note at the head of the job (`figma-comments/revise.ts`). Every other
      // card goes to the turn, as before.
      const own = (await replyHandlerAt(env, event)) === "figma-decisions" ? "figma-decisions" : null;
      await enqueueAgentJob(env, { kind: "message", event, reply: own }, conversationKey(event));
    },
    updateCard: async (message) => {
      await updateMessage(env, { channel: proposal.channel, ts: proposal.item?.messageTs ?? proposal.proposalTs, text: message.text, blocks: message.blocks });
    },
  });
}

/** Where a pop-up select's options live, as the Worker's bindings name them. */
function optionDatabase(env: Env, source: OptionSource): string | undefined {
  return source.database === "roadmap" ? env.NOTION_ROADMAP_DB_ID : env.NOTION_DECISIONS_DB_ID;
}

/** `Env`, once, as the dependencies the review door reads. */
function reviewDoorDeps(env: Env): ReviewDoorDeps {
  const threadState = threadStateFor(env);
  return {
    threadState,
    standingConfirmers: standingConfirmersOf(env),
    views: {
      open: (triggerId, view) => viewsOpen(env, triggerId, view),
      push: (triggerId, view) => viewsPush(env, triggerId, view),
      update: (viewId, view) => viewsUpdate(env, viewId, view),
    },
    delivery: (target) => slackDelivery(env, target),
    // With each operation's outcome, so an item of a decision report says on
    // its card whether its write went through.
    applyVerdict: (verdict) => runVerdict(env, verdict),
    updateCard: async (channel, ts, message) => {
      const res = await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
      // Cosmetic, as the button door's re-render is: the decision is already
      // announced in the thread.
      if (!res.ok) console.warn(`[interactive] card re-render after review failed on ${channel}/${ts}`);
    },
    restage: restageFor(env, threadState, PREVIEW_UNDER_WAIT_UNTIL),
    revise: (request) => reviseFromReview(env, request),
    fieldOptions: async (source) => {
      const database = optionDatabase(env, source);
      return database ? databaseOptions(env, database, source.property) : null;
    },
  };
}

async function replyEphemeral(payload: InteractionPayload, text: string): Promise<void> {
  if (!payload.response_url) return;
  await postToResponseUrl(payload.response_url, {
    response_type: "ephemeral",
    replace_original: false,
    text,
  }).catch(() => {});
}

async function replaceCard(payload: InteractionPayload, message: CardMessage): Promise<void> {
  if (!payload.response_url) return;
  await postToResponseUrl(payload.response_url, {
    replace_original: true,
    text: message.text,
    blocks: message.blocks,
  }).catch((err: unknown) => {
    // Cosmetic: the action already happened and was announced in the thread.
    console.warn(`[interactive] card re-render failed: ${err instanceof Error ? err.message : String(err)}`);
  });
}

// The Slack envelope for the Home-tab Stop button: a button payload becomes a
// person, `Env` becomes the door's named dependencies, and `runHomeStopDoor`
// does the rest (`stop-doors.ts`). See home.ts for why the button exists
// alongside `/stop`.
//
// `Env` enters here and stops here.
async function stopRun(env: Env, payload: InteractionPayload): Promise<void> {
  const userId = payload.user?.id;
  if (!userId) return;
  await runHomeStopDoor({ userId }, homeStopDeps(env));
}

// A Home-tab "Try asking" button: the prompt asked in the presser's DM, as
// them (`try-asking.ts`).
//
// `Env` enters here and stops here.
// A failure's Try again button: the question asked again in the failure's
// thread, as the presser (`try-again.ts`).
//
// `Env` enters here and stops here.
async function tryAgain(env: Env, payload: InteractionPayload): Promise<void> {
  const userId = payload.user?.id;
  const channel = payload.channel?.id;
  const messageTs = payload.message?.ts;
  if (!userId || !channel || !messageTs) return;
  await runTryAgainDoor(
    {
      userId,
      channel,
      messageTs,
      ...(payload.message?.thread_ts ? { threadTs: payload.message.thread_ts } : {}),
      value: payload.actions?.[0]?.value,
    },
    {
      post: async (message) => (await postMessage(env, message))?.ts ?? null,
      enqueue: (event) => enqueueAgentJob(env, { kind: "message", event, reply: null }, conversationKey(event)),
      replyEphemeral: (text) => replyEphemeral(payload, text),
    },
  );
}

async function tryAsking(env: Env, payload: InteractionPayload): Promise<void> {
  const userId = payload.user?.id;
  if (!userId) return;
  await runTryAskingDoor(
    { userId, value: payload.actions?.[0]?.value },
    {
      dmChannelFor: (id) => conversationsOpen(env, id),
      post: async (message) => (await postMessage(env, message))?.ts ?? null,
      enqueue: (event, key) => enqueueAgentJob(env, { kind: "message", event }, key),
    },
  );
}

/**
 * `Env`, once, as the dependencies the Home-tab door actually reads.
 *
 * `userMsgTs` is empty because this door has no message to react on: it only
 * ever calls `postNote`, and the field exists for `react`.
 */
function homeStopDeps(env: Env): HomeStopDoorDeps {
  return {
    cancelForUser: (id) => threadStateFor(env).cancelForUser(id),
    dmChannelFor: (id) => conversationsOpen(env, id),
    delivery: (target) => slackDelivery(env, { ...target, userMsgTs: "" }),
  };
}

// The Home tab's DM watch switches (`saveDmWatchAction`). The checkboxes send
// every option still ticked; saving turns on and off what changed, then the
// view is published again so it shows what was saved — and a switch whose
// token cannot run the jobs stays unticked, with the reason and the link.
async function saveDmWatch(env: Env, payload: InteractionPayload): Promise<void> {
  await saveDmWatchAction(payload, {
    async save(userId, selected) {
      const result = await setDmWatchOnEnv(env, userId, selected);
      const refused = result.refused ? ` (refused: ${result.refused.reason})` : "";
      console.log(`[interactive] DM watch for ${userId}: ${result.on.length ? result.on.join(", ") : "all off"}${refused}`);
      return result;
    },
    publish: (userId, refused) => publishHomeView(env, userId, refused),
  });
}

// The `icon_button` delete on an answer footer (native-feedback mode).
//
// Only ever deletes the bot's OWN message — chat.delete on a bot token cannot
// do anything else, so Slack enforces the authorization rather than us. That is
// deliberate: a delete control that relied on our own check would be one
// refactor away from deleting someone else's message.
async function deleteAnswer(env: Env, payload: InteractionPayload): Promise<void> {
  const channel = payload.channel?.id;
  const ts = payload.message?.ts;
  if (!channel || !ts) return;
  const res = await deleteMessage(env, channel, ts);
  console.log(`[interactive] delete ${channel}/${ts} ok=${res.ok} by=${payload.user?.id ?? "?"}`);
}

// The feedback buttons under an answer, and the pop-up a "bad answer" opens.
//
// The Slack envelope for the feedback door (`feedback-door.ts`): a press
// carries the answer in `message` and the pressed button's value in the
// action, and `Env` becomes the door's named dependencies.
//
// A pair of these buttons was retired on 2026-08-21 because a vote could only
// be logged, never kept, and one person could vote as often as they liked.
// Both are answered now: a press is a row on the usage record, one per person
// per answer with the last word winning (`usage/feedback.ts`), and it carries
// the turn the answer belongs to, so a "bad answer" is counted against the
// kind of question that drew it. A note, which is text, is posted in the
// thread rather than stored.
//
// `Env` enters here and stops here.
async function feedbackFromButton(env: Env, payload: InteractionPayload): Promise<void> {
  const channel = payload.channel?.id;
  const answerTs = payload.message?.ts;
  const userId = payload.user?.id;
  if (!channel || !answerTs || !userId) return;
  await runFeedbackTap(
    {
      channel,
      answerTs,
      threadTs: payload.message?.thread_ts ?? answerTs,
      userId,
      value: payload.actions?.[0]?.value,
      ...(payload.trigger_id ? { triggerId: payload.trigger_id } : {}),
    },
    feedbackDoorDeps(env),
  );
}

/** `Env`, once, as the dependencies the feedback door reads. */
function feedbackDoorDeps(env: Env): FeedbackDoorDeps {
  return {
    log: answerFeedbackLogFor(env),
    openView: (triggerId, view) => viewsOpen(env, triggerId, view),
    postNote: async (channel, threadTs, text) => {
      const res = await postMessage(env, { channel, thread_ts: threadTs, text });
      if (!res.ok) throw new Error(res.error ?? "postMessage refused");
    },
    now: () => Date.now(),
  };
}
