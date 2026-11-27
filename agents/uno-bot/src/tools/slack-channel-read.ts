// slack_channel_read executor — READ-ONLY. Read the latest messages of one
// Slack channel (what people said there lately), as text, shaped like
// `slack_thread_read`. Runs inline in the agent loop (no gate).
//
// A public channel reads. A private channel, a DM or a group DM reads only
// when its id is in `SLACK_SEARCH_PRIVATE_ALLOWLIST` and never on a
// `publicOnly` turn (an ask from a Figma comment, whose answer people outside
// the team can read): there the channel is checked first and anything but a
// public one is refused.

import type { Env, SlackContext } from "../types";
import { conversationsHistoryLatest } from "../slack/api";
import { rethrowIfBudget } from "../net";
import { isPublicChannel } from "./slack-thread-read";

const MAX_LIMIT = 50;

export async function executeSlackChannelRead(
  env: Env,
  input: Record<string, unknown>,
  slack?: Pick<SlackContext, "publicOnly">,
): Promise<string> {
  const channel = typeof input.channel === "string" ? input.channel.trim() : "";
  if (!/^[CGD][A-Z0-9]+$/i.test(channel)) {
    return JSON.stringify({ ok: false, error: "channel must be a Slack channel id such as C03FC8AS69K" });
  }
  const asked = typeof input.limit === "number" && Number.isFinite(input.limit) ? Math.floor(input.limit) : 20;
  const limit = Math.min(MAX_LIMIT, Math.max(1, asked));

  if (!(await isPublicChannel(env, channel))) {
    const allowed = (env.SLACK_SEARCH_PRIVATE_ALLOWLIST ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (slack?.publicOnly) {
      return JSON.stringify({
        ok: false,
        error: "this answer is posted outside Slack, so only a public channel can be read; that one is private or could not be checked",
      });
    }
    if (!allowed.includes(channel)) {
      return JSON.stringify({
        ok: false,
        error: "that channel is private, a DM or a group DM, and is not on the cleared list, so it can't be read",
      });
    }
  }

  try {
    const res = await conversationsHistoryLatest(env, channel, limit);
    if (!res.ok) {
      return JSON.stringify({
        ok: false,
        error: `slack conversations.history: ${res.error ?? "failed"}`,
        note: "The bot may not be a member of that channel — it must be invited first.",
      });
    }
    const messages = res.messages
      .filter((m) => !m.subtype && typeof m.text === "string" && m.text.trim() !== "")
      .map((m) => ({ author: m.user ?? m.bot_id ?? "?", ts: m.ts, text: m.text ?? "" }));
    return JSON.stringify({
      ok: true,
      channel,
      count: messages.length,
      messages,
      note: "The channel's latest messages, oldest first, text only: read or synthesize what people said, cite by author, and @-mention only when asked.",
    });
  } catch (err) {
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
