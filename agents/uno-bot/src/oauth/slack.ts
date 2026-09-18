// Slack OAuth — the one credential path behind requester-scoped Slack reads.
//
// WHY THIS IS ONE MODULE. It used to be two: a generic MCP OAuth client
// abstracting three axes — client provisioning, token-endpoint auth, token
// response parsing — and a thin Slack adapter selecting one value on each. Both
// of the other adapters (Notion, Figma) went away with their MCP scaffolding,
// which left every axis with exactly one live value and the branches for the
// others unreachable. A seam with one implementation is a seam that cannot be
// trusted, so the layer is gone. If a second provider ever returns, the generic
// layer comes back with two real callers to shape it.
//
// THE INTERFACE IS FOUR FUNCTIONS: startSlackOAuth (the consent redirect),
// handleSlackOAuthCallback (the code exchange), getSlackAccessTokenFor (the
// credential a request should run on) and slackConnectUrl (where to send
// someone who has not connected). PKCE, the two token slots and refresh are
// implementation; the KV namespace is a named dependency, so the callback path
// is exercisable with an in-memory Map and no Worker (tests/slack-oauth.test.ts).
//
// VERIFIED FACTS (live probe). mcp.slack.com is authorized through Slack's own
// OAuth — authorize https://slack.com/oauth/v2_user/authorize, token
// https://slack.com/api/oauth.v2.user.access — with PKCE S256 and
// client_secret_post. Slack has NO dynamic client registration, so the client
// is statically pre-registered and its id/secret come from the environment.
//
// ⚠️ Slack's token response is NON-STANDARD. Instead of the usual flat
// {access_token, refresh_token, expires_in} it returns:
//   { "ok": true, "authed_user": { "access_token": "xoxp-…",
//                                  "refresh_token": "…"   // only with rotation on
//                                  "expires_in": 43200 }} // only with rotation on
// and on failure returns HTTP 200 with { "ok": false, "error": "…" }, so the
// status line is no signal and ok===true is the only success test.
//
// TOKEN SLOTS (ADR-020, 2026-07-16). A consent lands in the slot keyed by the
// consenting Slack user id, so that user's reads carry exactly their own
// visibility. The legacy workspace slot is BOOTSTRAPPED by the first-ever
// consent and never overwritten by a later one: it is the filtered fallback for
// everyone else, and swapping whose visibility powers it behind their backs
// would silently change what the firewall is filtering.
//
// SECURITY NOTE. The user token this module issues is a READ credential in
// practice: it powers slack_search's Web API calls, and nothing else holds it.
// Writes post as uno-bot on the install-time bot token, because a user-token
// write carries the consenting human's identity and the team decided
// (2026-07-10) that everything visible is uno-bot. The write scopes are still
// requested at consent, so the granted scopes — not this module — are what
// bounds the token; narrowing them is a one-way door (ADR-024).

import type { Env } from "../types";
import { countedFetch } from "../net";

// ─── Slack endpoints and the consent scopes ─────────────────────────────────
const AUTHORIZE_URL = "https://slack.com/oauth/v2_user/authorize";
const TOKEN_URL = "https://slack.com/api/oauth.v2.user.access";
const AUTH_TEST_URL = "https://slack.com/api/auth.test";
/** RFC 8707 resource indicator, sent on authorize and on every token request. */
const RESOURCE = "https://mcp.slack.com";

// Space-joined user scopes requested at consent (read + the intentional writes).
const SCOPES = [
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

const SUCCESS_MESSAGE =
  "✅ Slack linked. Searches you ask for in your DM with uno-bot now cover everything you can see. You can close this tab.";

// ─── KV keys ────────────────────────────────────────────────────────────────
const PKCE_TTL_S = 600;
/** How long before expiry a token is refreshed rather than used. */
const REFRESH_MARGIN_MS = 60_000;

/** The pre-identity slot: the filtered workspace fallback. */
const LEGACY_SLOT = "slack_oauth_token";
/** One slot per consenting identity — requester-scoped visibility (ADR-020). */
const slotFor = (identity: string) => `${LEGACY_SLOT}:user:${identity}`;
const pkceSlot = (state: string) => `slack_oauth_pkce:${state}`;

// A Slack user id, and the gate that decides whether a value is safe to build a
// KV key out of. Every id — from the token response, from auth.test, from a
// caller — passes through here, so there is one definition of the shape rather
// than a regex repeated at each door.
const SLACK_USER_ID = /^[UW][A-Z0-9]{2,20}$/;
function slackUserId(value: unknown): string | undefined {
  return typeof value === "string" && SLACK_USER_ID.test(value) ? value : undefined;
}

interface StoredToken {
  access_token: string;
  refresh_token?: string;
  /** epoch ms; absent → non-expiring (Slack omits expires_in without rotation) */
  expires_at?: number;
  /** The consenting Slack user id, already shape-validated. Keys the own slot. */
  identity?: string;
}

/**
 * Everything the flow needs, named rather than reached for: the static client,
 * the redirect it is registered against, and the KV namespace the slots live in.
 */
interface SlackOAuthApp {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  kv: KVNamespace;
}

/** Null when the OAuth path is not set up — every entry point turns that into
 *  a visible answer rather than a throw. */
function app(env: Env): SlackOAuthApp | null {
  const { SLACK_MCP_CLIENT_ID, SLACK_MCP_CLIENT_SECRET, SLACK_OAUTH_REDIRECT_URI, SLACK_OAUTH_KV } = env;
  if (!SLACK_MCP_CLIENT_ID || !SLACK_MCP_CLIENT_SECRET || !SLACK_OAUTH_REDIRECT_URI || !SLACK_OAUTH_KV) {
    return null;
  }
  return {
    clientId: SLACK_MCP_CLIENT_ID,
    clientSecret: SLACK_MCP_CLIENT_SECRET,
    redirectUri: SLACK_OAUTH_REDIRECT_URI,
    kv: SLACK_OAUTH_KV,
  };
}

// ─── PKCE ───────────────────────────────────────────────────────────────────
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
async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(digest);
}

// ─── The token endpoint ─────────────────────────────────────────────────────
/**
 * One form-encoded POST to oauth.v2.user.access, for both the authorization-code
 * exchange and a refresh, with the static client authenticated in the body
 * (client_secret_post — the one method Slack offers).
 */
async function exchange(cfg: SlackOAuthApp, form: Record<string, string>): Promise<StoredToken> {
  const body = new URLSearchParams({
    ...form,
    resource: RESOURCE,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const res = await countedFetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return readTokenResponse((await res.json()) as Record<string, unknown>);
}

/** Slack's non-standard body → StoredToken, or a throw naming Slack's error. */
function readTokenResponse(json: Record<string, unknown>): StoredToken {
  if (json.ok !== true) {
    throw new Error(`slack token exchange failed: ${String(json.error ?? "unknown_error")}`);
  }
  const user =
    typeof json.authed_user === "object" && json.authed_user !== null
      ? (json.authed_user as Record<string, unknown>)
      : {};
  // The user token is the one that matters; the flat field is the fallback
  // shape, and it is what a refresh response sometimes uses.
  const pick = (field: string): unknown => user[field] ?? json[field];
  const access = pick("access_token");
  if (typeof access !== "string") {
    // Deliberately not interpolating the body: it would put a token or a code
    // into a log line the moment the shape changed rather than failed.
    throw new Error("slack token exchange: no access_token in the response");
  }
  const refresh = pick("refresh_token");
  const expiresIn = pick("expires_in");
  return {
    access_token: access,
    refresh_token: typeof refresh === "string" ? refresh : undefined,
    expires_at: typeof expiresIn === "number" ? Date.now() + expiresIn * 1000 : undefined,
    identity: slackUserId(user.id),
  };
}

/**
 * Who this token belongs to. oauth.v2.user.access omits authed_user.id in
 * practice (observed live 2026-07-16: a consent produced an identity-less
 * token), so the owner is resolved authoritatively through auth.test rather
 * than guessed. Best-effort: an identity-less token still has a home in the
 * legacy slot, so a failure here is not a failed consent.
 */
async function resolveOwner(token: StoredToken): Promise<StoredToken> {
  if (token.identity) return token;
  try {
    const res = await countedFetch(AUTH_TEST_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    const data = (await res.json()) as { ok?: boolean; user_id?: unknown };
    if (data.ok) return { ...token, identity: slackUserId(data.user_id) };
  } catch {
    /* fall through: the legacy slot takes it */
  }
  return token;
}

// ─── Start: PKCE, then the browser consent ──────────────────────────────────
export async function startSlackOAuth(env: Env): Promise<Response> {
  const cfg = app(env);
  if (!cfg) {
    return new Response(
      "slack oauth not configured (need SLACK_MCP_CLIENT_ID + SLACK_MCP_CLIENT_SECRET + SLACK_OAUTH_REDIRECT_URI + SLACK_OAUTH_KV)",
      { status: 500 },
    );
  }
  try {
    const verifier = randomString();
    const state = randomString(24);
    // The verifier stays here, parked under the state; only its hash travels.
    await cfg.kv.put(pkceSlot(state), verifier, { expirationTtl: PKCE_TTL_S });

    const u = new URL(AUTHORIZE_URL);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id", cfg.clientId);
    u.searchParams.set("redirect_uri", cfg.redirectUri);
    u.searchParams.set("code_challenge", await challengeFor(verifier));
    u.searchParams.set("code_challenge_method", "S256");
    u.searchParams.set("state", state);
    u.searchParams.set("resource", RESOURCE);
    u.searchParams.set("scope", SCOPES);
    return Response.redirect(u.toString(), 302);
  } catch (e) {
    return new Response(`slack oauth start failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

// ─── Callback: exchange the code, then fill the slots ───────────────────────
export async function handleSlackOAuthCallback(request: Request, env: Env): Promise<Response> {
  const cfg = app(env);
  if (!cfg) return new Response("slack oauth not configured", { status: 500 });

  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) {
    return new Response(
      `slack oauth error: ${err} — ${url.searchParams.get("error_description") ?? ""}`,
      { status: 400 },
    );
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new Response("missing ?code/?state", { status: 400 });

  const verifier = await cfg.kv.get(pkceSlot(state));
  if (!verifier) {
    return new Response("unknown or expired state — restart at /oauth/slack/start", { status: 400 });
  }
  // Single-use: the state is spent whether or not the exchange succeeds.
  await cfg.kv.delete(pkceSlot(state));

  try {
    const token = await resolveOwner(
      await exchange(cfg, {
        grant_type: "authorization_code",
        code,
        redirect_uri: cfg.redirectUri,
        code_verifier: verifier,
      }),
    );
    await store(cfg, token);
    return new Response(SUCCESS_MESSAGE, { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    return new Response(`token exchange failed: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
    });
  }
}

/**
 * Put a fresh consent where it belongs (ADR-020). An identified consent gets its
 * own slot, and BOOTSTRAPS the legacy slot only while that slot is still empty —
 * a later consent must never swap whose visibility powers the filtered
 * workspace fallback. An identity-less token has nowhere else to go.
 */
async function store(cfg: SlackOAuthApp, token: StoredToken): Promise<void> {
  if (!token.identity) {
    await cfg.kv.put(LEGACY_SLOT, JSON.stringify(token));
    return;
  }
  await cfg.kv.put(slotFor(token.identity), JSON.stringify(token));
  if (!(await cfg.kv.get(LEGACY_SLOT))) {
    await cfg.kv.put(LEGACY_SLOT, JSON.stringify(token));
  }
}

// ─── Reading a credential ───────────────────────────────────────────────────
/**
 * A usable access token out of one slot, refreshed when it is near expiry, or
 * null when the slot is empty, unreadable, or past saving.
 *
 * A stale token must NEVER be returned: one bad credential poisons the whole
 * Anthropic MCP attachment (the API 400s the entire request, naming no server),
 * so an expired token with nothing to refresh with reads as logged out.
 */
async function tokenIn(cfg: SlackOAuthApp, slot: string): Promise<string | null> {
  const raw = await cfg.kv.get(slot);
  if (!raw) return null;
  let stored: StoredToken;
  try {
    stored = JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
  if (!stored.expires_at || stored.expires_at - Date.now() >= REFRESH_MARGIN_MS) {
    return stored.access_token ?? null;
  }
  if (!stored.refresh_token) return null;
  try {
    const next = await exchange(cfg, {
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
    });
    // A rotating server may re-send neither; the slot must keep both, or the
    // next refresh has nothing to present and the slot loses its owner.
    next.refresh_token ??= stored.refresh_token;
    next.identity ??= stored.identity;
    await cfg.kv.put(slot, JSON.stringify(next));
    return next.access_token;
  } catch {
    return null; // drop to the fallback rather than 500
  }
}

/**
 * The credential a Slack read should run on (ADR-020): the requester's OWN
 * token when they have consented at /oauth/slack/start (`own: true` — it carries
 * exactly their Slack visibility, DMs included, and the CALLER owns the surface
 * gate that keeps it inside their own bot DM), else the legacy workspace token
 * (`own: false` — the caller must keep the hard visibility firewall). Null when
 * the OAuth path is not set up or nothing is stored.
 *
 * `own: true` is also the answer to "has this person connected their own Slack
 * history?", which is what drives the first-contact onboarding nudge.
 *
 * @param userId - the requester; ignored unless it is a Slack user id, so a
 *   caller cannot turn an arbitrary string into a KV key.
 */
export async function getSlackAccessTokenFor(
  env: Env,
  userId?: string,
): Promise<{ token: string; own: boolean } | null> {
  const cfg = app(env);
  if (!cfg) return null;
  const identity = slackUserId(userId);
  if (identity) {
    const own = await tokenIn(cfg, slotFor(identity));
    if (own) return { token: own, own: true };
  }
  const legacy = await tokenIn(cfg, LEGACY_SLOT);
  return legacy ? { token: legacy, own: false } : null;
}

/** The user-facing consent URL, derived from the configured redirect. Null when
 *  the OAuth path is not set up. */
export function slackConnectUrl(env: Env): string | null {
  if (!env.SLACK_OAUTH_REDIRECT_URI) return null;
  try {
    return `${new URL(env.SLACK_OAUTH_REDIRECT_URI).origin}/oauth/slack/start`;
  } catch {
    return null;
  }
}
