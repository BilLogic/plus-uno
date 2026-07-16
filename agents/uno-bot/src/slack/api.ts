// Thin fetch wrappers over the Slack Web API. We don't pull in @slack/web-api
// because we only need 3-4 methods and Workers prefers a small bundle.

import type { Env } from "../types";
import { toSlackMrkdwn } from "./mrkdwn";

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

// Parse a Slack response defensively: a 5xx or an HTML error page throws out of
// res.json(), and an un-caught throw here has silently no-op'd a confirmed ✅
// (the ack-message post at resolve-proposal.ts threw before executeTool ran,
// 2026-07-11 review). Every caller already handles `{ ok: false, error }`, so
// degrade transport/parse failures into that shape instead of throwing.
async function parseSlackResponse<T extends SlackResponse>(res: Response, method: string): Promise<T> {
  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    const err = `http_${res.status}` as string;
    console.warn(`[slack] ${method} returned non-JSON (status ${res.status})`);
    return { ok: false, error: err } as unknown as T;
  }
  if (!data.ok) {
    console.warn(`[slack] ${method} failed: ${(data as SlackErr).error}`);
  }
  return data;
}

// Exported: assistant.ts / home.ts reuse this rather than hand-rolling their
// own POST wrapper — api.ts stays the single Slack egress point.
export async function slackCall<T extends SlackResponse>(
  env: Env,
  method: string,
  payload: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(`[slack] ${method} fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, error: "network_error" } as unknown as T;
  }
  return parseSlackResponse<T>(res, method);
}

// Slack READ methods reject JSON bodies (invalid_arguments — the
// conversations.replies lesson, 2026-07-10): they take GET query params.
async function slackGet<T extends SlackResponse>(
  env: Env,
  method: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  let res: Response;
  try {
    res = await fetch(`https://slack.com/api/${method}?${qs}`, {
      headers: { authorization: `Bearer ${env.SLACK_BOT_TOKEN}` },
    });
  } catch (err) {
    console.warn(`[slack] ${method} fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, error: "network_error" } as unknown as T;
  }
  return parseSlackResponse<T>(res, method);
}

export interface SlackUserInfo {
  id: string;
  name?: string;
  real_name?: string;
  profile?: { title?: string; email?: string; display_name?: string; status_text?: string };
  tz?: string;
  is_bot?: boolean;
  deleted?: boolean;
}

/** users.info via the bot token — profile fields for one user id. */
export async function usersInfo(env: Env, userId: string) {
  return slackGet<SlackResponse & { user?: SlackUserInfo }>(env, "users.info", {
    user: userId,
  });
}

/** conversations.members via the bot token — member ids (first page). */
export async function conversationsMembers(env: Env, channel: string, limit = 100) {
  return slackGet<SlackResponse & { members?: string[]; response_metadata?: { next_cursor?: string } }>(
    env,
    "conversations.members",
    { channel, limit: String(limit) },
  );
}

export interface PostMessageInput {
  channel: string;
  text: string;
  thread_ts?: string;
  mrkdwn?: boolean;
  blocks?: unknown[];
}

export async function postMessage(env: Env, input: PostMessageInput) {
  // Coerce the body to valid Slack mrkdwn at the single egress point — the model
  // slips into GitHub-flavored Markdown (## / **bold** / tables) under load, and
  // Slack renders none of it. Idempotent on Worker-authored text. (blocks, when
  // present, are Worker-built and already valid.)
  return slackCall<SlackResponse & { ts?: string; channel?: string }>(env, "chat.postMessage", {
    mrkdwn: true,
    ...input,
    ...(input.text ? { text: toSlackMrkdwn(input.text) } : {}),
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

// Confirmed tools that produce a reviewable artifact (a draft PR or a new PRD)
// and so warrant a heads-up in #plus-design for team review (D5). delete_prd is
// a removal — no review-request.
const REVIEW_REQUEST_TOOLS: ReadonlySet<string> = new Set([
  "component_implement",
  "prototype_scaffold",
  "notion_create",
]);

export function warrantsReviewRequest(toolName: string): boolean {
  return REVIEW_REQUEST_TOOLS.has(toolName);
}

const REVIEW_VERB: Record<string, string> = {
  component_implement: "component implementation PR",
  prototype_scaffold: "new prototype scaffold PR",
  notion_create: "new PRD / intake / decision",
};

export interface ReviewRequestInput {
  toolName: string;
  requesterUserId: string;
  /** Channel/thread where the work was requested, for a back-link. */
  originChannel: string;
  /** Artifact link (PR/Notion url) if the executor surfaced one. */
  artifactUrl?: string;
  /** Optional reviewer Slack ids to tag (from find_experts, when available). */
  reviewerUserIds?: string[];
}

// Announce a reviewable artifact to #plus-design: right place (the design
// channel), right person (@-mention the requester + any reviewers), right time
// (fired at completion). No-ops when PLUS_DESIGN_CHANNEL_ID is unset.
export async function postReviewRequest(env: Env, input: ReviewRequestInput) {
  const channel = env.PLUS_DESIGN_CHANNEL_ID?.trim();
  if (!channel) return; // fan-out disabled
  const what = REVIEW_VERB[input.toolName] ?? input.toolName;
  const reviewers = (input.reviewerUserIds ?? []).map((id) => `<@${id}>`).join(" ");
  const lines = [
    `:eyes: *Review request* — a ${what} is ready.`,
    input.artifactUrl ? `Artifact: ${input.artifactUrl}` : "",
    `Requested by <@${input.requesterUserId}> · thread in <#${input.originChannel}>`,
    reviewers ? `Suggested reviewers: ${reviewers}` : "",
  ].filter(Boolean);
  return postMessage(env, { channel, text: lines.join("\n") });
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
  // conversations.replies is a READ method (query params, not a JSON body).
  // slackGet owns the transport, parse-guard, and failure-warn.
  return slackGet<ConversationsRepliesResult>(env, "conversations.replies", {
    channel,
    ts: thread_ts,
    limit: String(limit),
    inclusive: "true",
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
