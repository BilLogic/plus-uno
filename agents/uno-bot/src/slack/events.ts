import type { Env } from "../types";
import { runAgent, type AgentResult } from "../agent/run-agent";
import { bareResolution } from "../agent/loop-shared";
import { routeRequest } from "../agent/anthropic-client";
import { resolveProposal } from "../agent/resolve-proposal";
import {
  appendHistory,
  recordExchange,
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
import {
  type SlackMessageEvent,
  type SlackAppMentionEvent,
  type SlackReactionAddedEvent,
  type SlackInnerEvent,
  type SlackEventCallback,
  type SlackUrlVerification,
  type SlackEnvelope,
  type RunnerJobPayload,
} from "./types";
import { collectVisionInputs } from "./vision";
import { postVisibleFailure, postTextVerified } from "./delivery";
import { formatProposal, proposalVerb, buildImplementDesignProposal } from "./proposal-render";

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
  if (!res.ok) {
    // Enqueue is the only step left in the Worker — a failure here IS the
    // 👀-then-silence path, so make it visible instead. A dropped REACTION job
    // is a silently-ignored ✅/❌ (the exact "approved then nothing" failure
    // this codebase fights elsewhere), so warn on both job kinds — each posts
    // into its own thread.
    console.error(`[slack] runner enqueue failed (${job.kind}): ${res.status}`);
    const target =
      job.kind === "message"
        ? { channel: job.event.channel, thread_ts: job.event.thread_ts ?? job.event.ts }
        : { channel: job.event.item.channel, thread_ts: job.event.item.ts };
    await postMessage(env, {
      ...target,
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
    const bareDecision = bareResolution(userText); // shared vocabulary (loop-shared)
    if (bareDecision) {
      if (userId !== pending.requesterUserId) {
        await postMessage(env, {
          channel,
          thread_ts: threadTs,
          text: `Only <@${pending.requesterUserId}> can confirm or cancel this one.`,
        });
        return;
      }
      await resolveProposal(env, pending, bareDecision);
      await recordExchange(
        env, channel, threadTs, userText,
        bareDecision === "confirm" ? "(confirmed — executing the proposal)" : "Cancelled.",
      );
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
    await recordExchange(env, channel, threadTs, vision.historyText, finalText);
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
    await recordExchange(env, channel, threadTs, vision.historyText, gate.ask);
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
    await recordExchange(env, channel, threadTs, vision.historyText, remind);
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
      await recordExchange(env, channel, threadTs, vision.historyText, ask);
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
