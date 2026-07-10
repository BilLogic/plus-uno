// slack_search — workspace message search behind a VISIBILITY FIREWALL.
//
// Slack's search API only works with a USER token (bot tokens can't search),
// and the stored token carries the consenting admin's full visibility — DMs,
// private channels, everything. Routing search through the hosted Slack MCP
// meant those results went straight into the model server-side, where the only
// protection was a harness rule (policy, not physics). This tool replaces MCP
// search: the Worker runs the search itself and HARD-FILTERS the results
// before the model ever sees them —
//   • public channels          → pass
//   • allowlisted private ones → pass (env.SLACK_SEARCH_PRIVATE_ALLOWLIST,
//     comma-separated channel IDs — the team-designated "well-organized"
//     private channels that are fair game)
//   • every other private channel, every DM, every group DM → DROPPED here,
//     unconditionally, no matter how the request was phrased.
// The model cannot surface what it never receives.

import type { Env } from "../types";
import { getSlackAccessToken } from "../oauth/slack";

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
): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) return JSON.stringify({ ok: false, error: "missing query" });

  const token = await getSlackAccessToken(env);
  if (!token) {
    return JSON.stringify({
      ok: false,
      error: "workspace search unavailable (no search credential stored) — use thread/channel reads instead",
    });
  }

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
        const c = m.channel ?? {};
        if (c.is_im || c.is_mpim) {
          dropped++;
          return false; // DMs/group DMs: never searchable, no exceptions
        }
        if ((c.is_private || c.is_group) && !allowlist.has(c.id ?? "")) {
          dropped++;
          return false; // private channel not on the team allowlist
        }
        return true;
      })
      .slice(0, 12)
      .map((m) => ({
        channel: m.channel?.name ? `#${m.channel.name}` : m.channel?.id,
        from: m.username,
        ts: m.ts,
        link: m.permalink,
        text: (m.text ?? "").slice(0, 400),
      }));

    return JSON.stringify({
      ok: true,
      query,
      results,
      // The model is told results are pre-cleared; the count of withheld hits
      // lets it say "there were matches in spaces I can't surface" honestly
      // without knowing anything about them.
      withheld_private_matches: dropped,
    });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
