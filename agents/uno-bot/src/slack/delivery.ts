// Reply delivery + failure surfacing. Guards the class of R2 defects where the
// bot reacted 👀 and then went silent, or ✅'d a reply that never posted.
// (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import { addReaction, appendStream, postMessage, startStream, stopStream } from "./api";
import { decideStream, type StreamRecipient } from "./stream-recipient";
import { answerMessages, deliverAnswer } from "./answer-posts";
import { footerKindFor, footerNoteFor, type FooterKind } from "./footer-kind";
import { renderDeliveredBody, textSections } from "./render";
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

// The render — what a reply looks like when it ships — moved to
// `slack/render.ts` (import-free), so the Turn module can judge the body it is
// about to deliver instead of judging the draft. Re-exported: callers reach for
// `renderDeliveredBody` and `textSections` here.
export { renderDeliveredBody, textSections } from "./render";

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
  /** Who a stream would be for. REQUIRED, and positioned ahead of the optional
   *  arguments to keep it that way: #572 was an optional positional argument
   *  nobody passed, and an optional replacement leaves the same hole open for
   *  the next caller. The type checker is the regression test. */
  recipient: StreamRecipient,
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

  // The answer is no longer cut to fit one message: a long body is posted as
  // continuation messages in the thread, in order. `body` — the whole of it —
  // is still what comes back, so the judges and ThreadState see the answer the
  // person read rather than its first message.
  const ok = await deliverAnswer(answerMessages(body), {
    // Streamed delivery, opened HERE rather than at turn start. Opening it
    // early (to double as the thinking indicator) left an empty "AGENT" bubble
    // sitting in the thread for the whole run — a blank message impersonating a
    // loader. The status line is the indicator; the stream carries the answer.
    async stream(piece, withFooter) {
      if (!((openStreamTs || env.SLACK_STREAMING === "on") && threadTs)) return false;
      // Both recipient ids, or no call at all — the argument contract and why
      // it is a pair are in `api.ts` above `startStream`, and the decision
      // itself is `decideStream` (its own module, so it can be tested by
      // running it). Until #572 the answer path passed neither id, so a
      // channel turn bought an `invalid_arguments` and a console.warn on its
      // way to the ordinary post it was going to make anyway.
      const decision = decideStream(openStreamTs, recipient);
      if (!decision.open) {
        // A HALF recipient is a turn that quietly lost streaming, and this
        // ticket is the argument for the line: what made #572 survive six
        // revisions was a fallback whose only symptom was a warning nobody
        // read, and a fallback with NO symptom is worse than that. So the one
        // case that should never happen says which half went missing, and says
        // it where the other Slack degradations are already logged. A path
        // with no recipient at all was never going to stream and stays quiet.
        if (decision.missing !== "recipient") {
          const user = recipient?.userId || "MISSING";
          const team = recipient?.team || "MISSING";
          console.warn(
            `[slack] stream skipped: recipient missing ${decision.missing}` +
              ` | sent={recipient_user_id:${user},recipient_team_id:${team}}` +
              " — the answer posts as an ordinary message",
          );
        }
        return false;
      }
      const streamTs =
        openStreamTs ??
        (await startStream(env, channel, threadTs, recipient.userId, recipient.team));
      if (!streamTs) return false;
      try {
        // append (the text) then stop (the footer blocks — stopStream is the only
        // frame that accepts blocks). If either half fails, fall through to a
        // plain post: a duplicated answer is bad, a missing one is worse.
        const appended = await appendStream(env, channel, streamTs, piece);
        const blocks = withFooter && footer.length ? footer : undefined;
        const stopped = await stopStream(env, channel, streamTs, blocks);
        if (appended && stopped) return true;
        console.warn(`[slack] stream finish failed (append=${appended} stop=${stopped}); falling back to post`);
        await stopStream(env, channel, streamTs).catch(() => {});
        return false;
      } catch (err) {
        // Every stream opened here is stopped here, throw included: an
        // unstopped one leaves the thread showing work still in progress long
        // after the turn ended, and nothing downstream knows its ts.
        await stopStream(env, channel, streamTs).catch(() => {});
        throw err;
      }
    },

    // `text` stays populated alongside blocks: it is what notifications and
    // screen readers use, and it is the fallback if a block ever fails to
    // render. A disclaimer on "Got it — cancelled" is how people learn to skip
    // it on the messages that carry claims. Acknowledgements get no footer;
    // anything unrecognised falls back to the footer rather than to silence.
    async post(piece, withFooter) {
      const blocks = [...textSections(piece), ...(withFooter ? footer : [])];
      let posted = await postMessage(env, { channel, thread_ts: threadTs, text: piece, blocks }).catch(
        () => ({ ok: false as const }),
      );
      if (!posted.ok) {
        // Degrade to plain text rather than lose the answer. A malformed block
        // is a cosmetic failure; a dropped answer is the 👀-then-silence one.
        console.warn("[slack] blocks post failed; retrying as plain text");
        posted = await postMessage(env, { channel, thread_ts: threadTs, text: piece }).catch(() => ({
          ok: false as const,
        }));
      }
      return !!posted.ok;
    },
  });

  return { ok, text: body };
}
