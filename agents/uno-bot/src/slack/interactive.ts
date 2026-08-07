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
      ctx.waitUntil(recordFeedback(env, payload).catch((err) => {
        console.error(`[interactive] feedback failed: ${err instanceof Error ? err.message : String(err)}`);
      }));
      return new Response("", { status: 200 });
    }
    default:
      console.log(`[interactive] unhandled type: ${payload.type}`);
      return new Response("", { status: 200 });
  }
}

// Feedback buttons (👍/👎) on a bot answer. The vote is logged, not stored:
// Slack's data policy forbids retaining retrieved workspace content, and a
// thumbs-down is only useful next to the message it judges — which lives in
// Slack. The acknowledgement replaces the buttons so a second vote is not
// invited, and so the voter can see it registered.
const FEEDBACK_ACTIONS = new Set(["uno_feedback_up", "uno_feedback_down"]);

async function recordFeedback(env: Env, payload: InteractionPayload): Promise<void> {
  const actionId = payload.actions?.[0]?.action_id;
  if (!actionId || !FEEDBACK_ACTIONS.has(actionId)) return;

  const verdict = actionId === "uno_feedback_up" ? "up" : "down";
  console.log(
    `[feedback] ${verdict} user=${payload.user?.id ?? "?"} channel=${payload.channel?.id ?? "?"} ts=${payload.message?.ts ?? "?"}`,
  );

  if (!payload.response_url) return;
  const note =
    verdict === "up"
      ? ":white_check_mark: Noted — thanks."
      : ":pencil: Noted — thanks. If you have a second, say what was off and I'll use it.";

  // replace_original swaps the message that carried the buttons, so the
  // acknowledgement lands where the vote was cast rather than as a new message.
  await countedFetch(payload.response_url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ replace_original: false, response_type: "ephemeral", text: note }),
  });
}
