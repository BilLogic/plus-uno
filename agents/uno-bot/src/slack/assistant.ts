// Slack Agents & Assistants surface — the side-panel / DM "agent experience"
// (enabled via the app's Agent toggle). Three native affordances the plain
// message path doesn't have:
//   • suggested prompts  — starter chips shown when the panel opens
//   • status             — the "is thinking…" line during a run
//   • title              — an auto-name for the assistant thread
//
// These use the assistant.threads.* Web API methods — JSON body with the param
// names `channel_id`/`thread_ts` (NOT `channel`/`ts`). The actual conversation
// still flows through message.im events into the normal agent path; this module
// only decorates the container.
//
// Every call is best-effort: a failure here degrades the panel's polish, never
// the answer, so callers don't await-and-throw on these. Transport goes through
// api.ts's slackCall — the single Slack egress point with the defensive parse.

import type { Env } from "../types";
import { postMessage, slackCall } from "./api";
import { saveAssistantContext } from "../thread-state-client";
import { hasOwnSlackToken, slackConnectUrl } from "../oauth/slack";
import type {
  AssistantContext,
  SlackAppContextChangedEvent,
} from "./types";

export interface SuggestedPrompt {
  /** Chip label shown to the user. */
  title: string;
  /** The message text sent when the chip is tapped (user can edit first). */
  message: string;
}

/** Starter chips shown on panel open — each maps to a real lane in AGENT.md so
 *  the first tap lands a grounded win (roadmap read, DS lookup, SME routing,
 *  PRD drafting). Slack renders up to 4. */
export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { title: "What's in progress?", message: "What design cards are currently in progress on the Roadmap?" },
  { title: "Look up a component", message: "Does the design system have a Badge component, and where are its docs?" },
  { title: "Who should I ask?", message: "Who's the right person to talk to about goal-setting?" },
  { title: "Draft a PRD", message: "Help me draft a PRD for a new feature idea." },
];

async function setSuggestedPrompts(
  env: Env,
  channel: string,
  thread_ts: string | undefined,
  prompts: SuggestedPrompt[],
  title?: string,
): Promise<void> {
  // thread_ts is omitted on the agent surface: prompts render at the top of the
  // Messages tab, which belongs to the channel rather than to any one thread.
  await slackCall(env, "assistant.threads.setSuggestedPrompts", {
    channel_id: channel,
    ...(thread_ts ? { thread_ts } : {}),
    prompts,
    ...(title ? { title } : {}),
  });
}

/** What the status line cycles through while a turn runs.
 *
 *  A single frozen "is thinking…" reads as hung on a 20–30s grounded run — the
 *  user cannot tell a slow answer from a dead one. Slack cycles this array
 *  client-side, so it costs one field, not one API call per step.
 *
 *  Ordered to match what the loop actually does (read sources, then reason,
 *  then write), so it stays honest rather than decorative. */
const LOADING_MESSAGES = [
  "reading the sources…",
  "checking Notion and GitHub…",
  "cross-checking what's current…",
  "putting it together…",
];

/** Set (or, with an empty string, clear) the status line on an App thread. */
export async function setStatus(
  env: Env,
  channel: string,
  thread_ts: string | undefined,
  status: string,
): Promise<void> {
  // assistant.threads.setStatus addresses a THREAD. Without one there is
  // nothing to decorate — skip rather than send a bad request.
  if (!thread_ts) return;
  const clearing = status === "";
  await slackCall(env, "assistant.threads.setStatus", {
    channel_id: channel,
    thread_ts,
    status,
    // Only while working. Sending them alongside the clear would re-arm the
    // spinner we are trying to take down.
    ...(clearing ? {} : { loading_messages: LOADING_MESSAGES }),
  });
}

/** Name an App thread. Slack asks for this explicitly — "Set the title
 *  initially to capture the first question from the user" — because the title
 *  is how a conversation is found again in History / Messages.
 *
 *  Removed during the agent_view migration on the reasoning that the agent DM
 *  had no thread. It does now (DM replies are threaded), so it is back. */
export async function setAssistantTitle(
  env: Env,
  channel: string,
  thread_ts: string,
  title: string,
): Promise<void> {
  await slackCall(env, "assistant.threads.setTitle", {
    channel_id: channel,
    thread_ts,
    title,
  });
}

/** A thread title from the opening question: one line, trimmed to something a
 *  sidebar can show. Slack truncates anyway; doing it here keeps the ellipsis
 *  on a word boundary. */
export function threadTitleFrom(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "Chat with UNO Bot";
  if (oneLine.length <= 60) return oneLine;
  const cut = oneLine.slice(0, 60);
  const brk = cut.lastIndexOf(" ");
  return `${brk > 30 ? cut.slice(0, brk) : cut}…`;
}

/** Assistant threads are IM channels (id starts with "D"). Used to gate the
 *  status/loader affordances, which only apply to the assistant surface. */
export function isAssistantThread(channel: string): boolean {
  return channel.startsWith("D");
}

/** One-line, model-facing description of the open surface — only the channel is
 *  meaningful to the model (team/enterprise ids aren't). Null when nothing is
 *  focused, so the caller can skip the injection entirely.
 *
 *  The id is validated against Slack's channel-id shape before interpolation:
 *  this string lands in a SYSTEM prompt block, so an unexpected payload (forged
 *  event, polluted DO record) must never be able to close the context tag and
 *  speak with system authority. */
const SLACK_CHANNEL_ID = /^[A-Z][A-Z0-9]{2,20}$/;
export function formatAssistantContext(ctx: AssistantContext | null | undefined): string | null {
  if (!ctx?.channel_id || !SLACK_CHANNEL_ID.test(ctx.channel_id)) return null;
  return `channel <#${ctx.channel_id}>`;
}

// A panel opened: greet once, offer the starter chips, name the thread. The
// welcome is protocol (like the Worker's own 👀/⏳ posts), not the model
// talking — so it's a fixed line, kept to one breath, and the chips do the rest.
const WELCOME =
  "Hey — I'm UNO Bot :goat:. Ask me about Roadmap cards, how a product flow works, " +
  "or design-system components — or drop a Notion/Figma link and I'll dig in. " +
  "Anything I'd create or change in Notion or GitHub waits for your :white_check_mark: first.";

// First-contact onboarding (ADR-020): when the panel opens for someone who
// hasn't connected their own Slack history, the welcome carries the one-tap
// consent link. Shown only here (panel open) — not per message, never naggy.
function connectNudge(url: string): string {
  return (
    `\n\nPS — I can also search *your* side of Slack: your DMs, group chats, and private channels, ` +
    `for asks like _"what did Cindy and I decide about the quota?"_ ` +
    `<${url}|Link your Slack> — takes 10 seconds, totally optional. ` +
    "Whatever I find there stays here between us."
  );
}

// The assistant_view handlers (handleAssistantThreadStarted /
// ...ContextChanged) were deleted 2026-08-06 with the migration to agent_view.
// Their replacements are handleAgentDmOpened and handleAppContextChanged below.
// assistant_view is deprecated by Slack and the switch is irreversible, so
// there is no path back that these would serve.

/** agent_view: the user opened the Messages tab, i.e. a DM with us. Replaces
 *  assistant_thread_started, which no longer fires on this surface.
 *
 *  The DM is the conversation, so there is no thread_ts anywhere — prompts
 *  attach to the channel, and there is no thread to title.
 *
 *  Prompts refresh on every open (idempotent — Slack replaces the set). The
 *  GREETING is once per user, ever: the Messages tab already holds the full DM
 *  history, so posting it on each open would spam a live conversation. That
 *  makes it real onboarding rather than a recurring banner.
 */
export async function handleAgentDmOpened(
  env: Env,
  channel: string,
  userId: string,
): Promise<void> {
  await Promise.allSettled([
    setSuggestedPrompts(env, channel, undefined, SUGGESTED_PROMPTS, "How can I help?"),
    greetOnce(env, channel, userId),
  ]);
}

/** Post WELCOME the first time a user opens the DM, and never again.
 *
 *  Guarded by a KV flag written BEFORE the post: a double-fire (Slack retries,
 *  two tabs) must not double-greet, and losing a greeting to a failed post is
 *  cheaper than greeting twice. Without HARNESS_KV we cannot dedupe, so we stay
 *  silent rather than risk greeting on every open.
 */
async function greetOnce(env: Env, channel: string, userId: string): Promise<void> {
  const kv = env.HARNESS_KV;
  if (!kv || !userId) return;
  const key = `agent-dm-greeted:${userId}`;
  if (await kv.get(key)) return;
  await kv.put(key, new Date().toISOString());

  let welcome = WELCOME;
  try {
    const url = slackConnectUrl(env);
    if (url && !(await hasOwnSlackToken(env, userId))) welcome += connectNudge(url);
  } catch {
    /* plain welcome */
  }
  await postMessage(env, { channel, text: welcome });
}

/** agent_view's replacement for assistant_thread_context_changed. Stored under
 *  the DM's conversation key (not a thread ts) so the next message in the chat
 *  reads it — see conversationTs() in events.ts, which uses the same key. */
export async function handleAppContextChanged(
  env: Env,
  event: SlackAppContextChangedEvent,
  dmConversationKey: string,
): Promise<void> {
  const channel = event.channel ?? event.app_context?.channel_id;
  if (!channel) return;
  await saveAssistantContext(env, channel, dmConversationKey, event.app_context ?? {});
}
