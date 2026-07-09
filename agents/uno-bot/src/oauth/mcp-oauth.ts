// Generic hosted-MCP OAuth 2.1 client — authorization-code + PKCE (S256), with
// optional RFC 7591 dynamic client registration, per the MCP authorization spec.
//
// This is the reusable core factored out of the original notion.ts flow. Each
// provider (Notion, Figma, Slack, …) supplies a ProviderConfig and delegates to
// startOAuth / handleOAuthCallback / getAccessToken here. The shape captures the
// three axes that actually differ between MCP OAuth servers:
//
//   1. client provisioning — dynamic registration (registerUrl present) vs. a
//      STATIC pre-registered client (staticClientId/staticClientSecret).
//   2. token endpoint auth — "none" (public + PKCE), "client_secret_post"
//      (client_id+secret in the body), or "client_secret_basic" (Basic header).
//   3. token response parsing — an optional parseTokenResponse hook for servers
//      whose token response is NOT standard OAuth JSON (e.g. Slack's
//      {ok, authed_user:{access_token,…}}).
//
// The one-time browser consent is performed by a human at /oauth/<svc>/start; the
// resulting tokens live in the provider's KV namespace and the Worker refreshes
// silently thereafter — the standard "headless via one-time consent" pattern.

export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch ms; absent → non-expiring
}

interface StoredClient {
  client_id: string;
  client_secret?: string;
}

export type TokenAuthMethod = "none" | "client_secret_post" | "client_secret_basic";

export interface ProviderConfig {
  /** Short provider name — used for KV key prefixes + user-facing messages. */
  name: string;
  /** RFC 8707 resource indicator sent on authorize + token requests. */
  resource: string;
  authorizeUrl: string;
  tokenUrl: string;
  /** Present → dynamic client registration (RFC 7591). Absent → static client. */
  registerUrl?: string;
  /** Static client credentials (used when registerUrl is absent). */
  staticClientId?: string;
  staticClientSecret?: string;
  /** How the token endpoint authenticates the client. */
  tokenAuthMethod: TokenAuthMethod;
  /** Space-joined scope string (omit when the server takes no scope). */
  scope?: string;
  redirectUri: string;
  kv: KVNamespace;
  /**
   * Optional hook for NON-STANDARD token responses (Slack). Receives the parsed
   * JSON body and must return a StoredToken or throw. When omitted, the standard
   * OAuth JSON parser is used (reads access_token/refresh_token/expires_in).
   */
  parseTokenResponse?: (json: Record<string, unknown>) => StoredToken;
  /** Text shown on the success page after callback. */
  successMessage?: string;
}

// ─── KV key helpers (namespaced per provider; each provider also has its own KV
//     namespace, so this is belt-and-suspenders) ───────────────────────────────
const PKCE_TTL_S = 600;
const tokenKey = (cfg: ProviderConfig) => `${cfg.name}_oauth_token`;
const clientKey = (cfg: ProviderConfig) => `${cfg.name}_oauth_client`;
const pkceKey = (cfg: ProviderConfig, state: string) => `${cfg.name}_oauth_pkce:${state}`;

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

// ─── Client provisioning: static or dynamic registration (cached in KV) ──────
async function getClient(cfg: ProviderConfig): Promise<StoredClient> {
  // Static client — credentials come straight from config (env). No registration.
  if (!cfg.registerUrl) {
    if (!cfg.staticClientId) {
      throw new Error(`${cfg.name} oauth: no registerUrl and no staticClientId configured`);
    }
    return { client_id: cfg.staticClientId, client_secret: cfg.staticClientSecret };
  }

  // Dynamic registration — register once, cache the result (incl. any issued
  // client_secret for confidential clients like Figma) in KV.
  const cached = await cfg.kv.get(clientKey(cfg));
  if (cached) {
    try {
      return JSON.parse(cached) as StoredClient;
    } catch {
      /* fall through and re-register */
    }
  }
  const body: Record<string, unknown> = {
    client_name: "uno-bot",
    redirect_uris: [cfg.redirectUri],
    token_endpoint_auth_method: cfg.tokenAuthMethod,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  };
  if (cfg.scope) body.scope = cfg.scope;
  const res = await fetch(cfg.registerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof json.client_id !== "string") {
    throw new Error(`${cfg.name} MCP client registration failed (${res.status}): ${JSON.stringify(json)}`);
  }
  const client: StoredClient = {
    client_id: json.client_id,
    client_secret: typeof json.client_secret === "string" ? json.client_secret : undefined,
  };
  await cfg.kv.put(clientKey(cfg), JSON.stringify(client));
  return client;
}

// ─── Start: register (if needed) → PKCE → redirect to consent ────────────────
export async function startOAuth(cfg: ProviderConfig): Promise<Response> {
  try {
    const client = await getClient(cfg);
    const verifier = randomString();
    const challenge = await s256(verifier);
    const state = randomString(24);
    await cfg.kv.put(pkceKey(cfg, state), verifier, { expirationTtl: PKCE_TTL_S });

    const u = new URL(cfg.authorizeUrl);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id", client.client_id);
    u.searchParams.set("redirect_uri", cfg.redirectUri);
    u.searchParams.set("code_challenge", challenge);
    u.searchParams.set("code_challenge_method", "S256");
    u.searchParams.set("state", state);
    u.searchParams.set("resource", cfg.resource);
    if (cfg.scope) u.searchParams.set("scope", cfg.scope);
    return Response.redirect(u.toString(), 302);
  } catch (e) {
    return new Response(`${cfg.name} oauth start failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

// ─── Standard OAuth-JSON token parser (default) ──────────────────────────────
function defaultParseToken(cfg: ProviderConfig, json: Record<string, unknown>, res: Response): StoredToken {
  if (!res.ok || typeof json.access_token !== "string") {
    throw new Error(`${cfg.name} MCP token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  }
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : undefined;
  return {
    access_token: json.access_token,
    refresh_token: typeof json.refresh_token === "string" ? json.refresh_token : undefined,
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
  };
}

// ─── Token endpoint (form-encoded; client auth per tokenAuthMethod) ──────────
async function tokenRequest(
  cfg: ProviderConfig,
  client: StoredClient,
  form: Record<string, string>,
): Promise<StoredToken> {
  const body = new URLSearchParams({ ...form });
  body.set("resource", cfg.resource);
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };

  switch (cfg.tokenAuthMethod) {
    case "none":
      // Public client + PKCE — client_id travels in the body, no secret.
      body.set("client_id", client.client_id);
      break;
    case "client_secret_post":
      body.set("client_id", client.client_id);
      if (client.client_secret) body.set("client_secret", client.client_secret);
      break;
    case "client_secret_basic":
      body.set("client_id", client.client_id);
      if (client.client_secret) {
        headers.Authorization = `Basic ${btoa(`${client.client_id}:${client.client_secret}`)}`;
      }
      break;
  }

  const res = await fetch(cfg.tokenUrl, { method: "POST", headers, body: body.toString() });
  const json = (await res.json()) as Record<string, unknown>;
  // Non-standard responses (Slack) are handled by the provider's hook, which does
  // its own success/error detection (Slack returns HTTP 200 even on errors).
  if (cfg.parseTokenResponse) return cfg.parseTokenResponse(json);
  return defaultParseToken(cfg, json, res);
}

// ─── Callback: exchange code + verifier, persist token ───────────────────────
export async function handleOAuthCallback(cfg: ProviderConfig, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) {
    return new Response(
      `${cfg.name} oauth error: ${err} — ${url.searchParams.get("error_description") ?? ""}`,
      { status: 400 },
    );
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new Response("missing ?code/?state", { status: 400 });

  const verifier = await cfg.kv.get(pkceKey(cfg, state));
  if (!verifier) {
    return new Response(`unknown or expired state — restart at /oauth/${cfg.name}/start`, { status: 400 });
  }
  await cfg.kv.delete(pkceKey(cfg, state));

  try {
    const client = await getClient(cfg);
    const token = await tokenRequest(cfg, client, {
      grant_type: "authorization_code",
      code,
      redirect_uri: cfg.redirectUri,
      code_verifier: verifier,
    });
    await cfg.kv.put(tokenKey(cfg), JSON.stringify(token));
    const msg = cfg.successMessage ?? `✅ uno-bot connected to ${cfg.name} (hosted MCP). You can close this tab.`;
    return new Response(msg, { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    return new Response(`token exchange failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

// ─── Refresh a rotating token ────────────────────────────────────────────────
async function refresh(cfg: ProviderConfig, stored: StoredToken): Promise<StoredToken> {
  if (!stored.refresh_token) return stored;
  const client = await getClient(cfg);
  const next = await tokenRequest(cfg, client, {
    grant_type: "refresh_token",
    refresh_token: stored.refresh_token,
  });
  if (!next.refresh_token) next.refresh_token = stored.refresh_token; // server may not re-send it
  await cfg.kv.put(tokenKey(cfg), JSON.stringify(next));
  return next;
}

/**
 * Get a valid access token, refreshing when near expiry. Returns null when no
 * token is stored yet (or a refresh fails) — the caller then simply doesn't
 * attach the MCP server (REST/native fallbacks still work).
 */
export async function getAccessToken(cfg: ProviderConfig): Promise<string | null> {
  const raw = await cfg.kv.get(tokenKey(cfg));
  if (!raw) return null;
  let stored: StoredToken;
  try {
    stored = JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
  if (stored.expires_at && stored.refresh_token && stored.expires_at - Date.now() < 60_000) {
    try {
      stored = await refresh(cfg, stored);
    } catch {
      return null; // refresh failed → drop to fallback rather than 500
    }
  }
  return stored.access_token ?? null;
}
