// Reply delivery + failure surfacing. Guards the class of R2 defects where the
// bot reacted 👀 and then went silent, or ✅'d a reply that never posted.
// (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import { addReaction, postMessage } from "./api";

// Capacity/quota failures look identical to a generic error to a user, which is
// exactly how a model-quota outage read as a mystery for an afternoon
// (2026-07-16). Detect them so the USER gets an honest "over capacity" message
// and the TEAM gets a throttled alert instead of the failure being invisible.
const CAPACITY_ERR_RE =
  /\b429\b|resource[ _]has[ _]been[ _]exhausted|resource_exhausted|\bquota\b|rate[ -]?limit|too many requests|\b503\b|overloaded|unavailable/i;

export function isCapacityError(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err ?? "");
  return CAPACITY_ERR_RE.test(m);
}

// Default alert channel (#uno-bot) — overridable via UNO_BOT_ALERT_CHANNEL.
const DEFAULT_ALERT_CHANNEL = "C0ARJ2A3A69";
const ALERT_THROTTLE_KEY = "alert:capacity";
const ALERT_THROTTLE_S = 600; // 10 min — one ping per outage, not per message

// Throttled team alert on a capacity/quota outage. Best-effort and fully
// self-contained: a failure inside here never propagates into the reply path.
async function alertCapacity(env: Env, err: unknown): Promise<void> {
  try {
    const kv = env.HARNESS_KV;
    if (kv) {
      if (await kv.get(ALERT_THROTTLE_KEY)) return; // already alerted this window
      await kv.put(ALERT_THROTTLE_KEY, String(Date.now()), { expirationTtl: ALERT_THROTTLE_S });
    }
    const snippet = (err instanceof Error ? err.message : String(err ?? "")).slice(0, 300);
    await postMessage(env, {
      channel: env.UNO_BOT_ALERT_CHANNEL || DEFAULT_ALERT_CHANNEL,
      text:
        ":rotating_light: uno-bot replies are failing on model *capacity/quota* — users are getting errors until this clears.\n" +
        `> ${snippet}\n` +
        "Check GCP Console → IAM & Admin → Quotas (filter *Vertex AI* + the active model), or point `GEMINI_MODEL` at a model with headroom.",
    }).catch(() => {});
  } catch {
    /* never let alerting break the failure path */
  }
}

// Make failure VISIBLE, resiliently: try the ❌ reaction first (cheapest call —
// most likely to still succeed if the request is out of subrequest budget),
// then the error text. Every step is .catch-wrapped so a failure inside the
// failure path can never re-throw into silence (R2's ":eyes: then nothing").
// Pass `err` so capacity/quota outages surface distinctly (clearer user message
// + a throttled team alert) instead of the generic "something went wrong".
export async function postVisibleFailure(
  env: Env,
  channel: string,
  threadTs: string,
  userMsgTs: string,
  err?: unknown,
): Promise<void> {
  const capacity = isCapacityError(err);
  await addReaction(env, channel, userMsgTs, "x").catch(() => {});
  await postMessage(env, {
    channel,
    thread_ts: threadTs,
    text: capacity
      ? ":warning: I'm temporarily over capacity and can't answer right now — I've flagged it to the team. Try again in a little bit."
      : ":x: Something went wrong on my end. Try again in a moment?",
  }).catch(() => {});
  if (capacity) await alertCapacity(env, err);
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
