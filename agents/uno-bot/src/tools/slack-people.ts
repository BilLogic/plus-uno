// slack_user_profile + slack_channel_members executors — READ-ONLY, bot token.
// Built 2026-07-10 to close the gemini-mode gap: these reads used to come from
// the hosted Slack MCP (unavailable without server-side MCP). One subrequest
// each. Run inline in the agent loop (no gate).

import type { Env } from "../types";
import { usersInfo, conversationsMembers } from "../slack/api";

export async function executeSlackUserProfile(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const raw = typeof input.user_id === "string" ? input.user_id.trim() : "";
  // Accept both bare ids and <@U…> mention syntax.
  const userId = raw.replace(/^<@/, "").replace(/[|>].*$/, "");
  if (!userId) return JSON.stringify({ ok: false, error: "missing 'user_id'" });

  const res = await usersInfo(env, userId);
  if (!res.ok || !res.user) {
    return JSON.stringify({
      ok: false,
      error: (res as { error?: string }).error ?? "user lookup failed",
      note: "Couldn't read that profile — say so; don't guess who someone is.",
    });
  }
  const u = res.user;
  return JSON.stringify({
    ok: true,
    user: {
      id: u.id,
      name: u.profile?.display_name || u.real_name || u.name,
      real_name: u.real_name,
      title: u.profile?.title,
      email: u.profile?.email,
      status: u.profile?.status_text,
      tz: u.tz,
      is_bot: u.is_bot === true,
      deleted: u.deleted === true,
    },
    note: "Profile from Slack. @-mention as <@id> when referring to them in a reply.",
  });
}

export async function executeSlackChannelMembers(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const raw = typeof input.channel_id === "string" ? input.channel_id.trim() : "";
  const channel = raw.replace(/^<#/, "").replace(/[|>].*$/, "");
  if (!channel) return JSON.stringify({ ok: false, error: "missing 'channel_id'" });

  const res = await conversationsMembers(env, channel, 100);
  if (!res.ok || !res.members) {
    return JSON.stringify({
      ok: false,
      error: (res as { error?: string }).error ?? "member lookup failed",
      note: "Couldn't list that channel's members (the bot may not be in it) — say so plainly.",
    });
  }
  return JSON.stringify({
    ok: true,
    channel,
    count: res.members.length,
    member_ids: res.members,
    has_more: Boolean(res.response_metadata?.next_cursor),
    note: "Member ids only (first 100). Mention people as <@id> — Slack renders the name. For someone's role/title, look up their id with slack_user_profile; don't fetch every profile.",
  });
}
