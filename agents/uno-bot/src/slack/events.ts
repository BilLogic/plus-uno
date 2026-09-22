import type { Env } from "../types";
import { charge } from "../net";
import { looksLikeCorrection } from "../agent/run-agent";
import { DM_CONVERSATION, type Execution, type HistoryTurn, type PendingProposal } from "../thread-state/index";
import { threadStateFor } from "../thread-state/production";
import { conversationsReplies, getBotIdentity, postMessage } from "./api";
import { buildFailureMessage } from "./failure-message";
import { handleAgentDmOpened, handleAppContextChanged } from "./assistant";
import { handleSessionStopped } from "./stop-envelope";
import { handleAppHomeOpened } from "./home";
import { handleReaction } from "./gate";
import { cutOffRunJob, handleCutOffRun } from "./cut-off-sweep";
import { extractPrdFromThreadRoot } from "./notion-prd";
import {
  type SlackMessageEvent,
  type SlackAppMentionEvent,
  type SlackReactionAddedEvent,
  type SlackInnerEvent,
  type SlackEventCallback,
  type SlackUrlVerification,
  type SlackEnvelope,
  type SlackAppHomeOpenedEvent,
  type SlackAppContextChangedEvent,
  type SlackAgentSessionStoppedEvent,
  type RunnerJobPayload,
} from "./types";
import { historyVisionTurn } from "./vision-reference";
import { appMentionToMessage } from "./event-provenance";
import {
  canvasIdsSharedBySlackHistoryMessage,
  messageTextWithCanvasAttachments,
} from "./canvas-reference";
import { postVisibleFailure, isCapacityError } from "./delivery";
import { postingDeps } from "./slack-delivery";
import { runSlackTurn } from "./turn-adapter";
import { stripBotMentions } from "./mention";
import { cardThreadOf, turnSurfaceOf } from "../turn/request";

// Re-exported for index.ts (SlackEnvelope) + agent-runner.ts (RunnerJobPayload)
// and any other importer that still reaches for the Slack wire types here.
export type {
  SlackEventFile,
  SlackMessageEvent,
  SlackAppMentionEvent,
  SlackReactionAddedEvent,
  SlackInnerEvent,
  SlackEventCallback,
  SlackUrlVerification,
  SlackEnvelope,
  RunnerJobPayload,
} from "./types";

export async function handleSlackEnvelope(env: Env, body: SlackEnvelope): Promise<Response> {
  if (body.type === "url_verification") {
    const challenge = (body as SlackUrlVerification).challenge;
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }

  if (body.type === "event_callback") {
    const cb = body as SlackEventCallback;
    // Fails OPEN on a store error, as the client did: double-processing is a
    // worse-case we accept, and missing a real event is not.
    const dedup = await threadStateFor(env)
      .checkAndRecordEvent(cb.event_id)
      .catch(() => ({ seen: false }));
    if (dedup.seen) {
      console.log(`[slack] dedup: skipping ${cb.event_id}`);
      return new Response("ok", { status: 200 });
    }
    await dispatchInnerEvent(env, cb.event);
  }

  return new Response("ok", { status: 200 });
}

async function dispatchInnerEvent(env: Env, event: SlackInnerEvent): Promise<void> {
  switch (event.type) {
    case "message": {
      const msg = event as SlackMessageEvent;
      if (await shouldHandleMessage(env, msg)) {
        await enqueueAgentJob(env, { kind: "message", event: msg }, conversationKey(msg));
      } else {
        console.log("[slack] ignoring message — no @mention and not an active bot thread");
      }
      return;
    }
    case "app_mention": {
      // Explicit @mention always engages.
      const msg = appMentionToMessage(event as SlackAppMentionEvent);
      await enqueueAgentJob(env, { kind: "message", event: msg }, conversationKey(msg));
      return;
    }
    case "reaction_added": {
      // Reactions can confirm a proposal, which executes the real tool (Notion
      // card, workflow dispatch, email) — same waitUntil() 30s-cancellation
      // exposure as agent runs, so route through the runner too. Keyed by the
      // reacted message so confirmations on one proposal stay ordered.
      const r = event as SlackReactionAddedEvent;
      await enqueueAgentJob(env, { kind: "reaction", event: r }, `${r.item.channel}:${r.item.ts}`);
      return;
    }
    // assistant_thread_started / assistant_thread_context_changed are gone with
    // the agent_view migration (2026-08-06). They no longer fire on this app's
    // surface; app_home_opened(tab:"messages") and app_context_changed below
    // are their replacements. Unsubscribed in the manifest too, so an arrival
    // would be a Slack-side surprise worth seeing in the unhandled log.
    case "app_home_opened": {
      const e = event as SlackAppHomeOpenedEvent;
      // Two surfaces, one event. tab==="home" publishes the landing view;
      // tab==="messages" is agent_view's DM-opened signal (the replacement for
      // assistant_thread_started) and refreshes the suggested prompts.
      if (e.tab === "messages") {
        await handleAgentDmOpened(env, e.channel, e.user);
        return;
      }
      await handleAppHomeOpened(env, e);
      return;
    }
    case "app_context_changed": {
      // agent_view's replacement for assistant_thread_context_changed: the user
      // switched what they're looking at. Stored under the DM conversation key
      // so the next message grounds on it. No user-visible output.
      await handleAppContextChanged(env, event as SlackAppContextChangedEvent, DM_CONVERSATION);
      return;
    }
    case "agent_session_stopped": {
      // Slack's own stop control, which exists only because this app now
      // subscribes to the event (#576). It is the third door into the one
      // cancel path, beside `/stop` and the Home-tab button, and the only one
      // reachable from the thread the person is already reading.
      //
      // Handled INLINE rather than enqueued onto the AgentRunner. The runner
      // serialises work per thread, and the work this thread is running is
      // exactly what the press is trying to stop — a stop queued behind it
      // would arrive after the run it was meant to interrupt. It is also two
      // Slack calls and two store reads, which fits the ack window that the
      // enqueue exists to protect long runs from.
      await handleSessionStopped(env, event as SlackAgentSessionStoppedEvent);
      return;
    }
    default:
      console.log(`[slack] unhandled event type: ${event.type}`);
      return;
  }
}

// Hand the work to the per-thread AgentRunner DO instead of running it here:
// this Worker invocation lives inside ctx.waitUntil(), which Cloudflare cancels
// ~30s after the Slack ack — any longer run died silently mid-flight
// ("👀 then silence", live incident 2026-07-09). DO alarms have no such cutoff.
// Keyed per thread so runs within a thread stay ordered.
// Exported for the slash-command route (commands.ts), which builds a synthetic
// `message` job so a /uno-* run is an ordinary thread from here down.
export async function enqueueAgentJob(env: Env, job: RunnerJobPayload, threadKey: string): Promise<void> {
  const stub = env.AGENT_RUNNER.get(env.AGENT_RUNNER.idFromName(threadKey));
  charge(1, "agent-runner"); // DO stub call — a subrequest the meter can't see.
  const res = await stub.fetch("https://do/enqueue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ job, enqueuedAt: Date.now() }),
  });
  if (!res.ok) {
    // Enqueue is the only step left in the Worker — a failure here IS the
    // 👀-then-silence path, so make it visible instead. A dropped REACTION job
    // is a silently-ignored ✅/❌ (the exact "approved then nothing" failure
    // this codebase fights elsewhere), so warn on both job kinds — each posts
    // into its own thread.
    console.error(`[slack] runner enqueue failed (${job.kind}): ${res.status}`);
    // A cut-off job has nobody waiting on it: the record stays untaken, and
    // the ThreadState alarm hands it over again.
    if (job.kind === "cut-off") return;
    const target =
      job.kind === "message"
        ? { channel: job.event.channel, thread_ts: replyThreadTs(job.event) }
        : { channel: job.event.item.channel, thread_ts: job.event.item.ts };
    await postMessage(env, {
      ...target,
      text: ":warning: I couldn't start on that one — try again, and if it repeats flag it in #uno-bot.",
    }).catch(() => {});
  }
}

/**
 * The ThreadState alarm's `handOffCutOffRuns`, bound to `Env`: one AgentRunner
 * job per cut-off run it found. Taking nothing is the point — the job takes,
 * as a look does, so a hand-off that never lands leaves the record for the
 * alarm's next pass.
 */
export function handOffCutOffRunsFor(env: Env): (due: Execution[]) => Promise<void> {
  return async (due) => {
    for (const execution of due) {
      const { job, threadKey } = cutOffRunJob(execution);
      await enqueueAgentJob(env, job, threadKey);
    }
  };
}

// (The open-stream registry that lived here is gone: a stream is now opened and
// closed inside delivery, within one function, so there is no window in which a
// turn can end holding one.)

// Entry point the AgentRunner DO alarm calls. Runs OUTSIDE waitUntil — no 30s
// cutoff, fresh subrequest budget per alarm invocation. Returns "deferred" when
// the turn's run-lease is held by another (possibly killed) invocation — the
// runner must then KEEP the job and retry later instead of deleting it.
export async function onRunnerJob(env: Env, job: RunnerJobPayload): Promise<"handled" | "deferred"> {
  if (job.kind === "cut-off") {
    await handleCutOffRun(env, job.proposalTs);
    return "handled";
  }
  if (job.kind === "reaction") {
    await handleReaction(env, job.event);
    return "handled";
  }
  return onMessageVisiblyFailing(env, job.event);
}

// Outermost catch WITH channel/thread context. onMessage already posts a
// visible ❌ for its known failure points (context load, agent call, delivery),
// but an exception past those (preflight, DO history writes, proposal staging)
// used to bubble to the waitUntil catch in index.ts — logged, invisible to the
// user ("reacted 👀 then silence"). Backstop it here, best-effort; never throw
// from the catch.
async function onMessageVisiblyFailing(env: Env, msg: SlackMessageEvent): Promise<"handled" | "deferred"> {
  try {
    return await onMessage(env, msg);
  } catch (err) {
    console.error(`[slack] onMessage failed: ${err instanceof Error ? err.message : String(err)}`);
    await postMessage(env, {
      channel: msg.channel,
      thread_ts: replyThreadTs(msg),
      // This is the outermost catch, so it genuinely knows the least: the
      // "internal" stage promises correspondingly little. The named stages
      // (context / agent / delivery) are raised at their own call sites.
      text: buildFailureMessage({
        stage: "internal",
        capacity: isCapacityError(err),
        alertChannel: env.UNO_BOT_ALERT_CHANNEL,
      }),
    }).catch(() => {});
    return "handled";
  }
}

// ── DM = chat, channel = thread ──────────────────────────────────────────────
//
// Under agent_view a DM with the app reads as an ordinary direct message, not a
// list of threads. That splits one value this file used to treat as one thing:
//
//   replyThreadTs()   where a REPLY goes.  undefined = post at channel level.
//   conversationTs()  what identifies the CONVERSATION, for history and for the
//                     per-conversation AgentRunner key.
//
// In a channel they stay identical — an @mention opens a thread and everything
// hangs off its root, unchanged. In a DM they diverge: replies land inline, and
// the whole DM is one rolling conversation instead of one per message.
//
// A DM the user explicitly threaded still threads: agent_view keeps in-thread
// replies, so an opened thread is a deliberate signal, not a leftover.
type ThreadedEvent = { channel: string; ts: string; thread_ts?: string };

function isDm(channel: string): boolean {
  return turnSurfaceOf(channel) === "assistant";
}

// Where the reply goes. In a channel: the existing thread, else a new one under
// the message. In a DM: the existing thread, else a NEW thread under the user's
// message.
//
// That DM branch reverses 74f1b17c ("DMs are chat, not threads"), deliberately
// and with the tradeoff understood. chat.startStream requires a thread_ts, and
// so does agents.sessions.setStatus on a thread-based session — with a
// threadless DM there is no way to show a working signal at all, which is the
// affordance agent_view is supposed to bring. Slack's own agent experience is
// threaded for this reason:
// their docs describe "threads shown in a timeline above the composer".
//
// Conversation continuity is unaffected: the user still types in the composer,
// so their next message arrives unthreaded and conversationTs() still resolves
// every DM line to DM_CONVERSATION.
function replyThreadTs(e: ThreadedEvent): string | undefined {
  return e.thread_ts ?? e.ts;
}

// Constant, not the message ts: every unthreaded message in a DM has to resolve
// to the SAME conversation, or each line would start with an empty history —
// `DM_CONVERSATION`, stated once in the thread store.

function conversationTs(e: ThreadedEvent): string {
  return isDm(e.channel) ? (e.thread_ts ?? DM_CONVERSATION) : (e.thread_ts ?? e.ts);
}

function conversationKey(e: ThreadedEvent): string {
  return `${e.channel}:${conversationTs(e)}`;
}

function isUserTurn(event: SlackMessageEvent): boolean {
  if (event.bot_id) return false;
  if (event.subtype) return false;
  if (!event.text) return false;
  if (!event.user) return false;
  return true;
}

// Gate for plain `message` events: should the bot engage at all? Slack delivers
// a `message` event for EVERY message in a channel the bot is a member of, so
// without this the bot replies to everything (e.g. someone typing "implement"
// with no @mention). It engages only on: a DM, an explicit @mention in the text,
// or a follow-up inside a thread it is already part of (an active proposal, or
// the bot has already posted there) so replies don't need a re-mention. A
// top-level channel message with no @mention is ignored. (app_mention events
// bypass this entirely — they are always an explicit mention.)
async function shouldHandleMessage(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!isUserTurn(event)) return false;

  // An app DM is direct to the bot. Which channel ids those are is
  // `turn/request.ts` § `turnSurfaceOf`, not a literal here (#595).
  if (isDm(event.channel)) return true;

  const identity = await getBotIdentity(env);
  // Explicit @mention of the bot anywhere in the text.
  if (identity && event.text?.includes(`<@${identity.userId}>`)) return true;

  // No @mention: only engage as a follow-up inside a thread the bot is in.
  if (!event.thread_ts) return false; // top-level, no mention -> ignore

  // Thread reply with no mention: engage if the bot is already part of this
  // thread, so a conversation flows without re-mentioning on every turn (e.g.
  // the bot asked for a PRD and the user pastes it back). Check cheap -> robust:
  //   1) an active proposal (confirm/cancel window)
  //   2) the DO history — the bot writes a turn there EVERY time it replies, so
  //      a non-empty history means the bot has engaged in this thread already
  //   3) the live thread — the root @mentioned the bot, or the bot has posted
  //      (covers threads whose DO history was pruned, and replies that arrive
  //       before the bot has answered the mentioned root)
  // On any lookup error, FAIL OPEN for a thread reply: silently dropping a
  // follow-up (a "frozen" bot) is worse than an occasional extra reply.
  try {
    const store = threadStateFor(env);
    const ref = { channel: event.channel, thread: event.thread_ts };
    const pending = await store.getProposalByThread(ref);
    if (pending) return true;

    const history = await store.readHistory(ref);
    if (history.length > 0) return true;

    if (identity) {
      const replies = await conversationsReplies(env, event.channel, event.thread_ts, 50);
      const msgs = Array.isArray(replies.messages) ? replies.messages : [];
      // The thread ROOT @mentioned the bot -> the whole thread is a bot
      // conversation; replies never need to re-mention it (even before the bot
      // has answered). conversations.replies returns the parent first.
      const root = msgs[0];
      if (root?.text?.includes(`<@${identity.userId}>`)) return true;
      // Or the bot has already posted in the thread.
      const botInThread = msgs.some(
        (m) => m.user === identity.userId || (!!m.bot_id && m.bot_id === identity.botId),
      );
      if (botInThread) return true;
    }
    return false;
  } catch (err) {
    console.warn(
      `[slack] thread-engagement check failed, engaging (fail-open): ${err instanceof Error ? err.message : String(err)}`,
    );
    return true;
  }
}

async function onMessage(env: Env, event: SlackMessageEvent): Promise<"handled" | "deferred"> {
  if (!isUserTurn(event)) {
    console.log(`[slack] skipping subtype=${event.subtype ?? ""} bot=${event.bot_id ?? ""}`);
    return "handled";
  }

  // Per-message dedup: Slack delivers app_mention AND message.channels for the
  // same message when the bot is @-mentioned in a channel it has history for.
  // Both events have different event_ids so the envelope-level dedup misses
  // them. Key by (channel, ts) which uniquely identifies the user's message.
  //
  // Lease semantics (not one-shot): the turn is claimed as "running" here and
  // marked "done" below when it finishes. A deploy mid-run hard-kills the
  // invocation with no finally, so the alarm retry that follows must NOT be
  // swallowed as a duplicate — it defers while the lease is fresh and reclaims
  // (re-runs the turn) once the lease is stale. Before this, a killed run left
  // its marker stuck "in-flight" and every retry no-opped: 👀-then-silence,
  // permanently (live incident 2026-07-10, test-1 run killed by a deploy).
  // Does Slack actually put an action_token on message events? The method docs
  // say "from the triggering event payload" without naming the field, and
  // bot-token search is inert without one. PRESENCE only — the token itself
  // never reaches a log.
  console.log(`[slack] msg ${event.channel}/${event.ts} action_token=${!!event.action_token}`);
  const runKey = `msg:${event.channel}:${event.ts}`;
  const store = threadStateFor(env);
  // Fails OPEN like the envelope dedup above: an unreachable store re-runs the
  // turn rather than dropping it.
  const claim = await store.claimRun(runKey).catch(() => "claimed" as const);
  if (claim === "done") {
    console.log(`[slack] dedup: msg ${event.channel}/${event.ts} already handled`);
    return "handled";
  }
  if (claim === "running") {
    console.log(
      `[slack] dedup: msg ${event.channel}/${event.ts} in-flight — deferring (reclaims if the run died)`,
    );
    return "deferred";
  }

  try {
    await handleUserMessage(env, event);
  } finally {
    // Also marks done on a throw: the thrown path posts a visible ❌ upstream,
    // which counts as handled. Only a hard kill skips this — by design, so the
    // lease can rescue it.
    // Best-effort by contract: a missed mark self-heals when the lease goes
    // stale, at the cost of one re-run.
    await store.markRunDone(runKey).catch(() => {});
    // No status clear here. Turn raises the working signal and Turn takes it
    // down, in one `finally` around every exit it has (#555) — a second owner
    // here could only clear the surfaces IT knew about, which is how a channel
    // thread kept the indicator a DM-gated clear never reached.
    //
    // ONE SANCTIONED EXCEPTION, added #576: the in-thread stop door settles the
    // session itself when Slack's stop control is pressed, because Slack says
    // plainly that the press moves no status of its own. It escapes the defect
    // above by construction — the event names the exact channel and thread, so
    // there is no surface it could fail to know about — and it settles by the
    // same card-based rule the turn uses, so the two writers agree on every
    // ending that consults the card. It is the only other settler there is.
  }
  return "handled";
}

async function handleUserMessage(env: Env, event: SlackMessageEvent): Promise<void> {
  const channel = event.channel;
  const userId = event.user!;
  const threadTs = replyThreadTs(event);
  // History and the runner's ordering key on the CONVERSATION, which in a DM is
  // the whole channel — threadTs above is the post target, and the key the
  // pending card is held on.
  const convTs = conversationTs(event);
  const text = stripBotMentions(event.text!, (await getBotIdentity(env))?.userId);

  // Where the person's turn is running, so the Home-tab Stop button can find
  // it. Fire-and-forget: this is a convenience control and must never sit in
  // front of an answer.
  void threadStateFor(env)
    .setActiveRun(userId, { channel, thread: convTs })
    .catch(() => {});

  // Does this message read as the person correcting the previous reply? The
  // TEXT-ONLY half of the test, and all it decides here is whether the history
  // rebuild pays one extra hop for the retrieval receipts — a cheap read, and
  // harmless when the guess is wrong. The other half ("is there actually a
  // previous reply to correct?") needs the history, so Turn applies it.
  const textReadsAsCorrection = looksLikeCorrection(text);

  // If this message is a thread reply (not the thread root itself), check the
  // parent message for a Notion PRD URL — that is how a PRD reaches the
  // implement workflow from the polling bot's notification.
  const isThreadReply = !!event.thread_ts && event.thread_ts !== event.ts;

  // Loading thread context runs BEFORE the turn, so a throw here (a Slack
  // history read, a store lookup, the Notion PRD extraction) must not be
  // silent — post a visible error rather than letting the handler die quietly.
  let history: Awaited<ReturnType<typeof buildThreadHistory>>;
  let pending: PendingProposal | null;
  let prd: Awaited<ReturnType<typeof extractPrdFromThreadRoot>>;
  try {
    [history, pending, prd] = await Promise.all([
      buildThreadHistory(env, channel, convTs, event.thread_ts, event.ts, textReadsAsCorrection),
      // The card, by contrast, is the REPLY THREAD's: in a DM a card staged
      // under one ask is no business of the next unthreaded ask.
      threadStateFor(env).getProposalByThread({
        channel,
        thread: cardThreadOf({ conversationTs: convTs, ...(threadTs ? { replyTs: threadTs } : {}) }),
      }),
      isThreadReply
        ? extractPrdFromThreadRoot(env, channel, event.thread_ts!)
        : Promise.resolve(null),
    ]);
  } catch (err) {
    console.error(`[slack] context load failed: ${err instanceof Error ? err.message : String(err)}`);
    await postVisibleFailure(postingDeps(env), channel, threadTs, event.ts, err, "context");
    return;
  }

  // Envelope to request to outcome. Everything the turn decides is
  // `turn/turn.ts`; everything it shows the person goes out through the Slack
  // Delivery adapter, which the request's dependencies carry.
  const outcome = await runSlackTurn(env, event, {
    conversationTs: convTs,
    ...(threadTs ? { replyTs: threadTs } : {}),
    text,
    history,
    pending,
    prd,
  });
  console.log(
    `[turn] ${outcome.disposition} tier=${outcome.telemetry.tier} route=${outcome.telemetry.route} ` +
      `tools=[${outcome.telemetry.tools.join(",")}] interim=${outcome.telemetry.interim} ` +
      `wrote=${outcome.wrote.turns.length} compacted=${outcome.wrote.compacted}`,
  );
}

// Build the bot's memory from the ACTUAL Slack thread, so it sees every message
// in the thread — humans' messages, its own posts (including the Notion links
// and proposals it side-posts), and poll notifications — and can't "forget"
// what it did. The bot's own messages map to `assistant`; everyone else maps to
// `user`. Falls back to the Durable Object history if the thread read fails or
// the bot's identity is unknown. The current message is excluded (it's passed
// separately as userText). buildMessages() in run-agent merges any consecutive
// same-role turns this produces.
const THREAD_HISTORY_LIMIT = 100;

// Two different ts values on purpose (see replyThreadTs/conversationTs):
//   convTs   — the conversation's identity, for the DO-history fallback.
//   threadTs — a REAL Slack thread root, when one exists. conversations.replies
//              needs one; an agent_view DM has none, so that read is skipped and
//              the DO history is the only source. Passing convTs there would ask
//              Slack for a thread called "dm".
async function buildThreadHistory(
  env: Env,
  channel: string,
  convTs: string,
  threadTs: string | undefined,
  currentTs: string,
  // Retrieval receipts live in the Durable Object, but this function rebuilds
  // history from RAW SLACK TEXT and returns without touching the DO on the
  // common path — so a receipt is invisible unless it is merged back in by
  // message ts. That merge costs one extra DO hop, so it is only done on the
  // turn that needs it: a correction, where "what did I actually look up last
  // time" is the whole question.
  wantReceipts = false,
): Promise<HistoryTurn[]> {
  const store = threadStateFor(env);
  const ref = { channel, thread: convTs };
  if (!threadTs) return store.readHistory(ref);
  try {
    const [identity, replies, stored] = await Promise.all([
      getBotIdentity(env),
      conversationsReplies(env, channel, threadTs, THREAD_HISTORY_LIMIT),
      wantReceipts ? store.readHistory(ref).catch(() => []) : Promise.resolve([]),
    ]);
    const receiptsByTs = new Map<string, NonNullable<HistoryTurn["retrieval"]>>();
    // Reference receipts merge on the same key, on the same turns: the names
    // a turn read are the counter-evidence a correction turn checks the prior
    // prose against, and cost one line each (#423).
    const referencesByTs = new Map<string, string[]>();
    for (const t of stored) {
      if (t.ts && t.retrieval) receiptsByTs.set(t.ts, t.retrieval);
      if (t.ts && t.references?.length) referencesByTs.set(t.ts, t.references);
    }
    if (identity && replies.ok && replies.messages?.length) {
      const turns: HistoryTurn[] = [];
      for (const m of replies.messages) {
        if (m.ts === currentTs) continue;
        const isBot = m.user === identity.userId || (!!m.bot_id && m.bot_id === identity.botId);
        const rawContent = stripBotMentions(m.text ?? "", identity.userId);
        const canvasContent = messageTextWithCanvasAttachments(rawContent, m.files);
        const sharedCanvasIds = canvasIdsSharedBySlackHistoryMessage({
          user: m.user,
          bot_id: m.bot_id,
          text: rawContent,
          files: m.files,
        });
        const visionTurn = isBot
          ? (rawContent ? { content: rawContent } : null)
          : historyVisionTurn(canvasContent, m.files);
        if (!visionTurn && !sharedCanvasIds.length) continue;
        const receipt = m.ts ? receiptsByTs.get(m.ts) : undefined;
        const references = m.ts ? referencesByTs.get(m.ts) : undefined;
        turns.push({
          role: isBot ? "assistant" : "user",
          content: visionTurn?.content ?? "[Canvas shared]",
          ...(m.ts ? { ts: m.ts } : {}),
          ...(receipt ? { retrieval: receipt } : {}),
          ...(references ? { references } : {}),
          ...(visionTurn?.vision ? { vision: visionTurn.vision } : {}),
          ...(sharedCanvasIds.length ? { sharedCanvasIds } : {}),
        });
      }
      if (turns.length) return turns;
    }
  } catch (err) {
    console.warn(`[history] thread read failed, using DO fallback: ${err instanceof Error ? err.message : String(err)}`);
  }
  return store.readHistory(ref);
}
