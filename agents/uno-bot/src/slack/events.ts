import type { Env } from "../types";
import { runAgent, type AgentImage, type AgentResult } from "../agent/run-agent";
import { routeRequest } from "../agent/anthropic-client";
import { resolveProposal } from "../agent/resolve-proposal";
import {
  appendHistory,
  claimEventRun,
  deletePendingProposal,
  isDuplicateEvent,
  loadHistory,
  loadPendingProposalByThread,
  markEventRunDone,
  savePendingProposal,
  type HistoryTurn,
} from "../thread-state-client";
import { addReaction, conversationsReplies, getBotIdentity, postMessage } from "./api";
import { handleReaction } from "./gate";
import { extractPrdFromThreadRoot } from "./notion-prd";
import { preflight } from "../agent/preflight";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";

/** Slack file attachment metadata as delivered on message/app_mention events.
 *  Only the fields the vision path reads — everything else is ignored. */
export interface SlackEventFile {
  id?: string;
  name?: string;
  mimetype?: string;
  url_private?: string;
  size?: number;
}

export interface SlackMessageEvent {
  type: "message";
  channel: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
  files?: SlackEventFile[];
}

export interface SlackAppMentionEvent {
  type: "app_mention";
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  files?: SlackEventFile[];
}

export interface SlackReactionAddedEvent {
  type: "reaction_added";
  user: string;
  reaction: string;
  item: { type: "message"; channel: string; ts: string };
  event_ts: string;
}

export type SlackInnerEvent =
  | SlackMessageEvent
  | SlackAppMentionEvent
  | SlackReactionAddedEvent
  | { type: string };

export interface SlackEventCallback {
  type: "event_callback";
  event: SlackInnerEvent;
  team_id: string;
  event_id: string;
  event_time: number;
}

export interface SlackUrlVerification {
  type: "url_verification";
  challenge: string;
}

export type SlackEnvelope = SlackEventCallback | SlackUrlVerification | { type: string };

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
        await enqueueAgentJob(env, { kind: "message", event: msg }, `${msg.channel}:${msg.thread_ts ?? msg.ts}`);
      } else {
        console.log("[slack] ignoring message — no @mention and not an active bot thread");
      }
      return;
    }
    case "app_mention": {
      // Explicit @mention always engages.
      const msg = appMentionToMessage(event as SlackAppMentionEvent);
      await enqueueAgentJob(env, { kind: "message", event: msg }, `${msg.channel}:${msg.thread_ts ?? msg.ts}`);
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
    default:
      console.log(`[slack] unhandled event type: ${event.type}`);
      return;
  }
}

// A unit of work for the AgentRunner DO: a user message (full agent pipeline)
// or a reaction (proposal confirm/cancel, which may execute a gated tool).
export type RunnerJobPayload =
  | { kind: "message"; event: SlackMessageEvent }
  | { kind: "reaction"; event: SlackReactionAddedEvent };

// Hand the work to the per-thread AgentRunner DO instead of running it here:
// this Worker invocation lives inside ctx.waitUntil(), which Cloudflare cancels
// ~30s after the Slack ack — any longer run died silently mid-flight
// ("👀 then silence", live incident 2026-07-09). DO alarms have no such cutoff.
// Keyed per thread so runs within a thread stay ordered.
async function enqueueAgentJob(env: Env, job: RunnerJobPayload, threadKey: string): Promise<void> {
  const stub = env.AGENT_RUNNER.get(env.AGENT_RUNNER.idFromName(threadKey));
  const res = await stub.fetch("https://do/enqueue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ job, enqueuedAt: Date.now() }),
  });
  if (!res.ok && job.kind === "message") {
    // Enqueue is the only step left in the Worker — a failure here IS the
    // 👀-then-silence path, so make it visible instead.
    console.error(`[slack] runner enqueue failed: ${res.status}`);
    await postMessage(env, {
      channel: job.event.channel,
      thread_ts: job.event.thread_ts ?? job.event.ts,
      text: ":warning: I couldn't start on that one — try again, and if it repeats flag it in #uno-bot.",
    }).catch(() => {});
  }
}

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
      thread_ts: msg.thread_ts ?? msg.ts,
      text: ":warning: I hit an internal error on that one — try again, and if it repeats flag it in #uno-bot.",
    }).catch(() => {});
    return "handled";
  }
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
  }
  return "handled";
}

async function handleUserMessage(env: Env, event: SlackMessageEvent): Promise<void> {
  const channel = event.channel;
  const userId = event.user!;
  const userMsgTs = event.ts;
  const threadTs = event.thread_ts ?? event.ts;
  const userText = stripBotMentions(event.text!);

  await addReaction(env, channel, userMsgTs, "eyes");

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
      buildThreadHistory(env, channel, threadTs, userMsgTs),
      loadPendingProposalByThread(env, channel, threadTs),
      isThreadReply
        ? extractPrdFromThreadRoot(env, channel, threadTs)
        : Promise.resolve(null),
    ]);
  } catch (err) {
    console.error(`[slack] context load failed: ${err instanceof Error ? err.message : String(err)}`);
    await postVisibleFailure(env, channel, threadTs, userMsgTs);
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
    const bare = userText.trim().toLowerCase().replace(/[.!?\s]+$/g, "");
    const CONFIRM_PHRASES = new Set([
      "go ahead", "yes", "yes please", "confirm", "confirmed", "do it",
      "ship it", "approve", "approved", "sure", "ok", "okay", "lgtm",
    ]);
    const CANCEL_PHRASES = new Set([
      "cancel", "no", "stop", "abort", "nevermind", "never mind",
      "cancel it", "don't", "dont",
    ]);
    if (CONFIRM_PHRASES.has(bare) || CANCEL_PHRASES.has(bare)) {
      if (userId !== pending.requesterUserId) {
        await postMessage(env, {
          channel,
          thread_ts: threadTs,
          text: `Only <@${pending.requesterUserId}> can confirm or cancel this one.`,
        });
        return;
      }
      const decision = CONFIRM_PHRASES.has(bare) ? "confirm" : "cancel";
      await resolveProposal(env, pending, decision);
      await appendHistory(env, channel, threadTs, { role: "user", content: userText });
      await appendHistory(env, channel, threadTs, {
        role: "assistant",
        content: decision === "confirm" ? "(confirmed — executing the proposal)" : "Cancelled.",
      });
      return;
    }
  }

  // Vision: pasted images + a linked Figma frame become base64 image blocks on
  // the current turn. Guarded inside — a failure degrades to text-only.
  const vision = await collectVisionInputs(env, event, userText);

  // Wait signal: real requests (everything but the confirm/cancel fast-path)
  // run on the sonnet lane with grounding and can take a while — ⏳ next to 👀
  // says "bigger think underway" before the model starts. routeRequest is the
  // same zero-cost lane check runAgent uses.
  const { tier: previewTier } = routeRequest({ userText, hasPending: pending !== null });
  if (previewTier !== "haiku" || vision.images.length > 0) {
    await addReaction(env, channel, userMsgTs, "hourglass_flowing_sand").catch(() => {});
  }

  // Interim updates: long runs are now legal (streaming + MCP can take several
  // minutes), and ⏳ alone left people typing "any thing???" at the 8-minute
  // mark. Two complementary signals, both as SEPARATE small messages (never
  // folded into the final answer): (a) the model's own between-tool narration,
  // filtered and capped by runAgent's onInterim, arrives as it works; (b) a
  // generic note at ~75s backstops runs that produced no narration yet.
  let interimPosted = false;
  const postInterim = (text: string): void => {
    interimPosted = true;
    postMessage(env, { channel, thread_ts: threadTs, text: `:hourglass_flowing_sand: ${text}` }).catch(() => {});
  };
  const interimTimer = setTimeout(() => {
    if (interimPosted) return;
    postInterim("Still on it — this one needs a longer dig. The full answer will land right here.");
  }, 75_000);

  let result: AgentResult;
  try {
    result = await runAgent({
      env,
      userText: vision.modelText,
      images: vision.images.length > 0 ? vision.images : undefined,
      history,
      slack: {
        channel,
        threadTs,
        userMsgTs,
        requestedBy: userId,
        notionPrdId: prd?.id,
        notionPrdUrl: prd?.url,
      },
      currentSender: { userId },
      pending,
      onInterim: postInterim,
    });
  } catch (err) {
    console.error(`[agent] failed: ${err instanceof Error ? err.message : String(err)}`);
    await postVisibleFailure(env, channel, threadTs, userMsgTs);
    return;
  } finally {
    clearTimeout(interimTimer);
  }

  // ----- text-only response -----
  if (result.kind === "text") {
    const delivery = await postTextVerified(env, channel, threadTs, result.text);
    await appendHistory(env, channel, threadTs, { role: "user", content: vision.historyText });
    if (delivery.ok) {
      // Record what was actually posted (capped/placeholder), not the raw text.
      await appendHistory(env, channel, threadTs, { role: "assistant", content: delivery.text });
      await addReaction(env, channel, userMsgTs, "white_check_mark");
    } else {
      // Never ✅ a reply that was never delivered.
      console.error("[slack] reply delivery failed after retry");
      await postVisibleFailure(env, channel, threadTs, userMsgTs);
    }
    return;
  }

  // ----- text-path proposal resolution -----
  if (result.kind === "resolved") {
    await resolveProposal(env, result.pending, result.decision, result.messageToUser);
    const finalText = result.messageToUser
      ?? (result.decision === "confirm" ? "Got it — kicking that off." : "Cancelled.");
    await appendHistory(env, channel, threadTs, { role: "user", content: vision.historyText });
    await appendHistory(env, channel, threadTs, { role: "assistant", content: finalText });
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
    await appendHistory(env, channel, threadTs, { role: "user", content: vision.historyText });
    await appendHistory(env, channel, threadTs, { role: "assistant", content: gate.ask });
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
    await appendHistory(env, channel, threadTs, { role: "user", content: vision.historyText });
    await appendHistory(env, channel, threadTs, { role: "assistant", content: remind });
    return;
  }

  // (b) The user JUST cancelled this same action (the DO history's outcome note
  // is authoritative — the live-thread history only shows the narrative text).
  // Don't re-card a cancelled action; require an explicit revival. The check
  // window is the last few turns, so one clarifying exchange clears it.
  try {
    const doHistory = await loadHistory(env, channel, threadTs);
    const justCancelled = doHistory
      .slice(-3)
      .some((t) => t.role === "assistant" && t.content.includes(`(Cancelled the proposed ${result.toolName}`));
    if (justCancelled) {
      const ask =
        `:leftwards_arrow_with_hook: You cancelled that ${proposalVerb(result.toolName)} a moment ago, so I'm not re-proposing it on my own. ` +
        `Changed your mind? Say so explicitly and I'll stage it again — or tell me what you'd like instead.`;
      await postMessage(env, { channel, thread_ts: threadTs, text: ask });
      await appendHistory(env, channel, threadTs, { role: "user", content: vision.historyText });
      await appendHistory(env, channel, threadTs, { role: "assistant", content: ask });
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
    await addReaction(env, channel, posted.ts, "warning");
    await savePendingProposal(env, {
      toolName: result.toolName,
      input: result.input,
      toolUseId: result.toolUseId,
      assistantContent: result.assistantContent as unknown[],
      channel,
      threadTs,
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

// ---------------------------------------------------------------------------
// Vision input (2026-07-09): Slack-pasted images + Figma frame screenshots are
// attached to the CURRENT user turn as base64 image blocks so the model can
// actually see them. Everything here is best-effort — any failure degrades to
// text-only and must never break the reply. Base64 is NEVER persisted to the
// Durable Object history; `historyText` carries text markers instead.
// ---------------------------------------------------------------------------

const MAX_IMAGE_ATTACHMENTS = 3;
const MAX_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024); // Anthropic per-image limit is ~5MB; stay well under
const IMAGE_FETCH_TIMEOUT_MS = 10_000;
// The Anthropic API only accepts these four image media types — anything else
// (svg, tiff, heic…) would 400 the whole request, so it's skipped like oversize.
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

interface VisionInputs {
  /** Base64 image blocks for the current turn (Slack files first, then the Figma frame). */
  images: AgentImage[];
  /** userText + model-visible notes (omitted files, figma fetch failure). */
  modelText: string;
  /** userText + plain-text markers for the stored history (no base64 ever). */
  historyText: string;
}

async function collectVisionInputs(
  env: Env,
  event: SlackMessageEvent,
  userText: string,
): Promise<VisionInputs> {
  const images: AgentImage[] = [];
  const modelNotes: string[] = [];
  const historyMarkers: string[] = [];

  try {
    // 1) Slack-pasted images: up to MAX_IMAGE_ATTACHMENTS supported image files.
    const files = Array.isArray(event.files) ? event.files : [];
    const imageFiles = files.filter(
      (f) => typeof f?.mimetype === "string" && f.mimetype.startsWith("image/") && !!f.url_private,
    );
    let omitted = 0;
    for (const f of imageFiles) {
      if (
        images.length >= MAX_IMAGE_ATTACHMENTS ||
        !SUPPORTED_IMAGE_TYPES.has(f.mimetype!) ||
        (typeof f.size === "number" && f.size > MAX_IMAGE_BYTES)
      ) {
        omitted++;
        continue;
      }
      const bytes = await fetchBytes(f.url_private!, {
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      });
      if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
        omitted++;
        continue;
      }
      images.push({ media_type: f.mimetype!, data: bytesToBase64(bytes) });
      historyMarkers.push(`[user attached image: ${f.name ?? "unnamed"}]`);
    }
    if (omitted > 0) {
      modelNotes.push(`[${omitted} more image(s) omitted — too large or unsupported format]`);
    }

    // 2) Figma frame screenshot: first figma.com URL with a node-id in the text
    // (cap: 1 frame per message). Reuses the same image-render endpoint the
    // proposal cards use, then downloads the short-lived signed PNG.
    const figmaParts = findFigmaFrameUrl(userText);
    if (figmaParts) {
      let attached = false;
      const pngUrl = await fetchFigmaImagePngUrl(env, figmaParts.fileKey, figmaParts.nodeId, 1);
      if (pngUrl) {
        const png = await fetchBytes(pngUrl);
        if (png && png.byteLength > 0 && png.byteLength <= MAX_IMAGE_BYTES) {
          images.push({ media_type: "image/png", data: bytesToBase64(png) });
          historyMarkers.push("[figma frame screenshot attached]");
          attached = true;
        }
      }
      if (!attached) modelNotes.push("[figma screenshot unavailable]");
    }
  } catch (err) {
    // Vision is additive — never let it break the reply. Keep whatever was
    // collected before the failure and continue text-first.
    console.warn(
      `[vision] collection failed, degrading: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    images,
    modelText: [userText, ...modelNotes].join("\n"),
    historyText: [userText, ...historyMarkers].join("\n"),
  };
}

/** First figma.com URL in the message that carries a node-id (Slack wraps links
 *  as `<url>` or `<url|label>` — strip that before parsing). */
function findFigmaFrameUrl(text: string): ReturnType<typeof parseFigmaUrl> {
  const matches = text.match(/https?:\/\/[^\s<>|]+/g) ?? [];
  for (const candidate of matches) {
    const parts = parseFigmaUrl(candidate);
    if (parts) return parts;
  }
  return null;
}

/** Timeout-guarded byte fetch; null on any failure. Slack serves an HTML login
 *  page with a 200 when the token can't read the file — treat that as failure. */
async function fetchBytes(
  url: string,
  headers?: Record<string, string>,
): Promise<ArrayBuffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** ArrayBuffer -> base64, chunked so String.fromCharCode never overflows the
 *  argument limit on multi-MB images. */
function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
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

// Make failure VISIBLE, resiliently: try the ❌ reaction first (cheapest call —
// most likely to still succeed if the request is out of subrequest budget),
// then the error text. Every step is .catch-wrapped so a failure inside the
// failure path can never re-throw into silence (R2's ":eyes: then nothing").
async function postVisibleFailure(
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
async function postTextVerified(
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

// Build the bot's memory from the ACTUAL Slack thread, so it sees every message
// in the thread — humans' messages, its own posts (including the Notion links
// and proposals it side-posts), and poll notifications — and can't "forget"
// what it did. The bot's own messages map to `assistant`; everyone else maps to
// `user`. Falls back to the Durable Object history if the thread read fails or
// the bot's identity is unknown. The current message is excluded (it's passed
// separately as userText). buildMessages() in run-agent merges any consecutive
// same-role turns this produces.
const THREAD_HISTORY_LIMIT = 100;

async function buildThreadHistory(
  env: Env,
  channel: string,
  threadTs: string,
  currentTs: string,
): Promise<HistoryTurn[]> {
  try {
    const [identity, replies] = await Promise.all([
      getBotIdentity(env),
      conversationsReplies(env, channel, threadTs, THREAD_HISTORY_LIMIT),
    ]);
    if (identity && replies.ok && replies.messages?.length) {
      const turns: HistoryTurn[] = [];
      for (const m of replies.messages) {
        if (m.ts === currentTs) continue;
        const content = stripBotMentions(m.text ?? "").trim();
        if (!content) continue;
        const isBot = m.user === identity.userId || (!!m.bot_id && m.bot_id === identity.botId);
        turns.push({ role: isBot ? "assistant" : "user", content });
      }
      if (turns.length) return turns;
    }
  } catch (err) {
    console.warn(`[history] thread read failed, using DO fallback: ${err instanceof Error ? err.message : String(err)}`);
  }
  return loadHistory(env, channel, threadTs);
}

function formatProposal(
  toolName: string,
  input: Record<string, unknown>,
  requesterUserId: string,
  previewText: string | undefined,
): string {
  const body = "```\n" + JSON.stringify(input, null, 2) + "\n```";
  const lines: string[] = [];
  if (previewText) {
    lines.push(previewText, "");
  }
  lines.push(
    `:warning: About to *${proposalVerb(toolName)}*:`,
    body,
    `React :white_check_mark: / :x: or just say "go ahead" / "cancel" — only <@${requesterUserId}> can confirm.`,
  );
  return lines.join("\n");
}

function proposalVerb(toolName: string): string {
  switch (toolName) {
    case "component_implement": return "implement this component";
    case "prototype_scaffold": return "scaffold a new prototype from this Figma design";
    case "notion_create": return "create this card in Notion";
    case "notion_update": return "update this Notion page";
    case "notion_archive": return "archive this Notion card";
    case "shareout_post": return "share this for feedback in #plus-design-feedback";
    case "email_send": return "send an email via Gmail";
    default: return toolName;
  }
}

// Build a richer proposal for implement_design: the same plaintext as
// formatProposal (used as the Slack notification fallback AND stored in
// pending.proposalText), plus Slack blocks that embed a Figma preview
// screenshot when one can be fetched. The image fetch is best-effort — if it
// returns null we omit blocks entirely and the proposal posts as plain text,
// identical to every other tool.
async function buildImplementDesignProposal(
  env: Env,
  input: Record<string, unknown>,
  requesterUserId: string,
  previewText: string | undefined,
): Promise<{ text: string; blocks?: unknown[] }> {
  const text = formatProposal("prototype_scaffold", input, requesterUserId, previewText);

  const figmaUrl = typeof input.figma_url === "string" ? input.figma_url : "";
  const parts = figmaUrl ? parseFigmaUrl(figmaUrl) : null;
  const imageUrl = parts
    ? await fetchFigmaImagePngUrl(env, parts.fileKey, parts.nodeId, 1)
    : null;
  if (!imageUrl) return { text };

  const params = "```\n" + JSON.stringify(input, null, 2) + "\n```";
  const blocks: unknown[] = [];
  if (previewText) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: previewText } });
  }
  blocks.push({
    type: "image",
    image_url: imageUrl,
    alt_text: "Figma preview of the design to implement",
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `:warning: About to *${proposalVerb("prototype_scaffold")}*:\n${params}`,
    },
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `React :white_check_mark: / :x: or just say "go ahead" / "cancel" — only <@${requesterUserId}> can confirm.`,
    },
  });
  return { text, blocks };
}
