// Which credential searches Slack — selection only, no transport.
//
// It lives here, not in oauth/slack.ts, because every export there short-circuits
// on slackOAuthConfigured(env): a bot resolver placed in that module would go
// silently unavailable exactly when OAuth is unconfigured, which is the failure
// this floor exists to fix. The bot token is an install-time credential
// (types.ts), not an OAuth one — selection now spans two stores.
//
// Returns an ORDERED CANDIDATE LIST, not a single pick. slack_search walks it
// own → legacy → bot; a future bot-first caller (thread_read) walks its own
// order over the same list.

import type { Env } from "../types";
import { getSlackAccessTokenFor } from "../oauth/slack";

export type SearchCredentialKind = "own" | "legacy" | "bot";

export interface SearchCredential {
  token: string;
  kind: SearchCredentialKind;
}

/**
 * Every search credential available for this requester, best reach first.
 *
 *   own    — the requester consented at /oauth/slack/start. Carries exactly
 *            their Slack visibility (DMs, group DMs, private channels).
 *            The CALLER is responsible for the surface gate (ADR-020): own
 *            visibility must never activate outside the requester's own bot DM.
 *   legacy — the stored workspace/admin token. Post-filter reach is public +
 *            the private allowlist, a strict SUPERSET of the bot's, which is
 *            why it sorts ahead of it.
 *   bot    — install-time SLACK_BOT_TOKEN. Public channels only, by scope
 *            (search:read.im/.mpim/.private are deliberately absent from the
 *            bot block of slack-app-manifest.yaml). This is the floor: what
 *            runs when no user credential is stored at all.
 *
 * @param userId - requester, only when the surface gate already passed
 */
export async function slackSearchCredentials(
  env: Env,
  userId?: string,
): Promise<SearchCredential[]> {
  const candidates: SearchCredential[] = [];
  const stored = await getSlackAccessTokenFor(env, userId);
  if (stored?.own) candidates.push({ token: stored.token, kind: "own" });
  else if (stored) candidates.push({ token: stored.token, kind: "legacy" });
  if (env.SLACK_BOT_TOKEN) candidates.push({ token: env.SLACK_BOT_TOKEN, kind: "bot" });
  return candidates;
}
