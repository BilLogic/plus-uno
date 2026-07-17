// Slack hosted-MCP OAuth 2.1 client — a thin ProviderConfig over mcp-oauth.ts.
//
// Verified facts (live probe): mcp.slack.com is authorized via Slack's own OAuth
// (authorize https://slack.com/oauth/v2_user/authorize, token
// https://slack.com/api/oauth.v2.user.access) with PKCE S256 and
// client_secret_post — but Slack has NO dynamic client registration, so we use a
// STATIC pre-registered client (id/secret from env).
//
// ⚠️ Slack's token response is NON-STANDARD. Instead of the usual flat
// {access_token, refresh_token, expires_in} OAuth JSON, it returns:
//   { "ok": true, "authed_user": { "access_token": "xoxp-…",
//                                  "refresh_token": "…"   // only if token rotation is on
//                                  "expires_in": 43200 }} // only if rotation is on
// and on failure returns HTTP 200 with { "ok": false, "error": "…" }. The
// parseTokenResponse hook below handles this: require ok===true (else throw with
// the error field), read the user token from authed_user.access_token (falling
// back to a top-level access_token), same for refresh_token, and treat a missing
// expires_in as non-expiring.
//
// SECURITY NOTE: Slack is attached ENABLE-ALL (agent/mcp.ts) — read AND write.
// This is the ONE service where MCP writes are intentional (Slack is a native
// medium for the bot); the granted OAuth scopes bound what the token can do.

import type { Env } from "../types";
import {
  type ProviderConfig,
  type StoredToken,
  startOAuth,
  handleOAuthCallback,
  getAccessToken,
} from "./mcp-oauth";

// Space-joined user scopes requested at consent (read + the intentional writes).
const SLACK_SCOPES = [
  // Classic search scope: required by the raw search.messages Web API that the
  // slack_search visibility firewall calls directly (live missing_scope error,
  // 2026-07-10). The granular search:read.* scopes below only satisfy Slack's
  // hosted MCP server, not the Web API method.
  "search:read",
  "search:read.public",
  "search:read.private",
  "search:read.im",
  "search:read.mpim",
  "search:read.files",
  "search:read.users",
  "channels:history",
  "groups:history",
  "im:history",
  "mpim:history",
  "channels:read",
  "groups:read",
  "users:read",
  "users:read.email",
  "files:read",
  "reactions:read",
  "emoji:read",
  "canvases:read",
  "chat:write",
  "reactions:write",
  "canvases:write",
  "channels:write",
].join(" ");

/** Needs a STATIC pre-registered client (id+secret) plus the KV binding. */
export function slackOAuthConfigured(env: Env): boolean {
  return Boolean(
    env.SLACK_MCP_CLIENT_ID &&
      env.SLACK_MCP_CLIENT_SECRET &&
      env.SLACK_OAUTH_REDIRECT_URI &&
      env.SLACK_OAUTH_KV,
  );
}

// Slack's non-standard token response → StoredToken.
function parseSlackToken(json: Record<string, unknown>): StoredToken {
  if (json.ok !== true) {
    throw new Error(`slack token exchange failed: ${String(json.error ?? "unknown_error")}`);
  }
  const authedUser =
    typeof json.authed_user === "object" && json.authed_user !== null
      ? (json.authed_user as Record<string, unknown>)
      : {};
  const access =
    typeof authedUser.access_token === "string"
      ? authedUser.access_token
      : typeof json.access_token === "string"
        ? json.access_token
        : undefined;
  if (!access) {
    throw new Error(`slack token exchange: no access_token in response: ${JSON.stringify(json)}`);
  }
  const refresh =
    typeof authedUser.refresh_token === "string"
      ? authedUser.refresh_token
      : typeof json.refresh_token === "string"
        ? json.refresh_token
        : undefined;
  // expires_in only present when token rotation is enabled; otherwise non-expiring.
  const expiresIn =
    typeof authedUser.expires_in === "number"
      ? authedUser.expires_in
      : typeof json.expires_in === "number"
        ? json.expires_in
        : undefined;
  // Who consented — keys the per-user token slot (ADR-020: requester-scoped
  // visibility). Shape-validated before it can become part of a KV key.
  const identity =
    typeof authedUser.id === "string" && /^[UW][A-Z0-9]{2,20}$/.test(authedUser.id)
      ? authedUser.id
      : undefined;
  return {
    access_token: access,
    refresh_token: refresh,
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    identity,
  };
}

function config(env: Env): ProviderConfig {
  return {
    name: "slack",
    resource: "https://mcp.slack.com",
    authorizeUrl: "https://slack.com/oauth/v2_user/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.user.access",
    // No registerUrl → static client.
    staticClientId: env.SLACK_MCP_CLIENT_ID,
    staticClientSecret: env.SLACK_MCP_CLIENT_SECRET,
    tokenAuthMethod: "client_secret_post",
    scope: SLACK_SCOPES,
    redirectUri: env.SLACK_OAUTH_REDIRECT_URI!,
    kv: env.SLACK_OAUTH_KV!,
    parseTokenResponse: parseSlackToken,
    // The oauth.v2.user.access response omits authed_user.id in practice
    // (observed live 2026-07-16: Bill's consent produced an identity-less
    // token), so resolve the owner authoritatively via auth.test — the
    // identity keys the per-user slot (ADR-020).
    enrichToken: async (token) => {
      if (token.identity) return token;
      try {
        const res = await fetch("https://slack.com/api/auth.test", {
          method: "POST",
          headers: { authorization: `Bearer ${token.access_token}` },
        });
        const data = (await res.json()) as { ok?: boolean; user_id?: string };
        if (data.ok && typeof data.user_id === "string" && /^[UW][A-Z0-9]{2,20}$/.test(data.user_id)) {
          token.identity = data.user_id;
        }
      } catch {
        // best-effort: an identity-less token still lands in the legacy slot
      }
      return token;
    },
    successMessage:
      "✅ Slack linked. Searches you ask for in your DM with uno-bot now cover everything you can see. You can close this tab.",
  };
}

export async function startSlackOAuth(env: Env): Promise<Response> {
  if (!slackOAuthConfigured(env)) {
    return new Response(
      "slack oauth not configured (need SLACK_MCP_CLIENT_ID + SLACK_MCP_CLIENT_SECRET + SLACK_OAUTH_REDIRECT_URI + SLACK_OAUTH_KV)",
      { status: 500 },
    );
  }
  return startOAuth(config(env));
}

export async function handleSlackOAuthCallback(request: Request, env: Env): Promise<Response> {
  if (!slackOAuthConfigured(env)) {
    return new Response("slack oauth not configured", { status: 500 });
  }
  return handleOAuthCallback(config(env), request);
}

/**
 * Valid access token (refreshed near expiry when rotation is on), or null when
 * the OAuth path isn't set up or no token is stored — the caller then simply
 * doesn't attach the Slack MCP server.
 */
export async function getSlackAccessToken(env: Env): Promise<string | null> {
  if (!slackOAuthConfigured(env)) return null;
  return getAccessToken(config(env));
}

/** True when this user has connected their own Slack history (per-user token
 *  slot exists and is valid). Drives the first-contact onboarding nudge. */
export async function hasOwnSlackToken(env: Env, userId: string): Promise<boolean> {
  if (!slackOAuthConfigured(env)) return false;
  if (!/^[UW][A-Z0-9]{2,20}$/.test(userId)) return false;
  return (await getAccessToken(config(env), userId)) !== null;
}

/** User-facing consent URL (the OAuth entry point), derived from the
 *  configured redirect. Null when the OAuth path isn't set up. */
export function slackConnectUrl(env: Env): string | null {
  if (!env.SLACK_OAUTH_REDIRECT_URI) return null;
  try {
    return `${new URL(env.SLACK_OAUTH_REDIRECT_URI).origin}/oauth/slack/start`;
  } catch {
    return null;
  }
}

/**
 * Requester-scoped credential (ADR-020): the requester's OWN token when they
 * have consented at /oauth/slack/start (own=true — carries exactly their Slack
 * visibility, DMs included), else the legacy workspace token (own=false — the
 * caller must keep the hard visibility firewall). Null when nothing is stored.
 */
export async function getSlackAccessTokenFor(
  env: Env,
  userId?: string,
): Promise<{ token: string; own: boolean } | null> {
  if (!slackOAuthConfigured(env)) return null;
  if (userId && /^[UW][A-Z0-9]{2,20}$/.test(userId)) {
    const own = await getAccessToken(config(env), userId);
    if (own) return { token: own, own: true };
  }
  const legacy = await getAccessToken(config(env));
  return legacy ? { token: legacy, own: false } : null;
}
