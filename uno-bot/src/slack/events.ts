import type { Env } from "../types";
import { runAgent, type AgentResult } from "../agent/run-agent";
import { resolveProposal } from "../agent/resolve-proposal";
import {
  appendHistory,
  deletePendingProposal,
  isDuplicateEvent,
  loadHistory,
  loadPendingProposalByThread,
  savePendingProposal,
  type HistoryTurn,
} from "../thread-state-client";
import { addReaction, conversationsReplies, getBotIdentity, postMessage } from "./api";
import { handleReaction } from "./gate";
import { extractPrdFromThreadRoot } from "./notion-prd";
import { preflight } from "../agent/preflight";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";

export interface SlackMessageEvent {
  type: "message";
  channel: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
}

export interface SlackAppMentionEvent {
  type: "app_mention";
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
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
        await onMessage(env, msg);
      } else {
        console.log("[slack] ignoring message — no @mention and not an active bot thread");
      }
      return;
    }
    case "app_mention":
      // Explicit @mention always engages.
      await onMessage(env, appMentionToMessage(event as SlackAppMentionEvent));
      return;
    case "reaction_added":
      await handleReaction(env, event as SlackReactionAddedEvent);
      return;
    default:
      console.log(`[slack] unhandled event type: ${event.type}`);
      return;
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

async function onMessage(env: Env, event: SlackMessageEvent): Promise<void> {
  if (!isUserTurn(event)) {
    console.log(`[slack] skipping subtype=${event.subtype ?? ""} bot=${event.bot_id ?? ""}`);
    return;
  }

  // Per-message dedup: Slack delivers app_mention AND message.channels for the
  // same message when the bot is @-mentioned in a channel it has history for.
  // Both events have different event_ids so the envelope-level dedup misses
  // them. Key by (channel, ts) which uniquely identifies the user's message.
  if (await isDuplicateEvent(env, `msg:${event.channel}:${event.ts}`)) {
    console.log(`[slack] dedup: msg ${event.channel}/${event.ts} already in-flight`);
    return;
  }

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
  const [history, pending, prd] = await Promise.all([
    buildThreadHistory(env, channel, threadTs, userMsgTs),
    loadPendingProposalByThread(env, channel, threadTs),
    isThreadReply
      ? extractPrdFromThreadRoot(env, channel, threadTs)
      : Promise.resolve(null),
  ]);

  let result: AgentResult;
  try {
    result = await runAgent({
      env,
      userText,
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
    });
  } catch (err) {
    console.error(`[agent] failed: ${err instanceof Error ? err.message : String(err)}`);
    await postMessage(env, {
      channel,
      thread_ts: threadTs,
      text: ":x: Something went wrong on my end. Try again in a moment?",
    });
    await addReaction(env, channel, userMsgTs, "x");
    return;
  }

  // ----- text-only response -----
  if (result.kind === "text") {
    await postMessage(env, { channel, thread_ts: threadTs, text: result.text });
    await appendHistory(env, channel, threadTs, { role: "user", content: userText });
    await appendHistory(env, channel, threadTs, { role: "assistant", content: result.text });
    await addReaction(env, channel, userMsgTs, "white_check_mark");
    return;
  }

  // ----- text-path proposal resolution -----
  if (result.kind === "resolved") {
    await resolveProposal(env, result.pending, result.decision, result.messageToUser);
    const finalText = result.messageToUser
      ?? (result.decision === "confirm" ? "Got it — kicking that off." : "Cancelled.");
    await appendHistory(env, channel, threadTs, { role: "user", content: userText });
    await appendHistory(env, channel, threadTs, { role: "assistant", content: finalText });
    return;
  }

  // ----- new side-effect proposal -----

  // Resolve the PRD url for `implement` (thread root notification or a link the
  // designer pasted); it feeds both the clarify gate and the proposal preview.
  let implementPrdUrl: string | undefined;
  if (result.toolName === "implement") {
    const inputPrdUrl =
      typeof result.input.notion_prd_url === "string" ? result.input.notion_prd_url.trim() : "";
    implementPrdUrl = prd?.url ?? (inputPrdUrl || undefined);
  }

  // Clarify-vs-act (D3): if the tool call is missing what it needs, ask here in
  // the Worker instead of staging a proposal — so gating never depends on the
  // model remembering to ask (e.g. a component is never implemented PRD-less).
  const gate = preflight(result.toolName, result.input, { prd, implementPrdUrl });
  if (gate) {
    await postMessage(env, { channel, thread_ts: threadTs, text: gate.ask });
    await appendHistory(env, channel, threadTs, { role: "user", content: userText });
    await appendHistory(env, channel, threadTs, { role: "assistant", content: gate.ask });
    return;
  }

  // If there's already a pending proposal in this thread, supersede it.
  if (pending) {
    await deletePendingProposal(env, pending.proposalTs);
  }

  let proposalText: string;
  let proposalBlocks: unknown[] | undefined;
  if (result.toolName === "implement_design") {
    const built = await buildImplementDesignProposal(env, result.input, userId, result.previewText);
    proposalText = built.text;
    proposalBlocks = built.blocks;
  } else if (result.toolName === "implement") {
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
    case "implement": return "implement";
    case "implement_design": return "scaffold a new prototype from this Figma design";
    case "create_prd": return "create a PRD card on the Design HQ → Product board (Need PRD / Under Playground)";
    case "delete_prd": return "archive (delete) a PRD card from the Design HQ → Product board";
    case "marketplace_add": return "add a new marketplace entry";
    case "marketplace_edit": return "edit a marketplace entry";
    case "send_email": return "send an email via Gmail";
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
  const text = formatProposal("implement_design", input, requesterUserId, previewText);

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
      text: `:warning: About to *${proposalVerb("implement_design")}*:\n${params}`,
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
