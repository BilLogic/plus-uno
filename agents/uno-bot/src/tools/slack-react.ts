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
//
// ONE PER MESSAGE PER TURN. The persona allows at most one content-matched
// reaction per message; `oneReactionPerMessage` holds it in code. The count
// is the turn's, so the turn's dispatch keeps the ledger and wraps the body in
// the guard (`agent/run-agent.ts` § TURN_WRAPPERS). Code's own 👀 and ❌ never
// pass through this tool, so they never count.
import { addReaction } from "../slack/api";
import { GATE_RESERVED } from "../gate/reactions";
import type { ToolBody } from "../agent/tool-bodies";
import type { Env, SlackContext } from "../types";

/** The message a call reacts to: the ts it names, or the person's message. */
function reactionTarget(input: Record<string, unknown>, slack: SlackContext): string {
  return typeof input.message_ts === "string" && input.message_ts ? input.message_ts : slack.userMsgTs;
}

/**
 * The reaction body, refusing a second reaction on a message this turn has
 * already reacted to. A reaction that failed to post uses nothing up.
 *
 * @param body - The `slack_react` body
 * @param reacted - The turn's ledger of messages reacted to, keyed by channel and ts
 */
export function oneReactionPerMessage(body: ToolBody, reacted: Set<string>): ToolBody {
  return async (env, input, slack) => {
    const key = `${slack.channel}:${reactionTarget(input, slack)}`;
    if (reacted.has(key)) {
      return JSON.stringify({
        ok: false,
        error: "already reacted to this message this turn; one reaction per message",
      });
    }
    const out = await body(env, input, slack);
    try {
      if ((JSON.parse(out) as { ok?: unknown }).ok === true) reacted.add(key);
    } catch {
      // a result the guard cannot read is not counted
    }
    return out;
  };
}

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
  const ts = reactionTarget(input, slack);
  try {
    await addReaction(env, slack.channel, ts, emoji);
    return JSON.stringify({ ok: true, reacted: emoji, message_ts: ts });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
