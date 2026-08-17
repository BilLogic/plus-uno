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
  /** Set only on SYNTHETIC events (a shortcut, /grind, /chill) — an explicit
   *  tier that beats routing heuristics. Never present on a real Slack event. */
  tierOverride?: "chill" | "default" | "grind";
  /** Also synthetic-only: forces the answer's footer variant. The `draft`
   *  shortcut is the only setter — a draft goes out under the USER'S name, so
   *  the standard disclaimer describes the wrong risk. */
  footerHint?: "full" | "draft" | "none";
  /** Workspace the message came from. Slack includes it on message events;
   *  chat.startStream needs it as recipient_team_id. */
  team?: string;
  files?: SlackEventFile[];
  /** Per-event token Slack mints for apps that call the Real-time Search API
   *  with a BOT token (assistant.search.context). Optional: not every event
   *  carries one, and nothing else in the Worker needs it. */
  action_token?: string;
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
 *  (publish the landing view) from the Messages tab.
 *
 *  Under agent_view the Messages tab IS the agent conversation, so tab ===
 *  "messages" is the replacement signal for the retired assistant_thread_started
 *  — it is how we learn a user opened a DM with us. */
export interface SlackAppHomeOpenedEvent {
  type: "app_home_opened";
  user: string;
  channel: string;
  tab?: "home" | "messages";
  event_ts: string;
}

/** agent_view's replacement for assistant_thread_context_changed: fires when the
 *  user switches what they're looking at. Unlike the retired event this is not
 *  scoped to a thread — the DM channel is the conversation — so the payload is
 *  flat rather than nested under `assistant_thread`. */
export interface SlackAppContextChangedEvent {
  type: "app_context_changed";
  user?: string;
  channel?: string;
  app_context?: AssistantContext;
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
  /** Carried through appMentionToMessage — see SlackMessageEvent.action_token. */
  action_token?: string;
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
  | SlackAppContextChangedEvent
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
