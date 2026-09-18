// Reply delivery + failure surfacing. Guards the class of R2 defects where the
// bot reacted 👀 and then went silent, or ✅'d a reply that never posted.
// (Extracted from events.ts, 2026-07-12.)
//
// IT TAKES NAMED DEPENDENCIES, the way the stop doors do (`slack/stop-doors.ts`,
// #593) and the Delivery adapter does (`slack/delivery-adapter.ts`, #594): the
// Slack posting client, the streaming switch, the alert channel, the throttle
// store. `Env` never enters — it is turned into that record once, in
// `slack/slack-delivery.ts` (and `events.ts` for the one failure path that
// does not go through Delivery). That is what lets the Node suite DRIVE the
// answer path rather than read it (`tests/stream-recipient.test.ts`, #654).

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

/** Default alert channel (#uno-bot) — the envelope may override via `UNO_BOT_ALERT_CHANNEL`. */
export const DEFAULT_ALERT_CHANNEL = "C0ARJ2A3A69";
const ALERT_THROTTLE_KEY = "alert:capacity";
const ALERT_THROTTLE_S = 600; // 10 min — one ping per outage, not per message

/**
 * The Slack calls the posting functions actually make.
 *
 * A subset of the Web API, named, so a test can stand in for Slack without
 * constructing an `Env`.
 */
export interface PostingClient {
  addReaction(channel: string, ts: string, name: string): Promise<unknown>;
  postMessage(input: {
    channel: string;
    thread_ts?: string;
    text: string;
    blocks?: Array<Record<string, unknown>>;
  }): Promise<{ ok: boolean }>;
  startStream(
    channel: string,
    threadTs: string,
    userId: string,
    team?: string,
  ): Promise<string | null | undefined>;
  appendStream(channel: string, streamTs: string, text: string): Promise<boolean>;
  stopStream(
    channel: string,
    streamTs: string,
    blocks?: Array<Record<string, unknown>>,
  ): Promise<boolean>;
}

/** The throttle store a capacity alert consults, if one is bound. */
export interface PostingThrottle {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts: { expirationTtl: number }): Promise<void>;
}

/**
 * What the posting functions need, by name.
 *
 * `Env` is turned into this once, in the envelope. Nothing here is optional
 * "because a test might omit it": a missing streaming switch or a missing
 * alert channel would silently change what a person sees.
 */
export interface PostingDeps {
  slack: PostingClient;
  /** `SLACK_STREAMING === "on"` — whether a new answer stream may open. */
  streamingOn: boolean;
  /** Where a capacity outage pings the team. */
  alertChannel: string;
  /** Best-effort throttle; absent means every capacity failure alerts. */
  throttle?: PostingThrottle | null;
}

/**
 * Throttled team alert on a capacity/quota outage. Best-effort: a failure
 * inside here never propagates into the reply path.
 *
 * @param deps named posting dependencies
 * @param err the capacity error, snippeted into the ping
 */
async function alertCapacity(deps: PostingDeps, err: unknown): Promise<void> {
  try {
    const kv = deps.throttle;
    if (kv) {
      if (await kv.get(ALERT_THROTTLE_KEY)) return;
      await kv.put(ALERT_THROTTLE_KEY, String(Date.now()), { expirationTtl: ALERT_THROTTLE_S });
    }
    const snippet = (err instanceof Error ? err.message : String(err ?? "")).slice(0, 300);
    await deps.slack
      .postMessage({
        channel: deps.alertChannel,
        text:
          ":rotating_light: uno-bot replies are failing on model *capacity/quota* — users are getting errors until this clears.\n" +
          `> ${snippet}\n` +
          "Check GCP Console → IAM & Admin → Quotas (filter *Vertex AI* + the active model), or point `GEMINI_MODEL` at a model with headroom.",
      })
      .catch(() => {});
  } catch {
    /* never let alerting break the failure path */
  }
}

/**
 * Make failure VISIBLE, resiliently: try the ❌ reaction first (cheapest call —
 * most likely to still succeed if the request is out of subrequest budget),
 * then the error text. Every step is .catch-wrapped so a failure inside the
 * failure path can never re-throw into silence (R2's ":eyes: then nothing").
 *
 * @param deps named posting dependencies
 * @param channel conversation the person is in
 * @param threadTs optional: in an agent_view DM there is no thread
 * @param userMsgTs the person's message — what the ❌ lands on
 * @param err so capacity/quota outages surface distinctly
 * @param stage how far the turn got; drives what the message can honestly promise
 */
export async function postVisibleFailure(
  deps: PostingDeps,
  channel: string,
  threadTs: string | undefined,
  userMsgTs: string,
  err?: unknown,
  stage: FailureStage = "internal",
): Promise<void> {
  const capacity = isCapacityError(err);
  await deps.slack.addReaction(channel, userMsgTs, "x").catch(() => {});
  await deps.slack
    .postMessage({
      channel,
      thread_ts: threadTs,
      text: buildFailureMessage({
        stage,
        capacity,
        alertChannel: deps.alertChannel,
      }),
    })
    .catch(() => {});
  if (capacity) await alertCapacity(deps, err);
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
function footerBlocks(kind: FooterKind): Array<Record<string, unknown>> {
  if (kind === "none") return [];
  const note = footerNoteFor(kind);
  return note ? [{ type: "context", elements: [{ type: "mrkdwn", text: note }] }] : [];
}

/**
 * Post a verified answer: stream it when the recipient pair is complete, else
 * fall back to an ordinary message. The recipient is REQUIRED — #572 was an
 * optional positional argument nobody passed.
 *
 * @param deps named posting dependencies
 * @param channel conversation
 * @param threadTs thread to reply under, or undefined at channel level
 * @param text the answer body
 * @param recipient who a stream would be for
 * @param footerHint forces the footer variant; absent = classify from the body
 * @param openStreamTs ts of a stream already open for this turn (plan mode)
 */
export async function postTextVerified(
  deps: PostingDeps,
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
  const footer = footerBlocks(footerKindFor(body, footerHint));

  const ok = await deliverAnswer(answerMessages(body), {
    async stream(piece, withFooter) {
      if (!((openStreamTs || deps.streamingOn) && threadTs)) return false;
      // Both recipient ids, or no call at all — the argument contract and why
      // it is a pair are in `api.ts` above `startStream`, and the decision
      // itself is `decideStream`. Until #572 the answer path passed neither
      // id, so a channel turn bought an `invalid_arguments` and a console.warn
      // on its way to the ordinary post it was going to make anyway.
      const decision = decideStream(openStreamTs, recipient);
      if (!decision.open) {
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
        (await deps.slack.startStream(channel, threadTs, recipient.userId, recipient.team));
      if (!streamTs) return false;
      try {
        const appended = await deps.slack.appendStream(channel, streamTs, piece);
        const blocks = withFooter && footer.length ? footer : undefined;
        const stopped = await deps.slack.stopStream(channel, streamTs, blocks);
        if (appended && stopped) return true;
        console.warn(`[slack] stream finish failed (append=${appended} stop=${stopped}); falling back to post`);
        await deps.slack.stopStream(channel, streamTs).catch(() => {});
        return false;
      } catch (err) {
        await deps.slack.stopStream(channel, streamTs).catch(() => {});
        throw err;
      }
    },

    async post(piece, withFooter) {
      const blocks = [...textSections(piece), ...(withFooter ? footer : [])];
      let posted = await deps.slack
        .postMessage({ channel, thread_ts: threadTs, text: piece, blocks })
        .catch(() => ({ ok: false as const }));
      if (!posted.ok) {
        console.warn("[slack] blocks post failed; retrying as plain text");
        posted = await deps.slack
          .postMessage({ channel, thread_ts: threadTs, text: piece })
          .catch(() => ({ ok: false as const }));
      }
      return !!posted.ok;
    },
  });

  return { ok, text: body };
}
