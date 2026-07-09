// Notion OAuth (authorization-code) for the hosted-MCP READ path.
//
// One-time flow: a human hits /oauth/notion/start, approves in Notion, Notion
// redirects to /oauth/notion/callback?code=…, we exchange the code for a token
// and persist it in KV. At runtime the agent reads that token to authenticate the
// Notion hosted MCP (reads only). Notion's classic OAuth token is non-expiring; if
// yours returns `refresh_token`/`expires_in` (rotation), refresh() handles it.
//
// SECURITY: writes are never done through this — the MCP is attached read-only
// (see agent/mcp.ts). The client secret lives only as a wrangler secret.

import type { Env } from "../types";

const AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize";
const TOKEN_URL = "https://api.notion.com/v1/oauth/token";
const KV_KEY = "notion_oauth_token";

export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  // epoch ms; absent → treat as non-expiring
  expires_at?: number;
  workspace_id?: string;
  workspace_name?: string;
}

/** Is the OAuth path configured at all? */
export function notionOAuthConfigured(env: Env): boolean {
  return Boolean(
    env.NOTION_OAUTH_CLIENT_ID &&
      env.NOTION_OAUTH_CLIENT_SECRET &&
      env.NOTION_OAUTH_REDIRECT_URI &&
      env.NOTION_OAUTH_KV,
  );
}

/** The URL a human visits once to authorize. */
export function buildAuthorizeUrl(env: Env, state?: string): string {
  const u = new URL(AUTHORIZE_URL);
  u.searchParams.set("client_id", env.NOTION_OAUTH_CLIENT_ID ?? "");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("owner", "user");
  u.searchParams.set("redirect_uri", env.NOTION_OAUTH_REDIRECT_URI ?? "");
  if (state) u.searchParams.set("state", state);
  return u.toString();
}

function basicAuthHeader(env: Env): string {
  const raw = `${env.NOTION_OAUTH_CLIENT_ID}:${env.NOTION_OAUTH_CLIENT_SECRET}`;
  return `Basic ${btoa(raw)}`;
}

async function exchange(
  env: Env,
  body: Record<string, string>,
): Promise<StoredToken> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(env),
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof json.access_token !== "string") {
    throw new Error(
      `notion token exchange failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : undefined;
  return {
    access_token: json.access_token,
    refresh_token: typeof json.refresh_token === "string" ? json.refresh_token : undefined,
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    workspace_id: typeof json.workspace_id === "string" ? json.workspace_id : undefined,
    workspace_name: typeof json.workspace_name === "string" ? json.workspace_name : undefined,
  };
}

/** Handle the redirect: exchange ?code and persist the token. */
export async function handleNotionOAuthCallback(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!notionOAuthConfigured(env)) {
    return new Response("notion oauth not configured", { status: 500 });
  }
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) return new Response(`notion oauth error: ${err}`, { status: 400 });
  const code = url.searchParams.get("code");
  if (!code) return new Response("missing ?code", { status: 400 });

  try {
    const token = await exchange(env, {
      grant_type: "authorization_code",
      code,
      redirect_uri: env.NOTION_OAUTH_REDIRECT_URI ?? "",
    });
    await env.NOTION_OAUTH_KV!.put(KV_KEY, JSON.stringify(token));
    return new Response(
      `✅ uno-bot connected to Notion${token.workspace_name ? ` (${token.workspace_name})` : ""}. You can close this tab.`,
      { status: 200, headers: { "Content-Type": "text/plain" } },
    );
  } catch (e) {
    return new Response(`token exchange failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

/** Refresh a rotating token (no-op for Notion's classic non-expiring token). */
async function refresh(env: Env, stored: StoredToken): Promise<StoredToken> {
  if (!stored.refresh_token) return stored; // non-expiring — nothing to do
  const next = await exchange(env, {
    grant_type: "refresh_token",
    refresh_token: stored.refresh_token,
  });
  // Notion may not re-send the refresh token — keep the old one if so.
  if (!next.refresh_token) next.refresh_token = stored.refresh_token;
  await env.NOTION_OAUTH_KV!.put(KV_KEY, JSON.stringify(next));
  return next;
}

/**
 * Get a valid access token, refreshing if it's a rotating one near expiry.
 * Returns null when the OAuth path isn't set up or no token is stored yet — the
 * caller then simply doesn't attach the Notion MCP (REST read tools still work).
 */
export async function getNotionAccessToken(env: Env): Promise<string | null> {
  if (!notionOAuthConfigured(env)) return null;
  const raw = await env.NOTION_OAUTH_KV!.get(KV_KEY);
  if (!raw) return null;
  let stored: StoredToken;
  try {
    stored = JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
  if (stored.expires_at && stored.expires_at - Date.now() < 60_000) {
    stored = await refresh(env, stored);
  }
  return stored.access_token ?? null;
}
