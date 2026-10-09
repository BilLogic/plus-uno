// slack_thread_read executor — READ-ONLY. Read the messages of a Slack thread
// the user linked (outside this conversation's own memory) — sign-off tallies,
// reviewer verdicts, source discussions. Runs inline in the agent loop (no gate).

//
// On a `publicOnly` turn (an ask from a Figma comment, whose answer people
// outside the team can read) only a public channel's thread is read: the
// channel is checked first, and a private one, a DM or a group DM is refused.

import type { Env, SlackContext } from "../types";
import { conversationsInfo, conversationsReplies } from "../slack/api";
import { rethrowIfBudget } from "../net";

// Slack permalink: https://<ws>.slack.com/archives/<CHANNEL>/p<10 digits><6 digits>
// where the message ts is "<10>.<6>". A ?thread_ts= param may also appear.
function parseSlackLink(link: string): { channel: string; ts: string } | null {
  const m = link.match(/\/archives\/([A-Z0-9]+)\/p(\d{10})(\d{6})/i);
  if (!m) return null;
  return { channel: m[1]!, ts: `${m[2]!}.${m[3]!}` };
}

export async function executeSlackThreadRead(
  env: Env,
  input: Record<string, unknown>,
  slack?: Pick<SlackContext, "publicOnly">,
): Promise<string> {
  const link = typeof input.link === "string" ? input.link.trim() : "";
  const parsed = link ? parseSlackLink(link) : null;
  if (!parsed) {
    return JSON.stringify({ ok: false, error: "couldn't parse a Slack channel + message ts from that link" });
  }
  if (slack?.publicOnly && !(await isPublicChannel(env, parsed.channel))) {
    return JSON.stringify({
      ok: false,
      error: "this answer is posted outside Slack, so only a public channel's thread can be read; that one is private or could not be checked",
    });
  }

  try {
    const res = (await conversationsReplies(env, parsed.channel, parsed.ts, 50)) as {
      ok?: boolean;
      error?: string;
      messages?: Array<{ user?: string; bot_id?: string; text?: string; ts?: string }>;
    };
    if (res.ok === false || !res.messages) {
      return JSON.stringify({
        ok: false,
        error: `slack conversations.replies: ${res.error ?? "failed"}`,
        note: "The bot may not be a member of that channel — it must be invited first.",
      });
    }
    const messages = res.messages.map((m) => ({
      author: m.user ?? m.bot_id ?? "?",
      ts: m.ts,
      text: m.text ?? "",
    }));
    return JSON.stringify({
      ok: true,
      channel: parsed.channel,
      count: messages.length,
      messages,
      note: "The thread's messages. Use them to tally sign-offs/verdicts or synthesize; cite by author. Do not @-mention unless asked.",
    });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

/** Whether Slack says a channel is public; a lookup that fails counts as not. */
async function isPublicChannel(env: Env, channel: string): Promise<boolean> {
  try {
    const info = await conversationsInfo(env, channel);
    const c = info.ok ? info.channel : undefined;
    return !!c && c.is_private === false && !c.is_im && !c.is_mpim;
  } catch (err) {
    rethrowIfBudget(err);
    return false;
  }
}
