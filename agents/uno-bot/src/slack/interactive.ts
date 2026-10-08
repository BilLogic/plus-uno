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
import { conversationsOpen, deleteMessage, postToResponseUrl, updateMessage, viewsOpen, viewsUpdate } from "./api";
import { executeVerdict } from "../agent/resolve-proposal";
import { REVIEW_ACTION_ID, proposalCardBlocks } from "./proposal-render";
import { checkedEditsView, runReviewDecision, runReviewOpen, type ReviewDoorDeps, type ReviewViewState } from "./review-door";
import { REVIEW_APPROVE_ACTION_ID, REVIEW_CALLBACK_ID, reviewedCardOf } from "./review-view";
import type { OptionSource } from "./review-fields";
import { databaseOptions } from "../integrations/notion";
import { runHomeStopDoor, type HomeStopDoorDeps } from "./stop-doors";
import { slackDelivery } from "./slack-delivery";
import { standingConfirmersOf } from "./standing-confirmers";
import { runButtonDoor, type ButtonDoorDeps } from "./button-door";
import { DM_WATCH_ACTION_ID, saveDmWatchAction } from "../dm-watch/index";
import { setDmWatchOnEnv } from "../dm-watch/env";
import { publishHomeView } from "./home";
import { handleReminderButton } from "./gate";
import { REMINDER_ACTION_PREFIX } from "../commitments/copy";

/** The subset of Slack's interaction envelope this Worker acts on. */
interface InteractionPayload {
  type: string;
  response_url?: string;
  user?: { id?: string };
  channel?: { id?: string };
  message?: { ts?: string; thread_ts?: string };
  actions?: Array<{ action_id?: string; value?: string; selected_options?: { value?: string }[] }>;
  callback_id?: string;
  /** A click's one-use, three-second key to `views.open`. */
  trigger_id?: string;
  /** Set when the click was inside a modal rather than on a message, and on a
   *  modal's submit. `state.values` holds its inputs as the person left them. */
  view?: { id?: string; private_metadata?: string; callback_id?: string; state?: { values?: ReviewViewState } } & Record<
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
): Response {
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
    // The Review pop-up's Check edits. Answered in the ack itself, which is
    // the only way a submit keeps its modal open: `response_action: "update"`
    // redraws it with the edits kept and one alert about them. Nothing is
    // read, so the answer is inside Slack's three seconds.
    case "view_submission": {
      if (payload.view?.callback_id !== REVIEW_CALLBACK_ID) {
        console.log(`[interactive] unhandled view_submission ${payload.view?.callback_id ?? "(none)"}`);
        return new Response("", { status: 200 });
      }
      return Response.json({ response_action: "update", view: checkedEditsView(payload.view) });
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
  if (actionId === "uno_delete_answer") return deleteAnswer(env, payload);
  if (actionId === "uno_proposal_confirm") return resolveFromButton(env, payload, "confirm");
  if (actionId === "uno_proposal_cancel") return resolveFromButton(env, payload, "cancel");
  if (actionId === REVIEW_ACTION_ID) return openReview(env, payload);
  if (actionId === REVIEW_APPROVE_ACTION_ID) return decideInReview(env, payload, "confirm");
  if (actionId === DM_WATCH_ACTION_ID) return saveDmWatch(env, payload);
  if (actionId.startsWith(REMINDER_ACTION_PREFIX)) return answerFromButton(env, payload, actionId);
  // No silent catch-all. This used to fall through to the feedback handler,
  // which meant an action_id nobody had wired reached a function that ignored
  // it — a dead button that looked alive. Say so in the log instead.
  console.warn(`[interactive] no handler for action_id=${actionId}`);
}

// A button under a reminder (commitment, card follow-up, DM ask). It is the
// reaction it is labelled with, tapped: the action id carries the glyph's Slack
// name, and the reminder doors do the rest (`handleReminderButton`).
async function answerFromButton(env: Env, payload: InteractionPayload, actionId: string): Promise<void> {
  const channel = payload.channel?.id;
  const messageTs = payload.message?.ts;
  const userId = payload.user?.id;
  const glyph = payload.actions?.[0]?.value || actionId.slice(REMINDER_ACTION_PREFIX.length);
  if (!channel || !messageTs || !userId || !glyph) return;
  const claimed = await handleReminderButton(env, { channel, messageTs, glyph, userId });
  console.log(`[interactive] reminder ${glyph} on ${channel}/${messageTs} by=${userId} claimed=${claimed}`);
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
    replaceCard: (text, note) => replaceCard(payload, text, note),
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
async function openReview(env: Env, payload: InteractionPayload): Promise<void> {
  const triggerId = payload.trigger_id;
  const channel = payload.channel?.id;
  const messageTs = payload.message?.ts;
  const userId = payload.user?.id;
  if (!triggerId || !channel || !messageTs || !userId) return;
  await runReviewOpen({ triggerId, channel, messageTs, userId }, reviewDoorDeps(env));
}

async function decideInReview(env: Env, payload: InteractionPayload, decision: "confirm" | "cancel"): Promise<void> {
  const viewId = payload.view?.id;
  const card = reviewedCardOf(payload.view?.private_metadata);
  const userId = payload.user?.id;
  if (!viewId || !card || !userId) return;
  const state = payload.view?.state?.values;
  await runReviewDecision(
    { viewId, channel: card.channel, messageTs: card.ts, userId, decision, ...(state ? { state } : {}) },
    reviewDoorDeps(env),
  );
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
      update: (viewId, view) => viewsUpdate(env, viewId, view),
    },
    delivery: (target) => slackDelivery(env, target),
    applyVerdict: (verdict) => executeVerdict(env, verdict),
    updateCard: async (channel, ts, text, note) => {
      const res = await updateMessage(env, { channel, ts, text: `${text}\n${note}`, blocks: proposalCardBlocks(text, note) });
      // Cosmetic, as the button door's re-render is: the decision is already
      // announced in the thread.
      if (!res.ok) console.warn(`[interactive] card re-render after review failed on ${channel}/${ts}`);
    },
    restage: restageFor(env, threadState, PREVIEW_UNDER_WAIT_UNTIL),
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

async function replaceCard(payload: InteractionPayload, text: string, note: string): Promise<void> {
  if (!payload.response_url) return;
  await postToResponseUrl(payload.response_url, {
    replace_original: true,
    text,
    blocks: proposalCardBlocks(text, note),
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

// The 👍/👎 answer footer was removed on 2026-08-21 (Bill).
//
// It asked for something the system could not accept. Slack's data policy
// forbids retaining retrieved workspace content, so the vote could only ever
// be logged, never stored — one unstructured console line per press, rolling
// away unread. Nothing counted it, nothing could query it. A 👎 was a person
// telling us something into a void, under every substantive answer.
//
// The acknowledgement also claimed to replace the buttons "so a second vote is
// not invited" while sending `replace_original: false`, so it never did: one
// person could vote as many times as they liked. Any future aggregation would
// have been meaningless before it started.
//
// And it cost more than nothing. 👍 was a confirm REACTION on staged proposals
// until the same day, so the product spent months putting a thumbs-up under
// every answer while one flavour of thumbs-up meant "yes, write to Notion".
// Buttons and reactions are different Slack mechanisms and this button never
// fired a write — but a person told to "give the thumbs up" reaches for
// whichever is closer.
//
// What remains in the footer is the part that was doing the work: the honesty
// line ("LLM-written · check before acting"). It is prose and needs no handler.
//
// If a feedback signal is wanted later, the honest shape is a WRITTEN one — a
// reply in the thread, which is where the analysable signal already lives, and
// which is what the retired 👎 acknowledgement asked for and then had nowhere
// to put.
