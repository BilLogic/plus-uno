import type { SlackAppMentionEvent, SlackMessageEvent } from "./types";

export function appMentionToMessage(e: SlackAppMentionEvent): SlackMessageEvent {
  return {
    type: "message",
    channel: e.channel,
    user: e.user,
    text: e.text,
    ts: e.ts,
    thread_ts: e.thread_ts,
    bot_id: e.bot_id,
    subtype: e.subtype,
    files: e.files,
    action_token: e.action_token,
  };
}
