// The first assertions over the Slack OAuth token path.
//
// Until now this module was 535 lines of client secrets, PKCE, refresh and
// per-user token slots with no test at all, while ADR-020 rested entirely on
// two of its sentences: tokens are keyed by the consenting identity, and the
// legacy workspace slot is BOOTSTRAPPED by the first-ever consent and never
// overwritten by a later one. Those two sentences are asserted here, so that
// the module they describe can be reshaped without the behaviour drifting.
//
// NO REAL CREDENTIALS. Every value below is an obvious fake — `fake-client-id`,
// `not-a-real-secret`, `xoxp-not-a-real-token`. Nothing here reaches slack.com:
// the stub dispatcher throws on an unrouted call, so a request that escaped the
// routing table would fail the test rather than leave the machine.
//
// HOW THE FETCH IS INJECTED. `net.ts` captures the real `fetch` at module
// evaluation and routes every outbound call through it (ADR-022), so the seam
// is module LOAD order: the stub goes onto `globalThis` at the top of this
// file, and the module under test is imported lazily inside each test, which is
// what evaluates `net.ts` against the stub.
import { test } from "node:test";
import assert from "node:assert/strict";

// ─── Fakes. Nothing here may resemble a real credential. ────────────────────
const CLIENT_ID = "fake-client-id";
const CLIENT_SECRET = "fake-not-a-real-secret";
const REDIRECT_URI = "https://worker.example.invalid/oauth/slack/callback";
const USER_A = "UFAKEAAA111";
const USER_B = "UFAKEBBB222";
const TOKEN_A = "xoxp-not-a-real-token-a";
const TOKEN_B = "xoxp-not-a-real-token-b";
const REFRESHED = "xoxp-not-a-real-token-refreshed";

// ─── Stub fetch: one dispatcher, installed once, swappable routes ────────────
//
// It has to be one: `net.ts` binds the real fetch at ITS first evaluation and
// nothing re-evaluates it, so a second stub installed later would never be
// reached. Per-test isolation comes from swapping the routes, not re-installing.
interface Call {
  url: string;
  form: Record<string, string>;
  headers: Record<string, string>;
}
type Reply = { status?: number; body: unknown };
type Routes = Record<string, Reply>;

let routes: Routes = {};
let calls: Call[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const raw = typeof init?.body === "string" ? init.body : "";
  const form: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw)) form[k] = v;
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
    headers[k.toLowerCase()] = v;
  }
  calls.push({ url, form, headers });
  const key = Object.keys(routes).find((k) => url.includes(k));
  // An unrouted call is a FAILED test, never a default reply: "no token
  // request happened" is the assertion in several of these, and a permissive
  // stub would let one slip past unnoticed.
  if (!key) throw new Error(`no stub route for ${url}`);
  const reply = routes[key]!;
  return new Response(JSON.stringify(reply.body), {
    status: reply.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

function serve(next: Routes): void {
  routes = next;
  calls = [];
}

const TOKEN_URL = "slack.com/api/oauth.v2.user.access";
const AUTH_TEST_URL = "slack.com/api/auth.test";

/** Slack's non-standard success body: the user token hides in authed_user. */
function slackTokenBody(
  fields: { id?: string; access_token: string; refresh_token?: string; expires_in?: number },
): Record<string, unknown> {
  const { id, ...rest } = fields;
  return { ok: true, authed_user: id === undefined ? rest : { id, ...rest } };
}

// ─── Fake KV: an in-memory Map, and a log of the keys that were read ────────
//
// The KV namespace is a named dependency of the module, which is what makes the
// callback path testable with no Worker in sight.
interface FakeKv {
  store: Map<string, string>;
  reads: string[];
  ns: KVNamespace;
}
function fakeKv(): FakeKv {
  const store = new Map<string, string>();
  const reads: string[] = [];
  const ns = {
    get: async (key: string) => {
      reads.push(key);
      return store.get(key) ?? null;
    },
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  } as unknown as KVNamespace;
  return { store, reads, ns };
}

type Env = import("../src/types").Env;

function env(kv: FakeKv | null, overrides: Partial<Record<string, unknown>> = {}): Env {
  return {
    SLACK_MCP_CLIENT_ID: CLIENT_ID,
    SLACK_MCP_CLIENT_SECRET: CLIENT_SECRET,
    SLACK_OAUTH_REDIRECT_URI: REDIRECT_URI,
    SLACK_OAUTH_KV: kv?.ns,
    ...overrides,
  } as unknown as Env;
}

function oauth(): Promise<typeof import("../src/oauth/slack")> {
  return import("../src/oauth/slack.js");
}

const LEGACY_KEY = "slack_oauth_token";
const userKey = (id: string) => `slack_oauth_token:user:${id}`;

/** Drive one consent end to end and return the callback's Response. */
async function consent(
  kv: FakeKv,
  tokenReply: Reply,
  opts: { authTest?: Reply } = {},
): Promise<Response> {
  const { startSlackOAuth, handleSlackOAuthCallback } = await oauth();
  serve({});
  const start = await startSlackOAuth(env(kv));
  const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
  serve(
    opts.authTest ? { [TOKEN_URL]: tokenReply, [AUTH_TEST_URL]: opts.authTest } : { [TOKEN_URL]: tokenReply },
  );
  return handleSlackOAuthCallback(
    new Request(`${REDIRECT_URI}?code=fake-authorization-code&state=${state}`),
    env(kv),
  );
}

// ─── Start: PKCE, and no secret on the wire to the browser ──────────────────

test("start redirects to Slack consent with an S256 PKCE challenge, and no secret in the URL", async () => {
  const kv = fakeKv();
  serve({});
  const { startSlackOAuth } = await oauth();
  const res = await startSlackOAuth(env(kv));

  assert.equal(res.status, 302);
  const u = new URL(res.headers.get("location")!);
  assert.equal(u.origin + u.pathname, "https://slack.com/oauth/v2_user/authorize");
  assert.equal(u.searchParams.get("response_type"), "code");
  assert.equal(u.searchParams.get("client_id"), CLIENT_ID);
  assert.equal(u.searchParams.get("redirect_uri"), REDIRECT_URI);
  assert.equal(u.searchParams.get("code_challenge_method"), "S256");
  assert.ok(u.searchParams.get("code_challenge"));
  assert.ok(u.searchParams.get("scope")?.includes("search:read"));
  // The consent URL is handed to a browser. The client secret and the verifier
  // must never be on it — only the derived challenge.
  assert.equal(u.toString().includes(CLIENT_SECRET), false);

  // The verifier is parked under the state, never sent, and is not the state.
  const state = u.searchParams.get("state")!;
  const verifier = kv.store.get(`slack_oauth_pkce:${state}`);
  assert.ok(verifier);
  assert.notEqual(verifier, state);
  assert.equal(u.toString().includes(verifier!), false);
  // Registration is static: starting consent talks to nobody.
  assert.deepEqual(calls, []);
});

test("start says so when the OAuth path is not configured, and asks for nothing", async () => {
  serve({});
  const { startSlackOAuth } = await oauth();
  const res = await startSlackOAuth(env(null, { SLACK_MCP_CLIENT_SECRET: undefined }));
  assert.equal(res.status, 500);
  assert.match(await res.text(), /not configured/);
  assert.deepEqual(calls, []);
});

// ─── Callback: the code exchange, and the two token slots ───────────────────

test("the callback exchanges the code with the verifier and the static client secret", async () => {
  const kv = fakeKv();
  const res = await consent(kv, {
    body: slackTokenBody({ id: USER_A, access_token: TOKEN_A, refresh_token: "xoxr-fake-a", expires_in: 43200 }),
  });

  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  const [call] = calls;
  assert.ok(call!.url.includes(TOKEN_URL));
  assert.equal(call!.form.grant_type, "authorization_code");
  assert.equal(call!.form.code, "fake-authorization-code");
  assert.equal(call!.form.redirect_uri, REDIRECT_URI);
  assert.ok(call!.form.code_verifier, "the parked verifier travels with the code");
  // client_secret_post: credentials in the body, never a Basic header.
  assert.equal(call!.form.client_id, CLIENT_ID);
  assert.equal(call!.form.client_secret, CLIENT_SECRET);
  assert.equal(call!.headers.authorization, undefined);

  // The state is single-use: the verifier is gone once spent.
  const parked = [...kv.store.keys()].filter((k) => k.startsWith("slack_oauth_pkce:"));
  assert.deepEqual(parked, []);
});

test("consent keys the token by the consenting identity (ADR-020)", async () => {
  const kv = fakeKv();
  await consent(kv, { body: slackTokenBody({ id: USER_A, access_token: TOKEN_A }) });

  const own = JSON.parse(kv.store.get(userKey(USER_A))!) as { access_token: string; identity: string };
  assert.equal(own.access_token, TOKEN_A);
  assert.equal(own.identity, USER_A);
});

test("the legacy workspace slot is bootstrapped by the first consent and never overwritten", async () => {
  const kv = fakeKv();

  await consent(kv, { body: slackTokenBody({ id: USER_A, access_token: TOKEN_A }) });
  const bootstrapped = JSON.parse(kv.store.get(LEGACY_KEY)!) as { access_token: string };
  assert.equal(bootstrapped.access_token, TOKEN_A, "first-ever consent bootstraps the legacy slot");

  await consent(kv, { body: slackTokenBody({ id: USER_B, access_token: TOKEN_B }) });
  // The second user gets their own slot…
  const second = JSON.parse(kv.store.get(userKey(USER_B))!) as { access_token: string };
  assert.equal(second.access_token, TOKEN_B);
  // …and the legacy slot still holds the first consent. A later consent must
  // not swap whose visibility powers the filtered workspace fallback.
  const legacy = JSON.parse(kv.store.get(LEGACY_KEY)!) as { access_token: string; identity: string };
  assert.equal(legacy.access_token, TOKEN_A);
  assert.equal(legacy.identity, USER_A);
});

test("an identity-less consent resolves the owner through auth.test", async () => {
  const kv = fakeKv();
  // Observed live (2026-07-16): oauth.v2.user.access omits authed_user.id.
  await consent(
    kv,
    { body: slackTokenBody({ access_token: TOKEN_A }) },
    { authTest: { body: { ok: true, user_id: USER_A } } },
  );

  assert.ok(kv.store.has(userKey(USER_A)));
  const authTestCall = calls.find((c) => c.url.includes(AUTH_TEST_URL));
  assert.ok(authTestCall, "the owner is resolved, not guessed");
});

test("a user id that is not Slack-shaped never becomes part of a KV key", async () => {
  const kv = fakeKv();
  // Lowercase, punctuation, a path traversal, a blank — none of these may reach
  // a key. The token still lands in the legacy slot, identity-less.
  await consent(
    kv,
    { body: slackTokenBody({ id: "u-not-a-slack-id/../evil", access_token: TOKEN_A }) },
    { authTest: { body: { ok: true, user_id: "still not a slack id" } } },
  );

  const keys = [...kv.store.keys()];
  assert.deepEqual(keys.filter((k) => k.startsWith(`${LEGACY_KEY}:user:`)), []);
  assert.equal(keys.some((k) => k.includes("evil") || k.includes("still not")), false);
  assert.ok(keys.includes(LEGACY_KEY));
  const legacy = JSON.parse(kv.store.get(LEGACY_KEY)!) as { identity?: string };
  assert.equal(legacy.identity, undefined);
});

test("a failed auth.test leaves an identity-less token in the legacy slot rather than failing consent", async () => {
  const kv = fakeKv();
  const res = await consent(
    kv,
    { body: slackTokenBody({ access_token: TOKEN_A }) },
    { authTest: { body: { ok: false, error: "invalid_auth" } } },
  );
  assert.equal(res.status, 200);
  assert.ok(kv.store.has(LEGACY_KEY));
});

test("Slack's HTTP-200 failure body fails the callback", async () => {
  const kv = fakeKv();
  // Slack answers 200 even when the exchange failed, so status is no signal.
  const res = await consent(kv, { body: { ok: false, error: "invalid_code" } });
  assert.equal(res.status, 502);
  assert.match(await res.text(), /invalid_code/);
  assert.equal(kv.store.size, 0, "nothing is stored when the exchange failed");
});

test("the callback refuses an unknown or expired state without exchanging anything", async () => {
  const kv = fakeKv();
  serve({});
  const { handleSlackOAuthCallback } = await oauth();
  const res = await handleSlackOAuthCallback(
    new Request(`${REDIRECT_URI}?code=fake-authorization-code&state=never-parked`),
    env(kv),
  );
  assert.equal(res.status, 400);
  assert.deepEqual(calls, []);
});

test("the callback reports Slack's own error without exchanging anything", async () => {
  const kv = fakeKv();
  serve({});
  const { handleSlackOAuthCallback } = await oauth();
  const res = await handleSlackOAuthCallback(
    new Request(`${REDIRECT_URI}?error=access_denied&error_description=user+said+no`),
    env(kv),
  );
  assert.equal(res.status, 400);
  assert.match(await res.text(), /access_denied/);
  assert.deepEqual(calls, []);
});

// ─── Reading a credential: requester-scoped, with the legacy fallback ───────

async function seed(kv: FakeKv, key: string, token: Record<string, unknown>): Promise<void> {
  kv.store.set(key, JSON.stringify(token));
}

test("a connected requester reads their own token, marked own", async () => {
  const kv = fakeKv();
  await seed(kv, userKey(USER_A), { access_token: TOKEN_A, identity: USER_A });
  await seed(kv, LEGACY_KEY, { access_token: TOKEN_B });
  serve({});
  const { getSlackAccessTokenFor } = await oauth();

  assert.deepEqual(await getSlackAccessTokenFor(env(kv), USER_A), { token: TOKEN_A, own: true });
});

test("an unconnected requester falls back to the legacy workspace token, marked not own", async () => {
  const kv = fakeKv();
  await seed(kv, LEGACY_KEY, { access_token: TOKEN_B });
  serve({});
  const { getSlackAccessTokenFor } = await oauth();

  assert.deepEqual(await getSlackAccessTokenFor(env(kv), USER_A), { token: TOKEN_B, own: false });
  assert.deepEqual(await getSlackAccessTokenFor(env(kv)), { token: TOKEN_B, own: false });
});

test("a requester id that is not Slack-shaped is never read as a key", async () => {
  const kv = fakeKv();
  await seed(kv, LEGACY_KEY, { access_token: TOKEN_B });
  serve({});
  const { getSlackAccessTokenFor } = await oauth();

  const got = await getSlackAccessTokenFor(env(kv), "u-not-a-slack-id/../evil");
  assert.deepEqual(got, { token: TOKEN_B, own: false });
  assert.deepEqual(kv.reads, [LEGACY_KEY], "the rejected id produced no per-user lookup at all");
});

test("nothing stored means no credential, not an error", async () => {
  const kv = fakeKv();
  serve({});
  const { getSlackAccessTokenFor } = await oauth();
  assert.equal(await getSlackAccessTokenFor(env(kv), USER_A), null);
});

test("an unconfigured OAuth path yields no credential and no connect URL", async () => {
  serve({});
  const { getSlackAccessTokenFor, slackConnectUrl } = await oauth();
  assert.equal(await getSlackAccessTokenFor(env(null), USER_A), null);
  assert.equal(slackConnectUrl(env(null, { SLACK_OAUTH_REDIRECT_URI: undefined })), null);
  assert.equal(slackConnectUrl(env(null, { SLACK_OAUTH_REDIRECT_URI: "not a url" })), null);
});

test("the connect URL is the consent entry point on the redirect's own origin", async () => {
  serve({});
  const { slackConnectUrl } = await oauth();
  assert.equal(slackConnectUrl(env(null)), "https://worker.example.invalid/oauth/slack/start");
});

// ─── Refresh: before expiry, keyed, and never a stale token ─────────────────

test("a token near expiry is refreshed, and the refreshed token is written back to its own slot", async () => {
  const kv = fakeKv();
  await seed(kv, userKey(USER_A), {
    access_token: TOKEN_A,
    refresh_token: "xoxr-fake-a",
    identity: USER_A,
    expires_at: Date.now() + 30_000, // inside the 60s pre-expiry window
  });
  // Slack's refresh response may omit both the rotated refresh token and the id.
  serve({ [TOKEN_URL]: { body: slackTokenBody({ access_token: REFRESHED, expires_in: 43200 }) } });
  const { getSlackAccessTokenFor } = await oauth();

  assert.deepEqual(await getSlackAccessTokenFor(env(kv), USER_A), { token: REFRESHED, own: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.form.grant_type, "refresh_token");
  assert.equal(calls[0]!.form.refresh_token, "xoxr-fake-a");

  const stored = JSON.parse(kv.store.get(userKey(USER_A))!) as Record<string, unknown>;
  assert.equal(stored.access_token, REFRESHED);
  assert.equal(stored.refresh_token, "xoxr-fake-a", "a refresh token the server did not re-send is carried over");
  assert.equal(stored.identity, USER_A, "the slot stays keyed to its owner across a refresh");
});

test("a token comfortably inside its lifetime is used as it is", async () => {
  const kv = fakeKv();
  await seed(kv, userKey(USER_A), {
    access_token: TOKEN_A,
    refresh_token: "xoxr-fake-a",
    identity: USER_A,
    expires_at: Date.now() + 3_600_000,
  });
  serve({});
  const { getSlackAccessTokenFor } = await oauth();

  assert.deepEqual(await getSlackAccessTokenFor(env(kv), USER_A), { token: TOKEN_A, own: true });
  assert.deepEqual(calls, [], "no refresh is attempted before it is due");
});

test("a token with no expiry never expires", async () => {
  const kv = fakeKv();
  await seed(kv, LEGACY_KEY, { access_token: TOKEN_B });
  serve({});
  const { getSlackAccessTokenFor } = await oauth();
  assert.deepEqual(await getSlackAccessTokenFor(env(kv)), { token: TOKEN_B, own: false });
  assert.deepEqual(calls, []);
});

test("an expired token with nothing to refresh with reads as logged out, never as itself", async () => {
  const kv = fakeKv();
  await seed(kv, userKey(USER_A), { access_token: TOKEN_A, identity: USER_A, expires_at: Date.now() - 1 });
  await seed(kv, LEGACY_KEY, { access_token: TOKEN_B });
  serve({});
  const { getSlackAccessTokenFor } = await oauth();

  // A stale token must NEVER be returned: one bad credential 400s the whole
  // Anthropic MCP attachment. The requester drops to the legacy slot instead.
  assert.deepEqual(await getSlackAccessTokenFor(env(kv), USER_A), { token: TOKEN_B, own: false });
});

test("a refresh that fails drops to the fallback rather than throwing", async () => {
  const kv = fakeKv();
  await seed(kv, userKey(USER_A), {
    access_token: TOKEN_A,
    refresh_token: "xoxr-fake-a",
    identity: USER_A,
    expires_at: Date.now() + 30_000,
  });
  await seed(kv, LEGACY_KEY, { access_token: TOKEN_B });
  serve({ [TOKEN_URL]: { body: { ok: false, error: "invalid_refresh_token" } } });
  const { getSlackAccessTokenFor } = await oauth();

  assert.deepEqual(await getSlackAccessTokenFor(env(kv), USER_A), { token: TOKEN_B, own: false });
});

test("an unparseable stored slot reads as no credential", async () => {
  const kv = fakeKv();
  kv.store.set(userKey(USER_A), "{not json");
  serve({});
  const { getSlackAccessTokenFor } = await oauth();
  assert.equal(await getSlackAccessTokenFor(env(kv), USER_A), null);
});
