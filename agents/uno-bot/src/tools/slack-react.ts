// `slack_react` — the one ungated tool that writes something a person sees.
//
// Reactions post AS UNO-BOT via the bot token — the Slack MCP was demoted to
// reads-only because its user-token writes carried the consenting human's
// identity (team decision 2026-07-10: everything visible is uno-bot). Ungated:
// reactions are reversible, the same class as the bot's own replies.
//
// It lives beside the other tool bodies rather than inside `run-agent.ts`
// because the tool table pairs every row with a body, and a body reachable
// only through the agent entry would drag that entry's Durable Object imports
// into every reader of the table.
import { addReaction } from "../slack/api";
import { GATE_RESERVED } from "../slack/gate-reactions";
import type { Env, SlackContext } from "../types";

export async function executeSlackReact(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const emoji = typeof input.emoji === "string" ? input.emoji.replace(/:/g, "").trim() : "";
  if (!emoji) return JSON.stringify({ ok: false, error: "missing emoji name" });
  // Every emoji the gate would read as a decision is off-limits to the bot —
  // the same set the gate reads, imported rather than mirrored.
  if (GATE_RESERVED.has(emoji)) {
    return JSON.stringify({
      ok: false,
      error: `${emoji} is reserved for confirm/cancel on proposal cards`,
    });
  }
  const ts = typeof input.message_ts === "string" && input.message_ts ? input.message_ts : slack.userMsgTs;
  try {
    await addReaction(env, slack.channel, ts, emoji);
    return JSON.stringify({ ok: true, reacted: emoji, message_ts: ts });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
