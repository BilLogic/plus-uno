// Message shortcuts — "act on this message" from a message's context menu.
//
// WHY THESE EXIST AT ALL
// ----------------------
// Slack does not deliver slash commands in threads — its own words: "slash
// commands do not work in threads in general". That rules them out of channel
// threads AND of the agent container, where every message is a thread reply.
// So without shortcuts there is no way to act on a thread. Commands cover the
// composer, shortcuts cover threads, and between them no surface is unreachable.
//
// The second reason is the ANCHOR. A shortcut payload carries channel,
// message.ts and message.thread_ts, so the thread arrives WITH the request
// instead of being guessed from text — and that provenance is what makes the
// follow-up read legitimate: the anchor comes from Slack, not from anything a
// message could have manipulated.
//
// TWO MECHANICS THEY ALL SHARE
// ----------------------------
// 1. Answers go to the ASKER'S DM, never the channel the shortcut fired from.
//    "Catch me up on this thread" posted publicly announces you were not
//    following it; "is this still true?" reads as calling out whoever wrote the
//    message. The thread is public; wanting to understand it is not. A permalink
//    goes in the DM so the answer is not stranded from its source.
//
//    It also makes the Slack-search step of `where_decided` legitimate: own-token
//    search may only activate in the requester's own DM (ADR-020), which is
//    exactly where these answers land.
//
// 2. A TITLED ANCHOR is posted first. assistant.threads.setStatus needs a
//    thread_ts and a fresh DM has none, so a shortcut click would otherwise
//    leave the DM empty for 30-90s — indistinguishable from nothing happening.
//    The anchor gives immediate confirmation that the right message was picked,
//    creates the thread the answer lands in, and names it in the timeline.
//    One helper, three problems.
//
// WORDING LIVES HERE, NOT IN THE MANIFEST, so it is reviewable in a diff. The
// manifest carries only the menu label and the callback_id. A test asserts the
// two agree — a shortcut declared with no entry here still appears in the menu
// and quietly does the generic thing.

import type { Env } from "../types";
import { conversationsOpen, getPermalink, postMessage } from "./api";
import { setAssistantTitle } from "./assistant";
import { enqueueAgentJob } from "./events";
import type { SlackMessageEvent } from "./types";
import { SHORTCUTS } from "./shortcut-specs";

export { SHORTCUTS } from "./shortcut-specs";
export type { ShortcutSpec } from "./shortcut-specs";

export interface MessageShortcutPayload {
  callbackId: string;
  userId: string;
  channelId: string;
  messageTs: string;
}

/**
 * Run a message shortcut. Called from ctx.waitUntil — Slack needs its 200
 * within 3 seconds and every step below is slower than that.
 */
export async function runMessageShortcut(
  env: Env,
  payload: MessageShortcutPayload,
): Promise<void> {
  const spec = SHORTCUTS[payload.callbackId];
  if (!spec) {
    console.error(`[shortcut] no handler for ${payload.callbackId}`);
    return;
  }

  try {
    // Fetched, not constructed: a link the bot assembled is a link nobody
    // verified, and the whole shortcut is about pointing at a specific message.
    const link = await getPermalink(env, payload.channelId, payload.messageTs);
    if (!link) throw new Error("chat.getPermalink returned nothing");

    const dm = await conversationsOpen(env, payload.userId);
    if (!dm) throw new Error("conversations.open returned no channel");

    const posted = await postMessage(env, { channel: dm, text: spec.anchor(link) });
    const rootTs = posted?.ts;
    if (!rootTs) throw new Error("anchor post returned no ts — cannot thread the run");

    await setAssistantTitle(env, dm, rootTs, spec.title).catch(() => {
      /* a nameless thread still works */
    });

    // Synthetic message event, same shape the slash-command path builds, so
    // everything downstream — history, gates, proposals, delivery, the
    // visible-failure backstops — runs unchanged.
    const event: SlackMessageEvent = {
      type: "message",
      channel: dm,
      user: payload.userId,
      text: spec.ask(link),
      ts: rootTs,
      thread_ts: rootTs,
      ...(spec.tier ? { tierOverride: spec.tier } : {}),
      ...(spec.footer ? { footerHint: spec.footer } : {}),
    };
    await enqueueAgentJob(env, { kind: "message", event }, `${dm}:${rootTs}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[shortcut] ${payload.callbackId} failed: ${detail}`);
    // A shortcut that acks and then does nothing is the 👀-then-silence failure
    // in a new costume. Tell them in the DM, where the answer was going anyway.
    const dm = await conversationsOpen(env, payload.userId).catch(() => null);
    if (dm) {
      await postMessage(env, {
        channel: dm,
        text: ":warning: I couldn't start that one — try again, and flag it in #uno-bot if it repeats.",
      }).catch(() => {});
    }
  }
}
