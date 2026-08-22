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
import { countedFetch } from "../net";
import { runMessageShortcut } from "./shortcuts";
import { cancelForUser } from "../thread-state-client";
import { conversationsOpen, deleteMessage, postMessage } from "./api";

/** The subset of Slack's interaction envelope this Worker acts on. */
interface InteractionPayload {
  type: string;
  response_url?: string;
  user?: { id?: string };
  channel?: { id?: string };
  message?: { ts?: string; thread_ts?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
  callback_id?: string;
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
  // No silent catch-all. This used to fall through to the feedback handler,
  // which meant an action_id nobody had wired reached a function that ignored
  // it — a dead button that looked alive. Say so in the log instead.
  console.warn(`[interactive] no handler for action_id=${actionId}`);
}

// The Home-tab Stop button. See home.ts for why it exists alongside `/stop`.
//
// App Home is not a conversation, so there is nowhere to reply — the answer
// goes to the person's DM with the bot, which is where they would look anyway.
async function stopRun(env: Env, payload: InteractionPayload): Promise<void> {
  const userId = payload.user?.id;
  if (!userId) return;
  const result = await cancelForUser(env, userId);
  console.log(`[stop] home-tab from ${userId} cancelled=${result.cancelled} channel=${result.channel ?? "-"}`);

  const dm = await conversationsOpen(env, userId).catch(() => null);
  if (!dm) return;
  await postMessage(env, {
    channel: dm,
    // Both outcomes are worth saying. "Nothing running" is the more common
    // click and the more confusing silence: without it, a button that did
    // exactly what it should reads as a button that is broken.
    text: result.cancelled
      ? "Stopping — I'll finish the step I'm on and stop there. Nothing already confirmed gets undone."
      : "Nothing of mine is running right now, so there was nothing to stop. (If you asked me something in the last few minutes and it's still going, ask again here and I'll look.)",
  }).catch(() => {});
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
