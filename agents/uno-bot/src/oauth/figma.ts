// Figma hosted-MCP OAuth 2.1 client — a thin ProviderConfig over mcp-oauth.ts.
//
// Verified facts (live probe): mcp.figma.com is its own OAuth 2.1 server with
// PKCE S256, dynamic client registration, scope `mcp:connect`, and — unlike
// Notion — a CONFIDENTIAL client: dynamic registration RETURNS a client_secret
// which must be presented at the token endpoint (client_secret_post). Distinct
// authorize/token/register hosts (www.figma.com / api.figma.com).
//
// Endpoints live on separate hosts, so they're spelled out explicitly rather than
// derived from the MCP resource URL.
//
// SECURITY: read-only. The MCP is attached with a READ-only toolset (agent/mcp.ts)
// that enables only get_*/read tools — every generation/write tool is excluded.
// Figma generation is routed to the IDE and is never enabled via MCP here.

import type { Env } from "../types";
import {
  type ProviderConfig,
  startOAuth,
  handleOAuthCallback,
  getAccessToken,
} from "./mcp-oauth";

/** Only the redirect URI + KV binding are required — the confidential client's
 *  id+secret both come from dynamic registration (cached in KV). */
export function figmaOAuthConfigured(env: Env): boolean {
  return Boolean(env.FIGMA_OAUTH_REDIRECT_URI && env.FIGMA_OAUTH_KV);
}

function config(env: Env): ProviderConfig {
  return {
    name: "figma",
    resource: "https://mcp.figma.com/mcp",
    authorizeUrl: "https://www.figma.com/oauth/mcp",
    tokenUrl: "https://api.figma.com/v1/oauth/token",
    registerUrl: "https://api.figma.com/v1/oauth/mcp/register", // dynamic registration
    tokenAuthMethod: "client_secret_post", // confidential client (secret from registration)
    scope: "mcp:connect",
    redirectUri: env.FIGMA_OAUTH_REDIRECT_URI!,
    kv: env.FIGMA_OAUTH_KV!,
    successMessage: "✅ uno-bot connected to Figma (hosted MCP). You can close this tab.",
  };
}

export async function startFigmaOAuth(env: Env): Promise<Response> {
  if (!figmaOAuthConfigured(env)) {
    return new Response(
      "figma oauth not configured (need FIGMA_OAUTH_REDIRECT_URI + FIGMA_OAUTH_KV)",
      { status: 500 },
    );
  }
  return startOAuth(config(env));
}

export async function handleFigmaOAuthCallback(request: Request, env: Env): Promise<Response> {
  if (!figmaOAuthConfigured(env)) {
    return new Response("figma oauth not configured", { status: 500 });
  }
  return handleOAuthCallback(config(env), request);
}

/**
 * Valid access token (refreshed near expiry), or null when the OAuth path isn't
 * set up or no token is stored — the caller then simply doesn't attach the Figma
 * MCP server.
 */
export async function getFigmaAccessToken(env: Env): Promise<string | null> {
  if (!figmaOAuthConfigured(env)) return null;
  return getAccessToken(config(env));
}
