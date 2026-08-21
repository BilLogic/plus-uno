import type { Env } from "../types";
import { charge } from "../net";
import { runAgent, type AgentResult } from "../agent/run-agent";
import {
  bareResolution,
  looksLikeCorrection,
  correctionDirective,
  withTurnScope,
} from "../agent/loop-shared";
import { routeRequest } from "../agent/routing";
import { resolveProposal } from "../agent/resolve-proposal";
import {
  appendHistory,
  recordExchange,
  claimEventRun,
  deletePendingProposal,
  isDuplicateEvent,
  loadAssistantContext,
  loadHistory,
  loadPendingProposalByThread,
  markEventRunDone,
  markActiveRun,
  savePendingProposal,
  type HistoryTurn,
} from "../thread-state-client";
import {
  addReaction,
  appendTask,
  conversationsHistoryBefore,
  conversationsReplies,
  getBotIdentity,
  postMessage,
  startStream,
  stopStream,
} from "./api";
import { parseScope } from "../agent/scope-keywords";
import { reactOnlyEmoji } from "./react-only";
import { ANTECEDENT_LIMIT, formatAntecedent, needsAntecedent } from "./antecedent";
import { buildContextBlock, compactHistory } from "../agent/context-state";
import { buildFailureMessage } from "./failure-message";
import {
  handleAgentDmOpened,
  handleAppContextChanged,
  setStatus,
  setAssistantTitle,
  threadTitleFrom,
  isAssistantThread,
  formatAssistantContext,
} from "./assistant";
import { handleAppHomeOpened } from "./home";
import { handleReaction } from "./gate";
import { extractPrdFromThreadRoot } from "./notion-prd";
import { preflight } from "../agent/preflight";
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
  type RunnerJobPayload,
} from "./types";
import { collectVisionInputs } from "./vision";
import { postVisibleFailure, postTextVerified, renderDeliveredBody, isCapacityError } from "./delivery";
import { reviewDraft } from "../agent/draft-judge";
import {
  judgeConfidence,
  needsRepair,
  repairInstruction,
  retrievalRanIn,
  type ConfidenceVerdict,
} from "../agent/confidence";
import {
  formatProposal,
  formatNotionUpdateProposal,
  proposalVerb,
  buildImplementDesignProposal,
} from "./proposal-render";
import {
  describeNotionTarget,
  normalizeName,
  parseNotionPageId,
  fetchPageTitles,
} from "../integrations/notion";

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
    if (await isDuplicateEvent(env, cb.event_id)) {
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

// (The open-stream registry that lived here is gone: a stream is now opened and
// closed inside delivery, within one function, so there is no window in which a
// turn can end holding one.)

// Entry point the AgentRunner DO alarm calls. Runs OUTSIDE waitUntil — no 30s
// cutoff, fresh subrequest budget per alarm invocation. Returns "deferred" when
// the turn's run-lease is held by another (possibly killed) invocation — the
// runner must then KEEP the job and retry later instead of deleting it.
export async function onRunnerJob(env: Env, job: RunnerJobPayload): Promise<"handled" | "deferred"> {
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
  return channel.startsWith("D");
}

// Where the reply goes. In a channel: the existing thread, else a new one under
// the message. In a DM: the existing thread, else a NEW thread under the user's
// message.
//
// That DM branch reverses 74f1b17c ("DMs are chat, not threads"), deliberately
// and with the tradeoff understood. chat.startStream requires a thread_ts, and
// so does assistant.threads.setStatus — with a threadless DM there is no way to
// show a thinking indicator at all, which is the affordance agent_view is
// supposed to bring. Slack's own agent experience is threaded for this reason:
// their docs describe "threads shown in a timeline above the composer".
//
// Conversation continuity is unaffected: the user still types in the composer,
// so their next message arrives unthreaded and conversationTs() still resolves
// every DM line to DM_CONVERSATION.
function replyThreadTs(e: ThreadedEvent): string | undefined {
  return e.thread_ts ?? e.ts;
}

// Constant, not the message ts: every unthreaded message in a DM has to resolve
// to the SAME conversation, or each line would start with an empty history.
const DM_CONVERSATION = "dm";

function conversationTs(e: ThreadedEvent): string {
  return isDm(e.channel) ? (e.thread_ts ?? DM_CONVERSATION) : (e.thread_ts ?? e.ts);
}

function conversationKey(e: ThreadedEvent): string {
  return `${e.channel}:${conversationTs(e)}`;
}

function appMentionToMessage(e: SlackAppMentionEvent): SlackMessageEvent {
  return {
    type: "message",
    channel: e.channel,
    user: e.user,
    text: e.text,
    ts: e.ts,
    thread_ts: e.thread_ts,
    files: e.files,
    action_token: e.action_token,
  };
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

  // DMs (channel id starts with "D") are direct to the bot.
  if (event.channel.startsWith("D")) return true;

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
    const pending = await loadPendingProposalByThread(env, event.channel, event.thread_ts);
    if (pending) return true;

    const history = await loadHistory(env, event.channel, event.thread_ts);
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
  const claim = await claimEventRun(env, runKey);
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
    await markEventRunDone(env, runKey);
    // Clear the assistant "thinking…" loader on every exit (success, early
    // return, or throw) — a stuck status line is worse than none. No-op off
    // the panel or if one was never set. Same thread_ts gate as the set: only
    // threaded DM turns (the panel's shape) can have a status to clear.
    if (isAssistantThread(event.channel)) {
      await setStatus(env, event.channel, event.thread_ts ?? event.ts, "").catch(() => {});
    }
  }
  return "handled";
}

async function handleUserMessage(env: Env, event: SlackMessageEvent): Promise<void> {
  const channel = event.channel;
  const userId = event.user!;
  const userMsgTs = event.ts;
  const threadTs = replyThreadTs(event);
  // History + runner ordering key on the CONVERSATION, which in a DM is the whole
  // channel — threadTs above may be undefined there and is only a post target.
  const convTs = conversationTs(event);
  const rawText = stripBotMentions(event.text!);

  // Leading scope keyword (`ds:`, `notion:`, …) — the asker saying where they
  // already know the answer lives. Stripped from the question and turned into
  // an instruction, so the model reads a clean question plus a hint about
  // where to start rather than a question with a prefix bolted on.
  const scoped = parseScope(rawText);
  const userText = scoped ? scoped.text : rawText;
  if (scoped) console.log(`[scope] ${scoped.scope.name}`);

  // Is the person telling us the last reply was wrong? Classified in the Worker,
  // not left to the prompt: on turn 2 the bot's own turn-1 claim is sitting in
  // context as authoritative prose, and a prompt rule has to beat that. A hit
  // forces `fresh: true` on search_blueprint, injects a one-turn directive
  // naming the prior query, pulls the retrieval receipts off the DO, and turns
  // on the judge's correction gate. See loop-shared looksLikeCorrection.
  // TEXT-ONLY half of the test. The other half — "is there actually a previous
  // reply to correct?" — needs the history, which is not loaded yet, so it is
  // applied at `isCorrection` below. This value only decides whether to pull
  // retrieval receipts off the DO, which is a cheap read and harmless when the
  // guess is wrong.
  const textReadsAsCorrection = looksLikeCorrection(userText);

  // Where the person's turn is running, so the Home-tab Stop button can find
  // it. Fire-and-forget: this is a convenience control and must never sit in
  // front of an answer.
  void markActiveRun(env, userId, channel, convTs);

  // ONE reaction, and only where nothing else says "I'm on it".
  //
  // The agent surface (DM) has assistant.threads.setStatus, a titled thread and
  // a streamed reply — three signals. Adding 👀 ⏳ ✅ on top made four, on a
  // message the person can already see is being handled. A channel has none of
  // those, so 👀 is the only acknowledgement there is; it stays there.
  if (!isAssistantThread(channel)) {
    await addReaction(env, channel, userMsgTs, "eyes");
  }

  // If this message is a thread reply (not the thread root itself), check the
  // parent message for a Notion PRD URL — that's how v1 carried PRD context
  // from the polling bot's notification into the implement workflow.
  const isThreadReply = !!event.thread_ts && event.thread_ts !== event.ts;

  // Loading thread context runs BEFORE the agent call, so a throw here (Slack
  // history read, DO lookup, Notion PRD extraction) must not be silent — post a
  // visible error instead of letting the async handler die quietly.
  let history: Awaited<ReturnType<typeof buildThreadHistory>>;
  let pending: Awaited<ReturnType<typeof loadPendingProposalByThread>>;
  let prd: Awaited<ReturnType<typeof extractPrdFromThreadRoot>>;
  try {
    [history, pending, prd] = await Promise.all([
      buildThreadHistory(env, channel, convTs, event.thread_ts, userMsgTs, textReadsAsCorrection),
      loadPendingProposalByThread(env, channel, convTs),
      isThreadReply
        ? extractPrdFromThreadRoot(env, channel, event.thread_ts!)
        : Promise.resolve(null),
    ]);
  } catch (err) {
    console.error(`[slack] context load failed: ${err instanceof Error ? err.message : String(err)}`);
    await postVisibleFailure(env, channel, threadTs, userMsgTs, err, "context");
    return;
  }

  // Deterministic confirm/cancel fast-path — a BARE confirmation on a pending
  // proposal never needs a model, on any provider. The reaction gate (✅/❌)
  // was already deterministic; text now matches it. Live failure 2026-07-10
  // (gemini): "go ahead" made the model re-stage an identical proposal and hit
  // the duplicate guard instead of resolving — the user's approval bounced.
  // Anything longer than a bare phrase still goes to the model (it may be a
  // modification request, not a plain yes/no).
  if (pending) {
    const bareDecision = bareResolution(userText); // shared vocabulary (loop-shared)
    if (bareDecision) {
      // Anyone in the thread may confirm/cancel (2026-07-14) — the requester lock
      // was removed here and everywhere else that gated on requesterUserId.
      await resolveProposal(env, pending, bareDecision);
      await recordExchange(
        env, channel, convTs, userText,
        bareDecision === "confirm" ? "(confirmed — executing the proposal)" : "Cancelled.",
      );
      return;
    }
  }

  // ── The `react` tier: an emoji, and no model call at all ───────────────────
  //
  // "thanks" / "got it" / "perfect" are the most common messages in a working
  // DM and the least informative. Each one costs a model round-trip, a
  // draft-judge call and a post, to produce a sentence nobody needed. A
  // reaction says the same thing for free (user decision, 2026-08-07).
  //
  // Every condition below exists to make a false positive impossible rather
  // than rare, because a false positive here IS the 👀-then-silence failure:
  //   • DM only — in a channel a bare "thanks" may not even be addressed to
  //     the bot, and a silent 🙏 on someone else's conversation is noise.
  //   • No pending proposal — "ok" is a CONFIRM_PHRASE. Reacting to an
  //     approval would leave the card unresolved and the person waiting.
  //   • The bot must have spoken already. An acknowledgement is a reply to
  //     something; "thanks" as an opening line is someone being polite before
  //     they ask, and it deserves an answer.
  //   • The bot's last message must not have ENDED IN A QUESTION. "want me to
  //     check Y next?" → "ok" means GO, not thank you. This is the only guard
  //     that distinguishes them, and without it the react tier eats work.
  //   • No attachments — an image with "nice" is not a trivial turn.
  //   • No scope keyword — someone who typed `ds:` is asking something.
  const lastBotTurn = [...history].reverse().find((t) => t.role === "assistant")?.content ?? "";
  const botAskedSomething = /\?\s*$/.test(lastBotTurn.trim());
  const reaction =
    isDm(channel) &&
    !pending &&
    !scoped &&
    history.length > 0 &&
    !botAskedSomething &&
    (event.files?.length ?? 0) === 0
      ? reactOnlyEmoji(userText)
      : null;
  if (reaction) {
    console.log(`[route] tier=react emoji=${reaction} (no model call)`);
    await addReaction(env, channel, userMsgTs, reaction).catch(() => {});
    // Still recorded. The exchange happened; a history with the user's "thanks"
    // missing would make the next turn read as though they never replied.
    await recordExchange(env, channel, convTs, userText, `(reacted :${reaction}:)`);
    return;
  }

  // Assistant-panel surface the user currently has open (best-effort; null off
  // the panel or when nothing is focused). Advisory grounding for deictic asks
  // — never assumed to be the subject otherwise. Loaded AFTER the fast-path so
  // a bare "yes" never pays the DO read; gated on thread_ts because panel
  // messages are always threaded (plain top-level DMs skip the lookup). May be
  // one hop stale: Slack doesn't order context_changed vs the message event.
  // Gated on being the assistant/DM surface, NOT on thread_ts: under agent_view
  // a DM has no thread, and requiring one skipped the lookup for every message
  // on the new surface — silently dropping the grounding that app_context_changed
  // stores. convTs already resolves to DM_CONVERSATION for a threadless DM, the
  // same key handleAppContextChanged writes under.
  // ROUTE FIRST, then gather. The reverse order — which this file used until
  // 2026-08-07 — meant a "thanks" in a long thread paid for the assistant-context
  // read AND the vision pass before anything knew the turn was trivial. Cheap
  // turns now skip both. routeRequest is a pure string check: no I/O, so putting
  // it first costs nothing.
  const { tier: previewTier, reason: routeWhy } = routeRequest({
    userText,
    hasPending: pending !== null,
    override: event.tierOverride,
  });
  const trivialTurn = previewTier === "chill";

  // Assistant-panel surface the user currently has open (best-effort; null off
  // the panel or when nothing is focused). Advisory grounding for deictic asks
  // — never assumed to be the subject otherwise.
  // Gated on being the assistant/DM surface, NOT on thread_ts: under agent_view
  // a DM has no thread, and requiring one skipped the lookup for every message
  // on the new surface — silently dropping the grounding that app_context_changed
  // stores. convTs already resolves to DM_CONVERSATION for a threadless DM, the
  // same key handleAppContextChanged writes under.
  const panelContext =
    !trivialTurn && isAssistantThread(channel)
      ? formatAssistantContext(await loadAssistantContext(env, channel, convTs))
      : null;

  // Vision: pasted images + a linked Figma frame become base64 image blocks on
  // the current turn. Guarded inside — a failure degrades to text-only.
  //
  // Skipped on a trivial turn UNLESS the message carries something visual: an
  // image with "thanks" is not a trivial turn, and deciding that from the text
  // alone would drop the attachment silently. A figma.com link counts — the
  // vision pass screenshots frames from TEXT, not just from files, so checking
  // files alone would have skipped it.
  const carriesFiles =
    (event.files?.length ?? 0) > 0 || /figma\.com/i.test(userText);
  const vision =
    trivialTurn && !carriesFiles
      ? { images: [], modelText: userText, historyText: userText }
      : await collectVisionInputs(env, event, userText);
  console.log(
    `[route] tier=${previewTier} why=${routeWhy} ctx=${trivialTurn && !carriesFiles ? "skipped" : "gathered"}`,
  );

  // ── What the model actually reads, assembled ───────────────────────────────
  //
  // Order matters and is deliberate: the QUESTION first, everything advisory
  // after it. A prompt that opens with three system blocks and buries the ask
  // at the bottom is a prompt whose answer is about the blocks.
  const modelBlocks: string[] = [vision.modelText];

  // The scope hint, if they typed one. Where to START, never a filter — see
  // scope-keywords.ts.
  if (scoped) modelBlocks.push(`(system: SCOPE — ${scoped.scope.instruction})`);

  // The antecedent window: what "this" points at. Only for a top-level channel
  // @mention with a dangling pronoun, and only ever ONE page of the channel the
  // event came from. Everything about the narrowness is in antecedent.ts.
  if (!event.thread_ts && !isDm(channel) && !trivialTurn && needsAntecedent(userText)) {
    const before = await conversationsHistoryBefore(env, channel, userMsgTs, ANTECEDENT_LIMIT).catch(() => []);
    const usable = before.filter((m) => !m.subtype && (m.text ?? "").trim());
    const block = formatAntecedent(
      usable.map((m) => ({ author: m.user ? `<@${m.user}>` : "someone", text: m.text ?? "" })),
    );
    if (block) modelBlocks.push(block);
    console.log(`[antecedent] read=${before.length} used=${usable.length} injected=${block ? "yes" : "no"}`);
  }

  // The correction directive. Injected for ONE turn only (it is built from this
  // message, never persisted), naming the query the previous turn ran so it
  // cannot be reissued verbatim and called a re-check.
  const priorAssistantTurn = [...history].reverse().find((t) => t.role === "assistant");
  // Receipts are attached to the USER turn of the exchange they describe (see
  // the append below for why), so the search is by receipt, not by role.
  const priorReceipt = [...history].reverse().find((t) => t.retrieval)?.retrieval;
  // A correction needs something to correct. Without a previous assistant turn
  // the directive tells the model to treat "your own earlier claim" as
  // unverified when there is no earlier claim, and the judge gate demands the
  // reply either cite a fetch made this turn or concede an error it never made
  // — unsatisfiable by construction, so the first message of a conversation
  // could only ever fail it. The text patterns lean broad on purpose; this is
  // the guard that keeps that safe.
  const isCorrection = textReadsAsCorrection && Boolean(priorAssistantTurn);
  if (isCorrection) {
    modelBlocks.push(correctionDirective(priorReceipt?.query));
    console.log(
      `[correction] detected prior_query=${priorReceipt?.query ?? "(none)"} receipt=${priorReceipt ? "yes" : "no"}`,
    );
  }

  // Phase 5 — structured state + drift detection. FLAGGED OFF by default; see
  // the header of context-state.ts for why this one does not get to ship on.
  if (env.CONTEXT_STATE === "on") {
    const block = buildContextBlock(history, userText);
    if (block) modelBlocks.push(block);
  }
  const modelText = modelBlocks.join("\n\n");

  // Progressive summarisation, same flag. Replaces the dropped middle of a long
  // conversation with a COUNT rather than deleting it silently — a model told
  // the record is partial can say so; a model handed a gap reasons across it.
  const historyForModel =
    env.CONTEXT_STATE === "on"
      ? compactHistory(history, { keepRecent: 12, maxChars: 12_000 }).turns
      : history;
  // ts of the stream opened for this turn, threaded down to delivery so the
  // answer closes the same message the indicator lives in. Null = no stream,
  // deliver normally.
  if (previewTier !== "chill" || vision.images.length > 0) {
    if (isAssistantThread(channel)) {
      // setStatus IS the thinking indicator on an App thread — the documented
      // one ("await setStatus({ status: 'Thinking...' })"), and it also opens
      // the thread. Cleared on every exit path in onMessage's finally.
      //
      // The stream is deliberately NOT opened here. It used to be, to act as the
      // indicator, and that was wrong: the agent needs 15–30s before any text
      // exists, so the client rendered an EMPTY "UNO Bot AGENT" bubble for the
      // whole run — a blank message impersonating a loading state. A stream
      // carries content; a status says "working". Delivery opens the stream when
      // there is something to put in it.
      await setStatus(env, channel, threadTs, "is thinking…").catch(() => {});
      // Title the App thread from the question that started it, so it is
      // findable in History/Messages. Slack: "Set the title initially to capture
      // the first question from the user." Only for threads we synthesized —
      // re-titling a thread the user is continuing would overwrite their topic
      // with a follow-up.
      if (!event.thread_ts && threadTs) {
        await setAssistantTitle(env, channel, threadTs, threadTitleFrom(userText)).catch(() => {});
      }
    }
  }

  // Interim updates: long runs are now legal (streaming + MCP can take several
  // minutes), and ⏳ alone left people typing "any thing???" at the 8-minute
  // mark. Two complementary signals, both as SEPARATE small messages (never
  // folded into the final answer): (a) the model's own between-tool narration,
  // filtered and capped by runAgent's onInterim, arrives as it works; (b) a
  // generic note at ~75s backstops runs that produced no narration yet.
  //
  // PLAN MODE changes where (b) and (a) go, not what they are. With
  // SLACK_STREAM_PLAN=on the turn opens a stream up front in
  // `task_display_mode: "plan"` and the same narration lands as task cards
  // inside it — one filling-in checklist instead of three loose messages, and
  // the answer closes the same stream. An early stream is only honest in this
  // mode: with plain text there is nothing to put in it and the client renders
  // an empty bubble for the whole run (tried, reverted, see api.ts).
  let planStreamTs: string | null = null;
  if (env.SLACK_STREAM_PLAN === "on" && threadTs && previewTier !== "chill") {
    planStreamTs = await startStream(env, channel, threadTs, userId, event.team, "plan");
    if (planStreamTs) {
      await appendTask(env, channel, planStreamTs, {
        id: "understand",
        title: "Reading the question and this thread",
        status: "in_progress",
      });
    }
  }
  // The card currently in progress. Carried whole, not just its id: a
  // task_update REPLACES the card, so re-sending the id with a placeholder
  // title would rewrite the step's name to "Done" as it completed.
  let planCurrent = { id: "understand", title: "Reading the question and this thread" };
  let planStep = 0;

  let interimPosted = false;
  const postInterim = (text: string): void => {
    interimPosted = true;
    if (planStreamTs) {
      // Each narration line is its own card, and the previous one is closed by
      // re-sending its id with status complete — that is what makes it read as
      // progress rather than as a list of things all still happening.
      void appendTask(env, channel, planStreamTs, { ...planCurrent, status: "complete" });
      planCurrent = { id: `step-${++planStep}`, title: text.slice(0, 120) };
      void appendTask(env, channel, planStreamTs, { ...planCurrent, status: "in_progress" });
      return;
    }
    postMessage(env, { channel, thread_ts: threadTs, text: `:hourglass_flowing_sand: ${text}` }).catch(() => {});
  };
  // Varied so heavy days don't read as the same canned line five times over
  // (tone feedback, 2026-07-10). Picked by message ts — stable per run,
  // different across runs.
  const BACKSTOP_LINES = [
    "Still on it — this one needs a longer dig. The full answer will land right here.",
    "Still digging — there's more to check than usual. Answer coming in this thread.",
    "Taking my time on this one so it's right. I'll post the full answer here.",
  ];
  const interimTimer = setTimeout(() => {
    if (interimPosted) return;
    const pick = Math.abs(parseInt(userMsgTs.replace(".", "").slice(-6), 10)) % BACKSTOP_LINES.length;
    postInterim(BACKSTOP_LINES[pick] ?? BACKSTOP_LINES[0]!);
  }, 75_000);

  let result: AgentResult;
  // Which read-only tools ran, and what the last blueprint lookup retrieved.
  // Collected by an AsyncLocalStorage scope rather than threaded through both
  // provider loops' signatures (loop-shared withTurnScope). Both are needed
  // AFTER the agent returns: the judge gates a correction on "cited something
  // fetched this turn", and the receipt is persisted for the next turn.
  let toolsUsedThisTurn: string[] = [];
  let turnReceipt: HistoryTurn["retrieval"];
  try {
    const agentRun = await withTurnScope({ correction: isCorrection }, () =>
      runAgent({
      env,
      userText: modelText,
      tierOverride: event.tierOverride,
      images: vision.images.length > 0 ? vision.images : undefined,
      history: historyForModel,
      slack: {
        channel,
        // A real ts, not convTs: tool-side posts still thread off the user message.
        threadTs: event.thread_ts ?? event.ts,
        // …and convTs separately, because that is the key the cancel flag uses.
        conversationTs: convTs,
        userMsgTs,
        requestedBy: userId,
        // Bot-token search needs the triggering event's action_token; it exists
        // only for this turn, so it rides the context rather than any store.
        actionToken: event.action_token,
        notionPrdId: prd?.id,
        notionPrdUrl: prd?.url,
      },
      currentSender: { userId },
      pending,
      assistantContext: panelContext ?? undefined,
      onInterim: postInterim,
      }),
    );
    result = agentRun.result;
    toolsUsedThisTurn = agentRun.tools;
    turnReceipt = agentRun.receipt;
  } catch (err) {
    console.error(`[agent] failed: ${err instanceof Error ? err.message : String(err)}`);
    // Close the plan stream before the failure message, or the checklist sits
    // open above it forever, still claiming a step is in progress.
    if (planStreamTs) {
      await appendTask(env, channel, planStreamTs, { ...planCurrent, status: "error" }).catch(() => {});
      await stopStream(env, channel, planStreamTs).catch(() => {});
      planStreamTs = null;
    }
    await postVisibleFailure(env, channel, threadTs, userMsgTs, err, "agent");
    return;
  } finally {
    clearTimeout(interimTimer);
  }
  if (planStreamTs) {
    await appendTask(env, channel, planStreamTs, { ...planCurrent, status: "complete" }).catch(() => {});
  }

  // ----- text-only response -----
  if (result.kind === "text") {
    // Pre-send self-verification (approved 2026-07-12): substantive drafts get
    // ONE cheap judge call against the condensed D1–D9 rubric, revised once on
    // a flagged failure. Short replies skip it entirely; any judge error or
    // timeout ships the original draft (fail open — see agent/draft-judge.ts).
    // On a correction turn the judge ALSO gets the reply being corrected and the
    // tools that ran, and the length floor is bypassed — the failing denial of
    // 2026-08-17 was short, so the one turn the judge had something to catch is
    // the one it sat out.
    //
    // Ahead of it, the deterministic half. D9 (one woven confidence clause) was
    // only ever checked INSIDE the judge, which skips anything under 1500 chars
    // — and almost every blueprint answer in Slack is a few hundred. This runs
    // on the body that will actually SHIP (renderDeliveredBody: strip, then
    // cap), because capText truncates after the judge has scored and can
    // amputate a clause from a reply already logged as verdict=pass.
    const retrievalRan = retrievalRanIn(toolsUsedThisTurn);
    const servedFromCache = turnReceipt?.cached === true;
    let verdict: ConfidenceVerdict = { kind: "exempt" };
    try {
      verdict = judgeConfidence(renderDeliveredBody(result.text), { retrievalRan, servedFromCache });
    } catch (err) {
      // Fail open, in the same direction as the judge itself: a missing
      // confidence clause is a smaller harm than a dropped answer, so a throw
      // in the pre-check degrades to "no escalation", never to silence.
      console.warn(
        `[confidence] pre-check failed: ${err instanceof Error ? err.message : String(err)} — no escalation`,
      );
    }
    const reviewed = await reviewDraft(env, {
      userText: modelText,
      draft: result.text,
      correction: isCorrection,
      priorAssistantText: isCorrection ? priorAssistantTurn?.content : undefined,
      toolsUsedThisTurn,
      // Both bypass the length floor and tell the judge exactly what to repair.
      forceReason: needsRepair(verdict) ? verdict.kind : undefined,
      extraInstruction: repairInstruction(verdict) ?? undefined,
    });
    // Re-validation, not a second repair round. A judge revision can itself end
    // in a trailing label, which stripTrailingConfidence then DELETES without
    // putting anything back — turning "wrong shape" into "no signal at all" in
    // the one reply we had already noticed was wrong. Logged so that outcome is
    // countable; looping here would cost another model call per turn and could
    // land in the same place anyway.
    try {
      const finalVerdict = judgeConfidence(renderDeliveredBody(reviewed.text), {
        retrievalRan,
        servedFromCache,
      });
      console.log(
        `[confidence] pre=${verdict.kind} post=${finalVerdict.kind} ` +
          `retrieval=${retrievalRan ? "yes" : "no"} cached=${servedFromCache ? "yes" : "no"} ` +
          `judge=${reviewed.verdict}`,
      );
    } catch (err) {
      console.warn(
        `[confidence] post-check failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const delivery = await postTextVerified(
      env,
      channel,
      threadTs,
      reviewed.text,
      // A draft goes out under the PERSON'S name; the standard footer describes
      // the wrong risk. Set by the shortcut, never sniffed from the body.
      event.footerHint,
      // In plan mode the answer closes the stream the checklist lives in,
      // rather than opening a second one beside it.
      planStreamTs ?? undefined,
    );
    planStreamTs = null;
    // The receipt rides the USER turn, keyed by the user message's ts.
    //
    // It describes the TURN, not the message, and the user ts is the only id
    // this path has: postTextVerified reports {ok, text} and not the ts it
    // posted to, so the assistant message has no key to merge on. The user
    // message's ts is in the same Slack thread buildThreadHistory rebuilds
    // from, so the merge lands either way.
    await appendHistory(env, channel, convTs, {
      role: "user",
      content: vision.historyText,
      ts: userMsgTs,
      ...(turnReceipt ? { retrieval: turnReceipt } : {}),
    });
    if (delivery.ok) {
      // Record what was actually posted (capped/placeholder), not the raw text.
      await appendHistory(env, channel, convTs, { role: "assistant", content: delivery.text });
      // No ✅ on success: the reply that just landed IS the completion signal,
      // and a checkmark next to it is a second one saying the same thing. ✅
      // still means something specific here — it is how a human CONFIRMS a
      // proposal — so spending it on "I answered" also blunts the gate.
    } else {
      // Never ✅ a reply that was never delivered.
      console.error("[slack] reply delivery failed after retry");
      await postVisibleFailure(env, channel, threadTs, userMsgTs, undefined, "delivery");
    }
    return;
  }

  // Everything past here posts its own message (a proposal card, a clarifying
  // question, a resolution note) rather than an answer, so the plan stream has
  // nothing left to carry — close it now or it stays open above whatever lands.
  if (planStreamTs) {
    await stopStream(env, channel, planStreamTs).catch(() => {});
    planStreamTs = null;
  }

  // ----- text-path proposal resolution -----
  if (result.kind === "resolved") {
    await resolveProposal(env, result.pending, result.decision, result.messageToUser);
    const finalText = result.messageToUser
      ?? (result.decision === "confirm" ? "Got it — kicking that off." : "Cancelled.");
    await recordExchange(env, channel, convTs, vision.historyText, finalText);
    return;
  }

  // ----- new side-effect proposal -----

  // Resolve the PRD url for `implement` (thread root notification or a link the
  // designer pasted); it feeds both the clarify gate and the proposal preview.
  let implementPrdUrl: string | undefined;
  if (result.toolName === "component_implement") {
    const inputPrdUrl =
      typeof result.input.notion_prd_url === "string" ? result.input.notion_prd_url.trim() : "";
    implementPrdUrl = prd?.url ?? (inputPrdUrl || undefined);
  }

  // Clarify-vs-act (D3): if the tool call is missing what it needs, ask here in
  // the Worker instead of staging a proposal — so gating never depends on the
  // model remembering to ask (e.g. a component is never implemented PRD-less).
  const gate = await preflight(result.toolName, result.input, { env, prd, implementPrdUrl });
  if (gate) {
    await postMessage(env, { channel, thread_ts: threadTs, text: gate.ask });
    await recordExchange(env, channel, convTs, vision.historyText, gate.ask);
    return;
  }

  // Gate idempotency (R2 regressions): approvals must not re-gate, and cancels
  // must stick.
  //
  // (a) The model re-issued the SAME proposal while one is pending (typically it
  // answered an approval with a fresh tool call instead of resolve_pending_
  // proposal). Superseding would delete + re-post the identical card — R2's
  // PRD-CREATE re-gated 4× this way. Point back at the existing card instead.
  if (
    pending &&
    pending.toolName === result.toolName &&
    stableStringify(pending.input) === stableStringify(result.input)
  ) {
    const remind =
      `:hourglass: That exact *${proposalVerb(result.toolName)}* proposal is already waiting on you — ` +
      `react :white_check_mark: / :x: on it, or say "go ahead" / "cancel". I won't post a duplicate card.`;
    await postMessage(env, { channel, thread_ts: threadTs, text: remind });
    await recordExchange(env, channel, convTs, vision.historyText, remind);
    return;
  }

  // (b) The user JUST cancelled this same action (the DO history's outcome note
  // is authoritative — the live-thread history only shows the narrative text).
  // Don't re-card a cancelled action; require an explicit revival. The check
  // window is the last few turns, so one clarifying exchange clears it.
  try {
    const doHistory = await loadHistory(env, channel, convTs);
    const justCancelled = doHistory
      .slice(-3)
      .some((t) => t.role === "assistant" && t.content.includes(`(Cancelled the proposed ${result.toolName}`));
    if (justCancelled) {
      const ask =
        `:leftwards_arrow_with_hook: You cancelled that ${proposalVerb(result.toolName)} a moment ago, so I'm not re-proposing it on my own. ` +
        `Changed your mind? Say so explicitly and I'll stage it again — or tell me what you'd like instead.`;
      await postMessage(env, { channel, thread_ts: threadTs, text: ask });
      await recordExchange(env, channel, convTs, vision.historyText, ask);
      return;
    }
  } catch (err) {
    // Guard is best-effort — a DO hiccup shouldn't block a legitimate proposal.
    console.warn(`[slack] recent-cancel check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // If there's already a (different) pending proposal in this thread, supersede it.
  if (pending) {
    await deletePendingProposal(env, pending.proposalTs);
  }

  let proposalText: string;
  let proposalBlocks: unknown[] | undefined;
  if (result.toolName === "prototype_scaffold") {
    const built = await buildImplementDesignProposal(env, result.input, userId, result.previewText);
    proposalText = built.text;
    proposalBlocks = built.blocks;
  } else if (result.toolName === "component_implement") {
    // Show which PRD this implement is tied to, so the requester can see it.
    const preview = implementPrdUrl ? `Using the PRD for this change: ${implementPrdUrl}` : result.previewText;
    proposalText = formatProposal(result.toolName, result.input, userId, preview);
  } else if (result.toolName === "notion_update") {
    // Conversational card: warm lead + linked card + `current → new` diff. No ⚠️
    // preamble — the lead, the named card, and the diff speak for themselves.
    const body = await buildNotionUpdateBody(env, result.input);
    proposalText = formatNotionUpdateProposal(result.previewText, body);
  } else if (result.toolName === "notion_archive") {
    // Writes are no longer DB-allowlisted, so the human ✅ is the backstop — make
    // the card show the CONCRETE target (page title + parent DB), not a bare id,
    // so an approver can't be steered into confirming a write on some arbitrary
    // page a read pulled in (review 2026-07-13). Best-effort; null → no line.
    const pageUrl = typeof result.input.page_url === "string" ? result.input.page_url : "";
    const target = pageUrl ? await describeNotionTarget(env, pageUrl) : null;
    const targetNote = target ? `• *Target:* ${target.title} — in ${target.parent}` : undefined;
    proposalText = formatProposal(result.toolName, result.input, userId, result.previewText, targetNote);
  } else {
    proposalText = formatProposal(result.toolName, result.input, userId, result.previewText);
  }

  let posted = await postMessage(env, {
    channel,
    thread_ts: threadTs,
    text: proposalText,
    blocks: proposalBlocks,
  });
  // If Slack rejected the blocks (e.g. it couldn't fetch the Figma image_url),
  // retry text-only so the confirmation gate still works.
  if (!posted.ok && proposalBlocks) {
    console.warn("[slack] proposal with blocks failed; retrying text-only");
    posted = await postMessage(env, { channel, thread_ts: threadTs, text: proposalText });
  }
  if (posted.ok && posted.ts) {
    // Persist the moment the card posts: it's reactable instantly, and a quick ✅
    // that lands before the proposal is saved would look up nothing and be
    // silently lost (the reaction gate keys off saved state). Save first so the
    // confirmation always finds it.
    await savePendingProposal(env, {
      toolName: result.toolName,
      input: result.input,
      channel,
      threadTs: convTs,
      userMsgTs,
      proposalTs: posted.ts,
      proposalText,
      requesterUserId: userId,
      notionPrdId: prd?.id,
      notionPrdUrl: prd?.url,
    });
  }
}

function stripBotMentions(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, "").trim();
}

// ── notion_update card body (linked card + `current → new` diff) ──────────────
// Builds the DISPLAY body for a notion_update proposal — separate from the
// executable tool input, which lives untouched in the DO's pending state. Reads
// the page for its title/URL/parent DB + the current value of each changed field
// (describeNotionTarget), resolves any people/relation new-values from ids/URLs
// to real names, and codifies every property value in backticks.

function humanizeFieldName(key: string): string {
  return key.replace(/[_\s]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// People/relation writes arrive as a Notion id or URL — resolve to a real name
// so the card never shows a bare `notion.so/e5cb…`. Plain values (a select name,
// a date) carry no 32-hex id and pass straight through. Best-effort.
async function resolveNotionValueForDisplay(env: Env, raw: string): Promise<string> {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const id = parseNotionPageId(part);
    if (id) {
      const titles = await fetchPageTitles(env, [id]).catch(() => []);
      if (titles.length) { out.push(...titles); continue; }
    }
    out.push(part);
  }
  return out.join(", ") || raw.trim();
}

// A one-line note for an `append` (narrative) update, so the card doesn't drop it.
function describeAppend(append: unknown): string | null {
  if (!append || typeof append !== "object") return null;
  const o = append as Record<string, unknown>;
  const headings = (Array.isArray(o.sections) ? o.sections : [])
    .map((s) => (s && typeof s === "object" ? String((s as Record<string, unknown>).heading ?? "").trim() : ""))
    .filter(Boolean);
  if (headings.length) return `• *Appending:* ${headings.map((h) => `_${h}_`).join(", ")}`;
  if (typeof o.text === "string" && o.text.trim()) return `• *Appending a note to the page.*`;
  return null;
}

async function buildNotionUpdateBody(env: Env, input: Record<string, unknown>): Promise<string> {
  const pageUrl = typeof input.page_url === "string" ? input.page_url : "";
  const properties =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const changedFields = Object.keys(properties);
  const target = pageUrl ? await describeNotionTarget(env, pageUrl, changedFields) : null;

  const lines: string[] = [];

  // Named + linked card — `<url|Title> — in <ParentDB>`, never a bare hex URL.
  if (target) {
    lines.push(`*<${target.url}|${target.title}>* — in ${target.parent}`);
  } else if (pageUrl) {
    lines.push(`*<${pageUrl}|this Notion page>*`);
  }

  // One bullet per changed field, always — `current → new`, values backticked.
  for (const [reqName, rawVal] of Object.entries(properties)) {
    if (typeof rawVal !== "string") continue;
    const cur = target?.current?.[normalizeName(reqName)];
    const label = cur?.label ?? humanizeFieldName(reqName);
    const newDisplay = await resolveNotionValueForDisplay(env, rawVal);
    lines.push(
      cur?.value
        ? `• *${label}:* \`${cur.value}\` → \`${newDisplay}\``
        : `• *${label}:* \`${newDisplay}\``,
    );
  }

  const appendNote = describeAppend(input.append);
  if (appendNote) lines.push(appendNote);

  return lines.join("\n");
}

// Key-order-independent JSON compare, so two generations of the same tool input
// register as identical even if the model emitted fields in a different order.
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v !== null && typeof v === "object") {
    return `{${Object.entries(v as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${JSON.stringify(k)}:${stableStringify(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
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
  if (!threadTs) return loadHistory(env, channel, convTs);
  try {
    const [identity, replies, stored] = await Promise.all([
      getBotIdentity(env),
      conversationsReplies(env, channel, threadTs, THREAD_HISTORY_LIMIT),
      wantReceipts ? loadHistory(env, channel, convTs).catch(() => []) : Promise.resolve([]),
    ]);
    const receiptsByTs = new Map<string, NonNullable<HistoryTurn["retrieval"]>>();
    for (const t of stored) {
      if (t.ts && t.retrieval) receiptsByTs.set(t.ts, t.retrieval);
    }
    if (identity && replies.ok && replies.messages?.length) {
      const turns: HistoryTurn[] = [];
      for (const m of replies.messages) {
        if (m.ts === currentTs) continue;
        const content = stripBotMentions(m.text ?? "").trim();
        if (!content) continue;
        const isBot = m.user === identity.userId || (!!m.bot_id && m.bot_id === identity.botId);
        const receipt = m.ts ? receiptsByTs.get(m.ts) : undefined;
        turns.push({
          role: isBot ? "assistant" : "user",
          content,
          ...(m.ts ? { ts: m.ts } : {}),
          ...(receipt ? { retrieval: receipt } : {}),
        });
      }
      if (turns.length) return turns;
    }
  } catch (err) {
    console.warn(`[history] thread read failed, using DO fallback: ${err instanceof Error ? err.message : String(err)}`);
  }
  return loadHistory(env, channel, convTs);
}
