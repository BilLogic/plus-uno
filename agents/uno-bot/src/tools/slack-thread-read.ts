// slack_thread_read executor — READ-ONLY. Read the messages of a Slack thread
// the user linked (outside this conversation's own memory): what people said,
// as text, without reactions. Runs inline in the agent loop (no gate).

//
// On a `publicOnly` turn (an ask from a Figma comment, whose answer people
// outside the team can read) only a public channel's thread is read: the
// channel is checked first, and a private one, a DM or a group DM is refused.
//
// The bot token reads first. When Slack says the bot cannot see the conversation
// and the turn is in the requester's own bot DM, the read retries once on that
// requester's own stored token (ADR-020): a user token sees exactly the
// conversations its owner is in. The gate is slack_search's own: own DM, not
// `publicOnly`, own slot only. Anywhere else the refusal stands.

import type { Env, SlackContext } from "../types";
import { conversationsInfo, conversationsReplies, slackReadAs } from "../slack/api";
import { rethrowIfBudget } from "../net";
import { inOwnDm } from "../slack/search-credential";
import { getSlackAccessTokenFor } from "../oauth/slack";

// Refusals that mean "the bot cannot see this conversation", not "the read
// failed": the only ones a person's own token can answer.
const BOT_BLIND_ERRORS: ReadonlySet<string> = new Set(["not_in_channel", "channel_not_found", "missing_scope"]);

type RepliesResult = {
  ok?: boolean;
  error?: string;
  messages?: Array<{ user?: string; bot_id?: string; text?: string; ts?: string }>;
};

/** The requester's own token, only on a turn in their own bot DM. */
async function ownTokenFor(env: Env, slack?: Partial<Pick<SlackContext, "channel" | "requestedBy" | "publicOnly">>): Promise<string | null> {
  if (!inOwnDm(slack)) return null;
  const stored = await getSlackAccessTokenFor(env, slack?.requestedBy);
  return stored?.own ? stored.token : null;
}

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
  slack?: Partial<Pick<SlackContext, "channel" | "requestedBy" | "publicOnly">>,
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
    let retriedOwn = false;
    let res = (await conversationsReplies(env, parsed.channel, parsed.ts, 50)) as RepliesResult;
    if (res.ok === false && res.error && BOT_BLIND_ERRORS.has(res.error)) {
      const own = await ownTokenFor(env, slack);
      if (own) {
        retriedOwn = true;
        res = (await slackReadAs(own, "conversations.replies", {
          channel: parsed.channel,
          ts: parsed.ts,
          limit: "50",
          inclusive: "true",
        })) as RepliesResult;
      }
    }
    if (res.ok === false || !res.messages) {
      return JSON.stringify({
        ok: false,
        error: `slack conversations.replies: ${res.error ?? "failed"}`,
        note: retriedOwn
          ? "Neither the bot nor your own token could read that thread; the bot would have to be invited to its channel."
          : "The bot may not be a member of that channel — it must be invited first.",
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
      note: "The thread's messages, text only: read or synthesize what people said, cite by author, and @-mention only when asked.",
    });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

/** Whether Slack says a channel is public; a lookup that fails counts as not. */
export async function isPublicChannel(env: Env, channel: string): Promise<boolean> {
  try {
    const info = await conversationsInfo(env, channel);
    const c = info.ok ? info.channel : undefined;
    return !!c && c.is_private === false && !c.is_im && !c.is_mpim;
  } catch (err) {
    rethrowIfBudget(err);
    return false;
  }
}
