// Thin fetch wrappers over the Slack Web API. We don't pull in @slack/web-api
// because we only need 3-4 methods and Workers prefers a small bundle.

import type { Env } from "../types";
import {
  STREAM_MARKUP_START,
  sanitizeSlackBlocks,
  sanitizeSlackMarkup,
  sanitizeStreamChunk,
  toSlackMrkdwn,
  type StreamMarkupState,
} from "./mrkdwn";
import { countedFetch, rethrowIfBudget } from "../net";
import type { SlackEventFile } from "./types";
import { rowFor } from "../agent/tool-table";
import { cardLinks } from "./plan-block";
import type { SlackIcon } from "./estate-glyphs";

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
    console.warn(`[slack] ${method} failed: ${(data as SlackErr).error}${refusalDetail(data)}`);
  }
  return data;
}

/**
 * Slack's own account of a refusal, when it gives one: `response_metadata.messages`
 * names the argument it rejected (`[ERROR] … [json-pointer:/chunks/0/icon]`).
 * `invalid_arguments` alone says only that SOMETHING in the payload was wrong —
 * the checklist's first two live watches failed on exactly that, with nothing
 * in the log to say which field. The messages describe the payload's shape,
 * not workspace content, and are cut so a long one cannot flood the log.
 */
export function refusalDetail(data: unknown): string {
  const messages = (data as { response_metadata?: { messages?: unknown } }).response_metadata?.messages;
  if (!Array.isArray(messages) || !messages.length) return "";
  return ` — ${messages.map(String).join(" | ").slice(0, 400)}`;
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
    res = await countedFetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(withSafeBlocks(payload)),
    });
  } catch (err) {
    // A budget stop is not a network error — let the loop report it as one and
    // say what's missing, rather than the reply claiming Slack was unreachable.
    rethrowIfBudget(err);
    console.warn(`[slack] ${method} fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, error: "network_error" } as unknown as T;
  }
  return parseSlackResponse<T>(res, method);
}

/**
 * Every Block Kit payload leaves through the markup pass: the blocks are what a
 * reader sees, and `<…>` Slack cannot parse blanks a message (live 2026-09-22,
 * `mrkdwn.ts` § sanitizeSlackMarkup). Here, once, rather than at each builder.
 */
function withSafeBlocks(payload: Record<string, unknown>): Record<string, unknown> {
  return payload.blocks ? { ...payload, blocks: sanitizeSlackBlocks(payload.blocks) } : payload;
}

/**
 * Answer through an interaction's or a slash command's `response_url` — the one
 * way the Worker posts without `chat.postMessage`, so it takes the same markup
 * pass: `text` and every mrkdwn block. Throws what the fetch throws; the
 * callers decide what a failed reply is worth.
 */
export async function postToResponseUrl(
  responseUrl: string,
  body: { text: string; blocks?: unknown[] } & Record<string, unknown>,
): Promise<void> {
  await countedFetch(responseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(withSafeBlocks({ ...body, text: sanitizeSlackMarkup(body.text) })),
  });
}

/**
 * Open a modal on an interaction's `trigger_id` (valid three seconds, one use).
 * The opened view's id, which `viewsUpdate` fills in later, or null when Slack
 * refused — an expired trigger answers `expired_trigger_id`. A view's blocks
 * take the same markup pass as a message's.
 */
export async function viewsOpen(env: Env, triggerId: string, view: Record<string, unknown>): Promise<string | null> {
  const res = await slackCall<SlackResponse>(env, "views.open", { trigger_id: triggerId, view: withSafeBlocks(view) });
  if (!res.ok) return null;
  const id = (res.view as { id?: unknown } | undefined)?.id;
  return typeof id === "string" ? id : null;
}

/**
 * Push a view over the modal a click came from (`views.push`), on that
 * click's `trigger_id`. The pushed view's id, or null when Slack refused.
 * Slack keeps at most three views in a stack.
 */
export async function viewsPush(env: Env, triggerId: string, view: Record<string, unknown>): Promise<string | null> {
  const res = await slackCall<SlackResponse>(env, "views.push", { trigger_id: triggerId, view: withSafeBlocks(view) });
  if (!res.ok) return null;
  const id = (res.view as { id?: unknown } | undefined)?.id;
  return typeof id === "string" ? id : null;
}

/** Replace an open modal's contents. Whether Slack took it. */
export async function viewsUpdate(env: Env, viewId: string, view: Record<string, unknown>): Promise<boolean> {
  const res = await slackCall<SlackResponse>(env, "views.update", { view_id: viewId, view: withSafeBlocks(view) });
  return res.ok;
}

// Slack READ methods reject JSON bodies (invalid_arguments — the
// conversations.replies lesson, 2026-07-10): they take GET query params.
async function slackGet<T extends SlackResponse>(
  env: Env,
  method: string,
  params: Record<string, string>,
): Promise<T> {
  return slackGetWith<T>(env.SLACK_BOT_TOKEN, method, params);
}

/** The read methods a person's own token may be used for. */
export type UserTokenReadMethod = "users.conversations" | "conversations.history" | "conversations.replies";

/**
 * A Slack read on a token other than the bot's — a person's own connected one
 * (ADR-020). THE GUARD IS THE METHOD TYPE: Slack accepts GET for write methods
 * too, so GET is no protection; `UserTokenReadMethod` admits only reads, and a
 * write cannot be named here. The transport, parse guard and failure warn are
 * the bot's own.
 */
export async function slackReadAs<T extends SlackResponse = SlackResponse>(
  token: string,
  method: UserTokenReadMethod,
  params: Record<string, string>,
): Promise<T> {
  return slackGetWith<T>(token, method, params);
}

async function slackGetWith<T extends SlackResponse>(
  token: string,
  method: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  let res: Response;
  try {
    res = await countedFetch(`https://slack.com/api/${method}?${qs}`, {
      headers: { authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // A budget stop is not a network error — let the loop report it as one and
    // say what's missing, rather than the reply claiming Slack was unreachable.
    rethrowIfBudget(err);
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
  /** A guest: multi-channel (`is_restricted`) or single-channel
   *  (`is_ultra_restricted`). */
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  deleted?: boolean;
}

/** users.info via the bot token — profile fields for one user id. */
export async function usersInfo(env: Env, userId: string) {
  return slackGet<SlackResponse & { user?: SlackUserInfo }>(env, "users.info", {
    user: userId,
  });
}

/** users.list via the bot token — one page of the workspace directory. */
export async function usersList(env: Env, cursor?: string) {
  return slackGet<SlackResponse & { members?: SlackUserInfo[]; response_metadata?: { next_cursor?: string } }>(
    env,
    "users.list",
    { limit: "200", ...(cursor ? { cursor } : {}) },
  );
}

/** conversations.members via the bot token — one page of member ids, the
 *  first unless `cursor` names the next. */
export async function conversationsMembers(env: Env, channel: string, limit = 100, cursor?: string) {
  return slackGet<SlackResponse & { members?: string[]; response_metadata?: { next_cursor?: string } }>(
    env,
    "conversations.members",
    { channel, limit: String(limit), ...(cursor ? { cursor } : {}) },
  );
}

/** users.conversations via the bot token — one page of the conversations of
 *  `types` uno-bot is a member of, the first unless `cursor` names the next. */
export async function botConversations(env: Env, types: string, cursor?: string) {
  return slackGet<SlackResponse & { channels?: { id?: string }[]; response_metadata?: { next_cursor?: string } }>(
    env,
    "users.conversations",
    { types, exclude_archived: "true", limit: "200", ...(cursor ? { cursor } : {}) },
  );
}

/** conversations.info via the bot token — what kind of conversation this is. */
export async function conversationsInfo(env: Env, channel: string) {
  return slackGet<
    SlackResponse & { channel?: { id?: string; is_private?: boolean; is_im?: boolean; is_mpim?: boolean } }
  >(env, "conversations.info", { channel });
}

/** One message as conversations.history returns it, threads summarised. */
export interface HistoryMessage {
  ts: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  text?: string;
  thread_ts?: string;
  reply_count?: number;
  latest_reply?: string;
  /** Present only when the read asked for it (`includeMetadata`). */
  metadata?: SlackMessageMetadata;
}

/** Slack message metadata: an app's own tag on a message it posted. */
export interface SlackMessageMetadata {
  event_type: string;
  event_payload: Record<string, unknown>;
}

/**
 * One page of a channel's top-level messages posted after `oldest`, via the
 * bot token — the end-of-day sweep's read (`sweep/env.ts`). Pages of 200; the
 * caller follows `response_metadata.next_cursor` as far as its budget allows.
 */
export async function conversationsHistorySince(
  env: Env,
  channel: string,
  oldest: string,
  cursor?: string,
  opts: { includeMetadata?: boolean } = {},
) {
  return slackGet<
    SlackResponse & { messages?: HistoryMessage[]; response_metadata?: { next_cursor?: string } }
  >(env, "conversations.history", {
    channel,
    oldest,
    limit: "200",
    ...(cursor ? { cursor } : {}),
    ...(opts.includeMetadata ? { include_all_metadata: "true" } : {}),
  });
}

export interface PostMessageInput {
  channel: string;
  text: string;
  thread_ts?: string;
  mrkdwn?: boolean;
  blocks?: unknown[];
  /** Also show this threaded reply in the main conversation. */
  reply_broadcast?: boolean;
  /** False keeps Slack from previewing the links in the message. */
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  /** The app's own tag, read back with `include_all_metadata`. */
  metadata?: SlackMessageMetadata;
}

/**
 * Replace one of the bot's own messages — chat.update, which Slack allows a
 * bot token on the bot's messages only.
 */
export async function updateMessage(
  env: Env,
  input: { channel: string; ts: string; text: string; blocks?: unknown[]; metadata?: SlackMessageMetadata },
) {
  return slackCall<SlackResponse & { ts?: string }>(env, "chat.update", {
    ...input,
    text: sanitizeSlackMarkup(toSlackMrkdwn(input.text)),
    blocks: input.blocks ?? [],
  });
}

// NOTE ON THE DISPLAY NAME. The bot presents as "Le Goat" because the bot
// user's display_name says so (set in app settings, 2026-08-06) — NOT via a
// per-message `username` override. An override was tried and reverted: Slack
// ignores or mis-attributes it on the agent surface, and two sources of truth
// for one name is how they drift. Slack derives the @handle from display_name,
// so the mention moved to @le goat with it; the app name stays "Uno-bot", which
// is what search matches on.
export async function postMessage(env: Env, input: PostMessageInput) {
  // Coerce the body to valid Slack mrkdwn at the single egress point — the model
  // slips into GitHub-flavored Markdown (## / **bold** / tables) under load, and
  // Slack renders none of it. Idempotent on Worker-authored text. (blocks, when
  // present, are Worker-built and already valid.)
  //
  // Then the markup pass, on everything: `<…>` Slack cannot parse blanks the
  // whole message (live 2026-09-22), so only valid markup leaves as markup.
  return slackCall<SlackResponse & { ts?: string; channel?: string }>(env, "chat.postMessage", {
    mrkdwn: true,
    ...input,
    ...(input.text ? { text: sanitizeSlackMarkup(toSlackMrkdwn(input.text)) } : {}),
  });
}

// ── Streaming (chat.startStream / appendStream / stopStream) ─────────────────
//
// Opening a stream is what renders the native "thinking" state on the agent
// surface. agents.sessions.setStatus is no substitute at the point this runs: a
// thread-based session is addressed by thread_ts, and a FRESH DM has none — the
// first reply is what creates the thread the session hangs on (which is why
// shortcuts.ts posts a titled anchor before anything else).
//
// The agent runs to completion inside a DO alarm before any text exists, so we
// do NOT stream tokens. We open the stream when the turn starts (the indicator),
// then append the finished answer and close. That is an honest use of the API:
// the indicator is live, the text arrives when it arrives.
//
// EVERY call here is best-effort and returns null/false on failure. Streaming is
// newer than this app's floor, so a workspace or plan that lacks it must degrade
// to an ordinary postMessage rather than lose the answer.

/** How Slack renders the task cards inside a stream.
 *  `timeline` (Slack's default) lists them as they arrive; `plan` shows them
 *  together as a checklist that fills in. See startStream's plan-mode note. */
export type TaskDisplayMode = "timeline" | "plan" | "dense";

/** The statuses Slack takes on a task card. Its typings list `pending` too;
 *  the API answers that with `invalid_arguments`, so it is not one of them. */
export type TaskStatus = "in_progress" | "complete" | "error";

/** A `task_update` chunk — one step in the plan, updated in place by `id`.
 *  Its text is plain text, already passed (`mrkdwn.ts` § `toPlainText`). */
export interface TaskChunk {
  id: string;
  title: string;
  status: TaskStatus;
  details?: string;
  output?: string;
  /** Links the step read, already filtered to what the thread may see. */
  sources?: ReadonlyArray<{ text: string; url: string }>;
  /** The card's glyph, as Slack's icon object (`estate-glyphs.ts`). */
  icon?: SlackIcon;
}

export async function startStream(
  env: Env,
  channel: string,
  threadTs: string | undefined,
  recipientUserId?: string,
  recipientTeamId?: string,
  // PLAN MODE — and the one condition that makes an early stream honest.
  //
  // The stream is normally opened at DELIVERY, not at turn start. Opening it
  // early was tried and reverted: with nothing to put in it, the client renders
  // an empty "AGENT" bubble for the whole 30–90s run — a blank message
  // impersonating a loading state.
  //
  // `plan` is the exception, and the only one. In plan mode the stream carries
  // TASK CARDS, so an early open renders a checklist of what the agent is
  // doing rather than an empty bubble — the interim narration this Worker
  // already produces, in the place it belongs, instead of as three loose
  // :hourglass: messages in the thread. It stays flag-gated (SLACK_STREAM_PLAN)
  // because the failure mode if Slack renders it differently than expected is
  // an ugly artifact on every single turn.
  taskDisplayMode?: TaskDisplayMode,
): Promise<string | null> {
  // THE ARGUMENT CONTRACT. Stated here once; everywhere else cites this.
  //
  // thread_ts is REQUIRED — a stream is a threaded message. recipient_user_id
  // and recipient_team_id are required "when streaming to channels", which is
  // all Slack's reference says: whether a DM counts as a channel for this is
  // NOT settled, and an earlier note here asserted that it does on no evidence
  // beyond the sentence reading that way. So callers pass the pair on every
  // surface, and the answer path declines to open a stream without it
  // (`slack/stream-recipient.ts`) rather than betting on a reading.
  //
  // Omitting the pair returns invalid_arguments, and nothing in the error names
  // the missing field — which is how "Slack rejects our arguments" survived as
  // an explanation for six revisions while the answer path was sending none.
  // The stream probe (`diagnostics/probes/slack.ts`) is what settles any of
  // this against the live install: it can omit each argument independently.
  try {
    const res = await slackCall<SlackResponse & { ts?: string }>(env, "chat.startStream", {
      channel,
      ...(threadTs ? { thread_ts: threadTs } : {}),
      ...(recipientUserId ? { recipient_user_id: recipientUserId } : {}),
      ...(recipientTeamId ? { recipient_team_id: recipientTeamId } : {}),
      ...(taskDisplayMode ? { task_display_mode: taskDisplayMode } : {}),
    });
    if (res.ok && res.ts) return res.ts;
    // Say WHY. A silent null here is indistinguishable from "streaming is off",
    // which cost a deploy cycle to diagnose: the fallback works, so the only
    // symptom is a missing indicator.
    //
    // The bare error code is not enough: `invalid_arguments` names no field.
    // Slack puts the specifics in response_metadata.messages, so log that and
    // which arguments we actually sent (ids only — no token, no message text).
    console.warn(
      `[slack] chat.startStream declined: ${res.error ?? "no ts in response"} | detail=${JSON.stringify(
        (res as Record<string, unknown>).response_metadata ?? null,
      )} | sent={thread_ts:${threadTs ?? "MISSING"},recipient_user_id:${recipientUserId ?? "MISSING"},recipient_team_id:${recipientTeamId ?? "MISSING"}}`,
    );
    return null;
  } catch (err) {
    console.warn(`[slack] chat.startStream threw: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// ── The stream's markup pass ────────────────────────────────────────────────
//
// Every word a stream carries leaves through `appendStream` or `stopStream`
// (`startStream` sends none), and both take `sanitizeSlackMarkup`'s rule by way
// of `sanitizeStreamChunk`: valid `<…>` markup stays, every other `<`, `>` and
// bare `&` is escaped. Slack documents `markdown_text` only as "message text
// formatted in markdown" — not whether it parses `<…>` the way `text` does, and
// on `text` markup it cannot parse blanked a whole message (live 2026-09-22).
// So the stream takes the same pass until a live probe says otherwise; the
// probe and what it settles are in docs/connectors/slack.md.
//
// The pass holds back a tail the next append could complete, keyed by stream
// ts; `stopStream` sends whatever is still held and forgets the stream.

const streamMarkup = new Map<string, StreamMarkupState>();

/** A stream that never closes must not hold its tail forever. */
const STREAM_MARKUP_LIMIT = 64;

function streamPiece(ts: string, text: string, final: boolean): string {
  const { text: out, state } = sanitizeStreamChunk(streamMarkup.get(ts) ?? STREAM_MARKUP_START, text, final);
  streamMarkup.delete(ts);
  if (!final) {
    if (streamMarkup.size >= STREAM_MARKUP_LIMIT) streamMarkup.delete(streamMarkup.keys().next().value!);
    streamMarkup.set(ts, state);
  }
  return out;
}

export async function appendStream(
  env: Env,
  channel: string,
  ts: string,
  markdownText: string,
): Promise<boolean> {
  const text = streamPiece(ts, markdownText, false);
  // All of it held back (`<@team`, waiting on `mate>`): nothing to send yet,
  // and an empty append is not something to ask Slack to accept.
  if (!text) return true;
  try {
    const res = await slackCall<SlackResponse>(env, "chat.appendStream", {
      channel,
      ts,
      markdown_text: text,
    });
    return !!res.ok;
  } catch {
    return false;
  }
}

/** Push plan steps into an open stream, in ONE append — `chunks` is an array,
 *  so closing one card and opening the next costs one subrequest. `id` is the
 *  identity of a step — sending the same id again UPDATES that card rather
 *  than adding another, so a step goes in_progress → complete without ever
 *  duplicating. Best-effort: a dropped progress card is not worth failing a
 *  turn over. */
export async function appendTasks(
  env: Env,
  channel: string,
  ts: string,
  tasks: readonly TaskChunk[],
): Promise<boolean> {
  if (!tasks.length) return true;
  try {
    const res = await slackCall<SlackResponse>(env, "chat.appendStream", {
      channel,
      ts,
      chunks: tasks.map((task) => ({
        type: "task_update",
        id: task.id,
        title: chunkText(task.title),
        status: task.status,
        ...(task.details ? { details: chunkText(task.details) } : {}),
        ...(task.output ? { output: chunkText(task.output) } : {}),
        ...cardLinks(task, chunkText),
      })),
    });
    return !!res.ok;
  } catch {
    return false;
  }
}

/** Retitle the open stream's plan — one `plan_update` chunk. Its `title` is
 *  plain text like a card's, held to the 256-char chunk limit. Best-effort, as
 *  every progress update is. */
export async function setPlanTitle(env: Env, channel: string, ts: string, title: string): Promise<boolean> {
  try {
    const res = await slackCall<SlackResponse>(env, "chat.appendStream", {
      channel,
      ts,
      chunks: [{ type: "plan_update", title: title.slice(0, 256) }],
    });
    return !!res.ok;
  } catch {
    return false;
  }
}

/**
 * A task card's plain text, within the 256-char chunk limit.
 *
 * Slack shows a card's title, `details`, `output` and a source's name as plain
 * text, so they arrive already through the plain-text pass (the adapter runs
 * `toPlainText` on every word as it enters a card) and take no markup pass
 * here: the mrkdwn escaper turned a source's `&` into a visible `&amp;`.
 */
function chunkText(text: string): string {
  return text.slice(0, 250);
}

/** Close the stream. Blocks are only accepted here — which is why the feedback
 *  footer can ride along on the final frame. */
export async function stopStream(
  env: Env,
  channel: string,
  ts: string,
  blocks?: Array<Record<string, unknown>>,
): Promise<boolean> {
  // The held tail, if any: an unclosed `<…` the stream ended on goes out escaped.
  const tail = streamPiece(ts, "", true);
  try {
    const res = await slackCall<SlackResponse>(env, "chat.stopStream", {
      channel,
      ts,
      ...(tail ? { markdown_text: tail } : {}),
      ...(blocks?.length ? { blocks } : {}),
    });
    return !!res.ok;
  } catch {
    return false;
  }
}

export async function addReaction(
  env: Env,
  channel: string,
  ts: string,
  name: string,
) {
  return slackCall<SlackResponse>(env, "reactions.add", { channel, timestamp: ts, name });
}

/**
 * True when a confirmed run leaves a reviewable artifact — a draft PR, a new
 * PRD — and so warrants a heads-up in #plus-design for team review (D5).
 *
 * The roster and the artifact's name are both the tool table's `reviewRequest`
 * column (`agent/tool-table.ts`): this module kept a set of three names and a
 * second map of three labels beside it, so a new tool that opened a PR was
 * announced nowhere, and one that was in the set but not the map announced
 * itself by its raw tool name. An archive or an update is not in the column —
 * a removal has nothing to review.
 */
export function warrantsReviewRequest(toolName: string): boolean {
  return rowFor(toolName)?.reviewRequest != null;
}

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
  const what = rowFor(input.toolName)?.reviewRequest ?? input.toolName;
  const reviewers = (input.reviewerUserIds ?? []).map((id) => `<@${id}>`).join(" ");
  const lines = [
    `*Review request* — a ${what} is ready.`,
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
    files?: SlackEventFile[];
    subtype?: string;
    metadata?: SlackMessageMetadata;
    blocks?: unknown[];
  }>;
  has_more?: boolean;
  response_metadata?: { next_cursor?: string };
}

/** Open (or find) the DM channel with a user. Shortcut answers land here rather
 *  than in the channel the shortcut fired from: "catch me up on this thread"
 *  posted publicly announces you were not following it, and "is this still
 *  true?" reads as calling out whoever wrote the message. */
export async function conversationsOpen(env: Env, userId: string): Promise<string | null> {
  const res = await openConversation(env, userId);
  return res.ok ? res.channel : null;
}

/** `conversations.open` with Slack's refusal kept. A relayed DM has to say WHY
 *  a DM could not be opened — a deactivated account, a bot, a Slack Connect
 *  user — and `conversationsOpen` above answers every one of those as null. */
export async function openConversation(
  env: Env,
  userId: string,
): Promise<{ ok: true; channel: string } | { ok: false; error: string }> {
  const res = await slackCall<SlackResponse & { channel?: { id?: string } }>(
    env,
    "conversations.open",
    { users: userId },
  );
  if (!res.ok) return { ok: false, error: res.error };
  return res.channel?.id ? { ok: true, channel: res.channel.id } : { ok: false, error: "no_channel" };
}

/** Permalink for a message. Fetched, never constructed: the archive URL shape
 *  depends on the workspace domain, and a link the bot built is a link nobody
 *  verified — the failure this codebase treats as fabrication. */
export async function getPermalink(env: Env, channel: string, ts: string): Promise<string | null> {
  const res = await slackGet<SlackResponse & { permalink?: string }>(env, "chat.getPermalink", {
    channel,
    message_ts: ts,
  });
  return res.ok ? (res.permalink ?? null) : null;
}

/**
 * The messages posted just BEFORE `beforeTs` in this channel. One page, no
 * cursor — see antecedent.ts for why the absence of pagination is a rule and
 * not an oversight.
 *
 * `latest` + `inclusive: false` is the whole mechanism: Slack returns the page
 * ENDING at that timestamp, newest first, excluding the anchor itself. There is
 * no way for this to reach a message posted after the question.
 *
 * Returns [] on any failure. A missing antecedent degrades the answer; a throw
 * here would lose it entirely.
 */
export async function conversationsHistoryBefore(
  env: Env,
  channel: string,
  beforeTs: string,
  limit: number,
): Promise<Array<{ user?: string; bot_id?: string; text?: string; ts: string; subtype?: string }>> {
  const res = await slackGet<
    SlackResponse & { messages?: Array<{ user?: string; bot_id?: string; text?: string; ts: string; subtype?: string }> }
  >(env, "conversations.history", {
    channel,
    latest: beforeTs,
    inclusive: "false",
    limit: String(limit),
  });
  if (!res.ok || !Array.isArray(res.messages)) return [];
  // Slack returns newest-first here (the opposite of conversations.replies).
  return [...res.messages].reverse();
}

/** Delete one of the bot's own messages. Only ever called for a message the
 *  bot posted — Slack rejects anything else on a bot token, which is the
 *  authorization we want rather than one we would have to write. */
export async function deleteMessage(env: Env, channel: string, ts: string) {
  return slackCall<SlackResponse>(env, "chat.delete", { channel, ts });
}

export async function conversationsReplies(
  env: Env,
  channel: string,
  thread_ts: string,
  limit = 20,
  opts: { cursor?: string; includeMetadata?: boolean } = {},
) {
  // conversations.replies is a READ method (query params, not a JSON body).
  // slackGet owns the transport, parse-guard, and failure-warn.
  return slackGet<ConversationsRepliesResult>(env, "conversations.replies", {
    channel,
    ts: thread_ts,
    limit: String(limit),
    inclusive: "true",
    ...(opts.cursor ? { cursor: opts.cursor } : {}),
    ...(opts.includeMetadata ? { include_all_metadata: "true" } : {}),
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
