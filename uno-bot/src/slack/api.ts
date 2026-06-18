// Thin fetch wrappers over the Slack Web API. We don't pull in @slack/web-api
// because we only need 3-4 methods and Workers prefers a small bundle.

import type { Env } from "../types";

interface SlackOk {
  ok: true;
  [k: string]: unknown;
}
interface SlackErr {
  ok: false;
  error: string;
  [k: string]: unknown;
}
type SlackResponse = SlackOk | SlackErr;

async function slackCall<T extends SlackResponse>(
  env: Env,
  method: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as T;
  if (!data.ok) {
    console.warn(`[slack] ${method} failed: ${(data as SlackErr).error}`);
  }
  return data;
}

export interface PostMessageInput {
  channel: string;
  text: string;
  thread_ts?: string;
  mrkdwn?: boolean;
  blocks?: unknown[];
}

export async function postMessage(env: Env, input: PostMessageInput) {
  return slackCall<SlackResponse & { ts?: string; channel?: string }>(env, "chat.postMessage", {
    mrkdwn: true,
    ...input,
  });
}

export async function addReaction(
  env: Env,
  channel: string,
  ts: string,
  name: string,
) {
  return slackCall<SlackResponse>(env, "reactions.add", { channel, timestamp: ts, name });
}

export interface ConversationsRepliesResult extends SlackOk {
  messages: Array<{
    type: string;
    user?: string;
    bot_id?: string;
    text: string;
    ts: string;
    thread_ts?: string;
  }>;
  has_more?: boolean;
}

export async function conversationsReplies(
  env: Env,
  channel: string,
  thread_ts: string,
  limit = 20,
) {
  return slackCall<ConversationsRepliesResult>(env, "conversations.replies", {
    channel,
    ts: thread_ts,
    limit,
    inclusive: true,
  });
}

// The bot's own identity, used to tag which thread messages are the bot's
// (assistant) vs everyone else's (user) when building memory from the thread.
// Cached for the isolate's lifetime — auth.test doesn't change for a deployment.
let cachedBotIdentity: { userId: string; botId: string } | null = null;

export async function getBotIdentity(
  env: Env,
): Promise<{ userId: string; botId: string } | null> {
  if (cachedBotIdentity) return cachedBotIdentity;
  const res = await slackCall<SlackResponse & { user_id?: string; bot_id?: string }>(
    env,
    "auth.test",
    {},
  );
  if (res.ok && res.user_id) {
    cachedBotIdentity = { userId: res.user_id, botId: res.bot_id ?? "" };
    return cachedBotIdentity;
  }
  return null;
}
