// Notion hosted-MCP OAuth 2.1 client — authorization-code + PKCE + dynamic client
// registration (RFC 7591), per the MCP authorization spec.
//
// mcp.notion.com is its OWN OAuth authorization server and does NOT accept Notion
// integration tokens or any static bearer (verified: developers.notion.com/guides/mcp
// + a live probe of /.well-known/oauth-authorization-server). So this implements the
// full browser flow, performed ONCE by a human at /oauth/notion/start; the resulting
// access + refresh tokens live in KV and the Worker refreshes silently thereafter —
// the standard "headless via one-time consent" pattern.
//
// No manual Notion OAuth app and no client secret are needed: we register a PUBLIC
// client dynamically (token_endpoint_auth_method: "none") and rely on PKCE.
//
// SECURITY: read-only. The MCP is attached with a read-only toolset (agent/mcp.ts);
// writes never go through MCP.

import type { Env } from "../types";

const MCP_RESOURCE = "https://mcp.notion.com";
const AUTHORIZE_URL = "https://mcp.notion.com/authorize";
const TOKEN_URL = "https://mcp.notion.com/token";
const REGISTER_URL = "https://mcp.notion.com/register";

const KV_TOKEN = "notion_oauth_token";
const KV_CLIENT = "notion_oauth_client";
const KV_PKCE_PREFIX = "notion_oauth_pkce:";
const PKCE_TTL_S = 600;

export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch ms; absent → non-expiring
}

interface StoredClient {
  client_id: string;
  client_secret?: string;
}

/** Is the OAuth path configured at all? (client_id now comes from dynamic
 *  registration, so only the redirect URI + KV binding are required.) */
export function notionOAuthConfigured(env: Env): boolean {
  return Boolean(env.NOTION_OAUTH_REDIRECT_URI && env.NOTION_OAUTH_KV);
}

// ─── PKCE helpers ────────────────────────────────────────────────────────────
function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randomString(nBytes = 48): string {
  const b = new Uint8Array(nBytes);
  crypto.getRandomValues(b);
  return base64url(b);
}
async function s256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(digest);
}

// ─── Dynamic client registration (cached in KV) ──────────────────────────────
async function getClient(env: Env): Promise<StoredClient> {
  const kv = env.NOTION_OAUTH_KV!;
  const cached = await kv.get(KV_CLIENT);
  if (cached) {
    try {
      return JSON.parse(cached) as StoredClient;
    } catch {
      /* fall through and re-register */
    }
  }
  const res = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "uno-bot",
      redirect_uris: [env.NOTION_OAUTH_REDIRECT_URI],
      token_endpoint_auth_method: "none", // public client + PKCE
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof json.client_id !== "string") {
    throw new Error(`notion MCP client registration failed (${res.status}): ${JSON.stringify(json)}`);
  }
  const client: StoredClient = {
    client_id: json.client_id,
    client_secret: typeof json.client_secret === "string" ? json.client_secret : undefined,
  };
  await kv.put(KV_CLIENT, JSON.stringify(client));
  return client;
}

// ─── Start: register (if needed) → PKCE → redirect to consent ────────────────
export async function startNotionOAuth(env: Env): Promise<Response> {
  if (!notionOAuthConfigured(env)) {
    return new Response(
      "notion oauth not configured (need NOTION_OAUTH_REDIRECT_URI + NOTION_OAUTH_KV)",
      { status: 500 },
    );
  }
  try {
    const client = await getClient(env);
    const verifier = randomString();
    const challenge = await s256(verifier);
    const state = randomString(24);
    await env.NOTION_OAUTH_KV!.put(KV_PKCE_PREFIX + state, verifier, { expirationTtl: PKCE_TTL_S });

    const u = new URL(AUTHORIZE_URL);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id", client.client_id);
    u.searchParams.set("redirect_uri", env.NOTION_OAUTH_REDIRECT_URI!);
    u.searchParams.set("code_challenge", challenge);
    u.searchParams.set("code_challenge_method", "S256");
    u.searchParams.set("state", state);
    u.searchParams.set("resource", MCP_RESOURCE);
    return Response.redirect(u.toString(), 302);
  } catch (e) {
    return new Response(`notion oauth start failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

// ─── Token endpoint (form-encoded; public client → client_id in body) ────────
async function tokenRequest(
  env: Env,
  client: StoredClient,
  form: Record<string, string>,
): Promise<StoredToken> {
  const body = new URLSearchParams({ ...form, client_id: client.client_id, resource: MCP_RESOURCE });
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  // Only if the server issued us a confidential client (it shouldn't, we register
  // as public) — support client_secret_basic just in case.
  if (client.client_secret) {
    headers.Authorization = `Basic ${btoa(`${client.client_id}:${client.client_secret}`)}`;
  }
  const res = await fetch(TOKEN_URL, { method: "POST", headers, body: body.toString() });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof json.access_token !== "string") {
    throw new Error(`notion MCP token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  }
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : undefined;
  return {
    access_token: json.access_token,
    refresh_token: typeof json.refresh_token === "string" ? json.refresh_token : undefined,
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
  };
}

// ─── Callback: exchange code + verifier, persist token ───────────────────────
export async function handleNotionOAuthCallback(request: Request, env: Env): Promise<Response> {
  if (!notionOAuthConfigured(env)) {
    return new Response("notion oauth not configured", { status: 500 });
  }
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) {
    return new Response(
      `notion oauth error: ${err} — ${url.searchParams.get("error_description") ?? ""}`,
      { status: 400 },
    );
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new Response("missing ?code/?state", { status: 400 });

  const kv = env.NOTION_OAUTH_KV!;
  const verifier = await kv.get(KV_PKCE_PREFIX + state);
  if (!verifier) {
    return new Response("unknown or expired state — restart at /oauth/notion/start", { status: 400 });
  }
  await kv.delete(KV_PKCE_PREFIX + state);

  try {
    const client = await getClient(env);
    const token = await tokenRequest(env, client, {
      grant_type: "authorization_code",
      code,
      redirect_uri: env.NOTION_OAUTH_REDIRECT_URI!,
      code_verifier: verifier,
    });
    await kv.put(KV_TOKEN, JSON.stringify(token));
    return new Response("✅ uno-bot connected to Notion (hosted MCP). You can close this tab.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (e) {
    return new Response(`token exchange failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

// ─── Refresh a rotating token ────────────────────────────────────────────────
async function refresh(env: Env, stored: StoredToken): Promise<StoredToken> {
  if (!stored.refresh_token) return stored;
  const client = await getClient(env);
  const next = await tokenRequest(env, client, {
    grant_type: "refresh_token",
    refresh_token: stored.refresh_token,
  });
  if (!next.refresh_token) next.refresh_token = stored.refresh_token; // server may not re-send it
  await env.NOTION_OAUTH_KV!.put(KV_TOKEN, JSON.stringify(next));
  return next;
}

/**
 * Get a valid access token, refreshing when near expiry. Returns null when the
 * OAuth path isn't set up or no token is stored yet — the caller then simply
 * doesn't attach the Notion MCP (the bot's REST read tools still work).
 */
export async function getNotionAccessToken(env: Env): Promise<string | null> {
  if (!notionOAuthConfigured(env)) return null;
  const raw = await env.NOTION_OAUTH_KV!.get(KV_TOKEN);
  if (!raw) return null;
  let stored: StoredToken;
  try {
    stored = JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
  if (stored.expires_at && stored.expires_at - Date.now() < 60_000) {
    try {
      stored = await refresh(env, stored);
    } catch {
      return null; // refresh failed → drop to REST fallback rather than 500
    }
  }
  return stored.access_token ?? null;
}
