// Slack event wire types (the subset the Worker reads) + the runner job payload.
// Extracted from events.ts (2026-07-12) so the split-out modules — vision,
// proposal-render, delivery — can share these without importing back from
// events.ts (which would be a cycle). events.ts re-exports them for existing
// importers (index.ts, agent-runner.ts).

/** Slack file attachment metadata as delivered on message/app_mention events.
 *  Only the fields the vision path reads — everything else is ignored. */
export interface SlackEventFile {
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

/** The surface the user has open in the workspace while chatting in the assistant
 *  panel — delivered on assistant_thread_started and every context change. All
 *  fields optional: the user may have no channel focused. */
export interface AssistantContext {
  channel_id?: string;
  team_id?: string;
  enterprise_id?: string;
}

/** Shared payload for the two assistant-panel lifecycle events (identical wire
 *  shape; only the `type` literal differs). `started` fires when a user opens
 *  the app's assistant panel — the place to greet + set suggested prompts;
 *  `context_changed` fires when they switch what they're viewing with the
 *  panel open. `context` is what they currently have open. */
interface SlackAssistantThreadEventBase {
  assistant_thread: {
    user_id: string;
    channel_id: string;
    thread_ts: string;
    context?: AssistantContext;
  };
  event_ts: string;
}

export interface SlackAssistantThreadStartedEvent extends SlackAssistantThreadEventBase {
  type: "assistant_thread_started";
}

export interface SlackAssistantThreadContextChangedEvent extends SlackAssistantThreadEventBase {
  type: "assistant_thread_context_changed";
}

/** Fires when a user opens the app's App Home. `tab` distinguishes the Home tab
 *  (publish the landing view) from the Messages tab (ignore). */
export interface SlackAppHomeOpenedEvent {
  type: "app_home_opened";
  user: string;
  channel: string;
  tab?: "home" | "messages";
  event_ts: string;
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
  | SlackAssistantThreadStartedEvent
  | SlackAssistantThreadContextChangedEvent
  | SlackAppHomeOpenedEvent
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

// The per-thread work the AgentRunner DO processes (one job per alarm).
export type RunnerJobPayload =
  | { kind: "message"; event: SlackMessageEvent }
  | { kind: "reaction"; event: SlackReactionAddedEvent };
