// slack_search — workspace message search behind a VISIBILITY FIREWALL.
//
// Slack's search API only works with a USER token (bot tokens can't search).
// Two credential modes (ADR-020, 2026-07-16):
//
//   OWN token (requester consented at /oauth/slack/start) + the ask arrives in
//   the requester's own DM with the bot → results carry the requester's own
//   Slack visibility: their DMs, group DMs, and private channels pass. This is
//   physics, not policy — a user token can only see conversations its owner is
//   part of, so "requester must be a participant" is enforced by Slack itself.
//   Own-visibility NEVER activates outside the requester's bot DM: in shared
//   channels a passer-by could read what the bot quotes.
//
//   LEGACY workspace token (single consenting admin) → the original hard
//   filter stands, because that token's visibility is NOT the requester's:
//   • public channels          → pass
//   • allowlisted private ones → pass (env.SLACK_SEARCH_PRIVATE_ALLOWLIST)
//   • every other private channel, every DM, every group DM → DROPPED here,
//     unconditionally, no matter how the request was phrased.
// The model cannot surface what it never receives.

import type { Env, SlackContext } from "../types";
import { getSlackAccessTokenFor } from "../oauth/slack";

interface SearchMatch {
  channel?: {
    id?: string;
    name?: string;
    is_private?: boolean;
    is_im?: boolean;
    is_mpim?: boolean;
    is_group?: boolean;
  };
  username?: string;
  ts?: string;
  permalink?: string;
  text?: string;
}

export async function executeSlackSearch(
  env: Env,
  input: Record<string, unknown>,
  slack?: SlackContext,
): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) return JSON.stringify({ ok: false, error: "missing query" });

  // Own-visibility is surface-gated: only in the requester's own bot DM.
  const inOwnDm = Boolean(slack?.channel?.startsWith("D"));
  const requester = inOwnDm ? slack?.requestedBy : undefined;
  const cred = await getSlackAccessTokenFor(env, requester);
  if (!cred) {
    return JSON.stringify({
      ok: false,
      error: "workspace search unavailable (no search credential stored) — use thread/channel reads instead",
    });
  }
  const { token, own } = cred;

  const allowlist = new Set(
    (env.SLACK_SEARCH_PRIVATE_ALLOWLIST ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  try {
    const params = new URLSearchParams({ query, count: "20", highlight: "false" });
    const res = await fetch(`https://slack.com/api/search.messages?${params}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      ok: boolean;
      error?: string;
      messages?: { matches?: SearchMatch[]; total?: number };
    };
    if (!data.ok) return JSON.stringify({ ok: false, error: data.error ?? "search failed" });

    const matches = data.messages?.matches ?? [];
    let dropped = 0;
    const results = matches
      .filter((m) => {
        // OWN token in the requester's own DM: everything the token returns IS
        // the requester's own visibility (their DMs/mpims/private channels) —
        // pass it through; there is nothing here they can't already read.
        if (own) return true;
        const c = m.channel ?? {};
        if (c.is_im || c.is_mpim) {
          dropped++;
          return false; // DMs/group DMs: never searchable on the legacy token
        }
        if ((c.is_private || c.is_group) && !allowlist.has(c.id ?? "")) {
          dropped++;
          return false; // private channel not on the team allowlist
        }
        return true;
      })
      .slice(0, 12)
      .map((m) => ({
        channel: m.channel?.is_im
          ? "(a DM you're in)"
          : m.channel?.is_mpim
            ? "(a group DM you're in)"
            : m.channel?.name
              ? `#${m.channel.name}`
              : m.channel?.id,
        from: m.username,
        ts: m.ts,
        link: m.permalink,
        text: (m.text ?? "").slice(0, 400),
      }));

    // Consent nudge: in their own DM without a connected token, tell the model
    // the requester can widen coverage themselves (the link is user-facing).
    const connectNote =
      inOwnDm && !own && env.SLACK_OAUTH_REDIRECT_URI
        ? `results are workspace-filtered (no DMs/private). The requester can connect their own Slack history — searches here will then cover everything they can see — at ${new URL(env.SLACK_OAUTH_REDIRECT_URI).origin}/oauth/slack/start`
        : undefined;

    return JSON.stringify({
      ok: true,
      query,
      visibility: own ? "requester-own (their DMs/private included)" : "workspace-filtered",
      results,
      // The model is told results are pre-cleared; the count of withheld hits
      // lets it say "there were matches in spaces I can't surface" honestly
      // without knowing anything about them.
      withheld_private_matches: dropped,
      ...(connectNote ? { note: connectNote } : {}),
    });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
