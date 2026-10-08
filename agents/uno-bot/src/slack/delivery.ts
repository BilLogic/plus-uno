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
import { refusalDetail } from "./api";
import { resultTableBlock } from "./result-table-block";
import { sourcesBox } from "./sources-box";
import { textCopy, type Presentation } from "../turn/presentation";
import { feedbackBlock, type AnswerFeedback } from "./feedback";

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
    unfurl_links?: boolean;
    unfurl_media?: boolean;
  }): Promise<{ ok: boolean; error?: string }>;
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
          ":warning: le goat's replies are failing on model *capacity/quota* — users are getting errors until this clears.\n" +
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
// One line of prose, and beneath it on a substantive answer Slack's feedback
// buttons (`feedback.ts`). Those went on 2026-08-21, when a vote could only be
// logged, and came back once a press had somewhere to be kept: the usage
// record, against the answer (interactive.ts says how).
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
/** Slack's error code and its own account of a refused post, for the log. */
function refusalOf(posted: { ok: boolean; error?: string }): string {
  return `${posted.error ?? "no error code"}${refusalDetail(posted)}`;
}

/** Slack's codes for a payload whose blocks it will not take. */
const BLOCK_REFUSALS = new Set(["invalid_blocks", "invalid_blocks_format"]);

/**
 * Whether Slack refused a post BECAUSE OF ITS BLOCKS — the only refusal a
 * plainer rung of blocks could get past. `invalid_arguments` counts only when
 * Slack's own messages point into `/blocks`; anything else (`ratelimited`,
 * `channel_not_found`, a thrown call) would fail the next block rung the same
 * way, so the answer goes straight to bare text instead.
 */
function refusedForBlocks(posted: { ok: boolean; error?: string }): boolean {
  if (BLOCK_REFUSALS.has(posted.error ?? "")) return true;
  if (posted.error !== "invalid_arguments") return false;
  const messages = (posted as { response_metadata?: { messages?: unknown } }).response_metadata?.messages;
  return Array.isArray(messages) && messages.some((m) => /json-pointer:\/blocks(\/|\])/.test(String(m)));
}

/** A split answer's `(i/n)`, as the small grey line under its part. */
function markerBlocks(marker: string | null): Array<Record<string, unknown>> {
  return marker ? [{ type: "context", elements: [{ type: "mrkdwn", text: marker }] }] : [];
}

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
 * @param extras what rides beneath the answer: the turn's presentation, whose
 *   result table posts as a `data_table` and whose sources as a closed
 *   Sources box, between the last part's `markdown` block and its footer, each
 *   with its plain text appended to that part's text copy; and the feedback
 *   buttons, under a substantive answer's footer, tied to `feedback.turnId`
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
  extras: { presentation?: Presentation; feedback?: AnswerFeedback } = {},
): Promise<{ ok: boolean; text: string }> {
  const body = renderDeliveredBody(text);
  const { presentation } = extras;
  const resultTable = presentation?.table;
  // A table of rows is a checkable claim however short the prose above it:
  // the honesty line goes beneath it even when the prose alone would read as
  // an acknowledgement.
  const footerKind: FooterKind = resultTable && footerHint !== "draft" ? "full" : footerKindFor(body, footerHint);
  const footer = footerBlocks(footerKind);
  // The feedback buttons ride a full footer only: an acknowledgement has
  // nothing to judge, and a draft is the person's own words.
  const feedback = extras.feedback && footerKind === "full" ? [feedbackBlock(extras.feedback)] : [];
  // The table rides where the footer does — the answer's last part, where it
  // ends — and its plain list rides that part's text copy, which is what a
  // notification shows and what the thread remembers.
  const box = sourcesBox(presentation?.sources);
  // What rides beneath the last part, in order: the table, then the box.
  const extraBlocks = [...(resultTable ? [resultTableBlock(resultTable)] : []), ...(box ? [box.block] : [])];
  const withBox = (copy: string): string => (box ? `${copy}\n\n${box.line}` : copy);
  const copyOf = (piece: string, last: boolean): string => (last ? withBox(textCopy(piece, presentation)) : piece);

  const ok = await deliverAnswer(answerMessages(body), {
    async stream(piece, withFooter, marker) {
      if (!(deps.streamingOn && threadTs)) return false;
      // An answer carrying a table or a box posts as an ordinary message:
      // Slack does not document either in a stream, and a stream's first part
      // is not where they ride on a split answer anyway.
      if (extraBlocks.length) return false;
      // Both recipient ids, or no call at all — the argument contract and why
      // it is a pair are in `api.ts` above `startStream`, and the decision
      // itself is `decideStream`. Until #572 the answer path passed neither
      // id, so a channel turn bought an `invalid_arguments` and a console.warn
      // on its way to the ordinary post it was going to make anyway.
      const decision = decideStream(recipient);
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
      const streamTs = await deps.slack.startStream(channel, threadTs, recipient.userId, recipient.team);
      if (!streamTs) return false;
      // ONE STOP PER STREAM. A stream the first stop closed takes no second
      // one — Slack answers it `message_not_in_streaming_state` — so the stop
      // is repeated only when it failed or never ran, to leave nothing
      // rendering as a live "typing" bubble.
      let stopped = false;
      try {
        const appended = await deps.slack.appendStream(channel, streamTs, piece);
        // No feedback buttons on a streamed answer: blocks in a stream's stop
        // are proven for the marker and the footer only, and a refused stop
        // re-posts the whole answer.
        const closing = [...markerBlocks(marker), ...(withFooter ? footer : [])];
        const blocks = closing.length ? closing : undefined;
        stopped = await deps.slack.stopStream(channel, streamTs, blocks);
        if (appended && stopped) return true;
        console.warn(`[slack] stream finish failed (append=${appended} stop=${stopped}); falling back to post`);
        if (!stopped) await deps.slack.stopStream(channel, streamTs).catch(() => {});
        return false;
      } catch (err) {
        if (!stopped) await deps.slack.stopStream(channel, streamTs).catch(() => {});
        throw err;
      }
    },

    // THE LADDER. A part goes out as the model's Markdown in one `markdown`
    // block, which renders tables, headings, lists, links and code as
    // written — the `section` blocks this used to post are mrkdwn-only, so
    // every table became `• a — b — c` lines with its header row gone. If
    // Slack refuses the block, the part steps down to those `section` blocks,
    // footer and all; if it refuses them too, to bare text. Each step down
    // logs what Slack said, so a refusal is a line in the tail rather than a
    // worse-looking answer nobody can explain.
    //
    // Only a refusal of the BLOCKS steps down a rung (`refusedForBlocks`).
    // Any other failure — rate limit, missing channel — would refuse the
    // section rung too, so it goes straight to bare text: a doomed post costs
    // two calls, not three.
    //
    // A part carrying a table or a Sources box has one rung more, at the top:
    // the same Markdown without them, the rows appended as a plain list and
    // the links as a line. Any block refusal while either is aboard counts as
    // theirs, rather than only one whose json-pointer lands on it. They are
    // the newest and least proven blocks in the message, Slack does not always
    // point (`invalid_blocks` can arrive with no messages at all), and the
    // costs are lopsided: blaming the table wrongly spends one extra call
    // before the section rung, while missing a table refusal would drop the
    // prose's Markdown to sections for nothing.
    //
    // The `text` copy is the whole part on every rung: notifications and
    // screen readers read it, and `postMessage` renders it to mrkdwn.
    //
    // A split answer's `(i/n)` is a context line under the part on the block
    // rungs. The section and bare-text rungs have no such line to give it, so
    // there it leads the part as `_(i/n)_`, the way every part once did.
    //
    // Every rung posts with link previews off: an answer's links are cited,
    // not shown, and a thread of unfurls buries the answer.
    async post(piece, withFooter, marker) {
      const footing = withFooter ? footer : [];
      const tail = [...markerBlocks(marker), ...footing];
      const copy = copyOf(piece, withFooter);
      const send = (blocks?: Array<Record<string, unknown>>, text = copy) =>
        deps.slack
          .postMessage({
            channel,
            thread_ts: threadTs,
            text,
            ...(blocks ? { blocks } : {}),
            unfurl_links: false,
            unfurl_media: false,
          })
          .catch((err: unknown) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) }));

      const dressed = withFooter && extraBlocks.length > 0;
      const first = [{ type: "markdown", text: piece }, ...(dressed ? extraBlocks : []), ...tail];
      // The feedback buttons ride the first rung only, at its very end. Any
      // block refusal while they are aboard drops them and resends the same
      // message — the table's rule, one rung higher: they are the newest
      // block in the message, and a missing vote costs less than a worse answer.
      const voting = withFooter && feedback.length > 0;
      let posted = await send(voting ? [...first, ...feedback] : first);
      if (posted.ok) return true;
      if (voting && refusedForBlocks(posted)) {
        console.warn(`[slack] feedback buttons refused (${refusalOf(posted)}); retrying without them`);
        posted = await send(first);
        if (posted.ok) return true;
      }
      // A table or box steps down first, to the same answer without them, the
      // rows as a plain list and the links as a line in the Markdown — so a
      // rendering problem never costs the reader either. Every rung below
      // carries them too.
      const prose = dressed ? copy : piece;
      if (dressed && refusedForBlocks(posted)) {
        const what = [resultTable && "result table", box && "Sources box"].filter(Boolean).join(" and ");
        console.warn(`[slack] ${what} refused (${refusalOf(posted)}); retrying without, as text`);
        posted = await send([{ type: "markdown", text: prose }, ...tail]);
        if (posted.ok) return true;
      }
      const numbered = (text: string) => (marker ? `_${marker}_\n\n${text}` : text);
      if (refusedForBlocks(posted)) {
        console.warn(`[slack] markdown block refused (${refusalOf(posted)}); retrying as section blocks`);
        posted = await send([...textSections(numbered(prose)), ...footing], numbered(copy));
        if (posted.ok) return true;
      }
      console.warn(`[slack] ${refusedForBlocks(posted) ? "section blocks refused" : "post failed"} (${refusalOf(posted)}); retrying as plain text`);
      posted = await send(undefined, numbered(copy));
      return !!posted.ok;
    },
  });

  return { ok, text: withBox(textCopy(body, presentation)) };
}
