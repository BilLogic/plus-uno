// Reply delivery + failure surfacing. Guards the class of R2 defects where the
// bot reacted 👀 and then went silent, or ✅'d a reply that never posted.
// (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import { addReaction, postMessage } from "./api";

// Make failure VISIBLE, resiliently: try the ❌ reaction first (cheapest call —
// most likely to still succeed if the request is out of subrequest budget),
// then the error text. Every step is .catch-wrapped so a failure inside the
// failure path can never re-throw into silence (R2's ":eyes: then nothing").
export async function postVisibleFailure(
  env: Env,
  channel: string,
  threadTs: string,
  userMsgTs: string,
): Promise<void> {
  await addReaction(env, channel, userMsgTs, "x").catch(() => {});
  await postMessage(env, {
    channel,
    thread_ts: threadTs,
    text: ":x: Something went wrong on my end. Try again in a moment?",
  }).catch(() => {});
}

// Slack chat.postMessage hard-fails past 40k chars and renders poorly long
// before that; AGENTS.md tells the model to keep it short, but the Worker
// enforces it. Truncation note lets the user ask for the rest.
const MAX_POST_CHARS = 3900;

function capText(text: string): string {
  if (text.length <= MAX_POST_CHARS) return text;
  // Cut at a line boundary (else a word boundary) so the cap never splits a
  // <url|label> link in half — live 2026-07-10 a mid-URL cut shipped a broken
  // link right above the truncation notice.
  const window = text.slice(0, MAX_POST_CHARS);
  const lastBreak = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
  const cut = lastBreak > MAX_POST_CHARS * 0.6 ? window.slice(0, lastBreak) : window;
  return `${cut}\n_…truncated — ask me for the rest._`;
}

/**
 * Post a text reply and report whether Slack actually accepted it. Guards the
 * R2 "✅ + empty body" defect: empty text gets an honest placeholder, oversized
 * text is capped, a failed post is retried once, and the caller only ✅-reacts
 * when this returns true.
 */
export async function postTextVerified(
  env: Env,
  channel: string,
  threadTs: string,
  text: string,
): Promise<{ ok: boolean; text: string }> {
  const body = text.trim()
    ? capText(text)
    : "(I came back with an empty answer — that's a bug on my side. Try rephrasing, and flag this to the team.)";
  let posted = await postMessage(env, { channel, thread_ts: threadTs, text: body }).catch(() => ({ ok: false as const }));
  if (!posted.ok) {
    console.warn("[slack] text post failed; retrying once");
    posted = await postMessage(env, { channel, thread_ts: threadTs, text: body }).catch(() => ({ ok: false as const }));
  }
  return { ok: !!posted.ok, text: body };
}
