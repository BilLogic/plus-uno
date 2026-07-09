// Notion hosted-MCP OAuth 2.1 client — a thin ProviderConfig over the generic
// helper in mcp-oauth.ts (which is itself the pattern factored out of this flow).
//
// mcp.notion.com is its OWN OAuth authorization server and does NOT accept Notion
// integration tokens or any static bearer (verified: developers.notion.com/guides/mcp
// + a live probe of /.well-known/oauth-authorization-server). So this implements the
// full browser flow, performed ONCE by a human at /oauth/notion/start; the resulting
// access + refresh tokens live in KV and the Worker refreshes silently thereafter.
//
// No manual Notion OAuth app and no client secret are needed: we register a PUBLIC
// client dynamically (token_endpoint_auth_method: "none") and rely on PKCE.
//
// SECURITY: read-only. The MCP is attached with a read-only toolset (agent/mcp.ts);
// writes never go through MCP.

import type { Env } from "../types";
import {
  type ProviderConfig,
  startOAuth,
  handleOAuthCallback,
  getAccessToken,
} from "./mcp-oauth";

/** Is the OAuth path configured at all? (client_id comes from dynamic
 *  registration, so only the redirect URI + KV binding are required.) */
export function notionOAuthConfigured(env: Env): boolean {
  return Boolean(env.NOTION_OAUTH_REDIRECT_URI && env.NOTION_OAUTH_KV);
}

function config(env: Env): ProviderConfig {
  return {
    name: "notion",
    resource: "https://mcp.notion.com",
    authorizeUrl: "https://mcp.notion.com/authorize",
    tokenUrl: "https://mcp.notion.com/token",
    registerUrl: "https://mcp.notion.com/register", // dynamic registration
    tokenAuthMethod: "none", // public client + PKCE
    redirectUri: env.NOTION_OAUTH_REDIRECT_URI!,
    kv: env.NOTION_OAUTH_KV!,
    successMessage: "✅ uno-bot connected to Notion (hosted MCP). You can close this tab.",
  };
}

export async function startNotionOAuth(env: Env): Promise<Response> {
  if (!notionOAuthConfigured(env)) {
    return new Response(
      "notion oauth not configured (need NOTION_OAUTH_REDIRECT_URI + NOTION_OAUTH_KV)",
      { status: 500 },
    );
  }
  return startOAuth(config(env));
}

export async function handleNotionOAuthCallback(request: Request, env: Env): Promise<Response> {
  if (!notionOAuthConfigured(env)) {
    return new Response("notion oauth not configured", { status: 500 });
  }
  return handleOAuthCallback(config(env), request);
}

/**
 * Get a valid access token, refreshing when near expiry. Returns null when the
 * OAuth path isn't set up or no token is stored yet — the caller then simply
 * doesn't attach the Notion MCP (the bot's REST read tools still work).
 */
export async function getNotionAccessToken(env: Env): Promise<string | null> {
  if (!notionOAuthConfigured(env)) return null;
  return getAccessToken(config(env));
}
