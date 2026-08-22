// Reply delivery + failure surfacing. Guards the class of R2 defects where the
// bot reacted 👀 and then went silent, or ✅'d a reply that never posted.
// (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import { addReaction, appendStream, postMessage, startStream, stopStream } from "./api";
import { footerKindFor, footerNoteFor, type FooterKind } from "./footer-kind";
import { stripMarkdownTables, toSlackMrkdwn } from "./mrkdwn";
import { buildFailureMessage, type FailureStage } from "./failure-message";

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
// threadTs is optional: in an agent_view DM there is no thread, and an
// undefined thread_ts posts at channel level.
export async function postVisibleFailure(
  env: Env,
  channel: string,
  threadTs: string | undefined,
  userMsgTs: string,
  err?: unknown,
  /** How far the turn got. Drives what the message can honestly promise —
   *  see failure-message.ts. Defaults to the least-informed stage. */
  stage: FailureStage = "internal",
): Promise<void> {
  const capacity = isCapacityError(err);
  await addReaction(env, channel, userMsgTs, "x").catch(() => {});
  await postMessage(env, {
    channel,
    thread_ts: threadTs,
    // Progress + blocker + next step, instead of the dead-end "something went
    // wrong on my end" this used to send. The stage is the progress: the relay
    // knows exactly how far it got, and that is the part the person cannot see.
    text: buildFailureMessage({
      stage,
      capacity,
      alertChannel: env.UNO_BOT_ALERT_CHANNEL || DEFAULT_ALERT_CHANNEL,
    }),
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

// The retired confidence affix, killed deterministically instead of by prompt.
// Banned in the persona since 2026-07-16 and re-worded twice (r19, r21) — it
// still resurfaced while the R1 eval stayed green, so wording is not a reliable
// control here (ADR-021). Precedent ADR-019: a surface rule that must hold on
// every model lane belongs in the renderer.
//
// Two deliberate narrowings, both learned in review:
//  • Only a HIGH rating is stripped. The affix is the model's fallback when it
//    did NOT weave a clause inline, so a trailing "low/medium — from memory,
//    verify" is often the reply's ONLY calibration signal; deleting it would
//    make the answer read more certain than the model was.
//  • Horizontal-whitespace classes and a single leading \n — the first version
//    nested \n+ with two \s* (which also match \n), giving ~O(n^4) backtracking
//    on a run of trailing blank lines: 100 blank lines blew the 10ms Worker CPU
//    limit, which posts nothing at all. Model output is shaped by fetched
//    content, so that was reachable from a read.
const TRAILING_CONFIDENCE =
  /\n[^\S\n]*(?:[-•*][^\S\n]+)?[_*]{0,2}[^\S\n]*confidence[^\S\n]*[_*]{0,2}[^\S\n]*[:—–-][^\S\n]*[_*]{0,2}[^\S\n]*(?:very )?high(?![a-z])[^\n]*$/i;

function stripTrailingConfidence(text: string): string {
  const trimmed = text.trimEnd();
  const cleaned = trimmed.replace(TRAILING_CONFIDENCE, "").trimEnd();
  // Log what was removed, so "stripped a decoration" stays distinguishable from
  // "ate a line that mattered" when someone reads the tail.
  if (cleaned !== trimmed) {
    console.log(`[slack] stripped trailing confidence affix: ${trimmed.slice(cleaned.length).trim().slice(0, 120)}`);
  }
  return cleaned;
}

/**
 * The body that will actually be SENT, for a given draft: the trailing-label
 * strip, the empty-answer placeholder, then the cap — in that order.
 *
 * Exported so the confidence pre-check judges the delivered text rather than
 * the draft. The two used to diverge silently: capText truncates at
 * MAX_POST_CHARS AFTER the judge has scored the draft, so a woven clause
 * sitting in a closing paragraph could be amputated from a message the
 * telemetry had already recorded as `verdict=pass` (2026-08-21).
 * postTextVerified calls this rather than repeating it, so the two cannot
 * drift apart again.
 */
export function renderDeliveredBody(text: string): string {
  // Tables die here, on every path, before the cap.
  //
  // The model writes standard Markdown (2026-08-22) and Slack renders it —
  // except tables, which Slack renders in NO message format. The prompt says
  // so and the draft judge fails a draft carrying one, but the judge skips
  // anything under MIN_DRAFT_CHARS, and a three-row table is short. Doing it
  // in the renderer means the rule holds on the body that actually ships,
  // which is the same reason the confidence strip lives here (ADR-019).
  const cleaned = stripMarkdownTables(stripTrailingConfidence(text));
  return cleaned.trim()
    ? capText(cleaned)
    : "(I came back with an empty answer — that's a bug on my side. Try rephrasing, and flag this to the team.)";
}

/**
 * Post a text reply and report whether Slack actually accepted it. Guards the
 * R2 "✅ + empty body" defect: empty text gets an honest placeholder, oversized
 * text is capped, a failed post is retried once, and the caller only ✅-reacts
 * when this returns true.
 */
// A section's text field caps at 3000 chars, below MAX_POST_CHARS — so a capped
// body can still overflow one block. Split on line boundaries so a <url|label>
// never straddles two blocks (the same failure capText guards against).
const SECTION_CHARS = 2900;
export function textSections(body: string): Array<Record<string, unknown>> {
  const chunks: string[] = [];
  // A `section` block's text is mrkdwn — NOT the Markdown the model writes and
  // NOT what `markdown_text` takes on the stream path. Convert once, before
  // splitting, so the fence-protection in toSlackMrkdwn sees balanced input.
  //
  // Until 2026-08-22 this path shipped the raw body: `postMessage` converted
  // the `text` field only, blocks render over `text`, so the sanitized copy was
  // seen by nothing but notifications and screen readers. Every `**bold**` in a
  // blocks-path reply reached people as literal asterisks.
  let rest = toSlackMrkdwn(body);
  while (rest.length > SECTION_CHARS) {
    const window = rest.slice(0, SECTION_CHARS);
    const brk = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const cut = brk > SECTION_CHARS * 0.6 ? brk : SECTION_CHARS;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\s+/, "");
  }
  if (rest) chunks.push(rest);
  return chunks.map((c) => ({ type: "section", text: { type: "mrkdwn", text: c } }));
}

// ── The answer footer ────────────────────────────────────────────────────────
//
// One line of prose, and nothing to press.
//
// It used to carry 👍/👎 buttons, and behind a flag a Slack-native variant of
// the same pair plus a delete control. Both went on 2026-08-21; the reasoning
// for the votes is in interactive.ts, where the handler used to be.
//
// DELETE went too, and that one was a real decision rather than collateral.
// The argument for it was good — a wrong answer sitting in a channel is a
// wrong answer someone quotes three weeks later. The argument against it is
// better, and it is about this codebase specifically: `buildThreadHistory`
// rebuilds every turn by re-reading the raw Slack thread. A deleted bot
// message is gone from that read, so deleting a wrong answer also deletes:
//
//   • the bot's own memory of having said it — `priorAssistantText`, which the
//     correction gate compares a corrected reply against, so the one turn the
//     judge has something to catch is the one it can no longer see;
//   • the record the team analyses performance from, leaving a correction in
//     the thread with nothing left to correct.
//
// A wrong answer with its correction underneath is a better artefact than a
// gap. If channel hygiene becomes the real problem, the shape to reach for is
// striking the answer through in place — which keeps the thread whole.
//
// `kind === "none"` still means no footer at all: a short acknowledgement is
// not making checkable claims and does not need the label.
function footerBlocks(_env: Env, kind: FooterKind): Array<Record<string, unknown>> {
  if (kind === "none") return [];
  const note = footerNoteFor(kind);
  return note ? [{ type: "context", elements: [{ type: "mrkdwn", text: note }] }] : [];
}

export async function postTextVerified(
  env: Env,
  channel: string,
  threadTs: string | undefined,
  text: string,
  /** Forces the footer variant. Set by the relay, never sniffed from the text:
   *  the `draft` shortcut is the one caller that knows its answer goes out
   *  under the PERSON'S name, and the standard "check before acting" line is
   *  wrong for that. Absent = classify from the body. */
  footerHint?: FooterKind,
  /** ts of a stream already open for this turn (plan mode). When present the
   *  answer CLOSES that stream instead of opening a new one. */
  openStreamTs?: string,
): Promise<{ ok: boolean; text: string }> {
  const body = renderDeliveredBody(text);
  const footer = footerBlocks(env, footerKindFor(body, footerHint));

  // Streamed delivery, opened HERE rather than at turn start. Opening it early
  // (to double as the thinking indicator) left an empty "AGENT" bubble sitting
  // in the thread for the whole run — a blank message impersonating a loader.
  // The status line is the indicator; the stream carries the answer.
  if ((openStreamTs || env.SLACK_STREAMING === "on") && threadTs) {
    const streamTs = openStreamTs ?? (await startStream(env, channel, threadTs));
    if (streamTs) {
      // append (the text) then stop (the footer blocks — stopStream is the only
      // frame that accepts blocks). If either half fails, fall through to a
      // plain post: a duplicated answer is bad, a missing one is worse.
      const appended = await appendStream(env, channel, streamTs, body);
      const stopped = await stopStream(env, channel, streamTs, footer.length ? footer : undefined);
      if (appended && stopped) return { ok: true, text: body };
      console.warn(`[slack] stream finish failed (append=${appended} stop=${stopped}); falling back to post`);
      await stopStream(env, channel, streamTs).catch(() => {});
    }
  }
  // `text` stays populated alongside blocks: it is what notifications and
  // screen readers use, and it is the fallback if a block ever fails to render.
  // A disclaimer on "Got it — cancelled" is how people learn to skip it on the
  // messages that carry claims. Acknowledgements get no footer; anything
  // unrecognised falls back to the footer rather than to silence.
  const withBlocks = { channel, thread_ts: threadTs, text: body, blocks: [...textSections(body), ...footer] };
  let posted = await postMessage(env, withBlocks).catch(() => ({ ok: false as const }));
  if (!posted.ok) {
    // Degrade to plain text rather than lose the answer. A malformed block is a
    // cosmetic failure; a dropped answer is the 👀-then-silence failure.
    console.warn("[slack] blocks post failed; retrying as plain text");
    posted = await postMessage(env, { channel, thread_ts: threadTs, text: body }).catch(() => ({ ok: false as const }));
  }
  return { ok: !!posted.ok, text: body };
}
