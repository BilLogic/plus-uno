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

// The per-thread work the AgentRunner DO processes (one job per alarm).
export type RunnerJobPayload =
  | { kind: "message"; event: SlackMessageEvent }
  | { kind: "reaction"; event: SlackReactionAddedEvent };
