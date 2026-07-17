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
  SlackAssistantThreadStartedEvent,
  SlackAssistantThreadContextChangedEvent,
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
  thread_ts: string,
  prompts: SuggestedPrompt[],
  title?: string,
): Promise<void> {
  await slackCall(env, "assistant.threads.setSuggestedPrompts", {
    channel_id: channel,
    thread_ts,
    prompts,
    ...(title ? { title } : {}),
  });
}

/** Set (or, with an empty string, clear) the "is thinking…" status line. */
export async function setStatus(
  env: Env,
  channel: string,
  thread_ts: string,
  status: string,
): Promise<void> {
  await slackCall(env, "assistant.threads.setStatus", {
    channel_id: channel,
    thread_ts,
    status,
  });
}

async function setAssistantTitle(
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

export async function handleAssistantThreadStarted(
  env: Env,
  event: SlackAssistantThreadStartedEvent,
): Promise<void> {
  const { channel_id, thread_ts, context } = event.assistant_thread;
  const userId = event.assistant_thread.user_id;
  // Persist the opening context so the first message can use it (message.im
  // events carry no context of their own).
  if (context) {
    await saveAssistantContext(env, channel_id, thread_ts, context);
  }
  // Detect-and-direct: offer the consent link only when it's actionable
  // (OAuth configured, user not yet connected). Best-effort — a failed token
  // lookup just means a plain welcome.
  let welcome = WELCOME;
  try {
    const url = slackConnectUrl(env);
    if (url && userId && !(await hasOwnSlackToken(env, userId))) {
      welcome += connectNudge(url);
    }
  } catch {
    /* plain welcome */
  }
  // Fire the three decorations together — independent, all best-effort.
  // allSettled (not all): one rejection must not cancel the in-flight siblings.
  await Promise.allSettled([
    postMessage(env, { channel: channel_id, thread_ts, text: welcome }),
    setSuggestedPrompts(env, channel_id, thread_ts, SUGGESTED_PROMPTS, "How can I help?"),
    setAssistantTitle(env, channel_id, thread_ts, "Chat with UNO Bot"),
  ]);
}

export async function handleAssistantThreadContextChanged(
  env: Env,
  event: SlackAssistantThreadContextChangedEvent,
): Promise<void> {
  const { channel_id, thread_ts, context } = event.assistant_thread;
  // Overwrite the stored surface — the next message reads the latest.
  await saveAssistantContext(env, channel_id, thread_ts, context ?? {});
}
