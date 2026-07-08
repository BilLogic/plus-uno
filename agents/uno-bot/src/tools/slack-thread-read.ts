// slack_thread_read executor — READ-ONLY. Read the messages of a Slack thread
// the user linked (outside this conversation's own memory) — sign-off tallies,
// reviewer verdicts, source discussions. Runs inline in the agent loop (no gate).

import type { Env } from "../types";
import { conversationsReplies } from "../slack/api";

// Slack permalink: https://<ws>.slack.com/archives/<CHANNEL>/p<10 digits><6 digits>
// where the message ts is "<10>.<6>". A ?thread_ts= param may also appear.
function parseSlackLink(link: string): { channel: string; ts: string } | null {
  const m = link.match(/\/archives\/([A-Z0-9]+)\/p(\d{10})(\d{6})/i);
  if (!m) return null;
  return { channel: m[1]!, ts: `${m[2]!}.${m[3]!}` };
}

export async function executeSlackThreadRead(env: Env, input: Record<string, unknown>): Promise<string> {
  const link = typeof input.link === "string" ? input.link.trim() : "";
  const parsed = link ? parseSlackLink(link) : null;
  if (!parsed) {
    return JSON.stringify({ ok: false, error: "couldn't parse a Slack channel + message ts from that link" });
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
